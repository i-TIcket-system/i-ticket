/**
 * Seed Future Trips for ALL Companies
 *
 * Creates future trips (today + next 30 days) for every active company.
 * First ensures each company has required staff (driver, conductor) and vehicles.
 *
 * RULES COMPLIANCE:
 * - RULE-001: Each trip belongs to its own company (companyId)
 * - RULE-003: All trips start as SCHEDULED status
 * - RULE-005: 24-hour resource allocation (same driver/conductor/vehicle not within 24hrs)
 * - RULE-021: Uses correct schema field names
 *
 * MANDATORY FIELDS (from validations.ts):
 * - origin: min 2 chars
 * - destination: min 2 chars, different from origin
 * - departureTime: must be in future
 * - estimatedDuration: 30-2880 minutes
 * - distance: positive int, max 5000
 * - price: positive, max 100000
 * - busType: min 2 chars
 * - totalSlots: positive int, max 100
 * - driverId: REQUIRED
 * - conductorId: REQUIRED
 * - vehicleId: REQUIRED
 *
 * Run: npx tsx scripts/seed-future-trips.ts
 */

import prisma from '../src/lib/db'
import { hash } from 'bcryptjs'

// Ethiopian cities for routes
const ROUTES = [
  { origin: 'Addis Ababa', destination: 'Bahir Dar', distance: 510, duration: 540 },
  { origin: 'Addis Ababa', destination: 'Gondar', distance: 740, duration: 720 },
  { origin: 'Addis Ababa', destination: 'Mekelle', distance: 780, duration: 780 },
  { origin: 'Addis Ababa', destination: 'Hawassa', distance: 275, duration: 270 },
  { origin: 'Addis Ababa', destination: 'Dire Dawa', distance: 515, duration: 480 },
  { origin: 'Addis Ababa', destination: 'Jimma', distance: 350, duration: 360 },
  { origin: 'Addis Ababa', destination: 'Dessie', distance: 400, duration: 420 },
  { origin: 'Bahir Dar', destination: 'Gondar', distance: 180, duration: 180 },
  { origin: 'Bahir Dar', destination: 'Addis Ababa', distance: 510, duration: 540 },
  { origin: 'Mekelle', destination: 'Addis Ababa', distance: 780, duration: 780 },
  { origin: 'Hawassa', destination: 'Addis Ababa', distance: 275, duration: 270 },
]

const BUS_TYPES = ['STANDARD', 'LUXURY', 'MINI'] as const
const DEPARTURE_TIMES = ['05:00', '06:00', '07:00', '08:00', '10:00', '14:00', '16:00']

// Test staff names
const DRIVER_NAMES = ['Abebe Kebede', 'Tesfaye Haile', 'Girma Tadesse', 'Dawit Mekonnen', 'Solomon Bekele']
const CONDUCTOR_NAMES = ['Marta Gebre', 'Tigist Alemu', 'Hanna Worku', 'Sara Tesfaye', 'Ruth Bekele']

function getRandomElement<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getRandomPrice(busType: string): number {
  const basePrices: Record<string, number> = {
    'MINI': 800,
    'STANDARD': 1200,
    'LUXURY': 2000,
  }
  const base = basePrices[busType] || 1000
  // Price must be positive and max 100000
  return Math.min(base + Math.floor(Math.random() * 500), 100000)
}

function getTotalSlots(busType: string): number {
  // Based on vehicle validation ranges
  const slots: Record<string, number> = {
    'MINI': 15,      // 4-20 range
    'STANDARD': 45,  // 20-50 range
    'LUXURY': 40,    // 30-60 range
  }
  return slots[busType] || 45
}

// Generate unique Ethiopian phone number for test staff
function generatePhone(companyIndex: number, staffIndex: number, isDriver: boolean): string {
  // Format: 09XXXXXXXX - ensure unique by encoding company and staff index
  const prefix = isDriver ? '91' : '92'
  const suffix = String(companyIndex * 100 + staffIndex).padStart(7, '0')
  return `0${prefix}${suffix}`
}

async function main() {
  console.log('🌱 Seeding Future Trips for ALL Companies\n')
  console.log('=' .repeat(60))

  // Step 1: Get all active companies with their resources
  const companies = await prisma.company.findMany({
    where: { isActive: true },
    include: {
      users: {
        where: {
          staffRole: { in: ['DRIVER', 'CONDUCTOR'] }
        },
        select: { id: true, staffRole: true, name: true }
      },
      vehicles: {
        where: { status: 'ACTIVE' },
        select: { id: true, plateNumber: true, busType: true, totalSeats: true }
      }
    }
  })

  if (companies.length === 0) {
    console.log('❌ No active companies found!')
    return
  }

  console.log(`\n📊 Found ${companies.length} active companies:\n`)

  // Step 2: Check and create missing resources for each company
  const hashedPassword = await hash('Test123!', 12)
  let totalDriversCreated = 0
  let totalConductorsCreated = 0
  let totalVehiclesCreated = 0

  for (let companyIndex = 0; companyIndex < companies.length; companyIndex++) {
    const company = companies[companyIndex]
    const drivers = company.users.filter(u => u.staffRole === 'DRIVER')
    const conductors = company.users.filter(u => u.staffRole === 'CONDUCTOR')
    const vehicles = company.vehicles

    console.log(`\n🏢 ${company.name}`)
    console.log(`   Current: ${drivers.length} drivers, ${conductors.length} conductors, ${vehicles.length} vehicles`)

    // Create missing drivers (need at least 2 for rotation)
    const neededDrivers = Math.max(0, 2 - drivers.length)
    if (neededDrivers > 0) {
      console.log(`   ➕ Creating ${neededDrivers} test driver(s)...`)
      for (let i = 0; i < neededDrivers; i++) {
        const name = DRIVER_NAMES[(drivers.length + i) % DRIVER_NAMES.length]
        const phone = generatePhone(companyIndex, drivers.length + i, true)

        try {
          const driver = await prisma.user.create({
            data: {
              name: `${name} (Test)`,
              phone,
              password: hashedPassword,
              role: 'COMPANY_ADMIN',
              company: { connect: { id: company.id } },
              staffRole: 'DRIVER',
              staffStatus: 'AVAILABLE',
              licenseNumber: `DL-${company.id.slice(-4)}-${i + 1}`,
            }
          })
          drivers.push({ id: driver.id, staffRole: 'DRIVER', name: driver.name })
          totalDriversCreated++
        } catch (e: any) {
          if (e.code === 'P2002') {
            console.log(`      ⚠️ Phone ${phone} already exists, skipping`)
          } else {
            throw e
          }
        }
      }
    }

    // Create missing conductors (need at least 2 for rotation)
    const neededConductors = Math.max(0, 2 - conductors.length)
    if (neededConductors > 0) {
      console.log(`   ➕ Creating ${neededConductors} test conductor(s)...`)
      for (let i = 0; i < neededConductors; i++) {
        const name = CONDUCTOR_NAMES[(conductors.length + i) % CONDUCTOR_NAMES.length]
        const phone = generatePhone(companyIndex, conductors.length + i, false)

        try {
          const conductor = await prisma.user.create({
            data: {
              name: `${name} (Test)`,
              phone,
              password: hashedPassword,
              role: 'COMPANY_ADMIN',
              company: { connect: { id: company.id } },
              staffRole: 'CONDUCTOR',
              staffStatus: 'AVAILABLE',
            }
          })
          conductors.push({ id: conductor.id, staffRole: 'CONDUCTOR', name: conductor.name })
          totalConductorsCreated++
        } catch (e: any) {
          if (e.code === 'P2002') {
            console.log(`      ⚠️ Phone ${phone} already exists, skipping`)
          } else {
            throw e
          }
        }
      }
    }

    // Create missing vehicles (need at least 2 for rotation)
    const neededVehicles = Math.max(0, 2 - vehicles.length)
    if (neededVehicles > 0) {
      console.log(`   ➕ Creating ${neededVehicles} test vehicle(s)...`)
      for (let i = 0; i < neededVehicles; i++) {
        const busType = BUS_TYPES[i % BUS_TYPES.length]
        const plateNumber = `3-${company.id.slice(-4)}${vehicles.length + i + 1}`
        const sideNumber = `${company.name.slice(0, 2).toUpperCase()}-${vehicles.length + i + 1}`

        try {
          const vehicle = await prisma.vehicle.create({
            data: {
              company: { connect: { id: company.id } },
              plateNumber,
              sideNumber,
              make: 'Test Bus',
              model: busType === 'LUXURY' ? 'Luxury Coach' : busType === 'MINI' ? 'Minibus' : 'Standard Coach',
              year: 2020,
              busType,
              totalSeats: getTotalSlots(busType),
              status: 'ACTIVE',
            }
          })
          vehicles.push({
            id: vehicle.id,
            plateNumber: vehicle.plateNumber,
            busType: vehicle.busType,
            totalSeats: vehicle.totalSeats
          })
          totalVehiclesCreated++
        } catch (e: any) {
          if (e.code === 'P2002') {
            console.log(`      ⚠️ Plate ${plateNumber} already exists, skipping`)
          } else {
            throw e
          }
        }
      }
    }

    // Update company object with new resources
    company.users = [...drivers, ...conductors] as any
    company.vehicles = vehicles as any

    console.log(`   ✅ Now has: ${drivers.length} drivers, ${conductors.length} conductors, ${vehicles.length} vehicles`)
  }

  console.log('\n' + '=' .repeat(60))
  console.log(`📦 Resources created: ${totalDriversCreated} drivers, ${totalConductorsCreated} conductors, ${totalVehiclesCreated} vehicles`)
  console.log('=' .repeat(60))

  // Step 3: Create trips for each company
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let totalTripsCreated = 0

  for (const company of companies) {
    console.log(`\n🚌 Creating trips for ${company.name}...`)

    const drivers = company.users.filter((u: any) => u.staffRole === 'DRIVER')
    const conductors = company.users.filter((u: any) => u.staffRole === 'CONDUCTOR')
    const vehicles = company.vehicles

    // Skip if still missing resources (shouldn't happen after above)
    if (drivers.length === 0 || conductors.length === 0 || vehicles.length === 0) {
      console.log(`   ⚠️ Still missing resources, skipping`)
      continue
    }

    // Track resource usage per day to respect 24-hour rule (RULE-005)
    // Key: "resourceId-YYYY-MM-DD", Value: true
    const resourceUsageByDay = new Map<string, boolean>()

    const tripsToCreate = []

    // Create trips for next 30 days
    for (let dayOffset = 0; dayOffset <= 30; dayOffset++) {
      const tripDate = new Date(today)
      tripDate.setDate(tripDate.getDate() + dayOffset)
      const dateKey = tripDate.toISOString().split('T')[0]

      // Reset daily usage tracking for new day
      // (We allow 1 trip per resource per day to satisfy 24hr rule)

      // Create 2 trips per day per company (to stay within resource limits)
      const tripsPerDay = Math.min(2, drivers.length, conductors.length, vehicles.length)

      for (let i = 0; i < tripsPerDay; i++) {
        const route = getRandomElement(ROUTES)
        const busType = vehicles[i % vehicles.length].busType || 'STANDARD'
        const departureTime = DEPARTURE_TIMES[i % DEPARTURE_TIMES.length]
        const [hours, minutes] = departureTime.split(':').map(Number)

        const departureDateTime = new Date(tripDate)
        departureDateTime.setHours(hours, minutes, 0, 0)

        // Skip if departure time is in the past
        if (departureDateTime <= new Date()) {
          continue
        }

        // Select resources using rotation to avoid conflicts
        const driver = drivers[i % drivers.length]
        const conductor = conductors[i % conductors.length]
        const vehicle = vehicles[i % vehicles.length]

        // Check 24-hour resource usage (simplified: 1 trip per resource per day)
        const driverKey = `${driver.id}-${dateKey}`
        const conductorKey = `${conductor.id}-${dateKey}`
        const vehicleKey = `${vehicle.id}-${dateKey}`

        if (resourceUsageByDay.has(driverKey) ||
            resourceUsageByDay.has(conductorKey) ||
            resourceUsageByDay.has(vehicleKey)) {
          // Resource already used today, skip to avoid 24hr conflict
          continue
        }

        // Mark resources as used for this day
        resourceUsageByDay.set(driverKey, true)
        resourceUsageByDay.set(conductorKey, true)
        resourceUsageByDay.set(vehicleKey, true)

        const totalSlots = vehicle.totalSeats || getTotalSlots(busType)
        const price = getRandomPrice(busType)

        // Validate all mandatory fields before adding
        if (!route.origin || route.origin.length < 2) continue
        if (!route.destination || route.destination.length < 2) continue
        if (route.origin === route.destination) continue
        if (route.duration < 30 || route.duration > 2880) continue
        if (route.distance <= 0 || route.distance > 5000) continue
        if (price <= 0 || price > 100000) continue
        if (totalSlots <= 0 || totalSlots > 100) continue

        tripsToCreate.push({
          companyId: company.id,
          origin: route.origin,
          destination: route.destination,
          departureTime: departureDateTime,
          estimatedDuration: route.duration, // in MINUTES per schema
          distance: route.distance,
          price: price,
          busType: busType,
          totalSlots: totalSlots,
          availableSlots: totalSlots, // Start with all slots available
          status: 'SCHEDULED',
          isActive: true,
          bookingHalted: false,
          // MANDATORY: driver, conductor, vehicle
          driverId: driver.id,
          conductorId: conductor.id,
          vehicleId: vehicle.id,
        })
      }
    }

    // Batch create trips
    if (tripsToCreate.length > 0) {
      const created = await prisma.trip.createMany({
        data: tripsToCreate,
        skipDuplicates: true,
      })
      console.log(`   ✅ Created ${created.count} trips`)
      totalTripsCreated += created.count
    } else {
      console.log(`   ⚠️ No trips to create (all in the past or conflicts)`)
    }
  }

  // Summary
  console.log('\n' + '=' .repeat(60))
  console.log('✅ SEED COMPLETE!\n')
  console.log(`📊 Summary:`)
  console.log(`   - Companies processed: ${companies.length}`)
  console.log(`   - Test drivers created: ${totalDriversCreated}`)
  console.log(`   - Test conductors created: ${totalConductorsCreated}`)
  console.log(`   - Test vehicles created: ${totalVehiclesCreated}`)
  console.log(`   - Total trips created: ${totalTripsCreated}`)
  console.log(`   - Date range: Today to +30 days`)
  console.log('\n🎯 All trips have:')
  console.log('   ✓ Valid origin/destination (min 2 chars, different)')
  console.log('   ✓ Future departure time')
  console.log('   ✓ Duration 30-2880 minutes')
  console.log('   ✓ Distance 1-5000 km')
  console.log('   ✓ Price 1-100000 ETB')
  console.log('   ✓ Slots 1-100')
  console.log('   ✓ Assigned driver (REQUIRED)')
  console.log('   ✓ Assigned conductor (REQUIRED)')
  console.log('   ✓ Assigned vehicle (REQUIRED)')
  console.log('   ✓ 24-hour resource allocation respected')
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

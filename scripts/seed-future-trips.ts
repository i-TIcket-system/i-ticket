/**
 * Seed Future Trips for ALL Companies
 *
 * Creates future trips (today + next 30 days) for every active company.
 * Uses existing staff and vehicles if available.
 *
 * RULES COMPLIANCE:
 * - RULE-001: Each trip belongs to its own company (companyId)
 * - RULE-003: All trips start as SCHEDULED status
 * - RULE-021: Uses correct schema field names
 *
 * Run on production:
 *   npx tsx scripts/seed-future-trips.ts
 */

import prisma from '../src/lib/db'

// Ethiopian cities for routes
const ROUTES = [
  { origin: 'Addis Ababa', destination: 'Bahir Dar', distance: 510, duration: 540 },
  { origin: 'Addis Ababa', destination: 'Gondar', distance: 740, duration: 720 },
  { origin: 'Addis Ababa', destination: 'Mekelle', distance: 780, duration: 780 },
  { origin: 'Addis Ababa', destination: 'Hawassa', distance: 275, duration: 270 },
  { origin: 'Addis Ababa', destination: 'Dire Dawa', distance: 515, duration: 480 },
  { origin: 'Addis Ababa', destination: 'Jimma', distance: 350, duration: 360 },
  { origin: 'Addis Ababa', destination: 'Dessie', distance: 400, duration: 420 },
  { origin: 'Addis Ababa', destination: 'Adigrat', distance: 900, duration: 840 },
  { origin: 'Bahir Dar', destination: 'Gondar', distance: 180, duration: 180 },
  { origin: 'Bahir Dar', destination: 'Addis Ababa', distance: 510, duration: 540 },
  { origin: 'Mekelle', destination: 'Addis Ababa', distance: 780, duration: 780 },
  { origin: 'Hawassa', destination: 'Addis Ababa', distance: 275, duration: 270 },
  { origin: 'Dire Dawa', destination: 'Addis Ababa', distance: 515, duration: 480 },
]

const BUS_TYPES = ['STANDARD', 'LUXURY', 'MINI']
const DEPARTURE_TIMES = ['05:00', '06:00', '07:00', '08:00', '10:00', '14:00', '16:00', '20:00']

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getRandomPrice(busType: string): number {
  const basePrices: Record<string, number> = {
    'MINI': 800,
    'STANDARD': 1200,
    'LUXURY': 2000,
  }
  const base = basePrices[busType] || 1000
  return base + Math.floor(Math.random() * 500)
}

function getRandomSlots(busType: string): number {
  const slots: Record<string, number> = {
    'MINI': 15,
    'STANDARD': 49,
    'LUXURY': 40,
  }
  return slots[busType] || 45
}

async function main() {
  console.log('🌱 Seeding Future Trips for ALL Companies\n')
  console.log('=' .repeat(60))

  // Step 1: Get all active companies
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
  for (const company of companies) {
    console.log(`   🏢 ${company.name}`)
    console.log(`      - Drivers: ${company.users.filter(u => u.staffRole === 'DRIVER').length}`)
    console.log(`      - Conductors: ${company.users.filter(u => u.staffRole === 'CONDUCTOR').length}`)
    console.log(`      - Vehicles: ${company.vehicles.length}`)
  }

  // Step 2: Create trips for each company
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let totalTripsCreated = 0

  for (const company of companies) {
    console.log(`\n🚌 Creating trips for ${company.name}...`)

    const drivers = company.users.filter(u => u.staffRole === 'DRIVER')
    const conductors = company.users.filter(u => u.staffRole === 'CONDUCTOR')
    const vehicles = company.vehicles

    // Create trips for next 30 days
    const tripsToCreate = []

    for (let dayOffset = 0; dayOffset <= 30; dayOffset++) {
      const tripDate = new Date(today)
      tripDate.setDate(tripDate.getDate() + dayOffset)

      // Create 2-4 trips per day per company
      const tripsPerDay = 2 + Math.floor(Math.random() * 3)

      for (let i = 0; i < tripsPerDay; i++) {
        const route = getRandomElement(ROUTES)
        const busType = getRandomElement(BUS_TYPES)
        const departureTime = getRandomElement(DEPARTURE_TIMES)
        const [hours, minutes] = departureTime.split(':').map(Number)

        const departureDateTime = new Date(tripDate)
        departureDateTime.setHours(hours, minutes, 0, 0)

        // Skip if departure time is in the past
        if (departureDateTime < new Date()) {
          continue
        }

        const totalSlots = getRandomSlots(busType)
        const price = getRandomPrice(busType)

        // Assign driver/conductor/vehicle if available
        const driver = drivers.length > 0 ? getRandomElement(drivers) : null
        const conductor = conductors.length > 0 ? getRandomElement(conductors) : null
        const vehicle = vehicles.length > 0 ? getRandomElement(vehicles) : null

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
          driverId: driver?.id || null,
          conductorId: conductor?.id || null,
          vehicleId: vehicle?.id || null,
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
      console.log(`   ⚠️  No trips to create (all in the past)`)
    }
  }

  // Summary
  console.log('\n' + '=' .repeat(60))
  console.log('✅ SEED COMPLETE!\n')
  console.log(`📊 Summary:`)
  console.log(`   - Companies processed: ${companies.length}`)
  console.log(`   - Total trips created: ${totalTripsCreated}`)
  console.log(`   - Date range: Today to +30 days`)
  console.log('\n🎯 You can now test:')
  console.log('   - Trip listing and filtering')
  console.log('   - Booking flow')
  console.log('   - Staff assignment')
  console.log('   - Trip management')
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

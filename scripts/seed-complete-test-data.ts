/**
 * Complete Test Data Seed Script
 *
 * Creates comprehensive test data for ALL features:
 * - Users for every role (with login credentials)
 * - Companies
 * - Vehicles (for fleet management)
 * - Trips (past, current, future - starting Jan 9, 2026)
 * - Bookings
 * - Maintenance schedules
 *
 * Run: npx tsx scripts/seed-complete-test-data.ts
 */

import prisma from '../src/lib/db'
import bcrypt from 'bcryptjs'

const BASE_DATE = new Date('2026-01-09T00:00:00Z') // Jan 9, 2026

async function main() {
  console.log('🌱 Starting Complete Test Data Seed...\n')
  console.log('📅 Base Date: January 9, 2026\n')

  // ========== STEP 1: CREATE CITIES ==========
  console.log('🏙️  Step 1: Creating Ethiopian cities...')

  const cities = [
    { name: 'Addis Ababa', region: 'Addis Ababa', latitude: 9.022, longitude: 38.7468 },
    { name: 'Dire Dawa', region: 'Dire Dawa', latitude: 9.601, longitude: 41.8661 },
    { name: 'Bahir Dar', region: 'Amhara', latitude: 11.594, longitude: 37.3903 },
    { name: 'Gondar', region: 'Amhara', latitude: 12.6, longitude: 37.4667 },
    { name: 'Mekelle', region: 'Tigray', latitude: 13.4967, longitude: 39.4753 },
    { name: 'Hawassa', region: 'Sidama', latitude: 7.062, longitude: 38.476 },
    { name: 'Jimma', region: 'Oromia', latitude: 7.6767, longitude: 36.8344 },
  ]

  for (const city of cities) {
    await prisma.city.upsert({
      where: { name: city.name },
      update: { ...city, timezone: 'Africa/Addis_Ababa' },
      create: { ...city, timezone: 'Africa/Addis_Ababa' },
    })
  }
  console.log(`   ✅ Created/updated ${cities.length} cities\n`)

  // ========== STEP 2: CREATE SUPER ADMIN ==========
  console.log('👑 Step 2: Creating Super Admin...')

  const superAdmin = await prisma.user.upsert({
    where: { phone: '0911000000' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@iticket.et',
      phone: '0911000000',
      password: await bcrypt.hash('admin123', 10),
      role: 'SUPER_ADMIN',
    },
  })
  console.log(`   ✅ Super Admin: admin@iticket.et / admin123`)
  console.log(`      ID: ${superAdmin.id}\n`)

  // ========== STEP 3: CREATE TEST COMPANIES ==========
  console.log('🏢 Step 3: Creating bus companies...')

  let company1 = await prisma.company.findFirst({
    where: { email: 'contact@skybus.et' },
  })

  if (!company1) {
    company1 = await prisma.company.create({
      data: {
        name: 'Sky Bus Ethiopia',
        email: 'contact@skybus.et',
        phones: '["0911111111"]',
        address: 'Meskel Square, Addis Ababa',
        tinNumber: 'TIN-001-2024',
        isActive: true,
        adminName: 'Abebe Kebede',
        adminPhone: '0911111100',
        adminEmail: 'manager@skybus.et',
      },
    })
    console.log(`   ✅ Created Company 1: ${company1.name} (${company1.id})`)
  } else {
    console.log(`   ✅ Using existing Company 1: ${company1.name} (${company1.id})`)
  }

  let company2 = await prisma.company.findFirst({
    where: { email: 'info@goldentransport.et' },
  })

  if (!company2) {
    company2 = await prisma.company.create({
      data: {
        name: 'Golden Transport',
        email: 'info@goldentransport.et',
        phones: '["0922222222"]',
        address: 'Bole, Addis Ababa',
        tinNumber: 'TIN-002-2024',
        isActive: true,
        adminName: 'Tigist Hailu',
        adminPhone: '0922222200',
        adminEmail: 'admin@goldentransport.et',
      },
    })
    console.log(`   ✅ Created Company 2: ${company2.name} (${company2.id})`)
  } else {
    console.log(`   ✅ Using existing Company 2: ${company2.name} (${company2.id})`)
  }
  console.log('')

  // ========== STEP 4: CREATE COMPANY ADMINS ==========
  console.log('👔 Step 4: Creating company administrators...')

  const companyAdmin1 = await prisma.user.upsert({
    where: { phone: '0911111100' },
    update: {},
    create: {
      name: 'Abebe Kebede (Sky Bus Manager)',
      email: 'manager@skybus.et',
      phone: '0911111100',
      password: await bcrypt.hash('manager123', 10),
      role: 'COMPANY_ADMIN',
      companyId: company1.id,
    },
  })
  console.log(`   ✅ Sky Bus Admin: manager@skybus.et / manager123`)

  const companyAdmin2 = await prisma.user.upsert({
    where: { phone: '0922222200' },
    update: {},
    create: {
      name: 'Tigist Hailu (Golden Transport Admin)',
      email: 'admin@goldentransport.et',
      phone: '0922222200',
      password: await bcrypt.hash('admin123', 10),
      role: 'COMPANY_ADMIN',
      companyId: company2.id,
    },
  })
  console.log(`   ✅ Golden Transport Admin: admin@goldentransport.et / admin123\n`)

  // ========== STEP 5: CREATE STAFF USERS ==========
  console.log('👨‍✈️ Step 5: Creating staff (drivers, conductors, ticketers)...')

  const driver1 = await prisma.user.upsert({
    where: { phone: '0911111101' },
    update: {},
    create: {
      name: 'Mulugeta Assefa (Driver)',
      email: 'driver1@skybus.et',
      phone: '0911111101',
      password: await bcrypt.hash('driver123', 10),
      role: 'STAFF',
      staffRole: 'DRIVER',
      companyId: company1.id,
      licenseNumber: 'DL-AA-12345',
    },
  })
  console.log(`   ✅ Driver 1: driver1@skybus.et / driver123`)

  const conductor1 = await prisma.user.upsert({
    where: { phone: '0911111102' },
    update: {},
    create: {
      name: 'Almaz Tesfaye (Conductor)',
      email: 'conductor1@skybus.et',
      phone: '0911111102',
      password: await bcrypt.hash('conductor123', 10),
      role: 'STAFF',
      staffRole: 'CONDUCTOR',
      companyId: company1.id,
      employeeId: 'EMP-001',
    },
  })
  console.log(`   ✅ Conductor 1: conductor1@skybus.et / conductor123`)

  const ticketer1 = await prisma.user.upsert({
    where: { phone: '0911111103' },
    update: {},
    create: {
      name: 'Yohannes Bekele (Cashier)',
      email: 'cashier1@skybus.et',
      phone: '0911111103',
      password: await bcrypt.hash('cashier123', 10),
      role: 'STAFF',
      staffRole: 'MANUAL_TICKETER',
      companyId: company1.id,
      employeeId: 'EMP-002',
    },
  })
  console.log(`   ✅ Cashier 1: cashier1@skybus.et / cashier123`)

  const driver2 = await prisma.user.upsert({
    where: { phone: '0922222201' },
    update: {},
    create: {
      name: 'Dawit Lemma (Driver)',
      email: 'driver2@goldentransport.et',
      phone: '0922222201',
      password: await bcrypt.hash('driver123', 10),
      role: 'STAFF',
      staffRole: 'DRIVER',
      companyId: company2.id,
      licenseNumber: 'DL-AA-67890',
    },
  })
  console.log(`   ✅ Driver 2: driver2@goldentransport.et / driver123\n`)

  // ========== STEP 6: CREATE SALES PERSON ==========
  console.log('💼 Step 6: Creating sales person...')

  const salesPerson = await prisma.salesPerson.upsert({
    where: { phone: '0933333333' },
    update: {},
    create: {
      name: 'Abel Girma',
      email: 'sales@iticket.et',
      phone: '0933333333',
      password: await bcrypt.hash('sales123', 10),
      referralCode: 'ABEL26',
      status: 'ACTIVE',
    },
  })
  console.log(`   ✅ Sales Person: sales@iticket.et / sales123`)
  console.log(`      Phone: 0933333333`)
  console.log(`      Referral Code: ABEL26\n`)

  // ========== STEP 7: CREATE CUSTOMER ==========
  console.log('👤 Step 7: Creating test customer...')

  const customer = await prisma.user.upsert({
    where: { phone: '0944444444' },
    update: {},
    create: {
      name: 'Sara Mohammed (Customer)',
      email: 'customer@example.com',
      phone: '0944444444',
      password: await bcrypt.hash('customer123', 10),
      role: 'CUSTOMER',
    },
  })
  console.log(`   ✅ Customer: customer@example.com / customer123\n`)

  // ========== STEP 8: CREATE VEHICLES ==========
  console.log('🚌 Step 8: Creating vehicles for fleet management...')

  const vehicle1 = await prisma.vehicle.upsert({
    where: { companyId_plateNumber: { companyId: company1.id, plateNumber: '3-12345' } },
    update: {},
    create: {
      companyId: company1.id,
      plateNumber: '3-12345',
      sideNumber: '101',
      make: 'Mercedes-Benz',
      model: 'Sprinter',
      year: 2022,
      busType: 'STANDARD',
      totalSeats: 49,
      status: 'ACTIVE',
      currentOdometer: 75000,
      odometerLastUpdated: new Date(),
      engineHours: 3000,
      fuelCapacity: 80,
      fuelType: 'DIESEL',
      fuelEfficiencyL100km: 28.5,
      utilizationRate: 82.0,
      registrationExpiry: new Date('2027-12-31'),
      insuranceExpiry: new Date('2026-12-31'),
    },
  })
  console.log(`   ✅ Vehicle 1: ${vehicle1.plateNumber} (${vehicle1.sideNumber}) - Mercedes Sprinter`)

  const vehicle2 = await prisma.vehicle.upsert({
    where: { companyId_plateNumber: { companyId: company1.id, plateNumber: '3-67890' } },
    update: {},
    create: {
      companyId: company1.id,
      plateNumber: '3-67890',
      sideNumber: '102',
      make: 'Isuzu',
      model: 'NPR',
      year: 2021,
      busType: 'STANDARD',
      totalSeats: 45,
      status: 'ACTIVE',
      currentOdometer: 120000,
      odometerLastUpdated: new Date(),
      engineHours: 5000,
      fuelCapacity: 70,
      fuelType: 'DIESEL',
      fuelEfficiencyL100km: 32.0,
      utilizationRate: 75.0,
      registrationExpiry: new Date('2027-06-30'),
      insuranceExpiry: new Date('2026-06-30'),
    },
  })
  console.log(`   ✅ Vehicle 2: ${vehicle2.plateNumber} (${vehicle2.sideNumber}) - Isuzu NPR`)

  const vehicle3 = await prisma.vehicle.upsert({
    where: { companyId_plateNumber: { companyId: company2.id, plateNumber: '3-11111' } },
    update: {},
    create: {
      companyId: company2.id,
      plateNumber: '3-11111',
      sideNumber: '201',
      make: 'Hino',
      model: 'RK8',
      year: 2023,
      busType: 'LUXURY',
      totalSeats: 40,
      status: 'ACTIVE',
      currentOdometer: 45000,
      odometerLastUpdated: new Date(),
      engineHours: 1800,
      fuelCapacity: 90,
      fuelType: 'DIESEL',
      fuelEfficiencyL100km: 26.0,
      utilizationRate: 88.0,
      registrationExpiry: new Date('2028-12-31'),
      insuranceExpiry: new Date('2027-12-31'),
    },
  })
  console.log(`   ✅ Vehicle 3: ${vehicle3.plateNumber} (${vehicle3.sideNumber}) - Hino RK8\n`)

  // ========== STEP 9: CREATE TRIPS (PAST, CURRENT, FUTURE) ==========
  console.log('🗓️  Step 9: Creating trips (Jan 9, 2026 onwards)...')

  const trips = [
    // PAST TRIPS (Jan 9-10, 2026 - Departed)
    {
      origin: 'Addis Ababa',
      destination: 'Bahir Dar',
      date: new Date('2026-01-09T06:00:00Z'),
      time: '06:00',
      status: 'DEPARTED',
      vehicle: vehicle1,
      driver: driver1,
      conductor: conductor1,
      label: '🕐 PAST (Jan 9 - Departed)',
    },
    {
      origin: 'Bahir Dar',
      destination: 'Addis Ababa',
      date: new Date('2026-01-09T14:00:00Z'),
      time: '14:00',
      status: 'COMPLETED',
      vehicle: vehicle1,
      driver: driver1,
      conductor: conductor1,
      label: '✅ PAST (Jan 9 - Completed)',
    },
    {
      origin: 'Addis Ababa',
      destination: 'Dire Dawa',
      date: new Date('2026-01-10T07:30:00Z'),
      time: '07:30',
      status: 'DEPARTED',
      vehicle: vehicle2,
      driver: driver1,
      conductor: conductor1,
      label: '🕐 PAST (Jan 10 - Departed)',
    },

    // CURRENT/TODAY TRIPS
    {
      origin: 'Addis Ababa',
      destination: 'Hawassa',
      date: new Date(), // Today
      time: '08:00',
      status: 'SCHEDULED',
      vehicle: vehicle1,
      driver: driver1,
      conductor: conductor1,
      label: '📅 TODAY (Scheduled)',
    },
    {
      origin: 'Addis Ababa',
      destination: 'Jimma',
      date: new Date(), // Today
      time: '15:00',
      status: 'SCHEDULED',
      vehicle: vehicle2,
      driver: driver1,
      conductor: conductor1,
      label: '📅 TODAY (Scheduled)',
    },

    // FUTURE TRIPS (Tomorrow +)
    {
      origin: 'Addis Ababa',
      destination: 'Gondar',
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      time: '06:00',
      status: 'SCHEDULED',
      vehicle: vehicle1,
      driver: driver1,
      conductor: conductor1,
      label: '🔜 TOMORROW',
    },
    {
      origin: 'Addis Ababa',
      destination: 'Mekelle',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      time: '05:00',
      status: 'SCHEDULED',
      vehicle: vehicle2,
      driver: driver1,
      conductor: conductor1,
      label: '🔜 IN 3 DAYS',
    },
    {
      origin: 'Dire Dawa',
      destination: 'Addis Ababa',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
      time: '13:00',
      status: 'SCHEDULED',
      vehicle: vehicle3,
      driver: driver2,
      conductor: null,
      label: '🔜 NEXT WEEK',
    },
    {
      origin: 'Addis Ababa',
      destination: 'Bahir Dar',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      time: '07:00',
      status: 'SCHEDULED',
      vehicle: vehicle1,
      driver: driver1,
      conductor: conductor1,
      label: '🔜 IN 2 WEEKS',
    },
  ]

  const createdTrips: any[] = []
  for (const tripData of trips) {
    const trip = await prisma.trip.create({
      data: {
        companyId: tripData.vehicle.companyId,
        vehicleId: tripData.vehicle.id,
        origin: tripData.origin,
        destination: tripData.destination,
        departureTime: tripData.date,
        price: 500 + Math.floor(Math.random() * 500),
        totalSlots: tripData.vehicle.totalSeats,
        availableSlots: tripData.vehicle.totalSeats - Math.floor(Math.random() * 10),
        busType: tripData.vehicle.busType,
        distance: 300 + Math.floor(Math.random() * 400),
        estimatedDuration: 6,
        driverId: tripData.driver.id,
        conductorId: tripData.conductor?.id || null,
        status: tripData.status,
        bookingHalted: false,
      },
    })
    createdTrips.push(trip)
    console.log(`   ✅ ${tripData.label}: ${trip.origin} → ${trip.destination}`)
  }
  console.log(`\n   📊 Total trips created: ${createdTrips.length}\n`)

  // ========== STEP 10: CREATE SAMPLE BOOKINGS ==========
  console.log('🎫 Step 10: Creating sample bookings...')

  // Create booking for first past trip
  const booking1 = await prisma.booking.create({
    data: {
      bookingCode: `BK-${Date.now().toString(36).toUpperCase().substring(0, 8)}`,
      userId: customer.id,
      tripId: createdTrips[0].id,
      totalAmount: createdTrips[0].price * 2,
      status: 'CONFIRMED',
      paymentStatus: 'COMPLETED',
    },
  })

  await prisma.passenger.createMany({
    data: [
      {
        bookingId: booking1.id,
        name: 'Sara Mohammed',
        phone: '0944444444',
        seatNumber: 1,
        nationalId: 'ID-123456',
        age: 28,
        gender: 'FEMALE',
      },
      {
        bookingId: booking1.id,
        name: 'Ahmed Ali',
        phone: '0955555555',
        seatNumber: 2,
        nationalId: 'ID-789012',
        age: 32,
        gender: 'MALE',
      },
    ],
  })

  await prisma.ticket.createMany({
    data: [
      {
        bookingId: booking1.id,
        ticketCode: `TK-${Date.now().toString(36).toUpperCase()}1`,
        qrCode: `QR-${Date.now()}1`,
        passengerName: 'Sara Mohammed',
        seatNumber: 1,
        status: 'ACTIVE',
      },
      {
        bookingId: booking1.id,
        ticketCode: `TK-${Date.now().toString(36).toUpperCase()}2`,
        qrCode: `QR-${Date.now()}2`,
        passengerName: 'Ahmed Ali',
        seatNumber: 2,
        status: 'ACTIVE',
      },
    ],
  })

  await prisma.payment.create({
    data: {
      bookingId: booking1.id,
      amount: booking1.totalAmount,
      method: 'TELEBIRR',
      status: 'COMPLETED',
      transactionId: `TXN-${Date.now()}`,
      platformCommission: booking1.totalAmount * 0.05,
    },
  })

  console.log(`   ✅ Created booking with 2 passengers (Confirmed & Paid)\n`)

  // ========== STEP 11: CREATE MAINTENANCE DATA ==========
  console.log('🔧 Step 11: Creating maintenance schedules...')

  await prisma.maintenanceSchedule.create({
    data: {
      vehicleId: vehicle1.id,
      taskName: 'Oil Change',
      taskType: 'OIL_CHANGE',
      intervalKm: 5000,
      intervalDays: 90,
      priority: 2,
      estimatedDuration: 60,
      estimatedCostBirr: 1500,
      autoCreateWorkOrder: true,
      nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      nextDueKm: vehicle1.currentOdometer + 5000,
    },
  })

  await prisma.maintenanceSchedule.create({
    data: {
      vehicleId: vehicle2.id,
      taskName: 'Brake Inspection',
      taskType: 'BRAKE_INSPECTION',
      intervalKm: 10000,
      intervalDays: 180,
      priority: 3,
      estimatedDuration: 120,
      estimatedCostBirr: 3000,
      autoCreateWorkOrder: true,
      nextDueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      nextDueKm: vehicle2.currentOdometer + 2000, // Due soon!
    },
  })

  console.log(`   ✅ Created 2 maintenance schedules\n`)

  // ========== SUMMARY ==========
  console.log('═══════════════════════════════════════════════════════')
  console.log('✅ COMPLETE TEST DATA SEED SUCCESSFUL!')
  console.log('═══════════════════════════════════════════════════════\n')

  console.log('👥 LOGIN CREDENTIALS:\n')
  console.log('   🔑 SUPER ADMIN:')
  console.log('      Email: admin@iticket.et')
  console.log('      Password: admin123\n')

  console.log('   🔑 COMPANY ADMIN (Sky Bus):')
  console.log('      Email: manager@skybus.et')
  console.log('      Password: manager123\n')

  console.log('   🔑 COMPANY ADMIN (Golden Transport):')
  console.log('      Email: admin@goldentransport.et')
  console.log('      Password: admin123\n')

  console.log('   🔑 DRIVER:')
  console.log('      Email: driver1@skybus.et')
  console.log('      Password: driver123\n')

  console.log('   🔑 CONDUCTOR:')
  console.log('      Email: conductor1@skybus.et')
  console.log('      Password: conductor123\n')

  console.log('   🔑 CASHIER:')
  console.log('      Email: cashier1@skybus.et')
  console.log('      Password: cashier123\n')

  console.log('   🔑 SALES PERSON:')
  console.log('      Email: sales@iticket.et')
  console.log('      Password: sales123')
  console.log('      Referral Code: ABEL26\n')

  console.log('   🔑 CUSTOMER:')
  console.log('      Email: customer@example.com')
  console.log('      Password: customer123\n')

  console.log('═══════════════════════════════════════════════════════')
  console.log('📊 DATA CREATED:\n')
  console.log(`   🏙️  Cities: ${cities.length}`)
  console.log(`   🏢 Companies: 2`)
  console.log(`   👥 Users: 8 (1 Super Admin, 2 Company Admins, 4 Staff, 1 Sales, 1 Customer)`)
  console.log(`   🚌 Vehicles: 3`)
  console.log(`   🗓️  Trips: ${createdTrips.length}`)
  console.log(`      - Past/Departed: 3`)
  console.log(`      - Today: 2`)
  console.log(`      - Future: 4`)
  console.log(`   🎫 Bookings: 1 (with 2 passengers, confirmed & paid)`)
  console.log(`   🔧 Maintenance Schedules: 2\n`)

  console.log('═══════════════════════════════════════════════════════')
  console.log('🎯 WHAT TO TEST:\n')
  console.log('   ✅ Login as different roles to see different views')
  console.log('   ✅ Browse trips (past, today, future)')
  console.log('   ✅ Create bookings as customer')
  console.log('   ✅ Manage trips as company admin')
  console.log('   ✅ Fleet management (vehicles, maintenance)')
  console.log('   ✅ Cashier portal for manual ticketing')
  console.log('   ✅ Driver/Conductor trip views')
  console.log('   ✅ Sales person referrals\n')

  console.log('🎉 All done! Ready to test all features!\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

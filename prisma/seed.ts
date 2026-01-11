import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting seed...")

  // Clear existing data (in order of dependencies)
  await prisma.workOrderPart.deleteMany()
  await prisma.workOrder.deleteMany()
  await prisma.vehicleInspection.deleteMany()
  await prisma.fuelEntry.deleteMany()
  await prisma.odometerLog.deleteMany()
  await prisma.maintenanceSchedule.deleteMany()
  await prisma.adminLog.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.passenger.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.trip.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.user.deleteMany()
  await prisma.company.deleteMany()

  console.log("Cleared existing data")

  // Create bus companies
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: "Selam Bus",
        email: "info@selambus.et",
        phones: JSON.stringify(["0911111111", "0911111112"]),
        isActive: true,
      },
    }),
    prisma.company.create({
      data: {
        name: "Sky Bus",
        email: "info@skybus.et",
        phones: JSON.stringify(["0922222222"]),
        isActive: true,
      },
    }),
    prisma.company.create({
      data: {
        name: "Abay Bus",
        email: "info@abaybus.et",
        phones: JSON.stringify(["0933333333"]),
        isActive: true,
      },
    }),
    prisma.company.create({
      data: {
        name: "Ghion Bus",
        email: "info@ghionbus.et",
        phones: JSON.stringify(["0944444444"]),
        isActive: true,
      },
    }),
    prisma.company.create({
      data: {
        name: "Awash Bus",
        email: "info@awashbus.et",
        phones: JSON.stringify(["0955555555"]),
        isActive: true,
      },
    }),
  ])

  console.log(`Created ${companies.length} bus companies`)

  // Hash passwords
  const customerPassword = await hash("demo123", 12)
  const companyPassword = await hash("demo123", 12)
  const adminPassword = await hash("admin123", 12)

  // Create users
  const users = await Promise.all([
    // Demo customer
    prisma.user.create({
      data: {
        name: "Abebe Kebede",
        phone: "0911234567",
        email: "abebe@example.com",
        password: customerPassword,
        role: "CUSTOMER",
        nationalId: "ET123456789",
        nextOfKinName: "Tigist Kebede",
        nextOfKinPhone: "0912345678",
      },
    }),
    // Company admin for Selam Bus
    prisma.user.create({
      data: {
        name: "Selam Admin",
        phone: "0922345678",
        email: "admin@selambus.et",
        password: companyPassword,
        role: "COMPANY_ADMIN",
        companyId: companies[0].id,
      },
    }),
    // Super admin
    prisma.user.create({
      data: {
        name: "System Admin",
        phone: "0933456789",
        email: "admin@i-ticket.et",
        password: adminPassword,
        role: "SUPER_ADMIN",
      },
    }),
    // Additional customers for variety
    prisma.user.create({
      data: {
        name: "Sara Haile",
        phone: "0912222222",
        email: "sara@example.com",
        password: customerPassword,
        role: "CUSTOMER",
      },
    }),
    prisma.user.create({
      data: {
        name: "Dawit Tesfaye",
        phone: "0913333333",
        email: "dawit@example.com",
        password: customerPassword,
        role: "CUSTOMER",
      },
    }),
  ])

  console.log(`Created ${users.length} users`)

  // Create staff members (drivers, conductors, ticketers)
  const staff = await Promise.all([
    // Drivers for Selam Bus
    prisma.user.create({
      data: {
        name: "Mulugeta Assefa",
        phone: "0914444444",
        email: "driver1@selambus.et",
        password: companyPassword,
        role: "STAFF",
        staffRole: "DRIVER",
        companyId: companies[0].id,
        licenseNumber: "DL-AA-12345",
      },
    }),
    prisma.user.create({
      data: {
        name: "Berhanu Tesfaye",
        phone: "0914444445",
        email: "driver2@selambus.et",
        password: companyPassword,
        role: "STAFF",
        staffRole: "DRIVER",
        companyId: companies[0].id,
        licenseNumber: "DL-AA-67890",
      },
    }),
    // Conductors for Selam Bus
    prisma.user.create({
      data: {
        name: "Alemitu Bekele",
        phone: "0914444446",
        email: "conductor1@selambus.et",
        password: companyPassword,
        role: "STAFF",
        staffRole: "CONDUCTOR",
        companyId: companies[0].id,
      },
    }),
    // Cashier for Selam Bus
    prisma.user.create({
      data: {
        name: "Tigist Hailu",
        phone: "0914444447",
        email: "cashier1@selambus.et",
        password: companyPassword,
        role: "STAFF",
        staffRole: "MANUAL_TICKETER",
        companyId: companies[0].id,
      },
    }),
    // Driver for Sky Bus
    prisma.user.create({
      data: {
        name: "Yohannes Negash",
        phone: "0925555555",
        email: "driver1@skybus.et",
        password: companyPassword,
        role: "STAFF",
        staffRole: "DRIVER",
        companyId: companies[1].id,
        licenseNumber: "DL-AA-11111",
      },
    }),
    // Conductor for Sky Bus
    prisma.user.create({
      data: {
        name: "Meron Tadesse",
        phone: "0925555556",
        email: "conductor1@skybus.et",
        password: companyPassword,
        role: "STAFF",
        staffRole: "CONDUCTOR",
        companyId: companies[1].id,
      },
    }),
    // Mechanics for Selam Bus
    prisma.user.create({
      data: {
        name: "Tariku Worku",
        phone: "0914444448",
        email: "mechanic1@selambus.et",
        password: companyPassword,
        role: "STAFF",
        staffRole: "MECHANIC",
        companyId: companies[0].id,
        employeeId: "MECH-001",
      },
    }),
    prisma.user.create({
      data: {
        name: "Girma Kebede",
        phone: "0914444449",
        email: "mechanic2@selambus.et",
        password: companyPassword,
        role: "STAFF",
        staffRole: "MECHANIC",
        companyId: companies[0].id,
        employeeId: "MECH-002",
      },
    }),
    // Finance for Selam Bus
    prisma.user.create({
      data: {
        name: "Hanna Bekele",
        phone: "0914444450",
        email: "finance1@selambus.et",
        password: companyPassword,
        role: "STAFF",
        staffRole: "FINANCE",
        companyId: companies[0].id,
        employeeId: "FIN-001",
      },
    }),
    // Mechanic for Sky Bus
    prisma.user.create({
      data: {
        name: "Solomon Tesfaye",
        phone: "0925555557",
        email: "mechanic1@skybus.et",
        password: companyPassword,
        role: "STAFF",
        staffRole: "MECHANIC",
        companyId: companies[1].id,
        employeeId: "MECH-101",
      },
    }),
  ])

  console.log(`Created ${staff.length} staff members`)

  // Create vehicles for each company
  const vehicles = await Promise.all([
    // Selam Bus vehicles
    prisma.vehicle.create({
      data: {
        companyId: companies[0].id,
        plateNumber: "3-12345",
        sideNumber: "101",
        make: "Mercedes-Benz",
        model: "Sprinter",
        year: 2022,
        busType: "STANDARD",
        totalSeats: 50,
        status: "ACTIVE",
        currentOdometer: 75000,
        engineHours: 3000,
        fuelCapacity: 80,
        fuelType: "DIESEL",
        fuelEfficiencyL100km: 28.5,
        utilizationRate: 82.0,
        registrationExpiry: new Date("2026-12-31"),
        insuranceExpiry: new Date("2026-06-30"),
        maintenanceRiskScore: 35, // LOW risk - good condition
        lastInspectionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        inspectionDueDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000), // 23 days from now
        criticalDefectCount: 0,
        defectCount: 1,
      },
    }),
    prisma.vehicle.create({
      data: {
        companyId: companies[0].id,
        plateNumber: "3-67890",
        sideNumber: "102",
        make: "Isuzu",
        model: "NPR",
        year: 2021,
        busType: "STANDARD",
        totalSeats: 40,
        status: "ACTIVE",
        currentOdometer: 50000,
        engineHours: 2000,
        fuelCapacity: 70,
        fuelType: "DIESEL",
        fuelEfficiencyL100km: 25.0,
        utilizationRate: 75.0,
        registrationExpiry: new Date("2026-10-15"),
        insuranceExpiry: new Date("2026-05-20"),
        maintenanceRiskScore: 55, // MEDIUM risk - maintenance due soon
        lastInspectionDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        inspectionDueDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000), // 16 days from now
        criticalDefectCount: 0,
        defectCount: 2,
        predictedFailureType: "Brake wear detected",
        predictedFailureDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      },
    }),
    // Sky Bus vehicles
    prisma.vehicle.create({
      data: {
        companyId: companies[1].id,
        plateNumber: "3-11111",
        sideNumber: "201",
        make: "Hino",
        model: "RK8",
        year: 2023,
        busType: "LUXURY",
        totalSeats: 30,
        status: "ACTIVE",
        currentOdometer: 30000,
        engineHours: 1200,
        fuelCapacity: 100,
        fuelType: "DIESEL",
        fuelEfficiencyL100km: 30.0,
        utilizationRate: 88.0,
        registrationExpiry: new Date("2027-03-15"),
        insuranceExpiry: new Date("2026-08-10"),
        maintenanceRiskScore: 22, // LOW risk - new vehicle, good condition
        lastInspectionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        inspectionDueDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000), // 27 days from now
        criticalDefectCount: 0,
        defectCount: 0,
      },
    }),
    // Abay Bus vehicle
    prisma.vehicle.create({
      data: {
        companyId: companies[2].id,
        plateNumber: "3-22222",
        sideNumber: "301",
        make: "Mercedes-Benz",
        model: "O500",
        year: 2020,
        busType: "STANDARD",
        totalSeats: 49,
        status: "ACTIVE",
        currentOdometer: 120000,
        engineHours: 5000,
        fuelCapacity: 90,
        fuelType: "DIESEL",
        fuelEfficiencyL100km: 29.5, // Degraded from baseline 27 -> 29.5 L/100km
        utilizationRate: 70.0,
        registrationExpiry: new Date("2026-07-20"),
        insuranceExpiry: new Date("2026-04-15"),
        maintenanceRiskScore: 78, // HIGH risk - high odometer, overdue maintenance, fuel degradation
        lastInspectionDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        inspectionDueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days overdue!
        criticalDefectCount: 2,
        defectCount: 5, // 2 critical + 3 minor = 5 total
        predictedFailureType: "Engine overhaul needed",
        predictedFailureDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    }),
  ])

  console.log(`Created ${vehicles.length} vehicles`)

  // Create maintenance schedules for vehicles
  const maintenanceSchedules = []

  for (const vehicle of vehicles) {
    // Oil Change schedule
    maintenanceSchedules.push(
      prisma.maintenanceSchedule.create({
        data: {
          vehicleId: vehicle.id,
          taskName: "Oil Change",
          taskType: "OIL_CHANGE",
          intervalKm: 5000,
          intervalDays: 90,
          nextDueKm: (vehicle.currentOdometer || 0) + 5000,
          nextDueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          priority: 2, // NORMAL
          estimatedDuration: 60,
          estimatedCostBirr: 1500,
          autoCreateWorkOrder: true,
        },
      })
    )

    // Brake Inspection schedule
    maintenanceSchedules.push(
      prisma.maintenanceSchedule.create({
        data: {
          vehicleId: vehicle.id,
          taskName: "Brake Inspection",
          taskType: "BRAKE_INSPECTION",
          intervalKm: 20000,
          intervalDays: 180,
          nextDueKm: (vehicle.currentOdometer || 0) + 20000,
          nextDueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          priority: 3, // HIGH
          estimatedDuration: 120,
          estimatedCostBirr: 3000,
          autoCreateWorkOrder: true,
        },
      })
    )

    // Tire Rotation schedule
    maintenanceSchedules.push(
      prisma.maintenanceSchedule.create({
        data: {
          vehicleId: vehicle.id,
          taskName: "Tire Rotation",
          taskType: "TIRE_ROTATION",
          intervalKm: 10000,
          intervalDays: null,
          nextDueKm: (vehicle.currentOdometer || 0) + 10000,
          nextDueDate: null,
          priority: 2, // NORMAL
          estimatedDuration: 45,
          estimatedCostBirr: 800,
          autoCreateWorkOrder: true,
        },
      })
    )
  }

  await Promise.all(maintenanceSchedules)
  console.log(`Created ${maintenanceSchedules.length} maintenance schedules`)

  // Create trips for the next 7 days
  const routes = [
    { origin: "Addis Ababa", destination: "Bahir Dar", duration: 540, basePrice: 850 },
    { origin: "Addis Ababa", destination: "Hawassa", duration: 300, basePrice: 400 },
    { origin: "Addis Ababa", destination: "Gondar", duration: 720, basePrice: 1100 },
    { origin: "Addis Ababa", destination: "Mekelle", duration: 780, basePrice: 1200 },
    { origin: "Addis Ababa", destination: "Dire Dawa", duration: 420, basePrice: 600 },
    { origin: "Addis Ababa", destination: "Jimma", duration: 360, basePrice: 500 },
    { origin: "Bahir Dar", destination: "Gondar", duration: 180, basePrice: 250 },
    { origin: "Bahir Dar", destination: "Addis Ababa", duration: 540, basePrice: 850 },
    { origin: "Hawassa", destination: "Addis Ababa", duration: 300, basePrice: 400 },
    { origin: "Mekelle", destination: "Addis Ababa", duration: 780, basePrice: 1200 },
  ]

  const busTypes = ["standard", "luxury"]
  const departureTimes = ["05:00", "06:30", "14:00", "21:00"]

  const trips = []

  for (let day = 0; day < 7; day++) {
    const date = new Date()
    date.setDate(date.getDate() + day)

    for (const route of routes) {
      // Each route gets 2-3 trips per day from random companies
      const numTrips = Math.floor(Math.random() * 2) + 2

      for (let i = 0; i < numTrips; i++) {
        const company = companies[Math.floor(Math.random() * companies.length)]
        const busType = busTypes[Math.floor(Math.random() * busTypes.length)]
        const departureTime = departureTimes[Math.floor(Math.random() * departureTimes.length)]

        const [hours, minutes] = departureTime.split(":").map(Number)
        const departure = new Date(date)
        departure.setHours(hours, minutes, 0, 0)

        // Skip if departure is in the past
        if (departure < new Date()) continue

        // OPTIONAL: Try to find a suitable vehicle for this trip (matching company and bus type)
        const busTypeUpper = busType === "luxury" ? "LUXURY" : "STANDARD"
        const suitableVehicle = vehicles.find(
          (v) =>
            v.companyId === company.id &&
            v.busType === busTypeUpper
        )

        // OPTIONAL: Find staff for this company
        const companyDrivers = staff.filter(
          (s) => s.companyId === company.id && s.staffRole === "DRIVER"
        )
        const companyConductors = staff.filter(
          (s) => s.companyId === company.id && s.staffRole === "CONDUCTOR"
        )

        const totalSlots = busType === "luxury" ? 30 : 50
        const bookedSlots = Math.floor(Math.random() * (totalSlots * 0.7))

        // Price varies by bus type
        const priceMultiplier = busType === "luxury" ? 1.5 : 1
        const price = Math.round(route.basePrice * priceMultiplier)

        trips.push({
          companyId: company.id,
          vehicleId: suitableVehicle?.id || null, // OPTIONAL assignment
          driverId:
            companyDrivers.length > 0
              ? companyDrivers[Math.floor(Math.random() * companyDrivers.length)].id
              : null, // OPTIONAL assignment
          conductorId:
            companyConductors.length > 0
              ? companyConductors[Math.floor(Math.random() * companyConductors.length)].id
              : null, // OPTIONAL assignment
          origin: route.origin,
          destination: route.destination,
          departureTime: departure,
          estimatedDuration: route.duration,
          price,
          busType,
          totalSlots,
          availableSlots: totalSlots - bookedSlots,
          hasWater: busType !== "standard",
          hasFood: busType === "luxury",
          isActive: true,
        })
      }
    }
  }

  const createdTrips = await prisma.trip.createMany({
    data: trips,
  })

  console.log(`Created ${createdTrips.count} trips with vehicle and staff assignments`)

  // Create a sample booking with tickets for the demo customer
  const sampleTrip = await prisma.trip.findFirst({
    where: {
      origin: "Addis Ababa",
      destination: "Bahir Dar",
      availableSlots: { gte: 2 },
    },
    include: { company: true },
  })

  if (sampleTrip) {
    const booking = await prisma.booking.create({
      data: {
        tripId: sampleTrip.id,
        userId: users[0].id, // Demo customer
        totalAmount: sampleTrip.price * 2,
        commission: sampleTrip.price * 2 * 0.05,
        status: "PAID",
        passengers: {
          create: [
            {
              name: "Abebe Kebede",
              nationalId: "ET123456789",
              phone: "0911234567",
              seatNumber: 1,
            },
            {
              name: "Tigist Kebede",
              nationalId: "ET987654321",
              phone: "0912345678",
              seatNumber: 2,
            },
          ],
        },
        payment: {
          create: {
            amount: sampleTrip.price * 2 * 1.05,
            method: "DEMO",
            transactionId: `DEMO-${Date.now()}`,
            status: "SUCCESS",
          },
        },
      },
      include: { passengers: true },
    })

    // Create tickets
    for (const passenger of booking.passengers) {
      const shortCode = `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.random().toString(36).substring(2, 7).toUpperCase()}`

      await prisma.ticket.create({
        data: {
          bookingId: booking.id,
          tripId: sampleTrip.id,
          passengerName: passenger.name,
          seatNumber: passenger.seatNumber,
          qrCode: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`, // Placeholder
          shortCode,
        },
      })
    }

    // Update trip available slots
    await prisma.trip.update({
      where: { id: sampleTrip.id },
      data: { availableSlots: sampleTrip.availableSlots - 2 },
    })

    console.log("Created sample booking with tickets")
  }

  console.log("Seed completed successfully!")
  console.log("\n=== LOGIN CREDENTIALS ===\n")

  console.log("👤 CUSTOMERS:")
  console.log("   Phone: 0911234567 / Password: demo123")
  console.log("   Phone: 0912222222 / Password: demo123")
  console.log("   Phone: 0913333333 / Password: demo123\n")

  console.log("🏢 COMPANY ADMINS:")
  console.log("   Selam Bus:  0922345678 / demo123\n")

  console.log("👨‍✈️ STAFF (Selam Bus):")
  console.log("   Driver 1:    0914444444 / demo123 (Mulugeta Assefa)")
  console.log("   Driver 2:    0914444445 / demo123 (Berhanu Tesfaye)")
  console.log("   Conductor:   0914444446 / demo123 (Alemitu Bekele)")
  console.log("   Cashier:     0914444447 / demo123 (Tigist Hailu)")
  console.log("   Mechanic 1:  0914444448 / demo123 (Tariku Worku)")
  console.log("   Mechanic 2:  0914444449 / demo123 (Girma Kebede)")
  console.log("   Finance:     0914444450 / demo123 (Hanna Bekele)\n")

  console.log("👨‍✈️ STAFF (Sky Bus):")
  console.log("   Driver:      0925555555 / demo123 (Yohannes Negash)")
  console.log("   Conductor:   0925555556 / demo123 (Meron Tadesse)")
  console.log("   Mechanic:    0925555557 / demo123 (Solomon Tesfaye)\n")

  console.log("👑 SUPER ADMIN:")
  console.log("   Phone: 0933456789 / Password: admin123\n")

  console.log("🚌 VEHICLES CREATED:")
  console.log(`   - ${vehicles.length} vehicles with maintenance schedules`)
  console.log(`   - ${maintenanceSchedules.length} maintenance schedules\n`)
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

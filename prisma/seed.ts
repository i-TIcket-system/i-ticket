import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting seed...")

  // Clear existing data
  await prisma.adminLog.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.passenger.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.trip.deleteMany()
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

  const busTypes = ["standard", "vip", "luxury"]
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

        const totalSlots = busType === "luxury" ? 30 : busType === "vip" ? 40 : 50
        const bookedSlots = Math.floor(Math.random() * (totalSlots * 0.7))

        // Price varies by bus type
        const priceMultiplier = busType === "luxury" ? 1.5 : busType === "vip" ? 1.25 : 1
        const price = Math.round(route.basePrice * priceMultiplier)

        trips.push({
          companyId: company.id,
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

  console.log(`Created ${createdTrips.count} trips`)

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
  console.log("\n--- Demo Accounts ---")
  console.log("Customer: 0911234567 / demo123")
  console.log("Company Admin: 0922345678 / demo123")
  console.log("Super Admin: 0933456789 / admin123")
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

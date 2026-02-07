/**
 * Create a test booking + ticket on a DEPARTED trip for tracking testing.
 * Run: npx tsx scripts/create-test-passenger.ts
 */

import { PrismaClient } from "@prisma/client"
import crypto from "crypto"

const prisma = new PrismaClient()

function generateShortCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = crypto.randomBytes(6)
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length]
  }
  return code
}

async function main() {
  // 1. Find a DEPARTED trip (preferably one with tracking active)
  const trip = await prisma.trip.findFirst({
    where: { status: "DEPARTED" },
    include: { company: true },
    orderBy: { departureTime: "desc" },
  })
  if (!trip) throw new Error("No DEPARTED trip found")

  console.log(`Found trip: ${trip.origin} → ${trip.destination} (${trip.company?.name})`)

  // 2. Find test customer (0912345678)
  const user = await prisma.user.findUnique({ where: { phone: "0912345678" } })
  if (!user) throw new Error("Test customer (0912345678) not found")

  // 3. Calculate amounts (matches platform commission logic)
  const ticketPrice = Number(trip.price)
  const commission = ticketPrice * 0.05
  const commissionVAT = commission * 0.15
  const totalAmount = Math.round((ticketPrice + commission + commissionVAT) * 100) / 100

  // 4. Generate unique short code
  let shortCode = generateShortCode()
  // Ensure uniqueness
  while (await prisma.ticket.findUnique({ where: { shortCode } })) {
    shortCode = generateShortCode()
  }

  // 5. Create booking + passenger + payment + ticket
  const booking = await prisma.booking.create({
    data: {
      tripId: trip.id,
      userId: user.id,
      totalAmount,
      commission,
      commissionVAT,
      status: "PAID",
      passengers: {
        create: {
          name: "Test Passenger",
          nationalId: "VERIFY_AT_BOARDING",
          phone: "0912345678",
          seatNumber: 1,
        },
      },
      payment: {
        create: {
          amount: totalAmount,
          method: "DEMO",
          transactionId: `TEST-${Date.now()}`,
          status: "SUCCESS",
        },
      },
      tickets: {
        create: {
          tripId: trip.id,
          passengerName: "Test Passenger",
          seatNumber: 1,
          qrCode: `https://i-ticket.et/verify/${shortCode}`,
          shortCode,
        },
      },
    },
    include: { tickets: true, passengers: true },
  })

  console.log("\n=== Test Booking Created ===")
  console.log(`Trip: ${trip.origin} → ${trip.destination}`)
  console.log(`Company: ${trip.company?.name}`)
  console.log(`Booking ID: ${booking.id}`)
  console.log(`Ticket Code: ${shortCode}`)
  console.log(`\nTrack URL: https://i-ticket.et/track/${shortCode}`)
  console.log(`Track URL (by ID): https://i-ticket.et/track/${booking.id}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

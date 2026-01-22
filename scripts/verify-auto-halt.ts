/**
 * Verify Auto-Halt Rules Compliance
 * Checks that seeded trips follow auto-halt business rules
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("\n🔍 Verifying Auto-Halt Rules Compliance...\n")

  // Get all trips
  const allTrips = await prisma.trip.findMany({
    select: {
      id: true,
      origin: true,
      destination: true,
      departureTime: true,
      status: true,
      totalSlots: true,
      availableSlots: true,
      bookingHalted: true,
    },
    orderBy: {
      departureTime: "asc",
    },
  })

  console.log(`📊 Total trips: ${allTrips.length}\n`)

  const now = new Date()
  const issues: string[] = []
  const stats = {
    total: allTrips.length,
    past: 0,
    future: 0,
    lowSeats: 0,
    correctlyHalted: 0,
    incorrectlyHalted: 0,
    status: {
      SCHEDULED: 0,
      BOARDING: 0,
      DEPARTED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    },
  }

  for (const trip of allTrips) {
    const isPast = new Date(trip.departureTime) < now
    const lowSeats = trip.availableSlots <= 10

    if (isPast) {
      stats.past++

      // Check: Past trips must be COMPLETED or CANCELLED
      if (trip.status !== "COMPLETED" && trip.status !== "CANCELLED") {
        issues.push(
          `❌ Trip ${trip.id} (${trip.origin} → ${trip.destination}) departed but status is ${trip.status} (should be COMPLETED or CANCELLED)`
        )
      }

      // Check: Past trips must have bookingHalted = true
      if (!trip.bookingHalted) {
        issues.push(
          `❌ Trip ${trip.id} (${trip.origin} → ${trip.destination}) is past but bookingHalted = false`
        )
      } else {
        stats.correctlyHalted++
      }
    } else {
      stats.future++

      // Check: Future trips with ≤10 seats should have bookingHalted = true
      if (lowSeats) {
        stats.lowSeats++
        if (trip.bookingHalted) {
          stats.correctlyHalted++
        } else {
          issues.push(
            `❌ Trip ${trip.id} (${trip.origin} → ${trip.destination}) has ${trip.availableSlots} seats but bookingHalted = false`
          )
          stats.incorrectlyHalted++
        }
      }
    }

    // Count status
    stats.status[trip.status as keyof typeof stats.status]++
  }

  console.log("📈 Statistics:")
  console.log(`   Past trips: ${stats.past}`)
  console.log(`   Future trips: ${stats.future}`)
  console.log(`   Future trips with ≤10 seats: ${stats.lowSeats}`)
  console.log(`   Correctly halted: ${stats.correctlyHalted}`)
  console.log(`   Incorrectly halted: ${stats.incorrectlyHalted}\n`)

  console.log("📊 Trip Status Breakdown:")
  console.log(`   SCHEDULED: ${stats.status.SCHEDULED}`)
  console.log(`   BOARDING: ${stats.status.BOARDING}`)
  console.log(`   DEPARTED: ${stats.status.DEPARTED}`)
  console.log(`   COMPLETED: ${stats.status.COMPLETED}`)
  console.log(`   CANCELLED: ${stats.status.CANCELLED}\n`)

  if (issues.length > 0) {
    console.log(`\n⚠️  Found ${issues.length} auto-halt compliance issues:\n`)
    issues.forEach((issue) => console.log(issue))
    console.log("\n")
  } else {
    console.log("✅ All trips comply with auto-halt rules!\n")
  }

  // Show sample of correctly halted trips
  const correctTrips = allTrips.filter(
    (t) =>
      t.bookingHalted &&
      (new Date(t.departureTime) < now || t.availableSlots <= 10)
  )

  if (correctTrips.length > 0) {
    console.log(`\n✅ Sample of correctly halted trips (showing first 5):`)
    correctTrips.slice(0, 5).forEach((trip) => {
      const reason = new Date(trip.departureTime) < now ? "PAST" : "LOW SEATS"
      console.log(
        `   ${trip.origin} → ${trip.destination} | ${trip.status} | ${trip.availableSlots}/${trip.totalSlots} seats | Halted: ${reason}`
      )
    })
    console.log("")
  }
}

main()
  .catch((e) => {
    console.error("Verification error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

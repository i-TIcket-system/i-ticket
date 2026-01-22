import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function testAutoHalt() {
  console.log("🧪 Testing Auto-Halt Feature\n")
  console.log("=" .repeat(60))

  // Find a trip with >10 slots that we can test with
  const testTrip = await prisma.trip.findFirst({
    where: {
      availableSlots: { gt: 10 },
      status: "SCHEDULED",
      departureTime: { gt: new Date() },
    },
    include: {
      company: true,
    },
  })

  if (!testTrip) {
    console.log("❌ No suitable trip found (need >10 slots, SCHEDULED, future)")
    return
  }

  console.log("\n📍 Test Trip Found:")
  console.log(`   Company: ${testTrip.company.name}`)
  console.log(`   Route: ${testTrip.origin} → ${testTrip.destination}`)
  console.log(`   Available Slots: ${testTrip.availableSlots}`)
  console.log(`   Booking Halted: ${testTrip.bookingHalted}`)
  console.log(`   Trip ID: ${testTrip.id}`)

  // Calculate how many slots to sell to trigger auto-halt
  const slotsToSell = testTrip.availableSlots - 10 // This will leave exactly 10 slots
  console.log(`\n🎫 Simulating Manual Ticket Sale:`)
  console.log(`   Selling ${slotsToSell} seats`)
  console.log(`   Remaining after sale: ${testTrip.availableSlots - slotsToSell} slots`)

  // Simulate the manual ticket sale (updating availableSlots)
  const updatedTrip = await prisma.trip.update({
    where: { id: testTrip.id },
    data: {
      availableSlots: testTrip.availableSlots - slotsToSell,
    },
  })

  console.log(`\n✅ Manual sale completed`)
  console.log(`   Available Slots: ${updatedTrip.availableSlots}`)
  console.log(`   Booking Halted: ${updatedTrip.bookingHalted}`)

  // Check if auto-halt should trigger
  if (updatedTrip.availableSlots <= 10) {
    console.log(`\n⚠️  TRIGGER CONDITION MET: availableSlots (${updatedTrip.availableSlots}) <= 10`)
    console.log(`   Expected: bookingHalted should be TRUE`)
    console.log(`   Actual: bookingHalted is ${updatedTrip.bookingHalted}`)

    if (!updatedTrip.bookingHalted) {
      console.log(`\n❌ TEST FAILED: Auto-halt did NOT trigger!`)
      console.log(`   This test only updates slots, not triggering the actual sale API`)
      console.log(`   The real auto-halt logic is in: /api/company/trips/[tripId]/manual-ticket/route.ts`)
    } else {
      console.log(`\n✅ TEST PASSED: Auto-halt is already enabled!`)
    }
  }

  // Now test selling one more to bring it to 9 slots (below threshold)
  console.log(`\n\n🎫 Test 2: Selling one more seat (below threshold)`)
  const trip2 = await prisma.trip.update({
    where: { id: testTrip.id },
    data: {
      availableSlots: updatedTrip.availableSlots - 1,
    },
  })

  console.log(`   Available Slots: ${trip2.availableSlots}`)
  console.log(`   Booking Halted: ${trip2.bookingHalted}`)
  console.log(`   Expected: Still works since manual ticketing can ALWAYS sell`)

  console.log("\n" + "=".repeat(60))
  console.log("\n📋 Summary:")
  console.log("   The auto-halt logic in the API should:")
  console.log("   1. Check if availableSlots <= 10 after manual sale")
  console.log("   2. Set bookingHalted = true (unless bypassed by company/trip settings)")
  console.log("   3. Allow the manual sale to complete (not blocked)")
  console.log("   4. Create AUTO_HALT_LOW_SLOTS audit log")
  console.log("\n   This test only simulates slot changes.")
  console.log("   For full test, use the actual manual ticket sale API.")

  // Restore original state
  await prisma.trip.update({
    where: { id: testTrip.id },
    data: {
      availableSlots: testTrip.availableSlots,
      bookingHalted: testTrip.bookingHalted,
    },
  })

  console.log("\n✅ Trip restored to original state")
}

testAutoHalt()
  .catch((e) => {
    console.error("Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

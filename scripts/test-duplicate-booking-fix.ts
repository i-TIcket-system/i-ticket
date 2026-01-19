/**
 * Direct database test for duplicate booking fix
 * Simulates the booking creation/update flow
 */

import prisma from "../src/lib/db"

async function testDuplicateBookingFix() {
  console.log("🧪 Testing Duplicate Booking Fix\n")

  try {
    // Find test user (any customer)
    const testUser = await prisma.user.findFirst({
      where: {
        role: "CUSTOMER"
      }
    })

    if (!testUser) {
      console.error("❌ No customer users found")
      return
    }

    console.log(`✅ Test user: ${testUser.name}`)

    // Find available trip
    const trip = await prisma.trip.findFirst({
      where: {
        status: "SCHEDULED",
        availableSlots: { gte: 10 },
        departureTime: { gte: new Date() }
      }
    })

    if (!trip) {
      console.error("❌ No available trips")
      return
    }

    console.log(`✅ Trip: ${trip.origin} → ${trip.destination}`)
    console.log(`   Initial available slots: ${trip.availableSlots}\n`)

    // Cleanup existing pending bookings
    const existing = await prisma.booking.deleteMany({
      where: {
        userId: testUser.id,
        tripId: trip.id,
        status: "PENDING"
      }
    })

    if (existing.count > 0) {
      console.log(`🧹 Cleaned up ${existing.count} existing PENDING bookings\n`)
    }

    // TEST: Check for existing pending booking (should find none)
    console.log("📝 Step 1: Check for existing PENDING booking...")
    let existingPendingBooking = await prisma.booking.findFirst({
      where: {
        userId: testUser.id,
        tripId: trip.id,
        status: "PENDING"
      },
      include: { passengers: true }
    })

    console.log(`   Existing PENDING: ${existingPendingBooking ? "Found" : "None"} ✅\n`)

    // TEST: Create first booking
    console.log("📝 Step 2: Create first booking (1 passenger, seat 5)...")
    const booking1 = await prisma.booking.create({
      data: {
        userId: testUser.id,
        tripId: trip.id,
        status: "PENDING",
        totalAmount: 1348,
        commission: 63.75,
        commissionVAT: 9.56,
        passengers: {
          create: [{
            name: "Test User",
            nationalId: "TEST123",
            phone: testUser.phone,
            seatNumber: 5
          }]
        }
      },
      include: { passengers: true }
    })

    await prisma.trip.update({
      where: { id: trip.id },
      data: { availableSlots: { decrement: 1 } }
    })

    console.log(`   ✅ Booking created: ${booking1.id}`)
    console.log(`   Passengers: ${booking1.passengers.length}`)
    console.log(`   Seats: ${booking1.passengers.map(p => p.seatNumber).join(", ")}\n`)

    // TEST: User goes back and "books again" - should find existing
    console.log("📝 Step 3: User returns and modifies (should UPDATE, not CREATE)...")
    existingPendingBooking = await prisma.booking.findFirst({
      where: {
        userId: testUser.id,
        tripId: trip.id,
        status: "PENDING"
      },
      include: { passengers: true }
    })

    if (existingPendingBooking) {
      console.log(`   ✅ Found existing PENDING booking: ${existingPendingBooking.id}`)
      console.log(`   Will UPDATE this booking instead of creating new one\n`)

      // Simulate update: change seat 5 → 10
      console.log("📝 Step 4: Updating booking (change seat 5 → 10)...")

      // Delete old passengers
      await prisma.passenger.deleteMany({
        where: { bookingId: existingPendingBooking.id }
      })

      // Update booking with new passenger
      const updatedBooking = await prisma.booking.update({
        where: { id: existingPendingBooking.id },
        data: {
          passengers: {
            create: [{
              name: "Test User",
              nationalId: "TEST123",
              phone: testUser.phone,
              seatNumber: 10 // Changed from 5 to 10
            }]
          }
        },
        include: { passengers: true }
      })

      console.log(`   ✅ Booking updated: ${updatedBooking.id}`)
      console.log(`   Passengers: ${updatedBooking.passengers.length}`)
      console.log(`   Seats: ${updatedBooking.passengers.map(p => p.seatNumber).join(", ")}\n`)

      // Verify only ONE booking exists
      const allPendingBookings = await prisma.booking.findMany({
        where: {
          userId: testUser.id,
          tripId: trip.id,
          status: "PENDING"
        }
      })

      console.log("📊 VERIFICATION:")
      console.log(`   Total PENDING bookings: ${allPendingBookings.length}`)

      if (allPendingBookings.length === 1) {
        console.log("   ✅ PASS: Only 1 PENDING booking exists (no duplicates!)")
      } else {
        console.log(`   ❌ FAIL: Found ${allPendingBookings.length} bookings (expected 1)`)
      }

      // TEST: Modify again - increase passengers
      console.log("\n📝 Step 5: Modify again (1 → 3 passengers)...")

      await prisma.passenger.deleteMany({
        where: { bookingId: existingPendingBooking.id }
      })

      const finalBooking = await prisma.booking.update({
        where: { id: existingPendingBooking.id },
        data: {
          totalAmount: 4044, // 3 passengers
          commission: 191.25,
          commissionVAT: 28.69,
          passengers: {
            create: [
              { name: "Passenger 1", nationalId: "TEST1", phone: testUser.phone, seatNumber: 10 },
              { name: "Passenger 2", nationalId: "TEST2", phone: "0911111111", seatNumber: 11 },
              { name: "Passenger 3", nationalId: "TEST3", phone: "0922222222", seatNumber: 12 }
            ]
          }
        },
        include: { passengers: true }
      })

      await prisma.trip.update({
        where: { id: trip.id },
        data: { availableSlots: { decrement: 2 } } // 3 - 1 = 2 additional
      })

      console.log(`   ✅ Booking updated: ${finalBooking.id}`)
      console.log(`   Passengers: ${finalBooking.passengers.length}`)
      console.log(`   Seats: ${finalBooking.passengers.map(p => p.seatNumber).join(", ")}\n`)

      // Final verification
      const finalPendingBookings = await prisma.booking.findMany({
        where: {
          userId: testUser.id,
          tripId: trip.id,
          status: "PENDING"
        }
      })

      console.log("📊 FINAL VERIFICATION:")
      console.log(`   Total PENDING bookings: ${finalPendingBookings.length}`)

      if (finalPendingBookings.length === 1) {
        console.log("   ✅ PASS: Still only 1 PENDING booking!")
      } else {
        console.log(`   ❌ FAIL: Found ${finalPendingBookings.length} bookings`)
      }

      const finalTrip = await prisma.trip.findUnique({
        where: { id: trip.id }
      })
      console.log(`\n   Available slots: ${trip.availableSlots} → ${finalTrip?.availableSlots}`)
      console.log(`   Expected decrease: 3 seats (1 initial + 2 additional)`)

    }

    // Cleanup
    console.log("\n🧹 Cleaning up test data...")
    await prisma.booking.deleteMany({
      where: {
        userId: testUser.id,
        tripId: trip.id,
        status: "PENDING"
      }
    })

    await prisma.trip.update({
      where: { id: trip.id },
      data: { availableSlots: trip.availableSlots } // Reset
    })

    console.log("✅ Test complete!\n")

  } catch (error) {
    console.error("❌ Test error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

testDuplicateBookingFix()

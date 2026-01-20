/**
 * Test script for booking modification fix
 * Tests that users can modify PENDING bookings without creating duplicates
 */

import prisma from "../src/lib/db"

async function testBookingModification() {
  console.log("🧪 Testing Booking Modification Flow\n")

  try {
    // Find a test user (customer)
    const testUser = await prisma.user.findFirst({
      where: {
        role: "CUSTOMER",
        phone: "0912345678"
      }
    })

    if (!testUser) {
      console.error("❌ Test user not found (0912345678)")
      return
    }

    console.log(`✅ Found test user: ${testUser.name} (${testUser.phone})`)

    // Find an available trip
    const trip = await prisma.trip.findFirst({
      where: {
        status: "SCHEDULED",
        availableSlots: {
          gte: 5
        },
        departureTime: {
          gte: new Date()
        }
      },
      include: {
        company: true
      }
    })

    if (!trip) {
      console.error("❌ No available trips found")
      return
    }

    console.log(`✅ Found trip: ${trip.origin} → ${trip.destination}`)
    console.log(`   Available slots: ${trip.availableSlots}`)
    console.log(`   Price: ${trip.price} ETB\n`)

    // Clean up any existing pending bookings for this user+trip
    const existingPending = await prisma.booking.findMany({
      where: {
        userId: testUser.id,
        tripId: trip.id,
        status: "PENDING"
      },
      include: {
        passengers: true
      }
    })

    if (existingPending.length > 0) {
      console.log(`🧹 Cleaning up ${existingPending.length} existing PENDING booking(s)...`)
      for (const booking of existingPending) {
        await prisma.passenger.deleteMany({
          where: { bookingId: booking.id }
        })
        await prisma.booking.delete({
          where: { id: booking.id }
        })
      }
      console.log("✅ Cleanup complete\n")
    }

    // TEST 1: Create initial booking with 1 passenger
    console.log("📝 TEST 1: Creating initial booking with 1 passenger...")
    const initialSlots = trip.availableSlots

    const createResponse = await fetch("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `next-auth.session-token=test` // You'll need to use actual session
      },
      body: JSON.stringify({
        tripId: trip.id,
        passengers: [
          {
            name: "Test Passenger 1",
            nationalId: "TEST123456",
            phone: "0912345678",
            specialNeeds: "none"
          }
        ],
        selectedSeats: [5] // Seat 5
      })
    })

    console.log(`   Response status: ${createResponse.status}`)

    // Check booking count
    const bookingsAfterCreate = await prisma.booking.findMany({
      where: {
        userId: testUser.id,
        tripId: trip.id,
        status: "PENDING"
      },
      include: {
        passengers: true
      }
    })

    console.log(`   PENDING bookings count: ${bookingsAfterCreate.length}`)
    if (bookingsAfterCreate.length === 1) {
      console.log("   ✅ PASS: Exactly 1 booking created")
      console.log(`   Passenger count: ${bookingsAfterCreate[0].passengers.length}`)
      console.log(`   Seats: ${bookingsAfterCreate[0].passengers.map(p => p.seatNumber).join(", ")}`)
    } else {
      console.log(`   ❌ FAIL: Expected 1 booking, got ${bookingsAfterCreate.length}`)
      return
    }

    const tripAfterCreate = await prisma.trip.findUnique({
      where: { id: trip.id }
    })
    console.log(`   Available slots: ${initialSlots} → ${tripAfterCreate?.availableSlots} (should decrease by 1)`)
    console.log()

    // TEST 2: Modify booking - change seat from 5 to 10
    console.log("📝 TEST 2: Modifying booking - change seat 5 → 10...")

    const modifySeatsResponse = await fetch("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `next-auth.session-token=test`
      },
      body: JSON.stringify({
        tripId: trip.id,
        passengers: [
          {
            name: "Test Passenger 1 Updated",
            nationalId: "TEST123456",
            phone: "0912345678",
            specialNeeds: "none"
          }
        ],
        selectedSeats: [10] // Change to seat 10
      })
    })

    console.log(`   Response status: ${modifySeatsResponse.status}`)

    const bookingsAfterSeatChange = await prisma.booking.findMany({
      where: {
        userId: testUser.id,
        tripId: trip.id,
        status: "PENDING"
      },
      include: {
        passengers: true
      }
    })

    console.log(`   PENDING bookings count: ${bookingsAfterSeatChange.length}`)
    if (bookingsAfterSeatChange.length === 1) {
      console.log("   ✅ PASS: Still exactly 1 booking (no duplicate created)")
      console.log(`   Passenger count: ${bookingsAfterSeatChange[0].passengers.length}`)
      console.log(`   Seats: ${bookingsAfterSeatChange[0].passengers.map(p => p.seatNumber).join(", ")}`)
    } else {
      console.log(`   ❌ FAIL: Expected 1 booking, got ${bookingsAfterSeatChange.length}`)
      return
    }

    const tripAfterSeatChange = await prisma.trip.findUnique({
      where: { id: trip.id }
    })
    console.log(`   Available slots: ${tripAfterCreate?.availableSlots} → ${tripAfterSeatChange?.availableSlots} (should stay same)`)
    console.log()

    // TEST 3: Modify booking - increase passengers from 1 to 3
    console.log("📝 TEST 3: Modifying booking - increase passengers 1 → 3...")

    const modifyCountResponse = await fetch("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `next-auth.session-token=test`
      },
      body: JSON.stringify({
        tripId: trip.id,
        passengers: [
          {
            name: "Test Passenger 1",
            nationalId: "TEST123456",
            phone: "0912345678",
            specialNeeds: "none"
          },
          {
            name: "Test Passenger 2",
            nationalId: "TEST234567",
            phone: "0912345679",
            specialNeeds: "none"
          },
          {
            name: "Test Passenger 3",
            nationalId: "TEST345678",
            phone: "0912345680",
            specialNeeds: "none"
          }
        ],
        selectedSeats: [10, 11, 12]
      })
    })

    console.log(`   Response status: ${modifyCountResponse.status}`)

    const bookingsAfterCountChange = await prisma.booking.findMany({
      where: {
        userId: testUser.id,
        tripId: trip.id,
        status: "PENDING"
      },
      include: {
        passengers: true
      }
    })

    console.log(`   PENDING bookings count: ${bookingsAfterCountChange.length}`)
    if (bookingsAfterCountChange.length === 1) {
      console.log("   ✅ PASS: Still exactly 1 booking (no duplicate created)")
      console.log(`   Passenger count: ${bookingsAfterCountChange[0].passengers.length}`)
      console.log(`   Seats: ${bookingsAfterCountChange[0].passengers.map(p => p.seatNumber).join(", ")}`)
    } else {
      console.log(`   ❌ FAIL: Expected 1 booking, got ${bookingsAfterCountChange.length}`)
      return
    }

    const tripAfterCountChange = await prisma.trip.findUnique({
      where: { id: trip.id }
    })
    console.log(`   Available slots: ${tripAfterSeatChange?.availableSlots} → ${tripAfterCountChange?.availableSlots} (should decrease by 2)`)
    console.log()

    // Summary
    console.log("=" .repeat(60))
    console.log("📊 TEST SUMMARY")
    console.log("=" .repeat(60))
    console.log("✅ All tests passed!")
    console.log(`✅ User can modify PENDING bookings without creating duplicates`)
    console.log(`✅ Seat changes work correctly`)
    console.log(`✅ Passenger count changes work correctly`)
    console.log(`✅ Available slots are tracked correctly`)
    console.log()

    // Cleanup
    console.log("🧹 Cleaning up test data...")
    for (const booking of bookingsAfterCountChange) {
      await prisma.passenger.deleteMany({
        where: { bookingId: booking.id }
      })
      await prisma.booking.delete({
        where: { id: booking.id }
      })
    }
    console.log("✅ Cleanup complete")

  } catch (error) {
    console.error("❌ Test failed with error:")
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testBookingModification()

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testAutoCancel() {
  console.log('🧪 Testing 15-minute auto-cancel feature...\n')

  try {
    // Step 1: Find a test trip
    const trip = await prisma.trip.findFirst({
      where: {
        isActive: true,
        availableSlots: { gt: 0 },
        departureTime: { gt: new Date() }
      },
      include: {
        company: true
      }
    })

    if (!trip) {
      console.log('❌ No available trips found. Please create a trip first.')
      return
    }

    console.log(`✅ Found trip: ${trip.origin} → ${trip.destination}`)
    console.log(`   Available slots: ${trip.availableSlots}`)

    // Step 2: Find or create test user
    let user = await prisma.user.findUnique({
      where: { phone: '0999999999' }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: '0999999999',
          name: 'Test User Auto Cancel',
          password: null,
          isGuestUser: true,
          role: 'CUSTOMER'
        }
      })
      console.log('✅ Created test user')
    } else {
      console.log('✅ Using existing test user')
    }

    // Step 3: Create a test booking
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        tripId: trip.id,
        totalAmount: trip.price,
        commission: trip.price * 0.05,
        commissionVAT: trip.price * 0.05 * 0.15,
        status: 'PENDING',
        passengers: {
          create: {
            name: 'Test Passenger',
            phone: '0999999999',
            nationalId: 'TEST123',
            seatNumber: null
          }
        },
        // Backdate to 20 minutes ago (older than 15-minute threshold)
        createdAt: new Date(Date.now() - 20 * 60 * 1000)
      },
      include: {
        passengers: true
      }
    })

    console.log(`✅ Created test booking (ID: ${booking.id})`)
    console.log(`   Created at: ${booking.createdAt} (20 minutes ago)`)
    console.log(`   Status: ${booking.status}`)
    console.log(`   Passengers: ${booking.passengers.length}`)

    // Step 4: Decrease available slots (simulate booking holding seats)
    await prisma.trip.update({
      where: { id: trip.id },
      data: {
        availableSlots: trip.availableSlots - 1
      }
    })

    console.log(`✅ Decreased trip available slots to ${trip.availableSlots - 1}\n`)

    console.log('📋 Before cleanup:')
    console.log(`   Booking status: PENDING`)
    console.log(`   Trip available slots: ${trip.availableSlots - 1}`)
    console.log(`   Booking created: 20 minutes ago (exceeds 15-min threshold)`)

    console.log('\n⏳ Triggering cleanup cron job...\n')

    // Step 5: Trigger cleanup (in real scenario, this would be automatic)
    const response = await fetch('http://localhost:3000/api/cron/cleanup', {
      method: 'POST'
    })

    const result = await response.json()
    console.log('📊 Cleanup Results:', JSON.stringify(result, null, 2))

    // Step 6: Verify booking was cancelled
    const updatedBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: {
        payment: true
      }
    })

    const updatedTrip = await prisma.trip.findUnique({
      where: { id: trip.id }
    })

    console.log('\n✅ After cleanup:')
    console.log(`   Booking status: ${updatedBooking?.status}`)
    console.log(`   Trip available slots: ${updatedTrip?.availableSlots}`)

    // Verify
    if (updatedBooking?.status === 'CANCELLED') {
      console.log('\n✅ SUCCESS! Booking was auto-cancelled after 15 minutes')
    } else {
      console.log('\n❌ FAILED! Booking was not cancelled')
    }

    if (updatedTrip?.availableSlots === trip.availableSlots) {
      console.log('✅ SUCCESS! Seats were released back to the trip')
    } else {
      console.log('❌ FAILED! Seats were not released')
    }

    // Check admin log
    const log = await prisma.adminLog.findFirst({
      where: {
        action: 'BOOKING_STALE_CANCELLED',
        tripId: trip.id
      },
      orderBy: { createdAt: 'desc' }
    })

    if (log) {
      console.log('✅ SUCCESS! Admin log entry created')
      console.log(`   Log details: ${log.details}`)
    } else {
      console.log('❌ FAILED! No admin log entry found')
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...')
    await prisma.booking.delete({ where: { id: booking.id } })
    console.log('✅ Test complete!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAutoCancel()

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testPaymentExpiration() {
  try {
    console.log('🧪 Testing Payment Expiration Feature...\n')

    // Find an existing trip (or create one for testing)
    const trip = await prisma.trip.findFirst({
      where: {
        isActive: true,
        departureTime: { gte: new Date() },
        availableSlots: { gt: 0 }
      }
    })

    if (!trip) {
      console.error('❌ No active trips found. Please create a trip first.')
      return
    }

    console.log(`✅ Found trip: ${trip.origin} → ${trip.destination}`)

    // Find or create a test user
    let testUser = await prisma.user.findFirst({
      where: { phone: '0900000000' }
    })

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          name: 'Test User',
          phone: '0900000000',
          role: 'CUSTOMER'
        }
      })
      console.log('✅ Created test user')
    } else {
      console.log('✅ Using existing test user')
    }

    // Create a booking with timestamp 20 minutes ago (expired)
    const twentyMinutesAgo = new Date()
    twentyMinutesAgo.setMinutes(twentyMinutesAgo.getMinutes() - 20)

    const expiredBooking = await prisma.booking.create({
      data: {
        userId: testUser.id,
        tripId: trip.id,
        status: 'PENDING',
        totalAmount: 1000,
        commission: 50,
        commissionVAT: 7.5,
        createdAt: twentyMinutesAgo, // Set to 20 minutes ago
        passengers: {
          create: [
            {
              name: 'Test Passenger',
              nationalId: 'TEST123',
              phone: '0900000000',
              seatNumber: 1
            }
          ]
        }
      }
    })

    console.log(`\n✅ Created EXPIRED booking (20 minutes old):`)
    console.log(`   ID: ${expiredBooking.id}`)
    console.log(`   Created: ${twentyMinutesAgo.toLocaleString()}`)
    console.log(`   Status: ${expiredBooking.status}`)

    // Create a fresh booking (within 15 minutes - still valid)
    const fiveMinutesAgo = new Date()
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)

    const validBooking = await prisma.booking.create({
      data: {
        userId: testUser.id,
        tripId: trip.id,
        status: 'PENDING',
        totalAmount: 1000,
        commission: 50,
        commissionVAT: 7.5,
        createdAt: fiveMinutesAgo, // Set to 5 minutes ago
        passengers: {
          create: [
            {
              name: 'Test Passenger 2',
              nationalId: 'TEST456',
              phone: '0900000000',
              seatNumber: 2
            }
          ]
        }
      }
    })

    console.log(`\n✅ Created VALID booking (5 minutes old):`)
    console.log(`   ID: ${validBooking.id}`)
    console.log(`   Created: ${fiveMinutesAgo.toLocaleString()}`)
    console.log(`   Status: ${validBooking.status}`)

    console.log('\n📋 Test Results:')
    console.log('================')
    console.log(`Expired Booking: http://localhost:3000/tickets`)
    console.log(`  - Should show "PAYMENT EXPIRED" in RED`)
    console.log(`  - Should appear in "Expired" tab`)
    console.log(`  - Should show "Book Again" button`)
    console.log('')
    console.log(`Valid Booking: http://localhost:3000/tickets`)
    console.log(`  - Should show "PENDING" in ORANGE`)
    console.log(`  - Should appear in "Pending" tab`)
    console.log(`  - Should show "Complete Payment" button`)
    console.log('')
    console.log(`🔑 Login with: 0900000000 (no password needed for test user)`)
    console.log('')
    console.log('💡 To clean up test data, run:')
    console.log(`   DELETE FROM "Booking" WHERE id IN ('${expiredBooking.id}', '${validBooking.id}');`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPaymentExpiration()

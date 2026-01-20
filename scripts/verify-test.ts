import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verify() {
  const testUser = await prisma.user.findFirst({
    where: { phone: '0900000000' }
  })

  if (!testUser) {
    console.log('❌ Test user not found. Run: npm run test-payment-expiration')
    return
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: testUser.id },
    include: { trip: true },
    orderBy: { createdAt: 'desc' }
  })

  console.log('✅ Test User Ready')
  console.log('   Phone: 0900000000')
  console.log('   Password: test123')
  console.log('')
  console.log(`📦 Test Bookings: ${bookings.length}`)

  const now = new Date()
  bookings.forEach((b, i) => {
    const ageMinutes = Math.floor((now.getTime() - new Date(b.createdAt).getTime()) / 60000)
    const isExpired = ageMinutes > 15
    console.log('')
    console.log(`Booking ${i + 1}: ${b.id}`)
    console.log(`  Trip: ${b.trip.origin} → ${b.trip.destination}`)
    console.log(`  Status: ${b.status}`)
    console.log(`  Created: ${new Date(b.createdAt).toLocaleString()}`)
    console.log(`  Age: ${ageMinutes} minutes`)
    console.log(`  Expected: ${isExpired ? '🔴 PAYMENT EXPIRED (RED)' : '🟠 PENDING (ORANGE)'}`)
  })

  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 TEST STEPS:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('1. Open: http://localhost:3000/login')
  console.log('2. Login: 0900000000 / test123')
  console.log('3. Click "My Tickets" or go to: http://localhost:3000/tickets')
  console.log('')
  console.log('✓ Check "Pending" tab - should have 1 booking (ORANGE)')
  console.log('✓ Check "Expired" tab - should have 1 booking (RED)')
  console.log('')
  console.log('Expected behavior:')
  console.log('  Expired: Red line, "PAYMENT EXPIRED" badge, "Book Again" button')
  console.log('  Pending: Orange line, "PENDING" badge, "Complete Payment" button')

  await prisma.$disconnect()
}

verify()

import prisma from '../src/lib/db'

async function main() {
  console.log('Testing stats API logic...\n')

  // Get Selam Bus admin
  const admin = await prisma.user.findFirst({
    where: { phone: '0922345678' }
  })

  if (!admin?.companyId) {
    console.log('❌ Admin has no company ID')
    return
  }

  console.log('👤 Testing for company ID:', admin.companyId)

  // Simulate the API logic
  const companyFilter = { companyId: admin.companyId }

  // Get total trips
  const totalTrips = await prisma.trip.count({
    where: companyFilter,
  })

  console.log('📊 Total Trips:', totalTrips)

  // Get active trips (future departures)
  const activeTrips = await prisma.trip.count({
    where: {
      ...companyFilter,
      departureTime: { gte: new Date() },
      isActive: true,
    },
  })

  console.log('📊 Active Trips (future + isActive):', activeTrips)

  // Check trips without filters
  const allTripsForCompany = await prisma.trip.findMany({
    where: companyFilter,
    select: {
      id: true,
      origin: true,
      destination: true,
      departureTime: true,
      isActive: true
    },
    take: 5
  })

  console.log('\n🔍 Sample trips for this company:')
  allTripsForCompany.forEach((t, i) => {
    const isPast = new Date(t.departureTime) < new Date()
    console.log(`  ${i+1}. ${t.origin} → ${t.destination}`)
    console.log(`     Departure: ${new Date(t.departureTime).toLocaleString()}`)
    console.log(`     Is Active: ${t.isActive}`)
    console.log(`     Is Past: ${isPast}`)
  })

  // Get bookings
  const bookingsData = await prisma.booking.aggregate({
    where: {
      trip: companyFilter,
      status: "PAID",
    },
    _count: true,
    _sum: {
      totalAmount: true,
    },
  })

  console.log('\n💰 Total Bookings (PAID):', bookingsData._count)
  console.log('💰 Total Revenue:', bookingsData._sum.totalAmount || 0)

  const stats = {
    totalTrips,
    activeTrips,
    totalBookings: bookingsData._count,
    totalRevenue: Number(bookingsData._sum.totalAmount) || 0,
  }

  console.log('\n📊 Final Stats Object:', JSON.stringify(stats, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

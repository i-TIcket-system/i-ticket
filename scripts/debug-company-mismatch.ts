import prisma from '../src/lib/db'

async function main() {
  console.log('🔍 Debugging Company ID Mismatch\n')

  // Get the admin user
  const admin = await prisma.user.findFirst({
    where: { phone: '0922345678' },
    include: { company: true }
  })

  console.log('👤 Admin User:')
  console.log('  Name:', admin?.name)
  console.log('  Email:', admin?.email)
  console.log('  Company ID:', admin?.companyId)
  console.log('  Company Name:', admin?.company?.name)

  // Get all companies
  const companies = await prisma.company.findMany({
    orderBy: { name: 'asc' }
  })

  console.log('\n🏢 All Companies:')
  companies.forEach(c => {
    console.log(`  ${c.name}: ${c.id}`)
  })

  // Get trip counts per company
  console.log('\n🚌 Trips per Company:')
  for (const company of companies) {
    const tripCount = await prisma.trip.count({
      where: { companyId: company.id }
    })
    console.log(`  ${company.name}: ${tripCount} trips (ID: ${company.id})`)
  }

  // Get vehicles per company
  console.log('\n🚗 Vehicles per Company:')
  for (const company of companies) {
    const vehicleCount = await prisma.vehicle.count({
      where: { companyId: company.id }
    })
    console.log(`  ${company.name}: ${vehicleCount} vehicles (ID: ${company.id})`)
  }

  // Get staff per company
  console.log('\n👥 Staff per Company:')
  for (const company of companies) {
    const staffCount = await prisma.user.count({
      where: { companyId: company.id, role: 'STAFF' }
    })
    console.log(`  ${company.name}: ${staffCount} staff (ID: ${company.id})`)
  }

  // Check if admin's companyId matches any trips
  if (admin?.companyId) {
    const adminCompanyTrips = await prisma.trip.count({
      where: { companyId: admin.companyId }
    })
    console.log(`\n⚠️  Admin's company (${admin.company?.name}) has ${adminCompanyTrips} trips`)

    if (adminCompanyTrips === 0) {
      console.log('❌ MISMATCH DETECTED: Admin company has NO trips!')
      console.log('   This explains why dashboard shows 0 trips')
    } else {
      console.log('✅ Admin company has trips - dashboard should work')
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

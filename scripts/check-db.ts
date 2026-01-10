import prisma from '../src/lib/db'

async function main() {
  console.log('Checking database...\n')

  const companies = await prisma.company.count()
  const trips = await prisma.trip.count()
  const users = await prisma.user.count()
  const vehicles = await prisma.vehicle.count()
  const staff = await prisma.user.count({ where: { role: 'STAFF' } })
  const customers = await prisma.user.count({ where: { role: 'CUSTOMER' } })

  console.log('📊 Database Counts:')
  console.log('  Companies:', companies)
  console.log('  Trips:', trips)
  console.log('  Users:', users)
  console.log('    - Customers:', customers)
  console.log('    - Staff:', staff)
  console.log('  Vehicles:', vehicles)

  if (companies === 0) {
    console.log('\n❌ Database is empty! Run: npx tsx prisma/seed.ts')
  } else {
    console.log('\n✅ Database has data')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

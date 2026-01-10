import prisma from '../src/lib/db'

async function main() {
  // Check admin user
  const admin = await prisma.user.findFirst({
    where: { phone: '0922345678' },
    include: { company: true }
  })

  console.log('=== ADMIN USER ===')
  console.log('Name:', admin?.name)
  console.log('Email:', admin?.email)
  console.log('Company:', admin?.company?.name)
  console.log('Company ID:', admin?.companyId)

  if (admin?.companyId) {
    // Check vehicles for this company
    const vehicles = await prisma.vehicle.findMany({
      where: { companyId: admin.companyId }
    })

    console.log('\n=== VEHICLES FOR COMPANY ===')
    console.log('Total:', vehicles.length)
    vehicles.forEach(v => {
      console.log(`  - ${v.plateNumber} (${v.sideNumber}) - ${v.make} ${v.model} - ${v.busType}`)
    })

    // Check staff for this company
    const staff = await prisma.user.findMany({
      where: {
        companyId: admin.companyId,
        role: 'STAFF'
      }
    })

    console.log('\n=== STAFF FOR COMPANY ===')
    console.log('Total:', staff.length)
    staff.forEach(s => {
      console.log(`  - ${s.name} (${s.staffRole}) - ${s.phone}`)
    })

    // Check trips for this company
    const trips = await prisma.trip.findMany({
      where: { companyId: admin.companyId },
      take: 10
    })

    console.log('\n=== TRIPS FOR COMPANY (showing first 10) ===')
    console.log('Total trips:', await prisma.trip.count({ where: { companyId: admin.companyId } }))
    trips.forEach(t => {
      console.log(`  - ${t.origin} → ${t.destination} on ${new Date(t.departureTime).toLocaleDateString()}`)
    })
  }

  // Check all companies
  const allCompanies = await prisma.company.findMany()
  console.log('\n=== ALL COMPANIES ===')
  allCompanies.forEach(c => {
    console.log(`  - ${c.name} (${c.id})`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

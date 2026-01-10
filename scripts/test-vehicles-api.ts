import prisma from '../src/lib/db'

async function main() {
  // Get Selam Bus company
  const company = await prisma.company.findFirst({
    where: { name: 'Selam Bus' }
  })

  if (!company) {
    console.log('❌ Company not found')
    return
  }

  console.log('🏢 Testing Vehicles API for:', company.name)
  console.log('Company ID:', company.id)

  // Simulate what the API does
  const vehicles = await prisma.vehicle.findMany({
    where: { companyId: company.id },
    include: {
      _count: {
        select: { trips: true }
      },
      trips: {
        where: {
          departureTime: {
            gte: new Date() // Only upcoming trips
          },
          isActive: true
        },
        select: {
          id: true,
          origin: true,
          destination: true,
          departureTime: true
        },
        orderBy: {
          departureTime: 'asc'
        },
        take: 1 // Next upcoming trip
      }
    },
    orderBy: [
      { status: 'asc' },
      { plateNumber: 'asc' }
    ]
  })

  console.log('\n📊 API Response:')
  console.log('Total vehicles:', vehicles.length)

  vehicles.forEach((v, i) => {
    console.log(`\n🚌 Vehicle ${i + 1}:`)
    console.log('  Plate:', v.plateNumber)
    console.log('  Side:', v.sideNumber)
    console.log('  Make/Model:', v.make, v.model)
    console.log('  Year:', v.year)
    console.log('  Bus Type:', v.busType)
    console.log('  Total Seats:', v.totalSeats)
    console.log('  Status:', v.status)
    console.log('  Total Trips:', v._count.trips)
    console.log('  Next Trip:', v.trips[0] ? `${v.trips[0].origin} → ${v.trips[0].destination} on ${new Date(v.trips[0].departureTime).toLocaleDateString()}` : 'None')
  })

  // Check for any issues with bus types
  console.log('\n🔍 Checking for bus type compatibility:')
  const busTypes = vehicles.map(v => v.busType)
  const validTypes = ['MINI', 'STANDARD', 'LUXURY']
  const invalidTypes = busTypes.filter(t => !validTypes.includes(t))

  if (invalidTypes.length > 0) {
    console.log('❌ Invalid bus types found:', invalidTypes)
  } else {
    console.log('✅ All bus types are valid')
  }

  console.log('\n✅ Test completed successfully!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

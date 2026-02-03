/**
 * Fix current staff status for DEPARTED trips
 * One-time script to update staff who are on active trips
 */

import prisma from '../src/lib/db'

async function main() {
  console.log('Finding DEPARTED trips...')

  const departedTrips = await prisma.trip.findMany({
    where: { status: 'DEPARTED' },
    select: {
      id: true,
      origin: true,
      destination: true,
      driverId: true,
      conductorId: true,
      driver: { select: { name: true, staffStatus: true } },
      conductor: { select: { name: true, staffStatus: true } }
    }
  })

  console.log(`Found ${departedTrips.length} DEPARTED trip(s)\n`)

  for (const trip of departedTrips) {
    console.log(`Trip: ${trip.origin} → ${trip.destination}`)
    if (trip.driver) {
      console.log(`  Driver: ${trip.driver.name} (${trip.driver.staffStatus})`)
    }
    if (trip.conductor) {
      console.log(`  Conductor: ${trip.conductor.name} (${trip.conductor.staffStatus})`)
    }

    const staffIds = [trip.driverId, trip.conductorId].filter((id): id is string => !!id)

    if (staffIds.length > 0) {
      const result = await prisma.user.updateMany({
        where: {
          id: { in: staffIds },
          staffStatus: { not: 'ON_LEAVE' }
        },
        data: { staffStatus: 'ON_TRIP' }
      })
      console.log(`  → Updated ${result.count} staff to ON_TRIP\n`)
    }
  }

  console.log('Done!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

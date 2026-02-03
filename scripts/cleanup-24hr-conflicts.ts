/**
 * Cleanup 24-Hour Conflicts
 *
 * RULE-005: Same vehicle/driver/conductor cannot be scheduled within 24 hours
 *
 * This script finds and removes trips that violate this rule,
 * keeping the FIRST trip of each conflict pair.
 *
 * Run: npx tsx scripts/cleanup-24hr-conflicts.ts
 */

import prisma from '../src/lib/db'

async function main() {
  console.log('🔍 Finding trips with 24-hour conflicts (RULE-005)...\n')

  // Get all active trips ordered by creation time (keep older ones)
  const trips = await prisma.trip.findMany({
    where: {
      status: { notIn: ['CANCELLED', 'COMPLETED'] }
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      companyId: true,
      origin: true,
      destination: true,
      departureTime: true,
      driverId: true,
      conductorId: true,
      vehicleId: true,
      createdAt: true,
    }
  })

  console.log(`📊 Total active trips: ${trips.length}\n`)

  // Track which resources are used on which days
  // Key: "type-resourceId-YYYY-MM-DD", Value: tripId (first one wins)
  const resourceUsage = new Map<string, string>()
  const tripsToDelete: string[] = []
  const conflictDetails: string[] = []

  for (const trip of trips) {
    const dateKey = trip.departureTime.toISOString().split('T')[0]
    let hasConflict = false
    let conflictType = ''

    // Check driver
    if (trip.driverId) {
      const driverKey = `driver-${trip.driverId}-${dateKey}`
      if (resourceUsage.has(driverKey)) {
        hasConflict = true
        conflictType = 'Driver'
      } else {
        resourceUsage.set(driverKey, trip.id)
      }
    }

    // Check conductor
    if (trip.conductorId) {
      const conductorKey = `conductor-${trip.conductorId}-${dateKey}`
      if (resourceUsage.has(conductorKey)) {
        hasConflict = true
        conflictType = conflictType ? conflictType + '+Conductor' : 'Conductor'
      } else {
        resourceUsage.set(conductorKey, trip.id)
      }
    }

    // Check vehicle
    if (trip.vehicleId) {
      const vehicleKey = `vehicle-${trip.vehicleId}-${dateKey}`
      if (resourceUsage.has(vehicleKey)) {
        hasConflict = true
        conflictType = conflictType ? conflictType + '+Vehicle' : 'Vehicle'
      } else {
        resourceUsage.set(vehicleKey, trip.id)
      }
    }

    if (hasConflict) {
      tripsToDelete.push(trip.id)
      conflictDetails.push(`  ${dateKey} | ${trip.origin} → ${trip.destination} | ${conflictType}`)
    }
  }

  console.log(`⚠️  Found ${tripsToDelete.length} trips with conflicts:\n`)

  if (conflictDetails.length > 0) {
    // Show first 20 conflicts
    conflictDetails.slice(0, 20).forEach(d => console.log(d))
    if (conflictDetails.length > 20) {
      console.log(`  ... and ${conflictDetails.length - 20} more`)
    }
  }

  if (tripsToDelete.length > 0) {
    console.log(`\n🗑️  Deleting ${tripsToDelete.length} conflicting trips...`)

    // First delete related records
    const deletedPassengers = await prisma.passenger.deleteMany({
      where: { booking: { tripId: { in: tripsToDelete } } }
    })
    console.log(`   Deleted ${deletedPassengers.count} passengers`)

    const deletedTickets = await prisma.ticket.deleteMany({
      where: { booking: { tripId: { in: tripsToDelete } } }
    })
    console.log(`   Deleted ${deletedTickets.count} tickets`)

    const deletedBookings = await prisma.booking.deleteMany({
      where: { tripId: { in: tripsToDelete } }
    })
    console.log(`   Deleted ${deletedBookings.count} bookings`)

    const deletedTrips = await prisma.trip.deleteMany({
      where: { id: { in: tripsToDelete } }
    })
    console.log(`   Deleted ${deletedTrips.count} trips`)

    console.log('\n✅ Cleanup complete!')
  } else {
    console.log('\n✅ No conflicts found - database is clean!')
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

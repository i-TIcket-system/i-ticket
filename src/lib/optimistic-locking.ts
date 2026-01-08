/**
 * P3: Optimistic Locking Utility
 *
 * Prevents concurrent update conflicts using version field.
 * When two users try to update the same record simultaneously,
 * only the first update succeeds. The second update fails with
 * a version mismatch error.
 *
 * How it works:
 * 1. Read record with current version
 * 2. User makes changes
 * 3. Update only if version hasn't changed
 * 4. Increment version on successful update
 */

import { Prisma } from '@prisma/client'

export class OptimisticLockError extends Error {
  constructor(message: string = 'Record was modified by another user. Please refresh and try again.') {
    super(message)
    this.name = 'OptimisticLockError'
  }
}

/**
 * Update a Trip with optimistic locking
 *
 * @param tx - Prisma transaction client
 * @param tripId - ID of trip to update
 * @param currentVersion - Version from when the data was read
 * @param updateData - Data to update
 * @returns Updated trip
 * @throws OptimisticLockError if version mismatch
 */
export async function updateTripWithLocking(
  tx: Prisma.TransactionClient,
  tripId: string,
  currentVersion: number,
  updateData: Prisma.TripUpdateInput
) {
  // CRITICAL: Update only if version matches (optimistic locking)
  const result = await tx.trip.updateMany({
    where: {
      id: tripId,
      version: currentVersion, // Only update if version hasn't changed
    },
    data: {
      ...updateData,
      version: {
        increment: 1, // Increment version on successful update
      },
    },
  })

  // If count is 0, version mismatch occurred (concurrent update)
  if (result.count === 0) {
    // Check if trip exists or if it was a version conflict
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      select: { id: true, version: true },
    })

    if (!trip) {
      throw new Error('Trip not found')
    }

    // Version mismatch - another user updated the record
    throw new OptimisticLockError(
      `Trip was modified by another user (expected version ${currentVersion}, current version ${trip.version}). Please refresh and try again.`
    )
  }

  // Return updated trip
  return await tx.trip.findUnique({
    where: { id: tripId },
  })
}

/**
 * Helper to get trip with version for optimistic locking
 *
 * @param tx - Prisma transaction client or prisma instance
 * @param tripId - ID of trip to fetch
 * @returns Trip with version field
 */
export async function getTripWithVersion(
  tx: Prisma.TransactionClient | any,
  tripId: string
) {
  return await tx.trip.findUnique({
    where: { id: tripId },
    select: {
      id: true,
      version: true,
      companyId: true,
      origin: true,
      destination: true,
      route: true,
      intermediateStops: true,
      departureTime: true,
      estimatedDuration: true,
      distance: true,
      price: true,
      busType: true,
      totalSlots: true,
      availableSlots: true,
      hasWater: true,
      hasFood: true,
      isActive: true,
      lowSlotAlertSent: true,
      bookingHalted: true,
      adminResumedFromAutoHalt: true,
      reportGenerated: true,
      driverId: true,
      conductorId: true,
      manualTicketerId: true,
      vehicleId: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

/**
 * Example usage:
 *
 * ```typescript
 * import { transactionWithTimeout } from '@/lib/db'
 * import { updateTripWithLocking, getTripWithVersion, OptimisticLockError } from '@/lib/optimistic-locking'
 *
 * // In your API route:
 * try {
 *   const result = await transactionWithTimeout(async (tx) => {
 *     // 1. Get trip with current version
 *     const trip = await getTripWithVersion(tx, tripId)
 *     if (!trip) throw new Error('Trip not found')
 *
 *     // 2. Perform business logic validations...
 *     if (trip.price !== updateData.price) {
 *       // Check if price can be changed...
 *     }
 *
 *     // 3. Update with optimistic locking
 *     const updatedTrip = await updateTripWithLocking(tx, tripId, trip.version, {
 *       price: updateData.price,
 *       totalSlots: updateData.totalSlots,
 *     })
 *
 *     return updatedTrip
 *   })
 *
 *   return NextResponse.json({ success: true, trip: result })
 * } catch (error) {
 *   if (error instanceof OptimisticLockError) {
 *     return NextResponse.json(
 *       { error: error.message },
 *       { status: 409 } // 409 Conflict
 *     )
 *   }
 *   throw error
 * }
 * ```
 */

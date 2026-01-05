import prisma from "@/lib/db"

interface TripUpdateValidation {
  allowed: boolean
  blockedFields: string[]
  paidBookingCount: number
  reason?: string
}

// Immutable fields once bookings are paid
const PROTECTED_FIELDS = ['price', 'totalSlots', 'busType', 'departureTime']

/**
 * Validate if trip update is allowed based on business rules
 * RULE: Once paid bookings exist, price/totalSlots/busType/departureTime are IMMUTABLE
 */
export async function validateTripUpdate(
  tripId: string,
  updateFields: Record<string, any>
): Promise<TripUpdateValidation> {
  // Check if trip has paid bookings
  const paidBookingCount = await prisma.booking.count({
    where: {
      tripId,
      status: 'PAID'
    }
  })

  const hasPaidBookings = paidBookingCount > 0
  const blockedFields: string[] = []

  if (hasPaidBookings) {
    // Check if any protected fields are being updated
    for (const field of PROTECTED_FIELDS) {
      if (updateFields[field] !== undefined) {
        blockedFields.push(field)
      }
    }
  }

  // totalSlots can only be INCREASED (never decreased) even without bookings
  if (updateFields.totalSlots !== undefined) {
    const currentTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { totalSlots: true, availableSlots: true }
    })

    if (currentTrip && updateFields.totalSlots < currentTrip.totalSlots) {
      blockedFields.push('totalSlots')
      return {
        allowed: false,
        blockedFields,
        paidBookingCount,
        reason: 'Cannot decrease total slots (would invalidate existing bookings)'
      }
    }
  }

  if (blockedFields.length > 0) {
    return {
      allowed: false,
      blockedFields,
      paidBookingCount,
      reason: `Cannot modify [${blockedFields.join(', ')}] after bookings are paid. Contact Super Admin for assistance.`
    }
  }

  return {
    allowed: true,
    blockedFields: [],
    paidBookingCount
  }
}

import prisma from "@/lib/db"

interface StaffConflictResult {
  conflicts: string[]
  hasConflicts: boolean
}

/**
 * Check for 24-hour staff/vehicle scheduling conflicts.
 * Shared utility used by both trip creation (POST) and trip edit (PUT).
 *
 * @param departureTime - The trip's departure time
 * @param driverId - Driver to check (null = skip)
 * @param conductorId - Conductor to check (null = skip)
 * @param manualTicketerId - Ticketer to check (null = skip)
 * @param excludeTripId - Exclude this trip from checks (used when editing)
 */
export async function checkStaffConflicts(
  departureTime: Date,
  driverId: string | null | undefined,
  conductorId: string | null | undefined,
  manualTicketerId: string | null | undefined,
  excludeTripId?: string
): Promise<StaffConflictResult> {
  const conflicts: string[] = []
  const timeWindow = 24 * 60 * 60 * 1000 // 24 hours in ms

  const baseWhere = {
    isActive: true,
    departureTime: {
      gte: new Date(departureTime.getTime() - timeWindow),
      lte: new Date(departureTime.getTime() + timeWindow),
    },
    ...(excludeTripId ? { id: { not: excludeTripId } } : {}),
  }

  // Check driver conflicts
  if (driverId) {
    const driverConflict = await prisma.trip.findFirst({
      where: { ...baseWhere, driverId },
      select: {
        id: true,
        origin: true,
        destination: true,
        departureTime: true,
        driver: { select: { name: true } },
      },
    })

    if (driverConflict) {
      conflicts.push(
        `Driver ${driverConflict.driver?.name} has a trip within 24 hours: ${driverConflict.origin} → ${driverConflict.destination} on ${driverConflict.departureTime.toLocaleString()}`
      )
    }
  }

  // Check conductor conflicts
  if (conductorId) {
    const conductorConflict = await prisma.trip.findFirst({
      where: { ...baseWhere, conductorId },
      select: {
        id: true,
        origin: true,
        destination: true,
        departureTime: true,
        conductor: { select: { name: true } },
      },
    })

    if (conductorConflict) {
      conflicts.push(
        `Conductor ${conductorConflict.conductor?.name} has a trip within 24 hours: ${conductorConflict.origin} → ${conductorConflict.destination} on ${conductorConflict.departureTime.toLocaleString()}`
      )
    }
  }

  // Check manual ticketer conflicts
  if (manualTicketerId) {
    const ticketerConflict = await prisma.trip.findFirst({
      where: { ...baseWhere, manualTicketerId },
      select: {
        id: true,
        origin: true,
        destination: true,
        departureTime: true,
        manualTicketer: { select: { name: true } },
      },
    })

    if (ticketerConflict) {
      conflicts.push(
        `Manual Ticketer ${ticketerConflict.manualTicketer?.name} has a trip within 24 hours: ${ticketerConflict.origin} → ${ticketerConflict.destination} on ${ticketerConflict.departureTime.toLocaleString()}`
      )
    }
  }

  return { conflicts, hasConflicts: conflicts.length > 0 }
}

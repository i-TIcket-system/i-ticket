/**
 * Helper function to sort trips by status priority and departure time
 *
 * Status Priority (lower = higher priority, appears first):
 * 1. SCHEDULED - Active upcoming trips
 * 2. BOARDING - Active boarding trips
 * 3. DEPARTED - In progress
 * 4. COMPLETED - Finished trips
 * 5. CANCELLED - Cancelled trips
 *
 * Time ordering is smart by default:
 * - Future/active trips (SCHEDULED, BOARDING): ascending (soonest first)
 * - Past trips (DEPARTED, COMPLETED, CANCELLED): descending (most recent first)
 */

export const TRIP_STATUS_PRIORITY: Record<string, number> = {
  SCHEDULED: 1,
  BOARDING: 2,
  DEPARTED: 3,
  COMPLETED: 4,
  CANCELLED: 5,
};

// Statuses where ascending time makes sense (soonest first)
const FUTURE_STATUSES = new Set(['SCHEDULED', 'BOARDING']);

export function sortTripsByStatusAndTime<T extends { status: string; departureTime: Date | string }>(
  trips: T[],
  timeOrder: 'asc' | 'desc' | 'smart' = 'smart'
): T[] {
  return trips.sort((a, b) => {
    // First, sort by status priority
    const priorityA = TRIP_STATUS_PRIORITY[a.status] ?? 999;
    const priorityB = TRIP_STATUS_PRIORITY[b.status] ?? 999;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // If same status, sort by departure time
    const timeA = new Date(a.departureTime).getTime();
    const timeB = new Date(b.departureTime).getTime();

    if (timeOrder === 'smart') {
      // Smart ordering: future trips ascending, past trips descending
      const isFutureStatus = FUTURE_STATUSES.has(a.status);
      return isFutureStatus ? timeA - timeB : timeB - timeA;
    }

    return timeOrder === 'asc' ? timeA - timeB : timeB - timeA;
  });
}

/**
 * Trip Status Helper Functions
 *
 * Business Logic:
 * - DEPARTED, COMPLETED, CANCELLED trips are VIEW-ONLY (read-only)
 * - DELAYED trips can still be edited and accept bookings
 * - Only exception: DEPARTED can transition to COMPLETED
 */

export const FINAL_TRIP_STATUSES = ["DEPARTED", "COMPLETED", "CANCELLED"] as const;
export const EDITABLE_TRIP_STATUSES = ["SCHEDULED", "DELAYED", "BOARDING"] as const;

export type FinalTripStatus = typeof FINAL_TRIP_STATUSES[number];
export type EditableTripStatus = typeof EDITABLE_TRIP_STATUSES[number];
export type TripStatus = FinalTripStatus | EditableTripStatus;

/**
 * Check if a trip is sold out (no available seats)
 *
 * @param trip - Trip object with availableSlots
 * @returns true if trip has no available seats
 */
export function isTripSoldOut(trip: { availableSlots: number }): boolean {
  return trip.availableSlots === 0;
}

/**
 * Check if a trip is in view-only mode (cannot be modified)
 *
 * A trip is view-only if:
 * - Status is DEPARTED, COMPLETED, or CANCELLED
 * - Trip is sold out (availableSlots === 0)
 *
 * @param status - Current trip status
 * @param availableSlots - Optional number of available slots (for sold-out check)
 * @returns true if trip is view-only
 */
export function isTripViewOnly(status: string, availableSlots?: number): boolean {
  if (FINAL_TRIP_STATUSES.includes(status as FinalTripStatus)) return true;
  if (availableSlots !== undefined && availableSlots === 0) return true;
  return false;
}

/**
 * Check if a trip can be edited (SCHEDULED or BOARDING)
 *
 * @param status - Current trip status
 * @returns true if trip can be edited
 */
export function isTripEditable(status: string): boolean {
  return EDITABLE_TRIP_STATUSES.includes(status as EditableTripStatus);
}

/**
 * Check if manual ticket sales are allowed
 * Only SCHEDULED and BOARDING trips allow manual sales
 *
 * @param status - Current trip status
 * @returns true if manual ticket sales are allowed
 */
export function canSellManualTickets(status: string): boolean {
  return EDITABLE_TRIP_STATUSES.includes(status as EditableTripStatus);
}

/**
 * Get user-friendly message for view-only trips
 *
 * @param status - Current trip status
 * @returns Message explaining why trip is view-only
 */
export function getViewOnlyMessage(status: string): string {
  switch (status) {
    case "DEPARTED":
      return "Trip has departed. Only status can be changed to COMPLETED.";
    case "COMPLETED":
      return "Trip is completed. All details are read-only for record keeping.";
    case "CANCELLED":
      return "Trip was cancelled. All details are read-only for record keeping.";
    default:
      return "This trip cannot be modified.";
  }
}

/**
 * Get user-friendly message for delayed trips
 *
 * @param delayReason - The reason code for the delay
 * @returns Human-readable delay reason
 */
export function getDelayReasonLabel(delayReason: string | null): string {
  const reasons: Record<string, string> = {
    TRAFFIC: "Traffic",
    BREAKDOWN: "Breakdown",
    WEATHER: "Weather",
    WAITING_PASSENGERS: "Waiting for passengers",
    OTHER: "Other",
  };
  return delayReason ? reasons[delayReason] || delayReason : "Unknown";
}

/**
 * Check if replacement tickets can be sold for this trip
 * Only DEPARTED trips allow replacement ticket sales for no-show seats
 */
export function canSellReplacementTickets(status: string): boolean {
  return status === "DEPARTED"
}

/**
 * Get allowed status transitions for a trip
 *
 * @param currentStatus - Current trip status
 * @returns Array of allowed status transitions
 */
export function getAllowedStatusTransitions(currentStatus: string): string[] {
  const transitions: Record<string, string[]> = {
    SCHEDULED: ["DELAYED", "BOARDING", "CANCELLED"],
    DELAYED: ["BOARDING", "DEPARTED", "CANCELLED"], // Can board, depart, or cancel from delayed
    BOARDING: ["DEPARTED", "CANCELLED"],
    DEPARTED: ["COMPLETED"],
    COMPLETED: [], // Final state
    CANCELLED: [], // Final state
  };

  return transitions[currentStatus] || [];
}

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
 * Check if a trip is in view-only mode (cannot be modified)
 *
 * @param status - Current trip status
 * @returns true if trip is view-only (DEPARTED, COMPLETED, CANCELLED)
 */
export function isTripViewOnly(status: string): boolean {
  return FINAL_TRIP_STATUSES.includes(status as FinalTripStatus);
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

/**
 * Notification Priority System
 *
 * Automatically assigns priority levels to notifications based on type and context
 *
 * Priority Levels:
 * 4 = URGENT   - Requires immediate attention (red, always visible, desktop notification)
 * 3 = HIGH     - Important but not urgent (orange, grouped if similar)
 * 2 = NORMAL   - Routine updates (default, grouped)
 * 1 = LOW      - Informational only (gray, activity feed only)
 */

export interface NotificationContext {
  // Trip context
  tripStatus?: string
  slotsRemaining?: number
  departureTime?: Date

  // Work order context
  workOrderStatus?: string
  workOrderPriority?: string

  // Staff context
  staffRole?: string
  isReassignment?: boolean

  // Message context
  mentionsAdmin?: boolean
  isSystemGenerated?: boolean

  // General
  entityType?: string
}

export type NotificationType =
  | 'TRIP_ASSIGNMENT'
  | 'TRIP_REASSIGNMENT'
  | 'TRIP_MESSAGE'
  | 'TRIP_STATUS_CHANGE'
  | 'TRIP_CANCELLED'
  | 'TRIP_HALTED'
  | 'TRIP_RESUMED'
  | 'LOW_SLOT_WARNING'
  | 'WORK_ORDER_MESSAGE'
  | 'WORK_ORDER_STATUS_CHANGE'
  | 'WORK_ORDER_BLOCKED'
  | 'MAINTENANCE_DUE'
  | 'MAINTENANCE_OVERDUE'
  | 'STAFF_MESSAGE'
  | 'STAFF_REASSIGNMENT'
  | 'BOOKING_NEW'
  | 'BOOKING_PAID'
  | 'BOOKING_CANCELLED'
  | 'SYSTEM_ALERT'
  | 'SYSTEM_INFO'
  | 'EMERGENCY_ALERT'
  | 'AUDIT_LOG'

/**
 * Calculate notification priority based on type and context
 */
export function calculateNotificationPriority(
  type: NotificationType,
  context: NotificationContext = {}
): number {
  // ========== URGENT (4) - Requires immediate attention ==========
  // These notifications need instant action and should never be grouped

  if (type === 'TRIP_CANCELLED') {
    return 4 // Trip cancellation affects many passengers
  }

  if (type === 'EMERGENCY_ALERT') {
    return 4 // Emergency situations
  }

  if (type === 'WORK_ORDER_BLOCKED') {
    return 4 // Vehicle blocked = trip impact
  }

  if (type === 'MAINTENANCE_OVERDUE') {
    return 4 // Safety critical
  }

  if (context.mentionsAdmin) {
    return 4 // Direct @mentions need immediate attention
  }

  if (type === 'LOW_SLOT_WARNING' && context.slotsRemaining !== undefined && context.slotsRemaining <= 2) {
    return 4 // Critical low slots (2 or fewer seats)
  }

  // ========== HIGH (3) - Important but not urgent ==========
  // These should be addressed soon but can be grouped if similar

  if (type === 'TRIP_STATUS_CHANGE') {
    // Status changes to DEPARTED or COMPLETED are important
    if (context.tripStatus === 'DEPARTED' || context.tripStatus === 'COMPLETED') {
      return 3
    }
    return 2 // Other status changes are normal
  }

  if (type === 'TRIP_REASSIGNMENT' || type === 'STAFF_REASSIGNMENT') {
    return 3 // Staff changes need oversight
  }

  if (type === 'TRIP_HALTED') {
    return 3 // Booking halted = important
  }

  if (type === 'MAINTENANCE_DUE') {
    return 3 // Upcoming maintenance needs planning
  }

  if (type === 'LOW_SLOT_WARNING' && context.slotsRemaining !== undefined && context.slotsRemaining <= 5) {
    return 3 // Low slots warning (3-5 seats)
  }

  if (type === 'WORK_ORDER_STATUS_CHANGE') {
    // BLOCKED status is handled above as URGENT
    // COMPLETED status is important to know
    if (context.workOrderStatus === 'COMPLETED') {
      return 3
    }
    return 2 // Other status changes are normal
  }

  // ========== NORMAL (2) - Routine updates ==========
  // Day-to-day operations, can be grouped

  if (type === 'TRIP_MESSAGE' || type === 'WORK_ORDER_MESSAGE' || type === 'STAFF_MESSAGE') {
    return 2 // Chat messages are routine
  }

  if (type === 'TRIP_ASSIGNMENT') {
    return 2 // Initial assignment is routine
  }

  if (type === 'TRIP_RESUMED') {
    return 2 // Booking resumed after halt
  }

  if (type === 'BOOKING_NEW' || type === 'BOOKING_PAID') {
    return 2 // New bookings are good news but routine
  }

  if (type === 'BOOKING_CANCELLED') {
    return 2 // Cancellations happen, not urgent
  }

  if (type === 'LOW_SLOT_WARNING' && context.slotsRemaining !== undefined && context.slotsRemaining > 5) {
    return 2 // Normal slot warning (6+ seats)
  }

  // ========== LOW (1) - Informational only ==========
  // Background activity, shown in activity feed but not notification bell

  if (type === 'AUDIT_LOG') {
    return 1 // Audit logs are for record-keeping
  }

  if (type === 'SYSTEM_INFO') {
    return 1 // System informational messages
  }

  if (context.isSystemGenerated && !type.includes('ALERT')) {
    return 1 // Auto-generated non-alert notifications
  }

  // Default to NORMAL for any unhandled types
  return 2
}

/**
 * Get priority label for display
 */
export function getPriorityLabel(priority: number): string {
  switch (priority) {
    case 4:
      return 'Urgent'
    case 3:
      return 'High'
    case 2:
      return 'Normal'
    case 1:
      return 'Low'
    default:
      return 'Normal'
  }
}

/**
 * Get priority color for UI
 */
export function getPriorityColor(priority: number): string {
  switch (priority) {
    case 4:
      return 'text-red-600 dark:text-red-400'
    case 3:
      return 'text-orange-600 dark:text-orange-400'
    case 2:
      return 'text-blue-600 dark:text-blue-400'
    case 1:
      return 'text-gray-500 dark:text-gray-400'
    default:
      return 'text-blue-600 dark:text-blue-400'
  }
}

/**
 * Get priority icon (emoji) for UI
 */
export function getPriorityIcon(priority: number): string {
  switch (priority) {
    case 4:
      return '🚨' // Urgent
    case 3:
      return '⚠️' // High
    case 2:
      return '📋' // Normal
    case 1:
      return 'ℹ️' // Low
    default:
      return '📋'
  }
}

/**
 * Check if notification should show desktop notification
 */
export function shouldShowDesktopNotification(priority: number): boolean {
  return priority >= 4 // Only URGENT notifications
}

/**
 * Check if notification should make a sound
 */
export function shouldPlaySound(priority: number): boolean {
  return priority >= 4 // Only URGENT notifications
}

/**
 * Check if notification should be grouped
 */
export function shouldGroupNotification(priority: number, type: NotificationType): boolean {
  // Never group URGENT notifications
  if (priority >= 4) {
    return false
  }

  // Don't group trip cancellations or emergency alerts
  if (type === 'TRIP_CANCELLED' || type === 'EMERGENCY_ALERT') {
    return false
  }

  // Group everything else
  return true
}

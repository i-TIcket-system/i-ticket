/**
 * Notification templates for different event types
 */

export type NotificationType =
  | "TRIP_ASSIGNED"
  | "TRIP_UNASSIGNED"
  | "TRIP_MESSAGE"
  | "BOOKING_NEW"
  | "BOOKING_PAID"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "TRIP_HALTED"
  | "TRIP_AUTO_HALTED"
  | "TRIP_RESUMED"
  | "COMMISSION_EARNED"
  | "REFERRAL_NEW"
  | "PAYOUT_PROCESSED"
  | "LOW_SLOT_ALERT"
  | "MANIFEST_AUTO_GENERATED"
  | "SYSTEM_ALERT"
  // Work Order notifications
  | "WORK_ORDER_CREATED"
  | "WORK_ORDER_ASSIGNED"
  | "WORK_ORDER_STATUS_CHANGED"
  | "WORK_ORDER_MESSAGE"
  | "WORK_ORDER_COMPLETED"
  | "WORK_ORDER_URGENT"
  | "WORK_ORDER_PARTS_REQUESTED"

export type NotificationPriority = 1 | 2 | 3 | 4 // 1=Low, 2=Normal, 3=High, 4=Urgent

export interface NotificationTemplate {
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
}

export interface NotificationData {
  // Trip-related
  tripId?: string
  tripRoute?: string
  departureTime?: string

  // Booking-related
  bookingId?: string
  seatNumbers?: number[]
  amount?: number

  // Company-related
  companyId?: string
  companyName?: string

  // Staff-related
  staffName?: string
  role?: string
  assignedBy?: string

  // Sales-related
  referralCode?: string
  commission?: number

  // Message-related
  senderName?: string
  messagePreview?: string

  // Work Order-related
  workOrderId?: string
  workOrderNumber?: string
  vehiclePlate?: string
  taskType?: string
  workOrderStatus?: string
  priority?: number
  partName?: string
  quantity?: number
  mechanicName?: string

  // Generic
  reason?: string
  availableSlots?: number
}

/**
 * Generate notification content from template
 */
export function generateNotification(
  type: NotificationType,
  data: NotificationData
): NotificationTemplate {
  switch (type) {
    // Trip Assignment Notifications
    case "TRIP_ASSIGNED":
      return {
        type,
        title: "New Trip Assignment",
        message: `You have been assigned to ${data.tripRoute || "a trip"} departing ${data.departureTime || "soon"}.`,
        priority: 3, // High
      }

    case "TRIP_UNASSIGNED":
      return {
        type,
        title: "Trip Unassignment",
        message: `You have been removed from ${data.tripRoute || "a trip"}.`,
        priority: 2, // Normal
      }

    // Message Notifications
    case "TRIP_MESSAGE":
      return {
        type,
        title: `Message from ${data.senderName || "Team"}`,
        message: data.messagePreview || "You have a new message regarding your trip.",
        priority: 2, // Normal
      }

    // Booking Notifications
    case "BOOKING_NEW":
      return {
        type,
        title: "New Booking",
        message: `New booking for ${data.tripRoute || "a trip"}: ${data.seatNumbers?.length || 1} seat(s).`,
        priority: 2, // Normal
      }

    case "BOOKING_PAID":
      return {
        type,
        title: "Payment Received",
        message: `Payment of ${data.amount ? `ETB ${data.amount.toLocaleString()}` : "payment"} received for ${data.tripRoute || "booking"}.`,
        priority: 2, // Normal
      }

    case "BOOKING_CONFIRMED":
      return {
        type,
        title: "Booking Confirmed",
        message: `Your booking for ${data.tripRoute || "trip"} is confirmed! Seats: ${data.seatNumbers?.join(", ") || "assigned"}.`,
        priority: 3, // High
      }

    case "BOOKING_CANCELLED":
      return {
        type,
        title: "Booking Cancelled",
        message: `Booking for ${data.tripRoute || "trip"} has been cancelled.`,
        priority: 2, // Normal
      }

    // Trip Control Notifications
    case "TRIP_HALTED":
      return {
        type,
        title: "Trip Bookings Halted",
        message: `Bookings halted for ${data.tripRoute || "trip"}${data.reason ? `: ${data.reason}` : "."}`,
        priority: 3, // High
      }

    case "TRIP_AUTO_HALTED":
      return {
        type,
        title: "Trip Auto-Halted (Low Capacity)",
        message: `${data.tripRoute || "Trip"} auto-halted at 10% capacity. Only ${data.availableSlots || 0} seats remaining.`,
        priority: 4, // Urgent
      }

    case "TRIP_RESUMED":
      return {
        type,
        title: "Trip Bookings Resumed",
        message: `Bookings resumed for ${data.tripRoute || "trip"}.`,
        priority: 2, // Normal
      }

    // Sales Notifications
    case "COMMISSION_EARNED":
      return {
        type,
        title: "Commission Earned",
        message: `You earned ETB ${data.commission?.toLocaleString() || "0"} commission from a booking.`,
        priority: 2, // Normal
      }

    case "REFERRAL_NEW":
      return {
        type,
        title: "New Referral",
        message: `A new user signed up using your referral code${data.referralCode ? ` (${data.referralCode})` : ""}.`,
        priority: 2, // Normal
      }

    case "PAYOUT_PROCESSED":
      return {
        type,
        title: "Payout Processed",
        message: `Your payout of ETB ${data.amount?.toLocaleString() || "0"} has been processed.`,
        priority: 3, // High
      }

    // Alert Notifications
    case "LOW_SLOT_ALERT":
      return {
        type,
        title: "Low Availability Alert",
        message: `${data.tripRoute || "Trip"} has only ${data.availableSlots || 0} seats remaining.`,
        priority: 3, // High
      }

    case "MANIFEST_AUTO_GENERATED":
      return {
        type,
        title: "Manifest Auto-Generated",
        message: `${data.companyName || "Company"} - ${data.tripRoute || "Trip"}: Manifest generated (${data.reason || "trigger unknown"})`,
        priority: 2, // Normal
      }

    case "SYSTEM_ALERT":
      return {
        type,
        title: "System Alert",
        message: data.messagePreview || "Important system notification.",
        priority: 4, // Urgent
      }

    // Work Order Notifications
    case "WORK_ORDER_CREATED":
      return {
        type,
        title: "New Work Order Created",
        message: `Work order ${data.workOrderNumber || ""} created for ${data.vehiclePlate || "vehicle"}${data.taskType ? ` - ${data.taskType}` : ""}.`,
        priority: 2, // Normal
      }

    case "WORK_ORDER_ASSIGNED":
      return {
        type,
        title: "Work Order Assigned",
        message: `You have been assigned to work order ${data.workOrderNumber || ""} for ${data.vehiclePlate || "vehicle"}.`,
        priority: 3, // High
      }

    case "WORK_ORDER_STATUS_CHANGED":
      return {
        type,
        title: "Work Order Status Updated",
        message: `Work order ${data.workOrderNumber || ""} status changed to ${data.workOrderStatus || "updated"}.`,
        priority: 2, // Normal
      }

    case "WORK_ORDER_MESSAGE":
      return {
        type,
        title: `Work Order Message from ${data.senderName || "Team"}`,
        message: data.messagePreview || `New message on work order ${data.workOrderNumber || ""}.`,
        priority: 2, // Normal
      }

    case "WORK_ORDER_COMPLETED":
      return {
        type,
        title: "Work Order Completed",
        message: `Work order ${data.workOrderNumber || ""} for ${data.vehiclePlate || "vehicle"} has been completed.`,
        priority: 2, // Normal
      }

    case "WORK_ORDER_URGENT":
      return {
        type,
        title: "Urgent Work Order",
        message: `Urgent work order ${data.workOrderNumber || ""} for ${data.vehiclePlate || "vehicle"}${data.taskType ? ` - ${data.taskType}` : ""}.`,
        priority: 4, // Urgent
      }

    case "WORK_ORDER_PARTS_REQUESTED":
      return {
        type,
        title: "Parts Request",
        message: `${data.mechanicName || "Mechanic"} requested ${data.quantity || 1}x ${data.partName || "part"} for work order ${data.workOrderNumber || ""} (${data.vehiclePlate || "vehicle"}).`,
        priority: 3, // High
      }

    default:
      return {
        type: "SYSTEM_ALERT",
        title: "Notification",
        message: "You have a new notification.",
        priority: 2,
      }
  }
}

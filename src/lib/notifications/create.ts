import prisma from "@/lib/db"
import { generateNotification, NotificationType, NotificationData } from "./templates"

export type RecipientType = "USER" | "SALES_PERSON"

interface CreateNotificationParams {
  recipientId: string
  recipientType: RecipientType
  type: NotificationType
  data: NotificationData
  expiresAt?: Date
}

interface CreateBulkNotificationParams {
  recipients: Array<{
    recipientId: string
    recipientType: RecipientType
  }>
  type: NotificationType
  data: NotificationData
  expiresAt?: Date
}

/**
 * Create a single notification
 */
export async function createNotification({
  recipientId,
  recipientType,
  type,
  data,
  expiresAt,
}: CreateNotificationParams) {
  const template = generateNotification(type, data)

  try {
    const notification = await prisma.notification.create({
      data: {
        recipientId,
        recipientType,
        type: template.type,
        title: template.title,
        message: template.message,
        priority: template.priority,
        tripId: data.tripId,
        bookingId: data.bookingId,
        companyId: data.companyId,
        metadata: JSON.stringify(data),
        expiresAt,
      },
    })

    return notification
  } catch (error) {
    console.error("Failed to create notification:", error)
    return null
  }
}

/**
 * Create notifications for multiple recipients
 */
export async function createBulkNotifications({
  recipients,
  type,
  data,
  expiresAt,
}: CreateBulkNotificationParams) {
  const template = generateNotification(type, data)

  try {
    const notifications = await prisma.notification.createMany({
      data: recipients.map((recipient) => ({
        recipientId: recipient.recipientId,
        recipientType: recipient.recipientType,
        type: template.type,
        title: template.title,
        message: template.message,
        priority: template.priority,
        tripId: data.tripId,
        bookingId: data.bookingId,
        companyId: data.companyId,
        metadata: JSON.stringify(data),
        expiresAt,
      })),
    })

    return notifications.count
  } catch (error) {
    console.error("Failed to create bulk notifications:", error)
    return 0
  }
}

/**
 * Create notification for a trip's assigned staff
 */
export async function notifyTripStaff(
  tripId: string,
  type: NotificationType,
  data: NotificationData,
  excludeUserId?: string
) {
  try {
    // Get trip with assigned staff
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        driverId: true,
        conductorId: true,
        manualTicketerId: true,
        origin: true,
        destination: true,
        departureTime: true,
      },
    })

    if (!trip) return 0

    // Collect staff IDs (excluding the sender if specified)
    const staffIds = [trip.driverId, trip.conductorId, trip.manualTicketerId]
      .filter((id): id is string => id !== null && id !== excludeUserId)

    if (staffIds.length === 0) return 0

    // Enrich data with trip info
    const enrichedData: NotificationData = {
      ...data,
      tripId,
      tripRoute: `${trip.origin} → ${trip.destination}`,
      departureTime: trip.departureTime.toLocaleDateString("en-ET", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }

    return await createBulkNotifications({
      recipients: staffIds.map((id) => ({ recipientId: id, recipientType: "USER" as RecipientType })),
      type,
      data: enrichedData,
    })
  } catch (error) {
    console.error("Failed to notify trip staff:", error)
    return 0
  }
}

/**
 * Create notification for company admins
 */
export async function notifyCompanyAdmins(
  companyId: string,
  type: NotificationType,
  data: NotificationData
) {
  try {
    // Get all company admins (actual admins, not regular staff)
    const admins = await prisma.user.findMany({
      where: {
        companyId,
        role: "COMPANY_ADMIN",
        OR: [
          { staffRole: null },
          { staffRole: "ADMIN" },
        ],
      },
      select: { id: true },
    })

    if (admins.length === 0) return 0

    const enrichedData: NotificationData = {
      ...data,
      companyId,
    }

    return await createBulkNotifications({
      recipients: admins.map((admin) => ({ recipientId: admin.id, recipientType: "USER" as RecipientType })),
      type,
      data: enrichedData,
    })
  } catch (error) {
    console.error("Failed to notify company admins:", error)
    return 0
  }
}

/**
 * Create notification for super admins
 */
export async function notifySuperAdmins(
  type: NotificationType,
  data: NotificationData
) {
  try {
    // Get all super admins
    const superAdmins = await prisma.user.findMany({
      where: {
        role: "SUPER_ADMIN",
      },
      select: { id: true },
    })

    if (superAdmins.length === 0) return 0

    return await createBulkNotifications({
      recipients: superAdmins.map((admin) => ({ recipientId: admin.id, recipientType: "USER" as RecipientType })),
      type,
      data,
    })
  } catch (error) {
    console.error("Failed to notify super admins:", error)
    return 0
  }
}

/**
 * Notify a sales person
 */
export async function notifySalesPerson(
  salesPersonId: string,
  type: NotificationType,
  data: NotificationData
) {
  return await createNotification({
    recipientId: salesPersonId,
    recipientType: "SALES_PERSON",
    type,
    data,
  })
}

/**
 * Notify a customer (user)
 */
export async function notifyCustomer(
  userId: string,
  type: NotificationType,
  data: NotificationData
) {
  return await createNotification({
    recipientId: userId,
    recipientType: "USER",
    type,
    data,
  })
}

/**
 * Notify all work order stakeholders:
 * - Company admins (no staffRole)
 * - Assigned mechanic
 * - Drivers/conductors with upcoming trips on the vehicle
 * - Finance staff
 */
export async function notifyWorkOrderStakeholders(
  workOrderId: string,
  vehicleId: string,
  companyId: string,
  type: NotificationType,
  data: NotificationData,
  excludeUserId?: string
) {
  try {
    // Get work order details if not provided in data
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: {
        workOrderNumber: true,
        assignedToId: true,
        assignedStaffIds: true,
        taskType: true,
        priority: true,
        vehicle: {
          select: {
            plateNumber: true,
          },
        },
      },
    })

    if (!workOrder) return 0

    // Enrich data with work order info
    const enrichedData: NotificationData = {
      ...data,
      workOrderId,
      workOrderNumber: workOrder.workOrderNumber,
      vehiclePlate: workOrder.vehicle.plateNumber,
      taskType: workOrder.taskType,
      priority: workOrder.priority,
      companyId,
    }

    // Collect all recipient IDs
    const recipientIds: Set<string> = new Set()

    // Issue 2.1: Get company admins including staffRole: "ADMIN" (consistent with notifyCompanyAdmins)
    const companyAdmins = await prisma.user.findMany({
      where: {
        companyId,
        role: "COMPANY_ADMIN",
        OR: [
          { staffRole: null },
          { staffRole: "ADMIN" },
        ],
      },
      select: { id: true },
    })
    companyAdmins.forEach((admin) => recipientIds.add(admin.id))

    // 2. Add assigned mechanics (supports both legacy single and new multi-staff)
    if (workOrder.assignedToId) {
      recipientIds.add(workOrder.assignedToId)
    }
    // Parse assignedStaffIds JSON array and add all staff
    if (workOrder.assignedStaffIds) {
      try {
        const staffIds = JSON.parse(workOrder.assignedStaffIds) as string[]
        staffIds.forEach((staffId) => recipientIds.add(staffId))
      } catch (err) {
        console.error('Failed to parse assignedStaffIds:', err)
      }
    }

    // 3. Get finance staff
    const financeStaff = await prisma.user.findMany({
      where: {
        companyId,
        role: "COMPANY_ADMIN",
        staffRole: "FINANCE",
      },
      select: { id: true },
    })
    financeStaff.forEach((staff) => recipientIds.add(staff.id))

    // 4. Get drivers/conductors with upcoming trips on this vehicle
    const now = new Date()
    const upcomingTrips = await prisma.trip.findMany({
      where: {
        vehicleId,
        departureTime: { gte: now },
      },
      select: {
        driverId: true,
        conductorId: true,
      },
    })

    upcomingTrips.forEach((trip) => {
      if (trip.driverId) recipientIds.add(trip.driverId)
      if (trip.conductorId) recipientIds.add(trip.conductorId)
    })

    // Remove the excludeUserId (e.g., the person who triggered the notification)
    if (excludeUserId) {
      recipientIds.delete(excludeUserId)
    }

    if (recipientIds.size === 0) return 0

    // Create notifications for all stakeholders
    return await createBulkNotifications({
      recipients: Array.from(recipientIds).map((id) => ({
        recipientId: id,
        recipientType: "USER" as RecipientType,
      })),
      type,
      data: enrichedData,
    })
  } catch (error) {
    console.error("Failed to notify work order stakeholders:", error)
    return 0
  }
}

/**
 * Notify a specific user about work order updates
 */
export async function notifyWorkOrderUser(
  userId: string,
  type: NotificationType,
  data: NotificationData
) {
  return await createNotification({
    recipientId: userId,
    recipientType: "USER",
    type,
    data,
  })
}

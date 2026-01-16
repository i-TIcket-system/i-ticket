import prisma from "@/lib/db"
import { Notification } from "@prisma/client"

// Grouping rules for different notification types
export interface NotificationGroupingRule {
  windowMinutes: number      // Group if within X minutes
  maxGroupSize: number        // Split into multiple groups if exceeded
  priorityThreshold: number   // Don't group URGENT with NORMAL
}

export const GROUPING_RULES: Record<string, NotificationGroupingRule> = {
  TRIP: {
    windowMinutes: 15,        // Group trip events within 15 mins
    maxGroupSize: 10,         // Max 10 notifications per group
    priorityThreshold: 3,     // URGENT (4) always separate
  },
  WORK_ORDER: {
    windowMinutes: 30,        // Longer window for work orders
    maxGroupSize: 8,
    priorityThreshold: 3,
  },
  SYSTEM: {
    windowMinutes: 60,        // System notifications can wait
    maxGroupSize: 20,
    priorityThreshold: 2,
  },
  STAFF: {
    windowMinutes: 30,
    maxGroupSize: 15,
    priorityThreshold: 3,
  },
}

export interface NotificationData {
  recipientId: string
  recipientType: string
  type: string
  title: string
  message: string
  tripId?: string
  bookingId?: string
  companyId?: string
  metadata?: string
  priority: number
  groupKey?: string
  groupType?: string
  link?: string
}

/**
 * Create a notification with intelligent grouping
 * - URGENT notifications (priority 4) are never grouped
 * - Similar notifications within time window are grouped together
 * - Group headers show summary, children show details
 */
export async function createOrGroupNotification(data: NotificationData) {
  const { groupKey, groupType, priority } = data

  // URGENT notifications never get grouped - they need immediate attention
  if (priority === 4) {
    return await createStandaloneNotification(data)
  }

  // If no groupKey, create standalone notification
  if (!groupKey || !groupType) {
    return await createStandaloneNotification(data)
  }

  const rule = GROUPING_RULES[groupType] || GROUPING_RULES.SYSTEM
  const cutoffTime = new Date(Date.now() - rule.windowMinutes * 60000)

  // Find existing group header within time window
  const existingGroup = await prisma.notification.findFirst({
    where: {
      recipientId: data.recipientId,
      groupKey: groupKey,
      isGroupHeader: true,
      createdAt: { gte: cutoffTime },
      priority: { lte: rule.priorityThreshold }, // Don't mix priorities
    },
    include: {
      children: {
        where: { isRead: false },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (existingGroup && existingGroup.childCount < rule.maxGroupSize) {
    // Add to existing group
    const childNotification = await prisma.notification.create({
      data: {
        ...data,
        parentId: existingGroup.id,
        isGroupHeader: false,
      }
    })

    // Update group header count and message
    await prisma.notification.update({
      where: { id: existingGroup.id },
      data: {
        childCount: { increment: 1 },
        message: generateGroupSummary(existingGroup, data),
        updatedAt: new Date(), // Bump to top of list
      }
    })

    return childNotification
  } else {
    // Create new group
    const groupHeader = await prisma.notification.create({
      data: {
        recipientId: data.recipientId,
        recipientType: data.recipientType,
        type: data.type,
        title: data.title,
        message: data.message,
        tripId: data.tripId,
        bookingId: data.bookingId,
        companyId: data.companyId,
        metadata: data.metadata,
        priority: data.priority,
        groupKey: groupKey,
        groupType: groupType,
        isGroupHeader: true,
        childCount: 1,
      }
    })

    // Create the actual notification as a child
    await prisma.notification.create({
      data: {
        ...data,
        parentId: groupHeader.id,
        isGroupHeader: false,
      }
    })

    return groupHeader
  }
}

/**
 * Create a standalone notification (not grouped)
 */
async function createStandaloneNotification(data: NotificationData) {
  return await prisma.notification.create({
    data: {
      recipientId: data.recipientId,
      recipientType: data.recipientType,
      type: data.type,
      title: data.title,
      message: data.message,
      tripId: data.tripId,
      bookingId: data.bookingId,
      companyId: data.companyId,
      metadata: data.metadata,
      priority: data.priority,
      groupKey: data.groupKey,
      groupType: data.groupType,
      isGroupHeader: false,
      childCount: 0,
    }
  })
}

/**
 * Generate a summary message for a notification group
 */
function generateGroupSummary(group: Notification, newItem: NotificationData): string {
  const count = group.childCount + 1
  const type = group.groupType

  if (type === 'TRIP') {
    const updates = count === 1 ? 'update' : 'updates'
    return `${count} ${updates} • Last: ${truncateMessage(newItem.message, 60)}`
  } else if (type === 'WORK_ORDER') {
    const updates = count === 1 ? 'update' : 'updates'
    return `${count} ${updates} • Last: ${truncateMessage(newItem.message, 60)}`
  } else if (type === 'STAFF') {
    const messages = count === 1 ? 'message' : 'messages'
    return `${count} ${messages} • Last: ${truncateMessage(newItem.message, 60)}`
  }

  return `${count} updates`
}

/**
 * Truncate message to specified length
 */
function truncateMessage(message: string, maxLength: number): string {
  if (message.length <= maxLength) {
    return message
  }
  return message.substring(0, maxLength) + '...'
}

/**
 * Get group key for a notification
 */
export function getGroupKey(type: string, entityId?: string): string | null {
  if (!entityId) return null

  if (type.startsWith('TRIP_')) {
    return `trip-${entityId}`
  }
  if (type.startsWith('WORK_ORDER_')) {
    return `workorder-${entityId}`
  }
  if (type.startsWith('STAFF_')) {
    return `staff-${entityId}`
  }

  return null
}

/**
 * Get group type for a notification
 */
export function getGroupType(type: string): string | null {
  if (type.startsWith('TRIP_')) {
    return 'TRIP'
  }
  if (type.startsWith('WORK_ORDER_')) {
    return 'WORK_ORDER'
  }
  if (type.startsWith('STAFF_')) {
    return 'STAFF'
  }

  return 'SYSTEM'
}

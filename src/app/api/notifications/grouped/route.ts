import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

/**
 * GET /api/notifications/grouped
 *
 * Fetch grouped notifications for the authenticated user
 * Query params:
 * - filter: 'all' | 'urgent' | 'unread' (default: 'all')
 * - limit: number (default: 50, max: 100)
 *
 * Returns:
 * - groups: Array of group headers with their children
 * - unreadCount: Total unread notifications
 * - urgentCount: Total urgent unread notifications
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || "all"
    const parsedLimit = parseInt(searchParams.get("limit") || "50")
    const limit = isNaN(parsedLimit) || parsedLimit < 1 ? 50 : Math.min(parsedLimit, 100)

    // Determine recipient type based on user role
    const recipientType = session.user.role === "SALES_PERSON" ? "SALES_PERSON" : "USER"
    const recipientId = session.user.id

    // Build where clause based on filter
    let whereClause: any = {
      recipientId,
      recipientType,
      // Fetch both: (1) group headers and (2) standalone notifications
      OR: [
        { isGroupHeader: true },
        { isGroupHeader: false, parentId: null } // Standalone notifications
      ]
    }

    // Apply filters
    if (filter === "urgent") {
      whereClause.priority = 4
    } else if (filter === "unread") {
      whereClause.OR = [
        // Group header itself is unread
        { isGroupHeader: true, isRead: false },
        // Group header has unread children
        { isGroupHeader: true, children: { some: { isRead: false } } },
        // Standalone notification is unread
        { isGroupHeader: false, parentId: null, isRead: false }
      ]
    }

    // Exclude expired notifications
    whereClause.AND = [
      {
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    ]

    // Fetch group headers and standalone notifications
    const notifications = await prisma.notification.findMany({
      where: whereClause,
      include: {
        children: {
          orderBy: { createdAt: "desc" },
          take: 20, // Limit children per group to prevent huge payloads
        },
      },
      orderBy: [
        { priority: "desc" }, // URGENT first
        { updatedAt: "desc" }, // Most recent updates first
      ],
      take: limit,
    })

    // Get counts for badges
    const [unreadCount, urgentCount] = await Promise.all([
      // Total unread (including both group headers and children)
      prisma.notification.count({
        where: {
          recipientId,
          recipientType,
          isRead: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
      }),
      // Urgent unread
      prisma.notification.count({
        where: {
          recipientId,
          recipientType,
          priority: 4,
          isRead: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
      }),
    ])

    // Transform data for frontend
    const groups = notifications.map((notification) => {
      const unreadChildCount = notification.children.filter((c) => !c.isRead).length

      return {
        header: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          groupKey: notification.groupKey,
          groupType: notification.groupType,
          isGroupHeader: notification.isGroupHeader,
          childCount: notification.childCount,
          unreadChildCount,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
          updatedAt: notification.updatedAt,
          tripId: notification.tripId,
          bookingId: notification.bookingId,
          metadata: notification.metadata,
        },
        children: notification.children.map((child) => ({
          id: child.id,
          type: child.type,
          message: child.message,
          priority: child.priority,
          isRead: child.isRead,
          createdAt: child.createdAt,
          tripId: child.tripId,
          bookingId: child.bookingId,
          metadata: child.metadata,
        })),
        expanded: false, // Default to collapsed
      }
    })

    return NextResponse.json({
      groups,
      unreadCount,
      urgentCount,
      filter,
    })
  } catch (error) {
    console.error("Grouped notifications fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notifications/grouped/[id]/read
 *
 * Mark a notification or entire group as read
 * If marking a group header, also marks all children as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { notificationId, markGroupAsRead } = body

    if (!notificationId) {
      return NextResponse.json(
        { error: "notificationId required" },
        { status: 400 }
      )
    }

    // Verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: { children: true },
    })

    if (!notification || notification.recipientId !== session.user.id) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      )
    }

    // Mark as read
    if (markGroupAsRead && notification.isGroupHeader) {
      // Mark group header and all children as read
      await prisma.notification.updateMany({
        where: {
          OR: [
            { id: notificationId },
            { parentId: notificationId },
          ],
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })
    } else {
      // Mark single notification as read
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mark notification as read error:", error)
    return NextResponse.json(
      { error: "Failed to mark as read" },
      { status: 500 }
    )
  }
}

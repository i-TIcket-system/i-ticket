import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

/**
 * GET /api/notifications
 * Get notifications for the current user
 * Query params: limit (default 20), offset (default 0), unreadOnly (default false)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)
    const offset = parseInt(searchParams.get("offset") || "0")
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    // Determine recipient type based on user role
    const recipientType = session.user.role === "SALES_PERSON" ? "SALES_PERSON" : "USER"
    const recipientId = session.user.id

    const whereClause = {
      recipientId,
      recipientType,
      ...(unreadOnly ? { isRead: false } : {}),
      // Exclude expired notifications
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    }

    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: [
          { priority: "desc" },
          { createdAt: "desc" },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where: whereClause }),
    ])

    // Parse metadata JSON for each notification
    const notificationsWithMeta = notifications.map((n) => ({
      ...n,
      metadata: n.metadata ? JSON.parse(n.metadata) : null,
    }))

    return NextResponse.json({
      notifications: notificationsWithMeta,
      total: totalCount,
      hasMore: offset + notifications.length < totalCount,
    })
  } catch (error) {
    console.error("Failed to fetch notifications:", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications
 * Mark a notification as read
 * Body: { notificationId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { notificationId } = body

    if (!notificationId) {
      return NextResponse.json(
        { error: "notificationId is required" },
        { status: 400 }
      )
    }

    // Determine recipient type based on user role
    const recipientType = session.user.role === "SALES_PERSON" ? "SALES_PERSON" : "USER"

    // Verify notification belongs to user and mark as read
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        recipientId: session.user.id,
        recipientType,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    if (notification.count === 0) {
      return NextResponse.json(
        { error: "Notification not found or already read" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to mark notification as read:", error)
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    )
  }
}

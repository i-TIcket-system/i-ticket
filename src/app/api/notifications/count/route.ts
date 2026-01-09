import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

/**
 * GET /api/notifications/count
 * Get unread notification count for the current user
 * Lightweight endpoint for polling
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Determine recipient type based on user role
    const recipientType = session.user.role === "SALES_PERSON" ? "SALES_PERSON" : "USER"
    const recipientId = session.user.id

    const count = await prisma.notification.count({
      where: {
        recipientId,
        recipientType,
        isRead: false,
        // Exclude expired notifications
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    })

    // Also get high priority count (priority >= 3)
    const urgentCount = await prisma.notification.count({
      where: {
        recipientId,
        recipientType,
        isRead: false,
        priority: { gte: 3 },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    })

    return NextResponse.json({
      unreadCount: count,
      urgentCount,
    })
  } catch (error) {
    console.error("Failed to fetch notification count:", error)
    return NextResponse.json(
      { error: "Failed to fetch notification count" },
      { status: 500 }
    )
  }
}

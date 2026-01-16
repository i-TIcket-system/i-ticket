import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

/**
 * GET - Get total unread message count across all companies
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Only super admins can access
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      )
    }

    // Count all unread messages from companies
    const unreadCount = await prisma.companyMessage.count({
      where: {
        isReadByAdmin: false,
        senderRole: "COMPANY_ADMIN", // Only company messages
      },
    })

    return NextResponse.json({
      unreadCount,
    })
  } catch (error) {
    console.error("Get admin unread count error:", error)
    return NextResponse.json(
      { error: "Failed to get unread count" },
      { status: 500 }
    )
  }
}

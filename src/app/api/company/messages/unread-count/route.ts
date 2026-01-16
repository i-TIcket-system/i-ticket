import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

/**
 * GET - Get unread message count for company
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

    // Only company admins can access
    if (session.user.role !== "COMPANY_ADMIN") {
      return NextResponse.json(
        { error: "Only company admins can access this" },
        { status: 403 }
      )
    }

    if (!session.user.companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      )
    }

    // Count unread messages from admin
    const unreadCount = await prisma.companyMessage.count({
      where: {
        companyId: session.user.companyId,
        isReadByCompany: false,
        senderRole: "SUPER_ADMIN", // Only admin messages
      },
    })

    return NextResponse.json({
      unreadCount,
    })
  } catch (error) {
    console.error("Get unread count error:", error)
    return NextResponse.json(
      { error: "Failed to get unread count" },
      { status: 500 }
    )
  }
}

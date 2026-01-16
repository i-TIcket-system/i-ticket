import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

/**
 * PATCH - Mark all admin messages as read by company
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Only company admins can mark messages as read
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

    // Mark all unread admin messages as read
    const result = await prisma.companyMessage.updateMany({
      where: {
        companyId: session.user.companyId, // CRITICAL: Company segregation
        isReadByCompany: false,
        senderRole: "SUPER_ADMIN", // Only mark admin messages as read
      },
      data: {
        isReadByCompany: true,
      },
    })

    return NextResponse.json({
      success: true,
      count: result.count,
    })
  } catch (error) {
    console.error("Mark messages read error:", error)
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    )
  }
}

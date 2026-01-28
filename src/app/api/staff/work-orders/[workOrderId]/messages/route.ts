import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

/**
 * v2.10.6: Staff Work Order Messages API
 * POST endpoint for Driver/Conductor to send messages on work orders
 */

const createMessageSchema = z.object({
  message: z.string().min(1, "Message is required").max(1000, "Message too long"),
})

/**
 * POST /api/staff/work-orders/[workOrderId]/messages
 * Send a message on a work order (Driver/Conductor only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { workOrderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Must be staff (Driver or Conductor)
    if (
      session.user.role !== "COMPANY_ADMIN" ||
      !session.user.staffRole ||
      !["DRIVER", "CONDUCTOR"].includes(session.user.staffRole)
    ) {
      return NextResponse.json(
        { error: "Staff access required (Driver or Conductor)" },
        { status: 403 }
      )
    }

    const { workOrderId } = params

    // Verify work order exists and belongs to company
    const workOrder = await prisma.workOrder.findFirst({
      where: {
        id: workOrderId,
        companyId: session.user.companyId!,
      },
      select: {
        id: true,
        assignedToId: true,
        assignedStaffIds: true,
      },
    })

    if (!workOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 })
    }

    // Verify staff has access to this work order
    let hasAccess = false

    // Check legacy assignment
    if (workOrder.assignedToId === session.user.id) {
      hasAccess = true
    }

    // Check new multi-staff assignment
    if (!hasAccess && workOrder.assignedStaffIds) {
      try {
        const staffIds = JSON.parse(workOrder.assignedStaffIds)
        if (Array.isArray(staffIds) && staffIds.includes(session.user.id)) {
          hasAccess = true
        }
      } catch {
        // Invalid JSON, no access
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 })
    }

    // Validate request body
    const body = await request.json()
    const validatedData = createMessageSchema.parse(body)

    // Create message
    const message = await prisma.workOrderMessage.create({
      data: {
        workOrderId,
        senderId: session.user.id,
        senderName: session.user.name || "Staff",
        senderRole: session.user.staffRole,
        message: validatedData.message,
        type: "COMMENT",
      },
      select: {
        id: true,
        senderId: true,
        senderName: true,
        senderRole: true,
        message: true,
        type: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      message: "Message sent successfully",
      data: message,
    })
  } catch (error) {
    console.error("Staff work order message error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

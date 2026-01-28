import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

/**
 * BUG FIX v2.10.5: Staff Work Order Detail API
 * Get a specific work order for staff (Driver/Conductor)
 * Read-only view - staff cannot modify work orders
 */
export async function GET(
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

    // Fetch work order without assignedStaffIds filter (we'll check client-side)
    const workOrder = await prisma.workOrder.findFirst({
      where: {
        id: workOrderId,
        companyId: session.user.companyId!,
      },
      include: {
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            sideNumber: true,
            make: true,
            model: true,
            year: true,
            currentOdometer: true,
          },
        },
        partsUsed: {
          select: {
            id: true,
            partName: true,
            partNumber: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            status: true,
          },
        },
        messages: {
          select: {
            id: true,
            senderId: true,
            senderName: true,
            senderRole: true,
            message: true,
            type: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!workOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 })
    }

    // Verify staff has access (client-side check for JSON array)
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

    return NextResponse.json({ workOrder })
  } catch (error) {
    console.error("Staff work order fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

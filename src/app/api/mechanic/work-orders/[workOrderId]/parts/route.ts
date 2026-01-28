import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"
import { notifyCompanyAdmins } from "@/lib/notifications/create"

const partRequestSchema = z.object({
  partName: z.string().min(1, "Part name is required").max(200),
  partNumber: z.string().max(100).optional(),
  quantity: z.number().int().positive("Quantity must be positive"),
  estimatedUnitPrice: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
})

/**
 * POST - Mechanic requests parts for a work order
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

    // Must be a mechanic
    if (session.user.role !== "COMPANY_ADMIN" || session.user.staffRole !== "MECHANIC") {
      return NextResponse.json({ error: "Mechanic access required" }, { status: 403 })
    }

    const { workOrderId } = params

    // Verify work order exists and mechanic has access
    const workOrder = await prisma.workOrder.findFirst({
      where: {
        id: workOrderId,
        companyId: session.user.companyId!,
      },
      include: {
        vehicle: {
          select: {
            plateNumber: true,
          },
        },
      },
    })

    if (!workOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 })
    }

    // Verify mechanic has access (client-side check for JSON array)
    let hasAccess = false

    if (workOrder.assignedToId === session.user.id) {
      hasAccess = true
    }

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

    const body = await request.json()
    const validation = partRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { partName, partNumber, quantity, estimatedUnitPrice, notes } = validation.data

    const unitPrice = estimatedUnitPrice || 0
    const totalPrice = unitPrice * quantity

    // Create part with "REQUESTED" status
    const part = await prisma.workOrderPart.create({
      data: {
        workOrderId,
        partName,
        partNumber,
        quantity,
        unitPrice,
        totalPrice,
        status: "REQUESTED",
        notes,
        requestedBy: session.user.id,
        requestedAt: new Date(),
      },
    })

    // Notify company admins about parts request
    await notifyCompanyAdmins(workOrder.companyId, "WORK_ORDER_PARTS_REQUESTED", {
      workOrderId: workOrder.id,
      workOrderNumber: workOrder.workOrderNumber,
      vehiclePlate: workOrder.vehicle.plateNumber,
      partName: part.partName,
      quantity: part.quantity,
      mechanicName: session.user.name || "Mechanic",
      companyId: workOrder.companyId,
    })

    return NextResponse.json(
      {
        message: "Part request submitted successfully",
        part,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Mechanic parts request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

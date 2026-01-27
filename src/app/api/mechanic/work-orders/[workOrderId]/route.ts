import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

const updateSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "BLOCKED", "COMPLETED"]).optional(),
  completionNotes: z.string().max(2000).optional(),
  mechanicSignature: z.string().max(100).optional(),
})

/**
 * GET - Fetch a specific work order for mechanic
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

    if (session.user.role !== "COMPANY_ADMIN" || session.user.staffRole !== "MECHANIC") {
      return NextResponse.json({ error: "Mechanic access required" }, { status: 403 })
    }

    const { workOrderId } = params

    const workOrder = await prisma.workOrder.findFirst({
      where: {
        id: workOrderId,
        companyId: session.user.companyId!,
        OR: [
          { assignedToId: session.user.id },
          { assignedStaffIds: { contains: session.user.id } },
        ],
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
        partsUsed: true,
      },
    })

    if (!workOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 })
    }

    return NextResponse.json({ workOrder })
  } catch (error) {
    console.error("Mechanic work order fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PATCH - Update work order status (mechanic can update status and add notes)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { workOrderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "COMPANY_ADMIN" || session.user.staffRole !== "MECHANIC") {
      return NextResponse.json({ error: "Mechanic access required" }, { status: 403 })
    }

    const { workOrderId } = params

    // Verify work order exists and is assigned to this mechanic
    const existingWorkOrder = await prisma.workOrder.findFirst({
      where: {
        id: workOrderId,
        companyId: session.user.companyId!,
        OR: [
          { assignedToId: session.user.id },
          { assignedStaffIds: { contains: session.user.id } },
        ],
      },
    })

    if (!existingWorkOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 })
    }

    const body = await request.json()
    const validation = updateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { status, completionNotes, mechanicSignature } = validation.data

    const updateData: any = {}

    if (status) {
      updateData.status = status
      if (status === "IN_PROGRESS" && !existingWorkOrder.startedAt) {
        updateData.startedAt = new Date()
      }
      if (status === "COMPLETED") {
        updateData.completedAt = new Date()
      }
    }

    if (completionNotes !== undefined) {
      updateData.completionNotes = completionNotes
    }

    if (mechanicSignature !== undefined) {
      updateData.mechanicSignature = mechanicSignature
    }

    const workOrder = await prisma.workOrder.update({
      where: { id: workOrderId },
      data: updateData,
      include: {
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            sideNumber: true,
            make: true,
            model: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: "Work order updated",
      workOrder,
    })
  } catch (error) {
    console.error("Mechanic work order update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

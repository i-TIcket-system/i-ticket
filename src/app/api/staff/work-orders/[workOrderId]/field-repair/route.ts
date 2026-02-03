import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/lib/auth"
import { createNotification } from "@/lib/notifications"

/**
 * PATCH /api/staff/work-orders/[workOrderId]/field-repair
 *
 * Allows drivers and conductors to mark a work order as fixed on the road.
 * This is useful when repairs are done at external garages during trips.
 *
 * Only DRIVER or CONDUCTOR can use this endpoint.
 * The work order must be OPEN or IN_PROGRESS.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workOrderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { workOrderId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Only drivers and conductors can mark field repairs
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        staffRole: true,
        companyId: true,
        role: true
      }
    })

    if (!user || !['DRIVER', 'CONDUCTOR'].includes(user.staffRole || '')) {
      return NextResponse.json(
        { error: "Only drivers and conductors can mark field repairs" },
        { status: 403 }
      )
    }

    // Get the work order
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            sideNumber: true,
            companyId: true
          }
        }
      }
    })

    if (!workOrder) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 }
      )
    }

    // Verify company access
    if (workOrder.companyId !== user.companyId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    // Work order must be OPEN or IN_PROGRESS
    if (!['OPEN', 'IN_PROGRESS'].includes(workOrder.status)) {
      return NextResponse.json(
        { error: `Cannot mark field repair on ${workOrder.status.toLowerCase()} work order` },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      fixedAtLocation,
      fieldRepairNotes,
      externalGarageName,
      externalGarageCost,
    } = body

    // Validate required fields
    if (!fieldRepairNotes || fieldRepairNotes.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide details about what was fixed (minimum 10 characters)" },
        { status: 400 }
      )
    }

    // Update work order with field repair information
    const updatedWorkOrder = await prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        fixedOnTheJob: true,
        fixedByStaffId: user.id,
        fixedByStaffName: user.name || 'Unknown',
        fixedOnDate: new Date(),
        fixedAtLocation: fixedAtLocation || null,
        fieldRepairNotes: fieldRepairNotes.trim(),
        externalGarageName: externalGarageName || null,
        externalGarageCost: externalGarageCost ? parseFloat(externalGarageCost) : null,
        completionNotes: `Field repair by ${user.staffRole}: ${fieldRepairNotes.trim()}`,
      },
      include: {
        vehicle: {
          select: { plateNumber: true, sideNumber: true }
        }
      }
    })

    // Create audit log
    await prisma.adminLog.create({
      data: {
        userId: user.id,
        action: 'WORK_ORDER_FIELD_REPAIR',
        companyId: workOrder.companyId,
        details: JSON.stringify({
          workOrderId,
          workOrderNumber: workOrder.workOrderNumber,
          vehicleId: workOrder.vehicleId,
          vehiclePlate: workOrder.vehicle.plateNumber,
          title: workOrder.title,
          fixedBy: user.name,
          staffRole: user.staffRole,
          location: fixedAtLocation,
          externalGarage: externalGarageName,
          cost: externalGarageCost,
        })
      }
    })

    // Notify company admins about the field repair
    const companyAdmins = await prisma.user.findMany({
      where: {
        companyId: user.companyId,
        role: 'COMPANY_ADMIN',
        staffRole: 'ADMIN'
      },
      select: { id: true }
    })

    const vehicleDisplay = updatedWorkOrder.vehicle.sideNumber || updatedWorkOrder.vehicle.plateNumber

    for (const admin of companyAdmins) {
      createNotification({
        recipientId: admin.id,
        recipientType: 'USER',
        type: 'SYSTEM_ALERT',
        data: {
          workOrderId,
          workOrderNumber: workOrder.workOrderNumber,
          vehiclePlate: vehicleDisplay,
          staffName: user.name || 'Staff',
          role: user.staffRole || 'DRIVER',
          reason: `Field repair completed${externalGarageName ? ` at ${externalGarageName}` : ''}${externalGarageCost ? ` (${externalGarageCost} ETB)` : ''}`,
        }
      })
    }

    // Add a message to the work order communication
    await prisma.workOrderMessage.create({
      data: {
        workOrderId,
        senderId: user.id,
        senderName: user.name || 'Unknown',
        senderRole: user.staffRole || 'DRIVER',
        message: `✅ **Field Repair Completed**\n\n${fieldRepairNotes}${fixedAtLocation ? `\n\n📍 Location: ${fixedAtLocation}` : ''}${externalGarageName ? `\n\n🔧 External Garage: ${externalGarageName}` : ''}${externalGarageCost ? `\n\n💰 Cost: ${externalGarageCost} ETB` : ''}`,
        type: 'STATUS_UPDATE'
      }
    })

    console.log(`[FIELD REPAIR] Work order ${workOrder.workOrderNumber} marked as fixed by ${user.name} (${user.staffRole})`)

    return NextResponse.json({
      success: true,
      workOrder: updatedWorkOrder,
      message: "Work order marked as field repair completed"
    })

  } catch (error) {
    console.error("Field repair error:", error)
    return NextResponse.json(
      { error: "Failed to process field repair" },
      { status: 500 }
    )
  }
}

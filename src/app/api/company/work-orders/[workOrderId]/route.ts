import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'
import { notifyWorkOrderStakeholders, notifyWorkOrderUser } from '@/lib/notifications'

/**
 * Work Order API - Get, Update, Delete individual work order
 * Company Admin only
 */

// Validation schema for updating work order
const updateWorkOrderSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED']).optional(),
  description: z.string().max(2000).optional().nullable(),
  priority: z.number().int().min(1).max(4).optional(),
  assignedMechanicId: z.string().optional().nullable(), // Deprecated: use assignedStaffIds
  assignedStaffIds: z.array(z.string()).optional(), // Issue 1.5: Multi-staff assignment support
  externalShopName: z.string().optional().nullable(), // Maps to serviceProvider
  // Accept both date-only (YYYY-MM-DD) and full datetime (ISO) formats
  scheduledDate: z.union([
    z.string().refine(
      (val) => !val || /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/.test(val),
      "Invalid date format"
    ),
    z.null()
  ]).optional(),
  completedAt: z.string().datetime().optional().nullable(),
  laborCost: z.number().nonnegative().optional(),
  partsCost: z.number().nonnegative().optional(),
  notes: z.string().optional().nullable(), // Maps to completionNotes
})

/**
 * GET /api/company/work-orders/[workOrderId]
 * Get single work order details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { workOrderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workOrderId } = params

    // Get work order with all relations
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            sideNumber: true,
            make: true,
            model: true,
            year: true,
            companyId: true,
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
            supplier: true,
            // Issue 1.2: Parts status fields for approval workflow visibility
            status: true,
            notes: true,
            requestedBy: true,
            requestedAt: true,
            approvedBy: true,
            approvedAt: true,
          },
        },
      },
    })

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    if (workOrder.vehicle.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'You can only view work orders for your own vehicles' },
        { status: 403 }
      )
    }

    return NextResponse.json({ workOrder })
  } catch (error) {
    console.error('Error fetching work order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work order' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/company/work-orders/[workOrderId]
 * Update work order
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { workOrderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workOrderId } = params

    // Verify work order exists and belongs to company
    const existingWorkOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        vehicle: {
          select: {
            id: true,
            companyId: true,
            currentOdometer: true,
          },
        },
      },
    })

    if (!existingWorkOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    if (existingWorkOrder.vehicle.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'You can only update work orders for your own vehicles' },
        { status: 403 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validatedData = updateWorkOrderSchema.parse(body)

    // Issue 1.7: Status transition validation - COMPLETED work orders cannot be cancelled
    if (validatedData.status === 'CANCELLED' && existingWorkOrder.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Completed work orders cannot be cancelled' },
        { status: 400 }
      )
    }

    // Validate mechanic belongs to company if specified and get their name
    const updateData: any = {}

    // Issue 1.5: Handle multi-staff assignment (supports both legacy and new format)
    const staffIdsToAssign = validatedData.assignedStaffIds && validatedData.assignedStaffIds.length > 0
      ? validatedData.assignedStaffIds
      : (validatedData.assignedMechanicId ? [validatedData.assignedMechanicId] : null)

    if (staffIdsToAssign !== null) {
      if (staffIdsToAssign.length > 0) {
        // Validate all assigned staff belong to company
        const staff = await prisma.user.findMany({
          where: {
            id: { in: staffIdsToAssign },
            companyId: session.user.companyId,
          },
          select: { id: true, name: true },
        })

        if (staff.length !== staffIdsToAssign.length) {
          return NextResponse.json(
            { error: 'One or more assigned staff members are invalid or do not belong to your company' },
            { status: 400 }
          )
        }

        // Store multiple staff IDs as JSON
        updateData.assignedStaffIds = JSON.stringify(staffIdsToAssign)
        // Keep first staff in legacy fields for backward compatibility
        updateData.assignedToId = staffIdsToAssign[0]
        updateData.assignedToName = staff[0]?.name || null
      } else {
        // Unassign all staff
        updateData.assignedStaffIds = null
        updateData.assignedToId = null
        updateData.assignedToName = null
      }
    } else if (validatedData.assignedMechanicId === null) {
      // Explicit null to unassign
      updateData.assignedStaffIds = null
      updateData.assignedToId = null
      updateData.assignedToName = null
    }

    // Copy validated fields with proper mapping
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description || null
    }
    if (validatedData.priority !== undefined) {
      updateData.priority = validatedData.priority
    }
    if (validatedData.laborCost !== undefined) {
      updateData.laborCost = validatedData.laborCost
    }
    if (validatedData.partsCost !== undefined) {
      updateData.partsCost = validatedData.partsCost
    }
    if (validatedData.externalShopName !== undefined) {
      updateData.serviceProvider = validatedData.externalShopName
    }
    // Map 'notes' to Prisma field 'completionNotes'
    if (validatedData.notes !== undefined) {
      updateData.completionNotes = validatedData.notes
    }

    // Convert date strings to Date objects
    if (validatedData.scheduledDate !== undefined) {
      updateData.scheduledDate = validatedData.scheduledDate ? new Date(validatedData.scheduledDate) : null
    }
    if (validatedData.completedAt !== undefined) {
      updateData.completedAt = validatedData.completedAt ? new Date(validatedData.completedAt) : null
    }

    // Issue 1.6: If status is changing to IN_PROGRESS, auto-set startedAt
    if (validatedData.status === 'IN_PROGRESS' && existingWorkOrder.status !== 'IN_PROGRESS') {
      if (!existingWorkOrder.startedAt) {
        updateData.startedAt = new Date()
      }
    }

    // If status is changing to COMPLETED, auto-set completedAt and update vehicle
    if (validatedData.status === 'COMPLETED' && existingWorkOrder.status !== 'COMPLETED') {
      if (!updateData.completedAt) {
        updateData.completedAt = new Date()
      }
    }

    // Calculate total cost if labor or parts cost provided
    if (validatedData.laborCost !== undefined || validatedData.partsCost !== undefined) {
      const laborCost = validatedData.laborCost ?? existingWorkOrder.laborCost
      const partsCost = validatedData.partsCost ?? existingWorkOrder.partsCost
      updateData.totalCost = laborCost + partsCost
    }

    // Update work order
    const updatedWorkOrder = await prisma.workOrder.update({
      where: { id: workOrderId },
      data: updateData,
      include: {
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            sideNumber: true,
            defectCount: true,
            criticalDefectCount: true,
          },
        },
      },
    })

    // Issue 7: Update vehicle health when work order is completed
    if (validatedData.status === 'COMPLETED' && existingWorkOrder.status !== 'COMPLETED') {
      const vehicleUpdateData: {
        lastServiceDate: Date
        defectCount?: number
        criticalDefectCount?: number
      } = {
        lastServiceDate: new Date(),
      }

      // For CORRECTIVE work orders, decrement defect counters
      // Assume each corrective WO fixes at least 1 defect
      if (existingWorkOrder.taskType === 'CORRECTIVE') {
        const currentDefects = updatedWorkOrder.vehicle.defectCount || 0
        const currentCritical = updatedWorkOrder.vehicle.criticalDefectCount || 0

        // Decrement defects (minimum 0)
        // For HIGH/URGENT priority WOs, decrement critical defects
        if (existingWorkOrder.priority >= 3 && currentCritical > 0) {
          vehicleUpdateData.criticalDefectCount = Math.max(0, currentCritical - 1)
        }

        // Always decrement regular defect count for corrective work
        if (currentDefects > 0) {
          vehicleUpdateData.defectCount = Math.max(0, currentDefects - 1)
        }
      }

      await prisma.vehicle.update({
        where: { id: existingWorkOrder.vehicleId },
        data: vehicleUpdateData,
      })

      // Update linked maintenance schedule if scheduleId exists
      if (existingWorkOrder.scheduleId) {
        const schedule = await prisma.maintenanceSchedule.findUnique({
          where: { id: existingWorkOrder.scheduleId },
        })

        if (schedule) {
          const nextDueDate = schedule.intervalDays
            ? new Date(Date.now() + schedule.intervalDays * 24 * 60 * 60 * 1000)
            : null

          const nextDueKm = schedule.intervalKm && existingWorkOrder.odometerAtService
            ? existingWorkOrder.odometerAtService + schedule.intervalKm
            : null

          await prisma.maintenanceSchedule.update({
            where: { id: existingWorkOrder.scheduleId },
            data: {
              lastCompletedAt: new Date(),
              lastCompletedKm: existingWorkOrder.odometerAtService,
              nextDueDate,
              nextDueKm,
            },
          })
        }
      }
    }

    // RULE-001: Create admin log with companyId for proper audit trail filtering
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        companyId: session.user.companyId,
        action: 'UPDATE_WORK_ORDER',
        details: JSON.stringify({
          workOrderId,
          workOrderNumber: updatedWorkOrder.workOrderNumber,
          changes: validatedData,
        }),
      },
    })

    // Send notifications for significant updates (fire and forget)
    const notificationData = {
      workOrderId,
      workOrderNumber: updatedWorkOrder.workOrderNumber,
      vehiclePlate: updatedWorkOrder.vehicle.plateNumber,
      companyId: session.user.companyId!,
    }

    // Status change notification
    if (validatedData.status && validatedData.status !== existingWorkOrder.status) {
      const notificationType = validatedData.status === 'COMPLETED'
        ? 'WORK_ORDER_COMPLETED'
        : 'WORK_ORDER_STATUS_CHANGED'

      notifyWorkOrderStakeholders(
        workOrderId,
        existingWorkOrder.vehicleId,
        session.user.companyId!,
        notificationType,
        { ...notificationData, workOrderStatus: validatedData.status },
        session.user.id
      ).catch((err) => console.error('Failed to send status change notification:', err))
    }

    // Issue 1.5: Staff assignment notifications - notify all newly assigned staff
    if (staffIdsToAssign && staffIdsToAssign.length > 0) {
      // Get existing staff IDs for comparison
      let existingStaffIds: string[] = []
      if (existingWorkOrder.assignedStaffIds) {
        try {
          existingStaffIds = JSON.parse(existingWorkOrder.assignedStaffIds) as string[]
        } catch {
          // If parse fails, treat as empty
        }
      } else if (existingWorkOrder.assignedToId) {
        existingStaffIds = [existingWorkOrder.assignedToId]
      }

      // Find newly assigned staff (not previously assigned)
      const newlyAssigned = staffIdsToAssign.filter(id => !existingStaffIds.includes(id))

      // Send assignment notifications to all newly assigned staff
      for (const staffId of newlyAssigned) {
        notifyWorkOrderUser(staffId, 'WORK_ORDER_ASSIGNED', {
          ...notificationData,
          taskType: existingWorkOrder.taskType,
        }).catch((err) => console.error(`Failed to send assignment notification to ${staffId}:`, err))
      }
    }

    return NextResponse.json({
      message: 'Work order updated successfully',
      workOrder: updatedWorkOrder,
    })
  } catch (error) {
    console.error('Error updating work order:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update work order' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/company/work-orders/[workOrderId]
 * Delete work order
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { workOrderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workOrderId } = params

    // Verify work order exists and belongs to company
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        vehicle: {
          select: {
            companyId: true,
          },
        },
        partsUsed: {
          select: { id: true },
        },
      },
    })

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    if (workOrder.vehicle.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'You can only delete work orders for your own vehicles' },
        { status: 403 }
      )
    }

    // Prevent deletion of completed work orders (for audit trail)
    if (workOrder.status === 'COMPLETED') {
      return NextResponse.json(
        {
          error: 'Cannot delete completed work orders. Cancel it instead.',
        },
        { status: 400 }
      )
    }

    // Delete associated parts first (cascade)
    await prisma.workOrderPart.deleteMany({
      where: { workOrderId },
    })

    // Delete work order
    await prisma.workOrder.delete({
      where: { id: workOrderId },
    })

    // RULE-001: Create admin log with companyId for proper audit trail filtering
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        companyId: session.user.companyId,
        action: 'DELETE_WORK_ORDER',
        details: JSON.stringify({
          workOrderId,
          workOrderNumber: workOrder.workOrderNumber,
          status: workOrder.status,
        }),
      },
    })

    return NextResponse.json({
      message: 'Work order deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting work order:', error)
    return NextResponse.json(
      { error: 'Failed to delete work order' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'

/**
 * Work Order API - Get, Update, Delete individual work order
 * Company Admin only
 */

// Validation schema for updating work order
const updateWorkOrderSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED']).optional(),
  description: z.string().max(2000).optional().nullable(),
  priority: z.number().int().min(1).max(4).optional(),
  assignedMechanicId: z.string().optional().nullable(),
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

    // Validate mechanic belongs to company if specified and get their name
    const updateData: any = {}

    // Handle mechanic assignment
    if (validatedData.assignedMechanicId !== undefined) {
      if (validatedData.assignedMechanicId) {
        const mechanic = await prisma.user.findUnique({
          where: { id: validatedData.assignedMechanicId },
          select: { companyId: true, name: true },
        })

        if (!mechanic || mechanic.companyId !== session.user.companyId) {
          return NextResponse.json(
            { error: 'Invalid mechanic assignment' },
            { status: 400 }
          )
        }

        updateData.assignedToId = validatedData.assignedMechanicId
        updateData.assignedToName = mechanic.name
      } else {
        // Unassign mechanic
        updateData.assignedToId = null
        updateData.assignedToName = null
      }
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

    // If status is changing to COMPLETED, auto-set completedAt
    if (validatedData.status === 'COMPLETED' && existingWorkOrder.status !== 'COMPLETED') {
      if (!updateData.completedAt) {
        updateData.completedAt = new Date()
      }

      // TODO: Update linked maintenance schedule if scheduleId exists
      // This requires fetching the schedule separately since there's no relation
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
            plateNumber: true,
            sideNumber: true,
          },
        },
      },
    })

    // Create admin log
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_WORK_ORDER',
        details: JSON.stringify({
          workOrderId,
          workOrderNumber: updatedWorkOrder.workOrderNumber,
          changes: validatedData,
        }),
      },
    })

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

    // Create admin log
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
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

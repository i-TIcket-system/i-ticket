import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'
import { notifyWorkOrderUser, createBulkNotifications } from '@/lib/notifications/create'

/**
 * Work Order Part API - Update & Delete individual part
 * Company Admin only
 */

// RULE-014: Validation schema for updating part status
const updatePartSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'ORDERED']),
  notes: z.string().max(500).optional(),
})

/**
 * PATCH /api/company/work-orders/[workOrderId]/parts/[partId]
 * Update part status (approve/reject/order) - Issue 1.3 fix
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { workOrderId: string; partId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workOrderId, partId } = params

    // Verify work order and part exist and belong to company
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        vehicle: { select: { companyId: true, plateNumber: true } },
      },
    })

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    // RULE-001: Company segregation check
    if (workOrder.vehicle.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Verify part belongs to this work order
    const part = await prisma.workOrderPart.findUnique({
      where: { id: partId },
    })

    if (!part || part.workOrderId !== workOrderId) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 })
    }

    // Validate request body
    const body = await request.json()
    const validatedData = updatePartSchema.parse(body)

    // Only allow status change for REQUESTED parts (mechanics' requests)
    // Admin-added parts (status: APPROVED) shouldn't need approval workflow
    if (part.status !== 'REQUESTED' && validatedData.status !== 'ORDERED') {
      return NextResponse.json(
        { error: 'Only REQUESTED parts can be approved/rejected. Use ORDERED for already approved parts.' },
        { status: 400 }
      )
    }

    // Update part and recalculate costs in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update part status
      const updatedPart = await tx.workOrderPart.update({
        where: { id: partId },
        data: {
          status: validatedData.status,
          notes: validatedData.notes !== undefined ? validatedData.notes : part.notes,
          approvedBy: session.user.id,
          approvedAt: new Date(),
        },
      })

      // If approved, recalculate work order costs (approved parts contribute to costs)
      let updatedWorkOrder = null
      if (validatedData.status === 'APPROVED') {
        // Get all approved parts to recalculate total
        const approvedParts = await tx.workOrderPart.findMany({
          where: {
            workOrderId,
            status: 'APPROVED',
          },
        })

        const newPartsCost = approvedParts.reduce((sum, p) => sum + p.totalPrice, 0)

        updatedWorkOrder = await tx.workOrder.update({
          where: { id: workOrderId },
          data: {
            partsCost: newPartsCost,
            totalCost: workOrder.laborCost + newPartsCost,
          },
        })
      }

      return { part: updatedPart, workOrder: updatedWorkOrder }
    })

    // RULE-001: Create admin log with companyId for audit trail
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        companyId: session.user.companyId,
        action: 'UPDATE_WORK_ORDER_PART',
        details: JSON.stringify({
          workOrderId,
          workOrderNumber: workOrder.workOrderNumber,
          partId,
          partName: part.partName,
          oldStatus: part.status,
          newStatus: validatedData.status,
        }),
      },
    })

    // Notify the mechanic who requested the part
    if (part.requestedBy) {
      const notificationType = validatedData.status === 'APPROVED'
        ? 'WORK_ORDER_PARTS_REQUESTED' // Reuse this type but with different message
        : 'WORK_ORDER_STATUS_CHANGED'

      await notifyWorkOrderUser(part.requestedBy, notificationType, {
        workOrderId,
        workOrderNumber: workOrder.workOrderNumber,
        vehiclePlate: workOrder.vehicle.plateNumber,
        partName: part.partName,
        quantity: part.quantity,
        workOrderStatus: `Part ${validatedData.status.toLowerCase()}`,
        companyId: session.user.companyId!,
      }).catch((err) => console.error('Failed to notify mechanic about part status:', err))
    }

    // v2.10.6: Notify finance staff when parts are marked as ORDERED
    if (validatedData.status === 'ORDERED') {
      try {
        const financeStaff = await prisma.user.findMany({
          where: {
            companyId: session.user.companyId,
            role: 'COMPANY_ADMIN',
            staffRole: 'FINANCE',
          },
          select: { id: true },
        })

        if (financeStaff.length > 0) {
          await createBulkNotifications({
            recipients: financeStaff.map((staff) => ({
              recipientId: staff.id,
              recipientType: 'USER',
            })),
            type: 'WORK_ORDER_STATUS_CHANGED',
            data: {
              workOrderId,
              workOrderNumber: workOrder.workOrderNumber,
              vehiclePlate: workOrder.vehicle.plateNumber,
              partName: part.partName,
              quantity: part.quantity,
              workOrderStatus: `Part ordered: ${part.partName} (${part.quantity} pcs)`,
              companyId: session.user.companyId!,
            },
          })
        }
      } catch (err) {
        console.error('Failed to notify finance about ordered part:', err)
      }
    }

    return NextResponse.json({
      message: `Part ${validatedData.status.toLowerCase()} successfully`,
      part: result.part,
      ...(result.workOrder && {
        updatedCosts: {
          partsCost: result.workOrder.partsCost,
          totalCost: result.workOrder.totalCost,
        },
      }),
    })
  } catch (error) {
    console.error('Error updating part status:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Failed to update part status' }, { status: 500 })
  }
}

/**
 * DELETE /api/company/work-orders/[workOrderId]/parts/[partId]
 * Remove a part from work order - automatically updates partsCost and totalCost
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { workOrderId: string; partId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workOrderId, partId } = params

    // Verify work order and part exist and belong to company
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        vehicle: { select: { companyId: true, plateNumber: true } },
      },
    })

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    // RULE-001: Company segregation check
    if (workOrder.vehicle.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Verify part belongs to this work order
    const part = await prisma.workOrderPart.findUnique({
      where: { id: partId },
    })

    if (!part || part.workOrderId !== workOrderId) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 })
    }

    // Delete part and update work order costs in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete the part
      await tx.workOrderPart.delete({
        where: { id: partId },
      })

      // Get remaining approved parts for this work order
      const remainingParts = await tx.workOrderPart.findMany({
        where: {
          workOrderId,
          status: 'APPROVED',
        },
      })

      const newPartsCost = remainingParts.reduce((sum, p) => sum + p.totalPrice, 0)

      // Update work order with new parts cost
      const updatedWorkOrder = await tx.workOrder.update({
        where: { id: workOrderId },
        data: {
          partsCost: newPartsCost,
          totalCost: workOrder.laborCost + newPartsCost,
        },
      })

      return { workOrder: updatedWorkOrder }
    })

    // RULE-001: Create admin log with companyId
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        companyId: session.user.companyId,
        action: 'REMOVE_WORK_ORDER_PART',
        details: JSON.stringify({
          workOrderId,
          workOrderNumber: workOrder.workOrderNumber,
          partId,
          partName: part.partName,
          totalPrice: part.totalPrice,
        }),
      },
    })

    // Issue 2.5: Notify mechanic if their REQUESTED part was deleted
    if (part.status === 'REQUESTED' && part.requestedBy) {
      await notifyWorkOrderUser(part.requestedBy, 'WORK_ORDER_STATUS_CHANGED', {
        workOrderId,
        workOrderNumber: workOrder.workOrderNumber,
        vehiclePlate: workOrder.vehicle.plateNumber,
        partName: part.partName,
        workOrderStatus: 'Part request removed',
        companyId: session.user.companyId!,
      }).catch((err) => console.error('Failed to notify mechanic about deleted part:', err))
    }

    return NextResponse.json({
      message: 'Part removed successfully',
      updatedCosts: {
        partsCost: result.workOrder.partsCost,
        totalCost: result.workOrder.totalCost,
      },
    })
  } catch (error) {
    console.error('Error removing part:', error)
    return NextResponse.json({ error: 'Failed to remove part' }, { status: 500 })
  }
}

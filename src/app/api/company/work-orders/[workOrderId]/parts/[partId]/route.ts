import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

/**
 * Work Order Part API - Delete individual part
 * Company Admin only
 */

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
        vehicle: { select: { companyId: true } },
      },
    })

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

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

      // Get remaining parts for this work order
      const remainingParts = await tx.workOrderPart.findMany({
        where: { workOrderId },
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

    // Create admin log
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
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

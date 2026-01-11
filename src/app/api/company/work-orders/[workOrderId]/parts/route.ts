import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'

/**
 * Work Order Parts API - List & Create parts for a work order
 * Company Admin only
 */

// Validation schema for creating part
const createPartSchema = z.object({
  partName: z.string().min(1, 'Part name is required').max(200),
  partNumber: z.string().max(100).optional().nullable(),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
  supplier: z.string().max(200).optional().nullable(),
})

/**
 * GET /api/company/work-orders/[workOrderId]/parts
 * List all parts for a work order
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

    // Verify work order belongs to company
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        vehicle: { select: { companyId: true } },
        partsUsed: true,
      },
    })

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    if (workOrder.vehicle.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ parts: workOrder.partsUsed })
  } catch (error) {
    console.error('Error fetching parts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch parts' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/company/work-orders/[workOrderId]/parts
 * Add a part to work order - automatically updates partsCost and totalCost
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { workOrderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workOrderId } = params

    // Verify work order belongs to company
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

    // Validate request body
    const body = await request.json()
    const validatedData = createPartSchema.parse(body)

    // Calculate total price for this part
    const totalPrice = validatedData.quantity * validatedData.unitPrice

    // Create part and update work order costs in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the part
      const part = await tx.workOrderPart.create({
        data: {
          workOrderId,
          partName: validatedData.partName,
          partNumber: validatedData.partNumber || null,
          quantity: validatedData.quantity,
          unitPrice: validatedData.unitPrice,
          totalPrice,
          supplier: validatedData.supplier || null,
        },
      })

      // Get all parts for this work order to recalculate total
      const allParts = await tx.workOrderPart.findMany({
        where: { workOrderId },
      })

      const newPartsCost = allParts.reduce((sum, p) => sum + p.totalPrice, 0)

      // Update work order with new parts cost
      const updatedWorkOrder = await tx.workOrder.update({
        where: { id: workOrderId },
        data: {
          partsCost: newPartsCost,
          totalCost: workOrder.laborCost + newPartsCost,
        },
      })

      return { part, workOrder: updatedWorkOrder }
    })

    // Create admin log
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: 'ADD_WORK_ORDER_PART',
        details: JSON.stringify({
          workOrderId,
          workOrderNumber: workOrder.workOrderNumber,
          partId: result.part.id,
          partName: validatedData.partName,
          totalPrice,
        }),
      },
    })

    return NextResponse.json(
      {
        message: 'Part added successfully',
        part: result.part,
        updatedCosts: {
          partsCost: result.workOrder.partsCost,
          totalCost: result.workOrder.totalCost,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding part:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Failed to add part' }, { status: 500 })
  }
}

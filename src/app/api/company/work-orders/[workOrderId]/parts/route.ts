import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'

/**
 * Work Order Parts API - Add parts to work orders
 * Company Admin only
 */

// Validation schema for adding part
const addPartSchema = z.object({
  partName: z.string().min(2, 'Part name must be at least 2 characters').max(200),
  partNumber: z.string().optional(),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  supplier: z.string().optional(),
})

/**
 * POST /api/company/work-orders/[workOrderId]/parts
 * Add part to work order
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

    // Verify work order exists and belongs to company
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        vehicle: {
          select: {
            companyId: true,
          },
        },
      },
    })

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    if (workOrder.vehicle.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'You can only add parts to your own work orders' },
        { status: 403 }
      )
    }

    // Cannot add parts to completed work orders
    if (workOrder.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot add parts to completed work orders' },
        { status: 400 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validatedData = addPartSchema.parse(body)

    // Calculate total price
    const totalPrice = validatedData.quantity * validatedData.unitPrice

    // Add part to work order
    const part = await prisma.workOrderPart.create({
      data: {
        workOrderId,
        ...validatedData,
        totalPrice,
      },
    })

    // Update work order parts cost and total cost
    const allParts = await prisma.workOrderPart.findMany({
      where: { workOrderId },
      select: { totalPrice: true },
    })

    const newPartsCost = allParts.reduce((sum, p) => sum + p.totalPrice, 0)
    const newTotalCost = workOrder.laborCost + newPartsCost

    await prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        partsCost: newPartsCost,
        totalCost: newTotalCost,
      },
    })

    // Create admin log
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: 'ADD_PART',
        entity: 'WORK_ORDER',
        entityId: workOrderId,
        details: JSON.stringify({
          workOrderNumber: workOrder.workOrderNumber,
          partName: validatedData.partName,
          quantity: validatedData.quantity,
          totalPrice,
        }),
      },
    })

    return NextResponse.json(
      {
        message: 'Part added to work order successfully',
        part,
        updatedCosts: {
          partsCost: newPartsCost,
          totalCost: newTotalCost,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding part to work order:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to add part to work order' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/company/work-orders/[workOrderId]/parts
 * Get all parts for work order
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

    // Verify work order exists and belongs to company
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        vehicle: {
          select: {
            companyId: true,
          },
        },
      },
    })

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    if (workOrder.vehicle.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'You can only view parts for your own work orders' },
        { status: 403 }
      )
    }

    // Get all parts
    const parts = await prisma.workOrderPart.findMany({
      where: { workOrderId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      parts,
      summary: {
        totalParts: parts.length,
        totalCost: parts.reduce((sum, p) => sum + p.totalPrice, 0),
      },
    })
  } catch (error) {
    console.error('Error fetching work order parts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work order parts' },
      { status: 500 }
    )
  }
}

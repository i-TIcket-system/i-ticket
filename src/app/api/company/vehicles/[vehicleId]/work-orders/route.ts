import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'

/**
 * Work Order API - List & Create for a specific vehicle
 * Company Admin only
 */

// Validation schema for creating work order
const createWorkOrderSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  taskType: z.enum(['PREVENTIVE', 'CORRECTIVE', 'INSPECTION', 'EMERGENCY']),
  scheduleId: z.string().optional(),
  description: z.string().min(5, 'Description must be at least 5 characters').max(2000).optional(),
  priority: z.number().int().min(1).max(4).default(2), // 1=Low, 2=Normal, 3=High, 4=Urgent
  assignedToId: z.string().optional(),
  assignedToName: z.string().optional(),
  serviceProvider: z.string().optional(),
  scheduledDate: z.string().optional(),
  odometerAtService: z.number().int().positive().optional(),
  completionNotes: z.string().optional(),
})

/**
 * GET /api/company/vehicles/[vehicleId]/work-orders
 * List all work orders for a vehicle
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { vehicleId } = params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Verify vehicle belongs to company
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, companyId: true, plateNumber: true, sideNumber: true },
    })

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    if (vehicle.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'You can only view work orders for your own vehicles' },
        { status: 403 }
      )
    }

    // Build where clause
    const where: any = { vehicleId }
    if (status) {
      where.status = status
    }

    // Get work orders
    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        partsUsed: {
          select: {
            id: true,
            partName: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({
      workOrders,
      vehicle: {
        id: vehicle.id,
        plateNumber: vehicle.plateNumber,
        sideNumber: vehicle.sideNumber,
      },
    })
  } catch (error) {
    console.error('Error fetching work orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work orders' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/company/vehicles/[vehicleId]/work-orders
 * Create new work order for a vehicle
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { vehicleId } = params

    // Verify vehicle belongs to company
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, companyId: true, currentOdometer: true, plateNumber: true },
    })

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    if (vehicle.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'You can only create work orders for your own vehicles' },
        { status: 403 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validatedData = createWorkOrderSchema.parse(body)

    // Validate mechanic belongs to company if specified
    let assignedToName = validatedData.assignedToName
    if (validatedData.assignedToId) {
      const mechanic = await prisma.user.findUnique({
        where: { id: validatedData.assignedToId },
        select: { companyId: true, staffRole: true, name: true },
      })

      if (!mechanic || mechanic.companyId !== session.user.companyId) {
        return NextResponse.json(
          { error: 'Invalid mechanic assignment' },
          { status: 400 }
        )
      }
      assignedToName = mechanic.name || assignedToName
    }

    // Generate work order number
    const workOrderNumber = `WO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    // Create work order
    const workOrder = await prisma.workOrder.create({
      data: {
        vehicleId,
        companyId: vehicle.companyId,
        workOrderNumber,
        title: validatedData.title,
        taskType: validatedData.taskType,
        description: validatedData.description,
        priority: validatedData.priority,
        assignedToId: validatedData.assignedToId,
        assignedToName,
        serviceProvider: validatedData.serviceProvider,
        scheduledDate: validatedData.scheduledDate ? new Date(validatedData.scheduledDate) : null,
        odometerAtService: validatedData.odometerAtService,
        completionNotes: validatedData.completionNotes,
        scheduleId: validatedData.scheduleId,
        status: 'OPEN',
      },
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
        action: 'WORK_ORDER_CREATE',
        details: JSON.stringify({
          workOrderId: workOrder.id,
          vehicleId,
          vehiclePlate: vehicle.plateNumber,
          workOrderNumber: workOrder.workOrderNumber,
          taskType: validatedData.taskType,
        }),
        companyId: vehicle.companyId,
      },
    })

    return NextResponse.json(
      {
        message: 'Work order created successfully',
        workOrder,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating work order:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create work order' },
      { status: 500 }
    )
  }
}

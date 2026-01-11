import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'

/**
 * Work Order API - List & Create
 * Company Admin only
 */

// Validation schema for creating work order
const createWorkOrderSchema = z.object({
  vehicleId: z.string(),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  taskType: z.enum(['PREVENTIVE', 'CORRECTIVE', 'INSPECTION', 'EMERGENCY']),
  scheduleId: z.string().optional(),
  description: z.string().min(5, 'Description must be at least 5 characters').max(2000),
  priority: z.number().int().min(1).max(4).default(2), // 1=Low, 2=Normal, 3=High, 4=Urgent
  assignedMechanicId: z.string().optional(),
  serviceProvider: z.string().optional(), // External shop name
  scheduledDate: z.string().datetime().optional(),
})

/**
 * GET /api/company/work-orders
 * List all work orders for company (with filters)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const vehicleId = searchParams.get('vehicleId')
    const workType = searchParams.get('workType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      vehicle: {
        companyId: session.user.companyId,
      },
    }

    if (vehicleId) {
      where.vehicleId = vehicleId
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    if (workType) {
      where.taskType = workType
    }

    // Get work orders
    const [workOrders, totalCount] = await Promise.all([
      prisma.workOrder.findMany({
        where,
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
        skip,
        take: limit,
      }),
      prisma.workOrder.count({ where }),
    ])

    return NextResponse.json({
      workOrders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
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
 * POST /api/company/work-orders
 * Create new work order
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate request body
    const body = await request.json()
    const validatedData = createWorkOrderSchema.parse(body)
    const { vehicleId, assignedMechanicId, scheduledDate, ...restData } = validatedData

    // Verify vehicle belongs to company
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, companyId: true, currentOdometer: true },
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

    // Validate mechanic belongs to company if specified and get their name
    let mechanicName: string | null = null
    if (assignedMechanicId) {
      const mechanic = await prisma.user.findUnique({
        where: { id: assignedMechanicId },
        select: { companyId: true, staffRole: true, name: true },
      })

      if (!mechanic || mechanic.companyId !== session.user.companyId) {
        return NextResponse.json(
          { error: 'Invalid mechanic assignment' },
          { status: 400 }
        )
      }
      mechanicName = mechanic.name
    }

    // Generate work order number
    const workOrderNumber = `WO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    // Create work order
    const workOrder = await prisma.workOrder.create({
      data: {
        vehicleId,
        companyId: session.user.companyId,
        workOrderNumber,
        assignedToId: assignedMechanicId || null,
        assignedToName: mechanicName,
        odometerAtService: vehicle.currentOdometer,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        ...restData,
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
        action: 'CREATE_WORK_ORDER',
        companyId: session.user.companyId,
        details: JSON.stringify({
          workOrderId: workOrder.id,
          vehicleId,
          workOrderNumber: workOrder.workOrderNumber,
          taskType: restData.taskType,
        }),
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

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { notifyWorkOrderStakeholders, notifyWorkOrderUser } from '@/lib/notifications'

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
  assignedMechanicId: z.string().optional(), // Deprecated: use assignedStaffIds
  assignedStaffIds: z.array(z.string()).optional(), // Multiple staff assignments
  serviceProvider: z.string().optional(), // External shop name
  scheduledDate: z.string().datetime().optional(),
})

// M1 FIX: Validation schema with scientific notation rejection
// BUG FIX v2.10.5: Added .nullish() to status and workType to handle null from searchParams.get()
const workOrderQuerySchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED']).nullish(),
  priority: z.string().nullish().transform((val) => {
    if (!val) return undefined
    const num = parseInt(val, 10)
    if (isNaN(num) || num < 1 || num > 4) return undefined
    return num
  }),
  vehicleId: z.string().nullish(),
  workType: z.enum(['PREVENTIVE', 'CORRECTIVE', 'INSPECTION', 'EMERGENCY']).nullish(),
  page: z.string().nullable().optional().transform((val) => {
    if (!val || /[eE.]/.test(val)) return 1
    const num = parseInt(val, 10)
    return isNaN(num) || num < 1 ? 1 : num
  }),
  limit: z.string().nullable().optional().transform((val) => {
    if (!val || /[eE.]/.test(val)) return 20
    const num = parseInt(val, 10)
    if (isNaN(num) || num < 1) return 20
    if (num > 100) return 100
    return num
  }),
})

/**
 * GET /api/company/work-orders
 * List all work orders for company (with filters)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    console.log('[WorkOrders GET] Session:', {
      exists: !!session,
      role: session?.user?.role,
      companyId: session?.user?.companyId,
    })

    if (!session || session.user.role !== 'COMPANY_ADMIN' || !session.user.companyId) {
      console.error('[WorkOrders GET] Unauthorized:', {
        hasSession: !!session,
        role: session?.user?.role,
        companyId: session?.user?.companyId,
      })
      return NextResponse.json({
        error: 'Unauthorized',
        details: !session ? 'No session' : !session.user.companyId ? 'No company ID' : 'Invalid role'
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    console.log('[WorkOrders GET] Raw query params:', {
      status: searchParams.get('status'),
      priority: searchParams.get('priority'),
      vehicleId: searchParams.get('vehicleId'),
      workType: searchParams.get('workType'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      fullUrl: request.url,
    })

    // Validate query parameters with Zod
    const validationResult = workOrderQuerySchema.safeParse({
      status: searchParams.get('status'),
      priority: searchParams.get('priority'),
      vehicleId: searchParams.get('vehicleId'),
      workType: searchParams.get('workType'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })

    if (!validationResult.success) {
      console.error('[WorkOrders GET] Validation failed:', validationResult.error.format())
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const { status, priority, vehicleId, workType, page, limit } = validationResult.data
    const skip = (page - 1) * limit

    // Build where clause with validated and typed parameters
    const where: Prisma.WorkOrderWhereInput = {
      vehicle: {
        companyId: session.user.companyId,
      },
      ...(vehicleId && { vehicleId }),
      ...(status && { status }),
      ...(priority && { priority }), // Already a number from Zod coercion
      ...(workType && { taskType: workType }),
    }

    // Get work orders with all required fields
    const [workOrdersRaw, totalCount] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        select: {
          id: true,
          workOrderNumber: true,
          vehicleId: true,
          companyId: true,
          title: true,
          description: true,
          taskType: true,
          priority: true,
          status: true,
          assignedToId: true,
          assignedToName: true,
          assignedStaffIds: true,
          serviceProvider: true,
          scheduledDate: true,
          startedAt: true,
          completedAt: true,
          laborCost: true,
          partsCost: true,
          totalCost: true,
          completionNotes: true,
          mechanicSignature: true,
          createdAt: true,
          updatedAt: true,
          odometerAtService: true,
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
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.workOrder.count({ where }),
    ])

    // v2.10.6: Sort COMPLETED/CANCELLED to bottom, active statuses first
    const statusOrder: Record<string, number> = {
      OPEN: 0,
      IN_PROGRESS: 1,
      BLOCKED: 2,
      COMPLETED: 3,
      CANCELLED: 4,
    }
    const workOrders = workOrdersRaw.sort((a, b) => {
      const statusA = statusOrder[a.status] ?? 5
      const statusB = statusOrder[b.status] ?? 5
      if (statusA !== statusB) return statusA - statusB
      // Within same status group, sort by priority (desc) then date (desc)
      if (a.priority !== b.priority) return b.priority - a.priority
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

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
    console.error('[WorkOrders GET] Error fetching work orders:', error)
    console.error('[WorkOrders GET] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        error: 'Failed to fetch work orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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
    console.log('[WorkOrder POST] Request body:', JSON.stringify(body, null, 2))
    const validatedData = createWorkOrderSchema.parse(body)
    const { vehicleId, assignedMechanicId, assignedStaffIds, scheduledDate, ...restData } = validatedData
    console.log('[WorkOrder POST] Validated data:', { vehicleId, assignedMechanicId, assignedStaffIds, scheduledDate })

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

    // Determine which staff assignment to use (new array or legacy single)
    const staffIdsToAssign = assignedStaffIds && assignedStaffIds.length > 0
      ? assignedStaffIds
      : (assignedMechanicId ? [assignedMechanicId] : [])

    // Validate all assigned staff belong to company
    let mechanicName: string | null = null
    if (staffIdsToAssign.length > 0) {
      const staff = await prisma.user.findMany({
        where: {
          id: { in: staffIdsToAssign },
          companyId: session.user.companyId,
        },
        select: { id: true, name: true, staffRole: true },
      })

      if (staff.length !== staffIdsToAssign.length) {
        return NextResponse.json(
          { error: 'One or more assigned staff members are invalid or do not belong to your company' },
          { status: 400 }
        )
      }

      // For backward compatibility, set mechanicName to first assigned staff
      mechanicName = staff[0]?.name || null
    }

    // Generate work order number
    const workOrderNumber = `WO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    // Create work order
    console.log('[WorkOrder POST] Creating work order with staffIds:', staffIdsToAssign)
    const workOrder = await prisma.workOrder.create({
      data: {
        vehicleId,
        companyId: session.user.companyId,
        workOrderNumber,
        // Store multiple staff IDs as JSON
        assignedStaffIds: staffIdsToAssign.length > 0 ? JSON.stringify(staffIdsToAssign) : null,
        // Keep first staff in legacy fields for backward compatibility
        assignedToId: staffIdsToAssign[0] || null,
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
    console.log('[WorkOrder POST] Work order created successfully:', workOrder.id)

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

    // Send notifications (fire and forget - don't block response)
    const notificationType = restData.priority === 4 ? 'WORK_ORDER_URGENT' : 'WORK_ORDER_CREATED'
    notifyWorkOrderStakeholders(
      workOrder.id,
      vehicleId,
      session.user.companyId!,
      notificationType,
      {
        workOrderNumber: workOrder.workOrderNumber,
        vehiclePlate: workOrder.vehicle.plateNumber,
        taskType: restData.taskType,
      },
      session.user.id // exclude creator from notification
    ).catch((err) => console.error('Failed to send work order notifications:', err))

    // Send assignment notifications to all assigned staff (supports multi-staff assignments)
    if (staffIdsToAssign.length > 0) {
      for (const staffId of staffIdsToAssign) {
        notifyWorkOrderUser(staffId, 'WORK_ORDER_ASSIGNED', {
          workOrderId: workOrder.id,
          workOrderNumber: workOrder.workOrderNumber,
          vehiclePlate: workOrder.vehicle.plateNumber,
          taskType: restData.taskType,
          companyId: session.user.companyId!,
        }).catch((err) => console.error(`Failed to send assignment notification to ${staffId}:`, err))
      }
    }

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

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'

/**
 * Maintenance Schedule API - List & Create
 * Company Admin only
 */

// Validation schema for creating maintenance schedule
const createScheduleSchema = z.object({
  taskName: z.string().min(3, 'Task name must be at least 3 characters').max(200),
  taskType: z.enum(['PREVENTIVE', 'INSPECTION', 'SERVICE']),
  description: z.string().optional(),
  intervalKm: z.number().int().positive().optional(),
  intervalDays: z.number().int().positive().optional(),
  priority: z.number().int().min(1).max(4).default(2), // 1=Low, 2=Normal, 3=High, 4=Urgent
  estimatedDuration: z.number().int().positive().optional(), // in minutes
  estimatedCostBirr: z.number().positive().optional(),
  autoCreateWorkOrder: z.boolean().default(true),
})

/**
 * GET /api/company/vehicles/[vehicleId]/maintenance-schedules
 * List all maintenance schedules for a vehicle
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

    // Verify vehicle belongs to company
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, companyId: true, plateNumber: true, sideNumber: true, currentOdometer: true },
    })

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    if (vehicle.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'You can only view schedules for your own vehicles' },
        { status: 403 }
      )
    }

    // Get all schedules for this vehicle
    const schedules = await prisma.maintenanceSchedule.findMany({
      where: { vehicleId },
      orderBy: [
        { priority: 'desc' },
        { nextDueDate: 'asc' },
      ],
    })

    // Calculate status for each schedule (overdue, due soon, ok)
    const now = new Date()
    const schedulesWithStatus = schedules.map((schedule) => {
      let status = 'OK'
      let daysUntilDue: number | null = null
      let kmUntilDue: number | null = null

      if (schedule.nextDueDate) {
        const daysRemaining = Math.ceil(
          (schedule.nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        daysUntilDue = daysRemaining

        if (daysRemaining < 0) {
          status = 'OVERDUE'
        } else if (daysRemaining <= 7) {
          status = 'DUE_SOON'
        }
      }

      if (schedule.nextDueKm && vehicle) {
        const currentOdometer = vehicle.currentOdometer || 0
        const kmRemaining = schedule.nextDueKm - currentOdometer
        kmUntilDue = kmRemaining

        if (kmRemaining <= 0) {
          status = 'OVERDUE'
        } else if (kmRemaining <= 500) {
          status = 'DUE_SOON'
        }
      }

      return {
        ...schedule,
        status,
        daysUntilDue,
        kmUntilDue,
      }
    })

    return NextResponse.json({
      schedules: schedulesWithStatus,
      vehicle: {
        id: vehicle.id,
        plateNumber: vehicle.plateNumber,
        sideNumber: vehicle.sideNumber,
        currentOdometer: vehicle.currentOdometer,
      },
    })
  } catch (error) {
    console.error('Error fetching maintenance schedules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance schedules' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/company/vehicles/[vehicleId]/maintenance-schedules
 * Create new maintenance schedule
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
      select: {
        id: true,
        companyId: true,
        currentOdometer: true,
      },
    })

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    if (vehicle.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'You can only create schedules for your own vehicles' },
        { status: 403 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validatedData = createScheduleSchema.parse(body)

    // Validate that at least one interval is specified
    if (!validatedData.intervalKm && !validatedData.intervalDays) {
      return NextResponse.json(
        { error: 'At least one interval (km or days) must be specified' },
        { status: 400 }
      )
    }

    // Calculate next due date/km
    const now = new Date()
    const currentOdometer = vehicle.currentOdometer || 0

    const nextDueDate = validatedData.intervalDays
      ? new Date(now.getTime() + validatedData.intervalDays * 24 * 60 * 60 * 1000)
      : null

    const nextDueKm = validatedData.intervalKm
      ? currentOdometer + validatedData.intervalKm
      : null

    // Create schedule
    const schedule = await prisma.maintenanceSchedule.create({
      data: {
        vehicleId,
        taskName: validatedData.taskName,
        taskType: validatedData.taskType,
        description: validatedData.description,
        intervalKm: validatedData.intervalKm,
        intervalDays: validatedData.intervalDays,
        priority: validatedData.priority,
        estimatedDuration: validatedData.estimatedDuration,
        estimatedCostBirr: validatedData.estimatedCostBirr,
        autoCreateWorkOrder: validatedData.autoCreateWorkOrder,
        nextDueDate,
        nextDueKm,
      },
    })

    // Create admin log
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: 'MAINTENANCE_SCHEDULE_CREATE',
        details: JSON.stringify({
          scheduleId: schedule.id,
          vehicleId,
          taskName: validatedData.taskName,
          intervalKm: validatedData.intervalKm,
          intervalDays: validatedData.intervalDays,
        }),
        companyId: vehicle.companyId,
      },
    })

    return NextResponse.json(
      {
        message: 'Maintenance schedule created successfully',
        schedule,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating maintenance schedule:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create maintenance schedule' },
      { status: 500 }
    )
  }
}

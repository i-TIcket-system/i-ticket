import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'

/**
 * Maintenance Schedule API - Update & Delete
 * Company Admin only
 */

// Validation schema for updating maintenance schedule
const updateScheduleSchema = z.object({
  taskName: z.string().min(3).max(200).optional(),
  taskType: z.enum(['PREVENTIVE', 'INSPECTION', 'SERVICE']).optional(),
  description: z.string().optional().nullable(),
  intervalKm: z.number().int().positive().optional().nullable(),
  intervalDays: z.number().int().positive().optional().nullable(),
  priority: z.number().int().min(1).max(4).optional(), // 1=Low, 2=Normal, 3=High, 4=Urgent
  estimatedDuration: z.number().int().positive().optional().nullable(),
  estimatedCostBirr: z.number().positive().optional().nullable(),
  autoCreateWorkOrder: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

/**
 * GET /api/company/vehicles/[vehicleId]/maintenance-schedules/[scheduleId]
 * Get single maintenance schedule details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { vehicleId: string; scheduleId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { vehicleId, scheduleId } = params

    // Verify schedule exists and belongs to company's vehicle
    const schedule = await prisma.maintenanceSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        vehicle: {
          select: {
            id: true,
            companyId: true,
            plateNumber: true,
            sideNumber: true,
            currentOdometer: true,
          },
        },
      },
    })

    // Get related work orders separately
    const workOrders = await prisma.workOrder.findMany({
      where: { scheduleId },
      select: {
        id: true,
        workOrderNumber: true,
        status: true,
        createdAt: true,
        completedAt: true,
        totalCost: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    if (schedule.vehicleId !== vehicleId) {
      return NextResponse.json({ error: 'Schedule does not belong to this vehicle' }, { status: 400 })
    }

    if (schedule.vehicle.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'You can only view schedules for your own vehicles' },
        { status: 403 }
      )
    }

    // Calculate status
    const now = new Date()
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

    if (schedule.nextDueKm && schedule.vehicle.currentOdometer) {
      const kmRemaining = schedule.nextDueKm - schedule.vehicle.currentOdometer
      kmUntilDue = kmRemaining

      if (kmRemaining <= 0) {
        status = 'OVERDUE'
      } else if (kmRemaining <= 500) {
        status = 'DUE_SOON'
      }
    }

    return NextResponse.json({
      ...schedule,
      workOrders,
      status,
      daysUntilDue,
      kmUntilDue,
    })
  } catch (error) {
    console.error('Error fetching maintenance schedule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance schedule' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/company/vehicles/[vehicleId]/maintenance-schedules/[scheduleId]
 * Update maintenance schedule
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { vehicleId: string; scheduleId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { vehicleId, scheduleId } = params

    // Verify schedule exists and belongs to company's vehicle
    const existingSchedule = await prisma.maintenanceSchedule.findUnique({
      where: { id: scheduleId },
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

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    if (existingSchedule.vehicleId !== vehicleId) {
      return NextResponse.json({ error: 'Schedule does not belong to this vehicle' }, { status: 400 })
    }

    if (existingSchedule.vehicle.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'You can only update schedules for your own vehicles' },
        { status: 403 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validatedData = updateScheduleSchema.parse(body)

    // Recalculate next due date/km if intervals changed
    const intervalKm = validatedData.intervalKm !== undefined
      ? validatedData.intervalKm
      : existingSchedule.intervalKm
    const intervalDays = validatedData.intervalDays !== undefined
      ? validatedData.intervalDays
      : existingSchedule.intervalDays

    // Validate that at least one interval is specified
    if (!intervalKm && !intervalDays) {
      return NextResponse.json(
        { error: 'At least one interval (km or days) must be specified' },
        { status: 400 }
      )
    }

    let updateData: any = { ...validatedData }

    // Recalculate next due if intervals changed
    if (validatedData.intervalKm !== undefined || validatedData.intervalDays !== undefined) {
      const now = new Date()
      const currentOdometer = existingSchedule.vehicle.currentOdometer || 0

      if (validatedData.intervalDays !== undefined) {
        updateData.nextDueDate = intervalDays
          ? new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000)
          : null
      }

      if (validatedData.intervalKm !== undefined) {
        updateData.nextDueKm = intervalKm ? currentOdometer + intervalKm : null
      }
    }

    // Update schedule
    const updatedSchedule = await prisma.maintenanceSchedule.update({
      where: { id: scheduleId },
      data: updateData,
    })

    // Create admin log
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: 'MAINTENANCE_SCHEDULE_UPDATE',
        details: JSON.stringify({
          scheduleId,
          vehicleId,
          changes: validatedData,
        }),
        companyId: existingSchedule.vehicle.companyId,
      },
    })

    return NextResponse.json({
      message: 'Maintenance schedule updated successfully',
      schedule: updatedSchedule,
    })
  } catch (error) {
    console.error('Error updating maintenance schedule:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update maintenance schedule' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/company/vehicles/[vehicleId]/maintenance-schedules/[scheduleId]
 * Delete maintenance schedule
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { vehicleId: string; scheduleId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { vehicleId, scheduleId } = params

    // Verify schedule exists and belongs to company's vehicle
    const schedule = await prisma.maintenanceSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        vehicle: {
          select: {
            id: true,
            companyId: true,
          },
        },
      },
    })

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    if (schedule.vehicleId !== vehicleId) {
      return NextResponse.json({ error: 'Schedule does not belong to this vehicle' }, { status: 400 })
    }

    if (schedule.vehicle.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'You can only delete schedules for your own vehicles' },
        { status: 403 }
      )
    }

    // Check if there are active work orders linked to this schedule
    const activeWorkOrders = await prisma.workOrder.count({
      where: {
        scheduleId,
        status: {
          in: ['OPEN', 'IN_PROGRESS'],
        },
      },
    })

    if (activeWorkOrders > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete schedule with ${activeWorkOrders} active work order(s). Complete or cancel them first.`,
        },
        { status: 400 }
      )
    }

    // Count total work orders for logging
    const totalWorkOrders = await prisma.workOrder.count({
      where: { scheduleId },
    })

    // Delete schedule (work orders will have null scheduleId due to optional relation)
    await prisma.maintenanceSchedule.delete({
      where: { id: scheduleId },
    })

    // Create admin log
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: 'MAINTENANCE_SCHEDULE_DELETE',
        details: JSON.stringify({
          scheduleId,
          vehicleId,
          taskName: schedule.taskName,
          workOrderCount: totalWorkOrders,
        }),
        companyId: schedule.vehicle.companyId,
      },
    })

    return NextResponse.json({
      message: 'Maintenance schedule deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting maintenance schedule:', error)
    return NextResponse.json(
      { error: 'Failed to delete maintenance schedule' },
      { status: 500 }
    )
  }
}

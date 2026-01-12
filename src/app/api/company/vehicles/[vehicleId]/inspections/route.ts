import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'

/**
 * Vehicle Inspection API - Safety inspections and checklists
 * Company Admin only
 */

// Validation schema for creating inspection
const createInspectionSchema = z.object({
  inspectionType: z.enum(['DAILY', 'WEEKLY', 'PRE_TRIP', 'POST_TRIP', 'ANNUAL', 'SAFETY']),
  inspectedByUserId: z.string(),
  checklistResults: z.record(z.string(), z.union([z.boolean(), z.string(), z.number()])),
  status: z.enum(['PASS', 'FAIL', 'PASS_WITH_DEFECTS']),
  defectsFound: z.array(z.string()).optional(),
  odometerReading: z.number().int().positive().optional(),
  notes: z.string().optional(),
})

/**
 * GET /api/company/vehicles/[vehicleId]/inspections
 * List inspections for vehicle
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
    const inspectionType = searchParams.get('type')
    const status = searchParams.get('status')

    // Verify vehicle belongs to company
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, companyId: true },
    })

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    if (vehicle.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'You can only view inspections for your own vehicles' },
        { status: 403 }
      )
    }

    // Build where clause
    const where: any = { vehicleId }
    if (inspectionType) {
      where.inspectionType = inspectionType
    }
    if (status) {
      where.status = status
    }

    // Get inspections (inspectedByUserId and inspectedByName are denormalized)
    const inspections = await prisma.vehicleInspection.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Calculate summary
    const passCount = inspections.filter(i => i.status === 'PASS').length
    const failCount = inspections.filter(i => i.status === 'FAIL').length
    const passWithDefectsCount = inspections.filter(i => i.status === 'PASS_WITH_DEFECTS').length

    return NextResponse.json({
      inspections,
      summary: {
        total: inspections.length,
        passed: passCount,
        failed: failCount,
        passedWithDefects: passWithDefectsCount,
        passRate: inspections.length > 0 ? (passCount / inspections.length) * 100 : 0,
      },
    })
  } catch (error) {
    console.error('Error fetching inspections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inspections' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/company/vehicles/[vehicleId]/inspections
 * Create inspection record
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
        defectCount: true,
        criticalDefectCount: true,
      },
    })

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    if (vehicle.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'You can only create inspections for your own vehicles' },
        { status: 403 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validatedData = createInspectionSchema.parse(body)

    // Verify inspector belongs to company
    const inspector = await prisma.user.findUnique({
      where: { id: validatedData.inspectedByUserId },
      select: { companyId: true, name: true },
    })

    if (!inspector || inspector.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'Invalid inspector assignment' },
        { status: 400 }
      )
    }

    // Count defects
    const defectsFound = validatedData.defectsFound || []
    const criticalDefectsCount = defectsFound.filter(d =>
      d.toLowerCase().includes('critical') || d.toLowerCase().includes('urgent')
    ).length

    // Create inspection
    const inspection = await prisma.vehicleInspection.create({
      data: {
        vehicleId,
        inspectionType: validatedData.inspectionType,
        inspectedByUserId: validatedData.inspectedByUserId,
        inspectedByName: inspector.name || 'Unknown',
        checklistResults: JSON.stringify(validatedData.checklistResults),
        status: validatedData.status,
        defectsFound: defectsFound.length,
        criticalDefects: criticalDefectsCount,
        odometerReading: validatedData.odometerReading,
        notes: validatedData.notes,
      },
    })

    // Update vehicle inspection dates and defect counts
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        lastInspectionDate: new Date(),
        defectCount: vehicle.defectCount + defectsFound.length,
        criticalDefectCount: vehicle.criticalDefectCount + criticalDefectsCount,
      },
    })

    // Update odometer if provided
    if (validatedData.odometerReading) {
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          currentOdometer: validatedData.odometerReading,
          odometerLastUpdated: new Date(),
        },
      })

      await prisma.odometerLog.create({
        data: {
          vehicleId,
          reading: validatedData.odometerReading,
          source: 'INSPECTION',
        },
      })
    }

    // Auto-create work order if inspection failed or has defects
    if (validatedData.status === 'FAIL' || validatedData.status === 'PASS_WITH_DEFECTS') {
      const workOrderNumber = `WO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

      const workOrder = await prisma.workOrder.create({
        data: {
          vehicleId,
          companyId: vehicle.companyId,
          workOrderNumber,
          title: `Inspection Defects - ${validatedData.inspectionType}`,
          taskType: 'CORRECTIVE',
          description: `Defects found during ${validatedData.inspectionType} inspection: ${defectsFound.join(', ')}`,
          priority: validatedData.status === 'FAIL' ? 4 : 3, // 4=Urgent, 3=High
          status: 'OPEN',
          completionNotes: validatedData.notes,
        },
      })

      // Link work order to inspection
      await prisma.vehicleInspection.update({
        where: { id: inspection.id },
        data: { workOrderId: workOrder.id },
      })
    }

    // Create admin log
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: 'VEHICLE_INSPECTION_CREATE',
        details: JSON.stringify({
          inspectionId: inspection.id,
          vehicleId,
          inspectionType: validatedData.inspectionType,
          status: validatedData.status,
          defectsCount: defectsFound.length,
        }),
        companyId: vehicle.companyId,
      },
    })

    return NextResponse.json(
      {
        message: 'Inspection recorded successfully',
        inspection,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating inspection:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create inspection' },
      { status: 500 }
    )
  }
}

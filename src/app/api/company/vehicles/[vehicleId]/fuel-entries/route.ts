import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'

/**
 * Fuel Entry API - Track fuel consumption
 * Company Admin only
 */

// Validation schema for fuel entry
const createFuelEntrySchema = z.object({
  liters: z.number().positive('Liters must be positive'),
  costBirr: z.number().positive('Cost must be positive'),
  odometerReading: z.number().int().positive('Odometer reading must be positive'),
  fuelType: z.enum(['DIESEL', 'PETROL', 'CNG']).default('DIESEL'),
  station: z.string().optional(),
  city: z.string().optional(),
  receiptNumber: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'FUEL_CARD', 'TELEBIRR']).optional(),
  recordedByUserId: z.string().optional(),
  recordedByName: z.string().optional(),
})

/**
 * GET /api/company/vehicles/[vehicleId]/fuel-entries
 * List fuel entries for vehicle
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
      select: { id: true, companyId: true },
    })

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    if (vehicle.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'You can only view fuel entries for your own vehicles' },
        { status: 403 }
      )
    }

    // Get fuel entries (recordedByUserId and recordedByName are denormalized fields)
    const entries = await prisma.fuelEntry.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'desc' },
      take: 100, // Last 100 entries
    })

    // Calculate summary statistics
    const totalLiters = entries.reduce((sum, e) => sum + e.liters, 0)
    const totalCost = entries.reduce((sum, e) => sum + e.costBirr, 0)
    const avgEfficiency = entries.length > 0
      ? entries.reduce((sum, e) => sum + (e.litersPer100Km || 0), 0) / entries.filter(e => e.litersPer100Km).length
      : null

    return NextResponse.json({
      entries,
      summary: {
        totalEntries: entries.length,
        totalLiters,
        totalCost,
        avgEfficiencyL100km: avgEfficiency,
        avgCostPerLiter: totalLiters > 0 ? totalCost / totalLiters : 0,
      },
    })
  } catch (error) {
    console.error('Error fetching fuel entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fuel entries' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/company/vehicles/[vehicleId]/fuel-entries
 * Create fuel entry
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
      select: { id: true, companyId: true, currentOdometer: true },
    })

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    if (vehicle.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'You can only create fuel entries for your own vehicles' },
        { status: 403 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validatedData = createFuelEntrySchema.parse(body)

    // Validate odometer reading is not decreasing
    if (vehicle.currentOdometer && validatedData.odometerReading < vehicle.currentOdometer) {
      return NextResponse.json(
        { error: 'Odometer reading cannot be less than current odometer' },
        { status: 400 }
      )
    }

    // Calculate fuel efficiency if previous entry exists
    const previousEntry = await prisma.fuelEntry.findFirst({
      where: { vehicleId },
      orderBy: { odometerReading: 'desc' },
    })

    let litersPer100Km: number | null = null
    if (previousEntry && previousEntry.odometerReading < validatedData.odometerReading) {
      const kmDriven = validatedData.odometerReading - previousEntry.odometerReading
      litersPer100Km = (validatedData.liters / kmDriven) * 100
    }

    // Calculate cost per liter
    const costPerLiter = validatedData.costBirr / validatedData.liters

    // Create fuel entry
    const entry = await prisma.fuelEntry.create({
      data: {
        vehicleId,
        companyId: vehicle.companyId,
        liters: validatedData.liters,
        costBirr: validatedData.costBirr,
        costPerLiter,
        odometerReading: validatedData.odometerReading,
        fuelType: validatedData.fuelType,
        station: validatedData.station,
        city: validatedData.city,
        receiptNumber: validatedData.receiptNumber,
        paymentMethod: validatedData.paymentMethod,
        recordedByUserId: validatedData.recordedByUserId || session.user.id,
        recordedByName: validatedData.recordedByName || session.user.name,
        litersPer100Km,
      },
    })

    // Update vehicle odometer
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        currentOdometer: validatedData.odometerReading,
        odometerLastUpdated: new Date(),
      },
    })

    // Create odometer log
    await prisma.odometerLog.create({
      data: {
        vehicleId,
        reading: validatedData.odometerReading,
        source: 'FUEL_ENTRY',
      },
    })

    // Create admin log
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: 'FUEL_ENTRY_CREATE',
        details: JSON.stringify({
          entryId: entry.id,
          vehicleId,
          liters: validatedData.liters,
          cost: validatedData.costBirr,
          odometerReading: validatedData.odometerReading,
        }),
        companyId: vehicle.companyId,
      },
    })

    return NextResponse.json(
      {
        message: 'Fuel entry created successfully',
        entry,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating fuel entry:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create fuel entry' },
      { status: 500 }
    )
  }
}

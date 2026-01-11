import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'

/**
 * Trip Log API - Track odometer and fuel readings before/after trips
 * Company Admin and assigned staff can update
 */

// Validation schema for start readings
const startReadingsSchema = z.object({
  startOdometer: z.number().int().nonnegative(),
  startFuel: z.number().nonnegative().optional(),
  startFuelUnit: z.enum(['LITERS', 'PERCENTAGE']).optional(),
  startNotes: z.string().max(500).optional(),
})

// Validation schema for end readings
const endReadingsSchema = z.object({
  endOdometer: z.number().int().nonnegative(),
  endFuel: z.number().nonnegative().optional(),
  endNotes: z.string().max(500).optional(),
})

/**
 * GET /api/company/trips/[tripId]/log
 * Get trip log (odometer/fuel readings)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tripId } = params

    // Get trip with log
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        tripLog: true,
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            sideNumber: true,
            currentOdometer: true,
            fuelCapacity: true,
          },
        },
      },
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Check access - company admin or assigned staff
    const isCompanyAdmin =
      session.user.role === 'COMPANY_ADMIN' &&
      session.user.companyId === trip.companyId
    const isAssignedStaff =
      session.user.id === trip.driverId ||
      session.user.id === trip.conductorId ||
      session.user.id === trip.manualTicketerId

    if (!isCompanyAdmin && !isAssignedStaff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({
      tripLog: trip.tripLog,
      vehicle: trip.vehicle,
      tripId: trip.id,
    })
  } catch (error) {
    console.error('Error fetching trip log:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trip log' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/company/trips/[tripId]/log/start
 * Record start readings (before trip)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tripId } = params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') // 'start' or 'end'

    // Get trip
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        tripLog: true,
        vehicle: true,
      },
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    if (!trip.vehicleId || !trip.vehicle) {
      return NextResponse.json(
        { error: 'No vehicle assigned to this trip' },
        { status: 400 }
      )
    }

    // Check access
    const isCompanyAdmin =
      session.user.role === 'COMPANY_ADMIN' &&
      session.user.companyId === trip.companyId
    const isAssignedStaff =
      session.user.id === trip.driverId ||
      session.user.id === trip.conductorId

    if (!isCompanyAdmin && !isAssignedStaff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()

    if (action === 'start') {
      // Validate start readings
      const validatedData = startReadingsSchema.parse(body)

      // Create or update trip log with start readings
      const tripLog = await prisma.tripLog.upsert({
        where: { tripId },
        create: {
          tripId,
          vehicleId: trip.vehicleId,
          companyId: trip.companyId,
          startOdometer: validatedData.startOdometer,
          startFuel: validatedData.startFuel,
          startFuelUnit: validatedData.startFuelUnit,
          startedAt: new Date(),
          startedById: session.user.id,
          startedByName: session.user.name,
          startNotes: validatedData.startNotes,
        },
        update: {
          startOdometer: validatedData.startOdometer,
          startFuel: validatedData.startFuel,
          startFuelUnit: validatedData.startFuelUnit,
          startedAt: new Date(),
          startedById: session.user.id,
          startedByName: session.user.name,
          startNotes: validatedData.startNotes,
        },
      })

      // Update vehicle's current odometer
      await prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: { currentOdometer: validatedData.startOdometer },
      })

      return NextResponse.json({
        message: 'Start readings recorded',
        tripLog,
      })
    } else if (action === 'end') {
      // Validate end readings
      const validatedData = endReadingsSchema.parse(body)

      // Must have start readings first
      if (!trip.tripLog || !trip.tripLog.startOdometer) {
        return NextResponse.json(
          { error: 'Start readings must be recorded first' },
          { status: 400 }
        )
      }

      // Validate end odometer is greater than start
      if (validatedData.endOdometer < trip.tripLog.startOdometer) {
        return NextResponse.json(
          { error: 'End odometer must be greater than start odometer' },
          { status: 400 }
        )
      }

      // Calculate metrics
      const distanceTraveled =
        validatedData.endOdometer - trip.tripLog.startOdometer
      let fuelConsumed: number | null = null
      let fuelEfficiency: number | null = null

      if (trip.tripLog.startFuel && validatedData.endFuel !== undefined) {
        fuelConsumed = trip.tripLog.startFuel - validatedData.endFuel
        if (fuelConsumed > 0 && distanceTraveled > 0) {
          fuelEfficiency = distanceTraveled / fuelConsumed // km per liter
        }
      }

      // Update trip log with end readings
      const tripLog = await prisma.tripLog.update({
        where: { tripId },
        data: {
          endOdometer: validatedData.endOdometer,
          endFuel: validatedData.endFuel,
          endedAt: new Date(),
          endedById: session.user.id,
          endedByName: session.user.name,
          endNotes: validatedData.endNotes,
          distanceTraveled,
          fuelConsumed,
          fuelEfficiency,
        },
      })

      // Update vehicle's current odometer
      await prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: { currentOdometer: validatedData.endOdometer },
      })

      // Also create an odometer log entry for history
      await prisma.odometerLog.create({
        data: {
          vehicleId: trip.vehicleId,
          reading: validatedData.endOdometer,
          source: 'TRIP_END',
          recordedBy: session.user.id,
          notes: `Trip ${tripId} - ${trip.origin} to ${trip.destination}`,
        },
      })

      return NextResponse.json({
        message: 'End readings recorded',
        tripLog,
        metrics: {
          distanceTraveled,
          fuelConsumed,
          fuelEfficiency,
        },
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use ?action=start or ?action=end' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error recording trip log:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to record trip log' },
      { status: 500 }
    )
  }
}

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

    // Check access - company admin or assigned staff can VIEW
    const isCompanyAdmin =
      session.user.role === 'COMPANY_ADMIN' &&
      session.user.companyId === trip.companyId
    const isAssignedDriver = session.user.id === trip.driverId
    const isAssignedStaff =
      isAssignedDriver ||
      session.user.id === trip.conductorId ||
      session.user.id === trip.manualTicketerId

    if (!isCompanyAdmin && !isAssignedStaff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Only admin (without staff role) or assigned driver can EDIT
    const canEdit = (isCompanyAdmin && !session.user.staffRole) || isAssignedDriver

    return NextResponse.json({
      tripLog: trip.tripLog,
      vehicle: trip.vehicle,
      tripId: trip.id,
      canEdit,
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

    // Check access - Only admin and driver can edit trip logs
    const isCompanyAdmin =
      session.user.role === 'COMPANY_ADMIN' &&
      session.user.companyId === trip.companyId &&
      !session.user.staffRole // Pure admin, not staff with admin role
    const isDriver = session.user.id === trip.driverId

    if (!isCompanyAdmin && !isDriver) {
      return NextResponse.json(
        { error: 'Only admin or assigned driver can record trip logs' },
        { status: 403 }
      )
    }

    const body = await request.json()

    if (action === 'start') {
      // Only allow start readings when trip is DEPARTED or later
      // This prevents premature odometer recording
      if (!['DEPARTED', 'COMPLETED'].includes(trip.status || 'SCHEDULED')) {
        return NextResponse.json(
          { error: 'Can only record start readings after trip has departed. Please start the trip first.' },
          { status: 400 }
        )
      }

      // Validate start readings
      const validatedData = startReadingsSchema.parse(body)

      // CRITICAL: Check if someone else has already started recording
      if (trip.tripLog && trip.tripLog.startedById) {
        const existingRecorderId = trip.tripLog.startedById
        const currentUserId = session.user.id

        // If someone else started, prevent this user from modifying
        if (existingRecorderId !== currentUserId) {
          // Get the original recorder's name
          const originalRecorder = await prisma.user.findUnique({
            where: { id: existingRecorderId },
            select: { name: true, role: true, staffRole: true },
          })

          return NextResponse.json(
            {
              error: 'Trip log already started by another user',
              message: `${originalRecorder?.name || 'Another user'} has already started recording trip log. Only they can modify it. You can view the progress but cannot edit.`,
              startedBy: originalRecorder?.name,
            },
            { status: 409 } // Conflict
          )
        }
      }

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

      // Create admin log entry
      await prisma.adminLog.create({
        data: {
          userId: session.user.id,
          action: 'TRIP_LOG_START',
          details: JSON.stringify({
            tripId,
            route: `${trip.origin} → ${trip.destination}`,
            vehiclePlate: trip.vehicle.plateNumber,
            startOdometer: validatedData.startOdometer,
            startFuel: validatedData.startFuel,
            startFuelUnit: validatedData.startFuelUnit,
            notes: validatedData.startNotes,
            recordedBy: session.user.name,
          }),
          tripId,
          companyId: trip.companyId,
        },
      })

      // If driver recorded (not admin), notify company admins
      if (isDriver) {
        // Find company admins to notify
        const companyAdmins = await prisma.user.findMany({
          where: {
            companyId: trip.companyId,
            role: 'COMPANY_ADMIN',
            staffRole: null, // Pure admins, not staff
          },
          select: { id: true },
        })

        // Create notification for each admin
        if (companyAdmins.length > 0) {
          await prisma.notification.createMany({
            data: companyAdmins.map((admin) => ({
              recipientId: admin.id,
              recipientType: 'USER',
              type: 'TRIP_LOG_RECORDED',
              title: 'Trip Log Recorded',
              message: `Driver ${session.user.name} recorded start odometer (${validatedData.startOdometer.toLocaleString()} km) for trip ${trip.origin} → ${trip.destination}`,
              metadata: JSON.stringify({
                tripId,
                route: `${trip.origin} → ${trip.destination}`,
                vehiclePlate: trip.vehicle?.plateNumber,
                startOdometer: validatedData.startOdometer,
                recordedBy: session.user.name,
                recordedById: session.user.id,
              }),
            })),
          })
        }
      }

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

      // CRITICAL: Check if someone else started recording - only they can end it
      if (trip.tripLog.startedById) {
        const existingRecorderId = trip.tripLog.startedById
        const currentUserId = session.user.id

        // If someone else started, prevent this user from modifying
        if (existingRecorderId !== currentUserId) {
          // Get the original recorder's name
          const originalRecorder = await prisma.user.findUnique({
            where: { id: existingRecorderId },
            select: { name: true },
          })

          return NextResponse.json(
            {
              error: 'Trip log started by another user',
              message: `${originalRecorder?.name || 'Another user'} started recording this trip log. Only they can record end readings.`,
              startedBy: originalRecorder?.name,
            },
            { status: 409 } // Conflict
          )
        }
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

      // Create admin log entry for trip end
      await prisma.adminLog.create({
        data: {
          userId: session.user.id,
          action: 'TRIP_LOG_END',
          details: JSON.stringify({
            tripId,
            route: `${trip.origin} → ${trip.destination}`,
            vehiclePlate: trip.vehicle?.plateNumber,
            startOdometer: trip.tripLog.startOdometer,
            endOdometer: validatedData.endOdometer,
            distanceTraveled,
            fuelConsumed,
            fuelEfficiency: fuelEfficiency ? `${fuelEfficiency.toFixed(2)} km/L` : null,
            notes: validatedData.endNotes,
            recordedBy: session.user.name,
          }),
          tripId,
          companyId: trip.companyId,
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

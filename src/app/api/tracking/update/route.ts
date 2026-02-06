import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { requireAuth, handleAuthError } from '@/lib/auth-helpers'
import { checkEnhancedRateLimit } from '@/lib/rate-limit'
import { calculateETA, calculateAverageSpeed, getRemainingStops } from '@/lib/tracking/eta'

const RATE_LIMIT = { maxRequests: 12, windowMs: 60 * 1000 } // 12 req/min per user

const updateSchema = z.object({
  tripId: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitude: z.number().nullish(),
  accuracy: z.number().min(0).nullish(),
  heading: z.number().min(0).max(360).nullish(),
  speed: z.number().min(0).nullish(),
  recordedAt: z.string().datetime().or(z.string().transform((s) => new Date(s).toISOString())),
})

/**
 * POST /api/tracking/update - Driver sends GPS position
 * Auth: NextAuth session, must be DRIVER/CONDUCTOR assigned to the trip
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    // Rate limit per user
    if (!checkEnhancedRateLimit(request, session.user.id, RATE_LIMIT)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await request.json()
    const data = updateSchema.parse(body)

    // Verify user is assigned to this trip as driver or conductor
    const trip = await prisma.trip.findUnique({
      where: { id: data.tripId },
      select: {
        id: true,
        status: true,
        driverId: true,
        conductorId: true,
        vehicleId: true,
        destination: true,
        intermediateStops: true,
        companyId: true,
      },
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Must be DEPARTED to track
    if (trip.status !== 'DEPARTED') {
      return NextResponse.json(
        { error: 'Trip is not currently departed' },
        { status: 400 }
      )
    }

    // Verify assignment
    const isAssigned =
      trip.driverId === session.user.id || trip.conductorId === session.user.id

    // Also allow company admins
    const isCompanyAdmin =
      session.user.role === 'COMPANY_ADMIN' &&
      session.user.companyId === trip.companyId

    if (!isAssigned && !isCompanyAdmin && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'You are not assigned to this trip' },
        { status: 403 }
      )
    }

    const recordedAt = new Date(data.recordedAt)
    const now = new Date()

    // Insert position record
    await prisma.tripPosition.create({
      data: {
        tripId: data.tripId,
        vehicleId: trip.vehicleId,
        latitude: data.latitude,
        longitude: data.longitude,
        altitude: data.altitude ?? null,
        accuracy: data.accuracy ?? null,
        heading: data.heading ?? null,
        speed: data.speed ?? null,
        recordedAt,
      },
    })

    // Calculate ETA using recent positions
    let estimatedArrival: Date | null = null

    try {
      // Get destination city coordinates
      const destCity = await prisma.city.findFirst({
        where: { name: trip.destination },
        select: { latitude: true, longitude: true, name: true },
      })

      if (destCity?.latitude && destCity?.longitude) {
        // Get recent positions for average speed
        const recentPositions = await prisma.tripPosition.findMany({
          where: { tripId: data.tripId },
          orderBy: { recordedAt: 'desc' },
          take: 10,
          select: {
            latitude: true,
            longitude: true,
            recordedAt: true,
            speed: true,
          },
        })

        const avgSpeed = calculateAverageSpeed(recentPositions.reverse())

        // Get remaining intermediate stops
        let remainingStops: Array<{ name: string; latitude: number; longitude: number }> = []
        if (trip.intermediateStops) {
          try {
            const stops = JSON.parse(trip.intermediateStops) as string[]
            const stopCities = await prisma.city.findMany({
              where: { name: { in: stops } },
              select: { name: true, latitude: true, longitude: true },
            })

            const stopsWithCoords = stopCities.filter(
              (c): c is { name: string; latitude: number; longitude: number } =>
                c.latitude != null && c.longitude != null
            )

            // Get origin for remaining stops calculation
            const originCity = await prisma.city.findFirst({
              where: { name: { equals: trip.destination } }, // We'll get actual origin below
              select: { latitude: true, longitude: true, name: true },
            })

            if (stopsWithCoords.length > 0) {
              remainingStops = getRemainingStops(
                data.latitude,
                data.longitude,
                { name: destCity.name, latitude: destCity.latitude, longitude: destCity.longitude },
                stopsWithCoords
              )
            }
          } catch {
            // Ignore intermediate stops parse errors
          }
        }

        const eta = calculateETA(
          data.latitude,
          data.longitude,
          { name: destCity.name, latitude: destCity.latitude, longitude: destCity.longitude },
          avgSpeed,
          remainingStops.length > 0 ? remainingStops : undefined
        )

        estimatedArrival = eta.estimatedArrival
      }
    } catch {
      // ETA calculation is best-effort
    }

    // Update trip with latest position
    const tripUpdate: Record<string, unknown> = {
      trackingActive: true,
      lastLatitude: data.latitude,
      lastLongitude: data.longitude,
      lastSpeed: data.speed ?? null,
      lastPositionAt: now,
    }

    if (estimatedArrival) {
      tripUpdate.estimatedArrival = estimatedArrival
    }

    await prisma.trip.update({
      where: { id: data.tripId },
      data: tripUpdate,
    })

    // Update vehicle position if assigned
    if (trip.vehicleId) {
      await prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: {
          lastLatitude: data.latitude,
          lastLongitude: data.longitude,
          lastPositionAt: now,
        },
      })
    }

    return NextResponse.json({
      success: true,
      estimatedArrival: estimatedArrival?.toISOString() ?? null,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid GPS data', details: error.errors },
        { status: 400 }
      )
    }
    if (error instanceof Error && (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN')) {
      return handleAuthError(error)
    }
    console.error('[Tracking] Update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

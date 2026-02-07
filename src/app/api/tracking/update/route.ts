import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { requireAuth, handleAuthError } from '@/lib/auth-helpers'
import { checkEnhancedRateLimit } from '@/lib/rate-limit'
import { processPositionUpdate } from '@/lib/tracking/update-position'

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

    const { estimatedArrival } = await processPositionUpdate({
      tripId: data.tripId,
      vehicleId: trip.vehicleId,
      latitude: data.latitude,
      longitude: data.longitude,
      altitude: data.altitude ?? null,
      accuracy: data.accuracy ?? null,
      heading: data.heading ?? null,
      speed: data.speed ?? null,
      recordedAt: new Date(data.recordedAt),
      destination: trip.destination,
      intermediateStops: trip.intermediateStops,
    })

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

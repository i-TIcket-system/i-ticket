import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import prisma from '@/lib/db'
import { requireAuth, handleAuthError } from '@/lib/auth-helpers'

const bodySchema = z.object({
  tripId: z.string().min(1),
})

/**
 * POST /api/tracking/generate-token - Generate OsmAnd tracking token for a trip
 *
 * Auth: NextAuth session (DRIVER, CONDUCTOR, or COMPANY_ADMIN assigned to the trip)
 * Idempotent: returns existing token if one already exists
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    const body = await request.json()
    const { tripId } = bodySchema.parse(body)

    // Get trip and verify access
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        status: true,
        driverId: true,
        conductorId: true,
        companyId: true,
        trackingToken: true,
      },
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    if (trip.status !== 'DEPARTED') {
      return NextResponse.json(
        { error: 'Trip must be DEPARTED to enable tracking' },
        { status: 400 }
      )
    }

    // Verify user is assigned to this trip
    const isAssigned =
      trip.driverId === session.user.id || trip.conductorId === session.user.id
    const isCompanyAdmin =
      session.user.role === 'COMPANY_ADMIN' &&
      session.user.companyId === trip.companyId
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

    if (!isAssigned && !isCompanyAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'You are not assigned to this trip' },
        { status: 403 }
      )
    }

    // Idempotent: return existing token if already generated
    if (trip.trackingToken) {
      return NextResponse.json({
        token: trip.trackingToken,
        trackingUrl: buildTrackingUrl(request, trip.trackingToken),
        existing: true,
      })
    }

    // Generate 256-bit random token (64 hex chars)
    const token = crypto.randomBytes(32).toString('hex')

    await prisma.trip.update({
      where: { id: tripId },
      data: { trackingToken: token },
    })

    return NextResponse.json({
      token,
      trackingUrl: buildTrackingUrl(request, token),
      existing: false,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }
    if (error instanceof Error && (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN')) {
      return handleAuthError(error)
    }
    console.error('[Tracking] Token generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Build the OsmAnd tracking URL with placeholder parameters.
 * OsmAnd replaces {0}=lat, {1}=lon, {2}=timestamp, {3}=hdop, {4}=altitude, {5}=speed, {6}=bearing
 */
function buildTrackingUrl(request: NextRequest, token: string): string {
  const host = request.headers.get('host') || 'i-ticket.et'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  return `${protocol}://${host}/api/tracking/osmand?token=${token}&lat={0}&lon={1}&timestamp={2}&hdop={3}&altitude={4}&speed={5}&bearing={6}`
}

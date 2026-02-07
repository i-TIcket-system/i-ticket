import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'
import { processPositionUpdate } from '@/lib/tracking/update-position'

const RATE_LIMIT = { maxRequests: 12, windowMs: 60 * 1000 } // 12 req/min per token

// OsmAnd sends all values as query string params (strings)
const osmandSchema = z.object({
  token: z.string().min(1),
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  timestamp: z.coerce.number().optional(), // Unix epoch seconds
  hdop: z.coerce.number().min(0).optional(), // Horizontal dilution of precision
  altitude: z.coerce.number().optional(),
  speed: z.coerce.number().min(0).optional(), // m/s from OsmAnd
  bearing: z.coerce.number().min(0).max(360).optional(),
})

/**
 * GET /api/tracking/osmand - OsmAnd background GPS tracking endpoint
 *
 * OsmAnd's "Online GPS Tracking" plugin sends:
 * GET /api/tracking/osmand?token=XXX&lat={0}&lon={1}&timestamp={2}&hdop={3}&altitude={4}&speed={5}&bearing={6}
 *
 * Auth: Token-based (trackingToken on Trip model)
 * Returns plain text (OsmAnd expects simple responses, stops retrying on HTTP errors)
 */
export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries())
    const data = osmandSchema.safeParse(params)

    if (!data.success) {
      // Return 200 with error body — OsmAnd stops retrying on non-200
      return new Response('INVALID_PARAMS', { status: 200 })
    }

    const { token, lat, lon, timestamp, hdop, altitude, speed, bearing } = data.data

    // Rate limit per token
    if (!checkRateLimit(`osmand:${token}`, RATE_LIMIT)) {
      return new Response('RATE_LIMITED', { status: 200 })
    }

    // Look up trip by tracking token
    const trip = await prisma.trip.findUnique({
      where: { trackingToken: token },
      select: {
        id: true,
        status: true,
        vehicleId: true,
        destination: true,
        intermediateStops: true,
      },
    })

    if (!trip) {
      return new Response('INVALID_TOKEN', { status: 200 })
    }

    if (trip.status !== 'DEPARTED') {
      return new Response('TRIP_NOT_ACTIVE', { status: 200 })
    }

    // Deduplicate: skip if a position within 5s exists for this trip
    const recordedAt = timestamp ? new Date(timestamp * 1000) : new Date()
    const dedupeWindow = new Date(recordedAt.getTime() - 5000)

    const recentPosition = await prisma.tripPosition.findFirst({
      where: {
        tripId: trip.id,
        recordedAt: { gte: dedupeWindow },
      },
      select: { id: true },
    })

    if (recentPosition) {
      return new Response('OK', { status: 200 }) // Silently skip duplicate
    }

    // Convert OsmAnd units
    const speedKmh = speed != null ? speed * 3.6 : null // m/s → km/h
    // hdop is not meters but a multiplier; rough approximation: hdop * 5 ≈ accuracy in meters
    const accuracyMeters = hdop != null ? hdop * 5 : null

    await processPositionUpdate({
      tripId: trip.id,
      vehicleId: trip.vehicleId,
      latitude: lat,
      longitude: lon,
      altitude: altitude ?? null,
      accuracy: accuracyMeters,
      heading: bearing ?? null,
      speed: speedKmh,
      recordedAt,
      destination: trip.destination,
      intermediateStops: trip.intermediateStops,
    })

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('[OsmAnd] Tracking error:', error)
    // Always return 200 — OsmAnd stops retrying on HTTP errors
    return new Response('ERROR', { status: 200 })
  }
}

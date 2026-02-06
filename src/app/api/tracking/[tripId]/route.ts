import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'

const RATE_LIMIT = { maxRequests: 30, windowMs: 60 * 1000 } // 30 req/min per IP
const STALE_THRESHOLD_MS = 120 * 1000 // 2 minutes

/**
 * GET /api/tracking/[tripId] - Get bus position (public endpoint)
 * Query: ?history=true&limit=50 for GPS trail polyline
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const ip = getClientIdentifier(request)
    if (!checkRateLimit(`tracking:${ip}`, RATE_LIMIT)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const tripId = params.tripId
    const { searchParams } = new URL(request.url)
    const includeHistory = searchParams.get('history') === 'true'
    const historyLimit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 200)

    // Get trip with latest position + route info
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        status: true,
        origin: true,
        destination: true,
        intermediateStops: true,
        departureTime: true,
        estimatedDuration: true,
        trackingActive: true,
        lastLatitude: true,
        lastLongitude: true,
        lastSpeed: true,
        lastPositionAt: true,
        estimatedArrival: true,
        company: { select: { name: true } },
        vehicle: {
          select: {
            plateNumber: true,
            sideNumber: true,
            make: true,
            model: true,
          },
        },
      },
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Get city coordinates for route rendering
    const cityNames = [trip.origin, trip.destination]
    let intermediateStopNames: string[] = []
    if (trip.intermediateStops) {
      try {
        intermediateStopNames = JSON.parse(trip.intermediateStops) as string[]
        cityNames.push(...intermediateStopNames)
      } catch {
        // Ignore parse error
      }
    }

    const cities = await prisma.city.findMany({
      where: { name: { in: cityNames } },
      select: { name: true, latitude: true, longitude: true },
    })

    const cityMap = new Map(cities.map((c) => [c.name, c]))

    // Build route with coordinates
    const originCity = cityMap.get(trip.origin)
    const destCity = cityMap.get(trip.destination)

    const route = {
      origin: {
        name: trip.origin,
        latitude: originCity?.latitude ?? null,
        longitude: originCity?.longitude ?? null,
      },
      destination: {
        name: trip.destination,
        latitude: destCity?.latitude ?? null,
        longitude: destCity?.longitude ?? null,
      },
      stops: intermediateStopNames.map((name) => {
        const city = cityMap.get(name)
        return {
          name,
          latitude: city?.latitude ?? null,
          longitude: city?.longitude ?? null,
        }
      }),
    }

    // Determine tracking status
    let trackingStatus: 'live' | 'stale' | 'off' = 'off'
    if (trip.trackingActive && trip.lastPositionAt) {
      const age = Date.now() - new Date(trip.lastPositionAt).getTime()
      trackingStatus = age > STALE_THRESHOLD_MS ? 'stale' : 'live'
    }

    // Get position history if requested
    let history: Array<{
      latitude: number
      longitude: number
      speed: number | null
      heading: number | null
      recordedAt: string
    }> = []

    if (includeHistory && trip.trackingActive) {
      const positions = await prisma.tripPosition.findMany({
        where: { tripId },
        orderBy: { recordedAt: 'desc' },
        take: historyLimit,
        select: {
          latitude: true,
          longitude: true,
          speed: true,
          heading: true,
          recordedAt: true,
        },
      })

      history = positions.reverse().map((p) => ({
        latitude: p.latitude,
        longitude: p.longitude,
        speed: p.speed,
        heading: p.heading,
        recordedAt: p.recordedAt.toISOString(),
      }))
    }

    return NextResponse.json({
      tripId: trip.id,
      status: trip.status,
      company: trip.company.name,
      vehicle: trip.vehicle,
      departureTime: trip.departureTime.toISOString(),
      estimatedDuration: trip.estimatedDuration,
      tracking: trackingStatus,
      currentPosition: trip.lastLatitude != null
        ? {
            latitude: trip.lastLatitude,
            longitude: trip.lastLongitude,
            speed: trip.lastSpeed,
            updatedAt: trip.lastPositionAt?.toISOString() ?? null,
          }
        : null,
      estimatedArrival: trip.estimatedArrival?.toISOString() ?? null,
      route,
      history,
    })
  } catch (error) {
    console.error('[Tracking] Get position error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

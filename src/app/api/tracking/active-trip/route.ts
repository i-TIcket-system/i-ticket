import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth, handleAuthError } from '@/lib/auth-helpers'

/**
 * GET /api/tracking/active-trip - Get driver's current DEPARTED trip
 * Auth: NextAuth session (DRIVER/CONDUCTOR)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    // Find the user's assigned DEPARTED trip
    const trip = await prisma.trip.findFirst({
      where: {
        status: 'DEPARTED',
        OR: [
          { driverId: session.user.id },
          { conductorId: session.user.id },
        ],
      },
      select: {
        id: true,
        origin: true,
        destination: true,
        intermediateStops: true,
        departureTime: true,
        estimatedDuration: true,
        distance: true,
        trackingActive: true,
        lastLatitude: true,
        lastLongitude: true,
        lastSpeed: true,
        lastPositionAt: true,
        estimatedArrival: true,
        vehicle: {
          select: {
            plateNumber: true,
            sideNumber: true,
          },
        },
        company: {
          select: { name: true },
        },
      },
    })

    if (!trip) {
      return NextResponse.json({ trip: null })
    }

    // Get city coordinates for the route
    const cityNames = [trip.origin, trip.destination]
    let intermediateStopNames: string[] = []
    if (trip.intermediateStops) {
      try {
        intermediateStopNames = JSON.parse(trip.intermediateStops) as string[]
        cityNames.push(...intermediateStopNames)
      } catch {
        // Ignore
      }
    }

    const cities = await prisma.city.findMany({
      where: { name: { in: cityNames } },
      select: { name: true, latitude: true, longitude: true },
    })

    const cityMap = new Map(cities.map((c) => [c.name, c]))

    const originCity = cityMap.get(trip.origin)
    const destCity = cityMap.get(trip.destination)

    return NextResponse.json({
      trip: {
        id: trip.id,
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
        departureTime: trip.departureTime.toISOString(),
        estimatedDuration: trip.estimatedDuration,
        distance: trip.distance,
        trackingActive: trip.trackingActive,
        lastLatitude: trip.lastLatitude,
        lastLongitude: trip.lastLongitude,
        lastSpeed: trip.lastSpeed,
        lastPositionAt: trip.lastPositionAt?.toISOString() ?? null,
        estimatedArrival: trip.estimatedArrival?.toISOString() ?? null,
        vehicle: trip.vehicle,
        company: trip.company.name,
      },
    })
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN')) {
      return handleAuthError(error)
    }
    console.error('[Tracking] Active trip error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

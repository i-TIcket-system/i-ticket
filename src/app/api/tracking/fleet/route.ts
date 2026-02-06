import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireCompanyAdmin, handleAuthError } from '@/lib/auth-helpers'

/**
 * GET /api/tracking/fleet - Company fleet map data
 * Auth: Company admin
 * Returns all DEPARTED trips with active tracking for this company
 */
export async function GET(request: NextRequest) {
  try {
    const { companyId } = await requireCompanyAdmin()

    const trips = await prisma.trip.findMany({
      where: {
        companyId,
        status: 'DEPARTED',
      },
      select: {
        id: true,
        origin: true,
        destination: true,
        departureTime: true,
        estimatedDuration: true,
        trackingActive: true,
        lastLatitude: true,
        lastLongitude: true,
        lastSpeed: true,
        lastPositionAt: true,
        estimatedArrival: true,
        totalSlots: true,
        availableSlots: true,
        driver: {
          select: { name: true, phone: true },
        },
        conductor: {
          select: { name: true },
        },
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            sideNumber: true,
            make: true,
            model: true,
          },
        },
      },
      orderBy: { departureTime: 'desc' },
    })

    const STALE_THRESHOLD_MS = 120 * 1000

    const fleet = trips.map((trip) => {
      let trackingStatus: 'live' | 'stale' | 'off' = 'off'
      if (trip.trackingActive && trip.lastPositionAt) {
        const age = Date.now() - new Date(trip.lastPositionAt).getTime()
        trackingStatus = age > STALE_THRESHOLD_MS ? 'stale' : 'live'
      }

      return {
        tripId: trip.id,
        origin: trip.origin,
        destination: trip.destination,
        departureTime: trip.departureTime.toISOString(),
        estimatedDuration: trip.estimatedDuration,
        tracking: trackingStatus,
        position: trip.lastLatitude != null
          ? {
              latitude: trip.lastLatitude,
              longitude: trip.lastLongitude,
              speed: trip.lastSpeed,
              updatedAt: trip.lastPositionAt?.toISOString() ?? null,
            }
          : null,
        estimatedArrival: trip.estimatedArrival?.toISOString() ?? null,
        occupancy: {
          total: trip.totalSlots,
          booked: trip.totalSlots - trip.availableSlots,
        },
        driver: trip.driver,
        conductor: trip.conductor,
        vehicle: trip.vehicle,
      }
    })

    return NextResponse.json({
      fleet,
      totalDeparted: trips.length,
      totalTracking: fleet.filter((f) => f.tracking !== 'off').length,
    })
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN')) {
      return handleAuthError(error)
    }
    console.error('[Tracking] Fleet error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

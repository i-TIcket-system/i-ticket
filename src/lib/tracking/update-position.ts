/**
 * Shared GPS Position Processing Logic
 *
 * Used by both the web tracking API (/api/tracking/update)
 * and the OsmAnd background tracking API (/api/tracking/osmand).
 */

import prisma from '@/lib/db'
import { calculateETA, calculateAverageSpeed, getRemainingStops } from '@/lib/tracking/eta'

interface PositionInput {
  tripId: string
  vehicleId: string | null
  latitude: number
  longitude: number
  altitude: number | null
  accuracy: number | null
  heading: number | null
  speed: number | null
  recordedAt: Date
  destination: string
  intermediateStops: string | null
}

/**
 * Process a GPS position update: insert TripPosition, calculate ETA,
 * update Trip and Vehicle with latest position.
 *
 * @returns estimatedArrival if calculated, null otherwise
 */
export async function processPositionUpdate(
  input: PositionInput
): Promise<{ estimatedArrival: Date | null }> {
  const now = new Date()

  // Insert position record
  await prisma.tripPosition.create({
    data: {
      tripId: input.tripId,
      vehicleId: input.vehicleId,
      latitude: input.latitude,
      longitude: input.longitude,
      altitude: input.altitude,
      accuracy: input.accuracy,
      heading: input.heading,
      speed: input.speed,
      recordedAt: input.recordedAt,
    },
  })

  // Calculate ETA using recent positions
  let estimatedArrival: Date | null = null

  try {
    // Get destination city coordinates
    const destCity = await prisma.city.findFirst({
      where: { name: input.destination },
      select: { latitude: true, longitude: true, name: true },
    })

    if (destCity?.latitude && destCity?.longitude) {
      // Get recent positions for average speed
      const recentPositions = await prisma.tripPosition.findMany({
        where: { tripId: input.tripId },
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
      if (input.intermediateStops) {
        try {
          const stops = JSON.parse(input.intermediateStops) as string[]
          const stopCities = await prisma.city.findMany({
            where: { name: { in: stops } },
            select: { name: true, latitude: true, longitude: true },
          })

          const stopsWithCoords = stopCities.filter(
            (c): c is { name: string; latitude: number; longitude: number } =>
              c.latitude != null && c.longitude != null
          )

          if (stopsWithCoords.length > 0) {
            remainingStops = getRemainingStops(
              input.latitude,
              input.longitude,
              { name: destCity.name, latitude: destCity.latitude, longitude: destCity.longitude },
              stopsWithCoords
            )
          }
        } catch {
          // Ignore intermediate stops parse errors
        }
      }

      const eta = calculateETA(
        input.latitude,
        input.longitude,
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
    lastLatitude: input.latitude,
    lastLongitude: input.longitude,
    lastSpeed: input.speed,
    lastPositionAt: now,
  }

  if (estimatedArrival) {
    tripUpdate.estimatedArrival = estimatedArrival
  }

  await prisma.trip.update({
    where: { id: input.tripId },
    data: tripUpdate,
  })

  // Update vehicle position if assigned
  if (input.vehicleId) {
    await prisma.vehicle.update({
      where: { id: input.vehicleId },
      data: {
        lastLatitude: input.latitude,
        lastLongitude: input.longitude,
        lastPositionAt: now,
      },
    })
  }

  return { estimatedArrival }
}

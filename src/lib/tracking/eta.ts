/**
 * ETA Calculation for GPS Bus Tracking
 *
 * Uses Haversine distance with a 1.3 winding factor for Ethiopian roads
 * (roads rarely follow straight lines between cities).
 */

import { calculateDistance } from '@/lib/osmand/gpx-generator'

const WINDING_FACTOR = 1.3 // Ethiopian roads winding multiplier
const MIN_SPEED_KMH = 20 // Minimum reasonable speed to prevent infinite ETAs
const DEFAULT_SPEED_KMH = 60 // Default if no speed data available

interface CityCoords {
  name: string
  latitude: number
  longitude: number
}

interface ETAResult {
  /** Estimated remaining distance in km (straight-line × winding factor) */
  remainingDistanceKm: number
  /** Estimated time remaining in minutes */
  remainingMinutes: number
  /** Estimated arrival time */
  estimatedArrival: Date
  /** Average speed used for calculation (km/h) */
  speedUsed: number
}

/**
 * Calculate ETA from current position to destination
 *
 * @param currentLat - Current bus latitude
 * @param currentLon - Current bus longitude
 * @param destination - Destination city with coordinates
 * @param recentSpeedKmh - Recent average speed in km/h (from GPS or trip history)
 * @param intermediateStops - Remaining intermediate stops (optional, for more accurate distance)
 */
export function calculateETA(
  currentLat: number,
  currentLon: number,
  destination: CityCoords,
  recentSpeedKmh?: number | null,
  intermediateStops?: CityCoords[]
): ETAResult {
  // Calculate remaining distance through intermediate stops if available
  let remainingDistanceKm = 0

  if (intermediateStops && intermediateStops.length > 0) {
    // Route through remaining stops: current → stop1 → stop2 → ... → destination
    let prevLat = currentLat
    let prevLon = currentLon

    for (const stop of intermediateStops) {
      remainingDistanceKm += calculateDistance(prevLat, prevLon, stop.latitude, stop.longitude)
      prevLat = stop.latitude
      prevLon = stop.longitude
    }

    remainingDistanceKm += calculateDistance(prevLat, prevLon, destination.latitude, destination.longitude)
  } else {
    // Direct distance to destination
    remainingDistanceKm = calculateDistance(
      currentLat,
      currentLon,
      destination.latitude,
      destination.longitude
    )
  }

  // Apply winding factor for road distance estimation
  remainingDistanceKm = remainingDistanceKm * WINDING_FACTOR

  // Use recent speed or default
  const speedUsed = Math.max(recentSpeedKmh || DEFAULT_SPEED_KMH, MIN_SPEED_KMH)

  // Calculate remaining time
  const remainingHours = remainingDistanceKm / speedUsed
  const remainingMinutes = Math.round(remainingHours * 60)

  // Calculate estimated arrival
  const estimatedArrival = new Date(Date.now() + remainingMinutes * 60 * 1000)

  return {
    remainingDistanceKm: Math.round(remainingDistanceKm * 10) / 10,
    remainingMinutes,
    estimatedArrival,
    speedUsed,
  }
}

/**
 * Calculate average speed from recent GPS positions
 *
 * @param positions - Recent positions sorted by recordedAt ascending
 * @returns Average speed in km/h, or null if insufficient data
 */
export function calculateAverageSpeed(
  positions: Array<{
    latitude: number
    longitude: number
    recordedAt: Date
    speed?: number | null
  }>
): number | null {
  // If positions have speed data from GPS, use the average
  const speedValues = positions
    .map((p) => p.speed)
    .filter((s): s is number => s != null && s > 0)

  if (speedValues.length >= 3) {
    const avgSpeed = speedValues.reduce((sum, s) => sum + s, 0) / speedValues.length
    return Math.round(avgSpeed * 10) / 10
  }

  // Otherwise, calculate from distance/time between first and last position
  if (positions.length < 2) return null

  const first = positions[0]
  const last = positions[positions.length - 1]

  const distanceKm = calculateDistance(
    first.latitude,
    first.longitude,
    last.latitude,
    last.longitude
  )

  const timeHours =
    (new Date(last.recordedAt).getTime() - new Date(first.recordedAt).getTime()) /
    (1000 * 60 * 60)

  if (timeHours < 0.001) return null // Less than ~4 seconds

  const speed = distanceKm / timeHours
  return speed > 0 && speed < 200 ? Math.round(speed * 10) / 10 : null
}

/**
 * Determine which intermediate stops are still ahead based on current position
 *
 * @param currentLat - Current bus latitude
 * @param currentLon - Current bus longitude
 * @param origin - Origin city coordinates
 * @param stops - All intermediate stops with coordinates
 * @returns Stops that haven't been passed yet
 */
export function getRemainingStops(
  currentLat: number,
  currentLon: number,
  origin: CityCoords,
  stops: CityCoords[]
): CityCoords[] {
  if (stops.length === 0) return []

  const distFromOrigin = calculateDistance(
    origin.latitude,
    origin.longitude,
    currentLat,
    currentLon
  )

  // Filter stops that are further from origin than current position
  return stops.filter((stop) => {
    const stopDistFromOrigin = calculateDistance(
      origin.latitude,
      origin.longitude,
      stop.latitude,
      stop.longitude
    )
    return stopDistFromOrigin > distFromOrigin * 0.9 // 10% tolerance
  })
}

/**
 * Format ETA for display
 */
export function formatETA(minutes: number): string {
  if (minutes < 1) return 'Arriving'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

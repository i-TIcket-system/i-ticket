/**
 * GPX Generator for OsmAnd Integration (Phase 1)
 *
 * Generates GPX (GPS Exchange Format) files for trip routes and terminal locations.
 * Compatible with OsmAnd, Google Maps, and all GPS apps.
 *
 * GPX Format: https://www.topografix.com/GPX/1/1/
 */

import { XMLBuilder } from 'fast-xml-parser'

// ==================== TYPES ====================

export interface GPXWaypoint {
  lat: number
  lon: number
  name: string
  desc?: string
  type?: string
  time?: Date
}

export interface GPXRoute {
  name: string
  desc?: string
  waypoints: GPXWaypoint[]
}

export interface GPXMetadata {
  name: string
  desc?: string
  author?: string
  time?: Date
}

// ==================== GPX GENERATION ====================

/**
 * Generate GPX XML string from route data
 *
 * @param route - Route with waypoints
 * @param metadata - Optional metadata
 * @returns GPX XML string
 *
 * @example
 * const gpx = generateGPX({
 *   name: "Addis Ababa to Dire Dawa",
 *   waypoints: [
 *     { lat: 9.0220, lon: 38.7468, name: "Addis Ababa Terminal" },
 *     { lat: 9.6010, lon: 41.8661, name: "Dire Dawa Station" }
 *   ]
 * })
 */
export function generateGPX(route: GPXRoute, metadata?: GPXMetadata): string {
  const gpxData = {
    gpx: {
      '@version': '1.1',
      '@creator': 'i-Ticket Platform - Ethiopian Bus Ticketing',
      '@xmlns': 'http://www.topografix.com/GPX/1/1',
      '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      '@xsi:schemaLocation':
        'http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd',

      metadata: {
        name: metadata?.name || route.name,
        desc: metadata?.desc || route.desc || `i-Ticket route: ${route.name}`,
        author: {
          name: metadata?.author || 'i-Ticket Platform',
        },
        time: (metadata?.time || new Date()).toISOString(),
      },

      rte: {
        name: route.name,
        desc: route.desc,
        rtept: route.waypoints.map((wp) => ({
          '@lat': wp.lat.toString(),
          '@lon': wp.lon.toString(),
          name: wp.name,
          desc: wp.desc,
          type: wp.type || 'Bus Stop',
          time: wp.time?.toISOString(),
        })),
      },
    },
  }

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    indentBy: '  ',
    suppressEmptyNode: true,
  })

  const xml = builder.build(gpxData)
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`
}

/**
 * Generate GPX for a trip route
 *
 * @param trip - Trip data with origin, destination, and intermediate stops
 * @returns GPX XML string
 */
export function generateTripGPX(trip: {
  id: string
  origin: string
  destination: string
  departureTime: Date
  originCoords?: { lat: number; lon: number }
  destinationCoords?: { lat: number; lon: number }
  intermediateStops?: Array<{
    name: string
    coords?: { lat: number; lon: number }
  }>
  company?: { name: string }
  distance?: number
  estimatedDuration?: number
}): string {
  const waypoints: GPXWaypoint[] = []

  // Origin waypoint
  if (trip.originCoords) {
    waypoints.push({
      lat: trip.originCoords.lat,
      lon: trip.originCoords.lon,
      name: trip.origin,
      desc: `Departure: ${trip.departureTime.toLocaleString('en-ET', { timeZone: 'Africa/Addis_Ababa' })}`,
      type: 'Bus Terminal (Departure)',
      time: trip.departureTime,
    })
  }

  // Intermediate stops
  if (trip.intermediateStops && trip.intermediateStops.length > 0) {
    trip.intermediateStops.forEach((stop, index) => {
      if (stop.coords) {
        waypoints.push({
          lat: stop.coords.lat,
          lon: stop.coords.lon,
          name: stop.name,
          desc: `Stop ${index + 1} of ${trip.intermediateStops!.length}`,
          type: 'Bus Stop (Intermediate)',
        })
      }
    })
  }

  // Destination waypoint
  if (trip.destinationCoords) {
    waypoints.push({
      lat: trip.destinationCoords.lat,
      lon: trip.destinationCoords.lon,
      name: trip.destination,
      desc: 'Final destination',
      type: 'Bus Terminal (Arrival)',
    })
  }

  // If no coordinates available, return error message
  if (waypoints.length === 0) {
    throw new Error(
      'Cannot generate GPX: No GPS coordinates available for this route. Please contact support to add coordinates.'
    )
  }

  const routeName = `${trip.origin} → ${trip.destination}`
  const routeDesc = [
    trip.company ? `Company: ${trip.company.name}` : null,
    trip.distance ? `Distance: ${trip.distance} km` : null,
    trip.estimatedDuration ? `Duration: ${trip.estimatedDuration} hours` : null,
  ]
    .filter(Boolean)
    .join(' | ')

  return generateGPX(
    {
      name: routeName,
      desc: routeDesc || undefined,
      waypoints,
    },
    {
      name: `i-Ticket Trip ${trip.id}`,
      desc: `Route from ${trip.origin} to ${trip.destination}`,
    }
  )
}

/**
 * Generate GPX for company terminal locations (favorites)
 *
 * @param terminals - Array of terminal/city locations
 * @param companyName - Company name
 * @returns GPX XML string
 */
export function generateTerminalsGPX(
  terminals: Array<{
    name: string
    lat: number
    lon: number
    region?: string
  }>,
  companyName: string
): string {
  // Generate waypoints instead of routes for terminal favorites
  const gpxData = {
    gpx: {
      '@version': '1.1',
      '@creator': 'i-Ticket Platform - Ethiopian Bus Ticketing',
      '@xmlns': 'http://www.topografix.com/GPX/1/1',
      '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      '@xsi:schemaLocation':
        'http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd',

      metadata: {
        name: `${companyName} - Bus Terminals`,
        desc: `All bus terminal locations for ${companyName}`,
        author: {
          name: 'i-Ticket Platform',
        },
        time: new Date().toISOString(),
      },

      wpt: terminals.map((terminal) => ({
        '@lat': terminal.lat.toString(),
        '@lon': terminal.lon.toString(),
        name: terminal.name,
        desc: `${companyName} bus terminal${terminal.region ? ` - ${terminal.region} region` : ''}`,
        type: 'Bus Terminal',
        sym: 'Flag, Blue', // OsmAnd favorite icon
      })),
    },
  }

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    indentBy: '  ',
    suppressEmptyNode: true,
  })

  const xml = builder.build(gpxData)
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`
}

// ==================== OSMAND DEEP LINKS ====================

/**
 * Generate OsmAnd deep link URL for location
 *
 * @param lat - Latitude
 * @param lon - Longitude
 * @param name - Location name
 * @returns OsmAnd deep link URL
 *
 * @example
 * const url = generateOsmAndLink(9.0220, 38.7468, "Addis Ababa Terminal")
 * // Returns: "osmandmaps://show?lat=9.0220&lon=38.7468&name=Addis%20Ababa%20Terminal"
 */
export function generateOsmAndLink(
  lat: number,
  lon: number,
  name: string
): string {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    name: name,
  })
  return `osmandmaps://show?${params.toString()}`
}

/**
 * Generate web fallback URL for OsmAnd (opens in browser if app not installed)
 *
 * @param lat - Latitude
 * @param lon - Longitude
 * @param zoom - Map zoom level (default: 17)
 * @returns OsmAnd web fallback URL
 */
export function generateOsmAndWebLink(
  lat: number,
  lon: number,
  zoom: number = 17
): string {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    z: zoom.toString(),
  })
  return `https://osmand.net/go.html?${params.toString()}`
}

/**
 * Generate Google Maps fallback URL
 *
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Google Maps URL
 */
export function generateGoogleMapsLink(lat: number, lon: number): string {
  return `https://www.google.com/maps?q=${lat},${lon}`
}

/**
 * Generate all navigation links (OsmAnd + fallbacks)
 *
 * @param lat - Latitude
 * @param lon - Longitude
 * @param name - Location name
 * @returns Object with all navigation URLs
 */
export function generateNavigationLinks(lat: number, lon: number, name: string) {
  return {
    osmandApp: generateOsmAndLink(lat, lon, name),
    osmandWeb: generateOsmAndWebLink(lat, lon),
    googleMaps: generateGoogleMapsLink(lat, lon),
  }
}

// ==================== UTILITIES ====================

/**
 * Validate GPS coordinates
 *
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns true if valid
 * @throws Error if invalid
 */
export function validateCoordinates(lat: number, lon: number): boolean {
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    throw new Error('Coordinates must be numbers')
  }

  if (lat < -90 || lat > 90) {
    throw new Error(`Invalid latitude: ${lat}. Must be between -90 and 90`)
  }

  if (lon < -180 || lon > 180) {
    throw new Error(`Invalid longitude: ${lon}. Must be between -180 and 180`)
  }

  return true
}

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 *
 * @param lat1 - Latitude of point 1
 * @param lon1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lon2 - Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance * 10) / 10 // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Format coordinates for display
 *
 * @param lat - Latitude
 * @param lon - Longitude
 * @param precision - Decimal places (default: 4)
 * @returns Formatted string (e.g., "9.0220°N, 38.7468°E")
 */
export function formatCoordinates(
  lat: number,
  lon: number,
  precision: number = 4
): string {
  const latDir = lat >= 0 ? 'N' : 'S'
  const lonDir = lon >= 0 ? 'E' : 'W'

  return `${Math.abs(lat).toFixed(precision)}°${latDir}, ${Math.abs(lon).toFixed(precision)}°${lonDir}`
}

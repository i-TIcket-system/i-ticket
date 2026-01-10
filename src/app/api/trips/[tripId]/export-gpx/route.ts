/**
 * API Route: Export Trip as GPX File
 *
 * GET /api/trips/[tripId]/export-gpx
 *
 * Downloads trip route as GPX file for OsmAnd/Google Maps navigation.
 * Public endpoint (no auth required) - anyone with trip ID can download route.
 *
 * Phase 1: GPS Telematics
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { generateTripGPX } from '@/lib/osmand/gpx-generator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params

    // Validate trip ID
    if (!tripId || typeof tripId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid trip ID' },
        { status: 400 }
      )
    }

    // Fetch trip with city coordinates
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        origin: true,
        destination: true,
        departureTime: true,
        distance: true,
        estimatedDuration: true,
        intermediateStops: true,
        company: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Fetch origin city coordinates
    const originCity = await prisma.city.findFirst({
      where: { name: trip.origin },
      select: { latitude: true, longitude: true },
    })

    // Fetch destination city coordinates
    const destinationCity = await prisma.city.findFirst({
      where: { name: trip.destination },
      select: { latitude: true, longitude: true },
    })

    // Parse intermediate stops (stored as JSON string or comma-separated)
    let intermediateStops: Array<{ name: string; coords?: { lat: number; lon: number } }> = []

    if (trip.intermediateStops) {
      try {
        // Try parsing as JSON first
        const parsed = JSON.parse(trip.intermediateStops)
        if (Array.isArray(parsed)) {
          intermediateStops = parsed.map((stop: any) => ({ name: stop.name || stop }))
        }
      } catch {
        // Fallback: treat as comma-separated string
        const stopNames = trip.intermediateStops.split(',').map(s => s.trim()).filter(Boolean)
        intermediateStops = stopNames.map(name => ({ name }))
      }
    }

    // Fetch coordinates for intermediate stops
    if (intermediateStops.length > 0) {
      const stopCities = await prisma.city.findMany({
        where: {
          name: {
            in: intermediateStops.map(s => s.name),
          },
        },
        select: {
          name: true,
          latitude: true,
          longitude: true,
        },
      })

      // Map coordinates to stops
      intermediateStops = intermediateStops.map(stop => {
        const city = stopCities.find(c => c.name === stop.name)
        if (city && city.latitude && city.longitude) {
          return {
            ...stop,
            coords: { lat: city.latitude, lon: city.longitude },
          }
        }
        return stop
      })
    }

    // Prepare trip data for GPX generation
    const tripData = {
      id: trip.id,
      origin: trip.origin,
      destination: trip.destination,
      departureTime: trip.departureTime,
      distance: trip.distance || undefined,
      estimatedDuration: trip.estimatedDuration,
      originCoords:
        originCity?.latitude && originCity?.longitude
          ? { lat: originCity.latitude, lon: originCity.longitude }
          : undefined,
      destinationCoords:
        destinationCity?.latitude && destinationCity?.longitude
          ? { lat: destinationCity.latitude, lon: destinationCity.longitude }
          : undefined,
      intermediateStops,
      company: trip.company,
    }

    // Generate GPX
    let gpxContent: string
    try {
      gpxContent = generateTripGPX(tripData)
    } catch (error: any) {
      return NextResponse.json(
        {
          error: 'Cannot generate route',
          message: error.message || 'No GPS coordinates available for this route',
          hint: 'Contact support to add GPS coordinates for cities on this route',
        },
        { status: 422 }
      )
    }

    // Generate filename (safe for download)
    const filename = `${trip.origin}-to-${trip.destination}`
      .replace(/[^a-zA-Z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase()

    // Return GPX file as downloadable attachment
    return new NextResponse(gpxContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/gpx+xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="iticket-${filename}.gpx"`,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('GPX export error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate GPX file',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

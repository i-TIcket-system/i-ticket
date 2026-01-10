'use client'

/**
 * Route Preview Card Component
 *
 * Displays trip route information with GPS coordinates and navigation buttons.
 * Phase 1: GPS Telematics
 */

import { MapPin, Navigation, Clock, Route } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OsmAndButton } from './OsmAndButton'
import { GPXDownloadButton } from './GPXDownloadButton'
import { Badge } from '@/components/ui/badge'

interface RoutePreviewCardProps {
  trip: {
    id: string
    origin: string
    destination: string
    distance?: number
    estimatedDuration: number
    originCoords?: { lat: number; lon: number }
    destinationCoords?: { lat: number; lon: number }
    intermediateStops?: Array<{
      name: string
      coords?: { lat: number; lon: number }
    }>
  }
}

export function RoutePreviewCard({ trip }: RoutePreviewCardProps) {
  const hasCoordinates = trip.originCoords || trip.destinationCoords
  const tripName = `${trip.origin} to ${trip.destination}`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5 text-teal-600" />
          Route Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Origin → Destination */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-teal-600" />
            <span className="font-medium">{trip.origin}</span>
            {!trip.originCoords && (
              <Badge variant="outline" className="text-xs">
                No GPS
              </Badge>
            )}
          </div>
          <Navigation className="h-4 w-4 text-gray-400" />
          <div className="flex items-center space-x-2">
            <span className="font-medium">{trip.destination}</span>
            <MapPin className="h-4 w-4 text-teal-600" />
            {!trip.destinationCoords && (
              <Badge variant="outline" className="text-xs">
                No GPS
              </Badge>
            )}
          </div>
        </div>

        {/* Distance & Duration */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          {trip.distance && (
            <div className="flex items-center space-x-1">
              <Navigation className="h-4 w-4" />
              <span>{trip.distance} km</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{trip.estimatedDuration} hours</span>
          </div>
        </div>

        {/* Intermediate Stops */}
        {trip.intermediateStops && trip.intermediateStops.length > 0 && (
          <div className="text-sm">
            <p className="font-medium mb-2">Intermediate Stops:</p>
            <ul className="space-y-1">
              {trip.intermediateStops.map((stop, idx) => (
                <li key={idx} className="flex items-center gap-2 text-gray-600">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-xs">
                    {idx + 1}
                  </span>
                  <span>{stop.name}</span>
                  {!stop.coords && (
                    <Badge variant="outline" className="text-xs">
                      No GPS
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigation Buttons */}
        {hasCoordinates ? (
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <GPXDownloadButton
              tripId={trip.id}
              tripName={tripName}
              variant="default"
              className="flex-1"
            />
            {trip.originCoords && (
              <OsmAndButton
                latitude={trip.originCoords.lat}
                longitude={trip.originCoords.lon}
                name={`${trip.origin} (Departure)`}
                variant="outline"
                className="flex-1"
              />
            )}
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
            <p className="text-sm text-orange-800">
              <strong>GPS coordinates not available</strong> for this route. Contact
              support to add navigation features.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

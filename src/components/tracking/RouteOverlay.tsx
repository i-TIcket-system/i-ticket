"use client"

import { Polyline, CircleMarker, Tooltip } from "react-leaflet"

interface RoutePoint {
  name: string
  latitude: number | null
  longitude: number | null
}

interface RouteOverlayProps {
  origin: RoutePoint
  destination: RoutePoint
  stops?: RoutePoint[]
  /** GPS trail from tracking history */
  trail?: Array<{ latitude: number; longitude: number }>
}

/**
 * Route visualization: dashed line origin→stops→destination + GPS trail.
 */
export default function RouteOverlay({
  origin,
  destination,
  stops = [],
  trail,
}: RouteOverlayProps) {
  // Build route points for the dashed line
  const routePoints: Array<[number, number]> = []

  if (origin.latitude != null && origin.longitude != null) {
    routePoints.push([origin.latitude, origin.longitude])
  }

  for (const stop of stops) {
    if (stop.latitude != null && stop.longitude != null) {
      routePoints.push([stop.latitude, stop.longitude])
    }
  }

  if (destination.latitude != null && destination.longitude != null) {
    routePoints.push([destination.latitude, destination.longitude])
  }

  // GPS trail polyline
  const trailPoints: Array<[number, number]> = (trail || []).map((p) => [
    p.latitude,
    p.longitude,
  ])

  return (
    <>
      {/* Planned route (dashed) */}
      {routePoints.length >= 2 && (
        <Polyline
          positions={routePoints}
          pathOptions={{
            color: "#94a3b8",
            weight: 3,
            dashArray: "8 8",
            opacity: 0.7,
          }}
        />
      )}

      {/* GPS trail (solid) */}
      {trailPoints.length >= 2 && (
        <Polyline
          positions={trailPoints}
          pathOptions={{
            color: "#0e9494",
            weight: 4,
            opacity: 0.8,
          }}
        />
      )}

      {/* Origin marker */}
      {origin.latitude != null && origin.longitude != null && (
        <CircleMarker
          center={[origin.latitude, origin.longitude]}
          radius={8}
          pathOptions={{
            fillColor: "#22c55e",
            color: "white",
            weight: 2,
            fillOpacity: 1,
          }}
        >
          <Tooltip permanent direction="top" offset={[0, -10]}>
            {origin.name}
          </Tooltip>
        </CircleMarker>
      )}

      {/* Intermediate stops */}
      {stops.map(
        (stop, i) =>
          stop.latitude != null &&
          stop.longitude != null && (
            <CircleMarker
              key={`stop-${i}`}
              center={[stop.latitude, stop.longitude]}
              radius={6}
              pathOptions={{
                fillColor: "#f59e0b",
                color: "white",
                weight: 2,
                fillOpacity: 1,
              }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                {stop.name}
              </Tooltip>
            </CircleMarker>
          )
      )}

      {/* Destination marker */}
      {destination.latitude != null && destination.longitude != null && (
        <CircleMarker
          center={[destination.latitude, destination.longitude]}
          radius={8}
          pathOptions={{
            fillColor: "#ef4444",
            color: "white",
            weight: 2,
            fillOpacity: 1,
          }}
        >
          <Tooltip permanent direction="top" offset={[0, -10]}>
            {destination.name}
          </Tooltip>
        </CircleMarker>
      )}
    </>
  )
}

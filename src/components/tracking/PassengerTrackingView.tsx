"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import { Bus, Loader2, Crosshair } from "lucide-react"
import type L from "leaflet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ETABadge from "./ETABadge"
import TrackingStatus from "./TrackingStatus"
import { calculateDistance } from "@/lib/osmand/gpx-generator"

// Dynamic imports (no SSR)
const TrackingMap = dynamic(() => import("./TrackingMap"), { ssr: false })
const BusMarker = dynamic(() => import("./BusMarker"), { ssr: false })
const RouteOverlay = dynamic(() => import("./RouteOverlay"), { ssr: false })

interface PassengerTrackingViewProps {
  tripId: string
}

interface TrackingData {
  tripId: string
  status: string
  company: string
  vehicle: { plateNumber: string; sideNumber: string | null } | null
  tracking: "live" | "stale" | "off"
  currentPosition: {
    latitude: number
    longitude: number
    speed: number | null
    updatedAt: string | null
  } | null
  estimatedArrival: string | null
  route: {
    origin: { name: string; latitude: number | null; longitude: number | null }
    destination: { name: string; latitude: number | null; longitude: number | null }
    stops: Array<{ name: string; latitude: number | null; longitude: number | null }>
  }
  history: Array<{ latitude: number; longitude: number }>
}

const POLL_INTERVAL = 12000 // 12 seconds

export default function PassengerTrackingView({ tripId }: PassengerTrackingViewProps) {
  const [data, setData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map
    setTimeout(() => map.invalidateSize(), 200)
  }, [])

  const fetchTracking = async () => {
    try {
      const res = await fetch(`/api/tracking/${tripId}?history=true&limit=100`)
      if (res.ok) {
        const result = await res.json()
        setData(result)
        setError(false)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTracking()

    // Poll for updates
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchTracking()
      }
    }, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [tripId])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-teal-600 mb-2" />
          <p className="text-sm text-gray-500">Loading live tracking...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return null // Silently hide if tracking unavailable
  }

  if (data.tracking === "off" && !data.currentPosition) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bus className="h-5 w-5 text-teal-600" />
            Live Bus Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <TrackingStatus status="off" />
            <p className="text-sm text-gray-500 mt-2">
              GPS tracking is not yet active for this trip. The driver will enable it during the journey.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const pos = data.currentPosition
  const mapCenter: [number, number] = pos
    ? [pos.latitude, pos.longitude]
    : data.route.origin.latitude != null && data.route.origin.longitude != null
      ? [data.route.origin.latitude, data.route.origin.longitude]
      : [9.02, 38.75]

  // Calculate remaining distance for ETA badge
  let remainingKm: number | null = null
  let remainingMinutes: number | null = null

  if (pos && data.route.destination.latitude != null && data.route.destination.longitude != null) {
    remainingKm = Math.round(
      calculateDistance(
        pos.latitude,
        pos.longitude,
        data.route.destination.latitude,
        data.route.destination.longitude
      ) * 1.3 * 10 // winding factor
    ) / 10

    if (data.estimatedArrival) {
      remainingMinutes = Math.round(
        (new Date(data.estimatedArrival).getTime() - Date.now()) / 60000
      )
      if (remainingMinutes < 0) remainingMinutes = null
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bus className="h-5 w-5 text-teal-600" />
            Live Bus Tracking
          </CardTitle>
          <TrackingStatus
            status={data.tracking}
            lastUpdated={pos?.updatedAt}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* ETA info */}
        <ETABadge
          remainingMinutes={remainingMinutes}
          remainingDistanceKm={remainingKm}
          speedKmh={pos?.speed}
          estimatedArrival={data.estimatedArrival}
        />

        {/* Map */}
        <div className="relative h-[300px] sm:h-[400px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <TrackingMap center={mapCenter} zoom={pos ? 11 : 7} onMapReady={handleMapReady}>
            <RouteOverlay
              origin={data.route.origin as { name: string; latitude: number; longitude: number }}
              destination={data.route.destination as { name: string; latitude: number; longitude: number }}
              stops={data.route.stops as Array<{ name: string; latitude: number; longitude: number }>}
              trail={data.history}
            />
            {pos && (
              <BusMarker
                position={[pos.latitude, pos.longitude]}
                speed={pos.speed}
                isStale={data.tracking === "stale"}
                label={data.company}
                popupContent={
                  <div className="text-sm">
                    <p className="font-semibold">{data.company}</p>
                    {data.vehicle && (
                      <p className="text-gray-500">
                        {data.vehicle.plateNumber}
                        {data.vehicle.sideNumber ? ` (${data.vehicle.sideNumber})` : ""}
                      </p>
                    )}
                    {pos.speed != null && (
                      <p className="text-gray-500">{Math.round(pos.speed)} km/h</p>
                    )}
                  </div>
                }
              />
            )}
          </TrackingMap>

          {/* Recenter button */}
          {pos && (
            <button
              onClick={() => {
                const currentZoom = mapRef.current?.getZoom() ?? 13
                const zoom = Math.max(currentZoom, 13) // Don't zoom out, only in
                mapRef.current?.flyTo([pos.latitude, pos.longitude], zoom, { duration: 0.8 })
              }}
              className="absolute bottom-3 right-3 z-[1000] bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Recenter on bus"
            >
              <Crosshair className="h-4 w-4 text-teal-600" />
            </button>
          )}

          {/* CSS for bus marker animation */}
          <style jsx global>{`
            @keyframes busping {
              0% { transform: scale(1); opacity: 0.8; }
              100% { transform: scale(2); opacity: 0; }
            }
          `}</style>
        </div>

        <p className="text-xs text-gray-400 text-center">
          Map updates every {POLL_INTERVAL / 1000}s. Data from driver&apos;s GPS.
        </p>
      </CardContent>
    </Card>
  )
}

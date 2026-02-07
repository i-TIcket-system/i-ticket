"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import { MapPin, Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

const TrackingMap = dynamic(
  () => import("@/components/tracking/TrackingMap"),
  { ssr: false }
)
const RouteOverlay = dynamic(
  () => import("@/components/tracking/RouteOverlay"),
  { ssr: false }
)
const DynamicMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
)
const DynamicPopup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
)

/**
 * Click listener component — must be rendered inside MapContainer (as child of TrackingMap).
 * Uses useMapEvents from react-leaflet to capture click events.
 */
const MapClickListener = dynamic(
  () =>
    Promise.resolve(
      function MapClickListenerInner({
        onClick,
      }: {
        onClick: (e: { latlng: { lat: number; lng: number } }) => void
      }) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { useMapEvents } = require("react-leaflet")
        useMapEvents({ click: onClick })
        return null
      }
    ),
  { ssr: false }
)

interface CityCoord {
  name: string
  latitude: number | null
  longitude: number | null
}

interface PickupMapModalProps {
  open: boolean
  onClose: () => void
  routeStops: string[]
  title: string
  onSelect: (locationName: string) => void
}

/** Haversine distance in km */
function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Project a point onto a line segment (A→B), return nearest point on segment. */
function projectOntoSegment(
  p: [number, number],
  a: [number, number],
  b: [number, number]
): [number, number] {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  if (dx === 0 && dy === 0) return a
  const t = Math.max(
    0,
    Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy))
  )
  return [a[0] + t * dx, a[1] + t * dy]
}

function nearestPointOnPolyline(
  click: [number, number],
  polyline: Array<[number, number]>
): { point: [number, number]; distance: number; segmentIndex: number } {
  let bestDist = Infinity
  let bestPoint: [number, number] = click
  let bestIdx = 0

  for (let i = 0; i < polyline.length - 1; i++) {
    const proj = projectOntoSegment(click, polyline[i], polyline[i + 1])
    const dist = haversineKm(click[0], click[1], proj[0], proj[1])
    if (dist < bestDist) {
      bestDist = dist
      bestPoint = proj
      bestIdx = i
    }
  }

  return { point: bestPoint, distance: bestDist, segmentIndex: bestIdx }
}

export function PickupMapModal({
  open,
  onClose,
  routeStops,
  title,
  onSelect,
}: PickupMapModalProps) {
  const [cities, setCities] = useState<CityCoord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPoint, setSelectedPoint] = useState<{
    latlng: [number, number]
    name: string
    loading: boolean
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  // Fetch city coordinates when modal opens
  useEffect(() => {
    if (!open || routeStops.length === 0) return
    setLoading(true)
    setSelectedPoint(null)
    setError(null)

    fetch(
      `/api/cities/coordinates?names=${routeStops.map(encodeURIComponent).join(",")}`
    )
      .then((r) => r.json())
      .then((data) => {
        setCities(data.cities || [])
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [open, routeStops])

  // Build polyline from city coords (ordered by routeStops)
  const polyline: Array<[number, number]> = routeStops
    .map((name) => cities.find((c) => c.name === name))
    .filter((c): c is CityCoord => c != null && c.latitude != null && c.longitude != null)
    .map((c) => [c.latitude!, c.longitude!])

  // Find nearest stop name for fallback
  const findNearestStop = useCallback(
    (lat: number, lng: number): string => {
      let nearest = routeStops[0] || "Unknown location"
      let bestDist = Infinity
      for (const city of cities) {
        if (city.latitude == null || city.longitude == null) continue
        const d = haversineKm(lat, lng, city.latitude, city.longitude)
        if (d < bestDist) {
          bestDist = d
          nearest = city.name
        }
      }
      return nearest
    },
    [cities, routeStops]
  )

  const handleMapClick = useCallback(
    async (e: { latlng: { lat: number; lng: number } }) => {
      const clickPos: [number, number] = [e.latlng.lat, e.latlng.lng]

      // Check if user clicked near a stop marker (within ~5km)
      for (const city of cities) {
        if (city.latitude == null || city.longitude == null) continue
        const d = haversineKm(clickPos[0], clickPos[1], city.latitude, city.longitude)
        if (d < 5) {
          // Direct stop selection
          setError(null)
          setSelectedPoint({
            latlng: [city.latitude, city.longitude],
            name: city.name,
            loading: false,
          })
          return
        }
      }

      if (polyline.length < 2) return

      const { point, distance } = nearestPointOnPolyline(clickPos, polyline)

      if (distance > 25) {
        setError("Please select a location closer to the route (within 25 km)")
        setSelectedPoint(null)
        return
      }

      setError(null)
      setSelectedPoint({
        latlng: point,
        name: "Loading...",
        loading: true,
      })

      // Reverse geocode via Nominatim
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${point[0]}&lon=${point[1]}&format=json&zoom=16&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        )
        if (!res.ok) throw new Error("Geocode failed")

        const data = await res.json()
        const name =
          data.address?.suburb ||
          data.address?.town ||
          data.address?.village ||
          data.address?.city ||
          data.display_name?.split(",")[0] ||
          `Near ${findNearestStop(point[0], point[1])}`

        setSelectedPoint({
          latlng: point,
          name,
          loading: false,
        })
      } catch {
        setSelectedPoint({
          latlng: point,
          name: `Near ${findNearestStop(point[0], point[1])}`,
          loading: false,
        })
      }
    },
    [polyline, cities, findNearestStop]
  )

  const handleConfirm = () => {
    if (selectedPoint && !selectedPoint.loading) {
      onSelect(selectedPoint.name)
    }
  }

  // Route overlay data
  const originCity = cities.find((c) => c.name === routeStops[0])
  const destCity = cities.find(
    (c) => c.name === routeStops[routeStops.length - 1]
  )
  const stopCities = routeStops
    .slice(1, -1)
    .map((name) => cities.find((c) => c.name === name))
    .filter((c): c is CityCoord => c != null)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl w-[95vw] h-[85vh] sm:h-[75vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Click a stop marker or anywhere along the route to select a location
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mx-4 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex-1 relative min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <TrackingMap
              center={polyline.length > 0 ? polyline[0] : [9.02, 38.75]}
              zoom={7}
              className="h-full w-full"
              onMapReady={(map: L.Map) => {
                mapRef.current = map
                setTimeout(() => {
                  if (polyline.length >= 2) {
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const L = require("leaflet")
                    const bounds = L.latLngBounds(
                      polyline.map(([lat, lng]: [number, number]) =>
                        L.latLng(lat, lng)
                      )
                    )
                    map.fitBounds(bounds, { padding: [40, 40] })
                  }
                }, 200)
              }}
            >
              {/* Click listener — inside MapContainer via TrackingMap children */}
              <MapClickListener onClick={handleMapClick} />

              {originCity && destCity && (
                <RouteOverlay
                  origin={{
                    name: originCity.name,
                    latitude: originCity.latitude,
                    longitude: originCity.longitude,
                  }}
                  destination={{
                    name: destCity.name,
                    latitude: destCity.latitude,
                    longitude: destCity.longitude,
                  }}
                  stops={stopCities.map((c) => ({
                    name: c.name,
                    latitude: c.latitude,
                    longitude: c.longitude,
                  }))}
                />
              )}

              {selectedPoint && (
                <DynamicMarker position={selectedPoint.latlng}>
                  <DynamicPopup>
                    <div className="text-center min-w-[120px]">
                      {selectedPoint.loading ? (
                        <span className="text-sm text-muted-foreground">
                          Looking up location...
                        </span>
                      ) : (
                        <span className="text-sm font-medium">
                          {selectedPoint.name}
                        </span>
                      )}
                    </div>
                  </DynamicPopup>
                </DynamicMarker>
              )}
            </TrackingMap>
          )}
        </div>

        <div className="px-4 py-3 border-t flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            {selectedPoint && !selectedPoint.loading && (
              <p className="text-sm truncate">
                <span className="text-muted-foreground">Selected:</span>{" "}
                <span className="font-medium">{selectedPoint.name}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={!selectedPoint || selectedPoint.loading}
            >
              <Check className="h-4 w-4 mr-1" />
              Confirm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

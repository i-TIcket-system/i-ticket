"use client"

import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, useMap } from "react-leaflet"

// Fix Leaflet default icon paths (broken by bundlers)
import L from "leaflet"
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

interface TrackingMapProps {
  center?: [number, number]
  zoom?: number
  className?: string
  children?: React.ReactNode
  /** If true, map re-centers whenever center/zoom props change. Default false. */
  autoRecenter?: boolean
  /** One-shot fly-to target. Set to [lat, lng, zoom] to animate once, then clear it. */
  flyTo?: { position: [number, number]; zoom: number } | null
  /** Called once with the Leaflet map instance after mount. */
  onMapReady?: (map: L.Map) => void
}

/** Handles initial view + optional auto-recenter + one-shot flyTo */
function MapController({
  center,
  zoom,
  autoRecenter,
  flyTo,
  onMapReady,
}: {
  center?: [number, number]
  zoom?: number
  autoRecenter: boolean
  flyTo?: { position: [number, number]; zoom: number } | null
  onMapReady?: (map: L.Map) => void
}) {
  const map = useMap()
  const initializedRef = useRef(false)
  const lastFlyToRef = useRef<string | null>(null)

  // Expose map instance on mount
  useEffect(() => {
    if (onMapReady) {
      onMapReady(map)
    }
  }, [map, onMapReady])

  // Set initial view once
  useEffect(() => {
    if (!initializedRef.current && center) {
      map.setView(center, zoom ?? map.getZoom(), { animate: false })
      initializedRef.current = true
    }
  }, [center, zoom, map])

  // Auto-recenter on prop changes (only if enabled)
  useEffect(() => {
    if (autoRecenter && initializedRef.current && center) {
      map.setView(center, zoom ?? map.getZoom(), { animate: true })
    }
  }, [center, zoom, map, autoRecenter])

  // One-shot flyTo
  useEffect(() => {
    if (flyTo) {
      const key = `${flyTo.position[0]},${flyTo.position[1]},${flyTo.zoom}`
      if (key !== lastFlyToRef.current) {
        lastFlyToRef.current = key
        map.flyTo(flyTo.position, flyTo.zoom, { duration: 1 })
      }
    }
  }, [flyTo, map])

  return null
}

/**
 * Base Leaflet map wrapper with OpenStreetMap tiles.
 * Must be dynamically imported with { ssr: false }.
 */
export default function TrackingMap({
  center = [9.02, 38.75], // Default: Addis Ababa
  zoom = 7,
  className = "h-full w-full",
  children,
  autoRecenter = false,
  flyTo,
  onMapReady,
}: TrackingMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={className}
      style={{ height: "100%", width: "100%" }}
      zoomControl={true}
      attributionControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController
        center={center}
        zoom={zoom}
        autoRecenter={autoRecenter}
        flyTo={flyTo}
        onMapReady={onMapReady}
      />
      {children}
    </MapContainer>
  )
}

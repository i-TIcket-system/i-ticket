"use client"

import { useEffect } from "react"
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
}

/** Auto-recenter map when center changes */
function MapUpdater({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap()

  useEffect(() => {
    if (center) {
      map.setView(center, zoom ?? map.getZoom(), { animate: true })
    }
  }, [center, zoom, map])

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
      <MapUpdater center={center} zoom={zoom} />
      {children}
    </MapContainer>
  )
}

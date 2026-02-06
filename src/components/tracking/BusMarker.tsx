"use client"

import { useMemo } from "react"
import { Marker, Popup } from "react-leaflet"
import L from "leaflet"

interface BusMarkerProps {
  position: [number, number]
  heading?: number | null
  speed?: number | null
  isStale?: boolean
  label?: string
  popupContent?: React.ReactNode
}

/**
 * Bus icon marker with heading rotation and stale indicator.
 */
export default function BusMarker({
  position,
  heading,
  speed,
  isStale = false,
  label,
  popupContent,
}: BusMarkerProps) {
  const icon = useMemo(() => {
    const rotation = heading ?? 0
    const color = isStale ? "#f59e0b" : "#0e9494"
    const pulse = isStale ? "" : `<div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid ${color};animation:busping 2s ease-out infinite;"></div>`

    return L.divIcon({
      className: "bus-marker",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -22],
      html: `
        <div style="position:relative;width:40px;height:40px;">
          ${pulse}
          <div style="
            width:40px;height:40px;
            background:${color};
            border-radius:50%;
            border:3px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;
            transform:rotate(${rotation}deg);
            transition:transform 0.5s ease;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 6v6"/><path d="M16 6v6"/>
              <path d="M2 12h19.6"/>
              <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H6C4.9 6 3.9 6.8 3.6 7.8l-1.4 5c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2C2.5 16.3 3 18 3 18h3"/>
              <circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
            </svg>
          </div>
          ${label ? `<div style="position:absolute;top:42px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:11px;font-weight:600;background:white;padding:1px 6px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.2);color:#333;">${label}</div>` : ""}
        </div>
      `,
    })
  }, [heading, isStale, label])

  return (
    <Marker position={position} icon={icon}>
      {popupContent && <Popup>{popupContent}</Popup>}
    </Marker>
  )
}

"use client"

import "leaflet/dist/leaflet.css"
import { MapPin } from "lucide-react"
import FleetMap from "@/components/tracking/FleetMap"

/**
 * /company/fleet-tracking — Real-time fleet map showing all departed buses
 * Mobile: full-viewport app-like layout (map fills screen)
 * Desktop: padded card layout with title
 */
export default function FleetTrackingPage() {
  return (
    <div className="h-[calc(100dvh-3.5rem)] lg:h-auto lg:p-6 lg:max-w-7xl lg:mx-auto flex flex-col">
      {/* Title — hidden on mobile (map is self-explanatory) */}
      <div className="hidden lg:block mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="h-6 w-6 text-teal-600" />
          Fleet Tracking
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Real-time GPS positions of all departed buses
        </p>
      </div>

      <div className="relative z-0 flex-1 min-h-0 flex flex-col lg:block">
        <FleetMap />
      </div>
    </div>
  )
}

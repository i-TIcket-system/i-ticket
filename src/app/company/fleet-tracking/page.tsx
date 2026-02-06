"use client"

import "leaflet/dist/leaflet.css"
import { MapPin } from "lucide-react"
import FleetMap from "@/components/tracking/FleetMap"

/**
 * /company/fleet-tracking — Real-time fleet map showing all departed buses
 */
export default function FleetTrackingPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="h-6 w-6 text-teal-600" />
          Fleet Tracking
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Real-time GPS positions of all departed buses
        </p>
      </div>

      <FleetMap />
    </div>
  )
}

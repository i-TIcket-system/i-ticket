"use client"

import { X, Navigation, Clock, Gauge, Users, Phone, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import TrackingStatus from "./TrackingStatus"
import Link from "next/link"

interface FleetVehicle {
  tripId: string
  origin: string
  destination: string
  departureTime: string
  tracking: "live" | "stale" | "off"
  position: {
    latitude: number
    longitude: number
    speed: number | null
    updatedAt: string | null
  } | null
  estimatedArrival: string | null
  occupancy: { total: number; booked: number }
  driver: { name: string; phone: string } | null
  conductor: { name: string } | null
  vehicle: {
    id: string
    plateNumber: string
    sideNumber: string | null
    make: string
    model: string
  } | null
}

interface VehicleDetailPanelProps {
  vehicle: FleetVehicle
  onClose: () => void
}

export default function VehicleDetailPanel({ vehicle, onClose }: VehicleDetailPanelProps) {
  const speed = vehicle.position?.speed
  const lastUpdated = vehicle.position?.updatedAt

  // Format ETA
  const etaDisplay = vehicle.estimatedArrival
    ? new Date(vehicle.estimatedArrival).toLocaleTimeString("en-ET", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Addis_Ababa",
      })
    : null

  // Time until ETA
  const etaMinutes = vehicle.estimatedArrival
    ? Math.max(0, Math.round((new Date(vehicle.estimatedArrival).getTime() - Date.now()) / 60000))
    : null

  // Format last updated
  const lastUpdatedDisplay = lastUpdated
    ? (() => {
        const diff = Math.round((Date.now() - new Date(lastUpdated).getTime()) / 1000)
        if (diff < 60) return `${diff}s ago`
        if (diff < 3600) return `${Math.round(diff / 60)}m ago`
        return `${Math.round(diff / 3600)}h ago`
      })()
    : null

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-teal-50 dark:bg-teal-900/20 border-b border-teal-100 dark:border-teal-800">
        <div className="min-w-0">
          <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
            {vehicle.origin} → {vehicle.destination}
          </p>
          {vehicle.vehicle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {vehicle.vehicle.make} {vehicle.vehicle.model} — {vehicle.vehicle.plateNumber}
              {vehicle.vehicle.sideNumber ? ` (${vehicle.vehicle.sideNumber})` : ""}
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-3">
        {/* Speed + ETA row */}
        <div className="flex items-center gap-4">
          {/* Speed */}
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-teal-600" />
            <div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {speed != null ? Math.round(speed) : "—"}
              </span>
              <span className="text-xs text-gray-500 ml-1">km/h</span>
            </div>
          </div>

          {/* ETA */}
          {etaDisplay && (
            <div className="flex items-center gap-2 ml-auto">
              <Clock className="h-4 w-4 text-teal-600" />
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {etaMinutes != null && etaMinutes > 0
                    ? etaMinutes < 60
                      ? `${etaMinutes} min`
                      : `${Math.floor(etaMinutes / 60)}h ${etaMinutes % 60}m`
                    : "Arriving"}
                </p>
                <p className="text-[10px] text-gray-500">ETA {etaDisplay}</p>
              </div>
            </div>
          )}
        </div>

        {/* Status + Last update */}
        <div className="flex items-center justify-between">
          <TrackingStatus status={vehicle.tracking} lastUpdated={lastUpdated} />
          {lastUpdatedDisplay && (
            <span className="text-[10px] text-gray-400">Updated {lastUpdatedDisplay}</span>
          )}
        </div>

        {/* Driver + Occupancy */}
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100 dark:border-gray-800">
          {vehicle.driver && (
            <div className="flex items-start gap-2">
              <Navigation className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                  {vehicle.driver.name}
                </p>
                <a
                  href={`tel:${vehicle.driver.phone}`}
                  className="text-[10px] text-teal-600 hover:underline flex items-center gap-0.5"
                >
                  <Phone className="h-2.5 w-2.5" />
                  {vehicle.driver.phone}
                </a>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2">
            <Users className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {vehicle.occupancy.booked}/{vehicle.occupancy.total}
              </p>
              <p className="text-[10px] text-gray-500">Passengers</p>
            </div>
          </div>
        </div>

        {/* View Trip link */}
        <Link
          href={`/company/trips/${vehicle.tripId}`}
          className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          View Trip Details
        </Link>
      </div>
    </div>
  )
}

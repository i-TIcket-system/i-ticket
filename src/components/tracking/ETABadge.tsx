"use client"

import { Clock, Navigation, Gauge } from "lucide-react"
import { formatETA } from "@/lib/tracking/eta"

interface ETABadgeProps {
  remainingMinutes?: number | null
  remainingDistanceKm?: number | null
  speedKmh?: number | null
  estimatedArrival?: string | null
  className?: string
}

/**
 * Floating ETA display badge with remaining time, distance, and speed.
 */
export default function ETABadge({
  remainingMinutes,
  remainingDistanceKm,
  speedKmh,
  estimatedArrival,
  className = "",
}: ETABadgeProps) {
  if (remainingMinutes == null && remainingDistanceKm == null) return null

  const arrivalTime = estimatedArrival
    ? new Date(estimatedArrival).toLocaleTimeString("en-ET", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Addis_Ababa",
      })
    : null

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 px-4 py-3 ${className}`}
    >
      <div className="flex items-center gap-4 text-sm">
        {remainingMinutes != null && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-teal-600" />
            <span className="font-semibold">{formatETA(remainingMinutes)}</span>
          </div>
        )}

        {remainingDistanceKm != null && (
          <div className="flex items-center gap-1.5">
            <Navigation className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-gray-600 dark:text-gray-300">
              {remainingDistanceKm < 1
                ? `${Math.round(remainingDistanceKm * 1000)}m`
                : `${remainingDistanceKm}km`}
            </span>
          </div>
        )}

        {speedKmh != null && speedKmh > 0 && (
          <div className="flex items-center gap-1.5">
            <Gauge className="h-4 w-4 text-orange-500" />
            <span className="font-medium text-gray-600 dark:text-gray-300">
              {Math.round(speedKmh)} km/h
            </span>
          </div>
        )}

        {arrivalTime && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs text-gray-500">ETA</span>
            <span className="font-semibold text-teal-700 dark:text-teal-400">
              {arrivalTime}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

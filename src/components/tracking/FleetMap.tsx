"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { Loader2, Bus, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import TrackingStatus from "./TrackingStatus"

// Dynamic imports (no SSR)
const TrackingMap = dynamic(() => import("./TrackingMap"), { ssr: false })
const BusMarker = dynamic(() => import("./BusMarker"), { ssr: false })

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

interface FleetData {
  fleet: FleetVehicle[]
  totalDeparted: number
  totalTracking: number
}

const POLL_INTERVAL = 15000

export default function FleetMap() {
  const [data, setData] = useState<FleetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchFleet = async () => {
    try {
      const res = await fetch("/api/tracking/fleet")
      if (res.ok) {
        const result = await res.json()
        setData(result)
        setError("")
      } else {
        setError("Failed to load fleet data")
      }
    } catch {
      setError("Connection error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFleet()

    intervalRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchFleet()
      }
    }, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500 mb-3">{error}</p>
        <Button onClick={fetchFleet} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </Card>
    )
  }

  if (!data) return null

  // Vehicles with GPS positions
  const tracked = data.fleet.filter((f) => f.position != null)
  const untracked = data.fleet.filter((f) => f.position == null)

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <Badge variant="outline" className="text-sm py-1 px-3">
          <Bus className="h-3.5 w-3.5 mr-1.5" />
          {data.totalDeparted} Departed
        </Badge>
        <Badge
          variant="outline"
          className="text-sm py-1 px-3 border-green-500 text-green-700 dark:text-green-400"
        >
          <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5 inline-block" />
          {data.totalTracking} Tracking
        </Badge>
        <Button onClick={fetchFleet} variant="ghost" size="sm" className="ml-auto">
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Map */}
      <div className="h-[500px] lg:h-[600px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
        <TrackingMap center={[9.02, 38.75]} zoom={6}>
          {tracked.map((item) =>
            item.position ? (
              <BusMarker
                key={item.tripId}
                position={[item.position.latitude, item.position.longitude]}
                speed={item.position.speed}
                isStale={item.tracking === "stale"}
                label={item.vehicle?.sideNumber || item.vehicle?.plateNumber || undefined}
                popupContent={
                  <div className="text-sm min-w-[180px]">
                    <p className="font-semibold text-base mb-1">
                      {item.origin} → {item.destination}
                    </p>
                    {item.vehicle && (
                      <p className="text-gray-500">
                        {item.vehicle.make} {item.vehicle.model} - {item.vehicle.plateNumber}
                      </p>
                    )}
                    {item.driver && (
                      <p className="text-gray-500">Driver: {item.driver.name}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <TrackingStatus status={item.tracking} lastUpdated={item.position?.updatedAt} />
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <span>{item.occupancy.booked}/{item.occupancy.total} passengers</span>
                      {item.position?.speed != null && (
                        <span>| {Math.round(item.position.speed)} km/h</span>
                      )}
                    </div>
                    {item.estimatedArrival && (
                      <p className="text-xs text-teal-600 mt-1">
                        ETA:{" "}
                        {new Date(item.estimatedArrival).toLocaleTimeString("en-ET", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Africa/Addis_Ababa",
                        })}
                      </p>
                    )}
                  </div>
                }
              />
            ) : null
          )}
        </TrackingMap>

        {/* CSS for bus marker animation */}
        <style jsx global>{`
          @keyframes busping {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(2); opacity: 0; }
          }
        `}</style>
      </div>

      {/* Untracked trips list */}
      {untracked.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">
              Departed Without GPS ({untracked.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {untracked.map((item) => (
                <div
                  key={item.tripId}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm"
                >
                  <div>
                    <span className="font-medium">
                      {item.origin} → {item.destination}
                    </span>
                    {item.vehicle && (
                      <span className="text-gray-400 ml-2">{item.vehicle.plateNumber}</span>
                    )}
                  </div>
                  <TrackingStatus status="off" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

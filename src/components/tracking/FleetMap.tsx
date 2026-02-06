"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { Loader2, Bus, RefreshCw, Search, Crosshair, Maximize, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import TrackingStatus from "./TrackingStatus"
import type L from "leaflet"

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

type StatusFilter = "all" | "live" | "stale" | "off"

const POLL_INTERVAL = 15000

export default function FleetMap() {
  const [data, setData] = useState<FleetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // UX state
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [focusedTripId, setFocusedTripId] = useState<string | null>(null)
  const [flyTo, setFlyTo] = useState<{ position: [number, number]; zoom: number } | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [showList, setShowList] = useState(true)

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

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map
  }, [])

  // Filter vehicles by search + status
  const filteredFleet = useMemo(() => {
    if (!data) return []

    return data.fleet.filter((item) => {
      // Status filter
      if (statusFilter === "live" && item.tracking !== "live") return false
      if (statusFilter === "stale" && item.tracking !== "stale") return false
      if (statusFilter === "off" && item.position != null) return false

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase()
        const plate = item.vehicle?.plateNumber?.toLowerCase() ?? ""
        const side = item.vehicle?.sideNumber?.toLowerCase() ?? ""
        const route = `${item.origin} ${item.destination}`.toLowerCase()
        const driver = item.driver?.name?.toLowerCase() ?? ""
        if (!plate.includes(q) && !side.includes(q) && !route.includes(q) && !driver.includes(q)) {
          return false
        }
      }

      return true
    })
  }, [data, search, statusFilter])

  const tracked = useMemo(() => filteredFleet.filter((f) => f.position != null), [filteredFleet])
  const untracked = useMemo(() => filteredFleet.filter((f) => f.position == null), [filteredFleet])

  const focusVehicle = useCallback((item: FleetVehicle) => {
    if (!item.position) return
    setFocusedTripId(item.tripId)
    setFlyTo({
      position: [item.position.latitude, item.position.longitude],
      zoom: 14,
    })
  }, [])

  const fitAll = useCallback(() => {
    if (!mapRef.current || tracked.length === 0) return
    setFocusedTripId(null)

    // Dynamic import to avoid SSR issues with L
    import("leaflet").then((L) => {
      const bounds = L.latLngBounds(
        tracked.map((t) => [t.position!.latitude, t.position!.longitude] as [number, number])
      )
      mapRef.current?.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
    })
  }, [tracked])

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

      {/* Search + Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search plate, route, driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {(["all", "live", "stale", "off"] as StatusFilter[]).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => setStatusFilter(s)}
              className="h-8 text-xs capitalize"
            >
              {s === "off" ? "No GPS" : s === "all" ? `All (${data.fleet.length})` : s}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <Button onClick={fitAll} variant="outline" size="sm" className="h-8" title="Fit all vehicles">
            <Maximize className="h-3.5 w-3.5 mr-1" />
            Fit All
          </Button>
          <Button
            onClick={() => setShowList(!showList)}
            variant="outline"
            size="sm"
            className="h-8 lg:hidden"
          >
            {showList ? "Hide List" : "Show List"}
          </Button>
        </div>
      </div>

      {/* Map + Vehicle List side-by-side on desktop */}
      <div className="flex gap-4">
        {/* Vehicle list panel */}
        <div
          className={`${
            showList ? "block" : "hidden"
          } lg:block w-full lg:w-[320px] shrink-0 max-h-[600px] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900`}
        >
          <div className="p-3 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-[1]">
            <p className="text-xs font-medium text-gray-500">
              {filteredFleet.length} vehicle{filteredFleet.length !== 1 ? "s" : ""}
              {search && ` matching "${search}"`}
            </p>
          </div>

          {filteredFleet.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">
              No vehicles match your filters
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredFleet.map((item) => (
                <button
                  key={item.tripId}
                  onClick={() => focusVehicle(item)}
                  disabled={!item.position}
                  className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    focusedTripId === item.tripId
                      ? "bg-teal-50 dark:bg-teal-900/20 border-l-2 border-teal-500"
                      : ""
                  } ${!item.position ? "opacity-50 cursor-default" : "cursor-pointer"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">
                      {item.origin} → {item.destination}
                    </span>
                    <TrackingStatus status={item.tracking} />
                  </div>

                  <div className="flex items-center gap-2 mt-0.5">
                    {item.vehicle && (
                      <span className="text-xs text-gray-500">
                        {item.vehicle.plateNumber}
                        {item.vehicle.sideNumber ? ` (${item.vehicle.sideNumber})` : ""}
                      </span>
                    )}
                    {item.position?.speed != null && (
                      <span className="text-xs text-gray-400">
                        {Math.round(item.position.speed)} km/h
                      </span>
                    )}
                  </div>

                  {item.driver && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{item.driver.name}</p>
                  )}

                  {item.position && focusedTripId !== item.tripId && (
                    <div className="mt-1">
                      <span className="text-[10px] text-teal-600 flex items-center gap-1">
                        <Crosshair className="h-2.5 w-2.5" />
                        Click to locate
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 h-[500px] lg:h-[600px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
          <TrackingMap
            center={[9.02, 38.75]}
            zoom={6}
            flyTo={flyTo}
            onMapReady={handleMapReady}
          >
            {tracked.map((item) =>
              item.position ? (
                <BusMarker
                  key={item.tripId}
                  position={[item.position.latitude, item.position.longitude]}
                  speed={item.position.speed}
                  isStale={item.tracking === "stale"}
                  highlighted={focusedTripId === item.tripId}
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
      </div>

      {/* Untracked trips list (only show if not already filtered to "off") */}
      {statusFilter !== "off" && untracked.length > 0 && (
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

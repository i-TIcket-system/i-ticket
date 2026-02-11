"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import {
  MapPin, Navigation, Wifi, WifiOff, AlertTriangle,
  ShieldCheck, ShieldAlert, MonitorSmartphone, Crosshair,
} from "lucide-react"
import type L from "leaflet"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import ETABadge from "./ETABadge"
import TrackingStatus from "./TrackingStatus"
import OsmAndSetup from "./OsmAndSetup"
import { enqueuePosition, flushQueue, getQueueSize } from "@/lib/tracking/position-queue"
import { formatETA } from "@/lib/tracking/eta"
import { useWakeLock } from "@/hooks/use-wake-lock"
import {
  startAudioKeepAlive,
  stopAudioKeepAlive,
  resumeAudioKeepAlive,
  isAudioKeepAliveActive,
} from "@/lib/tracking/audio-keep-alive"

// Dynamic imports for Leaflet (no SSR)
const TrackingMap = dynamic(() => import("./TrackingMap"), { ssr: false })
const BusMarker = dynamic(() => import("./BusMarker"), { ssr: false })
const RouteOverlay = dynamic(() => import("./RouteOverlay"), { ssr: false })

interface TripData {
  id: string
  origin: { name: string; latitude: number | null; longitude: number | null }
  destination: { name: string; latitude: number | null; longitude: number | null }
  stops: Array<{ name: string; latitude: number | null; longitude: number | null }>
  departureTime: string
  estimatedDuration: number
  distance: number | null
  trackingActive: boolean
  lastLatitude: number | null
  lastLongitude: number | null
  lastSpeed: number | null
  lastPositionAt: string | null
  estimatedArrival: string | null
  vehicle: { plateNumber: string; sideNumber: string | null } | null
  company: string
}

const HEARTBEAT_INTERVAL = 30000 // 30s watchdog
const GPS_THROTTLE = 10000 // 10s between API sends

export default function DriverTrackingView() {
  const [trip, setTrip] = useState<TripData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [tracking, setTracking] = useState(false)
  const [gpsStatus, setGpsStatus] = useState<"acquiring" | "active" | "error">("acquiring")
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null)
  const [heading, setHeading] = useState<number | null>(null)
  const [speed, setSpeed] = useState<number | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [queuedCount, setQueuedCount] = useState(0)
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null)
  const [etaDistance, setEtaDistance] = useState<number | null>(null)
  const [estimatedArrival, setEstimatedArrival] = useState<string | null>(null)
  const [recoveryFlash, setRecoveryFlash] = useState(false)

  const watchIdRef = useRef<number | null>(null)
  const lastSendRef = useRef<number>(0)
  const lastGpsCallbackRef = useRef<number>(Date.now())
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tripRef = useRef<TripData | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map
    // Leaflet may initialize before container is fully sized — recalculate
    setTimeout(() => map.invalidateSize(), 200)
  }, [])

  // Wake Lock
  const wakeLock = useWakeLock()

  // Keep ref in sync
  useEffect(() => {
    tripRef.current = trip
  }, [trip])

  // Fetch active trip
  useEffect(() => {
    fetchTrip()
  }, [])

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      flushQueue().then((sent) => {
        if (sent > 0) setQueuedCount(getQueueSize())
      })
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Visibility recovery: re-acquire wake lock, resume audio, flush queue
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && tracking) {
        // Show recovery flash
        setRecoveryFlash(true)
        setTimeout(() => setRecoveryFlash(false), 2000)

        // Resume audio keep-alive
        resumeAudioKeepAlive()

        // Flush offline queue
        if (navigator.onLine) {
          flushQueue().then((sent) => {
            if (sent > 0) setQueuedCount(getQueueSize())
          })
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [tracking])

  const fetchTrip = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/tracking/active-trip")
      const data = await res.json()

      if (data.trip) {
        setTrip(data.trip)
        if (data.trip.estimatedArrival) {
          setEstimatedArrival(data.trip.estimatedArrival)
        }
      } else {
        setError("No active departed trip found. Make sure your trip status is DEPARTED.")
      }
    } catch {
      setError("Failed to load trip data. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const sendPosition = useCallback(
    async (lat: number, lng: number, alt?: number, acc?: number, hdg?: number, spd?: number) => {
      const currentTrip = tripRef.current
      if (!currentTrip) return

      const positionData = {
        tripId: currentTrip.id,
        latitude: lat,
        longitude: lng,
        altitude: alt,
        accuracy: acc,
        heading: hdg,
        speed: spd ? spd * 3.6 : undefined, // m/s → km/h
        recordedAt: new Date().toISOString(),
      }

      if (!navigator.onLine) {
        enqueuePosition(positionData)
        setQueuedCount(getQueueSize())
        return
      }

      try {
        const res = await fetch("/api/tracking/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(positionData),
        })

        if (res.ok) {
          const result = await res.json()
          if (result.estimatedArrival) {
            setEstimatedArrival(result.estimatedArrival)
            const mins = Math.round(
              (new Date(result.estimatedArrival).getTime() - Date.now()) / 60000
            )
            setEtaMinutes(mins > 0 ? mins : null)
          }
        } else {
          enqueuePosition(positionData)
          setQueuedCount(getQueueSize())
        }
      } catch {
        enqueuePosition(positionData)
        setQueuedCount(getQueueSize())
      }
    },
    []
  )

  const createGpsWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, altitude, accuracy, heading: hdg, speed: spd } = position.coords

        lastGpsCallbackRef.current = Date.now()
        setCurrentPos({ lat: latitude, lng: longitude })
        setHeading(hdg)
        setSpeed(spd ? spd * 3.6 : null)
        setGpsStatus("active")

        // Throttle: send every 10 seconds
        const now = Date.now()
        if (now - lastSendRef.current >= GPS_THROTTLE) {
          lastSendRef.current = now
          sendPosition(
            latitude,
            longitude,
            altitude ?? undefined,
            accuracy ?? undefined,
            hdg ?? undefined,
            spd ?? undefined
          )
        }
      },
      (err) => {
        console.error("[GPS] Error:", err.message)
        setGpsStatus("error")

        if (err.code === err.PERMISSION_DENIED) {
          setError("Location permission denied. Please enable GPS access in your browser settings.")
          setTracking(false)
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    )
  }, [sendPosition])

  const startTracking = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser")
      return
    }

    setTracking(true)
    setGpsStatus("acquiring")

    // Layer 1: Wake Lock
    wakeLock.request()

    // Layer 2: Audio keep-alive (must be in user gesture handler)
    startAudioKeepAlive()

    // Layer 3: GPS watch
    createGpsWatch()

    // Heartbeat watchdog: if no GPS callback for 30s, restart watchPosition
    lastGpsCallbackRef.current = Date.now()
    heartbeatRef.current = setInterval(() => {
      const elapsed = Date.now() - lastGpsCallbackRef.current
      if (elapsed > HEARTBEAT_INTERVAL) {
        console.warn("[GPS] Heartbeat: no callback for 30s, restarting watchPosition")
        createGpsWatch()
      }

      // Also ensure audio is still playing
      if (!isAudioKeepAliveActive()) {
        resumeAudioKeepAlive()
      }
    }, HEARTBEAT_INTERVAL)
  }, [wakeLock, createGpsWatch])

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }

    wakeLock.release()
    stopAudioKeepAlive()

    setTracking(false)
    setGpsStatus("acquiring")
  }, [wakeLock])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
      }
      stopAudioKeepAlive()
    }
  }, [])

  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading trip data...</p>
        </div>
      </div>
    )
  }

  if (error && !trip) {
    return (
      <div className="h-dvh flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">No Active Trip</h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{error}</p>
          <Button onClick={fetchTrip} variant="outline">
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  if (!trip) return null

  const mapCenter: [number, number] = currentPos
    ? [currentPos.lat, currentPos.lng]
    : trip.origin.latitude != null && trip.origin.longitude != null
      ? [trip.origin.latitude, trip.origin.longitude]
      : [9.02, 38.75]

  return (
    <div className="h-dvh flex flex-col relative">
      {/* Map (full screen) */}
      <div className="flex-1 relative">
        <TrackingMap center={mapCenter} zoom={currentPos ? 13 : 8} autoRecenter onMapReady={handleMapReady}>
          <RouteOverlay
            origin={trip.origin as { name: string; latitude: number; longitude: number }}
            destination={trip.destination as { name: string; latitude: number; longitude: number }}
            stops={trip.stops as Array<{ name: string; latitude: number; longitude: number }>}
          />
          {currentPos && (
            <BusMarker
              position={[currentPos.lat, currentPos.lng]}
              heading={heading}
              speed={speed}
            />
          )}
        </TrackingMap>

        {/* Recenter button */}
        {currentPos && tracking && (
          <button
            onClick={() => {
              mapRef.current?.flyTo([currentPos.lat, currentPos.lng], 14, { duration: 0.8 })
            }}
            className="absolute bottom-4 right-4 z-[1000] bg-white dark:bg-gray-800 rounded-full p-2.5 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Recenter on my position"
          >
            <Crosshair className="h-5 w-5 text-teal-600" />
          </button>
        )}

        {/* CSS for bus marker animation */}
        <style jsx global>{`
          @keyframes busping {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(2); opacity: 0; }
          }
        `}</style>

        {/* Top overlay: Trip info */}
        <div className="absolute top-3 left-3 right-3 z-[1000]">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="h-4 w-4 text-teal-600 flex-shrink-0" />
                <span className="font-semibold text-sm truncate">
                  {trip.origin.name} → {trip.destination.name}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!isOnline && (
                  <div className="flex items-center gap-1 text-orange-500">
                    <WifiOff className="h-3.5 w-3.5" />
                    <span className="text-xs">{queuedCount}q</span>
                  </div>
                )}
                <TrackingStatus
                  status={tracking && gpsStatus === "active" ? "live" : tracking ? "stale" : "off"}
                />
              </div>
            </div>
            {trip.vehicle && (
              <p className="text-xs text-gray-500 mt-1">
                {trip.vehicle.plateNumber}
                {trip.vehicle.sideNumber ? ` (${trip.vehicle.sideNumber})` : ""}
              </p>
            )}
          </Card>
        </div>

        {/* Background recovery flash */}
        {recoveryFlash && (
          <div className="absolute top-[70px] left-3 right-3 z-[1000] animate-fade-in">
            <div className="bg-green-500 text-white text-xs font-medium py-1.5 px-3 rounded-lg text-center">
              Background recovery — GPS resumed
            </div>
          </div>
        )}

        {/* Wake lock / background status indicators */}
        {tracking && (
          <div className="absolute top-[70px] left-3 z-[1000] flex flex-col gap-1.5">
            {wakeLock.isSupported && (
              <div
                className={`flex items-center gap-1.5 text-xs font-medium py-1 px-2.5 rounded-full ${
                  wakeLock.isActive
                    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                }`}
              >
                {wakeLock.isActive ? (
                  <>
                    <ShieldCheck className="h-3 w-3" />
                    Screen locked on
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-3 w-3" />
                    Screen lock lost
                  </>
                )}
              </div>
            )}

            {!wakeLock.isSupported && (
              <div className="flex items-center gap-1.5 text-xs font-medium py-1 px-2.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">
                <MonitorSmartphone className="h-3 w-3" />
                Keep app open &amp; screen on
              </div>
            )}

            {queuedCount > 0 && isOnline && (
              <div className="flex items-center gap-1.5 text-xs font-medium py-1 px-2.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                {queuedCount} queued
              </div>
            )}
          </div>
        )}

        {/* ETA overlay */}
        {tracking && etaMinutes != null && (
          <div className="absolute top-[80px] left-3 right-3 z-[999]">
            <ETABadge
              remainingMinutes={etaMinutes}
              remainingDistanceKm={etaDistance}
              speedKmh={speed}
              estimatedArrival={estimatedArrival}
            />
          </div>
        )}
      </div>

      {/* Bottom section: OsmAnd setup + action bar */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] safe-area-bottom">
        {/* OsmAnd background tracking setup (only when tracking is active) */}
        {tracking && <OsmAndSetup tripId={trip.id} />}

        <div className="pt-3 pb-6 px-4">
          {!tracking ? (
            <Button
              onClick={startTracking}
              className="w-full h-16 text-lg font-semibold"
              style={{ background: "linear-gradient(135deg, #0e9494 0%, #20c4c4 100%)" }}
            >
              <Navigation className="h-5 w-5 mr-2" />
              Start GPS Tracking
            </Button>
          ) : (
            <div className="flex gap-3">
              <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg px-4">
                <div className="text-center">
                  {gpsStatus === "acquiring" ? (
                    <p className="text-sm text-yellow-600 font-medium">Acquiring GPS...</p>
                  ) : (
                    <div className="flex items-center gap-3">
                      {isOnline ? (
                        <Wifi className="h-4 w-4 text-green-500" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-orange-500" />
                      )}
                      <span className="text-sm font-medium">
                        {speed != null ? `${Math.round(speed)} km/h` : "Tracking..."}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <Button
                onClick={stopTracking}
                variant="destructive"
                className="h-16 px-6"
              >
                Stop
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

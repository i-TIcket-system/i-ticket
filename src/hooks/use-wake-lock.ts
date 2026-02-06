"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseWakeLockReturn {
  /** Whether wake lock is currently active */
  isActive: boolean
  /** Whether the Wake Lock API is supported */
  isSupported: boolean
  /** Request the wake lock */
  request: () => Promise<void>
  /** Release the wake lock */
  release: () => Promise<void>
}

/**
 * Hook to manage Screen Wake Lock API.
 * Prevents screen from dimming/turning off while GPS tracking is active.
 * Auto-reacquires on visibility change (when driver returns to tab).
 */
export function useWakeLock(): UseWakeLockReturn {
  const [isActive, setIsActive] = useState(false)
  const sentinelRef = useRef<WakeLockSentinel | null>(null)
  const wantedRef = useRef(false)

  const isSupported = typeof navigator !== "undefined" && "wakeLock" in navigator

  const request = useCallback(async () => {
    if (!isSupported) return
    wantedRef.current = true

    try {
      const sentinel = await navigator.wakeLock.request("screen")
      sentinelRef.current = sentinel
      setIsActive(true)

      sentinel.addEventListener("release", () => {
        sentinelRef.current = null
        setIsActive(false)
      })
    } catch {
      // Wake lock request failed (e.g., low battery, permissions)
      setIsActive(false)
    }
  }, [isSupported])

  const release = useCallback(async () => {
    wantedRef.current = false
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release()
      } catch {
        // Already released
      }
      sentinelRef.current = null
      setIsActive(false)
    }
  }, [])

  // Auto-reacquire on visibility change
  useEffect(() => {
    if (!isSupported) return

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && wantedRef.current && !sentinelRef.current) {
        try {
          const sentinel = await navigator.wakeLock.request("screen")
          sentinelRef.current = sentinel
          setIsActive(true)

          sentinel.addEventListener("release", () => {
            sentinelRef.current = null
            setIsActive(false)
          })
        } catch {
          setIsActive(false)
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [isSupported])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wantedRef.current = false
      if (sentinelRef.current) {
        sentinelRef.current.release().catch(() => {})
        sentinelRef.current = null
      }
    }
  }, [])

  return { isActive, isSupported, request, release }
}

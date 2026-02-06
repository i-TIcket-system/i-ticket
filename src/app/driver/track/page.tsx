"use client"

import "leaflet/dist/leaflet.css"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import DriverTrackingView from "@/components/tracking/DriverTrackingView"

/**
 * /driver/track — Mobile-first full-screen GPS tracking page for drivers.
 * Sends GPS positions to server while trip is DEPARTED.
 */
export default function DriverTrackPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
      </div>
    )
  }

  if (!session) return null

  return <DriverTrackingView />
}

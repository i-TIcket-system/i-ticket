"use client"

import { useState } from "react"
import { PlayCircle, PauseCircle, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { hasDepartedEthiopia } from "@/lib/utils"

interface BookingControlCardProps {
  tripId: string
  bookingHalted: boolean
  availableSlots: number
  currentAutoResumeEnabled: boolean
  tripStatus: string
  departureTime: string  // CRITICAL: Check if trip has passed
  onUpdate: () => void
}

export function BookingControlCard({
  tripId,
  bookingHalted,
  availableSlots,
  currentAutoResumeEnabled,
  tripStatus,
  departureTime,
  onUpdate,
}: BookingControlCardProps) {
  // 🚨 ULTRA CRITICAL: Check BOTH status AND departure time
  // Past trips (even if still SCHEDULED) should be treated as departed
  // FIX: Use Ethiopia timezone for proper comparison
  const isPastTrip = hasDepartedEthiopia(departureTime)
  const isStatusBlocked = ["DEPARTED", "COMPLETED", "CANCELLED"].includes(tripStatus) || isPastTrip
  // Force halted display for blocked statuses OR past trips
  const displayHalted = isStatusBlocked || bookingHalted
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [autoResumeEnabled, setAutoResumeEnabled] = useState(currentAutoResumeEnabled)

  const toggleBooking = async (action: "RESUME" | "HALT") => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/company/trips/${tripId}/toggle-booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          autoResumeEnabled, // Send for both RESUME and HALT
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: "success",
          text: data.message,
        })
        setAutoResumeEnabled(false) // Reset checkbox after successful action
        setTimeout(() => {
          onUpdate()
          setMessage(null)
        }, 2000)
      } else {
        setMessage({ type: "error", text: data.error || "Action failed" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const updateAutoHaltSetting = async (enabled: boolean) => {
    try {
      const response = await fetch(`/api/company/trips/${tripId}/auto-halt-setting`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoResumeEnabled: enabled }),
      })

      if (response.ok) {
        setMessage({
          type: "success",
          text: enabled ? "Auto-halt disabled for this trip" : "Auto-halt enabled for this trip"
        })
        setTimeout(() => {
          onUpdate()
          setMessage(null)
        }, 2000)
      }
    } catch (error) {
      console.error("Failed to update auto-halt setting:", error)
    }
  }

  const handleCheckboxChange = (checked: boolean) => {
    setAutoResumeEnabled(checked)
    updateAutoHaltSetting(checked)
  }

  return (
    <Card className={displayHalted ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50"}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Online Booking Status</span>
          <Badge variant={displayHalted ? "destructive" : "default"}>
            {displayHalted ? "HALTED" : "ACTIVE"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {availableSlots > 0 && availableSlots <= 10 && bookingHalted && (
          <div className="flex items-start gap-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-800">
              <strong>Critical:</strong> Online booking is auto-halted. Only {availableSlots} slots remaining.
            </p>
          </div>
        )}

        {message && (
          <div
            className={`p-2 rounded text-xs ${
              message.type === "success"
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {isStatusBlocked && bookingHalted && (
          <div className="flex items-start gap-2 p-2 bg-gray-100 border border-gray-300 rounded text-xs">
            <AlertTriangle className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
            <p className="text-gray-800">
              <strong>Trip Status:</strong> {tripStatus}. Online booking cannot be resumed for {tripStatus.toLowerCase()} trips.
            </p>
          </div>
        )}

        {availableSlots === 0 && !isStatusBlocked && (
          <div className="flex items-start gap-2 p-2 bg-gray-100 border border-gray-300 rounded text-xs">
            <AlertTriangle className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
            <p className="text-gray-800">
              <strong>Sold Out:</strong> All seats are booked. No action needed.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex gap-2">
            {displayHalted ? (
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                size="sm"
                onClick={() => toggleBooking("RESUME")}
                disabled={isLoading || isStatusBlocked || availableSlots === 0}
                title={isStatusBlocked ? `Cannot resume booking for ${tripStatus} trips` : availableSlots === 0 ? "All seats are sold out" : undefined}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4 mr-2" />
                )}
                Resume Online Booking
              </Button>
            ) : (
              <Button
                variant="destructive"
                className="flex-1"
                size="sm"
                onClick={() => toggleBooking("HALT")}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <PauseCircle className="h-4 w-4 mr-2" />
                )}
                Halt Online Booking
              </Button>
            )}
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
            <input
              type="checkbox"
              id="autoResumeEnabled"
              checked={autoResumeEnabled}
              onChange={(e) => handleCheckboxChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="autoResumeEnabled"
              className="text-xs text-blue-900 cursor-pointer select-none"
            >
              <strong>Disable auto-halt for this trip</strong>
              <p className="text-blue-700 mt-1">
                {bookingHalted
                  ? "When resumed, booking will continue even below 10 seats."
                  : "Prevents auto-halt when slots drop to 10. Manual ticketing unaffected."}
              </p>
            </label>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {bookingHalted
            ? "Resume to allow online bookings. Manual sales still work."
            : "Halt to prevent new online bookings. Use for manual-only sales."}
        </p>
      </CardContent>
    </Card>
  )
}

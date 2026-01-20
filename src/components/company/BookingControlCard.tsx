"use client"

import { useState } from "react"
import { PlayCircle, PauseCircle, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface BookingControlCardProps {
  tripId: string
  bookingHalted: boolean
  availableSlots: number
  onUpdate: () => void
}

export function BookingControlCard({
  tripId,
  bookingHalted,
  availableSlots,
  onUpdate,
}: BookingControlCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [autoResumeEnabled, setAutoResumeEnabled] = useState(false)

  const toggleBooking = async (action: "RESUME" | "HALT") => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/company/trips/${tripId}/toggle-booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(action === "RESUME" && { autoResumeEnabled }),
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

  return (
    <Card className={bookingHalted ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50"}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Online Booking Status</span>
          <Badge variant={bookingHalted ? "destructive" : "default"}>
            {bookingHalted ? "HALTED" : "ACTIVE"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {availableSlots > 0 && availableSlots <= 10 && (
          <div className="flex items-start gap-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-800">
              <strong>Critical:</strong> Only {availableSlots} slots remaining. Online booking auto-halted for safety.
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

        <div className="space-y-3">
          <div className="flex gap-2">
            {bookingHalted ? (
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                size="sm"
                onClick={() => toggleBooking("RESUME")}
                disabled={isLoading}
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

          {bookingHalted && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
              <input
                type="checkbox"
                id="autoResumeEnabled"
                checked={autoResumeEnabled}
                onChange={(e) => setAutoResumeEnabled(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="autoResumeEnabled"
                className="text-xs text-blue-900 cursor-pointer select-none"
              >
                <strong>Don't auto-halt this trip again</strong>
                <p className="text-blue-700 mt-1">
                  Online booking will continue even below 10 seats. Other trips are not affected.
                </p>
              </label>
            </div>
          )}
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

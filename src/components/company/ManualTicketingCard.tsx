"use client"

import { useState } from "react"
import { Plus, Minus, Ticket, Loader2, Check, Eye, EyeOff, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SeatMap } from "@/components/booking/SeatMap"

interface ManualTicketingCardProps {
  tripId: string
  availableSlots: number
  totalSlots: number
  busType?: string
  onUpdate: () => void
}

export function ManualTicketingCard({
  tripId,
  availableSlots,
  totalSlots,
  busType,
  onUpdate,
}: ManualTicketingCardProps) {
  const [count, setCount] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showSeatMap, setShowSeatMap] = useState(false)
  const [selectedSeats, setSelectedSeats] = useState<number[]>([])

  const handleSellTickets = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/company/trips/${tripId}/manual-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passengerCount: count }),
      })

      const data = await response.json()

      if (response.ok) {
        const assignedSeats = data.seatNumbers?.join(", ") || "auto-assigned"
        setMessage({
          type: "success",
          text: `Sold ${count} ticket(s)! Seats: ${assignedSeats}. ${data.trip.availableSlots} remaining.`,
        })
        setCount(1)
        setSelectedSeats([]) // Clear any selections
        // Refresh parent component
        setTimeout(() => {
          onUpdate()
          setMessage(null)
        }, 10000) // 10 seconds - enough time to write seat numbers on paper ticket
      } else {
        setMessage({ type: "error", text: data.error || "Failed to record sale" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const increment = () => {
    if (count < Math.min(availableSlots, 10)) {
      setCount(count + 1)
    }
  }

  const decrement = () => {
    if (count > 1) {
      setCount(count - 1)
    }
  }

  const slotsPercentage = Math.round((availableSlots / totalSlots) * 100)

  return (
    <Card className="fixed bottom-6 right-6 w-80 shadow-2xl border-2 border-primary z-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Ticket className="h-5 w-5 text-primary" />
          Manual Ticketing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Slots Display */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Available Slots</span>
            <Badge variant={slotsPercentage > 20 ? "default" : "destructive"}>
              {availableSlots}/{totalSlots}
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                slotsPercentage > 20 ? "bg-green-500" : "bg-red-500"
              }`}
              style={{ width: `${slotsPercentage}%` }}
            />
          </div>
        </div>

        {/* Counter */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={decrement}
            disabled={count <= 1 || isLoading}
            className="h-12 w-12"
          >
            <Minus className="h-5 w-5" />
          </Button>

          <div className="text-center">
            <div className="text-4xl font-bold text-primary">{count}</div>
            <div className="text-xs text-muted-foreground">
              {count === 1 ? "ticket" : "tickets"}
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={increment}
            disabled={count >= Math.min(availableSlots, 10) || isLoading}
            className="h-12 w-12"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Sell Button */}
        <Button
          className="w-full h-12 text-lg"
          onClick={handleSellTickets}
          disabled={isLoading || availableSlots === 0}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Recording...
            </>
          ) : (
            <>
              <Ticket className="mr-2 h-5 w-5" />
              Sell {count} {count === 1 ? "Ticket" : "Tickets"}
            </>
          )}
        </Button>

        {/* Message */}
        {message && (
          <div
            className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.type === "success" && <Check className="h-4 w-4" />}
            {message.text}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          For tickets sold at your office. Online slots update automatically.
        </p>

        {/* Seat Reference (Toggleable) */}
        <div className="border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            type="button"
            onClick={() => setShowSeatMap(!showSeatMap)}
          >
            {showSeatMap ? (
              <>
                <EyeOff className="h-3 w-3 mr-1" />
                Hide Seat Reference
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 mr-1" />
                View Available Seats
              </>
            )}
          </Button>

          {showSeatMap && (
            <div className="mt-3 space-y-3 animate-fade-in">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    <strong>Reference only.</strong> Seats auto-assigned when you sell.
                    Write the assigned numbers on paper tickets.
                  </p>
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                <SeatMap
                  tripId={tripId}
                  passengerCount={count}
                  onSeatsSelected={() => {}} // View-only
                  className="shadow-none border-0"
                  busType={busType as "MINI" | "STANDARD" | "LUXURY" | undefined}
                  orientation="portrait"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Loader2, Armchair, XCircle, CheckCircle2, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SeatMapProps {
  tripId: string
  passengerCount: number
  onSeatsSelected: (seats: number[]) => void
  className?: string
}

type SeatStatus = "available" | "occupied" | "selected"

interface SeatData {
  number: number
  status: SeatStatus
  row: string
  position: "window" | "aisle" | "middle"
}

export function SeatMap({ tripId, passengerCount, onSeatsSelected, className }: SeatMapProps) {
  const [seats, setSeats] = useState<SeatData[]>([])
  const [selectedSeats, setSelectedSeats] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [totalSlots, setTotalSlots] = useState(0)
  const [occupiedSeats, setOccupiedSeats] = useState<number[]>([])

  useEffect(() => {
    fetchSeatAvailability()
  }, [tripId])

  useEffect(() => {
    // Notify parent when selection changes
    onSeatsSelected(selectedSeats)
  }, [selectedSeats, onSeatsSelected])

  const fetchSeatAvailability = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/seats`)
      const data = await response.json()

      if (response.ok) {
        setTotalSlots(data.totalSlots)
        setOccupiedSeats(data.occupiedSeats)

        // Generate seat layout
        const seatLayout = generateSeatLayout(data.totalSlots, data.occupiedSeats)
        setSeats(seatLayout)
      }
    } catch (error) {
      console.error("Failed to fetch seats:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateSeatLayout = (total: number, occupied: number[]): SeatData[] => {
    const seatLayout: SeatData[] = []
    const occupiedSet = new Set(occupied)

    // Determine layout: 4 seats per row (2-2 configuration) for standard buses
    // Adjust for bus types: MINI (2-1), STANDARD (2-2), LUXURY (2-2 with more space)
    const seatsPerRow = 4
    const rows = Math.ceil(total / seatsPerRow)

    for (let i = 1; i <= total; i++) {
      const rowIndex = Math.floor((i - 1) / seatsPerRow)
      const seatInRow = (i - 1) % seatsPerRow
      const rowLetter = String.fromCharCode(65 + rowIndex) // A, B, C...

      let position: "window" | "aisle" | "middle"
      if (seatInRow === 0 || seatInRow === 3) {
        position = "window" // Seats 1 and 4 in each row
      } else if (seatInRow === 1 || seatInRow === 2) {
        position = "aisle" // Seats 2 and 3 in each row
      } else {
        position = "middle"
      }

      seatLayout.push({
        number: i,
        status: occupiedSet.has(i) ? "occupied" : "available",
        row: rowLetter,
        position,
      })
    }

    return seatLayout
  }

  const toggleSeat = (seatNumber: number) => {
    const seat = seats.find((s) => s.number === seatNumber)
    if (!seat || seat.status === "occupied") return

    if (selectedSeats.includes(seatNumber)) {
      // Deselect
      setSelectedSeats((prev) => prev.filter((s) => s !== seatNumber))
      setSeats((prev) =>
        prev.map((s) =>
          s.number === seatNumber ? { ...s, status: "available" } : s
        )
      )
    } else {
      // Check if we can select more
      if (selectedSeats.length >= passengerCount) {
        // Auto-deselect first selected seat (FIFO)
        const firstSelected = selectedSeats[0]
        setSelectedSeats((prev) => [...prev.slice(1), seatNumber])
        setSeats((prev) =>
          prev.map((s) => {
            if (s.number === firstSelected) return { ...s, status: "available" }
            if (s.number === seatNumber) return { ...s, status: "selected" }
            return s
          })
        )
      } else {
        // Select
        setSelectedSeats((prev) => [...prev, seatNumber])
        setSeats((prev) =>
          prev.map((s) =>
            s.number === seatNumber ? { ...s, status: "selected" } : s
          )
        )
      }
    }
  }

  const getSeatColor = (status: SeatStatus): string => {
    switch (status) {
      case "available":
        return "bg-green-50 border-green-300 hover:bg-green-100 hover:border-green-400 cursor-pointer"
      case "occupied":
        return "bg-gray-200 border-gray-400 cursor-not-allowed opacity-60"
      case "selected":
        return "bg-blue-500 border-blue-600 text-white cursor-pointer"
    }
  }

  const getSeatIcon = (status: SeatStatus) => {
    switch (status) {
      case "available":
        return <Armchair className="h-4 w-4 text-green-600" />
      case "occupied":
        return <XCircle className="h-4 w-4 text-gray-500" />
      case "selected":
        return <CheckCircle2 className="h-4 w-4 text-white" />
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading seat map...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Group seats by rows for 2-2 layout
  const seatsPerRow = 4
  const rows: SeatData[][] = []
  for (let i = 0; i < seats.length; i += seatsPerRow) {
    rows.push(seats.slice(i, i + seatsPerRow))
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Armchair className="h-5 w-5 text-primary" />
              Select Your Seats
            </CardTitle>
            <CardDescription>
              {selectedSeats.length} of {passengerCount} seat{passengerCount > 1 ? "s" : ""} selected
            </CardDescription>
          </div>
          {selectedSeats.length === passengerCount && (
            <Badge className="bg-green-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Banner */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-700">
            <p className="font-medium mb-1">Seat Selection Tips:</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Click seats to select/deselect</li>
              <li>First/Last seats in row = Window seats</li>
              <li>Middle seats = Aisle seats</li>
              <li>Select {passengerCount} seat{passengerCount > 1 ? "s" : ""} for your passenger{passengerCount > 1 ? "s" : ""}</li>
            </ul>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded border-2 bg-green-50 border-green-300 flex items-center justify-center">
              <Armchair className="h-4 w-4 text-green-600" />
            </div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded border-2 bg-blue-500 border-blue-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded border-2 bg-gray-200 border-gray-400 flex items-center justify-center opacity-60">
              <XCircle className="h-4 w-4 text-gray-500" />
            </div>
            <span>Occupied</span>
          </div>
        </div>

        {/* Seat Map */}
        <div className="space-y-2">
          {/* Driver indicator */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b">
            <div className="h-10 w-full max-w-[80px] rounded-lg bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
              <span className="text-xs text-white font-medium">🚗 Driver</span>
            </div>
            <div className="flex-1 border-t-2 border-dashed border-muted-foreground/30" />
          </div>

          {/* Seat Grid */}
          <div className="space-y-3">
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex items-center gap-2">
                {/* Row label */}
                <div className="w-6 text-center text-sm font-medium text-muted-foreground">
                  {String.fromCharCode(65 + rowIndex)}
                </div>

                {/* Seats in row (2-2 layout) */}
                <div className="flex-1 grid grid-cols-4 gap-2">
                  {row.map((seat, seatIndex) => (
                    <div key={seat.number} className={cn(seatIndex === 2 && "col-start-3")}>
                      <button
                        onClick={() => toggleSeat(seat.number)}
                        disabled={seat.status === "occupied"}
                        className={cn(
                          "h-12 w-full rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1",
                          getSeatColor(seat.status),
                          seat.status === "selected" && "ring-2 ring-blue-400 ring-offset-2 scale-105"
                        )}
                        aria-label={`Seat ${seat.number} - ${seat.status === "occupied" ? "Occupied" : seat.status === "selected" ? "Selected" : "Available"} - ${seat.position} seat`}
                        aria-pressed={seat.status === "selected"}
                      >
                        {getSeatIcon(seat.status)}
                        <span className={cn(
                          "text-xs font-bold",
                          seat.status === "selected" ? "text-white" : "text-foreground"
                        )}>
                          {seat.number}
                        </span>
                      </button>
                      {/* Aisle indicator */}
                      {seatIndex === 1 && (
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 h-full w-px" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Selection summary */}
          {selectedSeats.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium mb-2">Your Selected Seats:</p>
              <div className="flex flex-wrap gap-2">
                {selectedSeats.map((seatNum) => {
                  const seat = seats.find((s) => s.number === seatNum)
                  return (
                    <Badge key={seatNum} className="bg-blue-500">
                      Seat {seatNum}
                      {seat && (
                        <span className="ml-1 text-xs opacity-80">
                          ({seat.position === "window" ? "Window" : seat.position === "aisle" ? "Aisle" : "Middle"})
                        </span>
                      )}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          {/* Warning if not enough seats selected */}
          {passengerCount > selectedSeats.length && selectedSeats.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-xs text-yellow-800">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>
                Please select {passengerCount - selectedSeats.length} more seat{passengerCount - selectedSeats.length > 1 ? "s" : ""}.
                You need {passengerCount} seat{passengerCount > 1 ? "s" : ""} for {passengerCount} passenger{passengerCount > 1 ? "s" : ""}.
              </p>
            </div>
          )}

          {/* Optional: Auto-assignment fallback */}
          {selectedSeats.length === 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted border text-xs text-muted-foreground">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>
                <span className="font-medium">Optional:</span> If you don't select seats, we'll automatically assign the best available seats for you.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

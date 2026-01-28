"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, CheckCircle2, Info, Bus, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SeatMapProps {
  tripId: string
  passengerCount: number
  onSeatsSelected: (seats: number[]) => void
  className?: string
  busType?: "MINI" | "STANDARD" | "LUXURY"
  orientation?: "landscape" | "portrait" | "auto" // "auto" = detect device
  refreshTrigger?: number // Increment to force refresh after sales
  pollingInterval?: number // Milliseconds, 0 = no polling (default)
  showOrientationToggle?: boolean // Allow user to switch orientation
}

type SeatStatus = "available" | "occupied" | "selected"

interface SeatData {
  number: number
  status: SeatStatus
  column: number
  row: number // 0=bottom (driver side), 1=second, 2=third (after aisle), 3=top
}

// Simplified two-state seat icon: vacant box or occupied box with X
function SeatIcon({ status, number, size = "normal" }: { status: SeatStatus; number: number; size?: "normal" | "small" }) {
  const isOccupied = status === "occupied"
  const isSelected = status === "selected"

  // Vacant (available or selected) = white/light background with border
  // Occupied = gray background with red X
  const bgColor = isOccupied ? "#E5E7EB" : isSelected ? "#DBEAFE" : "#FFFFFF"
  const borderColor = isSelected ? "#3B82F6" : "#D1D5DB"
  const borderWidth = isSelected ? "3" : "2"

  const dimensions = size === "small" ? { width: 32, height: 32, fontSize: 11 } : { width: 44, height: 44, fontSize: 13 }

  return (
    <svg width={dimensions.width} height={dimensions.height} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Simple square box */}
      <rect
        x="4"
        y="4"
        width="36"
        height="36"
        rx="4"
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={borderWidth}
      />

      {isOccupied ? (
        /* Show red X for occupied seats */
        <>
          <line x1="14" y1="14" x2="30" y2="30" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
          <line x1="30" y1="14" x2="14" y2="30" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : (
        /* Show seat number for available/selected seats */
        <text
          x="22"
          y="24"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#374151"
          fontSize={dimensions.fontSize}
          fontWeight="600"
          fontFamily="system-ui, sans-serif"
        >
          {number}
        </text>
      )}
    </svg>
  )
}

// Steering wheel icon
function SteeringWheelIcon({ size = "normal" }: { size?: "normal" | "small" }) {
  const dim = size === "small" ? 40 : 56
  return (
    <svg width={dim} height={dim} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="22" stroke="#6B7280" strokeWidth="4" fill="none" />
      <circle cx="28" cy="28" r="8" stroke="#6B7280" strokeWidth="3" fill="none" />
      <circle cx="28" cy="28" r="3" fill="#6B7280" />
      <line x1="28" y1="6" x2="28" y2="20" stroke="#6B7280" strokeWidth="3" />
      <line x1="28" y1="36" x2="28" y2="50" stroke="#6B7280" strokeWidth="3" />
      <line x1="6" y1="28" x2="20" y2="28" stroke="#6B7280" strokeWidth="3" />
      <line x1="36" y1="28" x2="50" y2="28" stroke="#6B7280" strokeWidth="3" />
    </svg>
  )
}

// Bus orientation indicator
function OrientationIcon({ orientation }: { orientation: "landscape" | "portrait" }) {
  if (orientation === "portrait") {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <svg width="18" height="36" viewBox="0 0 18 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="16" height="34" rx="3" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="1.5" />
          <rect x="4" y="4" width="4" height="4" rx="1" fill="#9CA3AF" />
          <rect x="4" y="10" width="4" height="4" rx="1" fill="#9CA3AF" />
          <rect x="4" y="16" width="4" height="4" rx="1" fill="#9CA3AF" />
          <rect x="4" y="22" width="4" height="4" rx="1" fill="#9CA3AF" />
          <circle cx="5" cy="32" r="2" fill="#4B5563" />
          <circle cx="13" cy="32" r="2" fill="#4B5563" />
        </svg>
        <span className="font-medium">Portrait</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <svg width="36" height="18" viewBox="0 0 36 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="2" width="34" height="12" rx="3" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="1.5" />
        <rect x="4" y="4" width="5" height="5" rx="1" fill="#9CA3AF" />
        <rect x="11" y="4" width="5" height="5" rx="1" fill="#9CA3AF" />
        <rect x="18" y="4" width="5" height="5" rx="1" fill="#9CA3AF" />
        <rect x="25" y="4" width="5" height="5" rx="1" fill="#9CA3AF" />
        <circle cx="9" cy="14" r="2.5" fill="#4B5563" />
        <circle cx="27" cy="14" r="2.5" fill="#4B5563" />
      </svg>
      <span className="font-medium">Landscape</span>
    </div>
  )
}

export function SeatMap({
  tripId,
  passengerCount,
  onSeatsSelected,
  className,
  busType = "STANDARD",
  orientation = "auto",
  refreshTrigger = 0,
  pollingInterval = 0,
  showOrientationToggle = true
}: SeatMapProps) {
  const [seats, setSeats] = useState<SeatData[]>([])
  const [selectedSeats, setSelectedSeats] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [totalSlots, setTotalSlots] = useState(0)

  // Fix for stale closure: useRef to always access current selectedSeats value
  // This prevents polling from using stale captured values
  const selectedSeatsRef = useRef<number[]>([])

  // Auto-detect orientation based on device
  const [currentOrientation, setCurrentOrientation] = useState<"landscape" | "portrait">(() => {
    if (orientation === "auto") {
      // Will be set properly in useEffect
      return "landscape"
    }
    return orientation
  })

  // Detect mobile device and set initial orientation
  useEffect(() => {
    if (orientation !== "auto") {
      setCurrentOrientation(orientation)
      return
    }

    // Detect mobile: check screen width and touch capability
    const detectMobile = () => {
      const isMobileWidth = window.innerWidth < 768
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      return isMobileWidth && isTouchDevice
    }

    const isMobile = detectMobile()
    setCurrentOrientation(isMobile ? "portrait" : "landscape")

    // Listen for resize to update orientation
    const handleResize = () => {
      if (orientation === "auto") {
        const isMobile = detectMobile()
        setCurrentOrientation(isMobile ? "portrait" : "landscape")
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [orientation])

  // Toggle orientation handler
  const toggleOrientation = () => {
    setCurrentOrientation(prev => prev === "landscape" ? "portrait" : "landscape")
  }

  // Keep ref in sync with selectedSeats state for polling access
  useEffect(() => {
    selectedSeatsRef.current = selectedSeats
  }, [selectedSeats])

  useEffect(() => {
    fetchSeatAvailability()
    // Clear selection on refresh
    if (refreshTrigger > 0) {
      setSelectedSeats([])
    }
  }, [tripId, refreshTrigger])

  useEffect(() => {
    onSeatsSelected(selectedSeats)
  }, [selectedSeats, onSeatsSelected])

  // Polling for real-time seat updates (for manual ticketing portals)
  useEffect(() => {
    if (!pollingInterval || pollingInterval === 0) return

    const interval = setInterval(() => {
      fetchSeatAvailability()
    }, pollingInterval)

    return () => clearInterval(interval) // Cleanup on unmount
  }, [pollingInterval, tripId])

  const fetchSeatAvailability = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/seats`)
      const data = await response.json()

      if (response.ok) {
        setTotalSlots(data.totalSlots)
        // Use ref for current selected seats to avoid stale closure in polling interval
        const seatLayout = generateSeatLayout(data.totalSlots, data.occupiedSeats, selectedSeatsRef.current)
        setSeats(seatLayout)
      }
    } catch (error) {
      console.error("Failed to fetch seats:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateSeatLayout = (total: number, occupied: number[], currentlySelected: number[] = []): SeatData[] => {
    const seatLayout: SeatData[] = []
    const occupiedSet = new Set(occupied)
    const selectedSet = new Set(currentlySelected)

    for (let i = 1; i <= total; i++) {
      const columnIndex = Math.floor((i - 1) / 4)
      const posInColumn = (i - 1) % 4

      let visualRow: number
      switch (posInColumn) {
        case 0: visualRow = 0; break
        case 1: visualRow = 1; break
        case 2: visualRow = 3; break
        case 3: visualRow = 2; break
        default: visualRow = 0
      }

      // Determine status: occupied takes priority, then selected, then available
      let status: SeatStatus
      if (occupiedSet.has(i)) {
        status = "occupied"
      } else if (selectedSet.has(i)) {
        status = "selected"
      } else {
        status = "available"
      }

      seatLayout.push({
        number: i,
        status,
        column: columnIndex,
        row: visualRow,
      })
    }

    return seatLayout
  }

  const toggleSeat = (seatNumber: number) => {
    const seat = seats.find((s) => s.number === seatNumber)
    if (!seat || seat.status === "occupied") return

    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats((prev) => prev.filter((s) => s !== seatNumber))
      setSeats((prev) =>
        prev.map((s) =>
          s.number === seatNumber ? { ...s, status: "available" } : s
        )
      )
    } else {
      if (selectedSeats.length >= passengerCount) {
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
        setSelectedSeats((prev) => [...prev, seatNumber])
        setSeats((prev) =>
          prev.map((s) =>
            s.number === seatNumber ? { ...s, status: "selected" } : s
          )
        )
      }
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

  // Organize seats into columns
  const columns: Map<number, SeatData[]> = new Map()
  seats.forEach((seat) => {
    if (!columns.has(seat.column)) {
      columns.set(seat.column, [])
    }
    columns.get(seat.column)!.push(seat)
  })

  const numColumns = columns.size > 0 ? Math.max(...Array.from(columns.keys())) + 1 : 0
  const isPortrait = currentOrientation === "portrait"
  const seatSize = isPortrait ? "small" : "normal"

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-primary" />
              {isPortrait ? "Seat Overview" : "Select Your Seats"}
            </CardTitle>
            <CardDescription>
              {selectedSeats.length} of {passengerCount} seat{passengerCount > 1 ? "s" : ""} selected
              {isPortrait && ` • ${seats.filter(s => s.status === "available").length} available`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {selectedSeats.length === passengerCount && (
              <Badge className="bg-green-500 text-white">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            )}
            {showOrientationToggle && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleOrientation}
                className="gap-2 h-8 px-2 text-xs"
                title={`Switch to ${isPortrait ? 'landscape' : 'portrait'} view`}
              >
                <RotateCcw className="h-3 w-3" />
                <span className="hidden sm:inline">{isPortrait ? 'Landscape' : 'Portrait'}</span>
              </Button>
            )}
            <OrientationIcon orientation={currentOrientation} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legend - Simplified two-state */}
        <div className="flex flex-wrap items-center gap-4 text-xs border-b pb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded border-2 border-gray-300 bg-white flex items-center justify-center">
              <span className="text-gray-700 text-[11px] font-semibold">1</span>
            </div>
            <span className="text-muted-foreground font-medium">Vacant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded border-2 border-gray-300 bg-gray-200 flex items-center justify-center relative">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <line x1="5" y1="5" x2="15" y2="15" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="15" y1="5" x2="5" y2="15" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-muted-foreground font-medium">Occupied</span>
          </div>
        </div>

        {/* Seat Map */}
        {isPortrait ? (
          /* Portrait Layout - Vertical bus view */
          <div className="border-2 border-gray-200 rounded-xl p-3 bg-gray-50/50">
            {/* Steering wheel at top */}
            <div className="flex justify-center mb-2 pb-2 border-b border-gray-300">
              <div className="flex flex-col items-center">
                <SteeringWheelIcon size="small" />
                <span className="text-[10px] text-gray-400 mt-1">DRIVER</span>
              </div>
            </div>

            {/* Seats in rows (portrait = columns become rows) */}
            <div className="space-y-1">
              {Array.from({ length: numColumns }, (_, colIndex) => {
                const columnSeats = columns.get(colIndex) || []
                // Left side (rows 0, 1) | Aisle | Right side (rows 2, 3)
                const leftSide = columnSeats.filter(s => s.row < 2).sort((a, b) => a.row - b.row)
                const rightSide = columnSeats.filter(s => s.row >= 2).sort((a, b) => a.row - b.row)

                return (
                  <div key={colIndex} className="flex items-center justify-center gap-1">
                    {/* Left side seats */}
                    <div className="flex gap-0.5">
                      {leftSide.map((seat) => (
                        <button
                          key={seat.number}
                          onClick={() => toggleSeat(seat.number)}
                          disabled={seat.status === "occupied"}
                          className={cn(
                            "transition-all duration-150 rounded focus:outline-none focus:ring-2 focus:ring-offset-1",
                            seat.status === "occupied" && "opacity-50 cursor-not-allowed",
                            seat.status === "selected" && "ring-2 ring-blue-300 scale-105",
                            seat.status === "available" && "hover:scale-105 focus:ring-green-400",
                          )}
                          aria-label={`Seat ${seat.number} - ${seat.status}`}
                        >
                          <SeatIcon status={seat.status} number={seat.number} size={seatSize} />
                        </button>
                      ))}
                    </div>

                    {/* Aisle */}
                    <div className="w-4 flex-shrink-0" />

                    {/* Right side seats */}
                    <div className="flex gap-0.5">
                      {rightSide.map((seat) => (
                        <button
                          key={seat.number}
                          onClick={() => toggleSeat(seat.number)}
                          disabled={seat.status === "occupied"}
                          className={cn(
                            "transition-all duration-150 rounded focus:outline-none focus:ring-2 focus:ring-offset-1",
                            seat.status === "occupied" && "opacity-50 cursor-not-allowed",
                            seat.status === "selected" && "ring-2 ring-blue-300 scale-105",
                            seat.status === "available" && "hover:scale-105 focus:ring-green-400",
                          )}
                          aria-label={`Seat ${seat.number} - ${seat.status}`}
                        >
                          <SeatIcon status={seat.status} number={seat.number} size={seatSize} />
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Back of bus label */}
            <div className="flex justify-center mt-2 pt-2 border-t border-gray-300">
              <span className="text-[10px] text-gray-400">BACK</span>
            </div>
          </div>
        ) : (
          /* Landscape Layout - Horizontal bus view */
          <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50/50 overflow-x-auto">
            <div className="flex items-center gap-4 min-w-max">
              {/* Steering Wheel Section */}
              <div className="flex flex-col items-center justify-center px-2">
                <SteeringWheelIcon />
              </div>

              {/* Divider */}
              <div className="w-px h-48 bg-gray-300" />

              {/* Seat Grid */}
              <div className="flex gap-1">
                {Array.from({ length: numColumns }, (_, colIndex) => {
                  const columnSeats = columns.get(colIndex) || []
                  const topSection = columnSeats
                    .filter(s => s.row >= 2)
                    .sort((a, b) => b.row - a.row)
                  const bottomSection = columnSeats
                    .filter(s => s.row < 2)
                    .sort((a, b) => b.row - a.row)

                  return (
                    <div key={colIndex} className="flex flex-col">
                      <div className="flex flex-col gap-1">
                        {topSection.map((seat) => (
                          <button
                            key={seat.number}
                            onClick={() => toggleSeat(seat.number)}
                            disabled={seat.status === "occupied"}
                            className={cn(
                              "transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1",
                              seat.status === "occupied" && "opacity-50 cursor-not-allowed",
                              seat.status === "selected" && "ring-2 ring-blue-300 scale-105",
                              seat.status === "available" && "hover:scale-105 focus:ring-green-400",
                            )}
                            aria-label={`Seat ${seat.number} - ${seat.status}`}
                          >
                            <SeatIcon status={seat.status} number={seat.number} size={seatSize} />
                          </button>
                        ))}
                      </div>

                      <div className="h-8 flex items-center justify-center">
                        {colIndex === 0 && (
                          <span className="text-[10px] text-gray-400 font-medium">AISLE</span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        {bottomSection.map((seat) => (
                          <button
                            key={seat.number}
                            onClick={() => toggleSeat(seat.number)}
                            disabled={seat.status === "occupied"}
                            className={cn(
                              "transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1",
                              seat.status === "occupied" && "opacity-50 cursor-not-allowed",
                              seat.status === "selected" && "ring-2 ring-blue-300 scale-105",
                              seat.status === "available" && "hover:scale-105 focus:ring-green-400",
                            )}
                            aria-label={`Seat ${seat.number} - ${seat.status}`}
                          >
                            <SeatIcon status={seat.status} number={seat.number} size={seatSize} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Selection summary */}
        {selectedSeats.length > 0 && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm font-medium mb-2 text-blue-900">Selected Seats:</p>
            <div className="flex flex-wrap gap-2">
              {selectedSeats.sort((a, b) => a - b).map((seatNum) => (
                <Badge key={seatNum} className="bg-blue-500 hover:bg-blue-600 text-white">
                  Seat {seatNum}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Warning if not enough seats selected */}
        {passengerCount > selectedSeats.length && selectedSeats.length > 0 && !isPortrait && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-100 border border-yellow-300 text-xs text-yellow-900">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              Please select {passengerCount - selectedSeats.length} more seat{passengerCount - selectedSeats.length > 1 ? "s" : ""}.
            </p>
          </div>
        )}

        {/* Auto-assignment fallback - only for customer view */}
        {selectedSeats.length === 0 && !isPortrait && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted border text-xs text-muted-foreground">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              <span className="font-medium">Optional:</span> If you don't select seats, we'll automatically assign the best available seats for you.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

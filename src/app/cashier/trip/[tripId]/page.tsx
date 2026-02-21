"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  ArrowLeft,
  Bus,
  MapPin,
  Clock,
  Users,
  Ticket,
  Loader2,
  AlertCircle,
  Plus,
  Minus,
  Check,
  RefreshCw,
  Printer,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { formatCurrency, formatDate } from "@/lib/utils"
import { SeatMap } from "@/components/booking/SeatMap"
import { TripChat } from "@/components/trip/TripChat"

interface TripDetails {
  id: string
  origin: string
  destination: string
  departureTime: string
  estimatedDuration: number
  price: number
  busType: string
  totalSlots: number
  availableSlots: number
  vehicle?: {
    plateNumber: string
    sideNumber: string
  } | null
  company: {
    name: string
  }
}

interface RecentSale {
  id: string
  seatNumbers: number[]
  amount: number
  time: string
}

export default function CashierTripPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const tripId = params.tripId as string

  const [trip, setTrip] = useState<TripDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [selling, setSelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [ticketCount, setTicketCount] = useState(1)
  const [selectedSeats, setSelectedSeats] = useState<number[]>([])
  const [recentSales, setRecentSales] = useState<RecentSale[]>([])
  const [seatRefreshTrigger, setSeatRefreshTrigger] = useState(0)
  const [lastSaleResult, setLastSaleResult] = useState<{
    seatNumbers: number[]
    amount: number
  } | null>(null)

  // Memoize the seat selection handler to prevent infinite loops
  const handleSeatsSelected = useCallback((seats: number[]) => {
    setSelectedSeats(seats)
  }, [])

  useEffect(() => {
    fetchTripDetails()

    // Poll trip data every 5 seconds so available slot count stays in sync
    // with the SeatMap (which also polls at 5s) and other cashier/admin sales
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchTripDetails()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [tripId])

  const fetchTripDetails = async () => {
    try {
      const response = await fetch(`/api/cashier/trip/${tripId}`)
      const data = await response.json()

      if (response.ok) {
        setTrip(data.trip)
        setRecentSales(data.recentSales || [])
      } else {
        setError(data.error || "Failed to load trip")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSellTickets = async () => {
    if (!trip) return

    // Validate seat selection if seats were selected
    if (selectedSeats.length > 0 && selectedSeats.length !== ticketCount) {
      toast.error(`Please select exactly ${ticketCount} seat${ticketCount > 1 ? "s" : ""}`)
      return
    }

    setSelling(true)
    setLastSaleResult(null)

    try {
      const response = await fetch(`/api/cashier/trip/${tripId}/sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passengerCount: ticketCount,
          selectedSeats: selectedSeats.length > 0 ? selectedSeats : undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const assignedSeats = data.seatNumbers || []
        const totalAmount = data.totalAmount

        // Show success with seat numbers
        setLastSaleResult({
          seatNumbers: assignedSeats,
          amount: totalAmount,
        })

        toast.success(
          `Sold ${ticketCount} ticket${ticketCount > 1 ? "s" : ""}! Seats: ${assignedSeats.join(", ")}`,
          { duration: 10000 }
        )

        // Add to recent sales
        setRecentSales((prev) => [
          {
            id: data.bookingId,
            seatNumbers: assignedSeats,
            amount: totalAmount,
            time: new Date().toISOString(),
          },
          ...prev.slice(0, 9), // Keep last 10
        ])

        // Reset form
        setTicketCount(1)
        setSelectedSeats([])

        // Refresh trip data and seat map
        fetchTripDetails()
        setSeatRefreshTrigger(prev => prev + 1)
      } else {
        toast.error(data.error || "Failed to sell tickets")
      }
    } catch (err) {
      toast.error("Network error. Please try again.")
    } finally {
      setSelling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-3" />
          <p className="text-muted-foreground">Loading trip details...</p>
        </div>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error || "Trip not found"}</p>
            <Button asChild>
              <Link href="/cashier">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const soldCount = trip.totalSlots - trip.availableSlots
  const fillPercentage = Math.round((soldCount / trip.totalSlots) * 100)
  const maxTickets = Math.min(trip.availableSlots, 10)

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/cashier">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-teal-600" />
            {trip.origin} → {trip.destination}
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            {formatDate(trip.departureTime)}
            <span className="mx-1">•</span>
            <Badge variant="outline">{trip.busType}</Badge>
            {trip.vehicle && (
              <>
                <span className="mx-1">•</span>
                <Bus className="h-3.5 w-3.5" />
                {trip.vehicle.sideNumber}
              </>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTripDetails}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Seat Map (Full Width on Mobile, 2/3 on Desktop) */}
        <div className="xl:col-span-2 space-y-4">
          {/* Capacity Status */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 font-medium">
                  <Users className="h-4 w-4 text-teal-600" />
                  Seat Capacity
                </span>
                <span className="text-lg">
                  <span className="font-bold text-red-600">{soldCount} sold</span>
                  <span className="text-muted-foreground mx-2">•</span>
                  <span className="font-bold text-green-600">{trip.availableSlots} available</span>
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    fillPercentage >= 90
                      ? "bg-red-500"
                      : fillPercentage >= 70
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${fillPercentage}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Seat Map - Portrait for Full View */}
          <SeatMap
            tripId={tripId}
            passengerCount={ticketCount}
            onSeatsSelected={handleSeatsSelected}
            orientation="portrait"
            busType={trip.busType as "MINI" | "STANDARD" | "LUXURY"}
            refreshTrigger={seatRefreshTrigger}
            pollingInterval={5000} // 5-second polling for real-time updates
          />
        </div>

        {/* Right Column - Sell Panel */}
        <div className="space-y-4">
          {/* Quick Sell Card */}
          <Card className="border-2 border-teal-500 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Sell Tickets
              </CardTitle>
              <CardDescription className="text-teal-100">
                {formatCurrency(trip.price)} per ticket
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Counter */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-full text-xl"
                  onClick={() => setTicketCount((c) => Math.max(1, c - 1))}
                  disabled={ticketCount <= 1 || selling}
                >
                  <Minus className="h-6 w-6" />
                </Button>

                <div className="text-center min-w-[80px]">
                  <div className="text-5xl font-bold text-teal-600">{ticketCount}</div>
                  <div className="text-sm text-muted-foreground">
                    {ticketCount === 1 ? "ticket" : "tickets"}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-full text-xl"
                  onClick={() => setTicketCount((c) => Math.min(maxTickets, c + 1))}
                  disabled={ticketCount >= maxTickets || selling}
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </div>

              {/* Selected Seats Display */}
              {selectedSeats.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Selected Seats ({selectedSeats.length}/{ticketCount}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedSeats.sort((a, b) => a - b).map((seat) => (
                      <Badge key={seat} className="bg-blue-500 text-white">
                        {seat}
                      </Badge>
                    ))}
                  </div>
                  {selectedSeats.length !== ticketCount && (
                    <p className="text-xs text-blue-600 mt-2">
                      {selectedSeats.length < ticketCount
                        ? `Select ${ticketCount - selectedSeats.length} more seat${ticketCount - selectedSeats.length > 1 ? "s" : ""}`
                        : `Remove ${selectedSeats.length - ticketCount} seat${selectedSeats.length - ticketCount > 1 ? "s" : ""}`}
                    </p>
                  )}
                </div>
              )}

              {/* Price Summary */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {formatCurrency(trip.price)} × {ticketCount}
                  </span>
                  <span>{formatCurrency(trip.price * ticketCount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span className="text-teal-600">{formatCurrency(trip.price * ticketCount)}</span>
                </div>
              </div>

              {/* Sell Button */}
              <Button
                className="w-full h-14 text-lg bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
                onClick={handleSellTickets}
                disabled={selling || trip.availableSlots === 0}
              >
                {selling ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Ticket className="mr-2 h-5 w-5" />
                    Sell {ticketCount} {ticketCount === 1 ? "Ticket" : "Tickets"}
                  </>
                )}
              </Button>

              {/* Last Sale Result */}
              {lastSaleResult && (
                <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg animate-pulse">
                  <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                    <Check className="h-5 w-5" />
                    Sale Complete!
                  </div>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Seats:</strong>{" "}
                      <span className="text-lg font-bold text-green-800">
                        {lastSaleResult.seatNumbers.join(", ")}
                      </span>
                    </p>
                    <p>
                      <strong>Amount:</strong> {formatCurrency(lastSaleResult.amount)}
                    </p>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    Write these seat numbers on the paper ticket
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Sales */}
          {recentSales.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Recent Sales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentSales.slice(0, 5).map((sale, index) => (
                  <div
                    key={sale.id || index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                  >
                    <div>
                      <span className="font-medium">
                        Seats: {sale.seatNumbers.join(", ")}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(sale.time).toLocaleTimeString("en-ET", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <span className="font-medium text-teal-600">
                      {formatCurrency(sale.amount)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Trip Chat - Communicate with team */}
          <TripChat
            tripId={tripId}
            tripRoute={`${trip.origin} → ${trip.destination}`}
            defaultExpanded={false}
          />
        </div>
      </div>
    </div>
  )
}

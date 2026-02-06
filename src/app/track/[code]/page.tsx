"use client"

import "leaflet/dist/leaflet.css"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Ticket,
  Bus,
  MapPin,
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatDate } from "@/lib/utils"
import dynamic from "next/dynamic"

const PassengerTrackingView = dynamic(
  () => import("@/components/tracking/PassengerTrackingView"),
  { ssr: false }
)

interface Passenger {
  id: string
  name: string
  seatNumber: string
  phone: string
}

interface Trip {
  id: string
  origin: string
  destination: string
  departureTime: string
  busType: string
  status: string
  trackingActive: boolean
  company: {
    name: string
  }
}

interface Booking {
  id: string
  status: string
  totalAmount: number  // Final amount passenger paid (ticket + commission + VAT)
  commission: number   // Base commission (5%)
  commissionVAT: number  // VAT on commission (15% of commission)
  createdAt: string
  passengers: Passenger[]
  trip: Trip
}

export default function TrackBookingPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (code) {
      fetchBooking()
    }
  }, [code])

  const fetchBooking = async () => {
    setIsLoading(true)
    setError("")

    try {
      // Validate code format before making API call
      const trimmedCode = code.trim()

      // Simple validation: 6-character ticket codes or longer booking IDs
      if (trimmedCode.length < 6) {
        setError("Ticket code must be at least 6 characters")
        setIsLoading(false)
        return
      }

      // Try to fetch booking by ID or ticket code
      const response = await fetch(`/api/track/${encodeURIComponent(trimmedCode)}`)
      const data = await response.json()

      if (response.ok) {
        setBooking(data.booking)
      } else {
        setError(data.error || "Booking not found")
      }
    } catch (err) {
      setError("Failed to fetch booking details")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-muted/30">
        <Card className="max-w-md p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Searching for your booking...</p>
        </Card>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-muted/30 py-8 px-4">
        <Card className="max-w-md w-full p-6 text-center">
          <XCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Booking Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error || "We couldn't find a booking with that ID or ticket code."}
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Please check:
            </p>
            <ul className="text-sm text-left space-y-1 max-w-xs mx-auto">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Booking ID is correct (check your confirmation SMS)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Ticket code is entered correctly (6 characters)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Booking exists and payment was completed</span>
              </li>
            </ul>
          </div>
          <Separator className="my-6" />
          <Button variant="outline" className="w-full" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </Card>
      </div>
    )
  }

  // totalAmount in DB = ticket + commission + VAT (ALREADY the final amount!)
  const commission = Number(booking.commission)
  const commissionVAT = Number(booking.commissionVAT) || (commission * 0.15) // fallback
  const totalPaid = Number(booking.totalAmount)  // This IS the final amount - don't add again!
  const ticketPrice = totalPaid - commission - commissionVAT  // What company received
  const isPaid = booking.status === "PAID"

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to home
        </Link>

        {/* Status Header */}
        <Card className="mb-6">
          <CardHeader className="text-center pb-4">
            {isPaid ? (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
                <CardDescription className="text-base">
                  Your tickets are ready. Show this at the bus terminal.
                </CardDescription>
              </>
            ) : (
              <>
                <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <CardTitle className="text-2xl">Payment Pending</CardTitle>
                <CardDescription className="text-base">
                  Complete payment to confirm your booking
                </CardDescription>
              </>
            )}
            <Badge variant={isPaid ? "default" : "secondary"} className="mt-2">
              Status: {booking.status}
            </Badge>
          </CardHeader>
        </Card>

        {/* Trip Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-primary" />
              Trip Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Company</p>
                <p className="font-medium">{booking.trip.company.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Bus Type</p>
                <p className="font-medium">{booking.trip.busType.toUpperCase()}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">From</p>
                <p className="text-xl font-bold">{booking.trip.origin}</p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="h-0.5 w-full bg-gradient-to-r from-primary to-accent max-w-[100px]" />
                <Bus className="h-5 w-5 mx-2 text-primary" />
                <div className="h-0.5 w-full bg-gradient-to-r from-accent to-primary max-w-[100px]" />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">To</p>
                <p className="text-xl font-bold">{booking.trip.destination}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Departure</p>
                  <p className="font-medium">{formatDate(booking.trip.departureTime)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Time</p>
                  <p className="font-medium">
                    {new Date(booking.trip.departureTime).toLocaleTimeString("en-ET", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Bus Tracking (only when trip is DEPARTED) */}
        {booking.trip.status === "DEPARTED" && (
          <div className="mb-6">
            <PassengerTrackingView tripId={booking.trip.id} />
          </div>
        )}

        {/* Passengers */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Passengers ({booking.passengers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {booking.passengers.map((passenger, index) => (
                <div
                  key={passenger.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{passenger.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{passenger.phone}</p>
                  </div>
                  <Badge variant="outline">Seat {passenger.seatNumber}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">
                Ticket Price ({booking.passengers.length} passenger{booking.passengers.length > 1 ? "s" : ""})
              </span>
              <span>{formatCurrency(ticketPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">i-Ticket Service Charge (5%)</span>
              <span>{formatCurrency(commission)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">VAT on Service Charge (15%)</span>
              <span>{formatCurrency(commissionVAT)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total Paid</span>
              <span className="text-primary">{formatCurrency(totalPaid)}</span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300">
              Booked on {new Date(booking.createdAt).toLocaleDateString("en-ET", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {isPaid && (
          <div className="flex gap-3">
            <Button className="w-full flex-1" size="lg" asChild>
              <Link href={`/tickets/${booking.id}`}>
                <Download className="h-4 w-4 mr-2" />
                View Tickets
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full flex-1" asChild>
              <Link href="/search">
                Book Another Trip
              </Link>
            </Button>
          </div>
        )}

        {!isPaid && (
          <Button className="w-full" size="lg" asChild>
            <Link href={`/payment/${booking.id}`}>
              Complete Payment
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}

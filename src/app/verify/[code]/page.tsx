"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Bus, Calendar, Clock, MapPin, User, Check, X, AlertCircle, Loader2, Armchair } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

export default function VerifyTicketPage() {
  const params = useParams()
  const code = params.code as string

  const [ticket, setTicket] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    verifyTicket()
  }, [code])

  const verifyTicket = async () => {
    try {
      const response = await fetch("/api/tickets/verify/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.toUpperCase() }),
      })

      const data = await response.json()

      if (data.valid) {
        setIsValid(true)
        setTicket(data.ticket)
      } else {
        setIsValid(false)
        setError(data.error || "Invalid ticket")
        setTicket(data.ticket || null)
      }
    } catch (err) {
      setIsValid(false)
      setError("Failed to verify ticket. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Verifying Ticket...</p>
        </Card>
      </div>
    )
  }

  // Invalid Ticket
  if (!isValid || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <X className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-red-600 mb-2">Invalid Ticket</h1>
            <p className="text-lg text-gray-700 mb-6">{error}</p>
            <div className="p-4 bg-red-100 rounded-lg">
              <p className="text-sm text-red-800 font-medium">DO NOT BOARD</p>
              <p className="text-xs text-red-700 mt-1">
                Contact passenger to verify payment status
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Valid Ticket - Beautiful Display
  return (
    <div className="min-h-screen bg-green-50 p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Success Header */}
        <div className="mb-6 text-center">
          <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-green-600 mb-2">Valid Ticket ✓</h1>
          <p className="text-lg text-gray-700">Passenger authorized to board</p>
        </div>

        {/* Ticket Information Card */}
        <Card className="overflow-hidden shadow-lg mb-6">
          {/* Header with Company */}
          <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Bus className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">{ticket.trip.company}</h2>
                  <p className="text-white/80 text-sm sm:text-base">{ticket.trip.busType} Bus</p>
                </div>
              </div>
              <Badge className="bg-white text-primary text-sm sm:text-lg px-3 sm:px-4 py-1.5 sm:py-2 font-bold shadow-md">
                PAID
              </Badge>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Route Information - Big and Clear */}
            <div>
              <p className="text-sm text-muted-foreground mb-3 uppercase tracking-wide">Route</p>
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <MapPin className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{ticket.trip.origin}</p>
                  <p className="text-sm text-muted-foreground">Departure</p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-full border-t-2 border-dashed border-primary" />
                  <Bus className="h-8 w-8 text-primary mx-4" />
                  <div className="w-full border-t-2 border-dashed border-primary" />
                </div>
                <div className="text-center flex-1">
                  <MapPin className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{ticket.trip.destination}</p>
                  <p className="text-sm text-muted-foreground">Arrival</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Passenger Details - Large and Clear */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wide">Passenger</p>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                  <p className="text-xl sm:text-2xl font-bold break-words">{ticket.passengerName}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wide">Seat Number</p>
                <div className="flex items-center gap-3">
                  <Armchair className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                  <p className="text-2xl sm:text-4xl font-bold text-primary">{ticket.seatNumber || "N/A"}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Departure Details */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Date</p>
                    <p className="text-lg font-bold">
                      {new Date(ticket.trip.departureTime).toLocaleDateString("en-ET", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Time</p>
                    <p className="text-lg font-bold">
                      {new Date(ticket.trip.departureTime).toLocaleTimeString("en-ET", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Ticket Code - Very Prominent */}
            <div className="text-center p-6 bg-yellow-50 rounded-lg border-2 border-yellow-200">
              <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">Ticket Code</p>
              <code className="text-4xl font-mono font-bold tracking-widest text-primary block">
                {ticket.shortCode}
              </code>
              <p className="text-xs text-muted-foreground mt-2">Show this code to the conductor</p>
            </div>

            <Separator />

            {/* Booking Information */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Booking ID</p>
                <p className="font-mono font-medium">{ticket.booking.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Passengers</p>
                <p className="font-medium">{ticket.booking.passengerCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Booked By</p>
                <p className="font-medium">{ticket.booking.bookedBy}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Contact</p>
                <p className="font-medium">{ticket.booking.bookedByPhone}</p>
              </div>
            </div>

            <Separator />

            {/* Payment Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Payment Details</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-bold text-lg">{formatCurrency(ticket.booking.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions for Conductor */}
        <Card className="bg-primary text-white">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-3">Conductor Instructions:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>Ticket is VALID - Passenger may board</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>Verify passenger ID matches name: <strong>{ticket.passengerName}</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>Direct passenger to seat: <strong>{ticket.seatNumber}</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>Each ticket can only be scanned once</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Timestamp */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Verified at {new Date().toLocaleTimeString("en-ET")}
        </p>
      </div>
    </div>
  )
}

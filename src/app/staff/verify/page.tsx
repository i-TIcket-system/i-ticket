"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { QrCode, Keyboard, Check, X, AlertCircle, Loader2, ArrowLeft, RotateCcw } from "lucide-react"
import { toast } from "sonner"

type VerificationResult = {
  success: boolean
  data?: {
    ticket: {
      id: string
      code: string
      shortCode: string
      status: string
      seatNumber: string
    }
    passenger: {
      name: string
      phone: string
      nationalId?: string | null
    }
    trip: {
      origin: string
      destination: string
      departureDate: string
      departureTime: string
    }
    booking: {
      totalPassengers: number
      bookingReference: string
    }
  }
  error?: string
}

export default function VerifyTicketPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'manual'>('manual') // Start with manual mode (QR scanner requires additional library)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)

  const verifyTicket = async (ticketCode: string) => {
    if (!ticketCode || ticketCode.trim().length === 0) {
      toast.error("Please enter a ticket code")
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/tickets/verify/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: ticketCode.trim().toUpperCase() })
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, data })
        toast.success("Ticket verified successfully!")
      } else {
        setResult({ success: false, error: data.error || "Ticket verification failed" })
        toast.error(data.error || "Ticket verification failed")
      }
    } catch (error) {
      setResult({ success: false, error: "Network error. Please try again." })
      toast.error("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    verifyTicket(code)
  }

  const handleReset = () => {
    setCode('')
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Verify Ticket</h1>
            <p className="text-sm text-gray-600">Scan or enter ticket code to verify</p>
          </div>
        </div>

        {/* No result yet - show input form */}
        {!result && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Enter Ticket Code
              </CardTitle>
              <CardDescription>
                Enter the 6-character ticket code (e.g., ABC123)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="ABC123"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="text-2xl text-center tracking-widest font-mono uppercase"
                    autoFocus
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 text-center">
                    Enter the 6-character shortcode from the ticket
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading || code.length !== 6}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <QrCode className="mr-2 h-5 w-5" />
                      Verify Ticket
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Success Result */}
        {result?.success && result.data && (
          <Card className="border-2 border-green-500 bg-green-50">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="bg-green-500 rounded-full p-6">
                  <Check className="h-16 w-16 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl text-green-700">
                Valid Ticket
              </CardTitle>
              <CardDescription className="text-green-600">
                Passenger can board
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ticket Info */}
              <div className="bg-white rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Ticket Code</span>
                  <Badge variant="outline" className="font-mono text-lg">
                    {result.data.ticket.shortCode}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Seat Number</span>
                  <Badge className="bg-blue-600 text-white text-lg">
                    {result.data.ticket.seatNumber}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Status</span>
                  <Badge className="bg-green-600 text-white">
                    {result.data.ticket.status}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Passenger Info */}
              <div className="bg-white rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-gray-900 mb-2">Passenger Details</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Name</span>
                    <span className="text-sm font-medium">{result.data.passenger.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Phone</span>
                    <span className="text-sm font-medium">{result.data.passenger.phone}</span>
                  </div>
                  {result.data.passenger.nationalId && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">National ID</span>
                      <span className="text-sm font-medium">{result.data.passenger.nationalId}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Trip Info */}
              <div className="bg-white rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-gray-900 mb-2">Trip Details</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Route</span>
                    <span className="text-sm font-medium">
                      {result.data.trip.origin} → {result.data.trip.destination}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Date</span>
                    <span className="text-sm font-medium">
                      {new Date(result.data.trip.departureDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Departure Time</span>
                    <span className="text-sm font-medium">{result.data.trip.departureTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Booking Reference</span>
                    <span className="text-sm font-medium font-mono">{result.data.booking.bookingReference}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleReset}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Scan Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Result */}
        {result?.success === false && (
          <Card className="border-2 border-red-500 bg-red-50">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="bg-red-500 rounded-full p-6">
                  <X className="h-16 w-16 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl text-red-700">
                Invalid Ticket
              </CardTitle>
              <CardDescription className="text-red-600">
                {result.error || "This ticket cannot be verified"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">Possible Reasons:</p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>Ticket code is incorrect</li>
                      <li>Ticket has already been used</li>
                      <li>Ticket has been cancelled</li>
                      <li>Ticket does not exist</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleReset}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        {!result && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900">How to verify tickets</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Ask passenger for their ticket code (6 characters)</li>
                    <li>• Enter the code above and click Verify</li>
                    <li>• Green screen = Valid ticket, passenger can board</li>
                    <li>• Red screen = Invalid ticket, passenger cannot board</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

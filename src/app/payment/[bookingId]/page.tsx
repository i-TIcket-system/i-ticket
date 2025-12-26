"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  CreditCard,
  Smartphone,
  Loader2,
  AlertCircle,
  Check,
  ArrowLeft,
  Clock,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Booking {
  id: string
  totalAmount: number
  commission: number
  status: string
  trip: {
    id: string
    origin: string
    destination: string
    departureTime: string
    company: { name: string }
  }
  passengers: { name: string }[]
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const bookingId = params.bookingId as string

  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "processing" | "success" | "failed">("pending")

  useEffect(() => {
    fetchBooking()
  }, [bookingId])

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`)
      const data = await response.json()

      if (response.ok) {
        setBooking(data.booking)
        if (data.booking.status === "PAID") {
          router.push(`/tickets/${bookingId}`)
        }
      } else {
        toast.error(data.error || "Booking not found")
      }
    } catch (err) {
      toast.error("Failed to load booking details")
    } finally {
      setIsLoading(false)
    }
  }

  const processPayment = async () => {
    setIsProcessing(true)
    setPaymentStatus("processing")

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          method: process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? "DEMO" : "TELEBIRR",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setPaymentStatus("success")
        toast.success("Payment successful! Generating your tickets...")
        // Wait a moment then redirect to tickets
        setTimeout(() => {
          router.push(`/tickets/${bookingId}`)
        }, 2000)
      } else {
        setPaymentStatus("failed")
        toast.error(data.error || "Payment failed")
      }
    } catch (err) {
      setPaymentStatus("failed")
      toast.error("An unexpected error occurred")
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Card className="max-w-md p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Booking Not Found</h2>
          <p className="text-muted-foreground mb-4">The booking you're looking for doesn't exist or has been cancelled.</p>
          <Link href="/search">
            <Button variant="outline">Back to Search</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const total = Number(booking.totalAmount) + Number(booking.commission)

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link
          href={`/booking/${booking.trip.id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to booking
        </Link>

        {/* Payment Status */}
        {paymentStatus === "success" ? (
          <Card className="text-center p-8">
            <div className="h-16 w-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground mb-4">
              Your tickets have been generated. Redirecting...
            </p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          </Card>
        ) : (
          <>
            {/* Booking Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
                <CardDescription>
                  {booking.trip.origin} to {booking.trip.destination}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bus Company</span>
                  <span className="font-medium">{booking.trip.company.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Departure</span>
                  <span className="font-medium">{formatDate(booking.trip.departureTime)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Passengers</span>
                  <span className="font-medium">{booking.passengers.length}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ticket Price</span>
                  <span>{formatCurrency(Number(booking.totalAmount))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service Fee (5%)</span>
                  <span>{formatCurrency(Number(booking.commission))}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
                <CardDescription>
                  Complete your payment to receive your tickets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* TeleBirr Option */}
                <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center">
                      <Smartphone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">TeleBirr</h3>
                      <p className="text-sm text-muted-foreground">
                        Pay with your mobile wallet
                      </p>
                    </div>
                  </div>

                  {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
                    <div className="mb-4 p-2 rounded bg-yellow-100 text-yellow-800 text-xs">
                      Demo Mode: Payment will be simulated
                    </div>
                  )}

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={processPayment}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        Pay {formatCurrency(total)}
                      </>
                    )}
                  </Button>
                </div>

                {/* Security Notice */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Secure Payment</p>
                    <p className="text-muted-foreground">
                      Your payment information is encrypted and secure. We never store your payment details.
                    </p>
                  </div>
                </div>

                {/* Timer Notice */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Booking held for 15 minutes. Complete payment to confirm your seats.
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

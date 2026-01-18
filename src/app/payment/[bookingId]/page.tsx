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
import { TripCountdown } from "@/components/ui/trip-countdown"
import { SuccessAnimation } from "@/components/animations/SuccessAnimation"
import { paymentSuccessConfetti } from "@/lib/confetti"
import { PaymentPageSkeleton } from "@/components/skeletons/TripCardSkeleton"

interface Booking {
  id: string
  totalAmount: number  // Final amount passenger pays (ticket + commission + VAT)
  commission: number   // Base commission (5%)
  commissionVAT: number  // VAT on commission (15% of commission)
  status: string
  trip: {
    id: string
    origin: string
    destination: string
    departureTime: string
    price: number  // Base ticket price per passenger
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

        // Trigger confetti animation
        paymentSuccessConfetti()

        // Clean up sessionStorage (remove saved passenger data for this trip)
        if (booking?.trip?.id) {
          sessionStorage.removeItem(`booking-${booking.trip.id}-passengers`)
        }

        // Wait a moment then redirect to tickets
        setTimeout(() => {
          router.push(`/tickets/${bookingId}`)
        }, 3000) // Increased to 3s to show animation
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
    return <PaymentPageSkeleton />
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

  // Calculate display values
  // totalAmount in DB = ticket price + commission + VAT (ALREADY the final amount!)
  const commission = Number(booking.commission)
  const commissionVAT = Number(booking.commissionVAT) || (commission * 0.15) // fallback calculation
  const total = Number(booking.totalAmount)  // This IS the final amount - don't add anything!
  const ticketPrice = total - commission - commissionVAT  // What company receives

  return (
    <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden">
      {/* GLASSMORPHISM TRANSFORMATION - Immersive Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-teal-pale/40 via-background to-teal-pale/30 -z-10" />
      <div className="fixed inset-0 bg-pattern-lalibela-glass opacity-10 -z-10" />
      {/* Animated gradient orbs */}
      <div className="fixed top-20 left-1/4 w-96 h-96 bg-gradient-radial from-teal-light/25 to-transparent rounded-full blur-3xl animate-float -z-10" />
      <div className="fixed bottom-20 right-1/4 w-80 h-80 bg-gradient-radial from-teal-medium/20 to-transparent rounded-full blur-3xl animate-float -z-10" style={{ animationDelay: '2s' }} />

      <div className="container mx-auto px-4 max-w-2xl py-8">
        <Link
          href={`/booking/${booking.trip.id}`}
          className="inline-flex items-center text-sm glass-subtle rounded-full px-4 py-2 mb-8 border border-white/20 hover:glass-moderate transition-all duration-300 group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
          Back to booking
        </Link>

        {/* Payment Status */}
        {paymentStatus === "success" ? (
          <Card className="glass-dramatic border-white/10 shadow-glass-lg overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-green-400 to-teal-400 shadow-lg" />
            <SuccessAnimation
              variant="payment"
              message="Payment Successful!"
              submessage="Your tickets have been generated. Redirecting to your tickets..."
              showConfetti={false} // Confetti already triggered above
            />
          </Card>
        ) : (
          <>
            {/* Booking Summary - GLASS DRAMATIC */}
            <Card className="glass-dramatic border-white/10 shadow-glass-lg mb-6 overflow-hidden">
              {/* Teal accent line */}
              <div className="h-1 bg-gradient-to-r from-teal-medium to-teal-light shadow-lg shadow-primary/50" />

              <CardHeader>
                <CardTitle className="text-2xl font-display">Booking Summary</CardTitle>
                <CardDescription className="text-base flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span>{booking.trip.origin}</span>
                    <ArrowLeft className="h-4 w-4 rotate-180 text-primary flex-shrink-0" />
                    <span>{booking.trip.destination}</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="glass-subtle rounded-xl p-4 border border-white/20 space-y-3">
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
                </div>

                <Separator className="bg-white/10" />

                <div className="glass-subtle rounded-xl p-4 border border-white/20 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Ticket Price ({booking.passengers.length} passenger{booking.passengers.length > 1 ? "s" : ""})
                    </span>
                    <span>{formatCurrency(ticketPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">i-Ticket Commission (5%)</span>
                    <span>{formatCurrency(commission)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">VAT on Commission (15%)</span>
                    <span>{formatCurrency(commissionVAT)}</span>
                  </div>
                </div>

                <div className="glass-teal rounded-2xl p-5 border border-white/20 shadow-glass-md">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground font-medium text-lg">Total</span>
                    <div className="text-right">
                      <div className="text-3xl font-bold gradient-text-simien bg-gradient-to-r from-primary to-teal-light bg-clip-text">
                        {formatCurrency(total)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Countdown Timer */}
            <TripCountdown departureTime={booking.trip.departureTime} variant="default" />

            {/* Payment Method - GLASS DRAMATIC */}
            <Card className="glass-dramatic border-white/10 shadow-glass-lg overflow-hidden">
              {/* Teal accent line */}
              <div className="h-1 bg-gradient-to-r from-teal-medium to-teal-light shadow-lg shadow-primary/50" />

              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-display">
                  <div className="h-10 w-10 rounded-xl glass-teal flex items-center justify-center shadow-md">
                    <CreditCard className="h-5 w-5 text-primary flex-shrink-0" />
                  </div>
                  Payment Method
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Complete your payment to receive your tickets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* TeleBirr Option - Enhanced Glass */}
                <div className="glass-teal p-6 border-2 border-primary/30 rounded-2xl relative overflow-hidden group">
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

                  <div className="flex items-center gap-4 mb-4 relative z-10">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <Smartphone className="h-7 w-7 text-white flex-shrink-0" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">TeleBirr</h3>
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

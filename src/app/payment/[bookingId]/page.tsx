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
  Shield,
  Copy,
  CheckCircle2,
  QrCode as QrCodeIcon
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
  passengers: {
    name: string
    seatNumber: string | null
  }[]
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
  const [isMobile, setIsMobile] = useState(false)
  const [cbeTransactionId, setCbeTransactionId] = useState("")
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    fetchBooking()
    // Detect if user is on mobile
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
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

  const processPayment = async (method: "TELEBIRR" | "CBE" = "TELEBIRR") => {
    setIsProcessing(true)
    setPaymentStatus("processing")

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          method: process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? "DEMO" : method,
          ...(method === "CBE" && cbeTransactionId && { transactionId: cbeTransactionId }),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setPaymentStatus("success")
        toast.success("Payment successful! Generating your tickets...")

        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' })

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

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast.success("Copied to clipboard!")
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      toast.error("Failed to copy")
    }
  }

  // CBE Payment details
  const cbeAccountNumber = "1000567890123456" // i-Ticket CBE account
  const paymentReference = `PAY-${bookingId.slice(-8).toUpperCase()}`

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
          <Button variant="outline" asChild>
            <Link href="/search">Back to Search</Link>
          </Button>
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
      {/* GLASSMORPHISM TRANSFORMATION - Homepage-style background (half intensity) */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0e9494]/25 via-[#0d7a7a]/20 to-[#0d4f5c]/15 -z-10" />
      <div className="fixed inset-0 bg-pattern-tilahun-glass opacity-8 -z-10" />
      {/* Animated gradient orbs */}
      <div className="fixed top-20 left-1/4 w-96 h-96 bg-gradient-radial from-[#20c4c4]/10 to-transparent rounded-full blur-3xl animate-float -z-10" />
      <div className="fixed bottom-20 right-1/4 w-80 h-80 bg-gradient-radial from-[#0e9494]/8 to-transparent rounded-full blur-3xl animate-float -z-10" style={{ animationDelay: '2s' }} />

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
                <div className="glass-subtle rounded-xl p-4 border border-white/30 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-800 dark:text-gray-100 font-medium">Bus Company</span>
                  <span className="font-bold">{booking.trip.company.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-800 dark:text-gray-100 font-medium">Departure</span>
                  <span className="font-bold">{formatDate(booking.trip.departureTime)}</span>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-800 dark:text-gray-100 font-medium">Passengers</span>
                    <span className="font-bold">{booking.passengers.length} passenger{booking.passengers.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="space-y-1.5 ml-4">
                    {booking.passengers.map((passenger, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="text-gray-800 dark:text-gray-100">{passenger.name}</span>
                        <span className="font-mono font-bold text-[#0a3f4a] dark:text-primary">
                          {passenger.seatNumber ? `Seat ${passenger.seatNumber}` : "Auto-assign"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="glass-subtle rounded-xl p-4 border border-white/30 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-800 dark:text-gray-100 font-medium">
                      Ticket Price ({booking.passengers.length} passenger{booking.passengers.length > 1 ? "s" : ""})
                    </span>
                    <span className="font-semibold">{formatCurrency(ticketPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-800 dark:text-gray-100 font-medium">i-Ticket Service Charge (5%)</span>
                    <span className="font-semibold">{formatCurrency(commission)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-800 dark:text-gray-100 font-medium">VAT on Service Charge (15%)</span>
                    <span className="font-semibold">{formatCurrency(commissionVAT)}</span>
                  </div>
                </div>

                <div className="glass-subtle rounded-2xl p-5 border border-white/40 shadow-glass-md bg-gradient-to-r from-primary/5 to-primary/10">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground font-extrabold text-lg">Total</span>
                    <div className="text-right">
                      <div className="text-3xl font-extrabold text-[#0a3f4a] dark:text-primary drop-shadow-lg">
                        {formatCurrency(total)}
                      </div>
                      <div className="text-xs text-gray-800 dark:text-gray-100 font-bold">incl. taxes & fees</div>
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
              <CardContent className="space-y-4">
                {/* TeleBirr Option - Enhanced Glass */}
                <div className="glass-teal p-6 border-2 border-primary/30 rounded-2xl relative overflow-hidden group">
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

                  <div className="flex items-center gap-4 mb-4 relative z-10">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <Smartphone className="h-7 w-7 text-white flex-shrink-0" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">TeleBirr</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-200">
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
                    onClick={() => processPayment("TELEBIRR")}
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

                {/* CBE Birr Option - Hybrid Approach */}
                <div className="glass-subtle p-6 border border-white/20 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-700 flex items-center justify-center shadow-xl">
                      <CreditCard className="h-7 w-7 text-white flex-shrink-0" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">CBE Birr</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-200">
                        Pay with Commercial Bank of Ethiopia
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Desktop: Show QR Code */}
                    {!isMobile && (
                      <div className="flex flex-col items-center gap-3 p-4 glass-teal rounded-xl">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <QrCodeIcon className="h-4 w-4" />
                          Scan with CBE Birr App
                        </div>
                        <div className="bg-white p-4 rounded-xl">
                          {/* QR Code placeholder - will be replaced with actual QR */}
                          <div className="h-48 w-48 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                            <div className="text-center text-gray-500 text-xs">
                              <QrCodeIcon className="h-12 w-12 mx-auto mb-2" />
                              QR Code
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          Scan this code with your phone's CBE Birr app
                        </p>
                      </div>
                    )}

                    {/* Mobile OR Desktop Fallback: Show Account Details */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium">{isMobile ? "Payment Details:" : "Or enter manually:"}</p>

                      {/* Account Number */}
                      <div className="glass-subtle rounded-xl p-3 border border-white/20">
                        <label className="text-xs text-gray-700 dark:text-gray-200 font-medium block mb-1">i-Ticket Account</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 font-mono text-sm font-semibold">
                            {cbeAccountNumber}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => copyToClipboard(cbeAccountNumber, "account")}
                          >
                            {copiedField === "account" ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Reference Code */}
                      <div className="glass-subtle rounded-xl p-3 border border-white/20">
                        <label className="text-xs text-gray-700 dark:text-gray-200 font-medium block mb-1">Reference Code</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 font-mono text-sm font-semibold text-primary">
                            {paymentReference}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => copyToClipboard(paymentReference, "reference")}
                          >
                            {copiedField === "reference" ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="glass-subtle rounded-xl p-3 border border-white/20">
                        <label className="text-xs text-gray-700 dark:text-gray-200 font-medium block mb-1">Amount</label>
                        <div className="font-bold text-lg text-primary">
                          {formatCurrency(total)}
                        </div>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                      <p className="font-semibold mb-2">Steps to pay:</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Open your CBE Birr app</li>
                        <li>Select "Send Money" or "Pay Bill"</li>
                        <li>{isMobile ? "Copy & paste" : "Scan QR or enter"} the account number</li>
                        <li>Enter the reference code above</li>
                        <li>Confirm the amount: {formatCurrency(total)}</li>
                        <li>Complete payment & enter transaction ID below</li>
                      </ol>
                    </div>

                    {/* Transaction ID Verification */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">CBE Transaction ID</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter transaction ID from CBE"
                          className="flex-1 px-3 py-2 rounded-lg border border-white/20 bg-background/50 text-sm"
                          value={cbeTransactionId}
                          onChange={(e) => setCbeTransactionId(e.target.value)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        After completing payment in CBE Birr, enter the transaction ID you received
                      </p>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => processPayment("CBE")}
                      disabled={!cbeTransactionId || isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying Payment...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Verify Payment
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Secure Payment</p>
                    <p className="text-gray-700 dark:text-gray-200">
                      Your payment information is encrypted and secure. We never store your payment details.
                    </p>
                  </div>
                </div>

                {/* Timer Notice */}
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                  <Clock className="h-4 w-4" />
                  Booking held for 10 minutes. Complete payment to confirm your seats.
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

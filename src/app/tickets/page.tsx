"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Bus,
  Calendar,
  Ticket,
  Loader2,
  ArrowRight,
  Clock,
  MapPin,
  QrCode
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDate, formatDuration, formatCurrency, hasDepartedEthiopia } from "@/lib/utils"

interface BookingWithTrip {
  id: string
  status: string
  totalAmount: number
  createdAt: string
  trip: {
    origin: string
    destination: string
    departureTime: string
    estimatedDuration: number
    company: { name: string }
  }
  passengers: { name: string }[]
  tickets: { id: string; shortCode: string }[]
}

export default function MyTicketsPage() {
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()
  const [bookings, setBookings] = useState<BookingWithTrip[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      // Redirect guests to homepage
      router.push("/")
    } else if (authStatus === "authenticated") {
      fetchBookings()
    }
  }, [authStatus, router])

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/bookings")
      const data = await response.json()

      if (response.ok) {
        setBookings(data.bookings)
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (authStatus === "loading" || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">View Your Tickets</h2>
          <p className="text-muted-foreground mb-4">
            Sign in to view your booked tickets and travel history.
          </p>
          <Button asChild>
            <Link href="/login?callbackUrl=/tickets">Sign In</Link>
          </Button>
        </Card>
      </div>
    )
  }

  // Helper to check if payment has expired (10 minutes)
  const isPaymentExpired = (booking: BookingWithTrip) => {
    if (booking.status !== "PENDING") return false
    const createdAt = new Date(booking.createdAt)
    const now = new Date()
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60)
    return diffMinutes > 10
  }

  // FIX: Use Ethiopia timezone for upcoming/past trip filtering
  const upcomingBookings = bookings.filter(
    (b) => b.status === "PAID" && !hasDepartedEthiopia(b.trip.departureTime)
  )
  const pastBookings = bookings.filter(
    (b) => b.status === "PAID" && hasDepartedEthiopia(b.trip.departureTime)
  )
  const pendingBookings = bookings.filter((b) => b.status === "PENDING" && !isPaymentExpired(b))
  const expiredBookings = bookings.filter((b) => isPaymentExpired(b))

  const getStatusColor = (status: string, booking?: BookingWithTrip) => {
    // Check if payment expired for pending bookings
    if (booking && isPaymentExpired(booking)) {
      return "destructive"
    }

    switch (status) {
      case "PAID":
        return "success"
      case "PENDING":
        return "warning"
      case "CANCELLED":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusLabel = (status: string, booking: BookingWithTrip) => {
    if (isPaymentExpired(booking)) {
      return "PAYMENT EXPIRED"
    }
    return status
  }

  const BookingCard = ({ booking }: { booking: BookingWithTrip }) => (
    <Card className="glass-dramatic glass-lift border-white/10 shadow-glass-md hover:shadow-glass-lg transition-all duration-500 group overflow-hidden">
      {/* Status accent line */}
      <div className={`h-1 bg-gradient-to-r shadow-lg ${
        booking.status === 'PAID' ? 'from-green-400 to-teal-400 shadow-green-500/50' :
        booking.status === 'PENDING' && !isPaymentExpired(booking) ? 'from-amber-400 to-orange-400 shadow-amber-500/50' :
        'from-red-400 to-rose-400 shadow-red-500/50'
      }`} />

      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Company & Status - Glass Enhanced */}
          <div className="flex items-center gap-4 md:w-52">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center text-white font-bold text-xl shadow-xl relative z-10 group-hover:scale-110 transition-transform">
                {booking.trip.company.name.charAt(0)}
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-primary-700 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">{booking.trip.company.name}</h3>
              <Badge variant={getStatusColor(booking.status, booking) as any} className="mt-1 font-medium">
                {getStatusLabel(booking.status, booking)}
              </Badge>
            </div>
          </div>

          {/* Route - Enhanced */}
          <div className="flex-1">
            <div className="flex items-center gap-2 text-lg font-medium mb-2">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <span>{booking.trip.origin}</span>
              <ArrowRight className="h-4 w-4 flex-shrink-0" />
              <MapPin className="h-4 w-4 text-accent flex-shrink-0" />
              <span>{booking.trip.destination}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 glass-subtle rounded-lg px-2 py-1">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                {formatDate(booking.trip.departureTime)}
              </span>
              <span className="flex items-center gap-1.5 glass-subtle rounded-lg px-2 py-1">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                {formatDuration(booking.trip.estimatedDuration)}
              </span>
              <span className="glass-subtle rounded-lg px-2 py-1">{booking.passengers.length} passenger(s)</span>
            </div>
          </div>

          {/* Actions - Glass Enhanced */}
          <div className="flex flex-col items-end justify-center gap-3">
            {booking.status === "PAID" && booking.tickets.length > 0 ? (
              <Button className="glass-button shadow-md hover:shadow-lg" asChild>
                <Link href={`/tickets/${booking.id}`}>
                  <QrCode className="h-4 w-4 mr-2 flex-shrink-0" />
                  View Tickets
                </Link>
              </Button>
            ) : booking.status === "PENDING" && !isPaymentExpired(booking) ? (
              <Button className="glass-button shadow-md hover:shadow-lg" asChild>
                <Link href={`/payment/${booking.id}`}>
                  Complete Payment
                </Link>
              </Button>
            ) : isPaymentExpired(booking) ? (
              <Button variant="outline" className="glass-button shadow-md hover:shadow-lg" asChild>
                <Link href="/search">
                  Book Again
                </Link>
              </Button>
            ) : null}
            <div className="glass-teal rounded-lg px-3 py-1.5">
              <span className="text-sm font-semibold text-primary">
                {formatCurrency(Number(booking.totalAmount))}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden">
      {/* GLASSMORPHISM TRANSFORMATION - Background with homepage colors (half intensity) */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0e9494]/50 via-[#0d7a7a]/40 to-[#0d4f5c]/30 -z-10" />
      <div className="fixed inset-0 bg-pattern-tilahun-glass opacity-15 -z-10" />
      <div className="fixed top-20 right-20 w-96 h-96 bg-gradient-radial from-[#20c4c4]/15 to-transparent rounded-full blur-3xl animate-float -z-10" />
      <div className="fixed bottom-20 left-20 w-80 h-80 bg-gradient-radial from-[#0e9494]/10 to-transparent rounded-full blur-3xl animate-float -z-10" style={{ animationDelay: '2s' }} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-2xl glass-teal flex items-center justify-center shadow-lg">
              <Ticket className="h-6 w-6 text-primary flex-shrink-0" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground drop-shadow-sm">My Tickets</h1>
          </div>
          <p className="text-muted-foreground ml-[60px]">
            Manage your bookings and view ticket details
          </p>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="glass-moderate border border-white/20 shadow-glass-md">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastBookings.length})
            </TabsTrigger>
            {pendingBookings.length > 0 && (
              <TabsTrigger value="pending">
                Pending ({pendingBookings.length})
              </TabsTrigger>
            )}
            {expiredBookings.length > 0 && (
              <TabsTrigger value="expired">
                Expired ({expiredBookings.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBookings.length === 0 ? (
              <Card className="p-12 text-center">
                <Bus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Upcoming Trips</h3>
                <p className="text-muted-foreground mb-4">
                  You don&apos;t have any upcoming trips booked.
                </p>
                <Button asChild>
                  <Link href="/search">Book a Trip</Link>
                </Button>
              </Card>
            ) : (
              upcomingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastBookings.length === 0 ? (
              <Card className="p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Past Trips</h3>
                <p className="text-muted-foreground">
                  Your travel history will appear here after you complete a trip.
                </p>
              </Card>
            ) : (
              pastBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>

          {pendingBookings.length > 0 && (
            <TabsContent value="pending" className="space-y-4">
              {pendingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </TabsContent>
          )}

          {expiredBookings.length > 0 && (
            <TabsContent value="expired" className="space-y-4">
              {expiredBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}

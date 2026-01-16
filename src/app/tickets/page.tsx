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
import { formatDate, formatDuration, formatCurrency } from "@/lib/utils"

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
          <Link href="/login?callbackUrl=/tickets">
            <Button>Sign In</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const upcomingBookings = bookings.filter(
    (b) => b.status === "PAID" && new Date(b.trip.departureTime) > new Date()
  )
  const pastBookings = bookings.filter(
    (b) => b.status === "PAID" && new Date(b.trip.departureTime) <= new Date()
  )
  const pendingBookings = bookings.filter((b) => b.status === "PENDING")

  const getStatusColor = (status: string) => {
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

  const BookingCard = ({ booking }: { booking: BookingWithTrip }) => (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Company & Status */}
          <div className="flex items-center gap-4 md:w-48">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              {booking.trip.company.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold">{booking.trip.company.name}</h3>
              <Badge variant={getStatusColor(booking.status) as any}>
                {booking.status}
              </Badge>
            </div>
          </div>

          {/* Route */}
          <div className="flex-1">
            <div className="flex items-center gap-2 text-lg font-medium mb-2">
              <MapPin className="h-4 w-4 text-primary" />
              {booking.trip.origin}
              <ArrowRight className="h-4 w-4" />
              <MapPin className="h-4 w-4 text-accent" />
              {booking.trip.destination}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(booking.trip.departureTime)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDuration(booking.trip.estimatedDuration)}
              </span>
              <span>{booking.passengers.length} passenger(s)</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end justify-center gap-2">
            {booking.status === "PAID" && booking.tickets.length > 0 ? (
              <Link href={`/tickets/${booking.id}`}>
                <Button>
                  <QrCode className="h-4 w-4 mr-2" />
                  View Tickets
                </Button>
              </Link>
            ) : booking.status === "PENDING" ? (
              <Link href={`/payment/${booking.id}`}>
                <Button>
                  Complete Payment
                </Button>
              </Link>
            ) : null}
            <span className="text-sm text-muted-foreground">
              {formatCurrency(Number(booking.totalAmount))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Tickets</h1>
          <p className="text-muted-foreground">
            Manage your bookings and view ticket details
          </p>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList>
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
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBookings.length === 0 ? (
              <Card className="p-12 text-center">
                <Bus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Upcoming Trips</h3>
                <p className="text-muted-foreground mb-4">
                  You don&apos;t have any upcoming trips booked.
                </p>
                <Link href="/search">
                  <Button>Book a Trip</Button>
                </Link>
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
        </Tabs>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  Bus,
  MapPin,
  Clock,
  Users,
  Ticket,
  Loader2,
  AlertCircle,
  Calendar,
  ArrowRight,
  TrendingUp,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"

interface AssignedTrip {
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
}

interface TodayStats {
  totalSold: number
  totalRevenue: number
  tripsWorked: number
}

export default function CashierDashboard() {
  const { data: session } = useSession()
  const [trips, setTrips] = useState<AssignedTrip[]>([])
  const [stats, setStats] = useState<TodayStats>({ totalSold: 0, totalRevenue: 0, tripsWorked: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAssignedTrips()
  }, [])

  const fetchAssignedTrips = async () => {
    try {
      const response = await fetch("/api/cashier/my-trips")
      const data = await response.json()

      if (response.ok) {
        setTrips(data.trips)
        setStats(data.stats || { totalSold: 0, totalRevenue: 0, tripsWorked: 0 })
      } else {
        setError(data.error || "Failed to load trips")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-3" />
          <p className="text-muted-foreground">Loading your assigned trips...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Error Loading Trips</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchAssignedTrips}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeTrips = trips.filter(
    (t) => new Date(t.departureTime) >= new Date() && t.availableSlots > 0
  )
  const upcomingTrips = trips.filter(
    (t) => new Date(t.departureTime) > new Date()
  )

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {session?.user?.name?.split(" ")[0] || "Cashier"}!
          </h1>
          <p className="text-muted-foreground">
            {activeTrips.length > 0
              ? `You have ${activeTrips.length} active trip${activeTrips.length > 1 ? "s" : ""} to manage`
              : "No active trips assigned to you today"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString("en-ET", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm">Today's Sales</p>
                <p className="text-3xl font-bold">{stats.totalSold}</p>
                <p className="text-teal-200 text-xs">tickets sold</p>
              </div>
              <Ticket className="h-10 w-10 text-teal-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-emerald-200 text-xs">collected today</p>
              </div>
              <TrendingUp className="h-10 w-10 text-emerald-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Assigned Trips</p>
                <p className="text-3xl font-bold">{trips.length}</p>
                <p className="text-blue-200 text-xs">{upcomingTrips.length} upcoming</p>
              </div>
              <Bus className="h-10 w-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Trips */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bus className="h-5 w-5 text-teal-600" />
          Your Assigned Trips
        </h2>

        {trips.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bus className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Trips Assigned</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You don't have any trips assigned to you yet. Contact your company admin to get assigned to trips.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TripCard({ trip }: { trip: AssignedTrip }) {
  const departureDate = new Date(trip.departureTime)
  const isToday = departureDate.toDateString() === new Date().toDateString()
  const isPast = departureDate < new Date()
  const isSoldOut = trip.availableSlots === 0
  const soldCount = trip.totalSlots - trip.availableSlots
  const fillPercentage = Math.round((soldCount / trip.totalSlots) * 100)

  // Auto-expand today's active trips, collapse others by default
  const [expanded, setExpanded] = useState(isToday && !isPast)

  return (
    <Card
      className={`overflow-hidden transition-all hover:shadow-lg ${
        isPast ? "opacity-60" : ""
      } ${isToday && !isPast && !isSoldOut ? "ring-2 ring-teal-500" : ""}`}
    >
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Trip Header - Clickable to toggle */}
          <div
            className="flex-1 p-4 lg:p-6 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <MapPin className="h-4 w-4 text-teal-600" />
                  {trip.origin}
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  {trip.destination}
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(trip.departureTime)}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {trip.busType}
                  </Badge>
                  <span className="font-medium">
                    <span className="text-red-600">{soldCount} sold</span>
                    <span className="text-muted-foreground"> • </span>
                    <span className="text-green-600">{trip.availableSlots} left</span>
                  </span>
                </div>
                {/* Status Badges */}
                <div className="flex items-center gap-2 mt-2">
                  {isToday && !isPast && (
                    <Badge className="bg-teal-500">Today</Badge>
                  )}
                  {isPast && <Badge variant="secondary">Departed</Badge>}
                  {isSoldOut && <Badge variant="destructive">Sold Out</Badge>}
                  {!isPast && !isSoldOut && trip.availableSlots <= 5 && (
                    <Badge className="bg-orange-500">Only {trip.availableSlots} left!</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-right">
                  <p className="text-lg font-bold text-teal-600">
                    {formatCurrency(trip.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">per ticket</p>
                </div>
                {expanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            </div>
          </div>

          {/* Action Button - Always visible */}
          <div className="flex lg:flex-col items-center justify-center gap-3 p-4 lg:p-6 bg-gray-50 lg:w-48 border-t lg:border-t-0 lg:border-l">
            <Link href={`/cashier/trip/${trip.id}`} className="w-full">
              <Button
                className="w-full h-12 text-lg"
                disabled={isPast || isSoldOut}
              >
                <Ticket className="h-5 w-5 mr-2" />
                {isPast ? "View" : isSoldOut ? "Sold Out" : "Sell Tickets"}
              </Button>
            </Link>
            <p className="text-xs text-center text-muted-foreground">
              {trip.availableSlots} seats available
            </p>
          </div>
        </div>

        {/* Collapsible Details */}
        {expanded && (
          <div className="px-4 lg:px-6 pb-4 lg:pb-6 pt-2 border-t">
            {/* Capacity Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  Capacity Details
                </span>
                <span className="font-medium text-muted-foreground">
                  {fillPercentage}% full
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
            </div>

            {/* Vehicle Info */}
            {trip.vehicle && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bus className="h-4 w-4" />
                <span>
                  Vehicle: {trip.vehicle.plateNumber}
                  {trip.vehicle.sideNumber && ` • Side: ${trip.vehicle.sideNumber}`}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

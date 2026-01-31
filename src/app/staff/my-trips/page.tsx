"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { cn, isTodayEthiopia } from "@/lib/utils"
import {
  Loader2,
  Bus,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Car,
  UserCheck,
  Ticket,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate, formatDuration, BUS_TYPES } from "@/lib/utils"
import { TripChat } from "@/components/trip/TripChat"
import { TripLogCard } from "@/components/trip/TripLogCard"
import { TripStatusControl } from "@/components/trip/TripStatusControl"

interface Trip {
  id: string
  origin: string
  destination: string
  route: string | null
  departureTime: string
  estimatedDuration: number
  price: number
  busType: string
  totalSlots: number
  availableSlots: number
  status: string  // Trip status (SCHEDULED, BOARDING, DEPARTED, etc.)
  company: {
    name: string
  }
  driver?: {
    id: string
    name: string
    phone: string
  } | null
  conductor?: {
    id: string
    name: string
    phone: string
  } | null
  manualTicketer?: {
    id: string
    name: string
    phone: string
  } | null
  vehicle?: {
    id: string
    plateNumber: string
    sideNumber: string | null
    make: string | null
    model: string | null
    currentOdometer: number | null
  } | null
  bookings: Array<{
    id: string
    totalAmount: number
  }>
  _count: {
    bookings: number
  }
}

export default function MyTripsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  // Get tripId from URL query parameter (for auto-expanding specific trip from notification)
  const highlightTripId = searchParams?.get('tripId')

  useEffect(() => {
    if (status === "authenticated") {
      if (session.user.role !== "COMPANY_ADMIN" || !session.user.staffRole) {
        router.push("/")
        return
      }
      fetchMyTrips()
    }
  }, [status, session, router])

  const fetchMyTrips = async () => {
    try {
      const response = await fetch("/api/staff/my-trips")
      const data = await response.json()

      if (response.ok) {
        setTrips(data.trips)
      }
    } catch (error) {
      console.error("Failed to fetch trips:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your trips...</p>
        </div>
      </div>
    )
  }

  // Filter trips by time (using Ethiopia timezone for date comparisons)
  const now = new Date()
  const upcomingTrips = trips.filter(trip => new Date(trip.departureTime) > now)
  const pastTrips = trips.filter(trip => new Date(trip.departureTime) <= now)
  const todaysTrips = upcomingTrips.filter(trip =>
    isTodayEthiopia(trip.departureTime)
  )

  const getRoleIcon = () => {
    switch (session?.user?.staffRole) {
      case "DRIVER": return <Car className="h-6 w-6 text-blue-600" />
      case "CONDUCTOR": return <UserCheck className="h-6 w-6 text-green-600" />
      case "MANUAL_TICKETER": return <Ticket className="h-6 w-6 text-orange-600" />
      default: return <Bus className="h-6 w-6 text-primary" />
    }
  }

  const getRoleColor = () => {
    switch (session?.user?.staffRole) {
      case "DRIVER": return "from-blue-50 to-blue-100/70 border-blue-200"
      case "CONDUCTOR": return "from-green-50 to-green-100/70 border-green-200"
      case "MANUAL_TICKETER": return "from-orange-50 to-orange-100/70 border-orange-200"
      default: return "from-teal-50 to-teal-100/70 border-teal-200"
    }
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${getRoleColor()}`}>
            {getRoleIcon()}
          </div>
          <div>
            <h1 className="text-3xl font-bold">My Assigned Trips</h1>
            <p className="text-muted-foreground">
              Trips where you're assigned as{" "}
              {session?.user?.staffRole?.toLowerCase().replace("_", " ")}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className={`backdrop-blur-lg bg-gradient-to-br ${getRoleColor()} shadow-lg`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Trips</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todaysTrips.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Departing today
            </p>
          </CardContent>
        </Card>

        <Card className={`backdrop-blur-lg bg-gradient-to-br ${getRoleColor()} shadow-lg`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Trips</CardTitle>
            <Bus className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{upcomingTrips.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Future assignments
            </p>
          </CardContent>
        </Card>

        <Card className={`backdrop-blur-lg bg-gradient-to-br ${getRoleColor()} shadow-lg`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pastTrips.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Past trips
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Trips */}
      {todaysTrips.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Today's Trips
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {todaysTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                highlight={true}
                forceExpand={trip.id === highlightTripId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Trips */}
      {upcomingTrips.filter(t => !todaysTrips.includes(t)).length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Upcoming Trips</h2>
          <div className="grid grid-cols-1 gap-4">
            {upcomingTrips.filter(t => !todaysTrips.includes(t)).map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                forceExpand={trip.id === highlightTripId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Trips */}
      {pastTrips.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Completed Trips</h2>
          <div className="grid grid-cols-1 gap-4">
            {pastTrips.slice(0, 5).map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                past
                forceExpand={trip.id === highlightTripId}
              />
            ))}
          </div>
          {pastTrips.length > 5 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Showing 5 of {pastTrips.length} completed trips
            </p>
          )}
        </div>
      )}

      {/* Empty State */}
      {trips.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Bus className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No trips assigned yet</p>
            <p className="text-sm text-muted-foreground">
              Your company admin will assign you to trips as they're scheduled
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function TripCard({ trip, highlight = false, past = false, forceExpand = false }: { trip: Trip; highlight?: boolean; past?: boolean; forceExpand?: boolean }) {
  const bookingCount = trip._count.bookings
  const totalRevenue = trip.bookings.reduce((sum, b) => sum + b.totalAmount, 0)
  const occupancy = ((trip.totalSlots - trip.availableSlots) / trip.totalSlots) * 100
  const tripCardRef = useRef<HTMLDivElement>(null)

  // Auto-expand active trips (today's trips) or trips from notifications, collapse others by default
  const [expanded, setExpanded] = useState(highlight || forceExpand)

  // Trip status state - allows driver to update and UI to reflect changes
  const [tripStatus, setTripStatus] = useState(trip.status)

  // Auto-open odometer popup when trip departs
  const [autoOpenOdometer, setAutoOpenOdometer] = useState(false)

  // Auto-open end odometer popup when trip completes
  const [autoOpenEndOdometer, setAutoOpenEndOdometer] = useState(false)

  // Force expand when forceExpand prop changes (from notification)
  useEffect(() => {
    if (forceExpand) {
      setExpanded(true)
    }
  }, [forceExpand])

  // Scroll to and expand this trip if it's the highlighted one from notification
  useEffect(() => {
    if (forceExpand && expanded && tripCardRef.current) {
      // Scroll to this trip after a short delay to ensure rendering is complete
      setTimeout(() => {
        tripCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 500)
    }
  }, [forceExpand, expanded])

  return (
    <Card
      ref={tripCardRef}
      className={cn(
        "hover:shadow-lg transition-all",
        highlight && "border-orange-400 border-2 shadow-md",
        forceExpand && "ring-2 ring-primary ring-offset-2",
        past && "opacity-60"
      )}
    >
      <CardHeader
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {trip.origin} → {trip.destination}
              {highlight && (
                <Badge className="bg-orange-500 text-white">
                  Departing Today
                </Badge>
              )}
              {past && (
                <Badge variant="secondary">
                  Completed
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(trip.departureTime)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {trip.totalSlots - trip.availableSlots}/{trip.totalSlots} passengers
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge>
              {BUS_TYPES.find(b => b.value === trip.busType)?.label || trip.busType}
            </Badge>
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">

            {trip.route && (
              <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {trip.route}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  Departure
                </div>
                <p className="text-sm font-medium">{formatDate(trip.departureTime)}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  Duration
                </div>
                <p className="text-sm font-medium">{formatDuration(trip.estimatedDuration)}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  Passengers
                </div>
                <p className="text-sm font-medium">
                  {trip.totalSlots - trip.availableSlots} / {trip.totalSlots}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({occupancy.toFixed(0)}%)
                  </span>
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  Revenue
                </div>
                <p className="text-sm font-medium">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>

            {/* Crew & Vehicle Information */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Crew & Vehicle:</p>
              <div className="flex flex-wrap gap-2">
                {trip.driver && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-900 border-blue-300">
                    <Car className="h-3 w-3 mr-1" />
                    Driver: {trip.driver.name}
                  </Badge>
                )}
                {trip.conductor && (
                  <Badge variant="outline" className="bg-green-100 text-green-900 border-green-300">
                    <UserCheck className="h-3 w-3 mr-1" />
                    Conductor: {trip.conductor.name}
                  </Badge>
                )}
                {trip.manualTicketer && (
                  <Badge variant="outline" className="bg-orange-100 text-orange-900 border-orange-300">
                    <Ticket className="h-3 w-3 mr-1" />
                    Ticketer: {trip.manualTicketer.name}
                  </Badge>
                )}
                {trip.vehicle && (
                  <Badge variant="outline" className="bg-purple-100 text-purple-900 border-purple-300">
                    <Bus className="h-3 w-3 mr-1" />
                    {trip.vehicle.plateNumber}
                    {trip.vehicle.sideNumber && ` (${trip.vehicle.sideNumber})`}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <Badge className="mb-2">
              {BUS_TYPES.find(b => b.value === trip.busType)?.label || trip.busType}
            </Badge>
            <p className="text-lg font-bold text-primary">{formatCurrency(trip.price)}</p>
            <p className="text-xs text-muted-foreground">per seat</p>
          </div>
        </div>

        {/* Driver Controls - Update trip status (SCHEDULED → BOARDING → DEPARTED → COMPLETED) */}
        {!past && (
          <div className="mt-4 pt-4 border-t">
            <TripStatusControl
              tripId={trip.id}
              currentStatus={tripStatus}
              hasVehicle={!!trip.vehicle}
              onStatusChange={(newStatus) => setTripStatus(newStatus)}
              onDeparted={() => setAutoOpenOdometer(true)}
              onCompleted={() => setAutoOpenEndOdometer(true)}
            />
          </div>
        )}

        {/* Trip Log - Odometer & Fuel (visible for all, editable by driver/admin) */}
        {!past && trip.vehicle && (
          <div className="mt-4 pt-4 border-t">
            <TripLogCard
              tripId={trip.id}
              vehicleId={trip.vehicle.id}
              tripStatus={tripStatus}
              autoOpenStart={autoOpenOdometer}
              autoOpenEnd={autoOpenEndOdometer}
              onDialogClose={() => {
                setAutoOpenOdometer(false)
                setAutoOpenEndOdometer(false)
              }}
            />
          </div>
        )}

        {/* Trip Chat - Communicate with team */}
        {!past && (
          <div className="mt-4 pt-4 border-t">
            <TripChat
              tripId={trip.id}
              tripRoute={`${trip.origin} → ${trip.destination}`}
              defaultExpanded={highlight}
            />
          </div>
        )}
      </CardContent>
    )}
    </Card>
  )
}

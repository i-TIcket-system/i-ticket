"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
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
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate, formatDuration, BUS_TYPES } from "@/lib/utils"

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
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

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

  // Filter trips by time
  const now = new Date()
  const upcomingTrips = trips.filter(trip => new Date(trip.departureTime) > now)
  const pastTrips = trips.filter(trip => new Date(trip.departureTime) <= now)
  const todaysTrips = upcomingTrips.filter(trip => {
    const tripDate = new Date(trip.departureTime)
    return tripDate.toDateString() === now.toDateString()
  })

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
              <TripCard key={trip.id} trip={trip} highlight />
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
              <TripCard key={trip.id} trip={trip} />
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
              <TripCard key={trip.id} trip={trip} past />
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

function TripCard({ trip, highlight = false, past = false }: { trip: Trip; highlight?: boolean; past?: boolean }) {
  const bookingCount = trip._count.bookings
  const totalRevenue = trip.bookings.reduce((sum, b) => sum + b.totalAmount, 0)
  const occupancy = ((trip.totalSlots - trip.availableSlots) / trip.totalSlots) * 100

  return (
    <Card className={cn(
      "hover:shadow-lg transition-all",
      highlight && "border-orange-400 border-2 shadow-md",
      past && "opacity-60"
    )}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {highlight && (
              <Badge className="mb-2 bg-orange-500">
                Departing Today
              </Badge>
            )}
            {past && (
              <Badge variant="secondary" className="mb-2">
                Completed
              </Badge>
            )}

            <h3 className="text-lg font-semibold mb-2">
              {trip.origin} → {trip.destination}
            </h3>

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

            {/* Crew Information */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Crew for this trip:</p>
              <div className="flex flex-wrap gap-2">
                {trip.driver && (
                  <Badge variant="outline" className="bg-blue-50">
                    <Car className="h-3 w-3 mr-1" />
                    Driver: {trip.driver.name}
                  </Badge>
                )}
                {trip.conductor && (
                  <Badge variant="outline" className="bg-green-50">
                    <UserCheck className="h-3 w-3 mr-1" />
                    Conductor: {trip.conductor.name}
                  </Badge>
                )}
                {trip.manualTicketer && (
                  <Badge variant="outline" className="bg-orange-50">
                    <Ticket className="h-3 w-3 mr-1" />
                    Ticketer: {trip.manualTicketer.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <Badge className="mb-2">
              {BUS_TYPES[trip.busType as keyof typeof BUS_TYPES] || trip.busType}
            </Badge>
            <p className="text-lg font-bold text-primary">{formatCurrency(trip.price)}</p>
            <p className="text-xs text-muted-foreground">per seat</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

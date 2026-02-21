"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Bus,
  MapPin,
  Calendar,
  Clock,
  Users,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Droplets,
  Coffee,
  Edit,
  Ticket,
  User,
  Phone,
  CheckCircle,
  XCircle,
  Car,
  UserCheck,
  Truck,
  Play,
  Square,
  Flag,
  Ban,
  RefreshCw,
  PauseCircle
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency, formatDate, formatDuration, getSlotsPercentage, isLowSlots, BUS_TYPES, hasDepartedEthiopia } from "@/lib/utils"
import { BookingControlCard } from "@/components/company/BookingControlCard"
import { TripChat } from "@/components/trip/TripChat"
import { TripLogCard } from "@/components/trip/TripLogCard"
import { ViewOnlyBanner } from "@/components/company/ViewOnlyBanner"
import { BoardingChecklist } from "@/components/company/BoardingChecklist"
import { ReplacementTicketCard } from "@/components/company/ReplacementTicketCard"
import { isTripViewOnly } from "@/lib/trip-status"

interface Passenger {
  id: string
  name: string
  nationalId: string
  phone: string
  seatNumber: number | null
  boardingStatus?: string
}

interface Booking {
  id: string
  status: string
  totalAmount: number
  commission: number | null
  commissionVAT: number | null
  createdAt: string
  passengers: Passenger[]
  user: {
    name: string
    phone: string
  } | null
  tickets: {
    id: string
    shortCode: string
    isUsed: boolean
  }[]
}

interface Trip {
  id: string
  origin: string
  destination: string
  route: string | null
  intermediateStops: string | null
  departureTime: string
  estimatedDuration: number
  actualDepartureTime: string | null
  actualArrivalTime: string | null
  distance: number | null
  price: number
  busType: string
  totalSlots: number
  availableSlots: number
  hasWater: boolean
  hasFood: boolean
  defaultPickup: string | null
  defaultDropoff: string | null
  bookingHalted: boolean
  autoResumeEnabled: boolean
  status: string
  delayReason: string | null
  delayedAt: string | null
  noShowCount: number
  releasedSeats: number
  replacementsSold: number
  company: {
    name: string
  }
  bookings: Booking[]
  driver?: {
    id: string
    name: string
    phone: string
    licenseNumber?: string
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
    busType: string
    make: string | null
    model: string | null
    year: number | null
    totalSeats: number
  } | null
}

export default function TripDetailPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string

  const [trip, setTrip] = useState<Trip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [showTripLogPopup, setShowTripLogPopup] = useState(false)  // Auto-show trip log on DEPARTED
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [showDelayDialog, setShowDelayDialog] = useState(false)
  const [delayReason, setDelayReason] = useState<string>("")

  // Delay reason options
  const DELAY_REASONS = [
    { value: "TRAFFIC", label: "Traffic" },
    { value: "BREAKDOWN", label: "Breakdown" },
    { value: "WEATHER", label: "Weather" },
    { value: "WAITING_PASSENGERS", label: "Waiting for passengers" },
    { value: "OTHER", label: "Other" },
  ]

  // Fetch trip data (with optional silent mode for auto-refresh)
  const fetchTrip = useCallback(async (silent = false) => {
    if (!silent) {
      setIsRefreshing(true)
    }
    try {
      const response = await fetch(`/api/company/trips/${tripId}`)
      const data = await response.json()

      if (response.ok) {
        setTrip(data.trip)
        setLastRefresh(new Date())
      } else {
        if (!silent) {
          setError(data.error || "Trip not found")
        }
      }
    } catch (err) {
      if (!silent) {
        setError("Failed to load trip details")
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [tripId])

  // Initial load
  useEffect(() => {
    if (status === "authenticated") {
      if (session.user.role !== "COMPANY_ADMIN" && session.user.role !== "SUPER_ADMIN") {
        router.push("/")
        return
      }
      fetchTrip()
    }
  }, [status, session, tripId, fetchTrip])

  // Auto-refresh every 30 seconds (silent refresh - no loading state)
  useEffect(() => {
    if (!trip) return // Don't poll if no trip loaded

    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchTrip(true) // Silent refresh
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [trip, fetchTrip])

  // Manual refresh handler
  const handleManualRefresh = () => {
    fetchTrip(false) // Show loading state
  }

  const updateTripStatus = async (newStatus: string, reason?: string) => {
    setIsUpdatingStatus(true)
    try {
      const body: { status: string; delayReason?: string } = { status: newStatus }
      if (reason) {
        body.delayReason = reason
      }

      const response = await fetch(`/api/company/trips/${tripId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await response.json()

      if (response.ok) {
        toast.success(`Trip status updated to ${newStatus}`)
        fetchTrip() // Refresh trip data

        // Auto-open trip log popup when trip departs
        if (newStatus === "DEPARTED") {
          setShowTripLogPopup(true)
          toast.info("Please record starting odometer reading", {
            duration: 5000,
          })
        }

        // Close delay dialog
        if (newStatus === "DELAYED") {
          setShowDelayDialog(false)
          setDelayReason("")
        }
      } else {
        toast.error(data.error || "Failed to update status")
      }
    } catch (err) {
      toast.error("Failed to update trip status")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleDelayTrip = () => {
    if (!delayReason) {
      toast.error("Please select a delay reason")
      return
    }
    updateTripStatus("DELAYED", delayReason)
  }

  // Get status badge color and label
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return { variant: "secondary" as const, label: "Scheduled" }
      case "DELAYED":
        return { variant: "warning" as const, label: "Delayed" }
      case "BOARDING":
        return { variant: "warning" as const, label: "Boarding" }
      case "DEPARTED":
        return { variant: "default" as const, label: "Departed" }
      case "COMPLETED":
        return { variant: "success" as const, label: "Completed" }
      case "CANCELLED":
        return { variant: "destructive" as const, label: "Cancelled" }
      default:
        return { variant: "secondary" as const, label: status }
    }
  }

  // Get available status actions (ULTRA CRITICAL: Check past trip)
  const getStatusActions = (status: string, departureTime: string) => {
    // 🚨 ULTRA CRITICAL: Past trips (even SCHEDULED) should only allow DEPARTED→COMPLETED
    // FIX: Use Ethiopia timezone for proper comparison
    const isPastTrip = hasDepartedEthiopia(departureTime)
    const effectiveStatus = isPastTrip && status === "SCHEDULED" ? "DEPARTED" : status

    switch (effectiveStatus) {
      case "SCHEDULED":
        return [
          { status: "BOARDING", label: "Start Boarding", icon: Play, variant: "default" as const },
          { status: "DELAYED", label: "Mark as Delayed", icon: PauseCircle, variant: "outline" as const, isDelay: true },
          { status: "CANCELLED", label: "Cancel Trip", icon: Ban, variant: "destructive" as const },
        ]
      case "DELAYED":
        return [
          { status: "BOARDING", label: "Start Boarding", icon: Play, variant: "default" as const },
          { status: "DEPARTED", label: "Depart", icon: Flag, variant: "default" as const },
          { status: "CANCELLED", label: "Cancel Trip", icon: Ban, variant: "destructive" as const },
        ]
      case "BOARDING":
        return [
          { status: "DEPARTED", label: "Depart", icon: Flag, variant: "default" as const },
          { status: "CANCELLED", label: "Cancel Trip", icon: Ban, variant: "destructive" as const },
        ]
      case "DEPARTED":
        return [
          { status: "COMPLETED", label: "Complete Trip", icon: Square, variant: "default" as const },
        ]
      default:
        return []
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Card className="max-w-md p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Trip Not Found</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" asChild>
            <Link href="/company/trips">Back to Trips</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const slotsPercent = getSlotsPercentage(trip.availableSlots, trip.totalSlots)
  const lowSlots = isLowSlots(trip.availableSlots, trip.totalSlots)
  const paidBookings = trip.bookings.filter((b) => b.status === "PAID")
  const totalPassengers = paidBookings.reduce((acc, b) => acc + b.passengers.length, 0)
  // RULE-007: Company revenue = totalAmount - commission - commissionVAT (platform fees)
  const totalRevenue = paidBookings.reduce((acc, b) =>
    acc + (Number(b.totalAmount) - Number(b.commission || 0) - Number(b.commissionVAT || 0)), 0)

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/company/trips"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Trips
          </Link>
          <div className="flex items-center gap-3">
            {/* Manual Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Badge variant="outline" className="gap-1 bg-blue-50 border-blue-200 text-blue-700 hidden sm:flex">
              <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-xs">Live updates</span>
            </Badge>
            {/* RULE-003: Check status, past date, AND sold-out for view-only */}
            {(() => {
              // FIX: Use Ethiopia timezone for proper comparison
              const isPastTrip = hasDepartedEthiopia(trip.departureTime)
              const isSoldOut = trip.availableSlots === 0
              const isViewOnly = isTripViewOnly(trip.status, trip.availableSlots) || isPastTrip

              // Determine the appropriate tooltip message
              let tooltipMessage = "Only view is possible for departed, cancelled, completed or past trips"
              if (isSoldOut && !["DEPARTED", "COMPLETED", "CANCELLED"].includes(trip.status) && !isPastTrip) {
                tooltipMessage = "Cannot edit sold-out trips"
              }

              return (
                <Button
                  variant="outline"
                  asChild={!isViewOnly}
                  disabled={isViewOnly}
                  title={isViewOnly ? tooltipMessage : undefined}
                >
                  {isViewOnly ? (
                    <span className="cursor-not-allowed opacity-50">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Trip {isSoldOut && !["DEPARTED", "COMPLETED", "CANCELLED"].includes(trip.status) && !isPastTrip ? "(Sold Out)" : "(View-Only)"}
                    </span>
                  ) : (
                    <Link href={`/company/trips/${tripId}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Trip
                    </Link>
                  )}
                </Button>
              )
            })()}
          </div>
        </div>

        {/* View-Only Banner for DEPARTED, COMPLETED, CANCELLED, past, or sold-out trips */}
        {/* FIX: Use Ethiopia timezone for proper comparison */}
        {(isTripViewOnly(trip.status, trip.availableSlots) || hasDepartedEthiopia(trip.departureTime)) && (
          <ViewOnlyBanner
            tripStatus={
              trip.availableSlots === 0 && !["DEPARTED", "COMPLETED", "CANCELLED"].includes(trip.status) && !hasDepartedEthiopia(trip.departureTime)
                ? "SOLD_OUT"
                : hasDepartedEthiopia(trip.departureTime) && trip.status === "SCHEDULED"
                  ? "DEPARTED"
                  : trip.status
            }
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trip Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bus className="h-5 w-5 text-primary" />
                      {trip.origin} to {trip.destination}
                    </CardTitle>
                    <CardDescription>
                      {trip.company.name}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge>
                      {BUS_TYPES.find((t) => t.value === trip.busType)?.label || trip.busType}
                    </Badge>
                    <Badge variant={getStatusBadge(trip.status || "SCHEDULED").variant}>
                      {getStatusBadge(trip.status || "SCHEDULED").label}
                    </Badge>
                    {trip.bookingHalted && (
                      <Badge variant="warning">Booking Halted</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {trip.actualDepartureTime ? "Scheduled Departure" : "Departure"}
                      </p>
                      <p className="font-medium">{formatDate(trip.departureTime)}</p>
                      {trip.actualDepartureTime && (
                        <>
                          <p className="text-xs text-primary font-semibold mt-1">Actual Departure</p>
                          <p className="font-medium text-sm text-primary">
                            {formatDate(trip.actualDepartureTime)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-medium">{formatDuration(trip.estimatedDuration)}</p>
                      {trip.actualArrivalTime && trip.actualDepartureTime && (
                        <>
                          <p className="text-xs text-success font-semibold mt-1">Actual Duration</p>
                          <p className="font-medium text-sm text-success">
                            {Math.round((new Date(trip.actualArrivalTime).getTime() - new Date(trip.actualDepartureTime).getTime()) / (1000 * 60 * 60))}h
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  {trip.distance && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Distance</p>
                        <p className="font-medium">{trip.distance} km</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="font-medium">{formatCurrency(Number(trip.price))}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Seats</p>
                      <p className={`font-medium ${lowSlots ? "text-red-500" : "text-green-600"}`}>
                        {trip.availableSlots} available
                      </p>
                      <p className="text-xs text-muted-foreground">
                        of {trip.totalSlots} total
                      </p>
                    </div>
                  </div>
                </div>

                {trip.route && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Route:</span>
                      <span className="text-sm font-medium">{trip.route}</span>
                    </div>
                  </>
                )}

                {(trip.defaultPickup || trip.defaultDropoff) && (
                  <>
                    <Separator />
                    <div className="space-y-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm font-semibold">Standard Terminals</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        {trip.defaultPickup && (
                          <div>
                            <span className="text-muted-foreground">Pickup: </span>
                            <span className="font-medium">{trip.defaultPickup}</span>
                          </div>
                        )}
                        {trip.defaultDropoff && (
                          <div>
                            <span className="text-muted-foreground">Dropoff: </span>
                            <span className="font-medium">{trip.defaultDropoff}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {(trip.hasWater || trip.hasFood) && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">Amenities:</span>
                      {trip.hasWater && (
                        <span className="flex items-center gap-1 text-sm">
                          <Droplets className="h-4 w-4 text-blue-500" /> Water
                        </span>
                      )}
                      {trip.hasFood && (
                        <span className="flex items-center gap-1 text-sm">
                          <Coffee className="h-4 w-4 text-amber-500" /> Snacks
                        </span>
                      )}
                    </div>
                  </>
                )}

                {/* Assigned Staff & Vehicle */}
                {(trip.driver || trip.conductor || trip.manualTicketer || trip.vehicle) && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Assigned Staff:</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {trip.driver && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                            <Car className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-blue-600 uppercase">Driver</p>
                              <p className="text-sm font-medium text-gray-900 truncate">{trip.driver.name}</p>
                              <p className="text-xs text-gray-500">{trip.driver.phone}</p>
                              {trip.driver.licenseNumber && (
                                <p className="text-xs text-muted-foreground">License: {trip.driver.licenseNumber}</p>
                              )}
                            </div>
                          </div>
                        )}
                        {trip.conductor && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                            <UserCheck className="h-5 w-5 text-green-600 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-green-600 uppercase">Conductor</p>
                              <p className="text-sm font-medium text-gray-900 truncate">{trip.conductor.name}</p>
                              <p className="text-xs text-gray-500">{trip.conductor.phone}</p>
                            </div>
                          </div>
                        )}
                        {trip.manualTicketer && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200">
                            <Ticket className="h-5 w-5 text-orange-600 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-orange-600 uppercase">Manual Ticketer</p>
                              <p className="text-sm font-medium text-gray-900 truncate">{trip.manualTicketer.name}</p>
                              <p className="text-xs text-gray-500">{trip.manualTicketer.phone}</p>
                            </div>
                          </div>
                        )}
                        {trip.vehicle && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-50 border border-purple-200">
                            <Truck className="h-5 w-5 text-purple-600 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-purple-600 uppercase">Vehicle</p>
                              <p className="text-sm font-medium text-gray-900 font-mono truncate">
                                {trip.vehicle.plateNumber}
                                {trip.vehicle.sideNumber && ` (${trip.vehicle.sideNumber})`}
                              </p>
                              <p className="text-xs text-gray-500">{trip.vehicle.make} {trip.vehicle.model} ({trip.vehicle.year})</p>
                              <p className="text-xs text-muted-foreground">{trip.vehicle.totalSeats} seats • {trip.vehicle.busType}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Bookings ({paidBookings.length})</CardTitle>
                <CardDescription>
                  {totalPassengers} passengers booked
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paidBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No bookings yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking ID</TableHead>
                        <TableHead>Passengers</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Tickets</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paidBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-mono text-xs">
                            {booking.id.slice(-8).toUpperCase()}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {booking.passengers.map((p) => (
                                <div key={p.id} className="flex items-center gap-1 text-sm">
                                  {p.boardingStatus === "BOARDED" ? (
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                  ) : p.boardingStatus === "NO_SHOW" ? (
                                    <XCircle className="h-3 w-3 text-red-500" />
                                  ) : (
                                    <User className="h-3 w-3" />
                                  )}
                                  <span className={p.boardingStatus === "NO_SHOW" ? "line-through text-muted-foreground" : ""}>
                                    {p.name}
                                  </span>
                                  {p.seatNumber && (
                                    <span className="text-xs text-muted-foreground">(S{p.seatNumber})</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {booking.user?.phone || "—"}
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(Number(booking.totalAmount))}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {booking.tickets.map((t) => (
                                <div key={t.id} className="flex items-center gap-1">
                                  {t.isUsed ? (
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <XCircle className="h-3 w-3 text-muted-foreground" />
                                  )}
                                  <span className="font-mono text-xs">{t.shortCode}</span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Boarding Checklist - shown for BOARDING and DEPARTED trips */}
            {["BOARDING", "DEPARTED"].includes(trip.status) && (
              <BoardingChecklist
                tripId={trip.id}
                tripStatus={trip.status}
                onUpdate={fetchTrip}
              />
            )}
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trip Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seat Occupancy</span>
                  <span className={`font-bold ${lowSlots ? "text-red-500" : "text-green-600"}`}>
                    {100 - slotsPercent}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${lowSlots ? "bg-red-500" : "bg-green-500"}`}
                    style={{ width: `${100 - slotsPercent}%` }}
                  />
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Bookings</span>
                  <span className="font-bold">{paidBookings.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Passengers</span>
                  <span className="font-bold">{totalPassengers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revenue</span>
                  <span className="font-bold text-primary">{formatCurrency(totalRevenue)}</span>
                </div>

                {paidBookings.length > 0 && (
                  <>
                    <Separator />
                    <a href={`/api/company/trips/${trip.id}/manifest`} download>
                      <Button className="w-full" variant="default">
                        <Ticket className="h-4 w-4 mr-2" />
                        Download Passenger Manifest
                      </Button>
                    </a>
                    <p className="text-xs text-center text-muted-foreground">
                      Download Excel report with all {totalPassengers} passenger details.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Boarding Stats (BOARDING/DEPARTED only) */}
            {["BOARDING", "DEPARTED"].includes(trip.status) && (trip.noShowCount > 0 || totalPassengers > 0) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Boarding
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trip.noShowCount > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">No-Shows</span>
                        <span className="font-bold text-red-500">{trip.noShowCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Released Seats</span>
                        <span className="font-bold text-blue-600">{trip.releasedSeats}</span>
                      </div>
                      {trip.replacementsSold > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Replacements Sold</span>
                          <span className="font-bold text-green-600">{trip.replacementsSold}</span>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Replacement Ticket Card (DEPARTED + released seats) */}
            {trip.status === "DEPARTED" && trip.releasedSeats > 0 && (
              <ReplacementTicketCard
                tripId={trip.id}
                releasedSeats={trip.releasedSeats}
                price={Number(trip.price)}
                onUpdate={fetchTrip}
              />
            )}

            {/* Trip Status Control */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Trip Status
                </CardTitle>
                <CardDescription>
                  Current: <Badge variant={getStatusBadge(trip.status || "SCHEDULED").variant}>
                    {getStatusBadge(trip.status || "SCHEDULED").label}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Show delay reason if trip is delayed */}
                {trip.status === "DELAYED" && trip.delayReason && (
                  <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 mb-3">
                    <p className="text-xs font-medium text-yellow-800 uppercase">Delay Reason</p>
                    <p className="text-sm font-semibold text-yellow-900">
                      {DELAY_REASONS.find(r => r.value === trip.delayReason)?.label || trip.delayReason}
                    </p>
                    {trip.delayedAt && (
                      <p className="text-xs text-yellow-700 mt-1">
                        Since {formatDate(trip.delayedAt)}
                      </p>
                    )}
                  </div>
                )}

                {getStatusActions(trip.status || "SCHEDULED", trip.departureTime).length > 0 ? (
                  getStatusActions(trip.status || "SCHEDULED", trip.departureTime).map((action) => (
                    <Button
                      key={action.status}
                      className="w-full"
                      variant={action.variant}
                      onClick={() => {
                        if ((action as any).isDelay) {
                          setShowDelayDialog(true)
                        } else {
                          updateTripStatus(action.status)
                        }
                      }}
                      disabled={isUpdatingStatus}
                    >
                      {isUpdatingStatus ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <action.icon className="h-4 w-4 mr-2" />
                      )}
                      {action.label}
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    {trip.status === "COMPLETED"
                      ? "Trip has been completed."
                      : trip.status === "CANCELLED"
                        ? "Trip has been cancelled."
                        : "No actions available."}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Booking Control */}
            <BookingControlCard
              tripId={trip.id}
              bookingHalted={trip.bookingHalted}
              availableSlots={trip.availableSlots}
              currentAutoResumeEnabled={trip.autoResumeEnabled || false}
              tripStatus={trip.status}
              departureTime={trip.departureTime}
              onUpdate={fetchTrip}
            />

            {/* Trip Log - Odometer & Fuel Tracking */}
            <TripLogCard
              tripId={trip.id}
              vehicleId={trip.vehicle?.id}
              tripStatus={trip.status}
              autoOpenStart={showTripLogPopup}
              onDialogClose={() => setShowTripLogPopup(false)}
            />

            {/* Trip Chat - Communicate with assigned staff */}
            <TripChat
              tripId={trip.id}
              tripRoute={`${trip.origin} → ${trip.destination}`}
              defaultExpanded={false}
            />

            {trip.availableSlots > 0 && lowSlots && !trip.bookingHalted && (
              <Card className="border-yellow-500 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-yellow-800 mb-2">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Low Seats Warning</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Only {trip.availableSlots} seats remaining. System will auto-halt at 10 slots.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

      </div>

      {/* Delay Dialog */}
      <Dialog open={showDelayDialog} onOpenChange={setShowDelayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PauseCircle className="h-5 w-5 text-yellow-500" />
              Mark Trip as Delayed
            </DialogTitle>
            <DialogDescription>
              Select the reason for the delay. Bookings will still be allowed for delayed trips.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Delay Reason</label>
              <Select value={delayReason} onValueChange={setDelayReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  {DELAY_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelayDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleDelayTrip}
              disabled={!delayReason || isUpdatingStatus}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              {isUpdatingStatus ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PauseCircle className="h-4 w-4 mr-2" />
              )}
              Mark as Delayed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

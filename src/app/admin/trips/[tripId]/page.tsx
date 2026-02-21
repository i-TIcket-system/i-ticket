"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Loader2,
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  DollarSign,
  Users,
  Bus,
  User,
  Phone,
  Building2,
  Gauge,
  Fuel,
  FileText,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import Link from "next/link"

interface TripDetail {
  id: string
  origin: string
  destination: string
  departureTime: string
  estimatedDuration: number
  price: number
  totalSlots: number
  availableSlots: number
  bookingHalted: boolean
  status: string
  company: {
    id: string
    name: string
    phones: string[]
    email: string | null
  }
  vehicle: {
    plateNumber: string
    sideNumber: string
    busType: string
    currentOdometer: number | null
  } | null
  driver: {
    name: string
    phone: string
  } | null
  conductor: {
    name: string
    phone: string
  } | null
  manualTicketer: {
    name: string
    phone: string
  } | null
  tripLog: {
    startOdometer: number | null
    endOdometer: number | null
    startFuel: number | null
    endFuel: number | null
    distanceTraveled: number | null
    fuelConsumed: number | null
    fuelEfficiency: number | null
    startedByName: string | null
    endedByName: string | null
  } | null
  bookings: Array<{
    id: string
    status: string
    totalAmount: number
    createdAt: string
    isQuickTicket: boolean
    isReplacement: boolean
    user: {
      name: string | null
      phone: string
    } | null
    passengers: Array<{
      name: string
      phone: string
      seatNumber: number | null
    }>
  }>
}

export default function SuperAdminTripDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const tripId = params?.tripId as string

  const [trip, setTrip] = useState<TripDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [auditLogged, setAuditLogged] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role !== "SUPER_ADMIN") {
      router.push("/")
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === "SUPER_ADMIN" && tripId) {
      fetchTripDetails()
    }
  }, [session, tripId])

  const fetchTripDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/trips/${tripId}`)

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Trip not found")
          router.push("/admin/trips")
          return
        }
        throw new Error("Failed to fetch trip details")
      }

      const data = await response.json()
      setTrip(data.trip)
      setAuditLogged(data.auditLogged)
    } catch (error) {
      console.error("Failed to fetch trip details:", error)
      toast.error("Failed to load trip details")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      SCHEDULED: { variant: "secondary", label: "Scheduled" },
      BOARDING: { variant: "default", label: "Boarding" },
      DEPARTED: { variant: "default", label: "Departed" },
      COMPLETED: { variant: "secondary", label: "Completed" },
      CANCELLED: { variant: "destructive", label: "Cancelled" },
    }
    const config = variants[status] || { variant: "secondary", label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getBookingStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PENDING: "secondary",
      PAID: "default",
      CANCELLED: "destructive",
    }
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: "#0e9494" }} />
          <p className="mt-4 text-muted-foreground">Loading trip details...</p>
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">Trip not found</p>
            <Button asChild className="mt-4" style={{ background: "#0e9494" }}>
              <Link href="/admin/trips">Back to All Trips</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const occupancyRate = ((trip.totalSlots - trip.availableSlots) / trip.totalSlots) * 100
  const paidBookings = trip.bookings.filter(b => b.status === 'PAID')
  const totalRevenue = paidBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0)
  const estimatedArrival = new Date(new Date(trip.departureTime).getTime() + trip.estimatedDuration * 60 * 1000)
  const companyPhone = (() => {
    try {
      const p = typeof trip.company.phones === 'string' ? JSON.parse(trip.company.phones as unknown as string) : trip.company.phones
      return Array.isArray(p) ? p[0] : null
    } catch { return null }
  })()

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Trips
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bus className="h-8 w-8" style={{ color: "#0e9494" }} />
              {trip.origin} → {trip.destination}
            </h1>
            <p className="text-muted-foreground mt-1">
              Trip ID: {trip.id}
            </p>
          </div>
          {getStatusBadge(trip.status)}
        </div>

        {auditLogged && (
          <div className="mt-4 p-3 rounded-lg border border-blue-200" style={{ background: "rgba(14, 148, 148, 0.05)" }}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Your access to this trip has been logged for audit purposes</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trip Information */}
          <Card>
            <CardHeader>
              <CardTitle>Trip Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Origin</p>
                    <p className="font-medium">{trip.origin}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Destination</p>
                    <p className="font-medium">{trip.destination}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Departure</p>
                    <p className="font-medium">{formatDate(trip.departureTime)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(trip.departureTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Est. Arrival</p>
                    <p className="font-medium">{formatDate(estimatedArrival)}</p>
                    <p className="text-xs text-muted-foreground">
                      {estimatedArrival.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket Price</p>
                    <p className="font-medium">{trip.price} ETB</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Occupancy</p>
                    <p className="font-medium">
                      {trip.totalSlots - trip.availableSlots}/{trip.totalSlots} seats
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {occupancyRate.toFixed(1)}% full
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle & Staff */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle & Staff</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {trip.vehicle && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Vehicle</p>
                  <div className="flex items-center gap-3">
                    <Bus className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="font-medium">{trip.vehicle.plateNumber} ({trip.vehicle.sideNumber})</p>
                      <p className="text-sm text-muted-foreground">{trip.vehicle.busType}</p>
                      {trip.vehicle.currentOdometer && (
                        <p className="text-xs text-muted-foreground">
                          Current Odometer: {trip.vehicle.currentOdometer.toLocaleString()} km
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {trip.driver && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Driver</p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{trip.driver.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          {trip.driver.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {trip.conductor && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Conductor</p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{trip.conductor.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          {trip.conductor.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {trip.manualTicketer && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Manual Ticketer</p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{trip.manualTicketer.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          {trip.manualTicketer.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Trip Log */}
          {trip.tripLog && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  Trip Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {trip.tripLog.startOdometer !== null && (
                    <div>
                      <p className="text-sm text-muted-foreground">Start Odometer</p>
                      <p className="text-lg font-medium">{trip.tripLog.startOdometer.toLocaleString()} km</p>
                      {trip.tripLog.startedByName && (
                        <p className="text-xs text-muted-foreground">By: {trip.tripLog.startedByName}</p>
                      )}
                    </div>
                  )}
                  {trip.tripLog.endOdometer !== null && (
                    <div>
                      <p className="text-sm text-muted-foreground">End Odometer</p>
                      <p className="text-lg font-medium">{trip.tripLog.endOdometer.toLocaleString()} km</p>
                      {trip.tripLog.endedByName && (
                        <p className="text-xs text-muted-foreground">By: {trip.tripLog.endedByName}</p>
                      )}
                    </div>
                  )}
                  {trip.tripLog.distanceTraveled !== null && (
                    <div>
                      <p className="text-sm text-muted-foreground">Distance</p>
                      <p className="text-lg font-medium">{trip.tripLog.distanceTraveled.toLocaleString()} km</p>
                    </div>
                  )}
                  {trip.tripLog.fuelEfficiency !== null && (
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Fuel className="h-4 w-4 flex-shrink-0" />
                        Fuel Efficiency
                      </p>
                      <p className="text-lg font-medium">{trip.tripLog.fuelEfficiency.toFixed(2)} km/L</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>Bookings ({trip.bookings.length})</CardTitle>
              <CardDescription>
                Total Revenue: {totalRevenue.toLocaleString()} ETB
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Passengers</TableHead>
                      <TableHead>Seats</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Booked</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trip.bookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No bookings yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      trip.bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {booking.user?.name || (booking.isQuickTicket ? "Office Sale" : booking.isReplacement ? "Replacement" : "Guest")}
                              </p>
                              <p className="text-xs text-muted-foreground">{booking.user?.phone || "—"}</p>
                            </div>
                          </TableCell>
                          <TableCell>{booking.passengers.length}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {booking.passengers.map((p, i) => (
                                p.seatNumber ? (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {p.seatNumber}
                                  </Badge>
                                ) : null
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {Number(booking.totalAmount).toLocaleString()} ETB
                          </TableCell>
                          <TableCell>{getBookingStatusBadge(booking.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(booking.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Company Info & Stats */}
        <div className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-lg">{trip.company.name}</p>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>{companyPhone || "—"}</span>
                </div>
                {trip.company.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">✉</span>
                    <span>{trip.company.email}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{trip.bookings.length}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Paid Bookings</p>
                <p className="text-2xl font-bold">{paidBookings.length}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{totalRevenue.toLocaleString()} ETB</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                <p className="text-2xl font-bold">{occupancyRate.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

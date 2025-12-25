"use client"

import { useState, useEffect } from "react"
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
  XCircle
} from "lucide-react"
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
import { formatCurrency, formatDate, formatDuration, getSlotsPercentage, isLowSlots, BUS_TYPES } from "@/lib/utils"
import { ManualTicketingCard } from "@/components/company/ManualTicketingCard"

interface Passenger {
  id: string
  name: string
  nationalId: string
  phone: string
  seatNumber: number | null
}

interface Booking {
  id: string
  status: string
  totalAmount: number
  createdAt: string
  passengers: Passenger[]
  user: {
    name: string
    phone: string
  }
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
  departureTime: string
  estimatedDuration: number
  price: number
  busType: string
  totalSlots: number
  availableSlots: number
  hasWater: boolean
  hasFood: boolean
  bookingHalted: boolean
  company: {
    name: string
  }
  bookings: Booking[]
}

export default function TripDetailPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string

  const [trip, setTrip] = useState<Trip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "authenticated") {
      if (session.user.role !== "COMPANY_ADMIN" && session.user.role !== "SUPER_ADMIN") {
        router.push("/")
        return
      }
      fetchTrip()
    }
  }, [status, session, tripId])

  const fetchTrip = async () => {
    try {
      const response = await fetch(`/api/company/trips/${tripId}`)
      const data = await response.json()

      if (response.ok) {
        setTrip(data.trip)
      } else {
        setError(data.error || "Trip not found")
      }
    } catch (err) {
      setError("Failed to load trip details")
    } finally {
      setIsLoading(false)
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
          <Link href="/company/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const slotsPercent = getSlotsPercentage(trip.availableSlots, trip.totalSlots)
  const lowSlots = isLowSlots(trip.availableSlots, trip.totalSlots)
  const paidBookings = trip.bookings.filter((b) => b.status === "PAID")
  const totalPassengers = paidBookings.reduce((acc, b) => acc + b.passengers.length, 0)
  const totalRevenue = paidBookings.reduce((acc, b) => acc + Number(b.totalAmount), 0)

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/company/dashboard"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <Link href={`/company/trips/${tripId}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Trip
            </Button>
          </Link>
        </div>

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
                    {trip.bookingHalted ? (
                      <Badge variant="warning">Booking Halted</Badge>
                    ) : new Date(trip.departureTime) > new Date() ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Completed</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Departure</p>
                      <p className="font-medium">{formatDate(trip.departureTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-medium">{formatDuration(trip.estimatedDuration)}</p>
                    </div>
                  </div>
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
                        {trip.availableSlots}/{trip.totalSlots}
                      </p>
                    </div>
                  </div>
                </div>

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
                                  <User className="h-3 w-3" />
                                  {p.name}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {booking.user.phone}
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
              </CardContent>
            </Card>

            {lowSlots && !trip.bookingHalted && (
              <Card className="border-yellow-500 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-yellow-800 mb-2">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Low Seats Warning</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Only {trip.availableSlots} seats remaining. Consider halting online booking
                    if manual bookings are expected.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Manual Ticketing Floating Card */}
        {new Date(trip.departureTime) > new Date() && (
          <ManualTicketingCard
            tripId={trip.id}
            availableSlots={trip.availableSlots}
            totalSlots={trip.totalSlots}
            onUpdate={fetchTrip}
          />
        )}
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Bus,
  Plus,
  Eye,
  Edit,
  Loader2,
  Calendar,
  MapPin,
  AlertTriangle,
  Check,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate, getSlotsPercentage, isLowSlots } from "@/lib/utils"

interface Trip {
  id: string
  origin: string
  destination: string
  departureTime: string
  price: number
  busType: string
  totalSlots: number
  availableSlots: number
  bookingHalted: boolean
  isActive: boolean
  _count: {
    bookings: number
  }
}

export default function CompanyTripsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "authenticated") {
      if (session.user.role !== "COMPANY_ADMIN" && session.user.role !== "SUPER_ADMIN") {
        router.push("/")
        return
      }
      fetchTrips()
    }
  }, [status, session])

  const fetchTrips = async () => {
    try {
      const response = await fetch("/api/company/trips")
      const data = await response.json()

      if (response.ok) {
        setTrips(data.trips)
      }
    } catch (error) {
      console.error("Failed to fetch trips:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading trips...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Trip Management</h1>
          <p className="text-muted-foreground">Manage your company's trips and schedules</p>
        </div>
        <Link href="/company/trips/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New Trip
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Trips</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Departure</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Slots</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No trips found. Create your first trip to get started.
                  </TableCell>
                </TableRow>
              ) : (
                trips.map((trip) => {
                  const slotsPercentage = getSlotsPercentage(trip.availableSlots, trip.totalSlots)
                  const lowSlots = isLowSlots(trip.availableSlots, trip.totalSlots)

                  return (
                    <TableRow key={trip.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {trip.origin} → {trip.destination}
                            </div>
                            <div className="text-sm text-muted-foreground">{trip.busType}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(trip.departureTime)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(trip.price)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {trip.availableSlots} / {trip.totalSlots}
                          </div>
                          <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                lowSlots ? "bg-red-500" :
                                slotsPercentage < 50 ? "bg-yellow-500" : "bg-green-500"
                              }`}
                              style={{ width: `${100 - slotsPercentage}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{trip._count.bookings}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {trip.bookingHalted ? (
                            <Badge variant="destructive" className="w-fit">
                              <X className="h-3 w-3 mr-1" />
                              Halted
                            </Badge>
                          ) : trip.isActive ? (
                            <Badge variant="default" className="w-fit">
                              <Check className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="w-fit">Inactive</Badge>
                          )}
                          {lowSlots && !trip.bookingHalted && (
                            <Badge variant="destructive" className="w-fit text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Low Slots
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/company/trips/${trip.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Link href={`/company/trips/${trip.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Bus,
  Plus,
  Users,
  Ticket,
  TrendingUp,
  AlertTriangle,
  Calendar,
  MapPin,
  Clock,
  Eye,
  Edit,
  Loader2,
  Check,
  X,
  Bell,
  Truck,
  Fuel,
  Gauge,
  Wrench,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  lowSlotAlertSent: boolean
  _count: {
    bookings: number
  }
}

interface Stats {
  totalTrips: number
  totalBookings: number
  totalRevenue: number
  activeTrips: number
  vehicles?: {
    total: number
    active: number
    maintenance: number
    inactive: number
  }
  fleetMetrics?: {
    totalDistance: number
    totalFuelConsumed: number
    avgFuelEfficiency: number
    completedTripLogs: number
  }
}

export default function CompanyDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [trips, setTrips] = useState<Trip[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [alertTrip, setAlertTrip] = useState<Trip | null>(null)
  const [isProcessingAlert, setIsProcessingAlert] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => {
    // Load dismissed alerts from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dismissedAlerts')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    }
    return new Set()
  })

  // Auto-refresh with polling
  useEffect(() => {
    if (status === "authenticated") {
      if (session.user.role !== "COMPANY_ADMIN" && session.user.role !== "SUPER_ADMIN") {
        router.push("/")
        return
      }

      // Initial fetch
      fetchDashboardData()
      setIsPolling(true)

      // Poll every 10 seconds for updates
      const interval = setInterval(() => {
        if (!document.hidden) {
          fetchDashboardData()
        }
      }, 10000)

      // Handle visibility change (pause when tab hidden)
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          // Tab became visible, refresh immediately
          fetchDashboardData()
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)

      return () => {
        clearInterval(interval)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        setIsPolling(false)
      }
    }
  }, [status, session])

  // Persist dismissed alerts to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dismissedAlerts', JSON.stringify(Array.from(dismissedAlerts)))
    }
  }, [dismissedAlerts])

  // UX-9 FIX: Clear dismissed alerts when slots increase (no longer low)
  useEffect(() => {
    const updatedAlerts = new Set(dismissedAlerts)
    let hasChanges = false

    dismissedAlerts.forEach((tripId) => {
      const trip = trips.find((t) => t.id === tripId)
      // Remove from dismissed if trip no longer exists or no longer has low slots
      if (!trip || !isLowSlots(trip.availableSlots, trip.totalSlots)) {
        updatedAlerts.delete(tripId)
        hasChanges = true
      }
    })

    if (hasChanges) {
      setDismissedAlerts(updatedAlerts)
    }
  }, [trips, dismissedAlerts])

  const fetchDashboardData = async () => {
    try {
      const [tripsRes, statsRes] = await Promise.all([
        fetch("/api/company/trips"),
        fetch("/api/company/stats"),
      ])

      const tripsData = await tripsRes.json()
      const statsData = await statsRes.json()

      if (tripsRes.ok) setTrips(tripsData.trips)
      if (statsRes.ok) setStats(statsData.stats)
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const statsRes = await fetch("/api/company/stats")
      const statsData = await statsRes.json()
      if (statsRes.ok) setStats(statsData.stats)
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const handleAlertResponse = async (tripId: string, allowContinue: boolean) => {
    setIsProcessingAlert(true)
    try {
      const response = await fetch(`/api/company/trips/${tripId}/alert-response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowContinue }),
      })

      if (response.ok) {
        // Add to dismissed alerts
        setDismissedAlerts(prev => new Set([...Array.from(prev), tripId]))

        // Show success toast
        if (allowContinue) {
          toast.success("Booking resumed successfully", {
            description: "Customers can now book this trip online."
          })
        } else {
          toast.success("Booking stopped", {
            description: "Online booking is now halted for this trip."
          })
        }

        fetchDashboardData()
        setAlertTrip(null)
      } else {
        toast.error("Failed to update booking status")
      }
    } catch (error) {
      console.error("Failed to process alert response:", error)
      toast.error("An error occurred while processing your request")
    } finally {
      setIsProcessingAlert(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 animate-ping">
              <div className="h-16 w-16 rounded-full bg-emerald-500/20" />
            </div>
            <Loader2 className="h-16 w-16 animate-spin text-emerald-600" />
          </div>
          <p className="mt-4 text-slate-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const lowSlotTrips = trips.filter(
    (t) => t.availableSlots > 0 && isLowSlots(t.availableSlots, t.totalSlots) && t.bookingHalted && !dismissedAlerts.has(t.id)
  )

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Company Dashboard</h1>
            <div className="text-muted-foreground flex items-center gap-2">
              <span>{session?.user.companyName || "Manage your trips and bookings"}</span>
              <span className="mx-2">•</span>
              {isPolling && (
                <Badge variant="outline" className="gap-1 bg-blue-50 border-blue-200 text-blue-700">
                  <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
                  <span className="text-xs">Auto-refresh (10s)</span>
                </Badge>
              )}
            </div>
          </div>
          <Button asChild>
            <Link href="/company/trips/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Trip
            </Link>
          </Button>
        </div>

        {/* Low Slot Alerts */}
        {lowSlotTrips.length > 0 && (
          <div className="mb-6 space-y-3">
            {lowSlotTrips.map((trip) => (
              <Card key={trip.id} className="border-yellow-500 bg-yellow-50">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-yellow-800">
                          Low Seats Alert: {trip.origin} to {trip.destination}
                        </p>
                        <p className="text-sm text-yellow-700">
                          Only {trip.availableSlots} of {trip.totalSlots} seats remaining.
                          Online booking is halted.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAlertTrip(trip)}
                      >
                        <Bell className="h-4 w-4 mr-1" />
                        Respond
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Trips</CardDescription>
                <CardTitle className="text-3xl">{stats.totalTrips}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Bus className="h-4 w-4 mr-1" />
                  {stats.activeTrips} active
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Bookings</CardDescription>
                <CardTitle className="text-3xl">{stats.totalBookings}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Ticket className="h-4 w-4 mr-1" />
                  tickets sold
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Revenue</CardDescription>
                <CardTitle className="text-3xl">{formatCurrency(stats.totalRevenue)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  from bookings
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Avg. Occupancy</CardDescription>
                <CardTitle className="text-3xl">
                  {trips.length > 0
                    ? Math.round(
                        (1 -
                          trips.reduce((acc, t) => acc + t.availableSlots, 0) /
                            trips.reduce((acc, t) => acc + t.totalSlots, 0)) *
                          100
                      )
                    : 0}
                  %
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-4 w-4 mr-1" />
                  seat utilization
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Fleet Metrics */}
        {stats?.vehicles && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Fleet Vehicles</CardDescription>
                <CardTitle className="text-3xl">{stats.vehicles.total}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center text-green-600">
                    <Truck className="h-3 w-3 mr-1" />
                    {stats.vehicles.active} active
                  </span>
                  {stats.vehicles.maintenance > 0 && (
                    <span className="flex items-center text-yellow-600">
                      <Wrench className="h-3 w-3 mr-1" />
                      {stats.vehicles.maintenance}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Distance</CardDescription>
                <CardTitle className="text-3xl">
                  {stats.fleetMetrics?.totalDistance ?
                    stats.fleetMetrics.totalDistance.toLocaleString() :
                    <span className="text-muted-foreground text-xl">No data yet</span>
                  }
                  {stats.fleetMetrics?.totalDistance && <span className="text-lg font-normal ml-1">km</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.fleetMetrics?.completedTripLogs ? (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Gauge className="h-4 w-4 mr-1" />
                    from {stats.fleetMetrics.completedTripLogs} logged trips
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Gauge className="h-4 w-4 mr-1" />
                    from 0 logged trips
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Fuel Consumed</CardDescription>
                <CardTitle className="text-3xl">
                  {stats.fleetMetrics?.totalFuelConsumed ?
                    stats.fleetMetrics.totalFuelConsumed.toLocaleString() :
                    <span className="text-muted-foreground text-xl">No data yet</span>
                  }
                  {stats.fleetMetrics?.totalFuelConsumed && <span className="text-lg font-normal ml-1">L</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.fleetMetrics?.totalFuelConsumed ? (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Fuel className="h-4 w-4 mr-1" />
                    total fuel usage
                  </div>
                ) : (
                  <div className="h-5" />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Avg. Efficiency</CardDescription>
                <CardTitle className="text-3xl">
                  {stats.fleetMetrics?.avgFuelEfficiency ?
                    stats.fleetMetrics.avgFuelEfficiency.toFixed(1) :
                    <span className="text-muted-foreground text-xl">No data yet</span>
                  }
                  {stats.fleetMetrics?.avgFuelEfficiency && <span className="text-lg font-normal ml-1">km/L</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.fleetMetrics?.avgFuelEfficiency ? (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    fleet average
                  </div>
                ) : (
                  <div className="h-5" />
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trips Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Trips</CardTitle>
            <CardDescription>
              Manage your scheduled trips and monitor bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Departure</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Bus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No trips yet</p>
                      <Button variant="link" asChild>
                        <Link href="/company/trips/new">Create your first trip</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  trips.map((trip) => {
                    const slotsPercent = getSlotsPercentage(trip.availableSlots, trip.totalSlots)
                    const lowSlots = isLowSlots(trip.availableSlots, trip.totalSlots)

                    return (
                      <TableRow key={trip.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="font-medium">{trip.origin}</span>
                            <span className="text-muted-foreground">to</span>
                            <span className="font-medium">{trip.destination}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(trip.departureTime)}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(Number(trip.price))}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                lowSlots ? "text-red-500 font-medium" : "text-green-600"
                              }
                            >
                              {trip.availableSlots} left
                            </span>
                            <span className="text-xs text-muted-foreground">
                              / {trip.totalSlots}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {trip.bookingHalted ? (
                            <Badge variant="warning">Halted</Badge>
                          ) : new Date(trip.departureTime) > new Date() ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Completed</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" aria-label="View trip details" asChild>
                              <Link href={`/company/trips/${trip.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" aria-label="Edit trip" asChild>
                              <Link href={`/company/trips/${trip.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
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

        {/* Alert Response Dialog */}
        <Dialog open={!!alertTrip} onOpenChange={() => setAlertTrip(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Low Seat Alert
              </DialogTitle>
              <DialogDescription>
                {alertTrip && (
                  <>
                    Trip from <strong>{alertTrip.origin}</strong> to{" "}
                    <strong>{alertTrip.destination}</strong> has only{" "}
                    <strong>{alertTrip.availableSlots}</strong> seats remaining.
                    Online booking has been automatically halted.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Do you want to continue accepting online bookings? This decision will be
                logged for reference.
              </p>

              <div className="bg-muted rounded-lg p-4 text-sm">
                <p className="font-medium mb-2">Note:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>If you have manual bookings pending, select &quot;Stop Booking&quot;</li>
                  <li>If online booking should continue, select &quot;Continue Booking&quot;</li>
                  <li>This action will be recorded with timestamp</li>
                </ul>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => alertTrip && handleAlertResponse(alertTrip.id, false)}
                disabled={isProcessingAlert}
              >
                <X className="h-4 w-4 mr-2" />
                Stop Booking
              </Button>
              <Button
                onClick={() => alertTrip && handleAlertResponse(alertTrip.id, true)}
                disabled={isProcessingAlert}
              >
                {isProcessingAlert ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Continue Booking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

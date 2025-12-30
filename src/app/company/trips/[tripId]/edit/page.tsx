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
  DollarSign,
  Users,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Droplets,
  Coffee,
  Pause,
  Play,
  Trash2,
  Car,
  UserCheck,
  Ticket,
  Truck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { BUS_TYPES } from "@/lib/utils"

interface Trip {
  id: string
  origin: string
  destination: string
  departureTime: string
  estimatedDuration: number
  distance: number | null
  price: number
  busType: string
  totalSlots: number
  availableSlots: number
  hasWater: boolean
  hasFood: boolean
  bookingHalted: boolean
  isActive: boolean
  company: {
    name: string
  }
  driver?: {
    id: string
    name: string
    licenseNumber?: string
  }
  conductor?: {
    id: string
    name: string
  }
  manualTicketer?: {
    id: string
    name: string
  }
  vehicle?: {
    id: string
    plateNumber: string
    sideNumber: string | null
    make: string
    model: string
  }
}

export default function EditTripPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string

  const [trip, setTrip] = useState<Trip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cities, setCities] = useState<string[]>([])
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    departureDate: "",
    departureTime: "",
    estimatedDuration: "",
    distance: "",
    price: "",
    busType: "standard",
    totalSlots: "",
    hasWater: false,
    hasFood: false,
    bookingHalted: false,
    isActive: true,
    driverId: null as string | null,
    conductorId: null as string | null,
    manualTicketerId: null as string | null,
    vehicleId: null as string | null,
  })
  const [vehicles, setVehicles] = useState<Array<{
    id: string;
    plateNumber: string;
    sideNumber: string | null;
    make: string;
    model: string;
    status: string;
  }>>([])
  const [staff, setStaff] = useState<{
    drivers: Array<{ id: string; name: string; licenseNumber?: string }>;
    conductors: Array<{ id: string; name: string }>;
    ticketers: Array<{ id: string; name: string }>;
  }>({ drivers: [], conductors: [], ticketers: [] })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")

  // Fetch cities from API
  useEffect(() => {
    async function fetchCities() {
      try {
        const response = await fetch("/api/cities")
        const data = await response.json()
        if (data.cities) {
          setCities(data.cities.map((c: any) => c.name))
        }
      } catch (error) {
        console.error("Failed to fetch cities:", error)
        setCities([])
      }
    }
    fetchCities()
  }, [])

  // Fetch staff from API
  useEffect(() => {
    async function fetchStaff() {
      try {
        const response = await fetch("/api/company/staff")
        const data = await response.json()
        if (data.staff) {
          setStaff({
            drivers: data.staff.filter((s: any) => s.staffRole === 'DRIVER'),
            conductors: data.staff.filter((s: any) => s.staffRole === 'CONDUCTOR'),
            ticketers: data.staff.filter((s: any) => s.staffRole === 'MANUAL_TICKETER')
          })
        }
      } catch (error) {
        console.error("Failed to fetch staff:", error)
      }
    }
    fetchStaff()
  }, [])

  // Fetch vehicles from API (only active ones)
  useEffect(() => {
    async function fetchVehicles() {
      try {
        const response = await fetch("/api/company/vehicles?status=ACTIVE")
        const data = await response.json()
        if (data.vehicles) {
          setVehicles(data.vehicles)
        }
      } catch (error) {
        console.error("Failed to fetch vehicles:", error)
      }
    }
    fetchVehicles()
  }, [])

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
        // Parse departure time
        const dt = new Date(data.trip.departureTime)
        setFormData({
          origin: data.trip.origin,
          destination: data.trip.destination,
          departureDate: dt.toISOString().split("T")[0],
          departureTime: dt.toTimeString().slice(0, 5),
          estimatedDuration: String(data.trip.estimatedDuration),
          distance: data.trip.distance ? String(data.trip.distance) : "",
          price: String(data.trip.price),
          busType: data.trip.busType,
          totalSlots: String(data.trip.totalSlots),
          hasWater: data.trip.hasWater,
          hasFood: data.trip.hasFood,
          bookingHalted: data.trip.bookingHalted,
          isActive: data.trip.isActive,
          driverId: data.trip.driver?.id || null,
          conductorId: data.trip.conductor?.id || null,
          manualTicketerId: data.trip.manualTicketer?.id || null,
          vehicleId: data.trip.vehicle?.id || null,
        })
      } else {
        setError(data.error || "Trip not found")
      }
    } catch (err) {
      setError("Failed to load trip")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation - case-insensitive and trimmed
    if (formData.origin.trim().toLowerCase() === formData.destination.trim().toLowerCase()) {
      setError("Origin and destination cannot be the same")
      return
    }

    setIsSubmitting(true)

    try {
      const departureTime = new Date(`${formData.departureDate}T${formData.departureTime}`)

      const response = await fetch(`/api/company/trips/${tripId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: formData.origin,
          destination: formData.destination,
          departureTime: departureTime.toISOString(),
          estimatedDuration: parseInt(formData.estimatedDuration),
          distance: formData.distance ? parseInt(formData.distance) : null,
          price: parseFloat(formData.price),
          busType: formData.busType,
          totalSlots: parseInt(formData.totalSlots),
          hasWater: formData.hasWater,
          hasFood: formData.hasFood,
          bookingHalted: formData.bookingHalted,
          isActive: formData.isActive,
          driverId: formData.driverId,
          conductorId: formData.conductorId,
          manualTicketerId: formData.manualTicketerId,
          vehicleId: formData.vehicleId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/company/trips/${tripId}`)
      } else {
        setError(data.error || "Failed to update trip")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/company/trips/${tripId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        router.push("/company/dashboard")
      } else {
        setError(data.error || "Failed to delete trip")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleBookingStatus = async () => {
    setFormData((prev) => ({ ...prev, bookingHalted: !prev.bookingHalted }))
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
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const bookedSeats = trip.totalSlots - trip.availableSlots

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link
          href={`/company/trips/${tripId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Trip Details
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="h-5 w-5 text-primary" />
                  Edit Trip
                </CardTitle>
                <CardDescription>
                  {trip.origin} to {trip.destination} - {trip.company.name}
                </CardDescription>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={bookedSeats > 0}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Trip?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This trip will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            {bookedSeats > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {bookedSeats} seats booked - trip cannot be deleted
              </p>
            )}
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {/* Booking Status Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Online Booking</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.bookingHalted
                      ? "Booking is currently halted"
                      : "Booking is open for customers"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={formData.bookingHalted ? "default" : "secondary"}
                  onClick={toggleBookingStatus}
                >
                  {formData.bookingHalted ? (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4 mr-1" />
                      Halt
                    </>
                  )}
                </Button>
              </div>

              {/* Route */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Origin *</Label>
                  <Select
                    value={formData.origin}
                    onValueChange={(v) => handleSelectChange("origin", v)}
                  >
                    <SelectTrigger>
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Select origin" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Destination *</Label>
                  <Select
                    value={formData.destination}
                    onValueChange={(v) => handleSelectChange("destination", v)}
                  >
                    <SelectTrigger>
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.filter((c) => c !== formData.origin).map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Departure Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      name="departureDate"
                      value={formData.departureDate}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Departure Time *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      name="departureTime"
                      value={formData.departureTime}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Duration and Distance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estimated Duration (minutes) *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      name="estimatedDuration"
                      placeholder="e.g., 540 for 9 hours"
                      value={formData.estimatedDuration}
                      onChange={handleChange}
                      min="30"
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter duration in minutes (e.g., 540 = 9 hours)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Distance (kilometers)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      name="distance"
                      placeholder="e.g., 450"
                      value={formData.distance}
                      onChange={handleChange}
                      min="1"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Optional: Trip distance in km
                  </p>
                </div>
              </div>

              {/* Price & Bus Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (ETB) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      name="price"
                      placeholder="e.g., 850"
                      value={formData.price}
                      onChange={handleChange}
                      min="1"
                      step="0.01"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bus Type *</Label>
                  <Select
                    value={formData.busType}
                    onValueChange={(v) => handleSelectChange("busType", v)}
                  >
                    <SelectTrigger>
                      <Bus className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUS_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label} - {type.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Seats */}
              <div className="space-y-2">
                <Label>Total Seats *</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    name="totalSlots"
                    placeholder="e.g., 50"
                    value={formData.totalSlots}
                    onChange={handleChange}
                    min={bookedSeats || 1}
                    max="100"
                    className="pl-10"
                    required
                  />
                </div>
                {bookedSeats > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Minimum {bookedSeats} seats (already booked)
                  </p>
                )}
              </div>

              {/* Amenities */}
              <div className="space-y-3">
                <Label>Amenities</Label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.hasWater}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, hasWater: !!checked }))
                      }
                    />
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Water</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.hasFood}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, hasFood: !!checked }))
                      }
                    />
                    <Coffee className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">Snacks/Food</span>
                  </label>
                </div>
              </div>

              {/* Staff Assignment */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Trip Staff Assignment</Label>
                  <span className="text-xs text-muted-foreground">Optional</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Assign or change driver, conductor, and ticketing staff for this trip
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Driver Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="driver" className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-blue-500" />
                      Driver
                    </Label>
                    <Select
                      value={formData.driverId || "__none__"}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, driverId: value === "__none__" ? null : value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select driver" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None assigned</SelectItem>
                        {staff.drivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.name}
                            {driver.licenseNumber && ` (${driver.licenseNumber})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {staff.drivers.length === 0 && (
                      <p className="text-xs text-amber-600">
                        No drivers added yet.{" "}
                        <Link href="/company/staff" className="underline">
                          Add staff
                        </Link>
                      </p>
                    )}
                  </div>

                  {/* Conductor Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="conductor" className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-500" />
                      Conductor
                    </Label>
                    <Select
                      value={formData.conductorId || "__none__"}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, conductorId: value === "__none__" ? null : value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select conductor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None assigned</SelectItem>
                        {staff.conductors.map((conductor) => (
                          <SelectItem key={conductor.id} value={conductor.id}>
                            {conductor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {staff.conductors.length === 0 && (
                      <p className="text-xs text-amber-600">
                        No conductors added yet.{" "}
                        <Link href="/company/staff" className="underline">
                          Add staff
                        </Link>
                      </p>
                    )}
                  </div>

                  {/* Manual Ticketer Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="ticketer" className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-orange-500" />
                      Manual Ticketer
                    </Label>
                    <Select
                      value={formData.manualTicketerId || "__none__"}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, manualTicketerId: value === "__none__" ? null : value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ticketer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None assigned</SelectItem>
                        {staff.ticketers.map((ticketer) => (
                          <SelectItem key={ticketer.id} value={ticketer.id}>
                            {ticketer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {staff.ticketers.length === 0 && (
                      <p className="text-xs text-amber-600">
                        No ticketers added yet.{" "}
                        <Link href="/company/staff" className="underline">
                          Add staff
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Vehicle Assignment */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Vehicle Assignment</Label>
                  <span className="text-xs text-muted-foreground">Optional</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Assign a vehicle to this trip
                </p>

                <div className="space-y-2">
                  <Label htmlFor="vehicle" className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-purple-500" />
                    Vehicle
                  </Label>
                  <Select
                    value={formData.vehicleId || "__none__"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, vehicleId: value === "__none__" ? null : value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None assigned</SelectItem>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.plateNumber}
                          {vehicle.sideNumber && ` (${vehicle.sideNumber})`}
                          {" - "}
                          {vehicle.make} {vehicle.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {vehicles.length === 0 && (
                    <p className="text-xs text-amber-600">
                      No active vehicles found.{" "}
                      <Link href="/company/vehicles" className="underline">
                        Add vehicles
                      </Link>
                    </p>
                  )}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Checkbox
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: !!checked }))
                  }
                />
                <div>
                  <p className="font-medium">Trip Active</p>
                  <p className="text-sm text-muted-foreground">
                    Inactive trips are hidden from search results
                  </p>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
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
import { BUS_TYPES } from "@/lib/utils"

export default function NewTripPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

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
    driverId: null as string | null,
    conductorId: null as string | null,
    manualTicketerId: null as string | null,
    vehicleId: null as string | null,
    overrideStaffConflict: false,
  })
  const [customOrigin, setCustomOrigin] = useState("")
  const [customDestination, setCustomDestination] = useState("")
  const [intermediateStops, setIntermediateStops] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [staffConflictWarning, setStaffConflictWarning] = useState("")
  const [vehicleConflictWarning, setVehicleConflictWarning] = useState("")
  const [overrideVehicleConflict, setOverrideVehicleConflict] = useState(false)
  const [vehicleOverrideReason, setVehicleOverrideReason] = useState("")
  const [cities, setCities] = useState<string[]>([])
  const [staff, setStaff] = useState<{
    drivers: Array<{ id: string; name: string; licenseNumber?: string }>;
    conductors: Array<{ id: string; name: string }>;
    ticketers: Array<{ id: string; name: string }>;
  }>({ drivers: [], conductors: [], ticketers: [] })
  const [vehicles, setVehicles] = useState<Array<{
    id: string;
    plateNumber: string;
    sideNumber: string | null;
    make: string;
    model: string;
    status: string;
    totalSeats: number;
  }>>([])

  // Auto-fill totalSlots when vehicle is selected
  useEffect(() => {
    if (formData.vehicleId) {
      const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId)
      if (selectedVehicle && selectedVehicle.totalSeats) {
        setFormData(prev => ({
          ...prev,
          totalSlots: selectedVehicle.totalSeats.toString()
        }))
      }
    }
  }, [formData.vehicleId, vehicles])

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

  // Redirect if not company admin
  if (status === "authenticated" && session?.user?.role !== "COMPANY_ADMIN") {
    router.push("/")
    return null
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

    setIsSubmitting(true)

    try {
      // Combine date and time
      const departureTime = new Date(`${formData.departureDate}T${formData.departureTime}`)

      // Use custom inputs if "Other" is selected
      const finalOrigin = formData.origin === "__custom__" ? customOrigin.trim() : formData.origin
      const finalDestination = formData.destination === "__custom__" ? customDestination.trim() : formData.destination

      // Validation - check AFTER substituting custom values
      if (!finalOrigin || !finalDestination) {
        setError("Please enter both origin and destination")
        setIsSubmitting(false)
        return
      }

      if (finalOrigin.toLowerCase() === finalDestination.toLowerCase()) {
        setError("Origin and destination cannot be the same")
        setIsSubmitting(false)
        return
      }

      // Validate required staff and vehicle
      if (!formData.driverId) {
        setError("Driver is required for all trips")
        setIsSubmitting(false)
        return
      }

      if (!formData.conductorId) {
        setError("Conductor is required for all trips")
        setIsSubmitting(false)
        return
      }

      if (!formData.vehicleId) {
        setError("Vehicle is required for all trips")
        setIsSubmitting(false)
        return
      }

      // Build route string with intermediate stops
      const route = intermediateStops.length > 0
        ? `${finalOrigin} → ${intermediateStops.join(" → ")} → ${finalDestination}`
        : null

      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: session?.user?.companyId,
          origin: finalOrigin,
          destination: finalDestination,
          route,
          intermediateStops: intermediateStops.length > 0 ? JSON.stringify(intermediateStops) : null,
          departureTime: departureTime.toISOString(),
          estimatedDuration: parseInt(formData.estimatedDuration),
          distance: parseInt(formData.distance),
          price: parseFloat(formData.price),
          busType: formData.busType,
          totalSlots: parseInt(formData.totalSlots),
          hasWater: formData.hasWater,
          hasFood: formData.hasFood,
          driverId: formData.driverId,
          conductorId: formData.conductorId,
          manualTicketerId: formData.manualTicketerId,
          vehicleId: formData.vehicleId,
          overrideStaffConflict: formData.overrideStaffConflict,
          overrideVehicleConflict: overrideVehicleConflict,
          vehicleOverrideReason: vehicleOverrideReason,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push("/company/trips")
      } else {
        // Handle staff conflict with override option
        if (data.canOverride && data.conflicts) {
          setStaffConflictWarning(data.conflicts.join(". "))
          setVehicleConflictWarning("")
          setError("")
        }
        // Handle vehicle conflict with override option
        else if (data.canOverride && data.vehicleConflict) {
          setVehicleConflictWarning(data.error)
          setStaffConflictWarning("")
          setError("")
        } else {
          setError(data.error || "Failed to create trip")
          setStaffConflictWarning("")
          setVehicleConflictWarning("")
        }
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Get tomorrow's date as minimum
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split("T")[0]

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link
          href="/company/trips"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Trips
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-primary" />
              Add New Trip
            </CardTitle>
            <CardDescription>
              Create a new trip schedule for {session?.user?.companyName}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

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
                      <SelectItem value="__custom__">Other (type manually)</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.origin === "__custom__" && (
                    <Input
                      placeholder="Enter custom origin city"
                      value={customOrigin}
                      onChange={(e) => setCustomOrigin(e.target.value)}
                      required
                    />
                  )}
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
                      <SelectItem value="__custom__">Other (type manually)</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.destination === "__custom__" && (
                    <Input
                      placeholder="Enter custom destination city"
                      value={customDestination}
                      onChange={(e) => setCustomDestination(e.target.value)}
                      required
                    />
                  )}
                </div>
              </div>

              {/* Intermediate Stops */}
              <div className="space-y-2">
                <Label>Intermediate Stops (Optional)</Label>
                <p className="text-sm text-muted-foreground">
                  Add cities where the bus stops along the route
                </p>
                {intermediateStops.map((stop, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Stop ${index + 1}`}
                      value={stop}
                      onChange={(e) => {
                        const newStops = [...intermediateStops]
                        newStops[index] = e.target.value
                        setIntermediateStops(newStops)
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setIntermediateStops(intermediateStops.filter((_, i) => i !== index))
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIntermediateStops([...intermediateStops, ""])}
                  className="w-full"
                >
                  + Add Stop
                </Button>
                {intermediateStops.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Route: {formData.origin === "__custom__" ? customOrigin : formData.origin}
                    {intermediateStops.map((s, i) => s && ` → ${s}`)}
                    → {formData.destination === "__custom__" ? customDestination : formData.destination}
                  </p>
                )}
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
                      min={minDate}
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
                  <Label>Distance (km) *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      name="distance"
                      placeholder="e.g., 450"
                      value={formData.distance}
                      onChange={handleChange}
                      min="1"
                      max="5000"
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Route distance in kilometers
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
                    min="1"
                    max="100"
                    className="pl-10"
                    required
                  />
                </div>
                {/* Capacity Mismatch Warning */}
                {(() => {
                  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId)
                  const totalSlots = parseInt(formData.totalSlots)
                  return selectedVehicle && selectedVehicle.totalSeats && totalSlots && totalSlots !== selectedVehicle.totalSeats ? (
                    <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                      <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-orange-900">Capacity Mismatch</p>
                        <p className="text-orange-700">
                          Trip capacity ({totalSlots} seats) doesn't match vehicle capacity ({selectedVehicle.totalSeats} seats)
                        </p>
                      </div>
                    </div>
                  ) : null
                })()}
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
                  <Label className="text-base">Trip Staff Assignment *</Label>
                  <span className="text-xs text-destructive">Required</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Driver and conductor are required for all trips
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Driver Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="driver" className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-blue-500" />
                      Driver *
                    </Label>
                    <Select
                      value={formData.driverId || ""}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, driverId: value || null }))
                      }
                    >
                      <SelectTrigger className={!formData.driverId ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select driver (required)" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.drivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.name}
                            {driver.licenseNumber && ` (${driver.licenseNumber})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {staff.drivers.length === 0 && (
                      <p className="text-xs text-destructive">
                        No drivers available.{" "}
                        <Link href="/company/staff" className="underline">
                          Add staff first
                        </Link>
                      </p>
                    )}
                  </div>

                  {/* Conductor Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="conductor" className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-500" />
                      Conductor *
                    </Label>
                    <Select
                      value={formData.conductorId || ""}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, conductorId: value || null }))
                      }
                    >
                      <SelectTrigger className={!formData.conductorId ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select conductor (required)" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.conductors.map((conductor) => (
                          <SelectItem key={conductor.id} value={conductor.id}>
                            {conductor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {staff.conductors.length === 0 && (
                      <p className="text-xs text-destructive">
                        No conductors available.{" "}
                        <Link href="/company/staff" className="underline">
                          Add staff first
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
                  <Label className="text-base">Vehicle Assignment *</Label>
                  <span className="text-xs text-destructive">Required</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  A vehicle is required for all trips (24hr availability enforced)
                </p>

                <div className="space-y-2">
                  <Label htmlFor="vehicle" className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-purple-500" />
                    Vehicle *
                  </Label>
                  <Select
                    value={formData.vehicleId || ""}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, vehicleId: value || null }))
                    }
                  >
                    <SelectTrigger className={!formData.vehicleId ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select vehicle (required)" />
                    </SelectTrigger>
                    <SelectContent>
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
                    <p className="text-xs text-destructive">
                      No active vehicles available.{" "}
                      <Link href="/company/vehicles" className="underline">
                        Add vehicles first
                      </Link>
                    </p>
                  )}
                </div>
              </div>

              {/* Staff Conflict Warning */}
              {staffConflictWarning && (
                <div className="border border-amber-500 bg-amber-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-amber-900">Staff Scheduling Conflict</h4>
                      <p className="text-sm text-amber-800 mt-1">{staffConflictWarning}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pl-7">
                    <Checkbox
                      id="overrideConflict"
                      checked={formData.overrideStaffConflict}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, overrideStaffConflict: checked as boolean }))
                      }
                    />
                    <label
                      htmlFor="overrideConflict"
                      className="text-sm text-amber-900 cursor-pointer"
                    >
                      I understand and want to override this conflict
                    </label>
                  </div>
                </div>
              )}

              {/* Vehicle Conflict Warning */}
              {vehicleConflictWarning && (
                <div className="border border-orange-500 bg-orange-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-start gap-2">
                    <Truck className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-orange-900">Vehicle Availability Conflict</h4>
                      <p className="text-sm text-orange-800 mt-1">{vehicleConflictWarning}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pl-7">
                    <Checkbox
                      id="overrideVehicleConflict"
                      checked={overrideVehicleConflict}
                      onCheckedChange={(checked) => {
                        setOverrideVehicleConflict(checked as boolean)
                        if (!checked) setVehicleOverrideReason("")
                      }}
                    />
                    <label
                      htmlFor="overrideVehicleConflict"
                      className="text-sm text-orange-900 cursor-pointer"
                    >
                      I want to override this 24-hour availability constraint
                    </label>
                  </div>
                  {overrideVehicleConflict && (
                    <div className="pl-7 space-y-2">
                      <Label htmlFor="vehicleOverrideReason" className="text-sm text-orange-900">
                        Override Reason (required, min 10 characters) *
                      </Label>
                      <textarea
                        id="vehicleOverrideReason"
                        className="w-full p-2 border border-orange-300 rounded-md text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Explain why this vehicle must be used despite the 24-hour constraint..."
                        value={vehicleOverrideReason}
                        onChange={(e) => setVehicleOverrideReason(e.target.value)}
                      />
                      {vehicleOverrideReason.length > 0 && vehicleOverrideReason.length < 10 && (
                        <p className="text-xs text-orange-600">
                          {10 - vehicleOverrideReason.length} more characters required
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

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
                      Creating Trip...
                    </>
                  ) : (
                    "Create Trip"
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

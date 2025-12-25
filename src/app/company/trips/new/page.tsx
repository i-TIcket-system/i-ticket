"use client"

import { useState } from "react"
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
  Coffee
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
import { ETHIOPIAN_CITIES, BUS_TYPES } from "@/lib/utils"

export default function NewTripPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    departureDate: "",
    departureTime: "",
    estimatedDuration: "",
    price: "",
    busType: "standard",
    totalSlots: "",
    hasWater: false,
    hasFood: false,
  })
  const [customOrigin, setCustomOrigin] = useState("")
  const [customDestination, setCustomDestination] = useState("")
  const [intermediateStops, setIntermediateStops] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

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

    // Validation
    if (formData.origin === formData.destination) {
      setError("Origin and destination cannot be the same")
      return
    }

    setIsSubmitting(true)

    try {
      // Combine date and time
      const departureTime = new Date(`${formData.departureDate}T${formData.departureTime}`)

      // Use custom inputs if "Other" is selected
      const finalOrigin = formData.origin === "__custom__" ? customOrigin : formData.origin
      const finalDestination = formData.destination === "__custom__" ? customDestination : formData.destination

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
          price: parseFloat(formData.price),
          busType: formData.busType,
          totalSlots: parseInt(formData.totalSlots),
          hasWater: formData.hasWater,
          hasFood: formData.hasFood,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push("/company/dashboard")
      } else {
        setError(data.error || "Failed to create trip")
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
          href="/company/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
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
                      {ETHIOPIAN_CITIES.map((city) => (
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
                      {ETHIOPIAN_CITIES.filter((c) => c !== formData.origin).map((city) => (
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

              {/* Duration */}
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

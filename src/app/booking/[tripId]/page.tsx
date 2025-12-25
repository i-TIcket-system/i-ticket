"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  Bus,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  CreditCard,
  ArrowLeft,
  Plus,
  Minus,
  Loader2,
  AlertCircle,
  Check,
  Coffee,
  Droplets,
  BadgeCheck,
  Accessibility,
  Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency, formatDuration, formatDate, calculateCommission, BUS_TYPES } from "@/lib/utils"

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
  company: {
    id: string
    name: string
  }
}

interface Passenger {
  name: string
  nationalId: string
  phone: string
  specialNeeds: string
}

const emptyPassenger: Passenger = {
  name: "",
  nationalId: "",
  phone: "",
  specialNeeds: "",
}

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const tripId = params.tripId as string

  const [trip, setTrip] = useState<Trip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState(1) // 1: passengers, 2: review, 3: payment

  const [passengers, setPassengers] = useState<Passenger[]>([{ ...emptyPassenger }])

  useEffect(() => {
    fetchTrip()
  }, [tripId])

  useEffect(() => {
    // Auto-fill first passenger with logged-in user data
    if (session?.user && passengers[0].name === "") {
      setPassengers((prev) => [
        {
          ...prev[0],
          name: session.user.name || "",
          phone: session.user.phone || "",
        },
        ...prev.slice(1),
      ])
    }
  }, [session])

  const fetchTrip = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}`)
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

  const addPassenger = () => {
    if (passengers.length < 5 && trip && passengers.length < trip.availableSlots) {
      setPassengers([...passengers, { ...emptyPassenger }])
    }
  }

  const removePassenger = (index: number) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter((_, i) => i !== index))
    }
  }

  const updatePassenger = (index: number, field: keyof Passenger, value: string) => {
    setPassengers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    )
  }

  const validatePassengers = () => {
    for (const passenger of passengers) {
      if (!passenger.name || !passenger.nationalId || !passenger.phone) {
        return false
      }
    }
    return true
  }

  const calculateTotal = () => {
    if (!trip) return { subtotal: 0, commission: 0, total: 0 }
    const subtotal = Number(trip.price) * passengers.length
    const commission = calculateCommission(subtotal)
    return {
      subtotal,
      commission,
      total: subtotal + commission,
    }
  }

  const handleBooking = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=/booking/${tripId}`)
      return
    }

    if (!validatePassengers()) {
      setError("Please fill in all required passenger details")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const { subtotal, commission, total } = calculateTotal()

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          passengers,
          totalAmount: subtotal,
          commission,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to payment page
        router.push(`/payment/${data.booking.id}`)
      } else {
        setError(data.error || "Booking failed")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
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
          <Link href="/search">
            <Button>Back to Search</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const { subtotal, commission, total } = calculateTotal()
  const maxPassengers = Math.min(5, trip.availableSlots)

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/search?from=${trip.origin}&to=${trip.destination}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to search results
          </Link>

          <h1 className="text-2xl font-bold">Complete Your Booking</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Summary */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bus className="h-5 w-5 text-primary" />
                      {trip.company.name}
                    </CardTitle>
                    <CardDescription>
                      {formatDate(trip.departureTime)}
                    </CardDescription>
                  </div>
                  <Badge>
                    {BUS_TYPES.find((t) => t.value === trip.busType)?.label || trip.busType}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-xl font-bold">
                      {new Date(trip.departureTime).toLocaleTimeString("en-ET", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground">{trip.origin}</div>
                  </div>

                  <div className="flex-1 flex items-center gap-2 px-4">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1 border-t-2 border-dashed border-muted-foreground/30" />
                    <div className="px-2 text-xs text-muted-foreground">
                      {formatDuration(trip.estimatedDuration)}
                    </div>
                    <div className="flex-1 border-t-2 border-dashed border-muted-foreground/30" />
                    <div className="h-2 w-2 rounded-full bg-accent" />
                  </div>

                  <div className="text-center">
                    <div className="text-xl font-bold">
                      {new Date(
                        new Date(trip.departureTime).getTime() + trip.estimatedDuration * 60000
                      ).toLocaleTimeString("en-ET", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground">{trip.destination}</div>
                  </div>
                </div>

                {(trip.hasWater || trip.hasFood) && (
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t">
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
                )}
              </CardContent>
            </Card>

            {/* Passenger Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Passenger Details
                    </CardTitle>
                    <CardDescription>
                      {passengers.length} of {maxPassengers} passengers (max 5 per booking)
                    </CardDescription>
                  </div>
                  {passengers.length < maxPassengers && (
                    <Button variant="outline" size="sm" onClick={addPassenger}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Passenger
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                {passengers.map((passenger, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Passenger {index + 1}</h4>
                      {passengers.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePassenger(index)}
                        >
                          <Minus className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="As shown on ID"
                            value={passenger.name}
                            onChange={(e) => updatePassenger(index, "name", e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>National ID / Passport *</Label>
                        <div className="relative">
                          <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="ID number"
                            value={passenger.nationalId}
                            onChange={(e) => updatePassenger(index, "nationalId", e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Phone Number *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="09XXXXXXXX"
                            value={passenger.phone}
                            onChange={(e) => updatePassenger(index, "phone", e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Special Needs</Label>
                        <Select
                          value={passenger.specialNeeds}
                          onValueChange={(v) => updatePassenger(index, "specialNeeds", v)}
                        >
                          <SelectTrigger>
                            <Accessibility className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="wheelchair">Wheelchair</SelectItem>
                            <SelectItem value="visual">Visual Assistance</SelectItem>
                            <SelectItem value="hearing">Hearing Assistance</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Price Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Price Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {formatCurrency(Number(trip.price))} x {passengers.length} passenger{passengers.length > 1 ? "s" : ""}
                  </span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service fee (5%)</span>
                  <span>{formatCurrency(commission)}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>

                <div className="text-xs text-muted-foreground">
                  Price includes all taxes and fees. Payment via TeleBirr.
                </div>

                {status === "unauthenticated" ? (
                  <Link href={`/login?callbackUrl=/booking/${tripId}`}>
                    <Button className="w-full">
                      Login to Continue
                    </Button>
                  </Link>
                ) : (
                  <Button
                    className="w-full"
                    onClick={handleBooking}
                    disabled={isSubmitting || !validatePassengers()}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Continue to Payment
                      </>
                    )}
                  </Button>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  Instant confirmation
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

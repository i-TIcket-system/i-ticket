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
  Users,
  Baby,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PhoneInput } from "@/components/ui/phone-input"
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
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { formatCurrency, formatDuration, formatDate, calculateCommission, BUS_TYPES } from "@/lib/utils"
import { SeatMap } from "@/components/booking/SeatMap"

interface Trip {
  id: string
  origin: string
  destination: string
  route: string | null
  intermediateStops: string | null
  departureTime: string
  estimatedDuration: number
  distance: number | null
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
  pickupLocation?: string
  dropoffLocation?: string
  isChild?: boolean
}

const emptyPassenger: Passenger = {
  name: "",
  nationalId: "",
  phone: "",
  specialNeeds: "",
  pickupLocation: "",
  dropoffLocation: "",
  isChild: false,
}

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const tripId = params.tripId as string

  const [trip, setTrip] = useState<Trip | null>(null)
  const [originalPrice, setOriginalPrice] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1) // 1: passengers, 2: review, 3: payment

  const [passengers, setPassengers] = useState<Passenger[]>([{ ...emptyPassenger }])
  const [passengerToRemove, setPassengerToRemove] = useState<number | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<number[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchTrip()
  }, [tripId])

  // Prevent company admins from booking trips
  useEffect(() => {
    if (status === "authenticated" && (session?.user?.role === "COMPANY_ADMIN" || session?.user?.role === "SUPER_ADMIN")) {
      toast.error("Company admins cannot book trips", {
        description: "Please use a customer account to make bookings"
      })
      router.push("/search")
    }
  }, [status, session, router])

  useEffect(() => {
    // Restore passenger data from localStorage
    const savedPassengers = localStorage.getItem(`booking-${tripId}-passengers`)

    if (savedPassengers) {
      try {
        const parsedPassengers = JSON.parse(savedPassengers)

        // Only restore if passengers array is currently empty/default
        if (passengers.length === 1 && passengers[0].name === "") {
          setPassengers(parsedPassengers)

          // Clean up localStorage only for logged-in users (guests need it for back navigation)
          if (session?.user) {
            localStorage.removeItem(`booking-${tripId}-passengers`)
            toast.success("Your passenger information has been restored")
          }
        }
      } catch (error) {
        console.error("Error restoring passenger data:", error)
      }
    } else if (session?.user && passengers[0].name === "") {
      // Auto-fill first passenger with logged-in user data
      setPassengers((prev) => [
        {
          ...prev[0],
          name: session.user.name || "",
          phone: session.user.phone || "",
        },
        ...prev.slice(1),
      ])
    }
  }, [session, tripId])

  const fetchTrip = async (silent = false) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`)
      const data = await response.json()

      if (response.ok) {
        const newTrip = data.trip

        // P1: Real-time price change detection
        if (trip && originalPrice !== null && newTrip.price !== originalPrice) {
          toast.error("Price Changed!", {
            description: `Trip price updated from ${formatCurrency(originalPrice)} to ${formatCurrency(newTrip.price)}. Please review your booking.`
          })
        }

        setTrip(newTrip)

        // Set original price on first load
        if (originalPrice === null) {
          setOriginalPrice(newTrip.price)
        }
      } else {
        if (!silent) {
          toast.error(data.error || "Trip not found")
        }
      }
    } catch (err) {
      if (!silent) {
        toast.error("Failed to load trip details")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // P1-SEC-004: Poll for price changes with tab visibility check (prevents DoS)
  useEffect(() => {
    if (!trip) return

    let interval: NodeJS.Timeout | null = null

    const startPolling = () => {
      if (interval) clearInterval(interval)
      interval = setInterval(() => {
        fetchTrip(true) // Silent fetch to avoid duplicate error toasts
      }, 30000) // 30 seconds
    }

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
    }

    // Handle tab visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling() // Pause polling when tab is hidden
      } else {
        startPolling() // Resume polling when tab becomes visible
      }
    }

    // Start polling if tab is visible
    if (!document.hidden) {
      startPolling()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      stopPolling()
    }
  }, [trip, tripId, originalPrice])

  const addPassenger = () => {
    if (passengers.length < 5 && trip && passengers.length < trip.availableSlots) {
      setPassengers([...passengers, { ...emptyPassenger }])
    }
  }

  const confirmRemovePassenger = () => {
    if (passengerToRemove !== null && passengers.length > 1) {
      setPassengers(passengers.filter((_, i) => i !== passengerToRemove))
      toast.success("Passenger removed")
      setPassengerToRemove(null)
    }
  }

  const updatePassenger = (index: number, field: keyof Passenger, value: string) => {
    setPassengers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    )
  }

  const validatePassengers = () => {
    const errors: Record<string, string> = {}

    // First passenger must NOT be a child (needed for payment contact)
    if (passengers[0]?.isChild) {
      errors["passenger-0-child"] = "First passenger must be an adult (payment contact)"
    }

    for (let i = 0; i < passengers.length; i++) {
      const passenger = passengers[i]

      // All passengers need a name
      if (!passenger.name || passenger.name.trim() === "") {
        errors[`passenger-${i}-name`] = "Name is required"
      }

      // Non-child passengers need ID and phone
      // First passenger always needs ID and phone (for booking contact)
      if (!passenger.isChild || i === 0) {
        if (!passenger.nationalId || passenger.nationalId.trim() === "") {
          errors[`passenger-${i}-nationalId`] = "ID is required"
        }
        if (!passenger.phone || passenger.phone.trim() === "") {
          errors[`passenger-${i}-phone`] = "Phone is required"
        }
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
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
    // Validate passengers first (works for both logged-in and guest users)
    if (!validatePassengers()) {
      toast.error("Please fill in all required passenger details")
      return
    }

    // Save passenger data to localStorage in case user wants to go back
    localStorage.setItem(`booking-${tripId}-passengers`, JSON.stringify(passengers))

    // Guest checkout is allowed - no login required!
    // The API will create a guest user account automatically
    // Payment phone is clearly shown in the persistent banner above the payment button

    setIsSubmitting(true)

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
          selectedSeats: selectedSeats.length > 0 ? selectedSeats : undefined, // Optional: auto-assign if not selected
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Booking created! Redirecting to payment...")
        // Redirect to payment page
        router.push(`/payment/${data.booking.id}`)
      } else {
        toast.error(data.error || "Booking failed")
      }
    } catch (err) {
      toast.error("An unexpected error occurred")
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
          <p className="text-muted-foreground mb-4">The trip you're looking for doesn't exist or has been removed.</p>
          <Link href="/search">
            <Button variant="outline">Back to Search</Button>
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
                    <div className="px-2 text-xs text-muted-foreground text-center">
                      {formatDuration(trip.estimatedDuration)}
                      {trip.distance && (
                        <div className="text-[10px] text-muted-foreground/70">
                          {trip.distance} km
                        </div>
                      )}
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

                {trip.route && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Route:</span>
                      <span className="text-sm font-medium">{trip.route}</span>
                    </div>
                  </div>
                )}

                {(trip.hasWater || trip.hasFood) && (
                  <div className={`flex items-center gap-4 mt-4 pt-4 ${!trip.route ? 'border-t' : ''}`}>
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
                {passengers.map((passenger, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        {index === 0 ? (
                          <span className="flex items-center gap-2">
                            Passenger 1
                            <span className="text-xs font-normal text-muted-foreground bg-primary/10 px-2 py-0.5 rounded">
                              Primary Contact (Adult/Guardian)
                            </span>
                          </span>
                        ) : (
                          `Passenger ${index + 1}`
                        )}
                      </h4>
                      <div className="flex items-center gap-3">
                        {/* Child toggle - only for passengers 2+ (first must be adult/guardian) */}
                        {index > 0 && (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={passenger.isChild || false}
                              onCheckedChange={(checked) => {
                                setPassengers((prev) =>
                                  prev.map((p, i) =>
                                    i === index
                                      ? {
                                          ...p,
                                          isChild: checked as boolean,
                                          // Clear ID and phone when marking as child
                                          nationalId: checked ? "" : p.nationalId,
                                          phone: checked ? "" : p.phone,
                                        }
                                      : p
                                  )
                                )
                              }}
                            />
                            <span className="text-sm flex items-center gap-1">
                              <Baby className="h-4 w-4 text-pink-500" />
                              Child
                            </span>
                          </label>
                        )}
                        {passengers.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPassengerToRemove(index)}
                          >
                            <Minus className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* First passenger note - must be adult/guardian */}
                    {index === 0 && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-md text-sm">
                        <User className="h-4 w-4" />
                        Adult/Guardian required for booking contact &amp; payment
                      </div>
                    )}

                    {/* Child badge indicator */}
                    {passenger.isChild && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-pink-50 text-pink-700 rounded-md text-sm">
                        <Baby className="h-4 w-4" />
                        Child passenger - ID and phone not required
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={passenger.isChild ? "Child's name" : "As shown on ID"}
                            value={passenger.name}
                            onChange={(e) => {
                              updatePassenger(index, "name", e.target.value)
                              // Clear error when user types
                              if (validationErrors[`passenger-${index}-name`]) {
                                setValidationErrors((prev) => {
                                  const newErrors = { ...prev }
                                  delete newErrors[`passenger-${index}-name`]
                                  return newErrors
                                })
                              }
                            }}
                            className={`pl-10 ${validationErrors[`passenger-${index}-name`] ? "border-destructive" : ""}`}
                            required
                            aria-invalid={!!validationErrors[`passenger-${index}-name`]}
                            aria-describedby={validationErrors[`passenger-${index}-name`] ? `passenger-${index}-name-error` : undefined}
                          />
                        </div>
                        {validationErrors[`passenger-${index}-name`] && (
                          <p id={`passenger-${index}-name-error`} className="text-xs text-destructive" role="alert" aria-live="polite">
                            {validationErrors[`passenger-${index}-name`]}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>
                          National ID / Passport {passenger.isChild ? "(Optional)" : "*"}
                        </Label>
                        <div className="relative">
                          <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={passenger.isChild ? "Not required for children" : "ID number"}
                            value={passenger.nationalId}
                            onChange={(e) => updatePassenger(index, "nationalId", e.target.value)}
                            className="pl-10"
                            disabled={passenger.isChild}
                            required={!passenger.isChild}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Phone Number {passenger.isChild ? "(Optional)" : "*"}
                        </Label>
                        <PhoneInput
                          value={passenger.phone}
                          onChange={(value) => updatePassenger(index, "phone", value)}
                          disabled={passenger.isChild}
                          required={!passenger.isChild}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Pickup Location (Optional)</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="e.g., Meskel Square, Bole Airport"
                            value={passenger.pickupLocation || ""}
                            onChange={(e) => updatePassenger(index, "pickupLocation", e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Where should the bus pick you up along the route?
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Dropoff Location (Optional)</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="e.g., City Center, Bus Station"
                            value={passenger.dropoffLocation || ""}
                            onChange={(e) => updatePassenger(index, "dropoffLocation", e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Where should the bus drop you off?
                        </p>
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

            {/* Seat Selection */}
            <SeatMap
              tripId={tripId}
              passengerCount={passengers.length}
              onSeatsSelected={setSelectedSeats}
            />
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

                {/* Selected Seats Summary */}
                {selectedSeats.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Selected Seats:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSeats.map((seat) => (
                          <Badge key={seat} variant="secondary" className="bg-blue-500 text-white">
                            {seat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="text-xs text-muted-foreground">
                  Price includes all taxes and fees. Payment via TeleBirr.
                  {status === "unauthenticated" && (
                    <span className="block mt-2 text-primary font-medium">
                      No account needed - book as guest!
                    </span>
                  )}
                </div>

                {/* Payment Phone Clarity Banner */}
                {passengers.length > 0 && passengers[0].phone && (
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-900">
                          TeleBirr Payment Request
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          Will be sent to: <span className="font-semibold">{passengers[0].phone}</span>
                          {passengers.length > 1 && (
                            <span className="text-blue-600"> (Passenger 1 - Primary Contact)</span>
                          )}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Make sure this number has TeleBirr enabled
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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

                {status === "unauthenticated" && (
                  <p className="text-xs text-center text-muted-foreground">
                    Have an account?{" "}
                    <Link href={`/login?callbackUrl=/booking/${tripId}`} className="text-primary hover:underline">
                      Login here
                    </Link>
                  </p>
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

      {/* Passenger Removal Confirmation Dialog */}
      <AlertDialog open={passengerToRemove !== null} onOpenChange={() => setPassengerToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Passenger?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove Passenger {passengerToRemove !== null ? passengerToRemove + 1 : ''}?
              This will also remove any information you&apos;ve entered for this passenger.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemovePassenger} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

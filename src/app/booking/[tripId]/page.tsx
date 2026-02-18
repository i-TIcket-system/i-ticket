"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
  CheckCircle2,
  Info
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
import { formatCurrency, formatDuration, formatDate, BUS_TYPES } from "@/lib/utils"
import { calculateBookingAmounts } from "@/lib/commission"
import { SeatMap } from "@/components/booking/SeatMap"
import { BookingPageSkeleton } from "@/components/skeletons/TripCardSkeleton"
import { RouteStopCombobox } from "@/components/ui/route-stop-combobox"
import { PickupMapModal } from "@/components/booking/PickupMapModal"

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
  defaultPickup: string | null
  defaultDropoff: string | null
  company: {
    id: string
    name: string
  }
}

interface Passenger {
  name: string
  phone: string
  specialNeeds: string
  pickupLocation?: string
  dropoffLocation?: string
  isChild?: boolean
}

const emptyPassenger: Passenger = {
  name: "",
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
  const [priceChanged, setPriceChanged] = useState(false) // UX-2: Block submission on price change
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1) // 1: passengers, 2: review, 3: payment

  const [passengers, setPassengers] = useState<Passenger[]>([{ ...emptyPassenger }])
  const [passengerToRemove, setPassengerToRemove] = useState<number | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<number[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Route stops for autocomplete + map modal
  const routeStops = useMemo(() => {
    if (!trip) return []
    const stops = [trip.origin]
    if (trip.intermediateStops) {
      try { stops.push(...JSON.parse(trip.intermediateStops)) } catch { /* ignore */ }
    }
    stops.push(trip.destination)
    return stops
  }, [trip])

  const [mapModal, setMapModal] = useState<{
    open: boolean
    passengerIndex: number
    field: "pickupLocation" | "dropoffLocation"
  } | null>(null)

  // Memoize callback to prevent infinite loop in SeatMap useEffect (fix from commit 98ce741)
  const handleSeatsSelected = useCallback((seats: number[]) => {
    setSelectedSeats(seats)
  }, [])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session]) // router omitted - it's unstable and causes infinite loops

  useEffect(() => {
    // P2-SEC-006: Use sessionStorage instead of localStorage for passenger data (privacy)
    const savedPassengers = sessionStorage.getItem(`booking-${tripId}-passengers`)

    if (savedPassengers) {
      try {
        const parsedPassengers = JSON.parse(savedPassengers)

        // Only restore if passengers array is currently empty/default
        if (passengers.length === 1 && passengers[0].name === "") {
          setPassengers(parsedPassengers)

          // Clean up localStorage only for logged-in users (guests need it for back navigation)
          if (session?.user) {
            sessionStorage.removeItem(`booking-${tripId}-passengers`)
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

        // P1: Real-time price change detection - UX-2: Block submission on price change
        if (trip && originalPrice !== null && newTrip.price !== originalPrice) {
          setPriceChanged(true)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]) // Only depend on tripId, not trip/originalPrice to prevent loop

  const addPassenger = () => {
    if (passengers.length < 5 && trip && passengers.length < trip.availableSlots) {
      setPassengers([...passengers, {
        ...emptyPassenger,
        pickupLocation: trip.defaultPickup || "",
        dropoffLocation: trip.defaultDropoff || "",
      }])
    }
  }

  // Pre-fill first passenger pickup/dropoff when trip loads with defaults
  useEffect(() => {
    if (trip?.defaultPickup || trip?.defaultDropoff) {
      setPassengers(prev => prev.map(p => ({
        ...p,
        pickupLocation: p.pickupLocation || trip.defaultPickup || "",
        dropoffLocation: p.dropoffLocation || trip.defaultDropoff || "",
      })))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.defaultPickup, trip?.defaultDropoff])

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

      // Non-child passengers need phone (ID is optional - verified at boarding)
      // First passenger always needs phone (for booking contact)
      if (!passenger.isChild || i === 0) {
        if (!passenger.phone || passenger.phone.trim() === "") {
          errors[`passenger-${i}-phone`] = "Phone is required"
        }
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const calculateTotal = () => {
    if (!trip) return {
      ticketTotal: 0,
      baseCommission: 0,
      commissionVAT: 0,
      totalCommission: 0,
      total: 0
    }

    const amounts = calculateBookingAmounts(Number(trip.price), passengers.length)

    return {
      ticketTotal: amounts.ticketTotal,  // e.g., 850 ETB
      baseCommission: amounts.commission.baseCommission,  // e.g., 42.5 ETB
      commissionVAT: amounts.commission.vat,  // e.g., 6.375 ETB
      totalCommission: amounts.commission.totalCommission,  // e.g., 48.875 ETB
      total: amounts.totalAmount,  // e.g., 898.875 ETB
    }
  }

  const handleBooking = async () => {
    // Validate passengers first (works for both logged-in and guest users)
    if (!validatePassengers()) {
      toast.error("Please fill in all required passenger details")
      return
    }

    // Save passenger data to localStorage in case user wants to go back
    sessionStorage.setItem(`booking-${tripId}-passengers`, JSON.stringify(passengers))

    // Guest checkout is allowed - no login required!
    // The API will create a guest user account automatically
    // Payment phone is clearly shown in the persistent banner above the payment button

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          passengers,
          // Note: totalAmount and commission are calculated server-side for security
          selectedSeats: selectedSeats.length > 0 ? selectedSeats : undefined, // Optional: auto-assign if not selected
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Booking created! Redirecting to payment...")
        // Keep sessionStorage for back-button navigation
        // It will be cleared when user starts a new booking or completes payment
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
    return <BookingPageSkeleton />
  }

  if (!trip) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Card className="max-w-md p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Trip Not Found</h2>
          <p className="text-muted-foreground mb-4">The trip you're looking for doesn't exist or has been removed.</p>
          <Button variant="outline" asChild>
            <Link href="/search">Back to Search</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const { ticketTotal, baseCommission, commissionVAT, totalCommission, total } = calculateTotal()
  const maxPassengers = Math.min(5, trip.availableSlots)

  return (
    <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden">
      {/* Darker background - half strength of homepage hero (same as search page) */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0d7a7a]/50 via-[#0e9494]/40 to-[#20c4c4]/30 -z-10" />
      <div className="fixed inset-0 bg-pattern-tilahun-glass opacity-15 -z-10" />

      {/* Floating gradient orbs for depth */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-gradient-radial from-[#20c4c4]/20 to-transparent rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-20 left-20 w-80 h-80 bg-gradient-radial from-[#0e9494]/15 to-transparent rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4 py-8">
        {/* Header - Glass Style */}
        <div className="mb-8">
          <Link
            href={`/search?from=${trip.origin}&to=${trip.destination}`}
            className="inline-flex items-center text-sm glass-subtle rounded-full px-4 py-2 mb-6 border border-white/20 hover:glass-moderate transition-all duration-300 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
            Back to search results
          </Link>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl glass-teal flex items-center justify-center shadow-lg">
              <Bus className="h-6 w-6 text-primary flex-shrink-0" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white drop-shadow-lg">Complete Your Booking</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Summary - GLASS DRAMATIC */}
            <Card className="glass-dramatic border-white/10 shadow-glass-lg overflow-hidden group">
              {/* Teal accent line */}
              <div className="h-1 bg-gradient-to-r from-teal-medium to-teal-light shadow-lg shadow-primary/50" />

              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <div className="h-10 w-10 rounded-xl glass-teal flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <Bus className="h-5 w-5 text-primary flex-shrink-0" />
                      </div>
                      <span className="font-display">{trip.company.name}</span>
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                      {formatDate(trip.departureTime)}
                    </CardDescription>
                  </div>
                  <Badge className="bg-primary/10 border-primary/30 text-primary font-semibold">
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

                {(trip.defaultPickup || trip.defaultDropoff) && (
                  <div className="mt-4 pt-4 border-t p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm font-semibold">Standard Terminals</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {trip.defaultPickup && (
                        <div>
                          <span className="text-muted-foreground">Boarding: </span>
                          <span className="font-medium">{trip.defaultPickup}</span>
                        </div>
                      )}
                      {trip.defaultDropoff && (
                        <div>
                          <span className="text-muted-foreground">Alighting: </span>
                          <span className="font-medium">{trip.defaultDropoff}</span>
                        </div>
                      )}
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

            {/* Passenger Details - Glassmorphism with teal accents on required fields */}
            <Card className="glass-dramatic border-white/20 shadow-glass-lg overflow-hidden">
              {/* Teal accent line */}
              <div className="h-1.5 bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-400" />

              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl font-display text-foreground">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-md">
                        <Users className="h-5 w-5 text-white flex-shrink-0" />
                      </div>
                      Passenger Details
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {passengers.length} of {maxPassengers} passengers (max 5 per booking)
                    </CardDescription>
                  </div>
                  {passengers.length < maxPassengers && (
                    <Button variant="outline" size="sm" onClick={addPassenger} className="border-teal-400 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/50">
                      <Plus className="h-4 w-4 mr-1 flex-shrink-0" />
                      Add Passenger
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {passengers.map((passenger, index) => (
                  <div key={index} className="bg-white dark:bg-gray-900 p-5 border-2 border-teal-200 dark:border-teal-700 rounded-xl space-y-4 shadow-lg hover:shadow-xl transition-all duration-300">
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
                                          // Clear phone when marking as child
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
                      {/* Name Field - Solid Teal Styling (No Glassmorphism) */}
                      <div className={`space-y-2 p-4 rounded-lg border-2 transition-all ${
                        validationErrors[`passenger-${index}-name`]
                          ? "bg-destructive/5 border-destructive"
                          : "bg-teal-50 dark:bg-teal-950/50 border-teal-400 dark:border-teal-600"
                      }`}>
                        <Label className="text-base font-semibold flex items-center gap-2 text-teal-800 dark:text-teal-200">
                          <User className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                          Full Name
                          <span className="text-destructive">*</span>
                        </Label>
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
                          className={`text-lg font-medium h-12 bg-white dark:bg-gray-900 ${
                            validationErrors[`passenger-${index}-name`]
                              ? "border-destructive border-2 bg-destructive/5"
                              : "border-teal-300 dark:border-teal-700 focus:border-teal-500 focus:ring-teal-500/20"
                          }`}
                          required
                          aria-invalid={!!validationErrors[`passenger-${index}-name`]}
                          aria-describedby={validationErrors[`passenger-${index}-name`] ? `passenger-${index}-name-error` : undefined}
                        />
                        {validationErrors[`passenger-${index}-name`] && (
                          <p id={`passenger-${index}-name-error`} className="text-sm text-destructive font-medium" role="alert" aria-live="polite">
                            {validationErrors[`passenger-${index}-name`]}
                          </p>
                        )}
                      </div>

                      {/* Phone Field - Solid Teal Styling (No Glassmorphism) */}
                      <div className={`space-y-2 p-4 rounded-lg border-2 transition-all ${
                        validationErrors[`passenger-${index}-phone`]
                          ? "bg-destructive/5 border-destructive"
                          : passenger.isChild
                            ? "bg-muted/30 border-muted"
                            : "bg-teal-50 dark:bg-teal-950/50 border-teal-400 dark:border-teal-600"
                      }`}>
                        <Label className={`text-base font-semibold flex items-center gap-2 ${passenger.isChild ? "" : "text-teal-800 dark:text-teal-200"}`}>
                          <Phone className={`h-4 w-4 ${passenger.isChild ? "text-muted-foreground" : "text-teal-600 dark:text-teal-400"}`} />
                          Phone Number
                          {!passenger.isChild && <span className="text-destructive">*</span>}
                          {passenger.isChild && <span className="text-muted-foreground text-sm font-normal">(Optional)</span>}
                        </Label>
                        <PhoneInput
                          value={passenger.phone}
                          onChange={(value) => {
                            updatePassenger(index, "phone", value)
                            // Clear error when user types
                            if (validationErrors[`passenger-${index}-phone`]) {
                              setValidationErrors((prev) => {
                                const newErrors = { ...prev }
                                delete newErrors[`passenger-${index}-phone`]
                                return newErrors
                              })
                            }
                          }}
                          disabled={passenger.isChild}
                          required={!passenger.isChild}
                          error={validationErrors[`passenger-${index}-phone`]}
                        />
                      </div>

                      {/* ID Verification Note */}
                      {!passenger.isChild && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md md:col-span-2">
                          <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
                          <p>You'll need to show ID matching your name when boarding</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>
                          Pickup Location{" "}
                          {trip.defaultPickup
                            ? <span className="text-emerald-600 font-normal">(Standard: {trip.defaultPickup})</span>
                            : <span className="text-muted-foreground font-normal">(Optional)</span>}
                        </Label>
                        <RouteStopCombobox
                          value={passenger.pickupLocation || ""}
                          onChange={(v) => updatePassenger(index, "pickupLocation", v)}
                          routeStops={routeStops}
                          placeholder={trip.defaultPickup || "e.g., Meskel Square, Bole Airport"}
                          onOpenMap={() => setMapModal({ open: true, passengerIndex: index, field: "pickupLocation" })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Where should the bus pick you up along the route?
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Dropoff Location{" "}
                          {trip.defaultDropoff
                            ? <span className="text-emerald-600 font-normal">(Standard: {trip.defaultDropoff})</span>
                            : <span className="text-muted-foreground font-normal">(Optional)</span>}
                        </Label>
                        <RouteStopCombobox
                          value={passenger.dropoffLocation || ""}
                          onChange={(v) => updatePassenger(index, "dropoffLocation", v)}
                          routeStops={routeStops}
                          placeholder={trip.defaultDropoff || "e.g., City Center, Bus Station"}
                          onOpenMap={() => setMapModal({ open: true, passengerIndex: index, field: "dropoffLocation" })}
                        />
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
              onSeatsSelected={handleSeatsSelected}
            />

            {/* UX-1: Show auto-assign notice when no seats selected */}
            {selectedSeats.length === 0 && passengers.length > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                    No seats selected
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Seats will be automatically assigned for your {passengers.length} passenger{passengers.length > 1 ? 's' : ''}.
                    Click seats above to choose specific ones.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Price Summary Sidebar - GLASS DRAMATIC STICKY */}
          <div className="lg:col-span-1">
            <Card className="glass-dramatic border-white/10 shadow-glass-lg sticky top-4 md:top-20 lg:top-24 overflow-hidden">
              {/* Teal accent line */}
              <div className="h-1 bg-gradient-to-r from-teal-light to-teal-medium shadow-lg shadow-primary/50" />

              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <div className="h-8 w-8 rounded-lg glass-teal flex items-center justify-center shadow-md">
                    <CreditCard className="h-4 w-4 text-primary flex-shrink-0" />
                  </div>
                  Price Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="glass-subtle rounded-xl p-4 border border-white/25">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-300 text-sm">
                      {formatCurrency(Number(trip.price))} x {passengers.length} passenger{passengers.length > 1 ? "s" : ""}
                    </span>
                    <span className="font-semibold">{formatCurrency(ticketTotal)}</span>
                  </div>

                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-300">i-Ticket service charge (5%)</span>
                    <span className="font-medium">{formatCurrency(baseCommission)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">VAT on service charge (15%)</span>
                    <span className="font-medium">{formatCurrency(commissionVAT)}</span>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* TOTAL - Glass Theme with Better Contrast */}
                <div className="glass-dramatic rounded-2xl p-5 border-2 border-white/30 shadow-glass-lg bg-gradient-to-r from-[#0d4f5c]/40 via-[#0e9494]/30 to-[#0d4f5c]/40">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground font-semibold text-lg">Total</span>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-foreground drop-shadow-md">
                        {formatCurrency(total)}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">incl. taxes & fees</div>
                    </div>
                  </div>
                </div>

                {/* Selected Seats Summary - Glass Enhanced */}
                {selectedSeats.length > 0 && (
                  <>
                    <Separator className="bg-white/10" />
                    <div className="glass-subtle rounded-xl p-4 border border-white/20 space-y-3">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        Selected Seats:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedSeats.map((seat) => (
                          <Badge key={seat} className="glass-button text-white px-3 py-1.5 shadow-md">
                            {seat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Price includes all taxes and fees. Payment via TeleBirr.
                  {status === "unauthenticated" && (
                    <span className="block mt-2 text-primary font-semibold">
                      No account needed - book as guest!
                    </span>
                  )}
                </div>

                {/* Payment Phone Clarity Banner - Glass Style */}
                {passengers.length > 0 && passengers[0].phone && (
                  <div className="glass-subtle rounded-xl p-4 border border-blue-200/30">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg glass-teal flex items-center justify-center flex-shrink-0">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          TeleBirr Payment Request
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Will be sent to: <span className="font-semibold text-primary">{passengers[0].phone}</span>
                          {passengers.length > 1 && (
                            <span className="text-muted-foreground"> (Passenger 1 - Primary Contact)</span>
                          )}
                        </p>
                        <p className="text-xs text-primary mt-1 font-medium">
                          Make sure this number has TeleBirr enabled
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* UX-2: Show warning banner when price changed - Glass Style */}
                {priceChanged && (
                  <div className="glass-subtle rounded-xl p-4 border border-amber-200/30 space-y-3">
                    <p className="text-sm text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      Price has changed
                    </p>
                    <p className="text-xs text-muted-foreground">
                      The trip price was updated while you were booking. Please review the new total above.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full glass-subtle border-white/30 hover:glass-moderate"
                      onClick={() => {
                        setPriceChanged(false)
                        setOriginalPrice(trip?.price || null)
                        toast.success("New price confirmed")
                      }}
                    >
                      Accept New Price
                    </Button>
                  </div>
                )}

                <Button
                  className="w-full h-12 glass-button shadow-glass-md hover:shadow-glass-lg text-base font-medium"
                  onClick={handleBooking}
                  disabled={isSubmitting || priceChanged}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : priceChanged ? (
                    <>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Accept Price Change First
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

      {/* Pickup/Dropoff Map Selection Modal */}
      {mapModal && (
        <PickupMapModal
          open={mapModal.open}
          onClose={() => setMapModal(null)}
          routeStops={routeStops}
          title={mapModal.field === "pickupLocation" ? "Select Pickup Location" : "Select Dropoff Location"}
          onSelect={(locationName) => {
            updatePassenger(mapModal.passengerIndex, mapModal.field, locationName)
            setMapModal(null)
          }}
        />
      )}

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

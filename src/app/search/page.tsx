"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  Bus,
  MapPin,
  Calendar,
  Clock,
  Users,
  Filter,
  ArrowRight,
  Loader2,
  Coffee,
  Droplets,
  Search,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { CityCombobox } from "@/components/ui/city-combobox"
import { getAllCities } from "@/lib/ethiopian-cities"
import { formatCurrency, formatDuration, BUS_TYPES } from "@/lib/utils"
import { TripComparison } from "@/components/search/TripComparison"
import { Checkbox } from "@/components/ui/checkbox"

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
  status: string // SCHEDULED, BOARDING, DEPARTED, COMPLETED, CANCELLED
  company: {
    id: string
    name: string
  }
}

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [cities, setCities] = useState<string[]>([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 })
  const [selectedTripsForComparison, setSelectedTripsForComparison] = useState<string[]>([])
  const [showComparison, setShowComparison] = useState(false)

  // Search filters
  const [origin, setOrigin] = useState(searchParams.get("from") || "")
  const [destination, setDestination] = useState(searchParams.get("to") || "")
  const [date, setDate] = useState(searchParams.get("date") || "")
  const [busType, setBusType] = useState(searchParams.get("type") || "")
  const [sortBy, setSortBy] = useState("departureTime")

  const today = new Date().toISOString().split("T")[0]

  // Check if user is a company admin (not allowed to book)
  const isCompanyAdmin = session?.user?.role === "COMPANY_ADMIN" || session?.user?.role === "SUPER_ADMIN"

  // Fetch cities from API and merge with static Ethiopian cities
  useEffect(() => {
    async function fetchCities() {
      try {
        const response = await fetch("/api/cities")
        const data = await response.json()
        if (data.cities) {
          const dbCities = data.cities.map((c: any) => c.name)
          // Merge database cities with comprehensive Ethiopian cities list
          const allCities = getAllCities(dbCities)
          setCities(allCities)
        } else {
          // Fallback to static list if API response is empty
          const allCities = getAllCities([])
          setCities(allCities)
        }
      } catch (error) {
        console.error("Failed to fetch cities:", error)
        // Fallback to static list on error
        const allCities = getAllCities([])
        setCities(allCities)
      }
    }
    fetchCities()
  }, [])

  useEffect(() => {
    if (origin || destination || date) {
      searchTrips()
    }
  }, [])

  const searchTrips = async (pageNum = 1, append = false) => {
    if (append) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
    }

    try {
      const params = new URLSearchParams()
      if (origin) params.set("origin", origin)
      if (destination) params.set("destination", destination)
      if (date) params.set("date", date)
      if (busType) params.set("busType", busType)
      params.set("sortBy", sortBy)
      params.set("page", pageNum.toString())
      params.set("limit", "20")

      const response = await fetch(`/api/trips?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        if (append) {
          setTrips(prev => [...prev, ...data.trips])
        } else {
          setTrips(data.trips)
        }
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const loadMore = () => {
    searchTrips(pagination.page + 1, true)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (origin) params.set("from", origin)
    if (destination) params.set("to", destination)
    if (date) params.set("date", date)
    if (busType) params.set("type", busType) // P2: Persist bus type filter in URL
    router.push(`/search?${params.toString()}`)
    searchTrips(1, false) // Reset to page 1
  }

  // P2: Update URL when bus type filter changes
  useEffect(() => {
    if (trips.length > 0) {
      const params = new URLSearchParams(window.location.search)
      if (busType) {
        params.set("type", busType)
      } else {
        params.delete("type")
      }
      router.replace(`/search?${params.toString()}`, { scroll: false })
    }
  }, [busType])

  const getSlotsColor = (available: number, total: number) => {
    const percentage = (available / total) * 100
    if (percentage <= 10) return "text-red-500"
    if (percentage <= 30) return "text-yellow-500"
    return "text-green-500"
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden">
      {/* Enhanced Ethiopian pattern background */}
      <div className="fixed inset-0 bg-gradient-to-br from-teal-pale/30 via-background to-teal-pale/20 -z-10" />
      <div className="fixed inset-0 bg-pattern-tilahun-glass opacity-10 -z-10" />

      {/* Sticky Search Header - GLASSMORPHISM */}
      <div className="sticky top-0 z-30 backdrop-blur-glass-dramatic border-b border-white/10">
        <div className="glass-teal py-6 shadow-glass-md">
          <div className="container mx-auto px-4">
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <CityCombobox
                  value={origin}
                  onChange={setOrigin}
                  suggestions={cities}
                  placeholder="From"
                  className="glass-input text-foreground placeholder:text-muted-foreground h-11 transition-all duration-300 focus-within:shadow-md focus-within:shadow-primary/20"
                  icon={<MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none z-10 flex-shrink-0" />}
                />

                <CityCombobox
                  value={destination}
                  onChange={setDestination}
                  suggestions={cities}
                  excludeCity={origin}
                  placeholder="To"
                  className="glass-input text-foreground placeholder:text-muted-foreground h-11 transition-all duration-300 focus-within:shadow-md focus-within:shadow-secondary/20"
                  icon={<MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary pointer-events-none z-10 flex-shrink-0" />}
                />

                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={today}
                    className="pl-10 glass-input text-foreground h-11"
                  />
                </div>

                <Select value={busType} onValueChange={(value) => {
                  setBusType(value)
                  // Update URL with bus type filter
                  const params = new URLSearchParams(searchParams.toString())
                  if (origin) params.set("from", origin)
                  if (destination) params.set("to", destination)
                  if (date) params.set("date", date)
                  if (value && value !== "all") params.set("type", value)
                  else params.delete("type")
                  router.push(`/search?${params.toString()}`)
                }}>
                  <SelectTrigger className="glass-input text-foreground h-11">
                    <Bus className="h-4 w-4 mr-2 flex-shrink-0" />
                    <SelectValue placeholder="Bus Type" />
                  </SelectTrigger>
                  <SelectContent className="glass-moderate">
                    <SelectItem value="all">All Types</SelectItem>
                    {BUS_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button type="submit" disabled={isLoading} className="glass-button h-11 shadow-lg hover:shadow-xl transition-all">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2 flex-shrink-0" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {origin && destination ? (
                <>
                  {origin} <ArrowRight className="inline h-5 w-5 mx-2" /> {destination}
                </>
              ) : (
                "Search Results"
              )}
            </h1>
            <p className="text-muted-foreground">
              {trips.length} trip{trips.length !== 1 ? "s" : ""} found
              {selectedTripsForComparison.length > 0 && (
                <span className="ml-2 text-primary font-medium">
                  • {selectedTripsForComparison.length} of 4 selected for comparison
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {selectedTripsForComparison.length >= 2 && (
              <Button
                onClick={() => setShowComparison(true)}
                variant="default"
                className="gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Compare ({selectedTripsForComparison.length})
              </Button>
            )}
            <Select value={sortBy} onValueChange={(v) => { setSortBy(v); searchTrips(); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="departureTime">Departure Time</SelectItem>
                <SelectItem value="price">Price: Low to High</SelectItem>
                <SelectItem value="priceDesc">Price: High to Low</SelectItem>
                <SelectItem value="slots">Available Seats</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              onClick={() => setShowFilters(!showFilters)}
              aria-label={showFilters ? "Close filters" : "Open filters"}
            >
              {showFilters ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Trip Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : trips.length === 0 ? (
          <Card className="glass-dramatic p-12 text-center max-w-2xl mx-auto shadow-glass-lg ethiopianPattern border-white/10">
            {/* Ethiopian coffee ceremony illustration placeholder */}
            <div className="relative mb-6">
              <div className="h-24 w-24 mx-auto rounded-full glass-teal flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform">
                <Coffee className="h-12 w-12 text-primary" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 to-teal-light/20 blur-2xl" />
              </div>
            </div>

            <h3 className="text-2xl font-display font-semibold mb-3 gradient-text-simien">No trips found</h3>
            <p className="text-muted-foreground mb-6 text-lg">
              Try adjusting your search criteria or check back later.
            </p>

            <div className="glass-subtle rounded-xl p-6 mb-6 text-left border border-white/20">
              <p className="font-medium text-foreground mb-3">Suggestions:</p>
              <div className="text-sm text-muted-foreground space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <p>Try different dates (tomorrow or next week)</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <p>Check for nearby cities or alternative routes</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <p>Some routes may not operate daily</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const tomorrow = new Date()
                  tomorrow.setDate(tomorrow.getDate() + 1)
                  setDate(tomorrow.toISOString().split('T')[0])
                }}
                className="glass-subtle border-white/30 hover:glass-moderate"
              >
                Try Tomorrow
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextWeek = new Date()
                  nextWeek.setDate(nextWeek.getDate() + 7)
                  setDate(nextWeek.toISOString().split('T')[0])
                }}
                className="glass-subtle border-white/30 hover:glass-moderate"
              >
                Try Next Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setBusType("all"); }}
                className="glass-subtle border-white/30 hover:glass-moderate"
              >
                All Bus Types
              </Button>
            </div>

            <Button
              onClick={() => { setOrigin(""); setDestination(""); setDate(""); setBusType("all"); }}
              className="glass-button shadow-lg hover:shadow-xl"
            >
              Clear All Filters
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {trips
              .sort((a, b) => {
                // Sort trips: SCHEDULED and BOARDING first, then DEPARTED, then COMPLETED/CANCELLED
                const statusOrder: Record<string, number> = {
                  SCHEDULED: 0,
                  BOARDING: 1,
                  DEPARTED: 2,
                  COMPLETED: 3,
                  CANCELLED: 4,
                }
                return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0)
              })
              .map((trip) => {
                const isDeparted = trip.status === "DEPARTED" || trip.status === "COMPLETED"

                return (
              <Card
                key={trip.id}
                className={`glass-dramatic glass-lift overflow-hidden relative border-white/10 shadow-glass-md hover:shadow-glass-lg transition-all duration-500 group ${
                  isDeparted ? "opacity-60" : ""
                }`}
              >
                {/* Teal accent line on hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-medium to-teal-light opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg shadow-primary/50" />

                {/* Compare Checkbox - Glass style */}
                <div className="absolute top-3 right-3 md:top-5 md:right-5 z-10">
                  <div className="glass-subtle rounded-lg p-1.5 shadow-md">
                    <Checkbox
                      id={`compare-${trip.id}`}
                      checked={selectedTripsForComparison.includes(trip.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          if (selectedTripsForComparison.length < 4) {
                            setSelectedTripsForComparison([...selectedTripsForComparison, trip.id])
                          }
                        } else {
                          setSelectedTripsForComparison(selectedTripsForComparison.filter((id) => id !== trip.id))
                        }
                      }}
                      className="h-5 w-5 border-2"
                      aria-label={`Compare ${trip.company.name} trip`}
                    />
                  </div>
                </div>

                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Company Info - Glass tinted section */}
                    <div className="p-6 md:w-48 glass-teal flex flex-col items-center justify-center text-center border-r border-white/10">
                      <div className="relative mb-3">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center text-white font-bold text-xl shadow-xl relative z-10 group-hover:scale-110 transition-transform duration-300">
                          {trip.company.name.charAt(0)}
                        </div>
                        {/* Glow behind company logo */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-primary-700 blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{trip.company.name}</h3>
                      <div className="flex flex-col gap-1.5">
                        <Badge variant="secondary" className="glass-subtle border-white/20">
                          {BUS_TYPES.find((t) => t.value === trip.busType)?.label || trip.busType}
                        </Badge>
                        {trip.distance && (
                          <Badge variant="outline" className="text-primary border-primary/50 glass-subtle">
                            {trip.distance} km journey
                          </Badge>
                        )}
                        {isDeparted && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600/50 glass-subtle">
                            {trip.status === "DEPARTED" ? "Departed" : "Completed"}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Trip Details */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Route & Time */}
                        <div className="flex-1">
                          {/* Departure Date - Prominent Display */}
                          <div className="mb-3 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-primary">
                              {new Date(trip.departureTime).toLocaleDateString("en-ET", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold">
                                {new Date(trip.departureTime).toLocaleTimeString("en-ET", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              <div className="text-sm text-muted-foreground">{trip.origin}</div>
                            </div>

                            <div className="flex-1 flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                              <div className="flex-1 border-t-2 border-dashed border-muted-foreground/30" />
                              <div className="flex flex-col items-center px-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {formatDuration(trip.estimatedDuration)}
                                </span>
                                {trip.distance && (
                                  <span className="text-xs text-muted-foreground/70">
                                    {trip.distance} km
                                  </span>
                                )}
                                {(() => {
                                  try {
                                    // Try intermediateStops JSON first
                                    if (trip.intermediateStops) {
                                      const stops = JSON.parse(trip.intermediateStops);
                                      if (Array.isArray(stops) && stops.length > 0) {
                                        const stopsText = stops.join(', ');
                                        return (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <span className="text-xs text-primary font-medium mt-1 cursor-help line-clamp-1 max-w-xs">
                                                  via {stopsText}
                                                </span>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p className="max-w-sm">Stops: {stopsText}</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        );
                                      }
                                    }
                                    // Fallback: parse route string if it contains arrows
                                    if (trip.route && trip.route.includes('→')) {
                                      const parts = trip.route.split('→').map(p => p.trim());
                                      // Get intermediate stops (exclude first and last)
                                      if (parts.length > 2) {
                                        const intermediates = parts.slice(1, -1);
                                        const stopsText = intermediates.join(', ');
                                        return (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <span className="text-xs text-primary font-medium mt-1 cursor-help line-clamp-1 max-w-xs">
                                                  via {stopsText}
                                                </span>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p className="max-w-sm">Stops: {stopsText}</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        );
                                      }
                                    }
                                  } catch (e) {
                                    console.error('Error parsing intermediate stops:', e);
                                  }
                                  return null;
                                })()}
                              </div>
                              <div className="flex-1 border-t-2 border-dashed border-muted-foreground/30" />
                              <div className="h-2 w-2 rounded-full bg-accent" />
                            </div>

                            <div className="text-center">
                              <div className="text-2xl font-bold">
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

                          {/* Amenities */}
                          <div className="flex items-center gap-3">
                            {trip.hasWater && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Droplets className="h-3 w-3" /> Water
                              </span>
                            )}
                            {trip.hasFood && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Coffee className="h-3 w-3" /> Snacks
                              </span>
                            )}
                          </div>
                        </div>

                        <Separator orientation="vertical" className="hidden md:block h-20 bg-white/10" />

                        {/* Price & Seats - Enhanced glass section */}
                        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-4 md:w-44">
                          <div className="text-right">
                            <div className="glass-subtle rounded-xl px-4 py-3 border border-white/20 mb-2">
                              <div className="text-3xl font-bold gradient-text-simien bg-gradient-to-r from-primary to-teal-light bg-clip-text">
                                {formatCurrency(Number(trip.price))}
                              </div>
                              <div className="text-xs text-muted-foreground font-medium">per person</div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-3">
                            <div className={`glass-subtle rounded-lg px-3 py-2 flex items-center gap-2 border border-white/20 ${getSlotsColor(trip.availableSlots, trip.totalSlots)}`}>
                              <Users className="h-4 w-4 flex-shrink-0" />
                              <span className="text-sm font-medium">
                                {trip.availableSlots} seats left
                              </span>
                            </div>

                            {isCompanyAdmin ? (
                              <Button disabled variant="secondary" size="sm" className="glass-subtle w-full">
                                View Only
                              </Button>
                            ) : (
                              <>
                                {trip.status === "COMPLETED" || trip.status === "CANCELLED" ? (
                                  <Button disabled variant="secondary" size="sm" className="glass-subtle w-full">
                                    {trip.status === "COMPLETED" ? "Trip Completed" : "Cancelled"}
                                  </Button>
                                ) : (
                                  <Link
                                    href={`/booking/${trip.id}`}
                                    onClick={() => {
                                      // Clear any previous booking data for this trip (prevents guest data persistence)
                                      sessionStorage.removeItem(`booking-${trip.id}-passengers`)
                                    }}
                                    className="w-full"
                                  >
                                    <Button
                                      disabled={trip.availableSlots === 0 || trip.status === "DEPARTED"}
                                      className="glass-button w-full shadow-md hover:shadow-lg hover:scale-105 transition-all"
                                      size="sm"
                                    >
                                      {trip.availableSlots === 0 ? "Sold Out" : trip.status === "DEPARTED" ? "Departed" : "Select"}
                                    </Button>
                                  </Link>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
                )
              })}

            {/* Load More Button */}
            {pagination.page < pagination.pages && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  variant="outline"
                  size="lg"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading more trips...
                    </>
                  ) : (
                    <>
                      Load More ({pagination.total - trips.length} remaining)
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trip Comparison Dialog */}
      <TripComparison
        trips={trips.filter((t) => selectedTripsForComparison.includes(t.id))}
        open={showComparison}
        onClose={() => setShowComparison(false)}
      />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}

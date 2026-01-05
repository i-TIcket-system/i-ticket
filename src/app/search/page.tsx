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
    router.push(`/search?${params.toString()}`)
    searchTrips(1, false) // Reset to page 1
  }

  const getSlotsColor = (available: number, total: number) => {
    const percentage = (available / total) * 100
    if (percentage <= 10) return "text-red-500"
    if (percentage <= 30) return "text-yellow-500"
    return "text-green-500"
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]" style={{ background: "linear-gradient(180deg, #f0fafa 0%, #f5f5f5 100%)" }}>
      {/* Search Header */}
      <div className="text-white py-8" style={{ background: "linear-gradient(135deg, #0d4f5c 0%, #0e9494 100%)" }}>
        <div className="container mx-auto px-4">
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <CityCombobox
                value={origin}
                onChange={setOrigin}
                suggestions={cities}
                placeholder="Type or select origin city"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                icon={<MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none z-10" />}
              />

              <CityCombobox
                value={destination}
                onChange={setDestination}
                suggestions={cities}
                excludeCity={origin}
                placeholder="Type or select destination"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                icon={<MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent pointer-events-none z-10" />}
              />

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" />
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={today}
                  className="pl-10 bg-white/10 border-white/20 text-white"
                />
              </div>

              <Select value={busType} onValueChange={setBusType}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <Bus className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Bus Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {BUS_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </form>
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
            </p>
          </div>

          <div className="flex items-center gap-4">
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
          <Card className="p-12 text-center">
            <Bus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No trips found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or check back later.
            </p>
            <Button onClick={() => { setOrigin(""); setDestination(""); setDate(""); }}>
              Clear Filters
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {trips.map((trip) => (
              <Card key={trip.id} className="card-hover overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Company Info */}
                    <div className="p-6 md:w-48 bg-muted/50 flex flex-col items-center justify-center text-center">
                      <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-bold mb-2">
                        {trip.company.name.charAt(0)}
                      </div>
                      <h3 className="font-semibold">{trip.company.name}</h3>
                      <Badge variant="secondary" className="mt-1">
                        {BUS_TYPES.find((t) => t.value === trip.busType)?.label || trip.busType}
                      </Badge>
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
                                        return (
                                          <span className="text-xs text-primary font-medium mt-1">
                                            via {stops.join(', ')}
                                          </span>
                                        );
                                      }
                                    }
                                    // Fallback: parse route string if it contains arrows
                                    if (trip.route && trip.route.includes('→')) {
                                      const parts = trip.route.split('→').map(p => p.trim());
                                      // Get intermediate stops (exclude first and last)
                                      if (parts.length > 2) {
                                        const intermediates = parts.slice(1, -1);
                                        return (
                                          <span className="text-xs text-primary font-medium mt-1">
                                            via {intermediates.join(', ')}
                                          </span>
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

                        <Separator orientation="vertical" className="hidden md:block h-20" />

                        {/* Price & Seats */}
                        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-4 md:w-40">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              {formatCurrency(Number(trip.price))}
                            </div>
                            <div className="text-xs text-muted-foreground">per person</div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className={`flex items-center gap-1 ${getSlotsColor(trip.availableSlots, trip.totalSlots)}`}>
                              <Users className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                {trip.availableSlots} seats left
                              </span>
                            </div>

                            {isCompanyAdmin ? (
                              <Button disabled variant="secondary" size="sm">
                                View Only
                              </Button>
                            ) : (
                              <Link href={`/booking/${trip.id}`}>
                                <Button disabled={trip.availableSlots === 0}>
                                  {trip.availableSlots === 0 ? "Sold Out" : "Select"}
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

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

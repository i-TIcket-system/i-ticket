"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Loader2,
  Bus,
  Building2,
  MapPin,
  Clock,
  Calendar,
  Users,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import Link from "next/link"

interface Trip {
  id: string
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  price: number
  totalSlots: number
  availableSlots: number
  bookingHalted: boolean
  status: string
  company: {
    id: string
    name: string
  }
  vehicle: {
    plateNumber: string
    sideNumber: string
    busType: string
  } | null
  driver: {
    name: string
    phone: string
  } | null
  conductor: {
    name: string
    phone: string
  } | null
  _count: {
    bookings: number
  }
}

interface Company {
  id: string
  name: string
}

export default function AllTripsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [companyId, setCompanyId] = useState("")
  const [tripStatus, setTripStatus] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Sorting
  const [sortBy, setSortBy] = useState("departureTime")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role !== "SUPER_ADMIN") {
      router.push("/")
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === "SUPER_ADMIN") {
      fetchCompanies()
      fetchTrips()
    }
  }, [session, page, sortBy, sortOrder])

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/admin/companies")
      const data = await response.json()
      setCompanies(data.companies || [])
    } catch (error) {
      console.error("Failed to fetch companies:", error)
    }
  }

  const fetchTrips = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        sortBy,
        sortOrder,
      })

      if (companyId) params.append("companyId", companyId)
      if (tripStatus) params.append("status", tripStatus)
      if (searchQuery) params.append("search", searchQuery)
      if (dateFrom) params.append("dateFrom", dateFrom)
      if (dateTo) params.append("dateTo", dateTo)

      const response = await fetch(`/api/admin/trips?${params}`)
      const data = await response.json()

      setTrips(data.trips || [])
      setTotalPages(data.pagination.totalPages)
      setTotalCount(data.pagination.totalCount)
    } catch (error) {
      console.error("Failed to fetch trips:", error)
      toast.error("Failed to load trips")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchTrips()
  }

  const handleClearFilters = () => {
    setCompanyId("")
    setTripStatus("")
    setSearchQuery("")
    setDateFrom("")
    setDateTo("")
    setPage(1)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
    setPage(1)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      SCHEDULED: { variant: "secondary", label: "Scheduled" },
      BOARDING: { variant: "default", label: "Boarding" },
      DEPARTED: { variant: "default", label: "Departed" },
      COMPLETED: { variant: "secondary", label: "Completed" },
      CANCELLED: { variant: "destructive", label: "Cancelled" },
    }
    const config = variants[status] || { variant: "secondary", label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getAvailabilityBadge = (trip: Trip) => {
    const occupancyRate = ((trip.totalSlots - trip.availableSlots) / trip.totalSlots) * 100

    if (trip.bookingHalted) {
      return <Badge variant="destructive">Halted</Badge>
    }

    if (trip.availableSlots === 0) {
      return <Badge variant="secondary">Full</Badge>
    }

    if (occupancyRate >= 90) {
      return <Badge variant="destructive">Low ({trip.availableSlots})</Badge>
    }

    if (occupancyRate >= 70) {
      return <Badge variant="default">Medium ({trip.availableSlots})</Badge>
    }

    return <Badge variant="secondary">Available ({trip.availableSlots})</Badge>
  }

  if (loading && trips.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: "#0e9494" }} />
          <p className="mt-4 text-muted-foreground">Loading trips...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Bus className="h-6 w-6" style={{ color: "#0e9494" }} />
                All Trips
              </CardTitle>
              <CardDescription>
                View and manage trips from all bus companies ({totalCount} total)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? "Hide" : "Show"} Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchTrips}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          {showFilters && (
            <div className="mb-6 p-4 border rounded-lg space-y-4" style={{ background: "rgba(14, 148, 148, 0.05)" }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search origin, destination, company..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Company</Label>
                  <Select value={companyId} onValueChange={setCompanyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All companies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All companies</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={tripStatus} onValueChange={setTripStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                      <SelectItem value="BOARDING">Boarding</SelectItem>
                      <SelectItem value="DEPARTED">Departed</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date From</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date To</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSearch} style={{ background: "#0e9494" }} className="text-white">
                  <Search className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={handleClearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          )}

          {/* Trips Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("company")}
                      className="font-semibold"
                    >
                      Company
                      {sortBy === "company" && (
                        sortOrder === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("departureTime")}
                      className="font-semibold"
                    >
                      Departure
                      {sortBy === "departureTime" && (
                        sortOrder === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("price")}
                      className="font-semibold"
                    >
                      Price
                      {sortBy === "price" && (
                        sortOrder === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("availableSlots")}
                      className="font-semibold"
                    >
                      Seats
                      {sortBy === "availableSlots" && (
                        sortOrder === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bookings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No trips found. Try adjusting your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  trips.map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium">{trip.company.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm">
                            {trip.origin} → {trip.destination}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span>{formatDate(trip.departureTime)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span>{new Date(trip.departureTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{trip.price} ETB</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            {trip.totalSlots - trip.availableSlots}/{trip.totalSlots}
                          </div>
                          {getAvailabilityBadge(trip)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {trip.vehicle ? (
                          <div className="text-sm">
                            <div className="font-medium">{trip.vehicle.plateNumber}</div>
                            <div className="text-xs text-muted-foreground">
                              {trip.vehicle.sideNumber} • {trip.vehicle.busType}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {trip.driver ? (
                          <div className="text-sm">
                            <div>{trip.driver.name}</div>
                            <div className="text-xs text-muted-foreground">{trip.driver.phone}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(trip.status)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {trip._count.bookings}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

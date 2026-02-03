"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Bus,
  Plus,
  Eye,
  Edit,
  Loader2,
  Calendar,
  MapPin,
  AlertTriangle,
  Check,
  X,
  Trash2,
  DollarSign,
  PlayCircle,
  PauseCircle,
  CheckSquare,
  Square,
  Search,
  HelpCircle,
  Keyboard,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency, formatDate, getSlotsPercentage, isLowSlots, hasDepartedEthiopia, isTodayEthiopia } from "@/lib/utils"
import { toast } from "sonner"

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
  isActive: boolean
  status: string // SCHEDULED, BOARDING, DEPARTED, COMPLETED, CANCELLED
  _count: {
    bookings: number
  }
  paidBookings?: number
  cancelledBookings?: number
}

type BulkAction = "price" | "halt" | "resume" | "delete" | null

export default function CompanyTripsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTrips, setSelectedTrips] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState<BulkAction>(null)
  const [newPrice, setNewPrice] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [disableAutoHaltGlobally, setDisableAutoHaltGlobally] = useState(false)
  const [isTogglingGlobalAutoHalt, setIsTogglingGlobalAutoHalt] = useState(false)

  // P2: Search and filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState("")
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([])
  const [hidePastTrips, setHidePastTrips] = useState(true)
  // NEW: Track which past date we're viewing (only used when hidePastTrips=false)
  const [pastViewDate, setPastViewDate] = useState<Date | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Refs for keyboard shortcuts to avoid dependency issues
  const filteredTripsRef = useRef<Trip[]>([])
  const selectedTripsRef = useRef<Set<string>>(new Set())

  // Update refs on every render (no useEffect needed - refs don't trigger re-renders)
  filteredTripsRef.current = filteredTrips
  selectedTripsRef.current = selectedTrips

  useEffect(() => {
    if (status === "authenticated") {
      if (session.user.role !== "COMPANY_ADMIN" && session.user.role !== "SUPER_ADMIN") {
        router.push("/")
        return
      }
      fetchTrips()
      fetchCompanySettings()

      // Auto-refresh trips every 10 seconds
      const interval = setInterval(() => {
        if (!document.hidden) {
          fetchTrips()
        }
      }, 10000)

      return () => clearInterval(interval)
    }
  }, [status, session])

  const fetchTrips = async () => {
    try {
      const response = await fetch("/api/company/trips")
      const data = await response.json()

      if (response.ok) {
        setTrips(data.trips)
        setFilteredTrips(data.trips)
      }
    } catch (error) {
      console.error("Failed to fetch trips:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCompanySettings = async () => {
    try {
      const response = await fetch("/api/company/settings/auto-halt")
      const data = await response.json()

      if (response.ok) {
        setDisableAutoHaltGlobally(data.company.disableAutoHaltGlobally)
      }
    } catch (error) {
      console.error("Failed to fetch company settings:", error)
    }
  }

  const toggleGlobalAutoHalt = async () => {
    setIsTogglingGlobalAutoHalt(true)
    try {
      const newValue = !disableAutoHaltGlobally
      const response = await fetch("/api/company/settings/auto-halt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disableAutoHaltGlobally: newValue }),
      })

      const data = await response.json()

      if (response.ok) {
        setDisableAutoHaltGlobally(newValue)
        toast.success(data.message)
      } else {
        toast.error(data.error || "Failed to update setting")
      }
    } catch (error) {
      console.error("Failed to toggle global auto-halt:", error)
      toast.error("Network error. Please try again.")
    } finally {
      setIsTogglingGlobalAutoHalt(false)
    }
  }

  // P2: Filter trips based on search query, status, and date
  // Track previous filter values to determine if we should reset page
  const prevSearchRef = useRef(searchQuery)
  const prevStatusRef = useRef(statusFilter)
  const prevDateFilterRef = useRef(dateFilter)

  useEffect(() => {
    let filtered = [...trips]
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Hide past trips by default (Issue 2 fix)
    if (hidePastTrips) {
      // Show ALL trips from today (including DEPARTED/COMPLETED) + future trips
      // Use isTodayEthiopia() for timezone-correct comparison
      filtered = filtered.filter(trip => {
        const tripTime = new Date(trip.departureTime)
        // Include if: today's trip (any status) OR future trip
        return isTodayEthiopia(tripTime) || tripTime >= startOfToday
      })
      // Sort: today's trips by time, then future trips by departure time
      filtered.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime())
    } else {
      // PAST VIEW: Show only ONE specific past day
      const viewDate = pastViewDate || (() => {
        // Default to yesterday when first entering past view
        const yesterday = new Date(startOfToday)
        yesterday.setDate(yesterday.getDate() - 1)
        return yesterday
      })()

      if (!pastViewDate) setPastViewDate(viewDate)

      filtered = filtered.filter(trip => {
        const tripDate = new Date(trip.departureTime)
        return (
          tripDate.getFullYear() === viewDate.getFullYear() &&
          tripDate.getMonth() === viewDate.getMonth() &&
          tripDate.getDate() === viewDate.getDate()
        )
      })
      // Sort: earliest first within the day
      filtered.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime())
    }

    // Text search (destination, origin, driver, conductor, vehicle)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(trip =>
        trip.origin.toLowerCase().includes(query) ||
        trip.destination.toLowerCase().includes(query) ||
        trip.busType.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter(trip => trip.isActive && !trip.bookingHalted)
      } else if (statusFilter === "halted") {
        filtered = filtered.filter(trip => trip.bookingHalted)
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter(trip => !trip.isActive)
      }
    }

    // P2-QA-003: Date filter with timezone-aware comparison
    if (dateFilter) {
      filtered = filtered.filter(trip => {
        const tripDate = new Date(trip.departureTime)
        const filterDate = new Date(dateFilter)

        // Compare year, month, day only (ignore time and timezone)
        return (
          tripDate.getFullYear() === filterDate.getFullYear() &&
          tripDate.getMonth() === filterDate.getMonth() &&
          tripDate.getDate() === filterDate.getDate()
        )
      })
    }

    setFilteredTrips(filtered)

    // Only reset page when search/status/date filters change, NOT when navigating dates
    const filtersChanged =
      prevSearchRef.current !== searchQuery ||
      prevStatusRef.current !== statusFilter ||
      prevDateFilterRef.current !== dateFilter

    if (filtersChanged) {
      setCurrentPage(1)
      prevSearchRef.current = searchQuery
      prevStatusRef.current = statusFilter
      prevDateFilterRef.current = dateFilter
    }
  }, [searchQuery, statusFilter, dateFilter, trips, hidePastTrips, pastViewDate])

  // Pagination calculations
  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage)
  const paginatedTrips = filteredTrips.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // P2-UX-004: Fix selection to work with filtered trips only (memoized to prevent render loop)
  const visibleSelectedCount = useMemo(
    () => filteredTrips.filter(t => selectedTrips.has(t.id)).length,
    [filteredTrips, selectedTrips]
  )
  const allVisibleSelected = useMemo(
    () => visibleSelectedCount === filteredTrips.length && filteredTrips.length > 0,
    [visibleSelectedCount, filteredTrips.length]
  )
  const someVisibleSelected = useMemo(
    () => visibleSelectedCount > 0 && visibleSelectedCount < filteredTrips.length,
    [visibleSelectedCount, filteredTrips.length]
  )

  // RULE-003: Helper to check if a trip is view-only
  // Also includes sold-out trips (availableSlots === 0)
  // FIX: Use Ethiopia timezone for proper comparison
  const isViewOnlyTrip = (trip: Trip) => {
    const isPastTrip = hasDepartedEthiopia(trip.departureTime)
    const effectiveStatus = isPastTrip && trip.status === "SCHEDULED" ? "DEPARTED" : trip.status
    return ["DEPARTED", "COMPLETED", "CANCELLED"].includes(effectiveStatus) || trip.availableSlots === 0
  }

  // Selection handlers - RULE-003: Exclude view-only trips from selection
  const selectableTrips = useMemo(
    () => filteredTrips.filter(t => !isViewOnlyTrip(t)),
    [filteredTrips]
  )

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      // Deselect all visible trips
      setSelectedTrips((prev) => {
        const newSet = new Set(prev)
        filteredTrips.forEach(t => newSet.delete(t.id))
        return newSet
      })
    } else {
      // Select all visible trips (RULE-003: Only selectable/non-view-only trips)
      setSelectedTrips((prev) => {
        const newSet = new Set(prev)
        selectableTrips.forEach(t => newSet.add(t.id))
        return newSet
      })
    }
  }

  const toggleSelectTrip = (tripId: string) => {
    const newSelected = new Set(selectedTrips)
    if (newSelected.has(tripId)) {
      newSelected.delete(tripId)
    } else {
      newSelected.add(tripId)
    }
    setSelectedTrips(newSelected)
  }

  const clearSelection = () => {
    setSelectedTrips(new Set())
  }

  // P3-UX-012: Keyboard shortcuts for power users (using refs to avoid infinite loop)
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea (but allow ? for help)
      if ((e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) && e.key !== '?') {
        return
      }

      // ? or Ctrl/Cmd + /: Show keyboard shortcuts help
      if (e.key === '?' || ((e.ctrlKey || e.metaKey) && e.key === '/')) {
        e.preventDefault()
        setShowHelpModal(true)
        return
      }

      // Escape: Close help modal or clear selection
      if (e.key === 'Escape') {
        if (showHelpModal) {
          setShowHelpModal(false)
        } else if (selectedTripsRef.current.size > 0) {
          setSelectedTrips(new Set())
          toast.success('Selection cleared')
        }
        return
      }

      // Ctrl/Cmd + A: Select all visible trips (RULE-003: Only selectable/non-view-only trips)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        const filtered = filteredTripsRef.current
        // Filter out view-only trips (including sold-out trips)
        // FIX: Use Ethiopia timezone for proper comparison
        const selectable = filtered.filter(trip => {
          const isPastTrip = hasDepartedEthiopia(trip.departureTime)
          const effectiveStatus = isPastTrip && trip.status === "SCHEDULED" ? "DEPARTED" : trip.status
          return !["DEPARTED", "COMPLETED", "CANCELLED"].includes(effectiveStatus) && trip.availableSlots > 0
        })
        if (selectable.length > 0) {
          setSelectedTrips(new Set(selectable.map(t => t.id)))
          toast.success(`Selected ${selectable.length} editable trip(s)${filtered.length > selectable.length ? ` (${filtered.length - selectable.length} view-only excluded)` : ''}`)
        } else if (filtered.length > 0) {
          toast.info("No editable trips to select (all are view-only)")
        }
      }
    }

    document.addEventListener('keydown', handleKeyboard)
    return () => document.removeEventListener('keydown', handleKeyboard)
  }, [showHelpModal]) // Include showHelpModal to handle Escape properly

  // Bulk operations
  const handleBulkPriceUpdate = async () => {
    if (!newPrice || isNaN(parseFloat(newPrice))) {
      toast.error("Invalid Price", {
        description: "Please enter a valid price"
      })
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch("/api/company/trips/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updatePrice",
          tripIds: Array.from(selectedTrips),
          price: parseFloat(newPrice)
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Success", {
          description: `Updated price for ${data.updated} trip(s). ${data.failed > 0 ? `${data.failed} trip(s) couldn't be updated (paid bookings exist).` : ''}`
        })
        fetchTrips()
        clearSelection()
        setBulkAction(null)
        setNewPrice("")
      } else {
        toast.error("Error", {
          description: data.error || "Failed to update prices"
        })
      }
    } catch (error) {
      toast.error("Error", {
        description: "An error occurred while updating prices"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkHaltResume = async (halt: boolean) => {
    setIsProcessing(true)
    try {
      const response = await fetch("/api/company/trips/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: halt ? "halt" : "resume",
          tripIds: Array.from(selectedTrips)
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Success", {
          description: `${halt ? 'Halted' : 'Resumed'} ${data.updated} trip(s)`
        })
        fetchTrips()
        clearSelection()
        setBulkAction(null)
      } else {
        toast.error("Error", {
          description: data.error || `Failed to ${halt ? 'halt' : 'resume'} trips`
        })
      }
    } catch (error) {
      toast.error("Error", {
        description: `An error occurred while ${halt ? 'halting' : 'resuming'} trips`
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkDelete = async () => {
    setIsProcessing(true)
    setBulkAction(null) // P2-UX-010: Close dialog immediately

    // Show loading toast
    const loadingToast = toast.loading(`Deleting ${selectedTrips.size} trip(s)...`, {
      duration: Infinity
    })

    try {
      const response = await fetch("/api/company/trips/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripIds: Array.from(selectedTrips)
        })
      })

      const data = await response.json()

      toast.dismiss(loadingToast)

      if (response.ok) {
        toast.success("Bulk delete completed", {
          description: `Deleted ${data.deleted} trip(s). ${data.failed > 0 ? `${data.failed} trip(s) couldn't be deleted (paid bookings exist).` : ''}`
        })
        fetchTrips()
        clearSelection()
      } else {
        toast.error("Error", {
          description: data.error || "Failed to delete trips"
        })
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error("Error", {
        description: "An error occurred while deleting trips"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading trips...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Trip Management</h1>
          <p className="text-muted-foreground">
            Manage your company's trips and schedules
            {filteredTrips.length !== trips.length && (
              <span className="ml-2 text-primary">
                ({filteredTrips.length} of {trips.length} trips shown)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHelpModal(true)}
            aria-label="Show keyboard shortcuts"
          >
            <Keyboard className="h-4 w-4 mr-2" />
            Shortcuts
          </Button>
          <Button asChild>
            <Link href="/company/trips/new">
              <Plus className="mr-2 h-4 w-4" />
              Create New Trip
            </Link>
          </Button>
        </div>
      </div>

      {/* P2: Search and Filter Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by route, bus type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="halted">Halted Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Filter by date"
            />
          </div>
          {/* Hide Past Trips Toggle with Date Navigation */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Checkbox
              id="hidePastTrips"
              checked={hidePastTrips}
              onCheckedChange={(checked) => {
                setHidePastTrips(checked === true)
                if (checked) {
                  // Returning to future view - clear past date
                  setPastViewDate(null)
                } else {
                  // Entering past view - set to yesterday
                  const yesterday = new Date()
                  yesterday.setDate(yesterday.getDate() - 1)
                  setPastViewDate(yesterday)
                }
                setCurrentPage(1) // Reset page when switching modes
              }}
            />
            <label
              htmlFor="hidePastTrips"
              className="text-sm font-medium cursor-pointer select-none"
            >
              Hide past trips
            </label>

            {/* Date navigation - only shown in past view */}
            {!hidePastTrips && pastViewDate && (
              <div className="flex items-center gap-2 ml-4 border-l pl-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(pastViewDate)
                    newDate.setDate(newDate.getDate() - 1)
                    setPastViewDate(newDate)
                    setCurrentPage(1)
                  }}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>

                <span className="font-medium px-3 text-sm min-w-[120px] text-center">
                  {pastViewDate.toLocaleDateString("en-ET", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(pastViewDate)
                    newDate.setDate(newDate.getDate() + 1)
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)

                    if (newDate >= today) {
                      // Reached today - switch back to future view
                      setHidePastTrips(true)
                      setPastViewDate(null)
                    } else {
                      setPastViewDate(newDate)
                    }
                    setCurrentPage(1)
                  }}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {!hidePastTrips && (
              <span className="text-xs text-muted-foreground ml-2">
                (Viewing past: {pastViewDate ? pastViewDate.toLocaleDateString("en-ET", { month: "short", day: "numeric" }) : "yesterday"})
              </span>
            )}
          </div>
          {(searchQuery || statusFilter !== "all" || dateFilter) && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Status: {statusFilter}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter("all")} />
                </Badge>
              )}
              {dateFilter && (
                <Badge variant="secondary" className="gap-1">
                  Date: {dateFilter}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setDateFilter("")} />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                  setDateFilter("")
                }}
              >
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Trips</CardTitle>
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <input
                type="checkbox"
                id="globalAutoHalt"
                checked={disableAutoHaltGlobally}
                onChange={toggleGlobalAutoHalt}
                disabled={isTogglingGlobalAutoHalt}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 disabled:opacity-50"
              />
              <label
                htmlFor="globalAutoHalt"
                className="text-sm font-medium cursor-pointer select-none"
              >
                Disable auto-halt for all trips
              </label>
              {isTogglingGlobalAutoHalt && (
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              )}
            </div>
          </div>
          {disableAutoHaltGlobally && (
            <p className="text-xs text-muted-foreground mt-2 px-1">
              ⚠️ Global auto-halt is disabled. Online booking will never stop at 10 seats for any trip.
            </p>
          )}
        </CardHeader>
        <CardContent>
          {/* UX-19: Add horizontal scroll on tablet to prevent column squeezing */}
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all visible trips"
                    className={someVisibleSelected ? "data-[state=checked]:bg-primary/50" : ""}
                  />
                </TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Departure</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Slots</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTrips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {trips.length === 0
                      ? "No trips found. Create your first trip to get started."
                      : "No trips match your filters. Try adjusting your search criteria."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTrips
                  .sort((a, b) => {
                    // Sort trips: future SCHEDULED first, then BOARDING, then past/DEPARTED, then COMPLETED/CANCELLED
                    const now = new Date()
                    const aIsPast = new Date(a.departureTime) < now
                    const bIsPast = new Date(b.departureTime) < now

                    // Derive effective status for sorting
                    const aEffectiveStatus = aIsPast && a.status === "SCHEDULED" ? "DEPARTED" : a.status
                    const bEffectiveStatus = bIsPast && b.status === "SCHEDULED" ? "DEPARTED" : b.status

                    const statusOrder: Record<string, number> = {
                      SCHEDULED: 0,
                      BOARDING: 1,
                      DEPARTED: 2,
                      COMPLETED: 3,
                      CANCELLED: 4,
                    }

                    const statusDiff = (statusOrder[aEffectiveStatus] || 0) - (statusOrder[bEffectiveStatus] || 0)

                    // If same status, use smart time ordering
                    if (statusDiff === 0) {
                      const timeA = new Date(a.departureTime).getTime()
                      const timeB = new Date(b.departureTime).getTime()
                      // Future trips: ascending (soonest first), Past trips: descending (most recent first)
                      const isFutureStatus = aEffectiveStatus === "SCHEDULED" || aEffectiveStatus === "BOARDING"
                      return isFutureStatus ? timeA - timeB : timeB - timeA
                    }

                    return statusDiff
                  })
                  .map((trip) => {
                  const slotsPercentage = getSlotsPercentage(trip.availableSlots, trip.totalSlots)
                  const lowSlots = isLowSlots(trip.availableSlots, trip.totalSlots)
                  const isSelected = selectedTrips.has(trip.id)

                  // RULE-003: Derive correct status based on departure time
                  const departureTime = new Date(trip.departureTime)
                  const now = new Date()
                  const isPastTrip = departureTime < now

                  // Derive effective status: past SCHEDULED trips should show as DEPARTED
                  const effectiveStatus = isPastTrip && trip.status === "SCHEDULED"
                    ? "DEPARTED"
                    : trip.status

                  // Past trips should always be halted (view-only per RULE-003)
                  const effectiveHalted = isPastTrip || trip.bookingHalted

                  const isDeparted = effectiveStatus === "DEPARTED" || effectiveStatus === "COMPLETED"

                  // RULE-003: View-only trips cannot be edited or selected for bulk operations
                  // Also check for sold-out trips (availableSlots === 0)
                  const isViewOnly = ["DEPARTED", "COMPLETED", "CANCELLED"].includes(effectiveStatus)
                    || trip.availableSlots === 0

                  return (
                    <TableRow
                      key={trip.id}
                      className={`${isSelected ? "bg-muted/50" : ""} ${
                        isDeparted ? "opacity-60 bg-muted/30" : ""
                      }`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectTrip(trip.id)}
                          disabled={isViewOnly}
                          aria-label={`Select trip from ${trip.origin} to ${trip.destination}`}
                          title={isViewOnly ? "View-only trips cannot be modified" : undefined}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {trip.origin} → {trip.destination}
                            </div>
                            <div className="text-sm text-muted-foreground">{trip.busType}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(trip.departureTime)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(trip.price)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {trip.availableSlots} / {trip.totalSlots}
                          </div>
                          <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                lowSlots ? "bg-red-500" :
                                slotsPercentage < 50 ? "bg-yellow-500" : "bg-green-500"
                              }`}
                              style={{ width: `${100 - slotsPercentage}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary">
                            {trip.paidBookings ?? trip._count.bookings}
                          </Badge>
                          {trip.cancelledBookings !== undefined && trip.cancelledBookings > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({trip.cancelledBookings} cancelled)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          {/* Trip Status Badge - Primary with high contrast colors */}
                          <Badge className={`w-fit text-xs font-semibold ${
                            effectiveStatus === 'SCHEDULED' ? 'bg-blue-600 text-white' :
                            effectiveStatus === 'BOARDING' ? 'bg-amber-500 text-white' :
                            effectiveStatus === 'DEPARTED' ? 'bg-purple-600 text-white' :
                            effectiveStatus === 'COMPLETED' ? 'bg-emerald-600 text-white' :
                            effectiveStatus === 'CANCELLED' ? 'bg-red-600 text-white' : ''
                          }`}>
                            {effectiveStatus}
                          </Badge>

                          {/* Secondary Status - Booking availability */}
                          <div className="flex items-center gap-1">
                            {effectiveHalted ? (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
                                <X className="h-2.5 w-2.5 mr-0.5" />
                                {isPastTrip ? 'Closed' : 'Halted'}
                              </Badge>
                            ) : trip.isActive ? (
                              <Badge className="text-[10px] px-1.5 py-0 h-5 bg-green-600 text-white">
                                <Check className="h-2.5 w-2.5 mr-0.5" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">Inactive</Badge>
                            )}
                            {lowSlots && !effectiveHalted && (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
                                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                Low
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/company/trips/${trip.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                          {/* RULE-003: Hide Edit button for view-only trips */}
                          {!isViewOnly && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/company/trips/${trip.id}/edit`}>
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          </div>

          {/* Pagination */}
          {filteredTrips.length > itemsPerPage && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredTrips.length)} of{" "}
                {filteredTrips.length} trips
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm px-3 py-1 bg-muted rounded">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions Panel - Floating at bottom when items selected */}
      {selectedTrips.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
          <Card className="shadow-2xl border-2">
            <CardContent className="py-4 px-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  <span className="font-semibold">
                    {visibleSelectedCount} of {filteredTrips.length} visible trip(s) selected
                  </span>
                  {selectedTrips.size > visibleSelectedCount && (
                    <Badge variant="secondary" className="ml-2">
                      +{selectedTrips.size - visibleSelectedCount} more (hidden by current filters)
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkAction("price")}
                    disabled={isProcessing}
                  >
                    <DollarSign className="h-4 w-4 mr-1" />
                    Update Price
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkAction("halt")}
                    disabled={isProcessing}
                  >
                    <PauseCircle className="h-4 w-4 mr-1" />
                    Halt Booking
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkAction("resume")}
                    disabled={isProcessing}
                  >
                    <PlayCircle className="h-4 w-4 mr-1" />
                    Resume Booking
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setBulkAction("delete")}
                    disabled={isProcessing}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Price Update Dialog */}
      <Dialog open={bulkAction === "price"} onOpenChange={() => setBulkAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Price for {selectedTrips.size} Trip(s)</DialogTitle>
            <DialogDescription>
              Enter the new price for selected trips. Trips with paid bookings cannot be updated.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="newPrice">New Price (ETB)</Label>
            <Input
              id="newPrice"
              type="number"
              step="0.01"
              placeholder="Enter new price"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAction(null)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleBulkPriceUpdate} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Price"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Halt Dialog */}
      <Dialog open={bulkAction === "halt"} onOpenChange={() => setBulkAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Halt Booking for {selectedTrips.size} Trip(s)?</DialogTitle>
            <DialogDescription>
              This will temporarily stop customers from booking these trips. You can resume them later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAction(null)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={() => handleBulkHaltResume(true)} disabled={isProcessing} variant="destructive">
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Halting...
                </>
              ) : (
                "Halt Booking"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Resume Dialog */}
      <Dialog open={bulkAction === "resume"} onOpenChange={() => setBulkAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resume Booking for {selectedTrips.size} Trip(s)?</DialogTitle>
            <DialogDescription>
              This will allow customers to book these trips again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAction(null)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={() => handleBulkHaltResume(false)} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resuming...
                </>
              ) : (
                "Resume Booking"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog - P1-UX-001: With trip preview */}
      <Dialog open={bulkAction === "delete"} onOpenChange={() => setBulkAction(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Delete {selectedTrips.size} Trip(s)?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The following trips will be permanently deleted:
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto border rounded-lg p-4 space-y-2 my-4">
            {filteredTrips
              .filter((t) => selectedTrips.has(t.id))
              .slice(0, 10)
              .map((trip) => (
                <div key={trip.id} className="text-sm flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span>
                    {trip.origin} → {trip.destination} ({formatDate(trip.departureTime)})
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {trip.paidBookings ?? trip._count.bookings} booking(s)
                    {trip.cancelledBookings !== undefined && trip.cancelledBookings > 0 && (
                      <span className="ml-1 text-muted-foreground">
                        ({trip.cancelledBookings} cancelled)
                      </span>
                    )}
                  </Badge>
                </div>
              ))}
            {selectedTrips.size > 10 && (
              <p className="text-sm text-muted-foreground italic">
                ... and {selectedTrips.size - 10} more trip(s)
              </p>
            )}
          </div>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Trips with paid bookings cannot be deleted and will be skipped.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAction(null)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleBulkDelete} disabled={isProcessing} variant="destructive">
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Trips"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Help Modal */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Use these shortcuts to manage trips more efficiently
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Selection</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Select all visible trips</span>
                  <Badge variant="secondary" className="font-mono">
                    Ctrl + A
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Clear selection</span>
                  <Badge variant="secondary" className="font-mono">
                    Esc
                  </Badge>
                </div>
              </div>
            </div>

            <div className="border-t pt-3 space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Help</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Show keyboard shortcuts</span>
                  <Badge variant="secondary" className="font-mono">
                    ?
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Close this dialog</span>
                  <Badge variant="secondary" className="font-mono">
                    Esc
                  </Badge>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="flex items-center gap-1">
                <HelpCircle className="h-3 w-3" />
                <span>Shortcuts are disabled when typing in input fields</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowHelpModal(false)} className="w-full">
              Got it!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

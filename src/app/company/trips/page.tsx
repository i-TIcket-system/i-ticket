"use client"

import { useState, useEffect } from "react"
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
  Search
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
import { formatCurrency, formatDate, getSlotsPercentage, isLowSlots } from "@/lib/utils"
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
  _count: {
    bookings: number
  }
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

  // P2: Search and filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState("")
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([])

  useEffect(() => {
    if (status === "authenticated") {
      if (session.user.role !== "COMPANY_ADMIN" && session.user.role !== "SUPER_ADMIN") {
        router.push("/")
        return
      }
      fetchTrips()
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

  // P2: Filter trips based on search query, status, and date
  useEffect(() => {
    let filtered = [...trips]

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

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(trip => {
        const tripDate = new Date(trip.departureTime).toISOString().split('T')[0]
        return tripDate === dateFilter
      })
    }

    setFilteredTrips(filtered)
  }, [searchQuery, statusFilter, dateFilter, trips])

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedTrips.size === trips.length) {
      setSelectedTrips(new Set())
    } else {
      setSelectedTrips(new Set(trips.map(t => t.id)))
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
    try {
      const response = await fetch("/api/company/trips/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripIds: Array.from(selectedTrips)
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Success", {
          description: `Deleted ${data.deleted} trip(s). ${data.failed > 0 ? `${data.failed} trip(s) couldn't be deleted (paid bookings exist).` : ''}`
        })
        fetchTrips()
        clearSelection()
        setBulkAction(null)
      } else {
        toast.error("Error", {
          description: data.error || "Failed to delete trips"
        })
      }
    } catch (error) {
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

  const allSelected = selectedTrips.size === filteredTrips.length && filteredTrips.length > 0
  const someSelected = selectedTrips.size > 0 && selectedTrips.size < filteredTrips.length

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
        <Link href="/company/trips/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New Trip
          </Button>
        </Link>
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
          <CardTitle>All Trips</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all trips"
                    className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
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
              {filteredTrips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {trips.length === 0
                      ? "No trips found. Create your first trip to get started."
                      : "No trips match your filters. Try adjusting your search criteria."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTrips.map((trip) => {
                  const slotsPercentage = getSlotsPercentage(trip.availableSlots, trip.totalSlots)
                  const lowSlots = isLowSlots(trip.availableSlots, trip.totalSlots)
                  const isSelected = selectedTrips.has(trip.id)

                  return (
                    <TableRow key={trip.id} className={isSelected ? "bg-muted/50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectTrip(trip.id)}
                          aria-label={`Select trip from ${trip.origin} to ${trip.destination}`}
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
                        <Badge variant="secondary">{trip._count.bookings}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {trip.bookingHalted ? (
                            <Badge variant="destructive" className="w-fit">
                              <X className="h-3 w-3 mr-1" />
                              Halted
                            </Badge>
                          ) : trip.isActive ? (
                            <Badge variant="default" className="w-fit">
                              <Check className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="w-fit">Inactive</Badge>
                          )}
                          {lowSlots && !trip.bookingHalted && (
                            <Badge variant="destructive" className="w-fit text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Low Slots
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/company/trips/${trip.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Link href={`/company/trips/${trip.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
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
                  <span className="font-semibold">{selectedTrips.size} trip(s) selected</span>
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

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkAction === "delete"} onOpenChange={() => setBulkAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedTrips.size} Trip(s)?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Trips with paid bookings cannot be deleted.
            </DialogDescription>
          </DialogHeader>
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
    </div>
  )
}

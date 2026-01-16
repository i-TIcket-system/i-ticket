"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Truck,
  Plus,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Wrench,
  ChevronDown,
  ChevronUp,
  Activity,
  Gauge,
  Fuel,
  Search,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { VehicleHealthDashboard } from "@/components/maintenance/VehicleHealthDashboard"

interface Vehicle {
  id: string
  plateNumber: string
  sideNumber: string | null
  make: string
  model: string
  year: number
  busType: string
  color: string | null
  totalSeats: number
  status: string
  effectiveStatus: string // ON_TRIP, ACTIVE, MAINTENANCE, INACTIVE
  registrationExpiry: string | null
  insuranceExpiry: string | null
  lastServiceDate: string | null
  nextServiceDate: string | null
  tripCount: number
  nextTrip: {
    id: string
    origin: string
    destination: string
    departureTime: string
  } | null
  activeTrip: {
    id: string
    origin: string
    destination: string
    departureTime: string
  } | null
  createdAt: string

  // Predictive Maintenance fields
  currentOdometer: number | null
  fuelCapacity: number | null
  fuelType: string | null
  fuelEfficiencyL100km: number | null
  maintenanceRiskScore: number | null
  predictedFailureDate: string | null
  predictedFailureType: string | null
  lastInspectionDate: string | null
  criticalDefectCount: number | null
  defectCount: number | null
}

const BUS_TYPES = {
  MINI: { label: "Mini Bus", color: "bg-blue-100 text-blue-800" },
  STANDARD: { label: "Standard Bus", color: "bg-green-100 text-green-800" },
  LUXURY: { label: "Luxury Bus", color: "bg-purple-100 text-purple-800" },
}

const STATUS_INFO: Record<string, { label: string; color: string; icon: any }> = {
  ON_TRIP: { label: "On Trip", color: "bg-blue-100 text-blue-800", icon: Truck },
  ACTIVE: { label: "Available", color: "bg-green-100 text-green-800", icon: CheckCircle },
  MAINTENANCE: { label: "Maintenance", color: "bg-orange-100 text-orange-800", icon: Wrench },
  INACTIVE: { label: "Inactive", color: "bg-gray-100 text-gray-800", icon: XCircle },
}

const COMMON_MAKES = [
  "Toyota", "Isuzu", "Mercedes-Benz", "Hyundai", "Mitsubishi",
  "Volvo", "Scania", "MAN", "Yutong", "King Long", "Zhongtong", "Other"
]

export default function VehiclesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null)
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null)
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null)

  // Filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Add vehicle form
  const [newVehicle, setNewVehicle] = useState({
    plateNumber: "",
    sideNumber: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    busType: "STANDARD",
    color: "",
    totalSeats: 45,
    status: "ACTIVE",
    registrationExpiry: "",
    insuranceExpiry: "",
    lastServiceDate: "",
    nextServiceDate: "",
    // Operational/Predictive Maintenance fields
    currentOdometer: "",
    fuelCapacity: "",
    fuelType: "DIESEL",
  })

  // Edit vehicle form
  const [editForm, setEditForm] = useState({
    sideNumber: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    busType: "STANDARD",
    color: "",
    totalSeats: 45,
    status: "ACTIVE",
    registrationExpiry: "",
    insuranceExpiry: "",
    lastServiceDate: "",
    nextServiceDate: "",
    // Operational/Predictive Maintenance fields
    currentOdometer: "",
    fuelCapacity: "",
    fuelType: "DIESEL",
  })

  useEffect(() => {
    if (status === "authenticated") {
      if (session.user.role !== "COMPANY_ADMIN") {
        router.push("/")
        return
      }
      fetchVehicles()
    }
  }, [status, session, router])

  const fetchVehicles = async () => {
    try {
      const response = await fetch("/api/company/vehicles")
      const data = await response.json()

      if (response.ok) {
        setVehicles(data.vehicles)
      } else {
        toast.error("Failed to load vehicles")
      }
    } catch (error) {
      console.error("Failed to fetch vehicles:", error)
      toast.error("An error occurred while loading vehicles")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddVehicle = async () => {
    setIsSaving(true)

    try {
      const response = await fetch("/api/company/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newVehicle,
          sideNumber: newVehicle.sideNumber.trim() || null,
          color: newVehicle.color.trim() || null,
          registrationExpiry: newVehicle.registrationExpiry || null,
          insuranceExpiry: newVehicle.insuranceExpiry || null,
          lastServiceDate: newVehicle.lastServiceDate || null,
          nextServiceDate: newVehicle.nextServiceDate || null,
          currentOdometer: newVehicle.currentOdometer ? parseInt(newVehicle.currentOdometer) : null,
          fuelCapacity: newVehicle.fuelCapacity ? parseFloat(newVehicle.fuelCapacity) : null,
          fuelType: newVehicle.fuelType || null,
        }),
      })

      if (response.ok) {
        toast.success(`Vehicle ${newVehicle.plateNumber} added successfully`)
        setIsAddDialogOpen(false)
        setNewVehicle({
          plateNumber: "",
          sideNumber: "",
          make: "",
          model: "",
          year: new Date().getFullYear(),
          busType: "STANDARD",
          color: "",
          totalSeats: 45,
          status: "ACTIVE",
          registrationExpiry: "",
          insuranceExpiry: "",
          lastServiceDate: "",
          nextServiceDate: "",
          currentOdometer: "",
          fuelCapacity: "",
          fuelType: "DIESEL",
        })
        fetchVehicles()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to add vehicle")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const openEditDialog = (vehicle: Vehicle) => {
    setVehicleToEdit(vehicle)
    setEditForm({
      sideNumber: vehicle.sideNumber || "",
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      busType: vehicle.busType,
      color: vehicle.color || "",
      totalSeats: vehicle.totalSeats,
      status: vehicle.status,
      registrationExpiry: vehicle.registrationExpiry ?
        new Date(vehicle.registrationExpiry).toISOString().split('T')[0] : "",
      insuranceExpiry: vehicle.insuranceExpiry ?
        new Date(vehicle.insuranceExpiry).toISOString().split('T')[0] : "",
      lastServiceDate: vehicle.lastServiceDate ?
        new Date(vehicle.lastServiceDate).toISOString().split('T')[0] : "",
      nextServiceDate: vehicle.nextServiceDate ?
        new Date(vehicle.nextServiceDate).toISOString().split('T')[0] : "",
      currentOdometer: vehicle.currentOdometer?.toString() || "",
      fuelCapacity: vehicle.fuelCapacity?.toString() || "",
      fuelType: vehicle.fuelType || "DIESEL",
    })
    setIsEditDialogOpen(true)
  }

  const handleEditVehicle = async () => {
    if (!vehicleToEdit) return

    setIsSaving(true)

    try {
      const response = await fetch(`/api/company/vehicles/${vehicleToEdit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          sideNumber: editForm.sideNumber.trim() || null,
          color: editForm.color.trim() || null,
          registrationExpiry: editForm.registrationExpiry || null,
          insuranceExpiry: editForm.insuranceExpiry || null,
          lastServiceDate: editForm.lastServiceDate || null,
          nextServiceDate: editForm.nextServiceDate || null,
          currentOdometer: editForm.currentOdometer ? parseInt(editForm.currentOdometer) : null,
          fuelCapacity: editForm.fuelCapacity ? parseFloat(editForm.fuelCapacity) : null,
          fuelType: editForm.fuelType || null,
        }),
      })

      if (response.ok) {
        toast.success("Vehicle updated successfully")
        setIsEditDialogOpen(false)
        setVehicleToEdit(null)
        fetchVehicles()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to update vehicle")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return

    try {
      const response = await fetch(`/api/company/vehicles/${vehicleToDelete}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Vehicle deactivated successfully")
        setVehicleToDelete(null)
        fetchVehicles()
      } else {
        const data = await response.json()
        if (data.hasActiveTrips) {
          toast.error(data.error, { duration: 5000 })
        } else {
          toast.error(data.error || "Failed to deactivate vehicle")
        }
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading vehicles...</p>
        </div>
      </div>
    )
  }

  // Calculate stats
  const stats = {
    total: vehicles.length,
    active: vehicles.filter(v => v.status === "ACTIVE").length,
    maintenance: vehicles.filter(v => v.status === "MAINTENANCE").length,
    inactive: vehicles.filter(v => v.status === "INACTIVE").length,
  }

  // Filter vehicles by search term and status
  const filteredVehicles = vehicles.filter((vehicle) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm ||
      vehicle.plateNumber.toLowerCase().includes(searchLower) ||
      vehicle.sideNumber?.toLowerCase().includes(searchLower) ||
      vehicle.make.toLowerCase().includes(searchLower) ||
      vehicle.model.toLowerCase().includes(searchLower)

    // Use effectiveStatus for filtering so ON_TRIP vehicles can be filtered
    const matchesStatus = statusFilter === "all" || (vehicle.effectiveStatus || vehicle.status) === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Truck className="h-8 w-8 text-primary" />
              Fleet Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your company's vehicle fleet
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Truck className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Vehicles</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Wrench className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold">{stats.maintenance}</p>
              <p className="text-xs text-muted-foreground">In Maintenance</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <p className="text-2xl font-bold">{stats.inactive}</p>
              <p className="text-xs text-muted-foreground">Inactive</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      {vehicles.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filter Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by plate number, side number, make, or model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ON_TRIP">On Trip</SelectItem>
                  <SelectItem value="ACTIVE">Available</SelectItem>
                  <SelectItem value="MAINTENANCE">In Maintenance</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchTerm || statusFilter !== "all") && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Showing {filteredVehicles.length} of {vehicles.length} vehicles
                </span>
                {(searchTerm || statusFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("all")
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Vehicles</CardTitle>
          <CardDescription>
            {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? "s" : ""}
            {filteredVehicles.length !== vehicles.length && ` (filtered from ${vehicles.length})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No vehicles yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first vehicle to start managing your fleet
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identification</TableHead>
                    <TableHead>Vehicle Details</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Seats</TableHead>
                    <TableHead>Health</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Trip</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <div className="text-muted-foreground">
                          {searchTerm || statusFilter !== "all" ? (
                            <>
                              <p>No vehicles found matching your filters</p>
                              <Button
                                variant="link"
                                onClick={() => {
                                  setSearchTerm("")
                                  setStatusFilter("all")
                                }}
                                className="mt-2"
                              >
                                Clear filters
                              </Button>
                            </>
                          ) : (
                            "No vehicles found"
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVehicles.map((vehicle) => {
                    const typeInfo = BUS_TYPES[vehicle.busType as keyof typeof BUS_TYPES]
                    // Use effectiveStatus to show ON_TRIP when vehicle is on an active trip
                    const displayStatus = vehicle.effectiveStatus || vehicle.status
                    const statusInfo = STATUS_INFO[displayStatus] || STATUS_INFO.ACTIVE
                    const StatusIcon = statusInfo.icon
                    const isExpanded = expandedVehicle === vehicle.id

                    // Risk score color
                    const getRiskColor = (score: number | null) => {
                      if (score === null) return "bg-gray-100 text-gray-800"
                      if (score < 50) return "bg-green-100 text-green-800"
                      if (score < 70) return "bg-yellow-100 text-yellow-800"
                      if (score < 85) return "bg-orange-100 text-orange-800"
                      return "bg-red-100 text-red-800"
                    }

                    return (
                      <>
                        <TableRow
                          key={vehicle.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setExpandedVehicle(isExpanded ? null : vehicle.id)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                              <div>
                                <p className="font-medium font-mono">{vehicle.plateNumber}</p>
                                {vehicle.sideNumber && (
                                  <p className="text-xs text-muted-foreground">
                                    Side: {vehicle.sideNumber}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                              <p className="text-xs text-muted-foreground">
                                {vehicle.year}{vehicle.color && ` • ${vehicle.color}`}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={typeInfo.color}>
                              {typeInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{vehicle.totalSeats}</span>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {vehicle.maintenanceRiskScore !== null ? (
                                <Badge className={getRiskColor(vehicle.maintenanceRiskScore)}>
                                  <Gauge className="h-3 w-3 mr-1" />
                                  Risk: {vehicle.maintenanceRiskScore}
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-800">
                                  <Activity className="h-3 w-3 mr-1" />
                                  No data
                                </Badge>
                              )}
                              <div className="flex gap-1">
                                {vehicle.currentOdometer !== null && vehicle.currentOdometer !== undefined && (
                                  <span className="text-xs text-muted-foreground">
                                    {vehicle.currentOdometer.toLocaleString()} km
                                  </span>
                                )}
                                {vehicle.fuelEfficiencyL100km !== null && vehicle.fuelEfficiencyL100km !== undefined && (
                                  <span className="text-xs text-muted-foreground">
                                    • {vehicle.fuelEfficiencyL100km.toFixed(1)} L/100km
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusInfo.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {vehicle.nextTrip ? (
                              <div className="text-xs">
                                <p className="font-medium">
                                  {vehicle.nextTrip.origin} → {vehicle.nextTrip.destination}
                                </p>
                                <p className="text-muted-foreground">
                                  {new Date(vehicle.nextTrip.departureTime).toLocaleDateString()}
                                </p>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">No trips</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(vehicle)}
                              >
                                <Edit className="h-4 w-4 text-primary" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setVehicleToDelete(vehicle.id)}
                                disabled={vehicle.status === "INACTIVE"}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Expanded section with Vehicle Health Dashboard */}
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={8} className="bg-muted/30 p-6">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-primary" />
                                    Vehicle Health Dashboard
                                  </h3>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setExpandedVehicle(null)
                                    }}
                                  >
                                    Close
                                  </Button>
                                </div>

                                <VehicleHealthDashboard
                                  vehicleId={vehicle.id}
                                  plateNumber={vehicle.plateNumber}
                                  sideNumber={vehicle.sideNumber || undefined}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )
                  })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Vehicle Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>
              Register a new vehicle to your fleet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Identification Section */}
            <div className="border-b pb-4">
              <h3 className="font-medium mb-3">Vehicle Identification</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plateNumber">
                    Plate Number *
                    <span className="text-xs text-muted-foreground ml-2">(e.g., 3-12345)</span>
                  </Label>
                  <Input
                    id="plateNumber"
                    value={newVehicle.plateNumber}
                    onChange={(e) => setNewVehicle({ ...newVehicle, plateNumber: e.target.value.toUpperCase() })}
                    placeholder="3-12345"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sideNumber">
                    Side Number (Optional)
                    <span className="text-xs text-muted-foreground ml-2">(e.g., Bus 7, 07)</span>
                  </Label>
                  <Input
                    id="sideNumber"
                    value={newVehicle.sideNumber}
                    onChange={(e) => setNewVehicle({ ...newVehicle, sideNumber: e.target.value })}
                    placeholder="07"
                  />
                </div>
              </div>
            </div>

            {/* Specifications Section */}
            <div className="border-b pb-4">
              <h3 className="font-medium mb-3">Vehicle Specifications</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make *</Label>
                  <Select
                    value={newVehicle.make}
                    onValueChange={(value) => setNewVehicle({ ...newVehicle, make: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select manufacturer" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_MAKES.map(make => (
                        <SelectItem key={make} value={make}>{make}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                    placeholder="Coaster"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={newVehicle.year}
                    onChange={(e) => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) })}
                    min={1990}
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color (Optional)</Label>
                  <Input
                    id="color"
                    value={newVehicle.color}
                    onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                    placeholder="White"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="busType">Bus Type *</Label>
                  <Select
                    value={newVehicle.busType}
                    onValueChange={(value) => setNewVehicle({ ...newVehicle, busType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MINI">Mini Bus (4-20 seats)</SelectItem>
                      <SelectItem value="STANDARD">Standard Bus (20-50 seats)</SelectItem>
                      <SelectItem value="LUXURY">Luxury Bus (30-60 seats)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalSeats">Total Seats *</Label>
                  <Input
                    id="totalSeats"
                    type="number"
                    value={newVehicle.totalSeats}
                    onChange={(e) => setNewVehicle({ ...newVehicle, totalSeats: parseInt(e.target.value) })}
                    min={4}
                    max={100}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {newVehicle.busType === "MINI" && "Mini Bus: 4-20 seats"}
                    {newVehicle.busType === "STANDARD" && "Standard Bus: 20-50 seats"}
                    {newVehicle.busType === "LUXURY" && "Luxury Bus: 30-60 seats"}
                  </p>
                </div>
              </div>
            </div>

            {/* Operational Data Section */}
            <div className="border-b pb-4">
              <h3 className="font-medium mb-3">Operational Data (Optional)</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Track operational metrics for predictive maintenance
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentOdometer">Current Odometer (km)</Label>
                  <Input
                    id="currentOdometer"
                    type="number"
                    value={newVehicle.currentOdometer}
                    onChange={(e) => setNewVehicle({ ...newVehicle, currentOdometer: e.target.value })}
                    placeholder="75000"
                    min={0}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fuelCapacity">Fuel Capacity (liters)</Label>
                  <Input
                    id="fuelCapacity"
                    type="number"
                    value={newVehicle.fuelCapacity}
                    onChange={(e) => setNewVehicle({ ...newVehicle, fuelCapacity: e.target.value })}
                    placeholder="80"
                    min={0}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fuelType">Fuel Type</Label>
                  <Select
                    value={newVehicle.fuelType}
                    onValueChange={(value) => setNewVehicle({ ...newVehicle, fuelType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DIESEL">Diesel</SelectItem>
                      <SelectItem value="GASOLINE">Gasoline</SelectItem>
                      <SelectItem value="ELECTRIC">Electric</SelectItem>
                      <SelectItem value="HYBRID">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Compliance Section */}
            <div>
              <h3 className="font-medium mb-3">Compliance & Maintenance</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationExpiry">Registration Expiry</Label>
                  <Input
                    id="registrationExpiry"
                    type="date"
                    value={newVehicle.registrationExpiry}
                    onChange={(e) => setNewVehicle({ ...newVehicle, registrationExpiry: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insuranceExpiry">Insurance Expiry</Label>
                  <Input
                    id="insuranceExpiry"
                    type="date"
                    value={newVehicle.insuranceExpiry}
                    onChange={(e) => setNewVehicle({ ...newVehicle, insuranceExpiry: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastServiceDate">Last Service Date</Label>
                  <Input
                    id="lastServiceDate"
                    type="date"
                    value={newVehicle.lastServiceDate}
                    onChange={(e) => setNewVehicle({ ...newVehicle, lastServiceDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextServiceDate">Next Service Date</Label>
                  <Input
                    id="nextServiceDate"
                    type="date"
                    value={newVehicle.nextServiceDate}
                    onChange={(e) => setNewVehicle({ ...newVehicle, nextServiceDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddVehicle} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vehicle
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Vehicle Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
            <DialogDescription>
              Update {vehicleToEdit?.plateNumber} details
            </DialogDescription>
          </DialogHeader>

          {vehicleToEdit && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm font-medium">
                  Plate Number: <span className="font-mono">{vehicleToEdit.plateNumber}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Plate number cannot be changed
                </p>
              </div>

              {/* Same form structure as Add Dialog */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editSideNumber">Side Number (Optional)</Label>
                  <Input
                    id="editSideNumber"
                    value={editForm.sideNumber}
                    onChange={(e) => setEditForm({ ...editForm, sideNumber: e.target.value })}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editMake">Make *</Label>
                    <Select
                      value={editForm.make}
                      onValueChange={(value) => setEditForm({ ...editForm, make: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[200]">
                        {COMMON_MAKES.map(make => (
                          <SelectItem key={make} value={make}>{make}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editModel">Model *</Label>
                    <Input
                      id="editModel"
                      value={editForm.model}
                      onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editYear">Year *</Label>
                    <Input
                      id="editYear"
                      type="number"
                      value={editForm.year}
                      onChange={(e) => setEditForm({ ...editForm, year: parseInt(e.target.value) })}
                      min={1990}
                      max={new Date().getFullYear() + 1}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editColor">Color</Label>
                    <Input
                      id="editColor"
                      value={editForm.color}
                      onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editBusType">Bus Type *</Label>
                    <Select
                      value={editForm.busType}
                      onValueChange={(value) => setEditForm({ ...editForm, busType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[200]">
                        <SelectItem value="MINI">Mini Bus</SelectItem>
                        <SelectItem value="STANDARD">Standard Bus</SelectItem>
                        <SelectItem value="LUXURY">Luxury Bus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editTotalSeats">Total Seats *</Label>
                    <Input
                      id="editTotalSeats"
                      type="number"
                      value={editForm.totalSeats}
                      onChange={(e) => setEditForm({ ...editForm, totalSeats: parseInt(e.target.value) })}
                      min={4}
                      max={100}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {editForm.busType === "MINI" && "Mini Bus: 4-20 seats"}
                      {editForm.busType === "STANDARD" && "Standard Bus: 20-50 seats"}
                      {editForm.busType === "LUXURY" && "Luxury Bus: 30-60 seats"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editStatus">Status *</Label>
                    <Select
                      value={editForm.status}
                      onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[200]">
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Operational Data fields */}
                <div className="border-b pb-4 mb-4">
                  <h3 className="font-medium mb-3">Operational Data (Optional)</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Track operational metrics for predictive maintenance
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editCurrentOdometer">Current Odometer (km)</Label>
                      <Input
                        id="editCurrentOdometer"
                        type="number"
                        value={editForm.currentOdometer}
                        onChange={(e) => setEditForm({ ...editForm, currentOdometer: e.target.value })}
                        placeholder="75000"
                        min={0}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="editFuelCapacity">Fuel Capacity (liters)</Label>
                      <Input
                        id="editFuelCapacity"
                        type="number"
                        value={editForm.fuelCapacity}
                        onChange={(e) => setEditForm({ ...editForm, fuelCapacity: e.target.value })}
                        placeholder="80"
                        min={0}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="editFuelType">Fuel Type</Label>
                      <Select
                        value={editForm.fuelType}
                        onValueChange={(value) => setEditForm({ ...editForm, fuelType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[200]">
                          <SelectItem value="DIESEL">Diesel</SelectItem>
                          <SelectItem value="GASOLINE">Gasoline</SelectItem>
                          <SelectItem value="ELECTRIC">Electric</SelectItem>
                          <SelectItem value="HYBRID">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Compliance fields */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editRegistrationExpiry">Registration Expiry</Label>
                    <Input
                      id="editRegistrationExpiry"
                      type="date"
                      value={editForm.registrationExpiry}
                      onChange={(e) => setEditForm({ ...editForm, registrationExpiry: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editInsuranceExpiry">Insurance Expiry</Label>
                    <Input
                      id="editInsuranceExpiry"
                      type="date"
                      value={editForm.insuranceExpiry}
                      onChange={(e) => setEditForm({ ...editForm, insuranceExpiry: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editLastServiceDate">Last Service Date</Label>
                    <Input
                      id="editLastServiceDate"
                      type="date"
                      value={editForm.lastServiceDate}
                      onChange={(e) => setEditForm({ ...editForm, lastServiceDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editNextServiceDate">Next Service Date</Label>
                    <Input
                      id="editNextServiceDate"
                      type="date"
                      value={editForm.nextServiceDate}
                      onChange={(e) => setEditForm({ ...editForm, nextServiceDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditVehicle} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!vehicleToDelete} onOpenChange={() => setVehicleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the vehicle as inactive. Historical data will be preserved, but the vehicle will not be available for new trip assignments.
              {vehicles.find(v => v.id === vehicleToDelete) && (
                <div className="mt-3 p-3 rounded bg-muted">
                  <p className="text-sm font-medium text-foreground font-mono">
                    {vehicles.find(v => v.id === vehicleToDelete)?.plateNumber}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {vehicles.find(v => v.id === vehicleToDelete)?.make}{" "}
                    {vehicles.find(v => v.id === vehicleToDelete)?.model}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVehicle}
              className="bg-destructive hover:bg-destructive/90"
            >
              Deactivate Vehicle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

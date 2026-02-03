"use client"

import { useState, useEffect } from "react"
import {
  Gauge,
  Fuel,
  Play,
  CheckCircle,
  Loader2,
  AlertCircle,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
import { toast } from "sonner"

interface TripLog {
  id: string
  startOdometer: number | null
  startFuel: number | null
  startFuelUnit: string | null
  startedAt: string | null
  startedByName: string | null
  startNotes: string | null
  endOdometer: number | null
  endFuel: number | null
  endedAt: string | null
  endedByName: string | null
  endNotes: string | null
  distanceTraveled: number | null
  fuelConsumed: number | null
  fuelEfficiency: number | null
}

interface Vehicle {
  id: string
  plateNumber: string
  sideNumber: string | null
  currentOdometer: number | null
  fuelCapacity: number | null
}

interface TripLogCardProps {
  tripId: string
  vehicleId?: string | null
  tripStatus?: string  // Trip status to control when odometer can be recorded
  autoOpenStart?: boolean  // Auto-open start readings dialog when true
  autoOpenEnd?: boolean  // Auto-open end readings dialog when true (on completion)
  onDialogClose?: () => void  // Callback when dialog closes
}

export function TripLogCard({
  tripId,
  vehicleId,
  tripStatus = "SCHEDULED",
  autoOpenStart = false,
  autoOpenEnd = false,
  onDialogClose,
}: TripLogCardProps) {
  // Check if trip has departed (can record odometer)
  const canRecordOdometer = ["DEPARTED", "COMPLETED"].includes(tripStatus)
  const [tripLog, setTripLog] = useState<TripLog | null>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [canEdit, setCanEdit] = useState(false) // From API based on user role
  const [isAutoStatus, setIsAutoStatus] = useState(false) // Trip was auto-departed/completed by system
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"start" | "end">("start")

  // Form state
  const [form, setForm] = useState({
    odometer: "",
    fuel: "",
    fuelUnit: "LITERS",
    notes: "",
  })

  useEffect(() => {
    fetchTripLog()
  }, [tripId])

  // Auto-open start dialog when autoOpenStart prop becomes true
  useEffect(() => {
    if (autoOpenStart && !isLoading && canEdit && vehicleId) {
      // Only auto-open if start readings haven't been recorded yet
      const hasStarted = tripLog?.startOdometer != null && tripLog.startOdometer > 0
      if (!hasStarted) {
        openDialog("start")
      }
    }
  }, [autoOpenStart, isLoading, canEdit, vehicleId, tripLog])

  // Auto-open end dialog when autoOpenEnd prop becomes true (on trip completion)
  useEffect(() => {
    if (autoOpenEnd && !isLoading && canEdit && vehicleId) {
      // Only auto-open if start is recorded but end is not
      const hasStarted = tripLog?.startOdometer != null && tripLog.startOdometer > 0
      const hasEnded = tripLog?.endOdometer != null && tripLog.endOdometer > 0
      if (hasStarted && !hasEnded) {
        openDialog("end")
      }
    }
  }, [autoOpenEnd, isLoading, canEdit, vehicleId, tripLog])

  const fetchTripLog = async () => {
    try {
      const response = await fetch(`/api/company/trips/${tripId}/log`)
      if (response.ok) {
        const data = await response.json()
        setTripLog(data.tripLog)
        setVehicle(data.vehicle)
        setCanEdit(data.canEdit || false) // Set edit permission from API
        setIsAutoStatus(data.isAutoStatus || false) // Trip was auto-transitioned
      }
    } catch (error) {
      console.error("Failed to fetch trip log:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const openDialog = (mode: "start" | "end") => {
    setDialogMode(mode)
    if (mode === "start") {
      // Pre-fill with existing values if editing, otherwise use vehicle's current odometer
      setForm({
        odometer: tripLog?.startOdometer?.toString() || vehicle?.currentOdometer?.toString() || "",
        fuel: tripLog?.startFuel?.toString() || "",
        fuelUnit: tripLog?.startFuelUnit || "LITERS",
        notes: tripLog?.startNotes || "",
      })
    } else {
      // Pre-fill with existing values if editing
      setForm({
        odometer: tripLog?.endOdometer?.toString() || "",
        fuel: tripLog?.endFuel?.toString() || "",
        fuelUnit: tripLog?.startFuelUnit || "LITERS",
        notes: tripLog?.endNotes || "",
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.odometer) {
      toast.error("Odometer reading is required")
      return
    }

    setIsSubmitting(true)
    try {
      // QA-10 FIX: Validate odometer reading before parseInt
      const odometerValue = parseInt(form.odometer, 10)
      if (isNaN(odometerValue) || odometerValue < 0) {
        toast.error("Please enter a valid odometer reading")
        setIsSubmitting(false)
        return
      }

      const body =
        dialogMode === "start"
          ? {
              startOdometer: odometerValue,
              startFuel: form.fuel ? parseFloat(form.fuel) : undefined,
              startFuelUnit: form.fuel ? form.fuelUnit : undefined,
              startNotes: form.notes || undefined,
            }
          : {
              endOdometer: odometerValue,
              endFuel: form.fuel ? parseFloat(form.fuel) : undefined,
              endNotes: form.notes || undefined,
            }

      const response = await fetch(
        `/api/company/trips/${tripId}/log?action=${dialogMode}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      )

      if (response.ok) {
        toast.success(
          dialogMode === "start"
            ? "Start readings recorded"
            : "End readings recorded"
        )
        setDialogOpen(false)
        fetchTripLog()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to save readings")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!vehicleId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gauge className="h-5 w-5" />
            Trip Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No vehicle assigned to this trip</p>
            <p className="text-xs mt-1">
              Assign a vehicle to track odometer and fuel
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gauge className="h-5 w-5" />
            Trip Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Check for actual readings (not just record existence)
  // Treat 0 or null as "no reading"
  const hasStarted = tripLog?.startOdometer != null && tripLog.startOdometer > 0
  const hasEnded = tripLog?.endOdometer != null && tripLog.endOdometer > 0

  return (
    <>
      <Card className={isAutoStatus ? "opacity-60 bg-muted/30" : ""}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gauge className="h-5 w-5" />
            Trip Log
          </CardTitle>
          {hasStarted && hasEnded ? (
            <Badge variant="outline" className="bg-green-100 text-green-900 border-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          ) : hasStarted ? (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-900 border-yellow-300">
              In Progress
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-100 text-gray-900 border-gray-300">
              Not Started
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Vehicle Info */}
          {vehicle && (
            <div className="text-sm text-muted-foreground">
              Vehicle: {vehicle.plateNumber}
              {vehicle.sideNumber && ` (${vehicle.sideNumber})`}
            </div>
          )}

          {/* Auto-transitioned trip message */}
          {isAutoStatus && (
            <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <AlertCircle className="h-4 w-4 inline mr-2 text-blue-500" />
              Trip was automatically {tripStatus === 'DEPARTED' ? 'departed' : 'completed'} by the system.
              No manual log recording required.
            </div>
          )}

          {/* Start Readings */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center gap-2">
                <Play className="h-4 w-4 text-green-600" />
                Start Readings
              </h4>
              {canEdit && canRecordOdometer && (
                <Button
                  size="sm"
                  variant={hasStarted ? "outline" : "default"}
                  onClick={() => openDialog("start")}
                >
                  {hasStarted ? "Edit" : "Record Start"}
                </Button>
              )}
            </div>

            {hasStarted ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Odometer</p>
                  <p className="font-mono font-medium">
                    {tripLog?.startOdometer?.toLocaleString()} km
                  </p>
                </div>
                {tripLog?.startFuel && (
                  <div>
                    <p className="text-muted-foreground">Fuel</p>
                    <p className="font-mono font-medium">
                      {tripLog.startFuel}{" "}
                      {tripLog.startFuelUnit === "PERCENTAGE" ? "%" : "L"}
                    </p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-muted-foreground">Recorded</p>
                  <p className="text-xs">
                    {tripLog?.startedAt &&
                      new Date(tripLog.startedAt).toLocaleString()}{" "}
                    by {tripLog?.startedByName || "Unknown"}
                  </p>
                </div>
                {tripLog?.startNotes && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Notes</p>
                    <p className="text-xs">{tripLog.startNotes}</p>
                  </div>
                )}
              </div>
            ) : !canRecordOdometer ? (
              <div className="text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 inline mr-1 text-orange-500" />
                Trip must depart before recording odometer
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No start readings recorded yet
              </p>
            )}
          </div>

          {/* End Readings */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                End Readings
              </h4>
              {canEdit && hasStarted && (
                <Button
                  size="sm"
                  variant={hasEnded ? "outline" : "default"}
                  onClick={() => openDialog("end")}
                >
                  {hasEnded ? "Edit" : "Record End"}
                </Button>
              )}
            </div>

            {hasEnded ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Odometer</p>
                  <p className="font-mono font-medium">
                    {tripLog?.endOdometer?.toLocaleString()} km
                  </p>
                </div>
                {tripLog?.endFuel !== null && tripLog?.endFuel !== undefined && (
                  <div>
                    <p className="text-muted-foreground">Fuel</p>
                    <p className="font-mono font-medium">
                      {tripLog.endFuel}{" "}
                      {tripLog?.startFuelUnit === "PERCENTAGE" ? "%" : "L"}
                    </p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-muted-foreground">Recorded</p>
                  <p className="text-xs">
                    {tripLog?.endedAt &&
                      new Date(tripLog.endedAt).toLocaleString()}{" "}
                    by {tripLog?.endedByName || "Unknown"}
                  </p>
                </div>
                {tripLog?.endNotes && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Notes</p>
                    <p className="text-xs">{tripLog.endNotes}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {hasStarted
                  ? "Trip in progress - record end readings when complete"
                  : "Record start readings first"}
              </p>
            )}
          </div>

          {/* Trip Metrics */}
          {hasEnded && tripLog && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                Trip Metrics
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Distance</p>
                  <p className="font-mono font-bold text-lg">
                    {tripLog.distanceTraveled?.toLocaleString() || 0} km
                  </p>
                </div>
                {tripLog.fuelConsumed !== null && (
                  <div>
                    <p className="text-muted-foreground">Fuel Used</p>
                    <p className="font-mono font-bold text-lg">
                      {tripLog.fuelConsumed?.toFixed(1)} L
                    </p>
                  </div>
                )}
                {tripLog.fuelEfficiency !== null && (
                  <div>
                    <p className="text-muted-foreground">Efficiency</p>
                    <p className="font-mono font-bold text-lg">
                      {tripLog.fuelEfficiency?.toFixed(1)} km/L
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Readings Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open && onDialogClose) {
          onDialogClose()
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "start"
                ? "Record Start Readings"
                : "Record End Readings"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "start"
                ? "Enter odometer and fuel readings before the trip begins"
                : "Enter odometer and fuel readings after the trip ends"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="odometer">Odometer Reading (km) *</Label>
              <Input
                id="odometer"
                type="number"
                value={form.odometer}
                onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                placeholder={
                  vehicle?.currentOdometer?.toString() || "Enter km"
                }
              />
              {vehicle?.currentOdometer && dialogMode === "start" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last known: {vehicle.currentOdometer.toLocaleString()} km
                </p>
              )}
              {tripLog?.startOdometer && dialogMode === "end" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Start was: {tripLog.startOdometer.toLocaleString()} km
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fuel">Fuel Level</Label>
                <Input
                  id="fuel"
                  type="number"
                  step="0.1"
                  value={form.fuel}
                  onChange={(e) => setForm({ ...form, fuel: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              {dialogMode === "start" && (
                <div>
                  <Label htmlFor="fuelUnit">Unit</Label>
                  <Select
                    value={form.fuelUnit}
                    onValueChange={(v) => setForm({ ...form, fuelUnit: v })}
                  >
                    <SelectTrigger id="fuelUnit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[200]">
                      <SelectItem value="LITERS">Liters</SelectItem>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any observations..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Readings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

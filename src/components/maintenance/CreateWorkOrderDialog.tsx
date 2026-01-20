"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { StaffSelector, type StaffMember } from "./StaffSelector"

interface Vehicle {
  id: string
  plateNumber: string
  sideNumber: string | null
  make: string
  model: string
}

interface CreateWorkOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateWorkOrderDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateWorkOrderDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingData, setIsFetchingData] = useState(true)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])

  const [formData, setFormData] = useState({
    vehicleId: "",
    title: "",
    taskType: "CORRECTIVE" as const,
    description: "",
    priority: 2, // 1=Low, 2=Normal, 3=High, 4=Urgent
    assignedMechanicId: "",
    serviceProvider: "", // External shop name
    scheduledDate: "",
  })

  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open])

  const fetchData = async () => {
    try {
      setIsFetchingData(true)
      const [vehiclesRes, staffRes] = await Promise.all([
        fetch("/api/company/vehicles"),
        fetch("/api/company/staff"),
      ])

      const vehiclesData = await vehiclesRes.json()
      const staffData = await staffRes.json()

      setVehicles(vehiclesData.vehicles || [])

      // Get all staff members (mechanics, supervisors, etc.)
      // Filter to maintenance-related roles if needed
      const allStaff = (staffData.staff || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        staffRole: s.staffRole,
        email: s.email,
      }))
      setStaff(allStaff)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load vehicles and mechanics")
    } finally {
      setIsFetchingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.vehicleId) {
      toast.error("Please select a vehicle")
      return
    }

    if (!formData.title.trim() || formData.title.length < 3) {
      toast.error("Title must be at least 3 characters")
      return
    }

    if (!formData.description.trim() || formData.description.length < 5) {
      toast.error("Description must be at least 5 characters")
      return
    }

    setIsLoading(true)

    try {
      const payload = {
        vehicleId: formData.vehicleId,
        title: formData.title,
        taskType: formData.taskType,
        description: formData.description,
        priority: formData.priority,
        assignedMechanicId: formData.assignedMechanicId && formData.assignedMechanicId !== "unassigned"
          ? formData.assignedMechanicId
          : undefined,
        serviceProvider: formData.serviceProvider || undefined,
        scheduledDate: formData.scheduledDate
          ? new Date(formData.scheduledDate).toISOString()
          : undefined,
      }

      const response = await fetch("/api/company/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create work order")
      }

      toast.success("Work order created successfully")

      // Reset form
      setFormData({
        vehicleId: "",
        title: "",
        taskType: "CORRECTIVE",
        description: "",
        priority: 2,
        assignedMechanicId: "",
        serviceProvider: "",
        scheduledDate: "",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error creating work order:", error)
      toast.error(error.message || "Failed to create work order")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Work Order</DialogTitle>
          <DialogDescription>
            Create a new maintenance or repair work order for a vehicle
          </DialogDescription>
        </DialogHeader>

        {isFetchingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Loading vehicles and staff...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Vehicle Selection */}
            <div className="space-y-2">
              <Label htmlFor="vehicle">Vehicle *</Label>
              <Select
                value={formData.vehicleId}
                onValueChange={(value) =>
                  setFormData({ ...formData, vehicleId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.plateNumber}
                      {vehicle.sideNumber && ` (${vehicle.sideNumber})`} -{" "}
                      {vehicle.make} {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Work Order Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Oil change, Brake repair, Engine inspection"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                minLength={3}
                maxLength={200}
              />
            </div>

            {/* Work Type & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taskType">Work Type *</Label>
                <Select
                  value={formData.taskType}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, taskType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PREVENTIVE">Preventive</SelectItem>
                    <SelectItem value="CORRECTIVE">Corrective</SelectItem>
                    <SelectItem value="INSPECTION">Inspection</SelectItem>
                    <SelectItem value="EMERGENCY">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority.toString()}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, priority: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Low</SelectItem>
                    <SelectItem value="2">Normal</SelectItem>
                    <SelectItem value="3">High</SelectItem>
                    <SelectItem value="4">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the issue or maintenance task in detail..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                required
                minLength={5}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/2000 characters
              </p>
            </div>

            {/* Assigned Staff Member */}
            <div className="space-y-2">
              <Label htmlFor="staff">Assigned Staff Member</Label>
              <StaffSelector
                staff={staff}
                value={formData.assignedMechanicId}
                onValueChange={(value) =>
                  setFormData({ ...formData, assignedMechanicId: value })
                }
                placeholder="Search by name, role, or ID..."
                showUnassigned={true}
                // Optionally filter to maintenance roles only:
                // allowedRoles={["MECHANIC", "SUPERVISOR", "MAINTENANCE_LEAD"]}
              />
              <p className="text-xs text-muted-foreground">
                Search and assign any staff member to this work order
              </p>
            </div>

            {/* External Shop (if not using internal mechanic) */}
            <div className="border-t pt-4">
              <Label htmlFor="serviceProvider">External Shop (Optional)</Label>
              <Input
                id="serviceProvider"
                placeholder="e.g., ABC Auto Repair"
                value={formData.serviceProvider}
                onChange={(e) =>
                  setFormData({ ...formData, serviceProvider: e.target.value })
                }
              />
            </div>

            {/* Scheduled Date */}
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Scheduled Date (Optional)</Label>
              <Input
                id="scheduledDate"
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) =>
                  setFormData({ ...formData, scheduledDate: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Work Order"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import {
  Wrench,
  ArrowLeft,
  Loader2,
  Calendar,
  User,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  Edit,
  Trash2,
  AlertCircle,
  Plus,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { WorkOrderChat } from "@/components/maintenance/WorkOrderChat"

interface WorkOrder {
  id: string
  workOrderNumber: string
  title: string
  description: string | null
  taskType: string
  priority: number
  status: string
  vehicleId: string
  vehicle: {
    plateNumber: string
    sideNumber: string | null
    make: string
    model: string
    year: number
  }
  scheduledDate: string | null
  startedAt: string | null
  completedAt: string | null
  assignedToId: string | null
  assignedToName: string | null
  assignedStaffIds: string | null // Issue 3.2: JSON array of staff IDs
  serviceProvider: string | null
  odometerAtService: number | null
  laborCost: number
  partsCost: number
  totalCost: number
  completionNotes: string | null
  mechanicSignature: string | null
  createdAt: string
  partsUsed: Array<{
    id: string
    partName: string
    partNumber: string | null
    quantity: number
    unitPrice: number
    totalPrice: number
    supplier: string | null
    // Issue 3.3: Parts approval workflow fields
    status: string | null
    notes: string | null
    requestedBy: string | null
    requestedAt: string | null
    approvedBy: string | null
    approvedAt: string | null
  }>
}

// Issue 3.3: Part status styling
const PART_STATUS_INFO = {
  REQUESTED: { label: "Pending Approval", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-800 border-green-300" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-300" },
  ORDERED: { label: "Ordered", color: "bg-blue-100 text-blue-800 border-blue-300" },
}

const STATUS_OPTIONS = [
  { value: "OPEN", label: "Open", color: "bg-blue-100 text-blue-900 border border-blue-300" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-yellow-100 text-yellow-900 border border-yellow-300" },
  { value: "BLOCKED", label: "Blocked", color: "bg-red-100 text-red-900 border border-red-300" },
  { value: "COMPLETED", label: "Completed", color: "bg-green-100 text-green-900 border border-green-300" },
  { value: "CANCELLED", label: "Cancelled", color: "bg-gray-100 text-gray-900 border border-gray-300" },
]

const PRIORITY_INFO = {
  1: { label: "Low", color: "bg-gray-100 text-gray-900 border border-gray-300" },
  2: { label: "Normal", color: "bg-blue-100 text-blue-900 border border-blue-300" },
  3: { label: "High", color: "bg-orange-100 text-orange-900 border border-orange-300" },
  4: { label: "Urgent", color: "bg-red-100 text-red-900 border border-red-300" },
}

export default function WorkOrderDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const workOrderId = params.workOrderId as string

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  // Edit dialog state
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    description: "",
    priority: 2,
    laborCost: 0,
    notes: "",
    scheduledDate: "",
  })

  // Delete dialog state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Parts dialog state
  const [isAddPartOpen, setIsAddPartOpen] = useState(false)
  const [partForm, setPartForm] = useState({
    partName: "",
    partNumber: "",
    quantity: 1,
    unitPrice: 0,
    supplier: "",
  })
  const [isAddingPart, setIsAddingPart] = useState(false)

  // Issue 3.3: Parts approval state
  const [approvingPartId, setApprovingPartId] = useState<string | null>(null)

  useEffect(() => {
    if (status === "authenticated") {
      if (session.user.role !== "COMPANY_ADMIN") {
        router.push("/")
        return
      }
      fetchWorkOrder()
    }
  }, [status, session, router, workOrderId])

  const fetchWorkOrder = async () => {
    try {
      const response = await fetch(`/api/company/work-orders/${workOrderId}`)
      const data = await response.json()

      if (response.ok) {
        setWorkOrder(data.workOrder)
      } else {
        toast.error("Failed to load work order")
        router.push("/company/work-orders")
      }
    } catch (error) {
      console.error("Failed to fetch work order:", error)
      toast.error("An error occurred")
      router.push("/company/work-orders")
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!workOrder) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/company/work-orders/${workOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          ...(newStatus === "IN_PROGRESS" && !workOrder.startedAt && { startedAt: new Date().toISOString() }),
          ...(newStatus === "COMPLETED" && { completedAt: new Date().toISOString() }),
        }),
      })

      if (response.ok) {
        toast.success("Status updated successfully")
        fetchWorkOrder()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to update status")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsUpdating(false)
    }
  }

  // Open edit dialog with current values
  const openEditDialog = () => {
    if (!workOrder) return
    setEditForm({
      description: workOrder.description || "",
      priority: workOrder.priority,
      laborCost: workOrder.laborCost,
      notes: workOrder.completionNotes || "",
      scheduledDate: workOrder.scheduledDate
        ? new Date(workOrder.scheduledDate).toISOString().split("T")[0]
        : "",
    })
    setIsEditOpen(true)
  }

  // Save edited work order
  const saveEdit = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/company/work-orders/${workOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: editForm.description,
          priority: editForm.priority,
          laborCost: editForm.laborCost,
          notes: editForm.notes || null,
          scheduledDate: editForm.scheduledDate
            ? new Date(editForm.scheduledDate).toISOString()
            : null,
        }),
      })

      if (response.ok) {
        toast.success("Work order updated successfully")
        setIsEditOpen(false)
        fetchWorkOrder()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to update work order")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsUpdating(false)
    }
  }

  // Delete work order
  const deleteWorkOrder = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/company/work-orders/${workOrderId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Work order deleted successfully")
        router.push("/company/work-orders")
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to delete work order")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsDeleting(false)
      setIsDeleteOpen(false)
    }
  }

  // Add part to work order
  const addPart = async () => {
    if (!partForm.partName || partForm.quantity < 1 || partForm.unitPrice < 0) {
      toast.error("Please fill in required part details")
      return
    }

    setIsAddingPart(true)
    try {
      const response = await fetch(`/api/company/work-orders/${workOrderId}/parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partName: partForm.partName,
          partNumber: partForm.partNumber || null,
          quantity: partForm.quantity,
          unitPrice: partForm.unitPrice,
          supplier: partForm.supplier || null,
        }),
      })

      if (response.ok) {
        toast.success("Part added successfully")
        setIsAddPartOpen(false)
        setPartForm({
          partName: "",
          partNumber: "",
          quantity: 1,
          unitPrice: 0,
          supplier: "",
        })
        fetchWorkOrder()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to add part")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsAddingPart(false)
    }
  }

  // Delete part from work order
  const deletePart = async (partId: string) => {
    try {
      const response = await fetch(`/api/company/work-orders/${workOrderId}/parts/${partId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Part removed")
        fetchWorkOrder()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to remove part")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  // Issue 3.3: Approve or reject a part request
  const updatePartStatus = async (partId: string, newStatus: "APPROVED" | "REJECTED" | "ORDERED") => {
    setApprovingPartId(partId)
    try {
      const response = await fetch(`/api/company/work-orders/${workOrderId}/parts/${partId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const statusLabel = newStatus === "APPROVED" ? "approved" : newStatus === "REJECTED" ? "rejected" : "marked as ordered"
        toast.success(`Part ${statusLabel}`)
        fetchWorkOrder()
      } else {
        const data = await response.json()
        toast.error(data.error || `Failed to update part status`)
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setApprovingPartId(null)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading work order...</p>
        </div>
      </div>
    )
  }

  if (!workOrder) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-lg font-medium">Work order not found</p>
          <Button onClick={() => router.push("/company/work-orders")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Work Orders
          </Button>
        </div>
      </div>
    )
  }

  const statusInfo = STATUS_OPTIONS.find((s) => s.value === workOrder.status)
  const priorityInfo = PRIORITY_INFO[workOrder.priority as keyof typeof PRIORITY_INFO]

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/company/work-orders")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Work Orders
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Wrench className="h-8 w-8 text-primary" />
              {workOrder.workOrderNumber}
            </h1>
            <p className="text-muted-foreground mt-1">{workOrder.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={priorityInfo.color}>{priorityInfo.label} Priority</Badge>
            <Select
              value={workOrder.status}
              onValueChange={updateStatus}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Work Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Work Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle</p>
                  <p className="font-medium font-mono">
                    {workOrder.vehicle.plateNumber}
                    {workOrder.vehicle.sideNumber && ` (${workOrder.vehicle.sideNumber})`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {workOrder.vehicle.year} {workOrder.vehicle.make} {workOrder.vehicle.model}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Task Type</p>
                  <Badge variant="outline">{workOrder.taskType}</Badge>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Assigned To</p>
                  {/* Issue 3.2: Multi-staff display */}
                  {(() => {
                    let staffCount = 0
                    if (workOrder.assignedStaffIds) {
                      try {
                        const staffIds = JSON.parse(workOrder.assignedStaffIds)
                        staffCount = Array.isArray(staffIds) ? staffIds.length : 0
                      } catch {
                        staffCount = workOrder.assignedToName ? 1 : 0
                      }
                    } else if (workOrder.assignedToName) {
                      staffCount = 1
                    }

                    return (
                      <div>
                        <p className="font-medium">
                          {workOrder.assignedToName || "Unassigned"}
                          {staffCount > 1 && (
                            <span className="ml-1 text-muted-foreground font-normal">
                              (+{staffCount - 1} more)
                            </span>
                          )}
                        </p>
                        {staffCount > 1 && (
                          <p className="text-xs text-muted-foreground">
                            {staffCount} staff assigned
                          </p>
                        )}
                      </div>
                    )
                  })()}
                  {workOrder.serviceProvider && (
                    <p className="text-sm text-muted-foreground">External: {workOrder.serviceProvider}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Scheduled Date</p>
                  <p className="font-medium">
                    {workOrder.scheduledDate
                      ? new Date(workOrder.scheduledDate).toLocaleDateString()
                      : "Not scheduled"}
                  </p>
                </div>

                {workOrder.odometerAtService && (
                  <div>
                    <p className="text-sm text-muted-foreground">Odometer at Service</p>
                    <p className="font-medium">{workOrder.odometerAtService.toLocaleString()} km</p>
                  </div>
                )}
              </div>

              {workOrder.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Description</p>
                    <p className="text-sm whitespace-pre-wrap">{workOrder.description}</p>
                  </div>
                </>
              )}

              {workOrder.completionNotes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Completion Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{workOrder.completionNotes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Parts Used */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Parts Used
              </CardTitle>
              <Button size="sm" onClick={() => setIsAddPartOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Part
              </Button>
            </CardHeader>
            <CardContent>
              {workOrder.partsUsed.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No parts recorded yet</p>
                  <p className="text-xs mt-1">
                    Add parts to track costs automatically
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {workOrder.partsUsed.map((part) => {
                    const statusInfo = part.status ? PART_STATUS_INFO[part.status as keyof typeof PART_STATUS_INFO] : null
                    const isRequested = part.status === "REQUESTED"
                    const isLoading = approvingPartId === part.id

                    return (
                      <div
                        key={part.id}
                        className={`p-3 border rounded-lg group ${isRequested ? "border-yellow-300 bg-yellow-50/50" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{part.partName}</p>
                              {/* Issue 3.3: Status badge */}
                              {statusInfo && (
                                <Badge variant="outline" className={statusInfo.color}>
                                  {statusInfo.label}
                                </Badge>
                              )}
                            </div>
                            {part.partNumber && (
                              <p className="text-xs text-muted-foreground font-mono">
                                PN: {part.partNumber}
                              </p>
                            )}
                            {part.supplier && (
                              <p className="text-xs text-muted-foreground">
                                Supplier: {part.supplier}
                              </p>
                            )}
                            {part.notes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Note: {part.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-medium">{part.totalPrice.toLocaleString()} Birr</p>
                              <p className="text-xs text-muted-foreground">
                                {part.quantity} × {part.unitPrice.toLocaleString()} Birr
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                              onClick={() => deletePart(part.id)}
                              disabled={isLoading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Issue 3.3: Approval buttons for REQUESTED parts */}
                        {isRequested && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-yellow-200">
                            <span className="text-xs text-muted-foreground mr-auto">
                              Requested by mechanic - awaiting approval
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => updatePartStatus(part.id, "REJECTED")}
                              disabled={isLoading}
                            >
                              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reject"}
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => updatePartStatus(part.id, "APPROVED")}
                              disabled={isLoading}
                            >
                              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve"}
                            </Button>
                          </div>
                        )}

                        {/* Mark as ordered for approved parts */}
                        {part.status === "APPROVED" && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                            <span className="text-xs text-muted-foreground mr-auto">
                              Approved - Ready to order
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updatePartStatus(part.id, "ORDERED")}
                              disabled={isLoading}
                            >
                              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Mark as Ordered"}
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work Order Chat */}
          <WorkOrderChat
            workOrderId={workOrder.id}
            workOrderNumber={workOrder.workOrderNumber}
            defaultExpanded={true}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cost Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Cost Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Labor Cost</span>
                <span className="font-medium">{workOrder.laborCost.toLocaleString()} Birr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Parts Cost</span>
                <span className="font-medium">{workOrder.partsCost.toLocaleString()} Birr</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium">Total Cost</span>
                <span className="text-lg font-bold">{workOrder.totalCost.toLocaleString()} Birr</span>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm font-medium">
                  {new Date(workOrder.createdAt).toLocaleString()}
                </p>
              </div>

              {workOrder.startedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Started</p>
                  <p className="text-sm font-medium">
                    {new Date(workOrder.startedAt).toLocaleString()}
                  </p>
                </div>
              )}

              {workOrder.completedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-sm font-medium">
                    {new Date(workOrder.completedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* v2.10.6: Disable Edit button for COMPLETED work orders */}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={openEditDialog}
                disabled={workOrder.status === "COMPLETED"}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Work Order
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => setIsDeleteOpen(true)}
                disabled={workOrder.status === "COMPLETED"}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Work Order
              </Button>
              {workOrder.status === "COMPLETED" && (
                <p className="text-xs text-muted-foreground">
                  Completed work orders cannot be edited or deleted
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Work Order Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Work Order</DialogTitle>
            <DialogDescription>
              Update work order details and costs
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder="Work order description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={editForm.priority.toString()}
                  onValueChange={(v) =>
                    setEditForm({ ...editForm, priority: parseInt(v) })
                  }
                >
                  <SelectTrigger id="edit-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[200]">
                    <SelectItem value="1">Low</SelectItem>
                    <SelectItem value="2">Normal</SelectItem>
                    <SelectItem value="3">High</SelectItem>
                    <SelectItem value="4">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-laborCost">Labor Cost (Birr)</Label>
                <Input
                  id="edit-laborCost"
                  type="number"
                  min="0"
                  value={editForm.laborCost}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      laborCost: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-scheduledDate">Scheduled Date</Label>
              <Input
                id="edit-scheduledDate"
                type="date"
                value={editForm.scheduledDate}
                onChange={(e) =>
                  setEditForm({ ...editForm, scheduledDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-notes">Completion Notes</Label>
              <Textarea
                id="edit-notes"
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm({ ...editForm, notes: e.target.value })
                }
                placeholder="Notes about the work completed..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Work Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete work order{" "}
              <strong>{workOrder.workOrderNumber}</strong> and all associated
              parts records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteWorkOrder}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Part Dialog */}
      <Dialog open={isAddPartOpen} onOpenChange={setIsAddPartOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Part</DialogTitle>
            <DialogDescription>
              Add a part used in this work order. Parts costs are automatically
              calculated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="part-name">Part Name *</Label>
              <Input
                id="part-name"
                value={partForm.partName}
                onChange={(e) =>
                  setPartForm({ ...partForm, partName: e.target.value })
                }
                placeholder="e.g., Oil Filter"
              />
            </div>
            <div>
              <Label htmlFor="part-number">Part Number</Label>
              <Input
                id="part-number"
                value={partForm.partNumber}
                onChange={(e) =>
                  setPartForm({ ...partForm, partNumber: e.target.value })
                }
                placeholder="e.g., OF-12345"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="part-quantity">Quantity *</Label>
                <Input
                  id="part-quantity"
                  type="number"
                  min="1"
                  value={partForm.quantity}
                  onChange={(e) =>
                    setPartForm({
                      ...partForm,
                      quantity: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="part-unitPrice">Unit Price (Birr) *</Label>
                <Input
                  id="part-unitPrice"
                  type="number"
                  min="0"
                  value={partForm.unitPrice}
                  onChange={(e) =>
                    setPartForm({
                      ...partForm,
                      unitPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="part-supplier">Supplier</Label>
              <Input
                id="part-supplier"
                value={partForm.supplier}
                onChange={(e) =>
                  setPartForm({ ...partForm, supplier: e.target.value })
                }
                placeholder="e.g., ABC Auto Parts"
              />
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">
                  {(partForm.quantity * partForm.unitPrice).toLocaleString()} Birr
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPartOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addPart} disabled={isAddingPart}>
              {isAddingPart && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Part
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

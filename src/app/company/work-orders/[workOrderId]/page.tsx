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
  }>
}

const STATUS_OPTIONS = [
  { value: "OPEN", label: "Open", color: "bg-blue-100 text-blue-800" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
  { value: "BLOCKED", label: "Blocked", color: "bg-red-100 text-red-800" },
  { value: "COMPLETED", label: "Completed", color: "bg-green-100 text-green-800" },
  { value: "CANCELLED", label: "Cancelled", color: "bg-gray-100 text-gray-800" },
]

const PRIORITY_INFO = {
  1: { label: "Low", color: "bg-gray-100 text-gray-800" },
  2: { label: "Normal", color: "bg-blue-100 text-blue-800" },
  3: { label: "High", color: "bg-orange-100 text-orange-800" },
  4: { label: "Urgent", color: "bg-red-100 text-red-800" },
}

export default function WorkOrderDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const workOrderId = params.workOrderId as string

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

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
                  <p className="font-medium">{workOrder.assignedToName || "Unassigned"}</p>
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
          {workOrder.partsUsed.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Parts Used
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workOrder.partsUsed.map((part) => (
                    <div
                      key={part.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{part.partName}</p>
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
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{part.totalPrice.toLocaleString()} Birr</p>
                        <p className="text-xs text-muted-foreground">
                          {part.quantity} × {part.unitPrice.toLocaleString()} Birr
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
              <Button variant="outline" className="w-full justify-start">
                <Edit className="h-4 w-4 mr-2" />
                Edit Work Order
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Work Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

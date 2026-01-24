"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import {
  Wrench,
  ArrowLeft,
  Loader2,
  Calendar,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  Play,
  Pause,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { MechanicWorkOrderChat } from "@/components/maintenance/MechanicWorkOrderChat"

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
    id: string
    plateNumber: string
    sideNumber: string | null
    make: string
    model: string
    year: number
    currentOdometer: number | null
  }
  scheduledDate: string | null
  startedAt: string | null
  completedAt: string | null
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
  { value: "OPEN", label: "Open", color: "bg-blue-100 text-blue-800", icon: Clock },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-yellow-100 text-yellow-800", icon: Play },
  { value: "BLOCKED", label: "Blocked", color: "bg-red-100 text-red-800", icon: Pause },
  { value: "COMPLETED", label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle },
]

const PRIORITY_INFO: Record<number, { label: string; color: string }> = {
  1: { label: "Low", color: "bg-gray-100 text-gray-800" },
  2: { label: "Normal", color: "bg-blue-100 text-blue-800" },
  3: { label: "High", color: "bg-orange-100 text-orange-800" },
  4: { label: "Urgent", color: "bg-red-100 text-red-800" },
}

export default function MechanicWorkOrderDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const workOrderId = params.workOrderId as string

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  // Completion form
  const [completionNotes, setCompletionNotes] = useState("")
  const [mechanicSignature, setMechanicSignature] = useState("")

  useEffect(() => {
    if (status === "authenticated") {
      if (session.user.role !== "COMPANY_ADMIN" || session.user.staffRole !== "MECHANIC") {
        router.push("/")
        return
      }
      fetchWorkOrder()
    }
  }, [status, session, router, workOrderId])

  const fetchWorkOrder = async () => {
    try {
      const response = await fetch(`/api/mechanic/work-orders/${workOrderId}`)
      const data = await response.json()

      if (response.ok) {
        setWorkOrder(data.workOrder)
        setCompletionNotes(data.workOrder.completionNotes || "")
        setMechanicSignature(data.workOrder.mechanicSignature || session?.user?.name || "")
      } else {
        toast.error("Failed to load work order")
        router.push("/mechanic")
      }
    } catch (error) {
      console.error("Failed to fetch work order:", error)
      toast.error("An error occurred")
      router.push("/mechanic")
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!workOrder) return

    setIsUpdating(true)
    try {
      const body: any = { status: newStatus }

      // If completing, include notes and signature
      if (newStatus === "COMPLETED") {
        body.completionNotes = completionNotes
        body.mechanicSignature = mechanicSignature
      }

      const response = await fetch(`/api/mechanic/work-orders/${workOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        toast.success(`Status updated to ${newStatus.replace("_", " ")}`)
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

  const saveNotes = async () => {
    if (!workOrder) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/mechanic/work-orders/${workOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completionNotes,
          mechanicSignature,
        }),
      })

      if (response.ok) {
        toast.success("Notes saved")
        fetchWorkOrder()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to save notes")
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
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
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
          <Button onClick={() => router.push("/mechanic")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Work Orders
          </Button>
        </div>
      </div>
    )
  }

  const statusInfo = STATUS_OPTIONS.find((s) => s.value === workOrder.status)
  const priorityInfo = PRIORITY_INFO[workOrder.priority] || PRIORITY_INFO[2]
  const StatusIcon = statusInfo?.icon || Clock

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/mechanic")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Work Orders
        </Button>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="font-mono text-base">
                {workOrder.workOrderNumber}
              </Badge>
              <Badge className={priorityInfo.color}>{priorityInfo.label} Priority</Badge>
            </div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Wrench className="h-7 w-7 text-amber-600" />
              {workOrder.title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={`${statusInfo?.color} text-sm py-1 px-3`}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {statusInfo?.label || workOrder.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle & Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Vehicle & Task Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle</p>
                  <p className="font-medium font-mono text-lg">
                    {workOrder.vehicle.plateNumber}
                  </p>
                  {workOrder.vehicle.sideNumber && (
                    <p className="text-sm text-muted-foreground">
                      Side #: {workOrder.vehicle.sideNumber}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-medium">
                    {workOrder.vehicle.year} {workOrder.vehicle.make} {workOrder.vehicle.model}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Task Type</p>
                  <Badge variant="outline">{workOrder.taskType}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled Date</p>
                  <p className="font-medium">
                    {workOrder.scheduledDate
                      ? new Date(workOrder.scheduledDate).toLocaleDateString()
                      : "Not scheduled"}
                  </p>
                </div>
                {workOrder.vehicle.currentOdometer && (
                  <div>
                    <p className="text-sm text-muted-foreground">Current Odometer</p>
                    <p className="font-medium font-mono">
                      {workOrder.vehicle.currentOdometer.toLocaleString()} km
                    </p>
                  </div>
                )}
                {workOrder.odometerAtService && (
                  <div>
                    <p className="text-sm text-muted-foreground">Odometer at Service</p>
                    <p className="font-medium font-mono">
                      {workOrder.odometerAtService.toLocaleString()} km
                    </p>
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
            </CardContent>
          </Card>

          {/* Parts List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Parts Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workOrder.partsUsed.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No parts listed for this work order</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {workOrder.partsUsed.map((part) => (
                    <div
                      key={part.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{part.partName}</p>
                        {part.partNumber && (
                          <p className="text-xs text-muted-foreground font-mono">
                            PN: {part.partNumber}
                          </p>
                        )}
                        {part.supplier && (
                          <p className="text-xs text-muted-foreground">
                            From: {part.supplier}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{part.quantity} pcs</p>
                        <p className="text-xs text-muted-foreground">
                          {part.totalPrice.toLocaleString()} Birr
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work Order Chat */}
          <MechanicWorkOrderChat
            workOrderId={workOrder.id}
            workOrderNumber={workOrder.workOrderNumber}
            defaultExpanded={true}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {workOrder.status !== "COMPLETED" && (
                <>
                  {workOrder.status === "OPEN" && (
                    <Button
                      className="w-full bg-yellow-600 hover:bg-yellow-700"
                      onClick={() => updateStatus("IN_PROGRESS")}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Start Work
                    </Button>
                  )}

                  {workOrder.status === "IN_PROGRESS" && (
                    <>
                      <Button
                        className="w-full bg-red-600 hover:bg-red-700"
                        onClick={() => updateStatus("BLOCKED")}
                        disabled={isUpdating}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Mark as Blocked
                      </Button>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 !text-white"
                        onClick={() => updateStatus("COMPLETED")}
                        disabled={isUpdating || !mechanicSignature}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Complete
                      </Button>
                    </>
                  )}

                  {workOrder.status === "BLOCKED" && (
                    <Button
                      className="w-full bg-yellow-600 hover:bg-yellow-700"
                      onClick={() => updateStatus("IN_PROGRESS")}
                      disabled={isUpdating}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Resume Work
                    </Button>
                  )}
                </>
              )}

              {workOrder.status === "COMPLETED" && (
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-2" />
                  <p className="font-medium text-green-700">Work Completed</p>
                  <p className="text-sm text-muted-foreground">
                    {workOrder.completedAt &&
                      new Date(workOrder.completedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completion Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Work Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notes">Completion Notes</Label>
                <Textarea
                  id="notes"
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Describe the work performed..."
                  rows={4}
                  disabled={workOrder.status === "COMPLETED"}
                />
              </div>

              <div>
                <Label htmlFor="signature">Your Signature</Label>
                <Input
                  id="signature"
                  value={mechanicSignature}
                  onChange={(e) => setMechanicSignature(e.target.value)}
                  placeholder="Your name"
                  disabled={workOrder.status === "COMPLETED"}
                />
              </div>

              {workOrder.status !== "COMPLETED" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={saveNotes}
                  disabled={isUpdating}
                >
                  {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Notes
                </Button>
              )}
            </CardContent>
          </Card>

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
                <span className="font-medium">Total</span>
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
        </div>
      </div>
    </div>
  )
}

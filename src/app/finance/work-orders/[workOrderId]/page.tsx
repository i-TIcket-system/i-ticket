"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import {
  Wrench,
  ArrowLeft,
  Loader2,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  User,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { FinanceWorkOrderChat } from "@/components/maintenance/FinanceWorkOrderChat"

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
  assignedToId: string | null
  assignedToName: string | null
  serviceProvider: string | null
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
    // v2.10.6: Parts status fields for finance visibility
    status: string | null
    notes: string | null
    requestedBy: string | null
    requestedAt: string | null
    approvedBy: string | null
    approvedAt: string | null
  }>
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-900 border border-blue-300",
  IN_PROGRESS: "bg-yellow-100 text-yellow-900 border border-yellow-300",
  BLOCKED: "bg-red-100 text-red-900 border border-red-300",
  COMPLETED: "bg-green-100 text-green-900 border border-green-300",
  CANCELLED: "bg-gray-100 text-gray-900 border border-gray-300",
}

const PRIORITY_INFO: Record<number, { label: string; color: string }> = {
  1: { label: "Low", color: "bg-gray-100 text-gray-900 border border-gray-300" },
  2: { label: "Normal", color: "bg-blue-100 text-blue-900 border border-blue-300" },
  3: { label: "High", color: "bg-orange-100 text-orange-900 border border-orange-300" },
  4: { label: "Urgent", color: "bg-red-100 text-red-900 border border-red-300" },
}

export default function FinanceWorkOrderDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const workOrderId = params.workOrderId as string

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "authenticated") {
      if (session.user.role !== "COMPANY_ADMIN" || session.user.staffRole !== "FINANCE") {
        router.push("/")
        return
      }
      fetchWorkOrder()
    }
  }, [status, session, router, workOrderId])

  // v2.10.6: Auto-refresh every 30 seconds to pick up parts status updates
  useEffect(() => {
    if (status !== "authenticated" || !workOrder) return

    const interval = setInterval(() => {
      // Only refresh if page is visible and work order is not completed
      if (document.visibilityState === "visible" && workOrder.status !== "COMPLETED") {
        fetchWorkOrder()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [status, workOrder?.status])

  const fetchWorkOrder = async () => {
    try {
      const response = await fetch(`/api/finance/work-orders/${workOrderId}`)
      const data = await response.json()

      if (response.ok) {
        setWorkOrder(data.workOrder)
      } else {
        toast.error("Failed to load work order")
        router.push("/finance/work-orders")
      }
    } catch (error) {
      console.error("Failed to fetch work order:", error)
      toast.error("An error occurred")
      router.push("/finance/work-orders")
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ET", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " Birr"
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
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
          <Button onClick={() => router.push("/finance/work-orders")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Work Orders
          </Button>
        </div>
      </div>
    )
  }

  const priorityInfo = PRIORITY_INFO[workOrder.priority] || PRIORITY_INFO[2]

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/finance/work-orders")}
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
              <Badge className={STATUS_COLORS[workOrder.status] || "bg-gray-100"}>
                {workOrder.status.replace("_", " ")}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <DollarSign className="h-7 w-7 text-emerald-600" />
              {workOrder.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle & Task Details */}
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
                  <p className="text-sm text-muted-foreground">Assigned Mechanic</p>
                  <p className="font-medium">
                    {workOrder.assignedToName || "Unassigned"}
                  </p>
                </div>
                {workOrder.serviceProvider && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">External Service Provider</p>
                    <p className="font-medium">{workOrder.serviceProvider}</p>
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
                    {workOrder.mechanicSignature && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Signed by: {workOrder.mechanicSignature}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Parts Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Parts Cost Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workOrder.partsUsed.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No parts recorded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {workOrder.partsUsed.map((part) => {
                    // v2.10.6: Part status styling for finance view
                    const statusColors: Record<string, string> = {
                      REQUESTED: "bg-yellow-100 text-yellow-800 border-yellow-300",
                      APPROVED: "bg-green-100 text-green-800 border-green-300",
                      REJECTED: "bg-red-100 text-red-800 border-red-300",
                      ORDERED: "bg-blue-100 text-blue-800 border-blue-300",
                    }
                    const statusColor = part.status ? statusColors[part.status] : ""

                    return (
                      <div
                        key={part.id}
                        className={`p-3 border rounded-lg ${
                          part.status === "ORDERED" ? "border-blue-300 bg-blue-50/30" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{part.partName}</p>
                              {/* v2.10.6: Show status badge */}
                              {part.status && (
                                <Badge variant="outline" className={statusColor}>
                                  {part.status}
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
                          <div className="text-right">
                            <p className="font-mono font-medium">
                              {formatCurrency(part.totalPrice)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {part.quantity} × {formatCurrency(part.unitPrice)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  <Separator />

                  <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Total Parts Cost</span>
                    <span className="font-mono font-bold">
                      {formatCurrency(workOrder.partsCost)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work Order Chat */}
          <FinanceWorkOrderChat
            workOrderId={workOrder.id}
            workOrderNumber={workOrder.workOrderNumber}
            defaultExpanded={true}
          />
        </div>

        {/* Sidebar - Cost Summary */}
        <div className="space-y-6">
          {/* Cost Summary */}
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-emerald-800">
                <DollarSign className="h-5 w-5" />
                Cost Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-emerald-700">Labor Cost</span>
                <span className="font-mono font-medium text-emerald-900">
                  {formatCurrency(workOrder.laborCost)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-emerald-700">Parts Cost</span>
                <span className="font-mono font-medium text-emerald-900">
                  {formatCurrency(workOrder.partsCost)}
                </span>
              </div>
              <Separator className="bg-emerald-200" />
              <div className="flex justify-between items-center">
                <span className="font-semibold text-emerald-800">Total Cost</span>
                <span className="text-2xl font-bold text-emerald-900">
                  {formatCurrency(workOrder.totalCost)}
                </span>
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

              {workOrder.scheduledDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                  <p className="text-sm font-medium">
                    {new Date(workOrder.scheduledDate).toLocaleDateString()}
                  </p>
                </div>
              )}

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
                  <p className="text-sm font-medium text-green-600">
                    {new Date(workOrder.completedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Odometer Info */}
          {workOrder.odometerAtService && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Truck className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Odometer at Service</p>
                    <p className="font-mono font-bold">
                      {workOrder.odometerAtService.toLocaleString()} km
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

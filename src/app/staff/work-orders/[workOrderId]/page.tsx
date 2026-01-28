"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import {
  Wrench,
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  Play,
  Pause,
  MessageSquare,
  Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

/**
 * v2.10.6: Staff Work Order Detail Page
 * Simplified read-only view for Driver/Conductor with Team Communication
 * REMOVED: Cost Summary, Parts Used (not relevant for drivers/conductors)
 * ADDED: Full Team Communication with message sending
 */

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
  completionNotes: string | null
  createdAt: string
  messages: Array<{
    id: string
    senderId: string
    senderName: string
    senderRole: string
    message: string
    type: string
    createdAt: string
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

export default function StaffWorkOrderDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const workOrderId = params.workOrderId as string

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      if (
        session.user.role !== "COMPANY_ADMIN" ||
        !session.user.staffRole ||
        !["DRIVER", "CONDUCTOR"].includes(session.user.staffRole)
      ) {
        router.push("/")
        return
      }
      fetchWorkOrder()
    }
  }, [status, session, router, workOrderId])

  const fetchWorkOrder = async () => {
    try {
      const response = await fetch(`/api/staff/work-orders/${workOrderId}`)
      const data = await response.json()

      if (response.ok) {
        setWorkOrder(data.workOrder)
      } else {
        toast.error("Failed to load work order")
        router.push("/staff/work-orders")
      }
    } catch (error) {
      console.error("Failed to fetch work order:", error)
      toast.error("An error occurred")
      router.push("/staff/work-orders")
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    setIsSending(true)
    try {
      const response = await fetch(`/api/staff/work-orders/${workOrderId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage.trim() }),
      })

      if (response.ok) {
        setNewMessage("")
        toast.success("Message sent")
        fetchWorkOrder() // Refresh to show new message
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to send message")
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      toast.error("An error occurred")
    } finally {
      setIsSending(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
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
          <Button onClick={() => router.push("/staff/work-orders")}>
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
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/staff/work-orders")}
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
              <Wrench className="h-7 w-7 text-teal-600" />
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

          {/* Team Communication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Team Communication
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Message Input */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message to the team..."
                    rows={2}
                    className="resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="shrink-0"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>

              <Separator className="my-4" />

              {/* Messages List */}
              {workOrder.messages && workOrder.messages.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {workOrder.messages.map((msg) => {
                    const isOwnMessage = msg.senderId === session?.user?.id

                    return (
                      <div
                        key={msg.id}
                        className={`p-3 border rounded-lg ${
                          isOwnMessage ? "bg-teal-50 border-teal-200" : "bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {isOwnMessage ? "You" : msg.senderName}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {msg.senderRole}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {msg.message}
                        </p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs mt-1">Be the first to send a message</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              {workOrder.status === "COMPLETED" ? (
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-2" />
                  <p className="font-medium text-green-700">Work Completed</p>
                  {workOrder.completedAt && (
                    <p className="text-sm text-muted-foreground">
                      {new Date(workOrder.completedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : workOrder.status === "BLOCKED" ? (
                <div className="text-center py-4">
                  <Pause className="h-12 w-12 mx-auto text-red-600 mb-2" />
                  <p className="font-medium text-red-700">Work Blocked</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This work order is currently blocked. Contact the mechanic for updates.
                  </p>
                </div>
              ) : workOrder.status === "IN_PROGRESS" ? (
                <div className="text-center py-4">
                  <Play className="h-12 w-12 mx-auto text-yellow-600 mb-2" />
                  <p className="font-medium text-yellow-700">Work In Progress</p>
                  {workOrder.startedAt && (
                    <p className="text-sm text-muted-foreground">
                      Started: {new Date(workOrder.startedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Clock className="h-12 w-12 mx-auto text-blue-600 mb-2" />
                  <p className="font-medium text-blue-700">Awaiting Work</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This work order has not yet been started.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completion Notes */}
          {workOrder.completionNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Completion Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{workOrder.completionNotes}</p>
              </CardContent>
            </Card>
          )}

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

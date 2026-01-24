"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Wrench,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle,
  Play,
  Pause,
  Filter,
  ChevronRight,
  MessageSquare,
  Calendar,
  Truck,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface WorkOrder {
  id: string
  workOrderNumber: string
  title: string
  description: string | null
  taskType: string
  priority: number
  status: string
  scheduledDate: string | null
  createdAt: string
  vehicle: {
    id: string
    plateNumber: string
    sideNumber: string | null
    make: string
    model: string
    year: number
  }
  partsUsed: Array<{
    id: string
    partName: string
    quantity: number
    totalPrice: number
  }>
  _count: {
    messages: number
  }
}

interface Stats {
  open: number
  inProgress: number
  blocked: number
  completed: number
  cancelled: number
  total: number
}

const STATUS_OPTIONS = [
  { value: "OPEN", label: "Open", color: "bg-blue-100 text-blue-900 border border-blue-300", icon: Clock },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-yellow-100 text-yellow-900 border border-yellow-300", icon: Play },
  { value: "BLOCKED", label: "Blocked", color: "bg-red-100 text-red-900 border border-red-300", icon: Pause },
  { value: "COMPLETED", label: "Completed", color: "bg-green-100 text-green-900 border border-green-300", icon: CheckCircle },
]

const PRIORITY_INFO: Record<number, { label: string; color: string }> = {
  1: { label: "Low", color: "bg-gray-100 text-gray-900 border border-gray-300" },
  2: { label: "Normal", color: "bg-blue-100 text-blue-900 border border-blue-300" },
  3: { label: "High", color: "bg-orange-100 text-orange-900 border border-orange-300" },
  4: { label: "Urgent", color: "bg-red-100 text-red-900 border border-red-300 animate-pulse" },
}

export default function MechanicDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("ALL")

  useEffect(() => {
    if (status === "authenticated") {
      if (session.user.role !== "COMPANY_ADMIN" || session.user.staffRole !== "MECHANIC") {
        router.push("/")
        return
      }
      fetchWorkOrders()
    }
  }, [status, session, router, statusFilter])

  const fetchWorkOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "ALL") {
        params.append("status", statusFilter)
      }

      const response = await fetch(`/api/mechanic/work-orders?${params}`)
      const data = await response.json()

      if (response.ok) {
        setWorkOrders(data.workOrders)
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Failed to fetch work orders:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          <p className="text-muted-foreground">Loading your work orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 border border-amber-300">
            <Wrench className="h-6 w-6 text-amber-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">My Work Orders</h1>
            <p className="text-muted-foreground">
              Manage and track your assigned maintenance tasks
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-900">{stats.open}</p>
                  <p className="text-sm text-blue-700">Open</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-yellow-900">{stats.inProgress}</p>
                  <p className="text-sm text-yellow-700">In Progress</p>
                </div>
                <Play className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-red-900">{stats.blocked}</p>
                  <p className="text-sm text-red-700">Blocked</p>
                </div>
                <Pause className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
                  <p className="text-sm text-green-700">Completed</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Work Orders</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="BLOCKED">Blocked</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              Showing {workOrders.length} work order{workOrders.length !== 1 ? "s" : ""}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Work Orders List */}
      {workOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No work orders found</p>
            <p className="text-sm text-muted-foreground">
              {statusFilter !== "ALL"
                ? "Try changing the filter to see more work orders"
                : "You don't have any assigned work orders yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {workOrders.map((wo) => {
            const statusInfo = STATUS_OPTIONS.find((s) => s.value === wo.status)
            const priorityInfo = PRIORITY_INFO[wo.priority] || PRIORITY_INFO[2]
            const StatusIcon = statusInfo?.icon || Clock

            return (
              <Card
                key={wo.id}
                className="hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => router.push(`/mechanic/work-order/${wo.id}`)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="font-mono">
                          {wo.workOrderNumber}
                        </Badge>
                        <Badge className={priorityInfo.color}>
                          {priorityInfo.label}
                        </Badge>
                        <Badge className={statusInfo?.color || "bg-gray-100"}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo?.label || wo.status}
                        </Badge>
                        {wo._count.messages > 0 && (
                          <Badge variant="secondary" className="gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {wo._count.messages}
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold mb-1">{wo.title}</h3>

                      {wo.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {wo.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Truck className="h-4 w-4" />
                          <span className="font-mono">{wo.vehicle.plateNumber}</span>
                          {wo.vehicle.sideNumber && (
                            <span className="text-xs">({wo.vehicle.sideNumber})</span>
                          )}
                        </div>

                        <div className="text-muted-foreground">
                          {wo.vehicle.year} {wo.vehicle.make} {wo.vehicle.model}
                        </div>

                        {wo.scheduledDate && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {new Date(wo.scheduledDate).toLocaleDateString()}
                          </div>
                        )}

                        <Badge variant="outline">{wo.taskType}</Badge>
                      </div>

                      {wo.partsUsed.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Parts: {wo.partsUsed.map((p) => p.partName).join(", ")}
                        </div>
                      )}
                    </div>

                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

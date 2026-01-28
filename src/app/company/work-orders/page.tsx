"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Wrench,
  Plus,
  Filter,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Eye,
  Download,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { CreateWorkOrderDialog } from "@/components/maintenance/CreateWorkOrderDialog"

interface WorkOrder {
  id: string
  workOrderNumber: string
  title: string
  taskType: string
  priority: number
  status: string
  vehicleId: string
  vehicle: {
    plateNumber: string
    sideNumber: string | null
    make: string
    model: string
  }
  scheduledDate: string | null
  createdAt: string
  assignedToName: string | null
  assignedStaffIds: string | null // Issue 3.1: JSON array of staff IDs
  totalCost: number
  // Issue 3.5: Parts for pending count
  partsUsed: Array<{
    id: string
    status: string | null
  }>
}

const STATUS_INFO = {
  OPEN: { label: "Open", color: "bg-blue-600 text-white", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "bg-yellow-500 text-gray-900", icon: Wrench },
  BLOCKED: { label: "Blocked", color: "bg-red-600 text-white", icon: XCircle },
  COMPLETED: { label: "Completed", color: "bg-green-600 text-white", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "bg-gray-600 text-white", icon: XCircle },
}

const PRIORITY_INFO = {
  1: { label: "Low", color: "bg-gray-600 text-white" },
  2: { label: "Normal", color: "bg-blue-600 text-white" },
  3: { label: "High", color: "bg-orange-500 text-white" },
  4: { label: "Urgent", color: "bg-red-600 text-white" },
}

const TASK_TYPES = {
  PREVENTIVE: "Preventive",
  CORRECTIVE: "Corrective",
  INSPECTION: "Inspection",
  EMERGENCY: "Emergency",
}

export default function WorkOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // v2.10.6: Export dialog state
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [exportStartDate, setExportStartDate] = useState("")
  const [exportEndDate, setExportEndDate] = useState("")
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      if (session.user.role !== "COMPANY_ADMIN") {
        router.push("/")
        return
      }
      fetchWorkOrders()
    }
  }, [status, session, router])

  const fetchWorkOrders = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (priorityFilter !== "all") params.append("priority", priorityFilter)
      if (taskTypeFilter !== "all") params.append("workType", taskTypeFilter)

      const response = await fetch(`/api/company/work-orders?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setWorkOrders(data.workOrders)
      } else {
        toast.error("Failed to load work orders")
      }
    } catch (error) {
      console.error("Failed to fetch work orders:", error)
      toast.error("An error occurred while loading work orders")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      fetchWorkOrders()
    }
  }, [statusFilter, priorityFilter, taskTypeFilter, status])

  // v2.10.6: Export work orders to Excel
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams()
      if (exportStartDate) params.append("startDate", exportStartDate)
      if (exportEndDate) params.append("endDate", exportEndDate)
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/company/work-orders/export?${params.toString()}`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        const contentDisposition = response.headers.get("Content-Disposition")
        const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
        a.download = filenameMatch ? filenameMatch[1] : "work-orders.xlsx"
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success("Export successful")
        setIsExportDialogOpen(false)
      } else {
        toast.error("Export failed")
      }
    } catch (error) {
      console.error("Export error:", error)
      toast.error("An error occurred during export")
    } finally {
      setIsExporting(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading work orders...</p>
        </div>
      </div>
    )
  }

  // Filter by search term
  const filteredWorkOrders = workOrders.filter((wo) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      wo.workOrderNumber.toLowerCase().includes(searchLower) ||
      wo.title.toLowerCase().includes(searchLower) ||
      wo.vehicle.plateNumber.toLowerCase().includes(searchLower) ||
      wo.vehicle.make.toLowerCase().includes(searchLower) ||
      wo.vehicle.model.toLowerCase().includes(searchLower)
    )
  })

  // Calculate stats
  const stats = {
    total: workOrders.length,
    open: workOrders.filter((wo) => wo.status === "OPEN").length,
    inProgress: workOrders.filter((wo) => wo.status === "IN_PROGRESS").length,
    completed: workOrders.filter((wo) => wo.status === "COMPLETED").length,
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Wrench className="h-8 w-8 text-primary" />
              Work Orders
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage vehicle maintenance and repair work orders
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* v2.10.6: Export button */}
            <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="lg" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Work Order
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Wrench className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Work Orders</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{stats.open}</p>
              <p className="text-xs text-muted-foreground">Open</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <p className="text-2xl font-bold">{stats.inProgress}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search work orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="BLOCKED">Blocked</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="1">Low</SelectItem>
                <SelectItem value="2">Normal</SelectItem>
                <SelectItem value="3">High</SelectItem>
                <SelectItem value="4">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={taskTypeFilter} onValueChange={setTaskTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PREVENTIVE">Preventive</SelectItem>
                <SelectItem value="CORRECTIVE">Corrective</SelectItem>
                <SelectItem value="INSPECTION">Inspection</SelectItem>
                <SelectItem value="EMERGENCY">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Work Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Work Orders</CardTitle>
          <CardDescription>
            {filteredWorkOrders.length} work order{filteredWorkOrders.length !== 1 ? "s" : ""}
            {searchTerm && ` matching "${searchTerm}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredWorkOrders.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No work orders found</p>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || priorityFilter !== "all" || taskTypeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first work order to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>WO Number</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkOrders.map((wo) => {
                    const statusInfo = STATUS_INFO[wo.status as keyof typeof STATUS_INFO]
                    const StatusIcon = statusInfo.icon
                    const priorityInfo = PRIORITY_INFO[wo.priority as keyof typeof PRIORITY_INFO]

                    // Issue 3.1: Parse assignedStaffIds for multi-staff count
                    let staffCount = 0
                    if (wo.assignedStaffIds) {
                      try {
                        const staffIds = JSON.parse(wo.assignedStaffIds)
                        staffCount = Array.isArray(staffIds) ? staffIds.length : 0
                      } catch {
                        staffCount = wo.assignedToName ? 1 : 0
                      }
                    } else if (wo.assignedToName) {
                      staffCount = 1
                    }

                    // Issue 3.5: Count pending parts
                    const pendingPartsCount = wo.partsUsed?.filter(p => p.status === "REQUESTED").length || 0

                    return (
                      <TableRow
                        key={wo.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/company/work-orders/${wo.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium">{wo.workOrderNumber}</span>
                            {/* Issue 3.5: Pending parts indicator */}
                            {pendingPartsCount > 0 && (
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                                {pendingPartsCount} pending
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{wo.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {TASK_TYPES[wo.taskType as keyof typeof TASK_TYPES]}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium font-mono text-sm">{wo.vehicle.plateNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {wo.vehicle.make} {wo.vehicle.model}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {TASK_TYPES[wo.taskType as keyof typeof TASK_TYPES]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={priorityInfo.color}>{priorityInfo.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {/* Issue 3.1: Show multi-staff count */}
                          <div className="text-sm">
                            <span>{wo.assignedToName || "Unassigned"}</span>
                            {staffCount > 1 && (
                              <span className="text-muted-foreground ml-1">(+{staffCount - 1})</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{wo.totalCost.toLocaleString()} Birr</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/company/work-orders/${wo.id}`)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Work Order Dialog */}
      <CreateWorkOrderDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={fetchWorkOrders}
      />

      {/* v2.10.6: Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Work Orders
            </DialogTitle>
            <DialogDescription>
              Export work orders to Excel. Optionally filter by date range.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="export-start">Start Date</Label>
                <Input
                  id="export-start"
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="export-end">End Date</Label>
                <Input
                  id="export-end"
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Leave dates empty to export all work orders.
              {statusFilter !== "all" && (
                <span className="block mt-1">
                  Status filter ({STATUS_INFO[statusFilter as keyof typeof STATUS_INFO]?.label}) will be applied.
                </span>
              )}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Export to Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

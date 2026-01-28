"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  DollarSign,
  Loader2,
  Wrench,
  Filter,
  ChevronRight,
  Calendar,
  Truck,
  Package,
  Download,
  FileSpreadsheet,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { toast } from "sonner"

interface WorkOrder {
  id: string
  workOrderNumber: string
  title: string
  description: string | null
  taskType: string
  priority: number
  status: string
  scheduledDate: string | null
  completedAt: string | null
  laborCost: number
  partsCost: number
  totalCost: number
  assignedToName: string | null
  createdAt: string
  vehicle: {
    id: string
    plateNumber: string
    sideNumber: string | null
    make: string
    model: string
  }
  partsUsed: Array<{
    id: string
    partName: string
    quantity: number
    unitPrice: number
    totalPrice: number
    supplier: string | null
  }>
  _count: {
    messages: number
  }
}

interface Stats {
  totalCost: number
  totalLaborCost: number
  totalPartsCost: number
  totalWorkOrders: number
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-900 border border-blue-300",
  IN_PROGRESS: "bg-yellow-100 text-yellow-900 border border-yellow-300",
  BLOCKED: "bg-red-100 text-red-900 border border-red-300",
  COMPLETED: "bg-green-100 text-green-900 border border-green-300",
  CANCELLED: "bg-gray-100 text-gray-900 border border-gray-300",
}

const PRIORITY_LABELS: Record<number, string> = {
  1: "Low",
  2: "Normal",
  3: "High",
  4: "Urgent",
}

export default function FinanceWorkOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState({
    status: "ALL",
    startDate: "",
    endDate: "",
  })

  // v2.10.6: Export state
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [exportStartDate, setExportStartDate] = useState("")
  const [exportEndDate, setExportEndDate] = useState("")
  const [exportStatus, setExportStatus] = useState("ALL")
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      if (session.user.role !== "COMPANY_ADMIN" || session.user.staffRole !== "FINANCE") {
        router.push("/")
        return
      }
      fetchWorkOrders()
    }
  }, [status, session, router])

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    if (status !== "authenticated") return

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchWorkOrders()
      }
    }, 30000) // 30 seconds for list pages

    return () => clearInterval(interval)
  }, [status, filters.status, filters.startDate, filters.endDate])

  const fetchWorkOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.status !== "ALL") params.append("status", filters.status)
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)

      const response = await fetch(`/api/finance/work-orders?${params}`)
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

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    fetchWorkOrders()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ET", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // v2.10.6: Export work orders to Excel
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams()
      if (exportStartDate) params.append("startDate", exportStartDate)
      if (exportEndDate) params.append("endDate", exportEndDate)
      if (exportStatus !== "ALL") params.append("status", exportStatus)

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

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-muted-foreground">Loading work orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 border border-emerald-300">
            <Wrench className="h-6 w-6 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">All Work Orders</h1>
            <p className="text-muted-foreground">
              Complete list of maintenance work orders with costs
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Total Spending</p>
              <p className="text-xl font-bold text-emerald-700">
                {formatCurrency(stats.totalCost)} Birr
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Labor Costs</p>
              <p className="text-xl font-bold text-blue-700">
                {formatCurrency(stats.totalLaborCost)} Birr
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Parts Costs</p>
              <p className="text-xl font-bold text-purple-700">
                {formatCurrency(stats.totalPartsCost)} Birr
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Work Orders</p>
              <p className="text-xl font-bold">{stats.totalWorkOrders}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={applyFilters} className="w-full bg-emerald-600 hover:bg-emerald-700">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Work Orders</CardTitle>
              <CardDescription>
                Showing {workOrders.length} work orders
              </CardDescription>
            </div>
            {/* v2.10.6: Export button */}
            <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {workOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No work orders found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Work Order</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mechanic</TableHead>
                    <TableHead className="text-right">Labor</TableHead>
                    <TableHead className="text-right">Parts</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workOrders.map((wo) => (
                    <TableRow key={wo.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-mono text-sm">{wo.workOrderNumber}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                            {wo.title}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-mono text-sm">{wo.vehicle.plateNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {wo.vehicle.make} {wo.vehicle.model}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[wo.status] || "bg-gray-100"}>
                          {wo.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{wo.assignedToName || "-"}</p>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(wo.laborCost)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(wo.partsCost)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-emerald-700">
                        {formatCurrency(wo.totalCost)}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {new Date(wo.createdAt).toLocaleDateString()}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/finance/work-orders/${wo.id}`)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* v2.10.6: Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Work Orders
            </DialogTitle>
            <DialogDescription>
              Export work orders to Excel for financial analysis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Status Filter</Label>
              <Select value={exportStatus} onValueChange={setExportStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Leave dates empty to export all work orders.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting} className="bg-emerald-600 hover:bg-emerald-700">
              {isExporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Export to Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

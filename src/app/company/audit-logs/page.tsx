"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Loader2,
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  User as UserIcon,
  Bus,
  Users,
  Wrench,
  Truck,
  MapPin,
  Download,
  Calendar as CalendarIcon,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDate } from "@/lib/utils"

interface AuditLog {
  id: string
  userId: string
  action: string
  details: string | null
  companyId: string | null
  tripId: string | null
  createdAt: string
  user: {
    name: string
    email: string
    staffRole?: string | null
  }
}

const ACTION_COLORS: Record<string, string> = {
  // Company profile
  COMPANY_PROFILE_UPDATED: "bg-blue-600 !text-white border-0",
  // Staff actions
  STAFF_MEMBER_ADDED: "bg-purple-600 !text-white border-0",
  STAFF_MEMBER_UPDATED: "bg-blue-600 !text-white border-0",
  STAFF_MEMBER_REMOVED: "bg-orange-500 !text-white border-0",
  // Trip actions
  TRIP_CREATED: "bg-green-600 !text-white border-0",
  TRIP_UPDATED: "bg-blue-600 !text-white border-0",
  TRIP_DELETED: "bg-red-600 !text-white border-0",
  TRIP_HALTED: "bg-yellow-500 !text-gray-900 border-0",
  TRIP_RESUMED: "bg-teal-600 !text-white border-0",
  // Vehicle actions
  VEHICLE_ADDED: "bg-emerald-600 !text-white border-0",
  VEHICLE_UPDATED: "bg-cyan-600 !text-white border-0",
  VEHICLE_REMOVED: "bg-rose-600 !text-white border-0",
  // Work order actions
  WORK_ORDER_CREATED: "bg-indigo-600 !text-white border-0",
  WORK_ORDER_UPDATED: "bg-violet-600 !text-white border-0",
  WORK_ORDER_COMPLETED: "bg-green-600 !text-white border-0",
  WORK_ORDER_CANCELLED: "bg-red-600 !text-white border-0",
  // Trip log actions
  TRIP_LOG_START: "bg-sky-600 !text-white border-0",
  TRIP_LOG_END: "bg-lime-600 !text-white border-0",
  // Manual ticketing
  MANUAL_TICKET_SOLD: "bg-amber-600 !text-white border-0",
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  TRIP_CREATED: <Bus className="h-3 w-3" />,
  TRIP_UPDATED: <Bus className="h-3 w-3" />,
  TRIP_DELETED: <Bus className="h-3 w-3" />,
  TRIP_HALTED: <Bus className="h-3 w-3" />,
  TRIP_RESUMED: <Bus className="h-3 w-3" />,
  STAFF_MEMBER_ADDED: <Users className="h-3 w-3" />,
  STAFF_MEMBER_UPDATED: <Users className="h-3 w-3" />,
  STAFF_MEMBER_REMOVED: <Users className="h-3 w-3" />,
  VEHICLE_ADDED: <Truck className="h-3 w-3" />,
  VEHICLE_UPDATED: <Truck className="h-3 w-3" />,
  VEHICLE_REMOVED: <Truck className="h-3 w-3" />,
  WORK_ORDER_CREATED: <Wrench className="h-3 w-3" />,
  WORK_ORDER_UPDATED: <Wrench className="h-3 w-3" />,
  WORK_ORDER_COMPLETED: <Wrench className="h-3 w-3" />,
  TRIP_LOG_START: <MapPin className="h-3 w-3" />,
  TRIP_LOG_END: <MapPin className="h-3 w-3" />,
}

export default function CompanyAuditLogsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const [filters, setFilters] = useState({
    action: "ALL",
    startDate: "",
    endDate: "",
  })

  // Check if user is supervisor
  const isSupervisor = session?.user.role === "COMPANY_ADMIN" &&
    session.user.staffRole === "SUPERVISOR"

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role !== "COMPANY_ADMIN") {
      router.push("/")
    } else if (isSupervisor) {
      // Supervisors cannot access audit logs
      router.push("/company/dashboard")
      // Show toast notification (imported at top)
      import("sonner").then(({ toast }) => {
        toast.error("Audit logs are only accessible to full administrators")
      })
    }
  }, [status, session, router, isSupervisor])

  useEffect(() => {
    if (session?.user?.role === "COMPANY_ADMIN") {
      fetchLogs()
    }
  }, [session, filters, currentPage])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("page", currentPage.toString())
      if (filters.action !== "ALL") params.append("action", filters.action)
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)

      const response = await fetch(`/api/company/audit-logs?${params}`)
      const data = await response.json()

      if (response.ok) {
        setLogs(data.logs)
        setTotal(data.pagination.total)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const setQuickDateRange = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)

    setFilters({
      ...filters,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    })
    setCurrentPage(1)
  }

  const handleDownload = () => {
    const params = new URLSearchParams()
    if (filters.action !== "ALL") params.append("action", filters.action)
    if (filters.startDate) params.append("startDate", filters.startDate)
    if (filters.endDate) params.append("endDate", filters.endDate)

    window.open(`/api/company/audit-logs/download?${params}`, '_blank')
  }

  const parsedDetails = (log: AuditLog) => {
    try {
      return log.details ? JSON.parse(log.details) : null
    } catch {
      return log.details
    }
  }

  const getStaffRoleBadge = (role?: string | null) => {
    if (!role) return null
    const roleColors: Record<string, string> = {
      DRIVER: "bg-blue-600 text-white",
      CONDUCTOR: "bg-green-600 text-white",
      MANUAL_TICKETER: "bg-orange-500 text-white",
      MECHANIC: "bg-purple-600 text-white",
      FINANCE: "bg-emerald-600 text-white",
    }
    return (
      <Badge className={roleColors[role] || "bg-gray-600 text-white"} variant="secondary">
        {role.replace("_", " ")}
      </Badge>
    )
  }

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading audit logs...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== "COMPANY_ADMIN") {
    return null
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-primary/5 via-teal-50/50 to-cyan-50/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
      </div>

      <div className="container mx-auto py-12 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Audit Logs</h1>
              <p className="text-muted-foreground">Track all administrative actions in your company</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 backdrop-blur-lg bg-white/70 border-white/40 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Action Type</Label>
                <Select
                  value={filters.action}
                  onValueChange={(value) => handleFilterChange("action", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Actions</SelectItem>
                    <SelectItem value="TRIP_CREATED">Trip Created</SelectItem>
                    <SelectItem value="TRIP_UPDATED">Trip Updated</SelectItem>
                    <SelectItem value="TRIP_DELETED">Trip Deleted</SelectItem>
                    <SelectItem value="TRIP_HALTED">Trip Halted</SelectItem>
                    <SelectItem value="TRIP_RESUMED">Trip Resumed</SelectItem>
                    <SelectItem value="STAFF_MEMBER_ADDED">Staff Added</SelectItem>
                    <SelectItem value="STAFF_MEMBER_UPDATED">Staff Updated</SelectItem>
                    <SelectItem value="STAFF_MEMBER_REMOVED">Staff Removed</SelectItem>
                    <SelectItem value="VEHICLE_ADDED">Vehicle Added</SelectItem>
                    <SelectItem value="VEHICLE_UPDATED">Vehicle Updated</SelectItem>
                    <SelectItem value="VEHICLE_REMOVED">Vehicle Removed</SelectItem>
                    <SelectItem value="WORK_ORDER_CREATED">Work Order Created</SelectItem>
                    <SelectItem value="WORK_ORDER_UPDATED">Work Order Updated</SelectItem>
                    <SelectItem value="WORK_ORDER_COMPLETED">Work Order Completed</SelectItem>
                    <SelectItem value="TRIP_LOG_START">Trip Log Start</SelectItem>
                    <SelectItem value="TRIP_LOG_END">Trip Log End</SelectItem>
                    <SelectItem value="MANUAL_TICKET_SOLD">Manual Ticket Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                />
              </div>
            </div>

            {/* Quick Date Range & Download */}
            <div className="mt-4 flex flex-wrap items-center gap-3 pt-4 border-t">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">Quick Range:</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange(7)}
              >
                Last 7 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange(30)}
              >
                Last 30 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange(90)}
              >
                Last 90 Days
              </Button>
              <div className="ml-auto">
                <Button
                  onClick={handleDownload}
                  style={{ background: "#0e9494" }}
                  className="text-white"
                  disabled={logs.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="backdrop-blur-lg bg-gradient-to-br from-teal-50 to-teal-100/70 border-teal-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-teal-600" />
                <div>
                  <p className="text-2xl font-bold text-teal-900">{total}</p>
                  <p className="text-sm text-teal-700">Total Logs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-lg bg-gradient-to-br from-blue-50 to-blue-100/70 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <UserIcon className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{currentPage}</p>
                  <p className="text-sm text-blue-700">Current Page</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-lg bg-gradient-to-br from-purple-50 to-purple-100/70 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Bus className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-purple-900">{totalPages}</p>
                  <p className="text-sm text-purple-700">Total Pages</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs Table */}
        <Card className="backdrop-blur-lg bg-white/50 border-white/40 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Audit Trail
            </CardTitle>
            <CardDescription>
              Showing {logs.length} of {total} logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No audit logs found</p>
                <p className="text-sm mt-1">Actions performed in your company will appear here</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Summary</TableHead>
                        <TableHead className="text-center">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => {
                        const details = parsedDetails(log)
                        const summary = details && typeof details === "object"
                          ? details.reason || details.tripRoute || details.staffName || details.vehiclePlate || details.description || null
                          : null

                        return (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm whitespace-nowrap">
                              {formatDate(log.createdAt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <p className="text-sm font-medium">{log.user.name}</p>
                                {log.user.staffRole && getStaffRoleBadge(log.user.staffRole)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-800"} gap-1`}>
                                {ACTION_ICONS[log.action]}
                                {log.action.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {summary ? (
                                <p className="text-sm max-w-xs truncate" title={summary}>
                                  {summary}
                                </p>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {log.details && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedLog(log)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} ({total} total logs)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Complete information about this action
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Timestamp</p>
                  <p className="text-sm font-medium">{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Action</p>
                  <Badge variant="outline" className={ACTION_COLORS[selectedLog.action] || "bg-gray-100 text-gray-800"}>
                    {selectedLog.action.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Performed By</p>
                  <p className="text-sm font-medium">{selectedLog.user.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedLog.user.email}</p>
                  {selectedLog.user.staffRole && (
                    <div className="mt-1">
                      {getStaffRoleBadge(selectedLog.user.staffRole)}
                    </div>
                  )}
                </div>
                {selectedLog.tripId && (
                  <div>
                    <p className="text-xs text-muted-foreground">Trip ID</p>
                    <p className="text-sm font-mono">{selectedLog.tripId}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Full Details (JSON)</p>
                <pre className="p-4 rounded-lg bg-muted text-xs overflow-x-auto">
                  {JSON.stringify(parsedDetails(selectedLog), null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

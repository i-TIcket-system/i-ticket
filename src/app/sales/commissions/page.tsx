"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Loader2,
  ArrowLeft,
  Bus,
  DollarSign,
  Clock,
  CheckCircle,
  Filter,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate, formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

interface Commission {
  id: string
  bookingId: string
  trip: string
  tripDate: string
  companyName: string
  customerName: string
  customerPhone: string
  ticketAmount: number
  platformCommission: number
  salesCommission: number
  status: string
  paidAt: string | null
  payout: {
    id: string
    paymentMethod: string
    paidAt: string
  } | null
  createdAt: string
}

interface CommissionsData {
  commissions: Commission[]
  summary: {
    pending: { count: number; amount: number }
    paid: { count: number; amount: number }
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function SalesCommissionsPage() {
  const [data, setData] = useState<CommissionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchCommissions()
  }, [statusFilter, page])

  const fetchCommissions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== "all") {
        params.set("status", statusFilter)
      }
      params.set("page", page.toString())
      params.set("limit", "20")

      const response = await fetch(`/api/sales/commissions?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to load commissions")
      }

      setData(result)
    } catch (error) {
      console.error("Failed to fetch commissions:", error)
      toast.error("Failed to load commissions")
    } finally {
      setLoading(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Link href="/sales/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Commission History</h1>
        <p className="text-muted-foreground mt-1">
          View all your earned commissions
        </p>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(data.summary.pending.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {data.summary.pending.count} commission{data.summary.pending.count !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Paid Out</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(data.summary.paid.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {data.summary.paid.count} commission{data.summary.paid.count !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(data.summary.pending.amount + data.summary.paid.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {data.summary.pending.count + data.summary.paid.count} total
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Commissions</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
              </SelectContent>
            </Select>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </CardContent>
      </Card>

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Commissions</CardTitle>
        </CardHeader>
        <CardContent>
          {!data || data.commissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {statusFilter !== "all"
                ? `No ${statusFilter.toLowerCase()} commissions found.`
                : "No commissions yet. You earn when your referred users book!"}
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Ticket</TableHead>
                    <TableHead className="text-right">Your Commission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.commissions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Bus className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{c.trip}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(c.tripDate)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{c.companyName}</TableCell>
                      <TableCell>
                        <div>
                          <p>{c.customerName}</p>
                          <p className="text-xs text-muted-foreground">{c.customerPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(c.ticketAmount)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(c.salesCommission)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.status === "PAID" ? "default" : "secondary"}>
                          {c.status}
                        </Badge>
                        {c.payout && (
                          <p className="text-xs text-muted-foreground mt-1">
                            via {c.payout.paymentMethod}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(data.pagination.page - 1) * data.pagination.limit + 1} - {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of {data.pagination.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.pagination.totalPages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

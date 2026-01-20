"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Loader2,
  ArrowLeft,
  Users,
  UserCheck,
  Calendar,
  Phone,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"

interface Referral {
  id: string
  userId: string
  userName: string
  userPhone: string
  userEmail: string | null
  bookingsCount: number
  totalSpent: number
  attributedAt: string
}

interface ReferralsData {
  referrals: Referral[]
  summary: {
    totalReferrals: number
    activeReferrals: number
    totalBookings: number
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function SalesReferralsPage() {
  const [data, setData] = useState<ReferralsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchReferrals()
  }, [page])

  const fetchReferrals = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", "20")

      const response = await fetch(`/api/sales/referrals?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to load referrals")
      }

      setData(result)
    } catch (error) {
      console.error("Failed to fetch referrals:", error)
      toast.error("Failed to load referrals")
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
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/sales/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Referred Users</h1>
        <p className="text-muted-foreground mt-1">
          Users who registered through your referral link
        </p>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Referred</p>
                  <p className="text-2xl font-bold">{data.summary.totalReferrals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <UserCheck className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">{data.summary.activeReferrals}</p>
                  <p className="text-xs text-muted-foreground">Users who booked</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold">{data.summary.totalBookings}</p>
                  <p className="text-xs text-muted-foreground">From your referrals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {!data || data.referrals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No referrals yet. Start distributing your QR code!
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-center">Bookings</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.referrals.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {r.userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium">{r.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{r.userPhone}</span>
                        </div>
                        {r.userEmail && (
                          <p className="text-xs text-muted-foreground">{r.userEmail}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {r.bookingsCount > 0 ? (
                          <span className="font-medium text-green-600">{r.bookingsCount}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(r.attributedAt)}
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

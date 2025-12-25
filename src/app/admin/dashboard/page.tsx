"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role !== "SUPER_ADMIN") {
      router.push("/")
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === "SUPER_ADMIN") {
      fetchStats()
    }
  }, [session])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return null
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">System-wide overview and management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.stats?.users?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.stats?.companies?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.stats?.trips?.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              of {stats?.stats?.trips?.total || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.stats?.revenue?.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Commission: {formatCurrency(stats?.stats?.revenue?.commission || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>Latest bookings across all companies</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.recentBookings?.map((booking: any) => (
                <TableRow key={booking.id}>
                  <TableCell className="text-sm">
                    {formatDate(booking.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{booking.user.name}</div>
                    <div className="text-xs text-muted-foreground">{booking.user.phone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {booking.trip.origin} → {booking.trip.destination}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(booking.trip.departureTime)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{booking.trip.company.name}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {formatCurrency(booking.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        booking.status === "PAID"
                          ? "default"
                          : booking.status === "PENDING"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {booking.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button
              onClick={() => router.push("/admin/companies")}
              className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              Manage Companies
            </button>
            <button
              onClick={() => router.push("/admin/users")}
              className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              Manage Users
            </button>
            <button
              onClick={() => router.push("/admin/logs")}
              className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              View System Logs
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending Bookings</span>
                <Badge variant="secondary">{stats?.stats?.bookings?.pending || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Bookings</span>
                <Badge>{stats?.stats?.bookings?.total || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

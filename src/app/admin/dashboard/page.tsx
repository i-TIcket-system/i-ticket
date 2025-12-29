"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Loader2,
  Users,
  Building2,
  Bus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Smartphone,
  ArrowUp,
  ArrowDown,
  Download,
  MapPin,
  Award
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [topRoutes, setTopRoutes] = useState<any[]>([])
  const [topCompanies, setTopCompanies] = useState<any[]>([])

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
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const [revenueRes, routesRes, companiesRes] = await Promise.all([
        fetch('/api/admin/analytics/revenue'),
        fetch('/api/admin/analytics/top-routes'),
        fetch('/api/admin/analytics/top-companies')
      ])

      if (revenueRes.ok) {
        const data = await revenueRes.json()
        setRevenueData(data.chartData || [])
      }

      if (routesRes.ok) {
        const data = await routesRes.json()
        setTopRoutes(data.topRoutes || [])
      }

      if (companiesRes.ok) {
        const data = await companiesRes.json()
        setTopCompanies(data.topCompanies || [])
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  const downloadRevenueReport = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(`/api/admin/reports/platform-revenue?date=${selectedDate}`)

      if (!response.ok) {
        const error = await response.json()
        alert(`Error: ${error.message || 'Failed to generate report'}`)
        return
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `platform-revenue-${selectedDate}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download report')
    } finally {
      setIsDownloading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.role === "SUPER_ADMIN") {
      fetchAnalytics()
    }
  }, [session])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (session?.user?.role === "SUPER_ADMIN") {
      const interval = setInterval(() => {
        fetchStats()
      }, 30000) // 30 seconds

      return () => clearInterval(interval)
    }
  }, [session])

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return null
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            <p className="text-muted-foreground">System-wide overview and management</p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-[180px]"
            />
            <Button
              onClick={downloadRevenueReport}
              disabled={isDownloading}
              className="gap-2"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download Invoice
                </>
              )}
            </Button>
          </div>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            <span>•</span>
            <span>Auto-refreshing every 30s</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchStats}
              className="h-6 px-2"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : '🔄'}
            </Button>
          </div>
        )}
      </div>

      {/* Today's Pulse */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Today's Activity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
              <Bus className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats?.stats?.bookings?.today || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active users: {stats?.stats?.users?.newToday || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(stats?.stats?.revenue?.today || 0)}
              </div>
              <p className="text-xs flex items-center gap-1 mt-1">
                {stats?.stats?.revenue?.change >= 0 ? (
                  <>
                    <ArrowUp className="h-3 w-3 text-green-600" />
                    <span className="text-green-600 font-medium">
                      +{stats?.stats?.revenue?.change.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">vs yesterday</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-3 w-3 text-red-600" />
                    <span className="text-red-600 font-medium">
                      {stats?.stats?.revenue?.change.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">vs yesterday</span>
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Commission</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {formatCurrency(stats?.stats?.revenue?.todayCommission || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Platform's 5% share
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.stats?.users?.total || 0}</div>
              <div className="text-xs text-muted-foreground space-y-1 mt-2">
                <div>Customers: {stats?.stats?.users?.customers || 0}</div>
                <div>Admins: {stats?.stats?.users?.companyAdmins || 0}</div>
                <div>Guests (SMS): {stats?.stats?.users?.guests || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Companies</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.stats?.companies?.total || 0}</div>
              <div className="text-xs text-muted-foreground space-y-1 mt-2">
                <div className="text-green-600">Active: {stats?.stats?.companies?.active || 0}</div>
                <div className="text-gray-500">Inactive: {stats?.stats?.companies?.inactive || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
              <Bus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.stats?.trips?.active || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">
                of {stats?.stats?.trips?.total || 0} total trips
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats?.stats?.revenue?.total || 0)}
              </div>
              <div className="text-xs text-muted-foreground space-y-1 mt-2">
                <div className="text-green-600 font-medium">
                  Commission: {formatCurrency(stats?.stats?.revenue?.commission || 0)}
                </div>
                <div>This week: {formatCurrency(stats?.stats?.revenue?.thisWeek || 0)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Channel Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Channel Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Web Bookings</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{stats?.stats?.channels?.web || 0}</span>
                  <Badge variant="secondary">
                    {Math.round((stats?.stats?.channels?.web || 0) / (stats?.stats?.channels?.total || 1) * 100)}%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <span className="text-sm">SMS Bookings</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{stats?.stats?.channels?.sms || 0}</span>
                  <Badge variant="secondary">
                    {Math.round((stats?.stats?.channels?.sms || 0) / (stats?.stats?.channels?.total || 1) * 100)}%
                  </Badge>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-lg font-bold">{stats?.stats?.channels?.total || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Booking Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Paid</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-green-600">{stats?.stats?.bookings?.paid || 0}</span>
                  <Badge className="bg-green-500/10 text-green-700">
                    {Math.round((stats?.stats?.bookings?.paid || 0) / (stats?.stats?.bookings?.total || 1) * 100)}%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-yellow-600">{stats?.stats?.bookings?.pending || 0}</span>
                  <Badge className="bg-yellow-500/10 text-yellow-700">
                    {Math.round((stats?.stats?.bookings?.pending || 0) / (stats?.stats?.bookings?.total || 1) * 100)}%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cancelled</span>
                <span className="text-lg font-bold text-red-600">{stats?.stats?.bookings?.cancelled || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Revenue Trend (Last 30 Days)
          </CardTitle>
          <CardDescription>Daily revenue and commission breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `${value.toLocaleString()} ETB`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px'
                  }}
                  formatter={(value: any) => [`${value.toLocaleString()} ETB`, '']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Revenue"
                  dot={{ fill: '#22c55e', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="commission"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Commission"
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Routes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-primary" />
              Top Routes (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topRoutes.length > 0 ? (
                topRoutes.map((route, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`
                        text-lg font-bold w-6 text-center
                        ${index === 0 ? 'text-yellow-500' : ''}
                        ${index === 1 ? 'text-gray-400' : ''}
                        ${index === 2 ? 'text-amber-600' : ''}
                      `}>
                        #{index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {route.origin} → {route.destination}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {route.bookings} bookings • {formatCurrency(route.revenue)}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{route.bookings}</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading routes...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Companies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4 text-primary" />
              Top Companies (All Time)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCompanies.length > 0 ? (
                topCompanies.map((company, index) => (
                  <div key={company.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`
                        text-lg font-bold w-6 text-center
                        ${index === 0 ? 'text-yellow-500' : ''}
                        ${index === 1 ? 'text-gray-400' : ''}
                        ${index === 2 ? 'text-amber-600' : ''}
                      `}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{company.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {company.bookings} bookings • {formatCurrency(company.revenue)}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{company.bookings}</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading companies...
                </div>
              )}
            </div>
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
            <Button
              variant="outline"
              onClick={() => router.push("/search")}
              className="w-full justify-start"
            >
              <Bus className="mr-2 h-4 w-4" />
              View Search Page
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                fetchStats()
                fetchAnalytics()
              }}
              className="w-full justify-start"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="mr-2 h-4 w-4" />
              )}
              Refresh All Data
            </Button>
            <Button
              variant="outline"
              onClick={downloadRevenueReport}
              disabled={isDownloading}
              className="w-full justify-start"
            >
              {isDownloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download Today's Report
            </Button>
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

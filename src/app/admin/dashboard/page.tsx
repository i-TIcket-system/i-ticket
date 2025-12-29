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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-primary/5 via-purple-50/50 to-blue-50/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent"></div>
      </div>

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
          <Card className="backdrop-blur-xl bg-gradient-to-br from-teal-50 to-teal-100/80 border-teal-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
              <div className="p-2 rounded-lg bg-teal-500/20">
                <Bus className="h-5 w-5 text-teal-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-teal-700">
                {stats?.stats?.bookings?.today || 0}
              </div>
              <p className="text-xs text-teal-600/80 mt-1">
                Active users: {stats?.stats?.users?.newToday || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-gradient-to-br from-green-50 to-green-100/80 border-green-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <div className="p-2 rounded-lg bg-green-500/20">
                <DollarSign className="h-5 w-5 text-green-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-700">
                {formatCurrency(stats?.stats?.revenue?.today || 0)}
              </div>
              <p className="text-xs flex items-center gap-1 mt-1">
                {stats?.stats?.revenue?.change >= 0 ? (
                  <>
                    <ArrowUp className="h-3 w-3 text-green-700" />
                    <span className="text-green-700 font-medium">
                      +{stats?.stats?.revenue?.change.toFixed(1)}%
                    </span>
                    <span className="text-green-600/70">vs yesterday</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-3 w-3 text-red-600" />
                    <span className="text-red-600 font-medium">
                      {stats?.stats?.revenue?.change.toFixed(1)}%
                    </span>
                    <span className="text-green-600/70">vs yesterday</span>
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-gradient-to-br from-blue-50 to-blue-100/80 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Commission</CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/20">
                <TrendingUp className="h-5 w-5 text-blue-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-700">
                {formatCurrency(stats?.stats?.revenue?.todayCommission || 0)}
              </div>
              <p className="text-xs text-blue-600/80 mt-1">
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
          <Card className="backdrop-blur-lg bg-gradient-to-br from-purple-50 to-purple-100/70 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Users className="h-4 w-4 text-purple-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700">
                {stats?.stats?.users?.total || 0}
              </div>
              <div className="text-xs text-purple-600/70 space-y-1 mt-2">
                <div>Customers: {stats?.stats?.users?.customers || 0}</div>
                <div>Admins: {stats?.stats?.users?.companyAdmins || 0}</div>
                <div>Guests (SMS): {stats?.stats?.users?.guests || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-lg bg-gradient-to-br from-orange-50 to-orange-100/70 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Companies</CardTitle>
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Building2 className="h-4 w-4 text-orange-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-700">
                {stats?.stats?.companies?.total || 0}
              </div>
              <div className="text-xs text-orange-600/70 space-y-1 mt-2">
                <div className="text-green-600 font-medium">Active: {stats?.stats?.companies?.active || 0}</div>
                <div className="text-gray-600">Inactive: {stats?.stats?.companies?.inactive || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-lg bg-gradient-to-br from-teal-50 to-teal-100/70 border-teal-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
              <div className="p-2 rounded-lg bg-teal-500/20">
                <Bus className="h-4 w-4 text-teal-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-700">
                {stats?.stats?.trips?.active || 0}
              </div>
              <p className="text-xs text-teal-600/70 mt-2">
                of {stats?.stats?.trips?.total || 0} total trips
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-lg bg-gradient-to-br from-emerald-50 to-emerald-100/70 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <DollarSign className="h-4 w-4 text-emerald-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-700">
                {formatCurrency(stats?.stats?.revenue?.total || 0)}
              </div>
              <div className="text-xs text-emerald-600/70 space-y-1 mt-2">
                <div className="text-emerald-700 font-medium">
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
        <Card className="backdrop-blur-lg bg-white/50 border-white/40 shadow-lg">
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

        <Card className="backdrop-blur-lg bg-white/50 border-white/40 shadow-lg">
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
      <Card className="mb-8 backdrop-blur-lg bg-white/50 border-white/40 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Revenue Trend (Last 30 Days)
            </span>
          </CardTitle>
          <CardDescription>Daily revenue and commission breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {revenueData.length > 0 ? (
            <div className="p-4 rounded-xl backdrop-blur-sm bg-white/40">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => `${value.toLocaleString()} ETB`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.4)',
                      borderRadius: '12px',
                      padding: '12px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: any) => [`${value.toLocaleString()} ETB`, '']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#22c55e"
                    strokeWidth={3}
                    name="Revenue"
                    dot={{ fill: '#22c55e', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7 }}
                    fill="url(#colorRevenue)"
                  />
                  <Line
                    type="monotone"
                    dataKey="commission"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    name="Commission"
                    dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7 }}
                    fill="url(#colorCommission)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Routes */}
        <Card className="backdrop-blur-lg bg-white/50 border-white/40 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-2 rounded-lg bg-primary/10">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
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
        <Card className="backdrop-blur-lg bg-white/50 border-white/40 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Award className="h-4 w-4 text-yellow-600" />
              </div>
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
      <Card className="mb-8 backdrop-blur-lg bg-white/50 border-white/40 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bus className="h-5 w-5 text-primary" />
            </div>
            Recent Bookings
          </CardTitle>
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
        <Card className="backdrop-blur-lg bg-white/50 border-white/40 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              Quick Actions
            </CardTitle>
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

        <Card className="backdrop-blur-lg bg-white/50 border-white/40 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100">
                <Badge className="h-5 w-5" />
              </div>
              System Status
            </CardTitle>
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
    </div>
  )
}

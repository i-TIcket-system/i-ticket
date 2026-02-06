"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
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
  Award,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Filter
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatDate } from "@/lib/utils"
import { exportBookingsToCSV } from "@/lib/csv-export"
import { StatCardSkeleton, TableRowSkeleton, TodayActivityCardSkeleton, InsightsCardSkeleton } from "@/components/ui/skeleton"
import { DateRangeSelector } from "@/components/ui/date-range-selector"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDebounce } from "@/hooks/use-debounce"
import { ProfitMarginChart } from "@/components/admin/ProfitMarginChart"
import { IncomeExpensesChart } from "@/components/admin/IncomeExpensesChart"
import { BudgetProgressChart } from "@/components/admin/BudgetProgressChart"
import { PassengerMilestone } from "@/components/company/PassengerMilestone"

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [dateRangeStart, setDateRangeStart] = useState("")
  const [dateRangeEnd, setDateRangeEnd] = useState("")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [topRoutes, setTopRoutes] = useState<any[]>([])
  const [topCompanies, setTopCompanies] = useState<any[]>([])

  // Financial analytics data
  const [platformRevenue, setPlatformRevenue] = useState<any>(null)
  const [settlements, setSettlements] = useState<any>(null)
  const [salesCommissions, setSalesCommissions] = useState<any>(null)
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([])
  const [budgetProgress, setBudgetProgress] = useState<any>(null)

  // Bookings filters and pagination state
  const [bookings, setBookings] = useState<any[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingsPage, setBookingsPage] = useState(1)
  const [bookingsTotalPages, setBookingsTotalPages] = useState(1)
  const [bookingsTotal, setBookingsTotal] = useState(0)
  const [bookingsStatusFilter, setBookingsStatusFilter] = useState("ALL")
  const [bookingsCompanyFilter, setBookingsCompanyFilter] = useState("ALL")
  const [bookingsStartDate, setBookingsStartDate] = useState("")
  const [bookingsEndDate, setBookingsEndDate] = useState("")
  const [bookingsSearchInput, setBookingsSearchInput] = useState("")
  const [allCompanies, setAllCompanies] = useState<{id: string, name: string}[]>([])

  // Debounce search input
  const bookingsSearch = useDebounce(bookingsSearchInput, 300)

  // Memoize date range callback to prevent infinite loop
  const handleDateRangeChange = useCallback((start: string, end: string) => {
    setDateRangeStart(start)
    setDateRangeEnd(end)
  }, [])

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
      // P1-UX-002: Use date range in analytics API calls
      const params = new URLSearchParams()
      if (dateRangeStart) params.set('startDate', dateRangeStart)
      if (dateRangeEnd) params.set('endDate', dateRangeEnd)

      const queryString = params.toString()
      const [
        revenueRes,
        routesRes,
        companiesRes,
        platformRevenueRes,
        settlementsRes,
        salesCommissionsRes,
        monthlyTrendsRes,
        budgetProgressRes,
      ] = await Promise.all([
        fetch(`/api/admin/analytics/revenue${queryString ? '?' + queryString : ''}`),
        fetch(`/api/admin/analytics/top-routes${queryString ? '?' + queryString : ''}`),
        fetch(`/api/admin/analytics/top-companies${queryString ? '?' + queryString : ''}`),
        fetch('/api/admin/analytics/platform-revenue'),
        fetch('/api/admin/analytics/settlements'),
        fetch('/api/admin/analytics/sales-commissions'),
        fetch('/api/admin/analytics/monthly-trends'),
        fetch('/api/admin/analytics/budget-progress'),
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

      if (platformRevenueRes.ok) {
        const data = await platformRevenueRes.json()
        setPlatformRevenue(data)
      }

      if (settlementsRes.ok) {
        const data = await settlementsRes.json()
        setSettlements(data)
      }

      if (salesCommissionsRes.ok) {
        const data = await salesCommissionsRes.json()
        setSalesCommissions(data)
      }

      if (monthlyTrendsRes.ok) {
        const data = await monthlyTrendsRes.json()
        setMonthlyTrends(data.monthlyTrends || [])
      }

      if (budgetProgressRes.ok) {
        const data = await budgetProgressRes.json()
        setBudgetProgress(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  // P1-UX-002: Refetch analytics when date range changes
  useEffect(() => {
    if (session?.user?.role === "SUPER_ADMIN" && dateRangeStart && dateRangeEnd) {
      fetchAnalytics()
    }
  }, [dateRangeStart, dateRangeEnd]) // Removed session from deps to prevent loop

  // Fetch all companies for filter dropdown
  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/admin/companies")
      if (response.ok) {
        const data = await response.json()
        setAllCompanies(data.companies?.map((c: any) => ({ id: c.id, name: c.name })) || [])
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error)
    }
  }

  // Fetch bookings with filters
  const fetchBookings = async () => {
    setBookingsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", bookingsPage.toString())
      params.set("limit", "10")
      if (bookingsStatusFilter !== "ALL") params.set("status", bookingsStatusFilter)
      if (bookingsCompanyFilter && bookingsCompanyFilter !== "ALL") params.set("companyId", bookingsCompanyFilter)
      if (bookingsStartDate) params.set("startDate", bookingsStartDate)
      if (bookingsEndDate) params.set("endDate", bookingsEndDate)
      if (bookingsSearch) params.set("search", bookingsSearch)

      const response = await fetch(`/api/admin/bookings?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings)
        setBookingsTotalPages(data.pagination.totalPages)
        setBookingsTotal(data.pagination.total)
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error)
    } finally {
      setBookingsLoading(false)
    }
  }

  // Fetch bookings when filters/page change
  useEffect(() => {
    if (session?.user?.role === "SUPER_ADMIN") {
      fetchBookings()
    }
  }, [bookingsPage, bookingsStatusFilter, bookingsCompanyFilter, bookingsStartDate, bookingsEndDate, bookingsSearch])

  // Reset page to 1 when filters change
  useEffect(() => {
    setBookingsPage(1)
  }, [bookingsStatusFilter, bookingsCompanyFilter, bookingsStartDate, bookingsEndDate, bookingsSearch])

  // Fetch companies on mount
  useEffect(() => {
    if (session?.user?.role === "SUPER_ADMIN") {
      fetchCompanies()
    }
  }, [session])

  const clearBookingsFilters = () => {
    setBookingsStatusFilter("ALL")
    setBookingsCompanyFilter("ALL")
    setBookingsStartDate("")
    setBookingsEndDate("")
    setBookingsSearchInput("")
    setBookingsPage(1)
  }

  const hasActiveBookingsFilters = bookingsStatusFilter !== "ALL" || (bookingsCompanyFilter && bookingsCompanyFilter !== "ALL") || bookingsStartDate || bookingsEndDate || bookingsSearchInput

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

  // Calculate milestone values for passenger progress bar
  const calculateMilestone = (passengers: number) => {
    const milestones = [100, 1000, 10000, 100000, 1000000]
    let currentMilestone = 0
    let nextMilestone = milestones[0]

    for (let i = 0; i < milestones.length; i++) {
      if (passengers >= milestones[i]) {
        currentMilestone = milestones[i]
        nextMilestone = milestones[i + 1] || milestones[i] * 10
      } else {
        break
      }
    }

    const progressPercent = currentMilestone === 0
      ? Math.min(100, Math.round((passengers / nextMilestone) * 100))
      : Math.min(100, Math.round(((passengers - currentMilestone) / (nextMilestone - currentMilestone)) * 100))

    return { currentMilestone, nextMilestone, progressPercent }
  }

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="mb-8">
          <div className="h-8 w-64 bg-muted animate-shimmer rounded mb-2" />
          <div className="h-4 w-48 bg-muted animate-shimmer rounded" />
        </div>

        <div className="mb-6">
          <div className="h-6 w-48 bg-muted animate-shimmer rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TodayActivityCardSkeleton />
            <TodayActivityCardSkeleton />
            <TodayActivityCardSkeleton />
          </div>
        </div>

        <div className="mb-6">
          <div className="h-6 w-48 bg-muted animate-shimmer rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <InsightsCardSkeleton />
            <InsightsCardSkeleton />
            <InsightsCardSkeleton />
            <InsightsCardSkeleton />
          </div>
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
      <div className="fixed inset-0 -z-10" style={{ background: "linear-gradient(135deg, #f0fafa 0%, #e6f7f7 50%, #f5f5f5 100%)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at top right, rgba(14, 148, 148, 0.1) 0%, transparent 50%)" }}></div>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at bottom left, rgba(32, 196, 196, 0.1) 0%, transparent 50%)" }}></div>
      </div>

      <div className="container mx-auto py-12 px-4">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            <p className="text-muted-foreground">System-wide overview and management</p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangeSelector
              onRangeChange={handleDateRangeChange}
              defaultRange="30days"
            />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-[180px]"
              placeholder="Single date invoice"
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

      {/* Platform Passenger Milestone - Moved to top for visibility */}
      {platformRevenue?.totalPassengers > 0 && (
        <div className="mb-6">
          {(() => {
            const { currentMilestone, nextMilestone, progressPercent } = calculateMilestone(platformRevenue.totalPassengers)
            return (
              <PassengerMilestone
                totalPassengers={platformRevenue.totalPassengers}
                currentMilestone={currentMilestone}
                nextMilestone={nextMilestone}
                progressPercent={progressPercent}
                companyId="platform"
              />
            )
          })()}
        </div>
      )}

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
              <div className="text-4xl font-bold text-teal-900">
                {stats?.stats?.bookings?.today || 0}
              </div>
              <p className="text-xs text-teal-800 mt-1">
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
              <CardTitle className="text-sm font-medium">Today's Service Charge</CardTitle>
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

      {/* NEW: Business Insights */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Business Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Average Booking Value */}
          <Card className="backdrop-blur-xl bg-gradient-to-br from-purple-50 to-purple-100/80 border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Booking Value</CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/20">
                <DollarSign className="h-5 w-5 text-purple-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">
                {formatCurrency(stats?.stats?.insights?.avgBookingValue || 0)}
              </div>
              <p className="text-xs text-purple-800 mt-1">
                Per paid booking
              </p>
            </CardContent>
          </Card>

          {/* Booking Success Rate */}
          <Card className="backdrop-blur-xl bg-gradient-to-br from-green-50 to-green-100/80 border-green-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="h-5 w-5 text-green-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">
                {stats?.stats?.insights?.bookingSuccessRate?.toFixed(1) || 0}%
              </div>
              <p className="text-xs text-green-800 mt-1">
                Paid vs total bookings
              </p>
            </CardContent>
          </Card>

          {/* Cancellation Rate */}
          <Card className="backdrop-blur-xl bg-gradient-to-br from-red-50 to-red-100/80 border-red-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
              <div className="p-2 rounded-lg bg-red-500/20">
                <TrendingDown className="h-5 w-5 text-red-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-900">
                {stats?.stats?.insights?.cancellationRate?.toFixed(1) || 0}%
              </div>
              <p className="text-xs text-red-800 mt-1">
                {stats?.stats?.bookings?.cancelled || 0} cancelled
              </p>
            </CardContent>
          </Card>

          {/* Peak Booking Hours */}
          <Card className="backdrop-blur-xl bg-gradient-to-br from-orange-50 to-orange-100/80 border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peak Hours</CardTitle>
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Smartphone className="h-5 w-5 text-orange-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">
                {stats?.stats?.insights?.peakHours?.[0]?.label || "N/A"}
              </div>
              <div className="text-xs text-orange-800 mt-1 space-y-0.5">
                {stats?.stats?.insights?.peakHours?.slice(0, 2).map((peak: any, i: number) => (
                  <div key={i}>#{i + 1}: {peak.label} ({peak.count} bookings)</div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="backdrop-blur-lg bg-gradient-to-br from-teal-50 to-teal-100/70 border-teal-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <div className="p-2 rounded-lg bg-teal-500/20">
                <Users className="h-4 w-4 text-teal-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-900">
                {stats?.stats?.users?.total || 0}
              </div>
              <div className="text-xs text-teal-800 space-y-1 mt-2">
                <div>Customers: {stats?.stats?.users?.customers || 0}</div>
                <div>Admins: {stats?.stats?.users?.companyAdmins || 0}</div>
                <div>Guests (SMS): {stats?.stats?.users?.guests || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-lg bg-gradient-to-br from-teal-50 to-teal-100/70 border-teal-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Companies</CardTitle>
              <div className="p-2 rounded-lg bg-teal-500/20">
                <Building2 className="h-4 w-4 text-teal-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-900">
                {stats?.stats?.companies?.total || 0}
              </div>
              <div className="text-xs text-teal-800 space-y-1 mt-2">
                <div className="text-green-700 font-medium">Active: {stats?.stats?.companies?.active || 0}</div>
                <div className="text-gray-700">Inactive: {stats?.stats?.companies?.inactive || 0}</div>
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
              <div className="text-3xl font-bold text-teal-900">
                {stats?.stats?.trips?.active || 0}
              </div>
              <p className="text-xs text-teal-800 mt-2">
                of {stats?.stats?.trips?.total || 0} total trips
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-lg bg-gradient-to-br from-teal-50 to-teal-100/70 border-teal-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <div className="p-2 rounded-lg bg-teal-500/20">
                <DollarSign className="h-4 w-4 text-teal-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-900">
                {formatCurrency(stats?.stats?.revenue?.total || 0)}
              </div>
              <div className="text-xs text-teal-800 space-y-1 mt-2">
                <div className="text-teal-900 font-medium">
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
                  <Badge className="bg-green-100 text-green-900 border border-green-300">
                    {Math.round((stats?.stats?.bookings?.paid || 0) / (stats?.stats?.bookings?.total || 1) * 100)}%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-yellow-600">{stats?.stats?.bookings?.pending || 0}</span>
                  <Badge className="bg-yellow-100 text-yellow-900 border border-yellow-300">
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

      {/* Financial Overview */}
      {platformRevenue && settlements && salesCommissions && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Financial Overview
          </h2>

          {/* Financial Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card className="backdrop-blur-xl bg-gradient-to-br from-blue-50 to-blue-100/80 border-blue-200 shadow-xl">
              <CardHeader className="pb-2">
                <CardDescription>Platform Revenue</CardDescription>
                <CardTitle className="text-3xl">
                  {formatCurrency(platformRevenue.totalRevenue)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm">
                  {platformRevenue.percentChange >= 0 ? (
                    <ArrowUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span className={platformRevenue.percentChange >= 0 ? "text-green-600" : "text-red-600"}>
                    {Math.abs(platformRevenue.percentChange)}% vs last month
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Commission: {formatCurrency(platformRevenue.totalCommission)} + VAT: {formatCurrency(platformRevenue.totalVAT)}
                </p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-gradient-to-br from-orange-50 to-orange-100/80 border-orange-200 shadow-xl">
              <CardHeader className="pb-2">
                <CardDescription>Pending Settlements</CardDescription>
                <CardTitle className="text-3xl">
                  {formatCurrency(settlements.totalPending)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4 mr-1" />
                  {settlements.companiesCount} companies
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Owed to bus companies
                </p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-gradient-to-br from-purple-50 to-purple-100/80 border-purple-200 shadow-xl">
              <CardHeader className="pb-2">
                <CardDescription>Sales Commissions</CardDescription>
                <CardTitle className="text-3xl">
                  {formatCurrency(salesCommissions.totalPayable)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-4 w-4 mr-1" />
                  {salesCommissions.salesPersonsCount} sales persons
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pending: {formatCurrency(salesCommissions.pending)} • Approved: {formatCurrency(salesCommissions.approved)}
                </p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-gradient-to-br from-green-50 to-green-100/80 border-green-200 shadow-xl">
              <CardHeader className="pb-2">
                <CardDescription>Total Passengers</CardDescription>
                <CardTitle className="text-3xl">
                  {platformRevenue.totalPassengers.toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Bus className="h-4 w-4 mr-1" />
                  {platformRevenue.totalBookings.toLocaleString()} bookings
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Platform-wide total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Financial Charts Row 1 */}
          {monthlyTrends.length > 0 && (
            <div className="mb-6">
              <IncomeExpensesChart data={monthlyTrends} />
            </div>
          )}

          {/* Financial Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {monthlyTrends.length > 0 && (
              <ProfitMarginChart
                profitMargin={monthlyTrends[0] ? (monthlyTrends.reduce((sum, m) => sum + m.netProfit, 0) / monthlyTrends.reduce((sum, m) => sum + m.income, 0)) * 100 : 0}
                netProfit={monthlyTrends.reduce((sum, m) => sum + m.netProfit, 0)}
              />
            )}
            {budgetProgress && (
              <div className="lg:col-span-2">
                <BudgetProgressChart income={budgetProgress.income} expenses={budgetProgress.expenses} />
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* Recent Bookings with Filters and Pagination */}
      <Card className="mb-8 backdrop-blur-lg bg-white/50 border-white/40 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bus className="h-5 w-5 text-primary" />
                </div>
                Recent Bookings
              </CardTitle>
              <CardDescription>
                {bookingsTotal > 0
                  ? `Showing ${Math.min((bookingsPage - 1) * 10 + 1, bookingsTotal)} - ${Math.min(bookingsPage * 10, bookingsTotal)} of ${bookingsTotal} bookings`
                  : "Latest bookings across all companies"}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const response = await fetch('/api/admin/bookings/export')
                  if (response.ok) {
                    const blob = await response.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                  } else {
                    const error = await response.json()
                    alert(error.error || 'Export failed')
                  }
                } catch (error) {
                  console.error('Export error:', error)
                  alert('Failed to export data')
                }
              }}
              disabled={bookings.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Filter Bar */}
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={bookingsSearchInput}
                  onChange={(e) => setBookingsSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Status Filter */}
              <Select value={bookingsStatusFilter} onValueChange={setBookingsStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Company Filter */}
              <Select value={bookingsCompanyFilter} onValueChange={setBookingsCompanyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Companies</SelectItem>
                  {allCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Filter Toggle */}
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={bookingsStartDate}
                  onChange={(e) => setBookingsStartDate(e.target.value)}
                  className="flex-1"
                  placeholder="From"
                />
              </div>
            </div>

            {/* Second row for end date and clear button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Date range:</span>
                <Input
                  type="date"
                  value={bookingsEndDate}
                  onChange={(e) => setBookingsEndDate(e.target.value)}
                  className="w-[160px]"
                  placeholder="To"
                />
              </div>

              {hasActiveBookingsFilters && (
                <Button variant="ghost" size="sm" onClick={clearBookingsFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear all filters
                </Button>
              )}

              {bookingsLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              )}
            </div>
          </div>
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
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {bookingsLoading ? "Loading..." : "No bookings match your filters"}
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking: any) => (
                  <TableRow key={booking.id}>
                    <TableCell className="text-sm">
                      {formatDate(booking.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{booking.user?.name ?? "Guest"}</div>
                      <div className="text-xs text-muted-foreground">{booking.user?.phone ?? "—"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {booking.trip?.origin ?? "—"} → {booking.trip?.destination ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {booking.trip?.departureTime ? formatDate(booking.trip.departureTime) : "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{booking.trip?.company?.name ?? "—"}</TableCell>
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
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {bookingsTotalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {bookingsPage} of {bookingsTotalPages} ({bookingsTotal} total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBookingsPage(p => Math.max(1, p - 1))}
                  disabled={bookingsPage === 1 || bookingsLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm px-3 py-1 bg-muted rounded">
                  {bookingsPage} / {bookingsTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBookingsPage(p => Math.min(bookingsTotalPages, p + 1))}
                  disabled={bookingsPage === bookingsTotalPages || bookingsLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
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

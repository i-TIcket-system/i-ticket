"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  DollarSign, TrendingUp, Receipt, FileText,
  Calendar, Download, Building2, Users
} from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Finance Portal
 *
 * Dedicated portal for i-Ticket Finance Department staff
 * Provides access to financial reports, VAT tracking, revenue analysis
 */
export default function FinancePortalPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFinanceData()
  }, [])

  const fetchFinanceData = async () => {
    try {
      // Fetch financial data from admin stats API
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching finance data:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <DollarSign className="h-8 w-8" />
          Finance Portal
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {session?.user?.name} | i-Ticket Finance Department
        </p>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.revenue.total)}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Platform Commission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600">
                {formatCurrency(stats.revenue.commission)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">5% service fee</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                VAT Liability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700">
                {formatCurrency(stats.revenue.commissionVAT || 0)}
              </div>
              <p className="text-xs text-yellow-600 mt-1">Owed to ERA</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Active Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.companies.active}</div>
              <p className="text-xs text-muted-foreground mt-1">Bus companies</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="vat">VAT Reports</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
              <CardDescription>
                Key financial metrics and trends for i-Ticket platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-2 text-muted-foreground">Loading financial data...</p>
                </div>
              ) : stats ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Today's Revenue</h3>
                      <p className="text-2xl font-bold">{formatCurrency(stats.revenue.today)}</p>
                      <p className="text-xs text-green-600 mt-1">
                        Commission: {formatCurrency(stats.revenue.todayCommission)}
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">This Week</h3>
                      <p className="text-2xl font-bold">{formatCurrency(stats.revenue.thisWeek)}</p>
                      <p className="text-xs text-green-600 mt-1">
                        Commission: {formatCurrency(stats.revenue.thisWeekCommission || 0)}
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">This Month</h3>
                      <p className="text-2xl font-bold">{formatCurrency(stats.revenue.thisMonth)}</p>
                      <p className="text-xs text-green-600 mt-1">
                        Commission: {formatCurrency(stats.revenue.thisMonthCommission || 0)}
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                      <h3 className="text-sm font-medium text-yellow-900 mb-1">Total VAT Owed</h3>
                      <p className="text-2xl font-bold text-yellow-700">
                        {formatCurrency(stats.revenue.governmentTax || 0)}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">To Ethiopian Revenue Authority</p>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="text-sm font-medium mb-2">Booking Statistics</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Bookings</p>
                        <p className="text-xl font-bold">{stats.bookings.total}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Paid</p>
                        <p className="text-xl font-bold text-green-600">{stats.bookings.paid}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pending</p>
                        <p className="text-xl font-bold text-yellow-600">{stats.bookings.pending}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analysis</CardTitle>
              <CardDescription>Detailed revenue breakdown and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Revenue analytics dashboard</p>
                <p className="text-sm mt-2">Charts and detailed revenue analysis coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vat" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>VAT Tax Reports</CardTitle>
                  <CardDescription>
                    Ethiopian Revenue Authority (ERA) compliance reports
                  </CardDescription>
                </div>
                <Button onClick={() => window.location.href = '/admin/tax-reports'}>
                  <FileText className="mr-2 h-4 w-4" />
                  Full Tax Dashboard
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                  <h3 className="font-semibold text-yellow-900 mb-2">Tax Remittance Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-yellow-700">Total VAT Collected</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {formatCurrency(stats?.revenue.commissionVAT || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-yellow-700">Status</p>
                      <p className="text-sm font-medium text-yellow-900">Pending Remittance</p>
                    </div>
                  </div>
                </div>
                <div className="text-center py-4">
                  <Button variant="outline" onClick={() => window.location.href = '/admin/tax-reports'}>
                    View Detailed VAT Reports
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>Export and download financial reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="h-4 w-4" />
                    <span className="font-semibold">Platform Revenue Report</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    Comprehensive revenue report with company breakdowns
                  </p>
                </Button>

                <Button variant="outline" className="h-auto p-4 flex flex-col items-start"
                  onClick={() => window.location.href = '/admin/tax-reports'}>
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="h-4 w-4" />
                    <span className="font-semibold">VAT Tax Report</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    Monthly/quarterly VAT reports for ERA submission
                  </p>
                </Button>

                <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="h-4 w-4" />
                    <span className="font-semibold">Commission Report</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    Platform commission breakdown by company
                  </p>
                </Button>

                <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="h-4 w-4" />
                    <span className="font-semibold">Audit Log Export</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    Financial transaction audit trail export
                  </p>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

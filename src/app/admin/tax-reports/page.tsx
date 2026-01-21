"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Download, TrendingUp, Building2, Receipt, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function TaxReportsPage() {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const currentQuarter = Math.ceil(currentMonth / 3)

  const [period, setPeriod] = useState<"monthly" | "quarterly" | "yearly">("monthly")
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(currentMonth)
  const [quarter, setQuarter] = useState(currentQuarter)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        period,
        year: year.toString(),
        ...(period === "monthly" && { month: month.toString() }),
        ...(period === "quarterly" && { quarter: quarter.toString() })
      })

      const res = await fetch(`/api/admin/tax-reports?${params}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to fetch report")
      }

      const reportData = await res.json()
      setData(reportData)
    } catch (error: any) {
      toast.error("Error", {
        description: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [period, year, month, quarter])

  const getPeriodLabel = () => {
    if (period === "monthly") return `${monthNames[month - 1]} ${year}`
    if (period === "quarterly") return `Q${quarter} ${year}`
    return `${year}`
  }

  const handleExportERA = () => {
    toast.info("Export Feature", {
      description: "Ethiopian Revenue Authority export format coming soon!"
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tax Reports</h1>
          <p className="text-muted-foreground mt-1">
            VAT collection reports for Ethiopian Revenue Authority (ERA)
          </p>
        </div>
        <Button onClick={handleExportERA} disabled={!data}>
          <Download className="mr-2 h-4 w-4" />
          Export for ERA
        </Button>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Report Period</CardTitle>
          <CardDescription>Select the reporting period for VAT summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Period Type</label>
              <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(5)].map((_, i) => {
                    const y = currentYear - i
                    return (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {period === "monthly" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Month</label>
                <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((name, idx) => (
                      <SelectItem key={idx} value={(idx + 1).toString()}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {period === "quarterly" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Quarter</label>
                <Select value={quarter.toString()} onValueChange={(v) => setQuarter(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Q1 (Jan-Mar)</SelectItem>
                    <SelectItem value="2">Q2 (Apr-Jun)</SelectItem>
                    <SelectItem value="3">Q3 (Jul-Sep)</SelectItem>
                    <SelectItem value="4">Q4 (Oct-Dec)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading tax report...</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  VAT Tax Liability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                  {formatCurrency(data.summary.totalVAT)}
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  {getPeriodLabel()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Total Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.totalBookings}</div>
                <p className="text-xs text-muted-foreground mt-1">Paid bookings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Platform Commission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.summary.totalCommission)}</div>
                <p className="text-xs text-muted-foreground mt-1">5% service fee</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 border-teal-200 dark:border-teal-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-teal-900 dark:text-teal-100">
                  Running VAT Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-teal-900 dark:text-teal-100">
                  {formatCurrency(data.summary.runningVATLiability)}
                </div>
                <p className="text-xs text-teal-700 dark:text-teal-300 mt-1">
                  All time up to {new Date(data.dateRange.end).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tax Breakdown Alert */}
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                    Ethiopian Revenue Authority (ERA) Remittance
                  </h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    The VAT amount of <strong>{formatCurrency(data.summary.totalVAT)}</strong> for {getPeriodLabel()}
                    represents 15% tax on platform commission (service fees). This amount must be remitted to the Ethiopian
                    Revenue Authority according to the standard VAT reporting schedule.
                  </p>
                  <div className="mt-3 p-3 bg-white dark:bg-yellow-900/50 rounded-md">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform Commission (5%):</span>
                        <span className="font-medium">{formatCurrency(data.summary.totalCommission)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">VAT on Commission (15%):</span>
                        <span className="font-medium">{formatCurrency(data.summary.totalVAT)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1 mt-1">
                        <span className="font-semibold">Total Platform Revenue:</span>
                        <span className="font-semibold">{formatCurrency(data.summary.totalPlatformRevenue)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="company" className="w-full">
            <TabsList className="grid w-full md:w-auto grid-cols-3">
              <TabsTrigger value="company">By Company</TabsTrigger>
              <TabsTrigger value="trend">Monthly Trend</TabsTrigger>
              <TabsTrigger value="bookings">All Bookings</TabsTrigger>
            </TabsList>

            {/* By Company */}
            <TabsContent value="company">
              <Card>
                <CardHeader>
                  <CardTitle>VAT Collection by Company</CardTitle>
                  <CardDescription>
                    Breakdown of VAT collected from each bus company's bookings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr className="text-left">
                          <th className="pb-3 font-medium">Company</th>
                          <th className="pb-3 font-medium text-right">Bookings</th>
                          <th className="pb-3 font-medium text-right">Commission</th>
                          <th className="pb-3 font-medium text-right">VAT</th>
                          <th className="pb-3 font-medium text-right">Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.companyBreakdown.map((company: any, idx: number) => (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="py-3 flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {company.companyName}
                            </td>
                            <td className="py-3 text-right">{company.bookings}</td>
                            <td className="py-3 text-right">{formatCurrency(company.commission)}</td>
                            <td className="py-3 text-right font-medium text-yellow-600 dark:text-yellow-400">
                              {formatCurrency(company.vat)}
                            </td>
                            <td className="py-3 text-right font-medium">
                              {formatCurrency(company.commission + company.vat)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t-2 font-bold">
                        <tr>
                          <td className="pt-3">TOTAL</td>
                          <td className="pt-3 text-right">{data.summary.totalBookings}</td>
                          <td className="pt-3 text-right">{formatCurrency(data.summary.totalCommission)}</td>
                          <td className="pt-3 text-right text-yellow-600 dark:text-yellow-400">
                            {formatCurrency(data.summary.totalVAT)}
                          </td>
                          <td className="pt-3 text-right">
                            {formatCurrency(data.summary.totalPlatformRevenue)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Monthly Trend */}
            <TabsContent value="trend">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trend</CardTitle>
                  <CardDescription>
                    VAT collection trends over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr className="text-left">
                          <th className="pb-3 font-medium">Month</th>
                          <th className="pb-3 font-medium text-right">Bookings</th>
                          <th className="pb-3 font-medium text-right">Commission</th>
                          <th className="pb-3 font-medium text-right">VAT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.monthlyTrend.map((month: any, idx: number) => (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="py-3 font-medium">{month.month}</td>
                            <td className="py-3 text-right">{month.bookings}</td>
                            <td className="py-3 text-right">{formatCurrency(month.commission)}</td>
                            <td className="py-3 text-right font-medium text-yellow-600 dark:text-yellow-400">
                              {formatCurrency(month.vat)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* All Bookings */}
            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <CardTitle>All Bookings ({data.bookings.length})</CardTitle>
                  <CardDescription>
                    Detailed booking records for {getPeriodLabel()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr className="text-left">
                          <th className="pb-3 font-medium">Date</th>
                          <th className="pb-3 font-medium">Company</th>
                          <th className="pb-3 font-medium">Route</th>
                          <th className="pb-3 font-medium text-right">Amount</th>
                          <th className="pb-3 font-medium text-right">Commission</th>
                          <th className="pb-3 font-medium text-right">VAT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.bookings.map((booking: any, idx: number) => (
                          <tr key={idx} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-2">{formatDate(new Date(booking.date))}</td>
                            <td className="py-2">{booking.company}</td>
                            <td className="py-2 text-muted-foreground">{booking.route}</td>
                            <td className="py-2 text-right">{formatCurrency(booking.totalAmount)}</td>
                            <td className="py-2 text-right">{formatCurrency(booking.commission)}</td>
                            <td className="py-2 text-right text-yellow-600 dark:text-yellow-400 font-medium">
                              {formatCurrency(booking.vat)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

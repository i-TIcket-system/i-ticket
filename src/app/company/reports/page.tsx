"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  BarChart3,
  Car,
  UserCheck,
  Ticket,
  TrendingUp,
  MapPin,
  Calendar,
  Download,
  Loader2,
  Users,
  DollarSign,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface StaffReport {
  staff: {
    id: string
    name: string
    phone: string
    licenseNumber?: string
  }
  totalTrips: number
  totalPassengers: number
  totalRevenue: number
  routes: Array<{
    route: string
    tripCount: number
  }>
  trips: Array<{
    id: string
    route: string
    fullRoute?: string
    departureTime: Date
    passengers: number
    revenue: number
  }>
}

interface ReportsData {
  drivers?: StaffReport[]
  conductors?: StaffReport[]
  ticketers?: StaffReport[]
  summary: {
    totalTrips: number
    uniqueDrivers: number
    uniqueConductors: number
    uniqueTicketers: number
    dateRange: {
      start?: string
      end?: string
    }
  }
}

export default function ReportsPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<ReportsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  // Filters
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Set default date range (last 30 days)
  useEffect(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)

    setEndDate(end.toISOString().split("T")[0])
    setStartDate(start.toISOString().split("T")[0])
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      fetchReports()
    }
  }, [startDate, endDate])

  const fetchReports = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        staffType: "all",
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      })

      const response = await fetch(`/api/company/reports/staff-trips?${params}`)
      const result = await response.json()

      if (response.ok) {
        setData(result)
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-ET", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const StaffTable = ({ reports, type }: { reports: StaffReport[]; type: string }) => (
    <div className="space-y-4">
      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <p>No {type} data available for the selected period.</p>
            <p className="text-sm mt-2">Try adjusting the date range or assign staff to trips.</p>
          </CardContent>
        </Card>
      ) : (
        reports.map((report) => (
          <Card key={report.staff.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {report.staff.name}
                    {report.staff.licenseNumber && (
                      <Badge variant="outline" className="font-normal">
                        License: {report.staff.licenseNumber}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{report.staff.phone}</CardDescription>
                </div>
                <div className="grid grid-cols-3 gap-4 text-right">
                  <div>
                    <p className="text-2xl font-bold text-primary">{report.totalTrips}</p>
                    <p className="text-xs text-muted-foreground">Trips</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{report.totalPassengers}</p>
                    <p className="text-xs text-muted-foreground">Passengers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(report.totalRevenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Top Routes */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Top Routes
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {report.routes.slice(0, 6).map((route, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted"
                    >
                      <span className="text-sm">{route.route}</span>
                      <Badge variant="secondary">{route.tripCount} trips</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Trips */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Recent Trips
                </h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Route</TableHead>
                        <TableHead>Departure</TableHead>
                        <TableHead className="text-right">Passengers</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.trips.slice(0, 5).map((trip) => (
                        <TableRow key={trip.id}>
                          <TableCell className="font-medium">{trip.route}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(trip.departureTime)}
                          </TableCell>
                          <TableCell className="text-right">{trip.passengers}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(trip.revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Staff Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive analytics on driver, conductor, and ticketer performance
          </p>
        </div>

        {/* Date Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <Button onClick={fetchReports} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Trips</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{data.summary.totalTrips}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Car className="h-4 w-4" />
                Drivers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{data.summary.uniqueDrivers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <UserCheck className="h-4 w-4" />
                Conductors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{data.summary.uniqueConductors}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Ticket className="h-4 w-4" />
                Ticketers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{data.summary.uniqueTicketers}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="drivers">
              <Car className="h-4 w-4 mr-2" />
              Drivers ({data.drivers?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="conductors">
              <UserCheck className="h-4 w-4 mr-2" />
              Conductors ({data.conductors?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="ticketers">
              <Ticket className="h-4 w-4 mr-2" />
              Ticketers ({data.ticketers?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>
                  Top performing staff across all categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Top Driver */}
                  {data.drivers && data.drivers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Car className="h-4 w-4 text-blue-600" />
                        Top Driver
                      </h4>
                      <div className="p-4 rounded-lg border bg-card">
                        <p className="font-semibold">{data.drivers[0].staff.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {data.drivers[0].staff.phone}
                        </p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Trips:</span>
                            <span className="font-medium">{data.drivers[0].totalTrips}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Passengers:</span>
                            <span className="font-medium">{data.drivers[0].totalPassengers}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Revenue:</span>
                            <span className="font-medium">
                              {formatCurrency(data.drivers[0].totalRevenue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Top Conductor */}
                  {data.conductors && data.conductors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        Top Conductor
                      </h4>
                      <div className="p-4 rounded-lg border bg-card">
                        <p className="font-semibold">{data.conductors[0].staff.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {data.conductors[0].staff.phone}
                        </p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Trips:</span>
                            <span className="font-medium">{data.conductors[0].totalTrips}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Passengers:</span>
                            <span className="font-medium">
                              {data.conductors[0].totalPassengers}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Revenue:</span>
                            <span className="font-medium">
                              {formatCurrency(data.conductors[0].totalRevenue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Top Ticketer */}
                  {data.ticketers && data.ticketers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-orange-600" />
                        Top Ticketer
                      </h4>
                      <div className="p-4 rounded-lg border bg-card">
                        <p className="font-semibold">{data.ticketers[0].staff.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {data.ticketers[0].staff.phone}
                        </p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Trips:</span>
                            <span className="font-medium">{data.ticketers[0].totalTrips}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Passengers:</span>
                            <span className="font-medium">
                              {data.ticketers[0].totalPassengers}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Revenue:</span>
                            <span className="font-medium">
                              {formatCurrency(data.ticketers[0].totalRevenue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drivers" className="mt-4">
            {data.drivers && <StaffTable reports={data.drivers} type="driver" />}
          </TabsContent>

          <TabsContent value="conductors" className="mt-4">
            {data.conductors && <StaffTable reports={data.conductors} type="conductor" />}
          </TabsContent>

          <TabsContent value="ticketers" className="mt-4">
            {data.ticketers && <StaffTable reports={data.ticketers} type="ticketer" />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

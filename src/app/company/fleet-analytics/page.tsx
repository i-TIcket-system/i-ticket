"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import {
  Gauge,
  AlertTriangle,
  TrendingUp,
  Calendar,
  DollarSign,
  Loader2,
  RefreshCw,
  Wrench,
  Clock,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FleetHealthGauge } from "@/components/fleet/FleetHealthGauge"
import { RiskDistributionChart } from "@/components/fleet/RiskDistributionChart"
import { RiskTrendChart } from "@/components/fleet/RiskTrendChart"
import { CostForecastChart } from "@/components/fleet/CostForecastChart"
import { FailureTimelineChart } from "@/components/fleet/FailureTimelineChart"
import { VehicleComparisonTable } from "@/components/fleet/VehicleComparisonTable"

interface FleetHealthData {
  fleetHealthScore: number
  totalVehicles: number
  riskDistribution: { low: number; medium: number; high: number; critical: number }
  highRiskVehicles: {
    id: string
    plateNumber: string
    sideNumber: string | null
    riskScore: number | null
    predictedFailureDate: string | null
    predictedFailureType: string | null
  }[]
  upcomingMaintenance: number
  overdueMaintenance: number
}

interface RiskTrendsData {
  trends: {
    vehicleId: string
    plateNumber: string
    data: { date: string; score: number }[]
  }[]
}

interface FailureTimelineData {
  events: {
    vehicleId: string
    plateNumber: string
    date: string
    type: string
    label: string
    priority?: number
    riskScore?: number
  }[]
}

interface CostForecastData {
  thirtyDay: number
  sixtyDay: number
  ninetyDay: number
  breakdown: { category: string; thirtyDay: number; sixtyDay: number; ninetyDay: number }[]
}

interface VehicleComparisonData {
  vehicles: {
    id: string
    plateNumber: string
    sideNumber: string | null
    make: string
    model: string
    year: number
    totalSeats: number
    status: string
    maintenanceRiskScore: number | null
    currentOdometer: number | null
    fuelEfficiencyL100km: number | null
    maintenanceCostYTD: number
    tripCount: number
    workOrderCount: number
    lastServiceDate: string | null
  }[]
}

export default function FleetAnalyticsPage() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const isFetchingRef = useRef(false)

  const [healthData, setHealthData] = useState<FleetHealthData | null>(null)
  const [trendsData, setTrendsData] = useState<RiskTrendsData | null>(null)
  const [timelineData, setTimelineData] = useState<FailureTimelineData | null>(null)
  const [forecastData, setForecastData] = useState<CostForecastData | null>(null)
  const [comparisonData, setComparisonData] = useState<VehicleComparisonData | null>(null)

  const fetchData = useCallback(async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true

    try {
      const results = await Promise.allSettled([
        fetch("/api/company/analytics/fleet-health").then((r) => r.ok ? r.json() : null),
        fetch("/api/company/analytics/risk-trends").then((r) => r.ok ? r.json() : null),
        fetch("/api/company/analytics/failure-timeline").then((r) => r.ok ? r.json() : null),
        fetch("/api/company/analytics/cost-forecast").then((r) => r.ok ? r.json() : null),
        fetch("/api/company/analytics/vehicle-comparison").then((r) => r.ok ? r.json() : null),
      ])

      if (results[0].status === "fulfilled" && results[0].value) setHealthData(results[0].value)
      if (results[1].status === "fulfilled" && results[1].value) setTrendsData(results[1].value)
      if (results[2].status === "fulfilled" && results[2].value) setTimelineData(results[2].value)
      if (results[3].status === "fulfilled" && results[3].value) setForecastData(results[3].value)
      if (results[4].status === "fulfilled" && results[4].value) setComparisonData(results[4].value)

      setLastUpdated(new Date())
    } catch (error) {
      console.error("Failed to fetch fleet analytics:", error)
    } finally {
      setIsLoading(false)
      isFetchingRef.current = false
    }
  }, [])

  useEffect(() => {
    if (status === "authenticated") {
      fetchData()

      // Poll every 30 seconds
      const interval = setInterval(() => {
        if (!document.hidden) {
          fetchData()
        }
      }, 30000)

      const handleVisibility = () => {
        if (!document.hidden) fetchData()
      }
      document.addEventListener("visibilitychange", handleVisibility)

      return () => {
        clearInterval(interval)
        document.removeEventListener("visibilitychange", handleVisibility)
      }
    }
  }, [status, fetchData])

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Loading fleet analytics...</p>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
    }).format(amount)

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Gauge className="h-8 w-8 text-primary" />
              Fleet Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered predictive maintenance insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Gauge className="h-4 w-4" />
                Fleet Health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                {healthData?.fleetHealthScore ?? "—"}%
              </p>
              <p className="text-xs text-muted-foreground">
                {healthData?.totalVehicles ?? 0} active vehicles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                High Risk
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">
                {healthData?.highRiskVehicles.length ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">
                {healthData?.riskDistribution.critical ?? 0} critical
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Wrench className="h-4 w-4" />
                Upcoming Maintenance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {healthData?.upcomingMaintenance ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">
                {healthData?.overdueMaintenance ?? 0} overdue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                30-Day Forecast
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {forecastData ? formatCurrency(forecastData.thirtyDay) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                Projected maintenance cost
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1: Health Gauge + Risk Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fleet Health Score</CardTitle>
              <CardDescription>Overall fleet condition based on AI risk analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <FleetHealthGauge
                score={healthData?.fleetHealthScore ?? 0}
                totalVehicles={healthData?.totalVehicles ?? 0}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Risk Distribution</CardTitle>
              <CardDescription>Vehicle count by risk category</CardDescription>
            </CardHeader>
            <CardContent>
              <RiskDistributionChart
                distribution={healthData?.riskDistribution ?? { low: 0, medium: 0, high: 0, critical: 0 }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2: Risk Trends */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Risk Score Trends
            </CardTitle>
            <CardDescription>Historical risk scores per vehicle (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <RiskTrendChart trends={trendsData?.trends ?? []} />
          </CardContent>
        </Card>

        {/* Charts Row 3: Cost Forecast + Failure Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Cost Forecast
              </CardTitle>
              <CardDescription>30/60/90 day maintenance cost projection</CardDescription>
            </CardHeader>
            <CardContent>
              <CostForecastChart forecast={forecastData ?? { thirtyDay: 0, sixtyDay: 0, ninetyDay: 0, breakdown: [] }} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Maintenance Timeline
              </CardTitle>
              <CardDescription>Predicted failures and scheduled maintenance</CardDescription>
            </CardHeader>
            <CardContent>
              <FailureTimelineChart events={timelineData?.events ?? []} />
            </CardContent>
          </Card>
        </div>

        {/* High Risk Alerts */}
        {healthData && healthData.highRiskVehicles.length > 0 && (
          <Card className="mb-6 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                High Risk Vehicles
              </CardTitle>
              <CardDescription>Vehicles requiring immediate attention (risk score 70+)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {healthData.highRiskVehicles.map((v) => (
                  <div
                    key={v.id}
                    className={`p-4 rounded-lg border ${
                      (v.riskScore || 0) >= 85
                        ? "border-red-200 bg-red-50"
                        : "border-orange-200 bg-orange-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{v.plateNumber}</span>
                      <Badge variant={(v.riskScore || 0) >= 85 ? "destructive" : "default"}>
                        {v.riskScore}/100
                      </Badge>
                    </div>
                    {v.sideNumber && (
                      <p className="text-xs text-muted-foreground">{v.sideNumber}</p>
                    )}
                    {v.predictedFailureType && (
                      <p className="text-sm mt-1">
                        Predicted: <span className="font-medium">{v.predictedFailureType}</span>
                      </p>
                    )}
                    {v.predictedFailureDate && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {new Date(v.predictedFailureDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vehicle Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vehicle Comparison</CardTitle>
            <CardDescription>Side-by-side metrics for fleet vehicles (sorted by risk)</CardDescription>
          </CardHeader>
          <CardContent>
            <VehicleComparisonTable vehicles={comparisonData?.vehicles ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

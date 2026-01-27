"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  DollarSign,
  Loader2,
  TrendingUp,
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Package,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Stats {
  totalLaborCost: number
  totalPartsCost: number
  totalCost: number
  averageCost: number
  totalWorkOrders: number
  byStatus: Record<string, { count: number; totalCost: number }>
}

interface WorkOrder {
  id: string
  workOrderNumber: string
  title: string
  status: string
  priority: number
  laborCost: number
  partsCost: number
  totalCost: number
  createdAt: string
  vehicle: {
    plateNumber: string
    sideNumber: string | null
    make: string
    model: string
  }
}

export default function FinanceDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentWorkOrders, setRecentWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "authenticated") {
      if (session.user.role !== "COMPANY_ADMIN" || session.user.staffRole !== "FINANCE") {
        router.push("/")
        return
      }
      fetchData()
    }
  }, [status, session, router])

  const fetchData = async () => {
    try {
      const response = await fetch("/api/finance/work-orders")
      const data = await response.json()

      if (response.ok) {
        setStats(data.stats)
        setRecentWorkOrders(data.workOrders.slice(0, 5))
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-muted-foreground">Loading financial data...</p>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ET", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " Birr"
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 border border-emerald-300">
            <DollarSign className="h-6 w-6 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Finance Dashboard</h1>
            <p className="text-muted-foreground">
              Track maintenance costs and budgets
            </p>
          </div>
        </div>
      </div>

      {/* Cost Overview Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-700 font-medium">Total Spending</p>
                  <p className="text-2xl font-bold text-emerald-900">
                    {formatCurrency(stats.totalCost)}
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Labor Costs</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(stats.totalLaborCost)}
                  </p>
                </div>
                <Wrench className="h-10 w-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 font-medium">Parts Costs</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatCurrency(stats.totalPartsCost)}
                  </p>
                </div>
                <Package className="h-10 w-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-700 font-medium">Avg. per Work Order</p>
                  <p className="text-2xl font-bold text-amber-900">
                    {formatCurrency(stats.averageCost)}
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Breakdown & Recent Work Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Breakdown */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Spending by Status</CardTitle>
            <CardDescription>Cost breakdown by work order status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.byStatus && Object.entries(stats.byStatus).map(([status, data]) => {
              const statusStyles: Record<string, { color: string; icon: typeof Clock }> = {
                OPEN: { color: "text-blue-600 bg-blue-100", icon: Clock },
                IN_PROGRESS: { color: "text-yellow-600 bg-yellow-100", icon: Wrench },
                BLOCKED: { color: "text-red-600 bg-red-100", icon: AlertTriangle },
                COMPLETED: { color: "text-green-600 bg-green-100", icon: CheckCircle },
                CANCELLED: { color: "text-gray-600 bg-gray-100", icon: AlertTriangle },
              }
              const style = statusStyles[status] || statusStyles.OPEN
              const Icon = style.icon

              return (
                <div key={status} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${style.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{status.replace("_", " ")}</p>
                      <p className="text-xs text-muted-foreground">{data.count} work orders</p>
                    </div>
                  </div>
                  <p className="font-semibold">{formatCurrency(data.totalCost)}</p>
                </div>
              )
            })}

            {(!stats?.byStatus || Object.keys(stats.byStatus).length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No spending data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Work Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Work Orders</CardTitle>
              <CardDescription>Latest maintenance costs</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/finance/work-orders">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentWorkOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No work orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentWorkOrders.map((wo) => (
                  <Link
                    key={wo.id}
                    href={`/finance/work-orders/${wo.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-mono text-xs">
                          {wo.workOrderNumber}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={
                            wo.status === "COMPLETED"
                              ? "bg-green-600 text-white"
                              : wo.status === "IN_PROGRESS"
                              ? "bg-yellow-500 text-gray-900"
                              : "bg-blue-600 text-white"
                          }
                        >
                          {wo.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium line-clamp-1">{wo.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {wo.vehicle.plateNumber} - {wo.vehicle.make} {wo.vehicle.model}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-emerald-700">
                        {formatCurrency(wo.totalCost)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(wo.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      {stats && (
        <Card className="mt-6">
          <CardContent className="py-6">
            <div className="flex flex-wrap items-center justify-center gap-8 text-center">
              <div>
                <p className="text-3xl font-bold text-emerald-600">{stats.totalWorkOrders}</p>
                <p className="text-sm text-muted-foreground">Total Work Orders</p>
              </div>
              <div className="hidden sm:block w-px h-12 bg-border" />
              <div>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.byStatus?.COMPLETED?.count || 0}
                </p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div className="hidden sm:block w-px h-12 bg-border" />
              <div>
                <p className="text-3xl font-bold text-yellow-600">
                  {stats.byStatus?.IN_PROGRESS?.count || 0}
                </p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
              <div className="hidden sm:block w-px h-12 bg-border" />
              <div>
                <p className="text-3xl font-bold text-amber-600">
                  {stats.byStatus?.OPEN?.count || 0}
                </p>
                <p className="text-sm text-muted-foreground">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

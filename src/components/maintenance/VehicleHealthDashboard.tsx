'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Fuel,
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
} from 'lucide-react'

interface VehicleHealthData {
  maintenanceRiskScore: number | null
  predictedFailureDate: string | null
  predictedFailureType: string | null
  lastPredictionUpdate: string | null
  fuelEfficiencyL100km: number | null
  utilizationRate: number | null
  defectCount: number
  criticalDefectCount: number
  upcomingSchedules: Array<{
    id: string
    taskName: string
    status: string
    daysUntilDue: number | null
    kmUntilDue: number | null
  }>
  activeWorkOrders: Array<{
    id: string
    workOrderNumber: string
    workType: string
    priority: string
    status: string
  }>
  recentInspections: Array<{
    id: string
    inspectionType: string
    status: string
    inspectionDate: string
  }>
  costSummary: {
    maintenanceCostMTD: number
    fuelCostMTD: number
    costPerKm: number
  }
}

interface VehicleHealthDashboardProps {
  vehicleId: string
  plateNumber: string
  sideNumber?: string | null
}

export function VehicleHealthDashboard({
  vehicleId,
  plateNumber,
  sideNumber,
}: VehicleHealthDashboardProps) {
  const [data, setData] = useState<VehicleHealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHealthData()
  }, [vehicleId])

  const fetchHealthData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch data from multiple endpoints
      const [schedules, workOrders, inspections, vehicleResponse] = await Promise.all([
        fetch(`/api/company/vehicles/${vehicleId}/maintenance-schedules`).then(r => r.json()),
        fetch(`/api/company/work-orders?vehicleId=${vehicleId}&status=OPEN,IN_PROGRESS`).then(r => r.json()),
        fetch(`/api/company/vehicles/${vehicleId}/inspections`).then(r => r.json()),
        fetch(`/api/company/vehicles/${vehicleId}`).then(r => r.json()),
      ])

      const vehicle = vehicleResponse.vehicle

      setData({
        maintenanceRiskScore: vehicle.maintenanceRiskScore,
        predictedFailureDate: vehicle.predictedFailureDate,
        predictedFailureType: vehicle.predictedFailureType,
        lastPredictionUpdate: vehicle.lastPredictionUpdate,
        fuelEfficiencyL100km: vehicle.fuelEfficiencyL100km,
        utilizationRate: vehicle.utilizationRate,
        defectCount: vehicle.defectCount || 0,
        criticalDefectCount: vehicle.criticalDefectCount || 0,
        upcomingSchedules: schedules.schedules?.filter((s: any) => s.status !== 'OK').slice(0, 5) || [],
        activeWorkOrders: workOrders.workOrders || [],
        recentInspections: inspections.inspections?.slice(0, 3) || [],
        costSummary: {
          maintenanceCostMTD: vehicle.maintenanceCostMTD || 0,
          fuelCostMTD: vehicle.fuelCostMTD || 0,
          costPerKm: vehicle.costPerKm || 0,
        },
      })
    } catch (err) {
      console.error('Error fetching vehicle health data:', err)
      setError('Failed to load vehicle health data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="p-6">
        <p className="text-red-600">{error || 'No data available'}</p>
        <Button onClick={fetchHealthData} className="mt-4">
          Retry
        </Button>
      </Card>
    )
  }

  const getRiskColor = (score: number | null) => {
    if (score === null) return 'gray'
    if (score >= 85) return 'red'
    if (score >= 70) return 'orange'
    if (score >= 50) return 'yellow'
    return 'green'
  }

  const getRiskLabel = (score: number | null) => {
    if (score === null) return 'Unknown'
    if (score >= 85) return 'CRITICAL'
    if (score >= 70) return 'HIGH'
    if (score >= 50) return 'MEDIUM'
    return 'LOW'
  }

  const riskScore = data.maintenanceRiskScore || 0
  const riskColor = getRiskColor(riskScore)
  const riskLabel = getRiskLabel(riskScore)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vehicle Health Dashboard</h2>
          <p className="text-gray-600">
            {plateNumber} ({sideNumber})
          </p>
        </div>
        <Button onClick={fetchHealthData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Risk Score Card - Prominent */}
      <Card className={`p-6 border-2 border-${riskColor}-500 bg-${riskColor}-50`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`h-6 w-6 text-${riskColor}-600`} />
              <h3 className="text-xl font-bold">Maintenance Risk Score</h3>
            </div>
            <div className="flex items-baseline gap-4">
              <span className={`text-5xl font-bold text-${riskColor}-600`}>
                {riskScore}
              </span>
              <span className="text-2xl text-gray-600">/ 100</span>
              <Badge
                variant={riskLabel === 'CRITICAL' ? 'destructive' : 'default'}
                className="ml-4"
              >
                {riskLabel} RISK
              </Badge>
            </div>
            {data.predictedFailureDate && (
              <div className="mt-4 p-3 bg-white rounded border border-${riskColor}-200">
                <p className="text-sm font-medium text-gray-700">
                  Predicted Failure: {data.predictedFailureType || 'Unknown'}
                </p>
                <p className="text-sm text-gray-600">
                  Expected Date: {new Date(data.predictedFailureDate).toLocaleDateString()}
                </p>
              </div>
            )}
            {data.lastPredictionUpdate && (
              <p className="text-xs text-gray-500 mt-2">
                Last updated: {new Date(data.lastPredictionUpdate).toLocaleString()}
              </p>
            )}
          </div>
          <div className="relative w-40 h-40">
            {/* Circular gauge visualization */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="12"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke={`var(--${riskColor}-600)`}
                strokeWidth="12"
                strokeDasharray={`${(riskScore / 100) * 440} 440`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Upcoming Maintenance */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h4 className="font-semibold">Upcoming Maintenance</h4>
          </div>
          <p className="text-3xl font-bold">{data.upcomingSchedules.length}</p>
          <p className="text-sm text-gray-600">
            {data.upcomingSchedules.filter(s => s.status === 'OVERDUE').length} overdue
          </p>
        </Card>

        {/* Active Work Orders */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="h-5 w-5 text-orange-600" />
            <h4 className="font-semibold">Active Work Orders</h4>
          </div>
          <p className="text-3xl font-bold">{data.activeWorkOrders.length}</p>
          <p className="text-sm text-gray-600">
            {data.activeWorkOrders.filter(w => w.priority === 'CRITICAL').length} critical
          </p>
        </Card>

        {/* Defects */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h4 className="font-semibold">Open Defects</h4>
          </div>
          <p className="text-3xl font-bold">{data.defectCount}</p>
          <p className="text-sm text-gray-600">
            {data.criticalDefectCount} critical
          </p>
        </Card>

        {/* Cost This Month */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold">Costs (MTD)</h4>
          </div>
          <p className="text-2xl font-bold">
            {(data.costSummary.maintenanceCostMTD + data.costSummary.fuelCostMTD).toLocaleString()} Birr
          </p>
          <p className="text-sm text-gray-600">
            {data.costSummary.costPerKm?.toFixed(2) || 'N/A'} {data.costSummary.costPerKm ? 'Birr/km' : ''}
          </p>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Maintenance Schedule */}
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Upcoming Maintenance
          </h3>
          {data.upcomingSchedules.length === 0 ? (
            <p className="text-gray-500 text-center py-8">All maintenance up to date</p>
          ) : (
            <div className="space-y-3">
              {data.upcomingSchedules.map(schedule => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-medium">{schedule.taskName}</p>
                    <p className="text-sm text-gray-600">
                      {schedule.daysUntilDue !== null && `${schedule.daysUntilDue} days`}
                      {schedule.daysUntilDue !== null && schedule.kmUntilDue !== null && ' / '}
                      {schedule.kmUntilDue !== null && `${schedule.kmUntilDue} km`}
                    </p>
                  </div>
                  <Badge
                    variant={schedule.status === 'OVERDUE' ? 'destructive' : 'default'}
                  >
                    {schedule.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Active Work Orders */}
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Active Work Orders
          </h3>
          {data.activeWorkOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No active work orders</p>
          ) : (
            <div className="space-y-3">
              {data.activeWorkOrders.slice(0, 5).map(wo => (
                <div
                  key={wo.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-medium">{wo.workOrderNumber}</p>
                    <p className="text-sm text-gray-600">{wo.workType}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={wo.priority === 'CRITICAL' ? 'destructive' : 'default'}>
                      {wo.priority}
                    </Badge>
                    <Badge variant="outline">{wo.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Inspections */}
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Inspections
          </h3>
          {data.recentInspections.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent inspections</p>
          ) : (
            <div className="space-y-3">
              {data.recentInspections.map(inspection => (
                <div
                  key={inspection.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-medium">{inspection.inspectionType}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(inspection.inspectionDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      inspection.status === 'PASS'
                        ? 'default'
                        : inspection.status === 'FAIL'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {inspection.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Performance Metrics */}
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Metrics
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Fuel Efficiency</span>
                <span className="text-sm font-bold">
                  {data.fuelEfficiencyL100km?.toFixed(1) || 'N/A'} L/100km
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(100, ((data.fuelEfficiencyL100km || 0) / 50) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Utilization Rate</span>
                <span className="text-sm font-bold">
                  {data.utilizationRate?.toFixed(1) || 'N/A'}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${data.utilizationRate || 0}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-gray-600">Maintenance Cost (MTD)</p>
                <p className="text-lg font-bold">
                  {data.costSummary.maintenanceCostMTD.toLocaleString()} Birr
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Fuel Cost (MTD)</p>
                <p className="text-lg font-bold">
                  {data.costSummary.fuelCostMTD.toLocaleString()} Birr
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

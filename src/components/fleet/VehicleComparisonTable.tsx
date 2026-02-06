"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface VehicleComparison {
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
}

interface VehicleComparisonTableProps {
  vehicles: VehicleComparison[]
}

function RiskBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground text-xs">N/A</span>
  const variant = score >= 85 ? "destructive" : score >= 60 ? "default" : "secondary"
  const label = score >= 85 ? "Critical" : score >= 60 ? "High" : score >= 40 ? "Medium" : "Low"
  return (
    <div className="flex items-center gap-2">
      <div className="w-12 h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${score}%`,
            backgroundColor: score >= 85 ? "#ef4444" : score >= 60 ? "#f97316" : score >= 40 ? "#f59e0b" : "#22c55e",
          }}
        />
      </div>
      <Badge variant={variant} className="text-xs">
        {score} - {label}
      </Badge>
    </div>
  )
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 0,
  }).format(amount)

export function VehicleComparisonTable({ vehicles }: VehicleComparisonTableProps) {
  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
        No vehicle data available
      </div>
    )
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehicle</TableHead>
            <TableHead>Risk Score</TableHead>
            <TableHead className="text-right">Odometer</TableHead>
            <TableHead className="text-right">Fuel Eff.</TableHead>
            <TableHead className="text-right">Maint. Cost YTD</TableHead>
            <TableHead className="text-right">Trips</TableHead>
            <TableHead className="text-right">Work Orders</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((v) => (
            <TableRow key={v.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{v.plateNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.make} {v.model} ({v.year})
                    {v.sideNumber && ` - ${v.sideNumber}`}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <RiskBadge score={v.maintenanceRiskScore} />
              </TableCell>
              <TableCell className="text-right">
                {v.currentOdometer ? `${v.currentOdometer.toLocaleString()} km` : "N/A"}
              </TableCell>
              <TableCell className="text-right">
                {v.fuelEfficiencyL100km ? `${v.fuelEfficiencyL100km.toFixed(1)} L/100km` : "N/A"}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(v.maintenanceCostYTD)}
              </TableCell>
              <TableCell className="text-right">{v.tripCount}</TableCell>
              <TableCell className="text-right">{v.workOrderCount}</TableCell>
              <TableCell>
                <Badge
                  variant={v.status === "ACTIVE" ? "secondary" : v.status === "MAINTENANCE" ? "default" : "outline"}
                >
                  {v.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

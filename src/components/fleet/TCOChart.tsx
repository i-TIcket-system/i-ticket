"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface TCOVehicle {
  vehicleId: string
  plateNumber: string
  purchasePrice: number
  totalMaintenance: number
  totalFuel: number
  totalCostOfOwnership: number
}

interface TCOChartProps {
  vehicles: TCOVehicle[]
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return `${value}`
}

export function TCOChart({ vehicles }: TCOChartProps) {
  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
        No vehicle cost data available
      </div>
    )
  }

  // Top 10 by TCO
  const data = vehicles.slice(0, 10).map((v) => ({
    name: v.plateNumber,
    purchase: v.purchasePrice,
    maintenance: v.totalMaintenance,
    fuel: v.totalFuel,
    total: v.totalCostOfOwnership,
  }))

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="name"
          stroke="#9CA3AF"
          style={{ fontSize: "11px" }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis
          tickFormatter={(v) => `${formatCurrency(v)} ETB`}
          stroke="#9CA3AF"
          style={{ fontSize: "11px" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#FFF",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any) => [
            `${Number(value).toLocaleString()} ETB`,
            name === "purchase" ? "Purchase" : name === "maintenance" ? "Maintenance" : "Fuel",
          ]}
        />
        <Legend />
        <Bar dataKey="purchase" stackId="tco" fill="#3b82f6" name="Purchase" radius={[0, 0, 0, 0]} />
        <Bar dataKey="maintenance" stackId="tco" fill="#f97316" name="Maintenance" radius={[0, 0, 0, 0]} />
        <Bar dataKey="fuel" stackId="tco" fill="#14B8A6" name="Fuel" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

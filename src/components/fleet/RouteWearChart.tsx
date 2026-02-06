"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface RouteWearData {
  route: string
  tripCount: number
  totalDistance: number
  avgFuelEfficiency: number
  efficiencyDegradation: number
  totalDefects: number
  wearIndex: number
}

interface RouteWearChartProps {
  routes: RouteWearData[]
}

const getWearColor = (index: number) => {
  if (index >= 70) return "#ef4444"
  if (index >= 50) return "#f97316"
  if (index >= 30) return "#f59e0b"
  return "#22c55e"
}

export function RouteWearChart({ routes }: RouteWearChartProps) {
  if (!routes || routes.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
        Not enough trip data to analyze route wear. Complete more trips with odometer readings.
      </div>
    )
  }

  // Show top 10 routes
  const data = routes.slice(0, 10).map((r) => ({
    ...r,
    shortRoute: r.route.length > 25 ? r.route.substring(0, 22) + "..." : r.route,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          type="number"
          domain={[0, 100]}
          stroke="#9CA3AF"
          style={{ fontSize: "11px" }}
          label={{ value: "Wear Index", position: "insideBottom", offset: -5, style: { fontSize: "11px", fill: "#9CA3AF" } }}
        />
        <YAxis
          type="category"
          dataKey="shortRoute"
          width={130}
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
          formatter={(_value: any, _name: any, props: any) => {
            const d = props?.payload as RouteWearData
            if (!d) return ["", ""]
            return [
              <div key="tooltip" className="space-y-1">
                <div>Wear Index: <strong>{d.wearIndex}/100</strong></div>
                <div>Trips: {d.tripCount}</div>
                <div>Avg Efficiency: {d.avgFuelEfficiency} km/L</div>
                <div>Defects: {d.totalDefects}</div>
              </div>,
              d.route,
            ]
          }}
        />
        <Bar dataKey="wearIndex" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getWearColor(entry.wearIndex)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

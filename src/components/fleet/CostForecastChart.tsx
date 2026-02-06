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
  Line,
  ComposedChart,
} from "recharts"

interface CostForecastChartProps {
  forecast: {
    thirtyDay: number
    sixtyDay: number
    ninetyDay: number
    breakdown: { category: string; thirtyDay: number; sixtyDay: number; ninetyDay: number }[]
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  PREVENTIVE: "#14B8A6",
  CORRECTIVE: "#ef4444",
  INSPECTION: "#3b82f6",
  EMERGENCY: "#f97316",
  SCHEDULED: "#8b5cf6",
  SERVICE: "#10b981",
}

const formatCurrency = (value: number) => {
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return `${value}`
}

export function CostForecastChart({ forecast }: CostForecastChartProps) {
  if (!forecast || (forecast.thirtyDay === 0 && forecast.sixtyDay === 0 && forecast.ninetyDay === 0)) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
        No cost data available. Complete some work orders to see projections.
      </div>
    )
  }

  // Build chart data with category breakdown
  const categories = forecast.breakdown.map((b) => b.category)
  const chartData = [
    { period: "30 Days", total: forecast.thirtyDay, ...Object.fromEntries(forecast.breakdown.map((b) => [b.category, b.thirtyDay])) },
    { period: "60 Days", total: forecast.sixtyDay, ...Object.fromEntries(forecast.breakdown.map((b) => [b.category, b.sixtyDay])) },
    { period: "90 Days", total: forecast.ninetyDay, ...Object.fromEntries(forecast.breakdown.map((b) => [b.category, b.ninetyDay])) },
  ]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="period" stroke="#9CA3AF" style={{ fontSize: "12px" }} />
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
            name === "total" ? "Total" : name,
          ]}
        />
        <Legend />
        {categories.map((cat) => (
          <Bar
            key={cat}
            dataKey={cat}
            stackId="costs"
            fill={CATEGORY_COLORS[cat] || "#9CA3AF"}
            radius={categories.indexOf(cat) === categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
        <Line
          type="monotone"
          dataKey="total"
          stroke="#0d4f5c"
          strokeWidth={2}
          dot={{ fill: "#0d4f5c", r: 4 }}
          name="Total"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

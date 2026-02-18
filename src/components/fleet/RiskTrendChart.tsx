"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface VehicleRiskTrend {
  vehicleId: string
  plateNumber: string
  data: { date: string; score: number }[]
}

interface RiskTrendChartProps {
  trends: VehicleRiskTrend[]
}

const TREND_COLORS = [
  "#14B8A6", "#8b5cf6", "#f59e0b", "#ef4444", "#3b82f6",
  "#ec4899", "#10b981", "#6366f1", "#f97316", "#06b6d4",
]

export function RiskTrendChart({ trends }: RiskTrendChartProps) {
  if (!trends || trends.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
        No risk trend data available yet. Data will appear after the daily cron job runs.
      </div>
    )
  }

  // Merge all dates into unified timeline
  const allDates = new Set<string>()
  trends.forEach((t) => t.data.forEach((d) => allDates.add(d.date)))
  const sortedDates = Array.from(allDates).sort()

  const chartData = sortedDates.map((date) => {
    const point: Record<string, string | number> = { date }
    trends.forEach((t) => {
      const match = t.data.find((d) => d.date === date)
      if (match) point[t.plateNumber] = match.score
    })
    return point
  })

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          stroke="#9CA3AF"
          style={{ fontSize: "11px" }}
        />
        <YAxis
          domain={[0, 100]}
          stroke="#9CA3AF"
          style={{ fontSize: "11px" }}
          label={{ value: "Risk Score", angle: -90, position: "insideLeft", style: { fontSize: "11px", fill: "#9CA3AF" } }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#FFF",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
          labelFormatter={(label) => formatDate(String(label))}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [`${value}/100`, ""]}
        />
        <Legend verticalAlign="top" height={36} />
        {/* Reference lines for risk thresholds */}
        {trends.map((t, i) => (
          <Line
            key={t.vehicleId}
            type="monotone"
            dataKey={t.plateNumber}
            stroke={TREND_COLORS[i % TREND_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

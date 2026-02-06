"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface RiskDistributionChartProps {
  distribution: {
    low: number
    medium: number
    high: number
    critical: number
  }
}

const RISK_COLORS = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
}

const RISK_LABELS = {
  low: "Low (0-39)",
  medium: "Medium (40-59)",
  high: "High (60-84)",
  critical: "Critical (85+)",
}

export function RiskDistributionChart({ distribution }: RiskDistributionChartProps) {
  const data = [
    { name: RISK_LABELS.low, value: distribution.low, color: RISK_COLORS.low },
    { name: RISK_LABELS.medium, value: distribution.medium, color: RISK_COLORS.medium },
    { name: RISK_LABELS.high, value: distribution.high, color: RISK_COLORS.high },
    { name: RISK_LABELS.critical, value: distribution.critical, color: RISK_COLORS.critical },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
        No vehicle risk data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#FFF",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [`${value} vehicles`, ""]}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value: string) => (
            <span className="text-xs text-gray-600">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
}

interface RevenueChartProps {
  data: RevenueData[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const formatCurrency = (value: number) => {
    return `${(value / 1000).toFixed(0)}K`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const avgRevenue = data.length > 0 ? totalRevenue / data.length : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Revenue Trend
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Last 30 days
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-teal-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalRevenue.toLocaleString()} ETB
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Avg: {Math.round(avgRevenue).toLocaleString()} ETB/day
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#9CA3AF"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            tickFormatter={formatCurrency}
            stroke="#9CA3AF"
            style={{ fontSize: "12px" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFF",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              padding: "12px",
            }}
            formatter={(value: number | undefined, name: string | undefined) => [
              name === "revenue"
                ? `${(value || 0).toLocaleString()} ETB`
                : `${value || 0} bookings`,
              name === "revenue" ? "Revenue" : "Bookings",
            ]}
            labelFormatter={(label) => formatDate(label)}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#14B8A6"
            strokeWidth={3}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

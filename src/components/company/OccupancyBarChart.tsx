"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Users } from "lucide-react";

interface OccupancyData {
  week: string;
  occupancy: number;
}

interface OccupancyBarChartProps {
  data: OccupancyData[];
}

export function OccupancyBarChart({ data }: OccupancyBarChartProps) {
  const avgOccupancy =
    data.length > 0
      ? Math.round(data.reduce((sum, item) => sum + item.occupancy, 0) / data.length)
      : 0;

  const goodOccupancyWeeks = data.filter((item) => item.occupancy >= 80).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Occupancy Rate
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Last 8 weeks average
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {avgOccupancy}%
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {goodOccupancyWeeks}/8 weeks above 80%
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="week"
            stroke="#9CA3AF"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
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
            formatter={(value: number | undefined) => [`${value || 0}%`, "Occupancy"]}
          />
          <ReferenceLine
            y={80}
            stroke="#10B981"
            strokeDasharray="3 3"
            label={{
              value: "Target: 80%",
              position: "right",
              fill: "#10B981",
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="occupancy"
            radius={[8, 8, 0, 0]}
            fill="#14B8A6"
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-gray-900 dark:text-white">Note:</span>{" "}
          80% occupancy is considered optimal for profitability and passenger comfort.
        </p>
      </div>
    </div>
  );
}

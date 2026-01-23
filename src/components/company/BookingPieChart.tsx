"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { CheckCircle, Clock, XCircle } from "lucide-react";

interface BookingStats {
  paid: number;
  pending: number;
  cancelled: number;
}

interface BookingPieChartProps {
  stats: BookingStats;
}

export function BookingPieChart({ stats }: BookingPieChartProps) {
  const total = stats.paid + stats.pending + stats.cancelled;

  const data = [
    { name: "Paid", value: stats.paid, color: "#10B981", icon: CheckCircle },
    { name: "Pending", value: stats.pending, color: "#F59E0B", icon: Clock },
    { name: "Cancelled", value: stats.cancelled, color: "#EF4444", icon: XCircle },
  ];

  const COLORS = ["#10B981", "#F59E0B", "#EF4444"];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Booking Status
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Total: {total.toLocaleString()} bookings
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Pie Chart */}
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFF",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
              formatter={(value: number | undefined) => [
                `${(value || 0).toLocaleString()} (${Math.round(((value || 0) / total) * 100)}%)`,
                "",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend with Stats */}
        <div className="flex flex-col justify-center space-y-3">
          {data.map((item, index) => {
            const Icon = item.icon;
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;

            return (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" style={{ color: item.color }} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {item.value.toLocaleString()}
                  </div>
                  <div
                    className="text-xs font-semibold"
                    style={{ color: item.color }}
                  >
                    {percentage}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

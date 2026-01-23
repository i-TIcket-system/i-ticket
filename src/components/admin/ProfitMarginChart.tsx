"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ProfitMarginChartProps {
  profitMargin: number; // Percentage
  target?: number; // Target percentage
  netProfit: number; // ETB amount
}

export function ProfitMarginChart({
  profitMargin,
  target = 12,
  netProfit,
}: ProfitMarginChartProps) {
  const data = [
    { name: "Profit", value: Math.min(profitMargin, 100) },
    { name: "Remaining", value: Math.max(100 - profitMargin, 0) },
  ];

  const isAboveTarget = profitMargin >= target;
  const color = isAboveTarget ? "#10B981" : profitMargin >= target * 0.8 ? "#F59E0B" : "#EF4444";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Net Profit Margin
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Platform profitability metric
        </p>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
            >
              <Cell fill={color} />
              <Cell fill="#E5E7EB" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-bold" style={{ color }}>
            {profitMargin.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Target: {target}%
          </div>
        </div>
      </div>

      {/* Net Profit Amount */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Net Profit (12 months)
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {netProfit.toLocaleString()} ETB
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAboveTarget ? (
              <>
                <TrendingUp className="h-6 w-6 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  Above Target
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="h-6 w-6 text-red-600" />
                <span className="text-sm font-medium text-red-600">
                  Below Target
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

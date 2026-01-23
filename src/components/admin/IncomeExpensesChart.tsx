"use client";

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
} from "recharts";
import { DollarSign } from "lucide-react";

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  netProfit: number;
}

interface IncomeExpensesChartProps {
  data: MonthlyData[];
}

export function IncomeExpensesChart({ data }: IncomeExpensesChartProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
  const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0);
  const totalProfit = totalIncome - totalExpenses;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Income & Expenses
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Last 12 months comparison
          </p>
        </div>
        <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
          <DollarSign className="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            Total Income
          </div>
          <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
            {formatCurrency(totalIncome)} ETB
          </div>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-xs text-red-600 dark:text-red-400 font-medium">
            Total Expenses
          </div>
          <div className="text-xl font-bold text-red-700 dark:text-red-300">
            {formatCurrency(totalExpenses)} ETB
          </div>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-xs text-green-600 dark:text-green-400 font-medium">
            Net Profit
          </div>
          <div className="text-xl font-bold text-green-700 dark:text-green-300">
            {formatCurrency(totalProfit)} ETB
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="month"
            stroke="#9CA3AF"
            style={{ fontSize: "12px" }}
            angle={-45}
            textAnchor="end"
            height={80}
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
              `${(value || 0).toLocaleString()} ETB`,
              name === "income"
                ? "Income"
                : name === "expenses"
                ? "Expenses"
                : "Net Profit",
            ]}
          />
          <Legend />
          <Bar dataKey="income" fill="#3B82F6" name="Total Income" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" fill="#EF4444" name="Total Expenses" radius={[4, 4, 0, 0]} />
          <Line
            type="monotone"
            dataKey="netProfit"
            stroke="#10B981"
            strokeWidth={2}
            name="Net Profit"
            dot={{ fill: "#10B981", r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

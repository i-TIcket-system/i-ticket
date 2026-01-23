"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Target, AlertTriangle, CheckCircle } from "lucide-react";

interface BudgetData {
  actual: number;
  target: number;
  progress: number;
  expectedProgress: number;
  status: "on-track" | "at-risk" | "behind" | "over-budget";
}

interface BudgetProgressChartProps {
  income: BudgetData;
  expenses: BudgetData;
}

export function BudgetProgressChart({ income, expenses }: BudgetProgressChartProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "on-track":
        return "#10B981";
      case "at-risk":
        return "#F59E0B";
      case "behind":
      case "over-budget":
        return "#EF4444";
      default:
        return "#9CA3AF";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "on-track":
        return CheckCircle;
      case "at-risk":
        return AlertTriangle;
      default:
        return Target;
    }
  };

  const BudgetCircle = ({
    title,
    data,
    label,
  }: {
    title: string;
    data: BudgetData;
    label: string;
  }) => {
    const chartData = [
      { name: "Progress", value: data.progress },
      { name: "Remaining", value: Math.max(100 - data.progress, 0) },
    ];

    const color = getStatusColor(data.status);
    const StatusIcon = getStatusIcon(data.status);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-teal-600" />
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This month vs target
          </p>
        </div>

        <div className="relative">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
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
            <div className="text-4xl font-bold" style={{ color }}>
              {data.progress}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              of {label}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="mt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Actual</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {data.actual.toLocaleString()} ETB
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {data.target.toLocaleString()} ETB
            </span>
          </div>
          <div className="h-px bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center gap-2 p-2 rounded-md" style={{ backgroundColor: `${color}15` }}>
            <StatusIcon className="h-4 w-4" style={{ color }} />
            <span className="text-sm font-medium" style={{ color }}>
              {data.status === "on-track" && "On Track"}
              {data.status === "at-risk" && "At Risk"}
              {data.status === "behind" && "Behind Schedule"}
              {data.status === "over-budget" && "Over Budget"}
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Expected progress: {data.expectedProgress}% (based on days elapsed)
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BudgetCircle title="Income Budget" data={income} label="Target" />
      <BudgetCircle title="Expense Budget" data={expenses} label="Budget" />
    </div>
  );
}

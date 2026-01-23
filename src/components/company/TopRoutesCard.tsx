"use client";

import { MapPin, TrendingUp } from "lucide-react";

interface RouteData {
  route: string;
  bookings: number;
  revenue: number;
}

interface TopRoutesCardProps {
  routes: RouteData[];
}

export function TopRoutesCard({ routes }: TopRoutesCardProps) {
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Top Routes
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            By bookings (last 30 days)
          </p>
        </div>
        <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
          <MapPin className="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
      </div>

      {routes.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No route data available yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {routes.map((route, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="text-2xl">{medals[index] || "🏅"}</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {route.route}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {route.bookings} booking{route.bookings !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-teal-600 dark:text-teal-400">
                  {route.revenue.toLocaleString()} ETB
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <TrendingUp className="h-3 w-3" />
                  Rank #{index + 1}
                </div>
              </div>
            </div>
          ))}

          {routes.length < 5 && (
            <div className="text-center py-4 text-xs text-gray-500 dark:text-gray-400">
              Create more trips to see all top 5 routes
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import confetti from "canvas-confetti";

interface PassengerMilestoneProps {
  totalPassengers: number;
  currentMilestone: number;
  nextMilestone: number;
  progressPercent: number;
  companyId?: string;
}

export function PassengerMilestone({
  totalPassengers,
  currentMilestone,
  nextMilestone,
  progressPercent,
  companyId,
}: PassengerMilestoneProps) {
  const [celebrated, setCelebrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !companyId) return;

    // Check if we've already celebrated this milestone
    const key = `milestone_celebrated_${companyId}_${currentMilestone}`;
    const alreadyCelebrated = localStorage.getItem(key);

    if (!alreadyCelebrated && currentMilestone > 0 && progressPercent === 100) {
      // Trigger celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Mark as celebrated
      localStorage.setItem(key, "true");
      setCelebrated(true);
    }
  }, [currentMilestone, progressPercent, companyId]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
            <Trophy className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Passenger Milestone
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {totalPassengers.toLocaleString()} passengers served
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
            {formatNumber(totalPassengers)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Next: {formatNumber(nextMilestone)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-1000 ease-out flex items-center justify-end pr-3"
            style={{ width: `${progressPercent}%` }}
          >
            {progressPercent > 10 && (
              <span className="text-xs font-semibold text-white">
                {progressPercent}%
              </span>
            )}
          </div>
        </div>

        {/* Milestone Markers */}
        <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
          <span className="font-medium">
            {formatNumber(currentMilestone || 0)}
          </span>
          <span className="font-medium text-teal-600 dark:text-teal-400">
            {formatNumber(nextMilestone)}
          </span>
        </div>
      </div>

      {celebrated && (
        <div className="mt-3 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-md border border-teal-200 dark:border-teal-800">
          <p className="text-sm font-medium text-teal-800 dark:text-teal-300 text-center">
            🎉 Congratulations on reaching {formatNumber(currentMilestone)} passengers!
          </p>
        </div>
      )}
    </div>
  );
}

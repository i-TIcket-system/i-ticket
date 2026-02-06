"use client"

import { Badge } from "@/components/ui/badge"

interface TimelineEvent {
  vehicleId: string
  plateNumber: string
  date: string
  type: string // "prediction" or "scheduled"
  label: string
  priority?: number
  riskScore?: number
}

interface FailureTimelineChartProps {
  events: TimelineEvent[]
}

export function FailureTimelineChart({ events }: FailureTimelineChartProps) {
  if (!events || events.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
        No upcoming maintenance events or predicted failures
      </div>
    )
  }

  const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const now = new Date()

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const getDaysFromNow = (dateStr: string) => {
    const d = new Date(dateStr)
    return Math.ceil((d.getTime() - now.getTime()) / 86400000)
  }

  return (
    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
      {sorted.slice(0, 20).map((event, i) => {
        const daysAway = getDaysFromNow(event.date)
        const isPrediction = event.type === "prediction"
        const isUrgent = daysAway <= 7
        const isOverdue = daysAway < 0

        return (
          <div
            key={`${event.vehicleId}-${event.date}-${i}`}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              isOverdue
                ? "border-red-200 bg-red-50"
                : isUrgent
                ? "border-orange-200 bg-orange-50"
                : "border-gray-200 bg-white"
            }`}
          >
            {/* Timeline dot */}
            <div
              className={`w-3 h-3 rounded-full flex-shrink-0 ${
                isPrediction
                  ? "bg-red-500"
                  : isOverdue
                  ? "bg-red-600"
                  : isUrgent
                  ? "bg-orange-500"
                  : "bg-teal-500"
              }`}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{event.plateNumber}</span>
                <Badge
                  variant={isPrediction ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {isPrediction ? "Predicted Failure" : "Scheduled"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{event.label}</p>
            </div>

            {/* Date */}
            <div className="text-right flex-shrink-0">
              <p className={`text-sm font-medium ${isOverdue ? "text-red-600" : isUrgent ? "text-orange-600" : ""}`}>
                {formatDate(event.date)}
              </p>
              <p className="text-xs text-muted-foreground">
                {isOverdue
                  ? `${Math.abs(daysAway)}d overdue`
                  : daysAway === 0
                  ? "Today"
                  : `${daysAway}d away`}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

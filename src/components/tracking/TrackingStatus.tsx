"use client"

interface TrackingStatusProps {
  status: "live" | "stale" | "off"
  lastUpdated?: string | null
  className?: string
}

/**
 * GPS tracking status indicator:
 * - "live" = green pulse
 * - "stale" = yellow
 * - "off" = gray
 */
export default function TrackingStatus({
  status,
  lastUpdated,
  className = "",
}: TrackingStatusProps) {
  const config = {
    live: {
      color: "bg-green-500",
      ring: "ring-green-400/50",
      label: "Live",
      animate: true,
    },
    stale: {
      color: "bg-yellow-500",
      ring: "ring-yellow-400/50",
      label: "Stale",
      animate: false,
    },
    off: {
      color: "bg-gray-400",
      ring: "ring-gray-300/50",
      label: "Off",
      animate: false,
    },
  }

  const c = config[status]

  const timeAgo = lastUpdated ? getTimeAgo(new Date(lastUpdated)) : null

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className={`h-2.5 w-2.5 rounded-full ${c.color}`} />
        {c.animate && (
          <div
            className={`absolute inset-0 h-2.5 w-2.5 rounded-full ${c.color} animate-ping opacity-75`}
          />
        )}
      </div>
      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
        {c.label}
        {timeAgo && status !== "off" && (
          <span className="text-gray-400 ml-1">({timeAgo})</span>
        )}
      </span>
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 10) return "just now"
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

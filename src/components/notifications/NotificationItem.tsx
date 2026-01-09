"use client"

import { formatDistanceToNow } from "date-fns"
import {
  Bell,
  Bus,
  MessageSquare,
  Ticket,
  AlertTriangle,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NotificationItemProps {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  priority: number
  createdAt: string
  tripId?: string | null
  bookingId?: string | null
  onClick?: () => void
}

const typeIcons: Record<string, React.ElementType> = {
  TRIP_ASSIGNED: Bus,
  TRIP_UNASSIGNED: Bus,
  TRIP_MESSAGE: MessageSquare,
  BOOKING_NEW: Ticket,
  BOOKING_PAID: DollarSign,
  BOOKING_CONFIRMED: CheckCircle,
  BOOKING_CANCELLED: XCircle,
  TRIP_HALTED: AlertTriangle,
  TRIP_AUTO_HALTED: AlertTriangle,
  TRIP_RESUMED: CheckCircle,
  COMMISSION_EARNED: DollarSign,
  REFERRAL_NEW: Users,
  PAYOUT_PROCESSED: DollarSign,
  LOW_SLOT_ALERT: AlertCircle,
  SYSTEM_ALERT: Bell,
}

const priorityColors: Record<number, string> = {
  1: "border-l-gray-400",
  2: "border-l-blue-500",
  3: "border-l-yellow-500",
  4: "border-l-red-500",
}

export function NotificationItem({
  id,
  type,
  title,
  message,
  isRead,
  priority,
  createdAt,
  tripId,
  bookingId,
  onClick,
}: NotificationItemProps) {
  const Icon = typeIcons[type] || Bell
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true })

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 border-l-4 transition-colors cursor-pointer",
        priorityColors[priority] || "border-l-gray-400",
        isRead
          ? "bg-white dark:bg-gray-900"
          : "bg-blue-50 dark:bg-blue-950/30",
        "hover:bg-gray-50 dark:hover:bg-gray-800"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick?.()
        }
      }}
    >
      <div
        className={cn(
          "flex-shrink-0 p-2 rounded-full",
          priority >= 3
            ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "text-sm font-medium truncate",
              !isRead && "text-gray-900 dark:text-white"
            )}
          >
            {title}
          </p>
          {!isRead && (
            <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full" />
          )}
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">
          {message}
        </p>

        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          {timeAgo}
        </p>
      </div>
    </div>
  )
}

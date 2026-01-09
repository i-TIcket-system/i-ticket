"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationItem } from "./NotificationItem"
import { cn } from "@/lib/utils"

interface NotificationBellProps {
  variant?: "light" | "dark"
  className?: string
}

/**
 * Get navigation URL based on notification type and user role
 */
function getNotificationUrl(
  type: string,
  tripId: string | null | undefined,
  bookingId: string | null | undefined,
  userRole: string | undefined
): string | null {
  // Trip-related notifications
  if (
    [
      "TRIP_ASSIGNED",
      "TRIP_UNASSIGNED",
      "TRIP_MESSAGE",
      "TRIP_HALTED",
      "TRIP_AUTO_HALTED",
      "TRIP_RESUMED",
      "LOW_SLOT_ALERT",
    ].includes(type) &&
    tripId
  ) {
    // Staff members see their trips page
    if (userRole === "STAFF") {
      return "/staff/my-trips"
    }
    // Manual ticketers (cashiers) go to cashier page
    if (userRole === "MANUAL_TICKETER") {
      return `/cashier/trip/${tripId}`
    }
    // Company admin goes to trip detail
    if (userRole === "COMPANY_ADMIN") {
      return `/company/trips/${tripId}`
    }
    // Super admin can go to company trips overview
    if (userRole === "SUPER_ADMIN") {
      return "/admin/dashboard"
    }
    return null
  }

  // Booking-related notifications
  if (
    ["BOOKING_NEW", "BOOKING_PAID", "BOOKING_CONFIRMED", "BOOKING_CANCELLED"].includes(
      type
    )
  ) {
    // For customers, go to their tickets page
    if (userRole === "CUSTOMER" && bookingId) {
      return `/tickets/${bookingId}`
    }
    // For company admin, go to trip detail if tripId exists
    if (userRole === "COMPANY_ADMIN" && tripId) {
      return `/company/trips/${tripId}`
    }
    return null
  }

  // Sales-related notifications
  if (["COMMISSION_EARNED", "REFERRAL_NEW", "PAYOUT_PROCESSED"].includes(type)) {
    if (userRole === "SALES_PERSON") {
      if (type === "COMMISSION_EARNED") {
        return "/sales/commissions"
      }
      if (type === "REFERRAL_NEW") {
        return "/sales/referrals"
      }
      return "/sales/dashboard"
    }
    return null
  }

  return null
}

export function NotificationBell({
  variant = "light",
  className,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { data: session } = useSession()

  const {
    notifications,
    unreadCount,
    urgentCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  const handleNotificationClick = async (
    notificationId: string,
    isRead: boolean,
    type: string,
    tripId?: string | null,
    bookingId?: string | null
  ) => {
    // Mark as read
    if (!isRead) {
      await markAsRead(notificationId)
    }

    // Navigate to relevant page
    const url = getNotificationUrl(type, tripId, bookingId, session?.user?.role)
    if (url) {
      setIsOpen(false) // Close dropdown
      router.push(url)
    }
  }

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "relative",
          variant === "dark"
            ? "text-gray-300 hover:text-white hover:bg-gray-700"
            : "text-gray-600 hover:text-gray-900"
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold rounded-full",
              urgentCount > 0
                ? "bg-red-500 text-white animate-pulse"
                : "bg-teal-500 text-white"
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            "absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50",
            "animate-in fade-in-0 zoom-in-95 duration-200"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {unreadCount} unread
                </p>
              )}
            </div>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400"
                onClick={() => markAllAsRead()}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Notifications list */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                <Bell className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    {...notification}
                    onClick={() =>
                      handleNotificationClick(
                        notification.id,
                        notification.isRead,
                        notification.type,
                        notification.tripId,
                        notification.bookingId
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer - View all */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button
                className="w-full text-center text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 font-medium"
                onClick={() => {
                  setIsOpen(false)
                  router.push("/notifications")
                }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

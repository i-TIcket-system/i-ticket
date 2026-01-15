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
  /** When true, dropdown opens to the right (for sidebar placement) */
  sidebarMode?: boolean
}

/**
 * Get navigation URL based on notification type and user role
 * Routes users to their own portal's trip page, not cross-role pages
 */
function getNotificationUrl(
  type: string,
  tripId: string | null | undefined,
  bookingId: string | null | undefined,
  workOrderId: string | null | undefined,
  userRole: string | undefined,
  staffRole: string | null | undefined
): string | null {
  // Trip-related notifications - route to user's own trip page
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
    // Cashiers (COMPANY_ADMIN with staffRole=MANUAL_TICKETER) → their cashier trip page
    if (staffRole === "MANUAL_TICKETER") {
      return `/cashier/trip/${tripId}`
    }
    // Drivers/Conductors (COMPANY_ADMIN with staffRole) → staff my-trips
    if (staffRole === "DRIVER" || staffRole === "CONDUCTOR") {
      return "/staff/my-trips"
    }
    // Company Admin (manager, no staffRole) → company trip detail
    if (userRole === "COMPANY_ADMIN" && !staffRole) {
      return `/company/trips/${tripId}`
    }
    // Super Admin → their admin dashboard (no access to company trip pages)
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
    // Customers → their ticket detail
    if (userRole === "CUSTOMER" && bookingId) {
      return `/tickets/${bookingId}`
    }
    // Cashiers → their cashier dashboard
    if (staffRole === "MANUAL_TICKETER") {
      return "/cashier"
    }
    // Drivers/Conductors → staff my-trips
    if (staffRole === "DRIVER" || staffRole === "CONDUCTOR") {
      return "/staff/my-trips"
    }
    // Company Admin (manager) → company trip detail
    if (userRole === "COMPANY_ADMIN" && !staffRole && tripId) {
      return `/company/trips/${tripId}`
    }
    // Super Admin → admin dashboard
    if (userRole === "SUPER_ADMIN") {
      return "/admin/dashboard"
    }
    return null
  }

  // Work Order notifications
  if (
    [
      "WORK_ORDER_CREATED",
      "WORK_ORDER_ASSIGNED",
      "WORK_ORDER_STATUS_CHANGED",
      "WORK_ORDER_MESSAGE",
      "WORK_ORDER_COMPLETED",
      "WORK_ORDER_URGENT",
    ].includes(type) &&
    workOrderId
  ) {
    // Mechanic → mechanic work order detail
    if (staffRole === "MECHANIC") {
      return `/mechanic/work-order/${workOrderId}`
    }
    // Finance staff → finance work order detail
    if (staffRole === "FINANCE") {
      return `/finance/work-orders/${workOrderId}`
    }
    // Company Admin (manager, no staffRole) → company work order detail
    if (userRole === "COMPANY_ADMIN" && !staffRole) {
      return `/company/work-orders/${workOrderId}`
    }
    // Driver/Conductor → company work order (they can view but not assigned portal-specific page)
    if (staffRole === "DRIVER" || staffRole === "CONDUCTOR") {
      return `/company/work-orders/${workOrderId}`
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
  sidebarMode = false,
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
    bookingId?: string | null,
    metadata?: Record<string, unknown> | null
  ) => {
    // Mark as read
    if (!isRead) {
      await markAsRead(notificationId)
    }

    // Extract workOrderId from metadata if present
    const workOrderId = metadata?.workOrderId as string | undefined

    // Navigate to relevant page based on role and staffRole
    const url = getNotificationUrl(
      type,
      tripId,
      bookingId,
      workOrderId,
      session?.user?.role,
      session?.user?.staffRole
    )
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
            "absolute bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-[100]",
            "animate-in fade-in-0 zoom-in-95 duration-200",
            sidebarMode
              ? "left-full top-0 ml-2 w-80" // Opens to the right of bell in sidebar
              : "right-0 mt-2 w-80 sm:w-96" // Opens below bell in navbar
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
                        notification.bookingId,
                        notification.metadata
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

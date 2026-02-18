"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGroupedNotifications, NotificationFilter } from "@/hooks/use-grouped-notifications"
import { NotificationGroupItem } from "./NotificationGroupItem"
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
    // Drivers/Conductors (COMPANY_ADMIN with staffRole) → staff my-trips with tripId to auto-expand
    if (staffRole === "DRIVER" || staffRole === "CONDUCTOR") {
      // For trip messages, include tripId so the page can auto-expand that trip's chat
      if (type === "TRIP_MESSAGE") {
        return `/staff/my-trips?tripId=${tripId}`
      }
      return "/staff/my-trips"
    }
    // Company Admin (manager, no staffRole OR staffRole=ADMIN) → company trip detail
    if (userRole === "COMPANY_ADMIN" && (!staffRole || staffRole === "ADMIN")) {
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
    // Company Admin (manager, no staffRole OR staffRole=ADMIN) → company trip detail
    if (userRole === "COMPANY_ADMIN" && (!staffRole || staffRole === "ADMIN") && tripId) {
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
      "WORK_ORDER_PARTS_REQUESTED",
      "WORK_ORDER_BLOCKED",
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
    // Company Admin (manager, no staffRole OR staffRole=ADMIN) → company work order detail
    if (userRole === "COMPANY_ADMIN" && (!staffRole || staffRole === "ADMIN")) {
      return `/company/work-orders/${workOrderId}`
    }
    // Driver/Conductor → staff work orders detail page (BUG FIX)
    if (staffRole === "DRIVER" || staffRole === "CONDUCTOR") {
      return `/staff/work-orders/${workOrderId}`
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

  // Manifest auto-generation notifications
  if (type === "MANIFEST_AUTO_GENERATED" && tripId) {
    if (userRole === "COMPANY_ADMIN" && (!staffRole || staffRole === "ADMIN")) {
      return `/company/trips/${tripId}`
    }
    if (userRole === "SUPER_ADMIN") return "/admin/trips"
  }

  // System alerts
  if (type === "SYSTEM_ALERT") {
    if (userRole === "SUPER_ADMIN") return "/admin/dashboard"
    if (userRole === "COMPANY_ADMIN") return "/company/dashboard"
  }

  // Fallback: any notification with tripId routes to trip page
  if (tripId) {
    if (userRole === "COMPANY_ADMIN" && (!staffRole || staffRole === "ADMIN")) {
      return `/company/trips/${tripId}`
    }
    if (userRole === "SUPER_ADMIN") {
      return "/admin/trips"
    }
  }

  // Fallback: any notification with bookingId
  if (bookingId) {
    if (userRole === "CUSTOMER") return `/tickets/${bookingId}`
    if (userRole === "COMPANY_ADMIN") return "/company/trips"
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
    groups,
    unreadCount,
    urgentCount,
    filter,
    isLoading,
    fetchGroupedNotifications,
    setFilter,
    toggleGroup,
    markAsRead,
    markAllAsRead,
  } = useGroupedNotifications()

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
      fetchGroupedNotifications()
    }
  }, [isOpen, fetchGroupedNotifications])

  const handleNotificationClick = async (
    notificationId: string,
    isGroupHeader: boolean,
    isRead: boolean
  ) => {
    // Mark as read (group header or individual notification)
    if (!isRead) {
      await markAsRead(notificationId, isGroupHeader)
    }

    // Find the notification to get its details
    const group = groups.find((g) => {
      if (g.header.id === notificationId) return true
      return g.children.some((c) => c.id === notificationId)
    })

    if (!group) return

    const notification = group.header.id === notificationId
      ? group.header
      : group.children.find((c) => c.id === notificationId)

    if (!notification) return

    // Extract workOrderId from metadata if present
    const metadata = typeof group.header.metadata === 'string'
      ? JSON.parse(group.header.metadata || '{}')
      : group.header.metadata || {}
    const workOrderId = metadata.workOrderId as string | undefined

    // Navigate to relevant page
    const url = getNotificationUrl(
      notification.type || group.header.type,
      notification.tripId || group.header.tripId,
      notification.bookingId || group.header.bookingId,
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
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between mb-3">
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

            {/* Filter Tabs */}
            <div className="flex gap-1 bg-white dark:bg-gray-900 rounded-md p-1">
              <button
                onClick={() => setFilter("all")}
                className={cn(
                  "flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors",
                  filter === "all"
                    ? "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                )}
              >
                All
              </button>
              <button
                onClick={() => setFilter("urgent")}
                className={cn(
                  "flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors",
                  filter === "urgent"
                    ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                )}
              >
                🚨 Urgent {urgentCount > 0 && `(${urgentCount})`}
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={cn(
                  "flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors",
                  filter === "unread"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                )}
              >
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <div className="max-h-[500px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
              </div>
            ) : groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                <Bell className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">
                  {filter === "urgent" ? "No urgent notifications" : filter === "unread" ? "No unread notifications" : "No notifications"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {groups.map((group) => (
                  <NotificationGroupItem
                    key={group.header.id}
                    group={group}
                    onToggle={() => toggleGroup(group.header.id)}
                    onNotificationClick={handleNotificationClick}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer - View all */}
          {groups.length > 0 && (
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

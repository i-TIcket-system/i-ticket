"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Bell,
  CheckCheck,
  Loader2,
  ArrowLeft,
  Filter,
  Bus,
  MessageSquare,
  Ticket,
  AlertTriangle,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wrench,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  tripId?: string | null
  bookingId?: string | null
  companyId?: string | null
  metadata?: Record<string, unknown> | null
  isRead: boolean
  readAt?: string | null
  priority: number
  createdAt: string
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
  WORK_ORDER_CREATED: Wrench,
  WORK_ORDER_ASSIGNED: Wrench,
  WORK_ORDER_URGENT: AlertTriangle,
  WORK_ORDER_COMPLETED: CheckCircle,
  WORK_ORDER_BLOCKED: AlertCircle,
}

const priorityColors: Record<number, string> = {
  1: "border-l-gray-400",
  2: "border-l-blue-500",
  3: "border-l-yellow-500",
  4: "border-l-red-500",
}

const priorityLabels: Record<number, string> = {
  1: "Low",
  2: "Normal",
  3: "High",
  4: "Urgent",
}

function getNotificationUrl(
  type: string,
  tripId: string | null | undefined,
  bookingId: string | null | undefined,
  userRole: string | undefined,
  staffRole: string | null | undefined,
  metadata?: Record<string, unknown> | null
): string | null {
  // Work Order notifications
  if (type.startsWith("WORK_ORDER_") && metadata?.workOrderId) {
    const workOrderId = metadata.workOrderId as string
    // Mechanic → their mechanic work order page
    if (staffRole === "MECHANIC") return `/mechanic/work-order/${workOrderId}`
    // Company Admin (manager, no staffRole) → company work orders detail
    if (userRole === "COMPANY_ADMIN" && !staffRole) return `/company/work-orders/${workOrderId}`
    // Finance staff → finance work orders page
    if (staffRole === "FINANCE") return "/finance/work-orders"
    // BUG FIX v2.10.5: Drivers/Conductors → staff work orders detail page
    if (staffRole === "DRIVER" || staffRole === "CONDUCTOR") return `/staff/work-orders/${workOrderId}`
    // Super Admin → admin dashboard
    if (userRole === "SUPER_ADMIN") return "/admin/dashboard"
  }

  // Trip-related notifications - route to user's own trip page
  if (
    ["TRIP_ASSIGNED", "TRIP_UNASSIGNED", "TRIP_MESSAGE", "TRIP_HALTED", "TRIP_AUTO_HALTED", "TRIP_RESUMED", "LOW_SLOT_ALERT"].includes(type) &&
    tripId
  ) {
    // Cashiers → their cashier trip page
    if (staffRole === "MANUAL_TICKETER") return `/cashier/trip/${tripId}`
    // Drivers/Conductors → staff my-trips
    if (staffRole === "DRIVER" || staffRole === "CONDUCTOR") return "/staff/my-trips"
    // Company Admin (manager, no staffRole) → company trip detail
    if (userRole === "COMPANY_ADMIN" && !staffRole) return `/company/trips/${tripId}`
    // Super Admin → admin dashboard
    if (userRole === "SUPER_ADMIN") return "/admin/dashboard"
  }

  // Booking-related notifications
  if (["BOOKING_NEW", "BOOKING_PAID", "BOOKING_CONFIRMED", "BOOKING_CANCELLED"].includes(type)) {
    if (userRole === "CUSTOMER" && bookingId) return `/tickets/${bookingId}`
    if (staffRole === "MANUAL_TICKETER") return "/cashier"
    if (staffRole === "DRIVER" || staffRole === "CONDUCTOR") return "/staff/my-trips"
    if (userRole === "COMPANY_ADMIN" && !staffRole && tripId) return `/company/trips/${tripId}`
    if (userRole === "SUPER_ADMIN") return "/admin/dashboard"
  }

  // Sales-related notifications
  if (["COMMISSION_EARNED", "REFERRAL_NEW", "PAYOUT_PROCESSED"].includes(type)) {
    if (userRole === "SALES_PERSON") {
      if (type === "COMMISSION_EARNED") return "/sales/commissions"
      if (type === "REFERRAL_NEW") return "/sales/referrals"
      return "/sales/dashboard"
    }
  }

  return null
}

export default function NotificationsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  const fetchNotifications = useCallback(async (offset = 0, append = false) => {
    try {
      if (offset === 0) setLoading(true)
      else setLoadingMore(true)

      const params = new URLSearchParams({
        limit: "20",
        offset: offset.toString(),
        ...(filter === "unread" ? { unreadOnly: "true" } : {}),
      })

      const response = await fetch(`/api/notifications?${params}`)
      const data = await response.json()

      if (response.ok) {
        if (append) {
          setNotifications((prev) => [...prev, ...data.notifications])
        } else {
          setNotifications(data.notifications)
        }
        setHasMore(data.hasMore)
        setTotal(data.total)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filter])

  useEffect(() => {
    if (status === "authenticated") {
      fetchNotifications()
    }
  }, [status, fetchNotifications])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, router])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
        )
      }
    } catch (error) {
      console.error("Failed to mark as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        )
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id)
    }

    // For work order notifications, verify the work order exists before routing
    if (notification.type.startsWith("WORK_ORDER_") && notification.metadata?.workOrderId) {
      try {
        const woId = notification.metadata.workOrderId as string
        const response = await fetch(`/api/work-orders/${woId}/exists`)
        const data = await response.json()

        if (!data.exists) {
          toast.error("This work order no longer exists")
          return
        }
      } catch (error) {
        console.error("Failed to verify work order:", error)
        // Continue anyway - better to route and get 404 than block the user
      }
    }

    const url = getNotificationUrl(
      notification.type,
      notification.tripId,
      notification.bookingId,
      session?.user?.role,
      session?.user?.staffRole,
      notification.metadata
    )

    if (url) {
      router.push(url)
    }
  }

  const loadMore = () => {
    fetchNotifications(notifications.length, true)
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500">
              {total} total{unreadCount > 0 && `, ${unreadCount} unread`}
            </p>
          </div>
        </div>

        {/* Actions */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-teal-600 border-teal-200 hover:bg-teal-50"
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all as read
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-teal-600" />
              {filter === "unread" ? "Unread Notifications" : "All Notifications"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Bell className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-lg font-medium">No notifications</p>
                <p className="text-sm">
                  {filter === "unread"
                    ? "You're all caught up!"
                    : "You don't have any notifications yet."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const Icon = typeIcons[notification.type] || Bell
                  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                  })

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-4 p-4 border-l-4 transition-colors cursor-pointer",
                        priorityColors[notification.priority] || "border-l-gray-400",
                        notification.isRead
                          ? "bg-white hover:bg-gray-50"
                          : "bg-blue-50 hover:bg-blue-100"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          "flex-shrink-0 p-2.5 rounded-full",
                          notification.priority >= 3
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p
                              className={cn(
                                "font-medium",
                                !notification.isRead && "text-gray-900"
                              )}
                            >
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-0.5">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <span className="flex-shrink-0 w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5" />
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-500">{timeAgo}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              notification.priority >= 3
                                ? "border-yellow-300 text-yellow-700"
                                : "border-gray-200 text-gray-500"
                            )}
                          >
                            {priorityLabels[notification.priority] || "Normal"}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {notification.type.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Load More */}
            {hasMore && (
              <div className="p-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    `Load more (${total - notifications.length} remaining)`
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

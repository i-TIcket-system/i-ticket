"use client"

import { useState, useEffect, useCallback, useRef } from "react"

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
  expiresAt?: string | null
}

interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  urgentCount: number
  isLoading: boolean
  error: string | null
}

interface UseNotificationsOptions {
  pollingInterval?: number // in milliseconds, default 15000 (15s)
  enabled?: boolean
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { pollingInterval = 15000, enabled = true } = options

  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    unreadCount: 0,
    urgentCount: 0,
    isLoading: true,
    error: null,
  })

  const isVisibleRef = useRef(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch unread count (lightweight)
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/count")
      if (response.ok) {
        const data = await response.json()
        setState((prev) => ({
          ...prev,
          unreadCount: data.unreadCount,
          urgentCount: data.urgentCount,
        }))
      }
    } catch (error) {
      console.error("Failed to fetch notification count:", error)
    }
  }, [])

  // Fetch full notifications list
  const fetchNotifications = useCallback(async (limit = 20) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await fetch(`/api/notifications?limit=${limit}`)
      if (response.ok) {
        const data = await response.json()
        setState((prev) => ({
          ...prev,
          notifications: data.notifications,
          isLoading: false,
        }))
        // Also update count
        await fetchUnreadCount()
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Failed to fetch notifications",
        }))
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Network error",
      }))
    }
  }, [fetchUnreadCount])

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    // Optimistic update
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      ),
      unreadCount: Math.max(0, prev.unreadCount - 1),
    }))

    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      })

      if (!response.ok) {
        // Revert optimistic update on failure
        await fetchNotifications()
      }
    } catch (error) {
      // Revert on error
      await fetchNotifications()
    }
  }, [fetchNotifications])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({
        ...n,
        isRead: true,
        readAt: new Date().toISOString(),
      })),
      unreadCount: 0,
      urgentCount: 0,
    }))

    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      })

      if (!response.ok) {
        // Revert on failure
        await fetchNotifications()
      }
    } catch (error) {
      // Revert on error
      await fetchNotifications()
    }
  }, [fetchNotifications])

  // Handle visibility change (pause polling when tab is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden

      if (!document.hidden && enabled) {
        // Tab became visible, fetch immediately
        fetchUnreadCount()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [enabled, fetchUnreadCount])

  // Set up polling
  useEffect(() => {
    if (!enabled) return

    // Initial fetch
    fetchUnreadCount()

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      // Only poll if tab is visible
      if (isVisibleRef.current) {
        fetchUnreadCount()
      }
    }, pollingInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, pollingInterval, fetchUnreadCount])

  return {
    ...state,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  }
}

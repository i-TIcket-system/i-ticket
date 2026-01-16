"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export interface NotificationChild {
  id: string
  type: string
  message: string
  priority: number
  isRead: boolean
  createdAt: string
  tripId?: string | null
  bookingId?: string | null
  metadata?: Record<string, unknown> | null
}

export interface NotificationGroupHeader {
  id: string
  type: string
  title: string
  message: string
  priority: number
  groupKey?: string | null
  groupType?: string | null
  isGroupHeader: boolean
  childCount: number
  unreadChildCount: number
  isRead: boolean
  createdAt: string
  updatedAt: string
  tripId?: string | null
  bookingId?: string | null
  metadata?: string | null
}

export interface NotificationGroup {
  header: NotificationGroupHeader
  children: NotificationChild[]
  expanded: boolean
}

export type NotificationFilter = "all" | "urgent" | "unread"

interface GroupedNotificationsState {
  groups: NotificationGroup[]
  unreadCount: number
  urgentCount: number
  filter: NotificationFilter
  isLoading: boolean
  error: string | null
}

interface UseGroupedNotificationsOptions {
  pollingInterval?: number // in milliseconds, default 15000 (15s)
  enabled?: boolean
  initialFilter?: NotificationFilter
}

export function useGroupedNotifications(options: UseGroupedNotificationsOptions = {}) {
  const { pollingInterval = 15000, enabled = true, initialFilter = "all" } = options

  const [state, setState] = useState<GroupedNotificationsState>({
    groups: [],
    unreadCount: 0,
    urgentCount: 0,
    filter: initialFilter,
    isLoading: true,
    error: null,
  })

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

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

  // Fetch grouped notifications
  const fetchGroupedNotifications = useCallback(
    async (filter: NotificationFilter = state.filter, limit = 50) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
      try {
        const response = await fetch(`/api/notifications/grouped?filter=${filter}&limit=${limit}`)
        if (response.ok) {
          const data = await response.json()
          setState((prev) => ({
            ...prev,
            groups: data.groups.map((group: NotificationGroup) => ({
              ...group,
              expanded: expandedGroups.has(group.header.id),
            })),
            unreadCount: data.unreadCount,
            urgentCount: data.urgentCount,
            filter: data.filter,
            isLoading: false,
          }))
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
    },
    [state.filter, expandedGroups]
  )

  // Change filter
  const setFilter = useCallback(
    (filter: NotificationFilter) => {
      setState((prev) => ({ ...prev, filter }))
      fetchGroupedNotifications(filter)
    },
    [fetchGroupedNotifications]
  )

  // Toggle group expansion
  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })

    // Update state to reflect expansion
    setState((prev) => ({
      ...prev,
      groups: prev.groups.map((group) =>
        group.header.id === groupId ? { ...group, expanded: !group.expanded } : group
      ),
    }))
  }, [])

  // Mark single notification as read
  const markAsRead = useCallback(
    async (notificationId: string, markGroupAsRead = false) => {
      // Optimistic update
      if (markGroupAsRead) {
        // Mark entire group as read
        setState((prev) => ({
          ...prev,
          groups: prev.groups.map((group) =>
            group.header.id === notificationId
              ? {
                  ...group,
                  header: { ...group.header, isRead: true, unreadChildCount: 0 },
                  children: group.children.map((child) => ({ ...child, isRead: true })),
                }
              : group
          ),
        }))
      } else {
        // Mark single notification as read
        setState((prev) => ({
          ...prev,
          groups: prev.groups.map((group) => {
            if (group.header.id === notificationId) {
              return { ...group, header: { ...group.header, isRead: true } }
            }
            // Check if it's a child notification
            const childIndex = group.children.findIndex((c) => c.id === notificationId)
            if (childIndex !== -1) {
              const updatedChildren = [...group.children]
              updatedChildren[childIndex] = { ...updatedChildren[childIndex], isRead: true }
              return {
                ...group,
                children: updatedChildren,
                header: {
                  ...group.header,
                  unreadChildCount: Math.max(0, group.header.unreadChildCount - 1),
                },
              }
            }
            return group
          }),
        }))
      }

      try {
        const response = await fetch("/api/notifications/grouped", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId, markGroupAsRead }),
        })

        if (!response.ok) {
          // Revert optimistic update on failure
          await fetchGroupedNotifications()
        } else {
          // Update counts
          await fetchUnreadCount()
        }
      } catch (error) {
        // Revert on error
        await fetchGroupedNotifications()
      }
    },
    [fetchGroupedNotifications, fetchUnreadCount]
  )

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setState((prev) => ({
      ...prev,
      groups: prev.groups.map((group) => ({
        ...group,
        header: { ...group.header, isRead: true, unreadChildCount: 0 },
        children: group.children.map((child) => ({ ...child, isRead: true })),
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
        await fetchGroupedNotifications()
      }
    } catch (error) {
      // Revert on error
      await fetchGroupedNotifications()
    }
  }, [fetchGroupedNotifications])

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
    expandedGroups,
    fetchGroupedNotifications,
    fetchUnreadCount,
    setFilter,
    toggleGroup,
    markAsRead,
    markAllAsRead,
    refetch: fetchGroupedNotifications,
  }
}

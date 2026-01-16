"use client"

import { useState } from "react"
import { ChevronDown, Bell, MessageSquare, Wrench, Users, Settings, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { NotificationGroup, NotificationChild } from "@/hooks/use-grouped-notifications"

interface NotificationGroupItemProps {
  group: NotificationGroup
  onToggle: () => void
  onNotificationClick: (notificationId: string, isGroupHeader: boolean, isRead: boolean) => void
}

function getPriorityColor(priority: number): string {
  switch (priority) {
    case 4:
      return "text-red-600 dark:text-red-400"
    case 3:
      return "text-orange-600 dark:text-orange-400"
    case 2:
      return "text-blue-600 dark:text-blue-400"
    case 1:
      return "text-gray-500 dark:text-gray-400"
    default:
      return "text-blue-600 dark:text-blue-400"
  }
}

function getPriorityBadgeColor(priority: number): string {
  switch (priority) {
    case 4:
      return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
    case 3:
      return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
    case 2:
      return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
    case 1:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    default:
      return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
  }
}

function getGroupIcon(groupType?: string | null): JSX.Element {
  switch (groupType) {
    case "TRIP":
      return <Bell className="h-4 w-4" />
    case "WORK_ORDER":
      return <Wrench className="h-4 w-4" />
    case "STAFF":
      return <Users className="h-4 w-4" />
    case "SYSTEM":
      return <Settings className="h-4 w-4" />
    default:
      return <Bell className="h-4 w-4" />
  }
}

function getNotificationIcon(type: string): JSX.Element {
  if (type.includes("MESSAGE")) {
    return <MessageSquare className="h-3.5 w-3.5" />
  }
  if (type.includes("ALERT") || type.includes("WARNING")) {
    return <AlertCircle className="h-3.5 w-3.5" />
  }
  if (type.includes("WORK_ORDER")) {
    return <Wrench className="h-3.5 w-3.5" />
  }
  return <Bell className="h-3.5 w-3.5" />
}

export function NotificationGroupItem({ group, onToggle, onNotificationClick }: NotificationGroupItemProps) {
  const { header, children, expanded } = group
  const hasUnread = !header.isRead || header.unreadChildCount > 0

  const handleGroupHeaderClick = () => {
    if (header.isGroupHeader && children.length > 0) {
      onToggle()
    } else {
      // Standalone notification, just mark as read and navigate
      onNotificationClick(header.id, false, header.isRead)
    }
  }

  const handleChildClick = (child: NotificationChild) => {
    onNotificationClick(child.id, false, child.isRead)
  }

  return (
    <div className="group/item">
      {/* Group Header */}
      <button
        onClick={handleGroupHeaderClick}
        className={cn(
          "w-full flex items-start gap-3 p-3 text-left transition-colors",
          hasUnread
            ? "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50"
            : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
        )}
      >
        {/* Icon */}
        <div className={cn("flex-shrink-0 mt-0.5", getPriorityColor(header.priority))}>
          {getGroupIcon(header.groupType)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                "text-sm truncate",
                hasUnread ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
              )}
            >
              {header.title}
            </p>

            {/* Badge for child count */}
            {header.isGroupHeader && header.childCount > 0 && (
              <Badge variant={hasUnread ? "default" : "secondary"} className="text-xs flex-shrink-0">
                {header.childCount}
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{header.message}</p>

          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(header.updatedAt), { addSuffix: true })}
            </p>

            {/* Priority badge for urgent notifications */}
            {header.priority >= 3 && (
              <Badge className={cn("text-xs", getPriorityBadgeColor(header.priority))}>
                {header.priority === 4 ? "Urgent" : "High"}
              </Badge>
            )}
          </div>
        </div>

        {/* Expand/Collapse Icon */}
        {header.isGroupHeader && children.length > 0 && (
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 mt-1",
              expanded && "rotate-180"
            )}
          />
        )}

        {/* Unread indicator */}
        {hasUnread && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />}
      </button>

      {/* Child Notifications - Expandable */}
      {expanded && children.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900/50 border-l-2 border-blue-500 ml-6">
          {children.map((child, index) => (
            <button
              key={child.id}
              onClick={() => handleChildClick(child)}
              className={cn(
                "w-full flex items-start gap-2 p-3 text-left transition-colors",
                index !== children.length - 1 && "border-b border-gray-200 dark:border-gray-700",
                !child.isRead
                  ? "bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-950/30"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              {/* Icon */}
              <div className={cn("flex-shrink-0 mt-0.5", getPriorityColor(child.priority))}>
                {getNotificationIcon(child.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm", !child.isRead ? "text-foreground" : "text-muted-foreground")}>
                  {child.message}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(child.createdAt), { addSuffix: true })}
                </p>
              </div>

              {/* Unread indicator */}
              {!child.isRead && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

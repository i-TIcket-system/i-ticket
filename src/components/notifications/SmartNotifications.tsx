/**
 * TIER 4 - SMART NOTIFICATIONS
 * Intelligent notification center with preferences and grouping
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Bell,
  BellOff,
  Check,
  X,
  Settings,
  Clock,
  Calendar,
  AlertCircle,
  Info,
  CheckCircle2,
  XCircle,
  Filter,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/**
 * Notification Type
 */
export type NotificationType =
  | 'TRIP_REMINDER'
  | 'BOOKING_CONFIRMATION'
  | 'PAYMENT_SUCCESS'
  | 'TRIP_CANCELLED'
  | 'TRIP_DELAYED'
  | 'SEAT_CHANGED'
  | 'PRICE_DROP'
  | 'SYSTEM'

/**
 * Notification Priority
 */
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

/**
 * Notification Item
 */
export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
  isRead: boolean
  createdAt: Date
  actionUrl?: string
  actionLabel?: string
}

/**
 * Notification Icon and Color
 */
const NOTIFICATION_CONFIG: Record<
  NotificationType,
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  TRIP_REMINDER: { icon: Calendar, color: 'text-blue-600' },
  BOOKING_CONFIRMATION: { icon: CheckCircle2, color: 'text-green-600' },
  PAYMENT_SUCCESS: { icon: CheckCircle2, color: 'text-green-600' },
  TRIP_CANCELLED: { icon: XCircle, color: 'text-red-600' },
  TRIP_DELAYED: { icon: AlertCircle, color: 'text-orange-600' },
  SEAT_CHANGED: { icon: Info, color: 'text-blue-600' },
  PRICE_DROP: { icon: CheckCircle2, color: 'text-green-600' },
  SYSTEM: { icon: Info, color: 'text-gray-600' },
}

/**
 * Single Notification Card
 */
export function NotificationCard({
  notification,
  onRead,
  onDelete,
  onAction,
}: {
  notification: NotificationItem
  onRead: (id: string) => void
  onDelete: (id: string) => void
  onAction?: (url: string) => void
}) {
  const { icon: Icon, color } = NOTIFICATION_CONFIG[notification.type]

  const priorityColors = {
    low: 'border-gray-300 dark:border-gray-700',
    medium: 'border-blue-300 dark:border-blue-700',
    high: 'border-orange-300 dark:border-orange-700',
    urgent: 'border-red-300 dark:border-red-700 animate-glow-pulse',
  }

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  return (
    <Card
      className={cn(
        'p-4 transition-all duration-200 group',
        !notification.isRead && 'bg-primary/5 border-l-4',
        !notification.isRead && priorityColors[notification.priority],
        notification.isRead && 'opacity-60 hover:opacity-100'
      )}
    >
      <div className="flex gap-4">
        {/* Icon */}
        <div className={cn('flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center', !notification.isRead ? 'bg-primary/10' : 'bg-muted')}>
          <Icon className={cn('h-5 w-5', notification.isRead ? 'text-muted-foreground' : color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn('font-semibold text-sm', !notification.isRead && 'text-foreground')}>
              {notification.title}
            </h4>
            <div className="flex items-center gap-1">
              {!notification.isRead && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRead(notification.id)}
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                onClick={() => onDelete(notification.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {timeAgo(notification.createdAt)}
            </div>

            {notification.actionUrl && notification.actionLabel && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => onAction?.(notification.actionUrl!)}
              >
                {notification.actionLabel} →
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

/**
 * Notification Bell Icon with Badge
 */
export function NotificationBellIcon({
  unreadCount,
  onClick,
}: {
  unreadCount: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-full hover:bg-muted transition-colors"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center animate-pop">
          <span className="text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </div>
      )}
    </button>
  )
}

/**
 * Notification Center Dropdown
 */
export function NotificationCenter({
  notifications,
  isOpen,
  onClose,
  onReadAll,
  onDeleteAll,
  onRead,
  onDelete,
  onAction,
  onOpenSettings,
}: {
  notifications: NotificationItem[]
  isOpen: boolean
  onClose: () => void
  onReadAll: () => void
  onDeleteAll: () => void
  onRead: (id: string) => void
  onDelete: (id: string) => void
  onAction?: (url: string) => void
  onOpenSettings: () => void
}) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filtered = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications
  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount} new
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Stay updated with your bookings and trips
              </DialogDescription>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onOpenSettings}>
                <Settings className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setFilter('all')}>
                    <Check className={cn('h-4 w-4 mr-2', filter !== 'all' && 'invisible')} />
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('unread')}>
                    <Check className={cn('h-4 w-4 mr-2', filter !== 'unread' && 'invisible')} />
                    Unread
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onReadAll} disabled={unreadCount === 0}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark all as read
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDeleteAll} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear all
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </DialogHeader>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No notifications</h3>
              <p className="text-sm text-muted-foreground">
                {filter === 'unread' ? "You're all caught up!" : "You don't have any notifications yet."}
              </p>
            </div>
          )}

          {filtered.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onRead={onRead}
              onDelete={onDelete}
              onAction={onAction}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Notification Preferences Dialog
 */
export function NotificationPreferences({
  isOpen,
  onClose,
  preferences,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  preferences: Record<NotificationType, boolean>
  onSave: (preferences: Record<NotificationType, boolean>) => void
}) {
  const [localPrefs, setLocalPrefs] = useState(preferences)

  const notificationTypes: Array<{
    type: NotificationType
    label: string
    description: string
  }> = [
    {
      type: 'TRIP_REMINDER',
      label: 'Trip Reminders',
      description: 'Get notified before your upcoming trips',
    },
    {
      type: 'BOOKING_CONFIRMATION',
      label: 'Booking Confirmations',
      description: 'Receive confirmation when you book a trip',
    },
    {
      type: 'PAYMENT_SUCCESS',
      label: 'Payment Confirmations',
      description: 'Get notified when payments are processed',
    },
    {
      type: 'TRIP_CANCELLED',
      label: 'Trip Cancellations',
      description: 'Important alerts for cancelled trips',
    },
    {
      type: 'TRIP_DELAYED',
      label: 'Trip Delays',
      description: 'Get notified about delays and changes',
    },
    {
      type: 'SEAT_CHANGED',
      label: 'Seat Changes',
      description: 'Alerts when your seat assignment changes',
    },
    {
      type: 'PRICE_DROP',
      label: 'Price Drops',
      description: 'Get notified when prices drop on saved routes',
    },
    {
      type: 'SYSTEM',
      label: 'System Notifications',
      description: 'Platform updates and announcements',
    },
  ]

  const handleSave = () => {
    onSave(localPrefs)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Notification Preferences
          </DialogTitle>
          <DialogDescription>
            Choose which notifications you want to receive
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {notificationTypes.map(({ type, label, description }) => (
            <div key={type} className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <Switch
                checked={localPrefs[type]}
                onCheckedChange={(checked) =>
                  setLocalPrefs(prev => ({ ...prev, [type]: checked }))
                }
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Preferences</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Toast Notification
 * Temporary notification that appears and disappears
 */
export function ToastNotification({
  notification,
  onDismiss,
  duration = 5000,
}: {
  notification: NotificationItem
  onDismiss: () => void
  duration?: number
}) {
  const { icon: Icon, color } = NOTIFICATION_CONFIG[notification.type]

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onDismiss])

  return (
    <Card className="fixed bottom-6 right-6 z-50 p-4 shadow-2xl max-w-md animate-slide-up">
      <div className="flex gap-3">
        <div className={cn('flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-primary/10')}>
          <Icon className={cn('h-4 w-4', color)} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">{notification.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDismiss}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  )
}

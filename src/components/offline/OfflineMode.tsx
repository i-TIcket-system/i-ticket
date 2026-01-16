/**
 * TIER 4 - OFFLINE MODE
 * Offline indicator and cached data management
 */

'use client'

import { useEffect, useState } from 'react'
import {
  WifiOff,
  Wifi,
  Download,
  Trash2,
  HardDrive,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/**
 * Offline Indicator Banner
 * Appears at top when user goes offline
 */
export function OfflineIndicator({
  isOnline,
  className,
}: {
  isOnline: boolean
  className?: string
}) {
  const [show, setShow] = useState(!isOnline)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setShow(true)
    } else {
      // Show "Back online" briefly, then hide
      setTimeout(() => setShow(false), 3000)
    }
  }, [isOnline])

  const handleRetry = async () => {
    setIsRetrying(true)
    // Try to fetch a small resource
    try {
      await fetch('/api/health', { method: 'HEAD' })
      // If successful, browser will update navigator.onLine
    } catch (error) {
      // Still offline
    } finally {
      setIsRetrying(false)
    }
  }

  if (!show) return null

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isOnline ? 'bg-green-500' : 'bg-orange-500',
        className
      )}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <>
                <Wifi className="h-5 w-5 text-white flex-shrink-0" />
                <div className="text-white">
                  <p className="font-semibold text-sm">Back online</p>
                  <p className="text-xs opacity-90">Your connection has been restored</p>
                </div>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-white flex-shrink-0 animate-pulse" />
                <div className="text-white">
                  <p className="font-semibold text-sm">You're offline</p>
                  <p className="text-xs opacity-90">Some features may not be available</p>
                </div>
              </>
            )}
          </div>

          {!isOnline && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRetry}
              disabled={isRetrying}
              className="gap-2"
            >
              <RefreshCw className={cn('h-3 w-3', isRetrying && 'animate-spin')} />
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Cached Content Item
 */
export interface CachedItem {
  id: string
  type: 'trip' | 'booking' | 'ticket' | 'route'
  title: string
  description: string
  cachedAt: Date
  size: number // in bytes
  expiresAt?: Date
}

/**
 * Offline Storage Manager
 * Shows cached data and allows management
 */
export function OfflineStorageManager({
  isOpen,
  onClose,
  cachedItems,
  onDeleteItem,
  onClearAll,
  onRefresh,
}: {
  isOpen: boolean
  onClose: () => void
  cachedItems: CachedItem[]
  onDeleteItem: (id: string) => void
  onClearAll: () => void
  onRefresh: () => void
}) {
  const totalSize = cachedItems.reduce((sum, item) => sum + item.size, 0)
  const maxSize = 50 * 1024 * 1024 // 50 MB
  const usagePercent = (totalSize / maxSize) * 100

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-primary" />
                Offline Storage
              </DialogTitle>
              <DialogDescription>
                Manage your cached data for offline access
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Storage Usage */}
        <div className="space-y-3 pb-4 border-b">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Storage used</span>
            <span className="font-semibold">
              {formatSize(totalSize)} / {formatSize(maxSize)}
            </span>
          </div>
          <Progress value={usagePercent} className="h-2" />
          {usagePercent > 80 && (
            <div className="flex items-center gap-2 text-xs text-orange-600">
              <AlertCircle className="h-3 w-3" />
              Storage is almost full. Consider clearing some cached data.
            </div>
          )}
        </div>

        {/* Cached Items List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {cachedItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <HardDrive className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No cached data</h3>
              <p className="text-sm text-muted-foreground">
                Bookings and trips will be automatically cached for offline access
              </p>
            </div>
          )}

          {cachedItems.map((item) => {
            const isExpired = item.expiresAt && item.expiresAt < new Date()

            return (
              <Card key={item.id} className="p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center',
                      isExpired ? 'bg-orange-100 dark:bg-orange-950' : 'bg-primary/10'
                    )}>
                      {item.type === 'trip' && <Download className="h-5 w-5 text-primary" />}
                      {item.type === 'booking' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                      {item.type === 'ticket' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                      {item.type === 'route' && <Download className="h-5 w-5 text-primary" />}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm">{item.title}</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onDeleteItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Cached {formatDate(item.cachedAt)}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {formatSize(item.size)}
                      </Badge>
                      {isExpired && (
                        <Badge variant="destructive" className="text-xs">
                          Expired
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Actions */}
        {cachedItems.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {cachedItems.length} {cachedItems.length === 1 ? 'item' : 'items'} cached
            </p>
            <Button variant="destructive" onClick={onClearAll} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Offline Action Button
 * Downloads data for offline use
 */
export function OfflineDownloadButton({
  itemId,
  itemType,
  isDownloaded = false,
  onDownload,
  onRemove,
  className,
}: {
  itemId: string
  itemType: 'trip' | 'booking' | 'ticket'
  isDownloaded?: boolean
  onDownload: () => Promise<void>
  onRemove: () => Promise<void>
  className?: string
}) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      if (isDownloaded) {
        await onRemove()
      } else {
        await onDownload()
      }
    } catch (error) {
      console.error('Offline action failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={isDownloaded ? 'secondary' : 'outline'}
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className={cn('gap-2', className)}
    >
      {isLoading ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : isDownloaded ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          Available Offline
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Save for Offline
        </>
      )}
    </Button>
  )
}

/**
 * Offline Content Card
 * Shows content with offline indicator
 */
export function OfflineContentCard({
  title,
  description,
  isAvailableOffline = false,
  lastSynced,
  onSync,
  children,
  className,
}: {
  title: string
  description?: string
  isAvailableOffline?: boolean
  lastSynced?: Date
  onSync?: () => Promise<void>
  children: React.ReactNode
  className?: string
}) {
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    if (!onSync) return
    setIsSyncing(true)
    try {
      await onSync()
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>

          {isAvailableOffline && (
            <Badge variant="secondary" className="gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              Offline
            </Badge>
          )}
        </div>

        {/* Content */}
        <div>{children}</div>

        {/* Footer */}
        {lastSynced && (
          <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              Last synced {lastSynced.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
            {onSync && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className="gap-2"
              >
                <RefreshCw className={cn('h-3 w-3', isSyncing && 'animate-spin')} />
                Sync
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

/**
 * Offline Hook
 * Custom hook to detect online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Set initial status
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

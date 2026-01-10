'use client'

/**
 * GPX Download Button Component
 *
 * Downloads trip route as GPX file for offline navigation in OsmAnd/Google Maps.
 * Phase 1: GPS Telematics
 */

import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useState } from 'react'

interface GPXDownloadButtonProps {
  tripId: string
  tripName: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function GPXDownloadButton({
  tripId,
  tripName,
  variant = 'outline',
  size = 'default',
  className,
}: GPXDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)

    try {
      const response = await fetch(`/api/trips/${tripId}/export-gpx`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to download route')
      }

      // Get the blob
      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `iticket-${tripName.replace(/\s+/g, '-').toLowerCase()}.gpx`
      document.body.appendChild(a)
      a.click()

      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Route downloaded!', {
        description: 'Open the GPX file in OsmAnd or any GPS app',
        duration: 5000,
      })
    } catch (error: any) {
      console.error('GPX download error:', error)
      toast.error('Failed to download route', {
        description: error.message || 'An error occurred. Please try again.',
        duration: 5000,
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isDownloading}
      className={className}
    >
      {isDownloading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Downloading...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Download Route (GPX)
        </>
      )}
    </Button>
  )
}

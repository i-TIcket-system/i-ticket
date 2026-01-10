'use client'

/**
 * OsmAnd Deep Link Button Component
 *
 * Opens location in OsmAnd app with fallback to web/Google Maps.
 * Phase 1: GPS Telematics
 */

import { MapPin, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface OsmAndButtonProps {
  latitude: number
  longitude: number
  name: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showFallback?: boolean
  className?: string
}

export function OsmAndButton({
  latitude,
  longitude,
  name,
  variant = 'outline',
  size = 'default',
  showFallback = true,
  className,
}: OsmAndButtonProps) {
  const handleOpenInOsmAnd = () => {
    // OsmAnd deep link
    const osmandUrl = `osmandmaps://show?lat=${latitude}&lon=${longitude}&name=${encodeURIComponent(name)}`

    // Fallback URLs
    const osmandWebUrl = `https://osmand.net/go.html?lat=${latitude}&lon=${longitude}&z=17`
    const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`

    // Try to open OsmAnd app
    window.location.href = osmandUrl

    // Show fallback toast after 1.5 seconds if app didn't open
    if (showFallback) {
      setTimeout(() => {
        toast.info('OsmAnd app not found', {
          description: 'Opening in web browser instead',
          duration: 5000,
          action: {
            label: 'Google Maps',
            onClick: () => {
              window.open(googleMapsUrl, '_blank')
            },
          },
        })

        // Open web fallback
        window.open(osmandWebUrl, '_blank')
      }, 1500)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleOpenInOsmAnd}
      className={className}
    >
      <MapPin className="mr-2 h-4 w-4" />
      Open in OsmAnd
    </Button>
  )
}

/**
 * Compact Navigation Button (opens OsmAnd for navigation)
 * Useful for "Navigate to pickup location" scenarios
 */
export function NavigateButton({
  latitude,
  longitude,
  name,
  variant = 'default',
  size = 'sm',
  className,
}: OsmAndButtonProps) {
  const handleNavigate = () => {
    const osmandUrl = `osmandmaps://navigate?lat=${latitude}&lon=${longitude}&name=${encodeURIComponent(name)}`
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`

    // Try OsmAnd first
    window.location.href = osmandUrl

    // Fallback to Google Maps after delay
    setTimeout(() => {
      window.open(googleMapsUrl, '_blank')
    }, 1500)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleNavigate}
      className={className}
    >
      <Navigation className="mr-2 h-4 w-4" />
      Navigate
    </Button>
  )
}

/**
 * TIER 2 - SEAT SELECTION ENHANCEMENTS
 * Legend, zoom controls, tooltips, and visual indicators
 */

'use client'

import { useState } from 'react'
import { ZoomIn, ZoomOut, Maximize2, Square, CheckSquare, XSquare, Clock, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/**
 * Seat Type Legend
 * Shows what different seat types mean
 */
export function SeatTypeLegend({ className }: { className?: string }) {
  const legend = [
    {
      icon: CheckSquare,
      label: 'Available',
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-950',
      description: 'Select to book'
    },
    {
      icon: Square,
      label: 'Selected',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-950',
      description: 'Your selection'
    },
    {
      icon: XSquare,
      label: 'Occupied',
      color: 'text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-900',
      description: 'Already booked'
    },
    {
      icon: Clock,
      label: 'Reserved',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-950',
      description: 'Temporarily held'
    },
  ]

  return (
    <div className={cn('flex flex-wrap gap-4', className)}>
      {legend.map((item) => (
        <TooltipProvider key={item.label}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-help">
                <div className={cn('h-8 w-8 rounded flex items-center justify-center', item.bgColor)}>
                  <item.icon className={cn('h-5 w-5', item.color)} />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{item.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  )
}

/**
 * Seat Type Indicators
 * Visual badges for seat features
 */
export function SeatTypeIndicators({
  seatNumber,
  type,
  features = [],
}: {
  seatNumber: string
  type?: 'window' | 'aisle' | 'exit'
  features?: Array<'extra-legroom' | 'charging' | 'premium'>
}) {
  const typeConfig = {
    window: { label: 'Window', color: 'bg-blue-500', emoji: '🪟' },
    aisle: { label: 'Aisle', color: 'bg-green-500', emoji: '🚶' },
    exit: { label: 'Exit Row', color: 'bg-orange-500', emoji: '🚪' },
  }

  const featureConfig = {
    'extra-legroom': { label: 'Extra Legroom', emoji: '📏' },
    'charging': { label: 'Charging Port', emoji: '🔌' },
    'premium': { label: 'Premium', emoji: '⭐' },
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold">{seatNumber}</span>
        {type && (
          <Badge className={cn(typeConfig[type].color, 'text-white text-xs')}>
            {typeConfig[type].emoji} {typeConfig[type].label}
          </Badge>
        )}
      </div>
      {features.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {features.map((feature) => (
            <Badge key={feature} variant="outline" className="text-xs">
              {featureConfig[feature].emoji} {featureConfig[feature].label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Zoom Controls
 * Buttons to zoom in/out and reset seat map
 */
export function SeatMapZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  className,
}: {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2 bg-card border rounded-lg p-2', className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomOut}
        disabled={zoom <= 0.5}
        className="h-8 w-8"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>

      <div className="px-3 text-sm font-medium min-w-[60px] text-center">
        {Math.round(zoom * 100)}%
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomIn}
        disabled={zoom >= 2}
        className="h-8 w-8"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border" />

      <Button
        variant="ghost"
        size="icon"
        onClick={onReset}
        className="h-8 w-8"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

/**
 * Seat Hover Tooltip
 * Shows detailed seat information on hover
 */
export function SeatHoverTooltip({
  seatNumber,
  status,
  type,
  price,
  features = [],
  children,
}: {
  seatNumber: string
  status: 'available' | 'selected' | 'occupied' | 'reserved'
  type?: 'window' | 'aisle' | 'exit'
  price?: number
  features?: Array<'extra-legroom' | 'charging' | 'premium'>
  children: React.ReactNode
}) {
  const statusConfig = {
    available: { label: 'Available', color: 'text-green-600' },
    selected: { label: 'Selected', color: 'text-blue-600' },
    occupied: { label: 'Occupied', color: 'text-gray-400' },
    reserved: { label: 'Reserved', color: 'text-yellow-600' },
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="font-bold text-base">Seat {seatNumber}</span>
              <span className={cn('text-sm font-medium', statusConfig[status].color)}>
                {statusConfig[status].label}
              </span>
            </div>

            {type && (
              <div className="text-sm text-muted-foreground">
                {type === 'window' && '🪟 Window Seat'}
                {type === 'aisle' && '🚶 Aisle Seat'}
                {type === 'exit' && '🚪 Exit Row (Extra Legroom)'}
              </div>
            )}

            {features.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {features.map((feature) => (
                  <Badge key={feature} variant="secondary" className="text-xs">
                    {feature === 'extra-legroom' && '📏 Extra Legroom'}
                    {feature === 'charging' && '🔌 Charging Port'}
                    {feature === 'premium' && '⭐ Premium Seat'}
                  </Badge>
                ))}
              </div>
            )}

            {price && price > 0 && (
              <div className="pt-2 border-t">
                <span className="text-sm font-semibold">+{price} Birr</span>
                <span className="text-xs text-muted-foreground ml-1">(premium)</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Seat Selection Summary
 * Shows selected seats with details
 */
export function SeatSelectionSummary({
  selectedSeats,
  onRemoveSeat,
}: {
  selectedSeats: Array<{
    number: string
    type?: 'window' | 'aisle' | 'exit'
    price: number
  }>
  onRemoveSeat: (seatNumber: string) => void
}) {
  if (selectedSeats.length === 0) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/50 text-muted-foreground">
        <Info className="h-5 w-5" />
        <p className="text-sm">No seats selected. Click on available seats to select.</p>
      </div>
    )
  }

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Selected Seats ({selectedSeats.length})</h4>
        <span className="text-lg font-bold">{totalPrice.toLocaleString()} Birr</span>
      </div>

      <div className="space-y-2">
        {selectedSeats.map((seat) => (
          <div
            key={seat.number}
            className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20 group hover:bg-primary/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center font-bold text-primary">
                {seat.number}
              </div>
              <div>
                <p className="font-medium">Seat {seat.number}</p>
                {seat.type && (
                  <p className="text-xs text-muted-foreground">
                    {seat.type === 'window' && 'Window'}
                    {seat.type === 'aisle' && 'Aisle'}
                    {seat.type === 'exit' && 'Exit Row'}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold">{seat.price} Birr</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveSeat(seat.number)}
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XSquare className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

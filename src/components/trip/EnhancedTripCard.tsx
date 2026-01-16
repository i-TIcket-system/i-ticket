/**
 * TIER 2 - ENHANCED TRIP CARDS
 * Trip cards with availability badges, amenities, live indicators, and social proof
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { Wifi, Wind, Armchair, AlertCircle, Users, TrendingUp, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Availability Badge
 * Shows seats remaining with color coding
 */
export function AvailabilityBadge({
  availableSeats,
  totalSeats,
  size = 'default',
}: {
  availableSeats: number
  totalSeats: number
  size?: 'sm' | 'default' | 'lg'
}) {
  const percentage = (availableSeats / totalSeats) * 100

  let variant: 'default' | 'secondary' | 'destructive' = 'default'
  let text = `${availableSeats} seats left`
  let icon = <CheckCircle2 className="h-3 w-3" />

  if (percentage <= 10) {
    variant = 'destructive'
    text = `Only ${availableSeats} left!`
    icon = <AlertCircle className="h-3 w-3 animate-pulse" />
  } else if (percentage <= 30) {
    variant = 'secondary'
    text = `${availableSeats} seats left`
  }

  return (
    <Badge
      variant={variant}
      className={cn(
        'flex items-center gap-1.5 font-medium',
        size === 'sm' && 'text-xs px-2 py-0.5',
        size === 'lg' && 'text-base px-4 py-2'
      )}
    >
      {icon}
      {text}
    </Badge>
  )
}

/**
 * Amenities Badges
 * Shows available amenities with icons
 */
export function AmenitiesBadges({
  amenities,
  layout = 'horizontal',
}: {
  amenities: {
    hasWifi?: boolean
    hasAC?: boolean
    hasReclining?: boolean
  }
  layout?: 'horizontal' | 'vertical'
}) {
  const items = []

  if (amenities.hasWifi) {
    items.push({ icon: Wifi, label: 'WiFi', color: 'text-blue-600' })
  }
  if (amenities.hasAC) {
    items.push({ icon: Wind, label: 'AC', color: 'text-cyan-600' })
  }
  if (amenities.hasReclining) {
    items.push({ icon: Armchair, label: 'Reclining', color: 'text-purple-600' })
  }

  if (items.length === 0) return null

  return (
    <div
      className={cn(
        'flex gap-2',
        layout === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'
      )}
    >
      {items.map((item) => (
        <Badge
          key={item.label}
          variant="outline"
          className="flex items-center gap-1.5 bg-background/50 backdrop-blur-sm"
        >
          <item.icon className={cn('h-3.5 w-3.5', item.color)} />
          <span className="text-xs font-medium">{item.label}</span>
        </Badge>
      ))}
    </div>
  )
}

/**
 * Live Filling Fast Indicator
 * Animated indicator showing trip is filling up
 */
export function FillingFastIndicator() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 animate-glow-pulse">
      <div className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600" />
      </div>
      <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">
        Filling Fast
      </span>
    </div>
  )
}

/**
 * Social Proof Badge
 * Shows how many people booked this route
 */
export function SocialProofBadge({
  count,
  timeframe = 'today',
  variant = 'default',
}: {
  count: number
  timeframe?: 'today' | 'this week' | 'this month'
  variant?: 'default' | 'compact'
}) {
  if (count === 0) return null

  if (variant === 'compact') {
    return (
      <Badge variant="secondary" className="flex items-center gap-1.5">
        <Users className="h-3 w-3" />
        <span className="text-xs">{count}</span>
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="flex -space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-background flex items-center justify-center"
          >
            <Users className="h-3 w-3 text-white" />
          </div>
        ))}
      </div>
      <span className="font-medium">
        {count.toLocaleString()} booked {timeframe}
      </span>
    </div>
  )
}

/**
 * Compare Toggle
 * Checkbox to compare trips with smooth animation
 */
export function CompareToggle({
  checked,
  onChange,
  tripId,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  tripId: string
}) {
  return (
    <label
      htmlFor={`compare-${tripId}`}
      className="flex items-center gap-2 cursor-pointer group"
    >
      <div className="relative">
        <input
          id={`compare-${tripId}`}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={cn(
            'h-5 w-5 rounded border-2 transition-all duration-200',
            checked
              ? 'bg-primary border-primary scale-110'
              : 'border-muted-foreground/30 group-hover:border-primary/50'
          )}
        >
          {checked && (
            <CheckCircle2 className="h-full w-full text-white p-0.5 animate-pop" />
          )}
        </div>
      </div>
      <span
        className={cn(
          'text-sm font-medium transition-colors',
          checked ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
        )}
      >
        Compare
      </span>
    </label>
  )
}

/**
 * Price Trend Badge
 * Shows if price is lower/higher than usual
 */
export function PriceTrendBadge({
  trend,
  percentage,
}: {
  trend: 'lower' | 'higher' | 'normal'
  percentage: number
}) {
  if (trend === 'normal') return null

  return (
    <Badge
      variant={trend === 'lower' ? 'default' : 'secondary'}
      className={cn(
        'flex items-center gap-1',
        trend === 'lower' && 'bg-green-500 hover:bg-green-600 text-white',
        trend === 'higher' && 'bg-orange-500 hover:bg-orange-600 text-white'
      )}
    >
      <TrendingUp
        className={cn(
          'h-3 w-3',
          trend === 'higher' && 'rotate-180'
        )}
      />
      <span className="text-xs font-semibold">
        {percentage}% {trend} than usual
      </span>
    </Badge>
  )
}

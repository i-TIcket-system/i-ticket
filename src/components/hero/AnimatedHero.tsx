/**
 * TIER 2 - HERO ENHANCEMENTS
 * Animated elements for hero section
 */

'use client'

import { useState, useEffect } from 'react'
import { Bus, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

/**
 * Floating Bus Animation
 * Buses that float across the hero section
 */
export function FloatingBuses() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute animate-float"
          style={{
            left: `${20 + i * 30}%`,
            top: `${10 + i * 25}%`,
            animationDelay: `${i * 2}s`,
            animationDuration: `${8 + i * 2}s`,
          }}
        >
          <Bus
            className="h-8 w-8 text-primary/20 dark:text-primary/10"
            style={{
              filter: 'blur(1px)',
            }}
          />
        </div>
      ))}
    </div>
  )
}

/**
 * Animated Counter
 * Counts up from 0 to target number
 */
export function AnimatedCounter({
  end,
  duration = 2000,
  suffix = '',
  className = '',
}: {
  end: number
  duration?: number
  suffix?: string
  className?: string
}) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTimestamp: number | null = null
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }
    window.requestAnimationFrame(step)
  }, [end, duration])

  return (
    <span className={className}>
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

/**
 * Popular Today Badge
 * Shows trending routes with animation
 */
export function PopularTodayBadge({
  route,
  bookings,
}: {
  route: string
  bookings: number
}) {
  return (
    <Badge
      variant="secondary"
      className="animate-fade-in bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 hover:scale-105 transition-transform cursor-pointer"
    >
      <TrendingUp className="h-3 w-3 mr-1 animate-pulse" />
      <span className="font-medium">{route}</span>
      <span className="ml-1.5 text-xs opacity-90">• {bookings} booked today</span>
    </Badge>
  )
}

/**
 * Recent Search Item
 * Shows recent search with quick select
 */
export function RecentSearchItem({
  from,
  to,
  date,
  onClick,
}: {
  from: string
  to: string
  date?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group text-left"
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Bus className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">
            {from} → {to}
          </p>
          {date && (
            <p className="text-xs text-muted-foreground">{date}</p>
          )}
        </div>
      </div>
      <TrendingUp className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )
}

/**
 * Animated Stats Card
 * Card with counting animation for hero stats
 */
export function AnimatedStatsCard({
  icon: Icon,
  value,
  label,
  suffix = '',
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: number
  label: string
  suffix?: string
  delay?: number
}) {
  return (
    <div
      className="text-center text-white group animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-white/10 backdrop-blur mb-4 group-hover:scale-110 transition-transform duration-300">
        <Icon className="h-7 w-7" />
      </div>
      <div className="text-4xl md:text-5xl font-display mb-2">
        <AnimatedCounter end={value} suffix={suffix} />
      </div>
      <div className="text-sm text-white/70 uppercase tracking-wider">{label}</div>
    </div>
  )
}

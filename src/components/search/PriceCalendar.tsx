/**
 * TIER 3 - PRICE CALENDAR
 * 30-day price grid showing best prices for flexible travelers
 */

'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, TrendingDown, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * Price Calendar Cell
 * Single day in the calendar with price and availability
 */
export function PriceCalendarDay({
  date,
  price,
  availability,
  isToday,
  isSelected,
  isPast,
  isLowestPrice,
  onClick,
}: {
  date: Date
  price?: number
  availability?: 'high' | 'medium' | 'low' | 'none'
  isToday?: boolean
  isSelected?: boolean
  isPast?: boolean
  isLowestPrice?: boolean
  onClick?: () => void
}) {
  const dayOfMonth = date.getDate()
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' })

  const availabilityColors = {
    high: 'border-green-500/20 hover:border-green-500/40',
    medium: 'border-yellow-500/20 hover:border-yellow-500/40',
    low: 'border-orange-500/20 hover:border-orange-500/40',
    none: 'border-gray-300/20 cursor-not-allowed opacity-50',
  }

  return (
    <button
      onClick={availability !== 'none' && !isPast ? onClick : undefined}
      disabled={isPast || availability === 'none'}
      className={cn(
        'relative p-3 rounded-lg border-2 transition-all duration-200',
        'flex flex-col items-center justify-center min-h-[80px]',
        isPast && 'cursor-not-allowed opacity-40',
        !isPast && availability !== 'none' && 'cursor-pointer hover:scale-105 hover:shadow-md',
        isToday && 'ring-2 ring-primary ring-offset-2',
        isSelected && 'bg-primary text-primary-foreground border-primary',
        !isSelected && availability && availabilityColors[availability],
        !isSelected && !isPast && availability !== 'none' && 'hover:bg-muted/50'
      )}
    >
      {/* Day of week */}
      <span className={cn(
        'text-xs font-medium mb-1',
        isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
      )}>
        {dayOfWeek}
      </span>

      {/* Day of month */}
      <span className={cn(
        'text-lg font-bold mb-1',
        isSelected ? 'text-primary-foreground' : 'text-foreground'
      )}>
        {dayOfMonth}
      </span>

      {/* Price */}
      {price !== undefined && !isPast && availability !== 'none' && (
        <div className="flex flex-col items-center">
          <span className={cn(
            'text-sm font-semibold',
            isSelected ? 'text-primary-foreground' : 'text-foreground'
          )}>
            {price.toLocaleString()}
          </span>
          <span className={cn(
            'text-xs',
            isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}>
            Birr
          </span>
        </div>
      )}

      {/* Lowest price indicator */}
      {isLowestPrice && !isSelected && (
        <div className="absolute -top-2 -right-2">
          <Badge
            variant="default"
            className="h-5 px-1.5 text-xs bg-green-500 hover:bg-green-600 text-white flex items-center gap-1"
          >
            <TrendingDown className="h-3 w-3" />
            Best
          </Badge>
        </div>
      )}

      {/* Today indicator */}
      {isToday && !isSelected && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        </div>
      )}

      {/* No availability overlay */}
      {availability === 'none' && !isPast && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-muted-foreground">Full</span>
        </div>
      )}
    </button>
  )
}

/**
 * Price Calendar Grid
 * Full 30-day calendar with prices
 */
export function PriceCalendar({
  origin,
  destination,
  priceData,
  selectedDate,
  onDateSelect,
  isLoading = false,
}: {
  origin: string
  destination: string
  priceData: Array<{
    date: Date
    price: number
    availability: 'high' | 'medium' | 'low' | 'none'
  }>
  selectedDate?: Date
  onDateSelect: (date: Date) => void
  isLoading?: boolean
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get all days for current month view (30 days from today)
  const days: Date[] = []
  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    days.push(date)
  }

  // Find lowest price
  const lowestPrice = Math.min(...priceData.filter(d => d.availability !== 'none').map(d => d.price))

  // Group days by week
  const weeks: Date[][] = []
  let currentWeek: Date[] = []
  days.forEach((day, index) => {
    currentWeek.push(day)
    if (currentWeek.length === 7 || index === days.length - 1) {
      weeks.push([...currentWeek])
      currentWeek = []
    }
  })

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Price Calendar
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {origin} → {destination} • Next 30 days
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded border-2 border-green-500/40" />
            <span className="text-muted-foreground">High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded border-2 border-yellow-500/40" />
            <span className="text-muted-foreground">Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded border-2 border-orange-500/40" />
            <span className="text-muted-foreground">Low</span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading prices...</p>
        </div>
      )}

      {/* Calendar Grid */}
      {!isLoading && (
        <div className="space-y-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-2">
              {week.map((day) => {
                const dayData = priceData.find(
                  d => d.date.toDateString() === day.toDateString()
                )
                const isPast = day < today
                const isToday = day.toDateString() === today.toDateString()
                const isSelected = selectedDate?.toDateString() === day.toDateString()
                const isLowestPrice = dayData?.price === lowestPrice && dayData.availability !== 'none'

                return (
                  <PriceCalendarDay
                    key={day.toISOString()}
                    date={day}
                    price={dayData?.price}
                    availability={dayData?.availability || 'none'}
                    isToday={isToday}
                    isSelected={isSelected}
                    isPast={isPast}
                    isLowestPrice={isLowestPrice}
                    onClick={() => onDateSelect(day)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Price Range Summary */}
      {!isLoading && priceData.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">Best price:</span>
              <span className="font-bold text-green-600">
                {lowestPrice.toLocaleString()} Birr
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Average:</span>
              <span className="font-semibold">
                {Math.round(
                  priceData.reduce((sum, d) => sum + d.price, 0) / priceData.length
                ).toLocaleString()} Birr
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Tip: Green days have the best prices and more availability
          </p>
        </div>
      )}
    </Card>
  )
}

/**
 * Compact Price Calendar
 * Smaller version for sidebars
 */
export function CompactPriceCalendar({
  priceData,
  selectedDate,
  onDateSelect,
}: {
  priceData: Array<{
    date: Date
    price: number
    availability: 'high' | 'medium' | 'low' | 'none'
  }>
  selectedDate?: Date
  onDateSelect: (date: Date) => void
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Show next 7 days only
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    days.push(date)
  }

  const lowestPrice = Math.min(...priceData.filter(d => d.availability !== 'none').map(d => d.price))

  return (
    <div>
      <h4 className="text-sm font-medium mb-3">Next 7 Days</h4>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayData = priceData.find(
            d => d.date.toDateString() === day.toDateString()
          )
          const isSelected = selectedDate?.toDateString() === day.toDateString()
          const isLowestPrice = dayData?.price === lowestPrice && dayData.availability !== 'none'

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={cn(
                'p-2 rounded text-center transition-all',
                isSelected && 'bg-primary text-primary-foreground',
                !isSelected && 'hover:bg-muted',
                dayData?.availability === 'none' && 'opacity-40 cursor-not-allowed'
              )}
            >
              <div className="text-xs font-medium mb-1">
                {day.toLocaleDateString('en-US', { weekday: 'narrow' })}
              </div>
              <div className="text-sm font-bold">
                {day.getDate()}
              </div>
              {dayData && dayData.availability !== 'none' && (
                <div className={cn(
                  'text-xs font-semibold mt-1',
                  isLowestPrice && !isSelected && 'text-green-600'
                )}>
                  {dayData.price}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

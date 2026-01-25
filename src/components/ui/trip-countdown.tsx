"use client"

import { useState, useEffect } from "react"
import { Clock, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface TripCountdownProps {
  departureTime: string | Date
  className?: string
  variant?: "default" | "glass" | "compact"
}

export function TripCountdown({ departureTime, className = "", variant = "default" }: TripCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    totalSeconds: number
  } | null>(null)

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime()
      const departure = new Date(departureTime).getTime()
      const diff = departure - now

      if (diff <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalSeconds: 0,
        }
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      return { days, hours, minutes, seconds, totalSeconds: Math.floor(diff / 1000) }
    }

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining())

    // Update every second
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining())
    }, 1000)

    return () => clearInterval(interval)
  }, [departureTime])

  if (!timeRemaining) {
    return null
  }

  // Trip has departed
  if (timeRemaining.totalSeconds <= 0) {
    return (
      <Card className={`bg-gray-100 border-gray-300 ${className}`}>
        <CardContent className="p-4 text-center">
          <p className="text-sm font-medium text-gray-600">This trip has departed</p>
        </CardContent>
      </Card>
    )
  }

  // Compact variant for inline display
  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Clock className="h-4 w-4 text-primary animate-pulse" />
        <span className="text-sm font-medium">
          {timeRemaining.days > 0 && `${timeRemaining.days}d `}
          {timeRemaining.hours}h {timeRemaining.minutes}m
        </span>
      </div>
    )
  }

  // Glass variant with blur background
  if (variant === "glass") {
    return (
      <Card
        className={`
          backdrop-blur-xl bg-white/30 dark:bg-gray-900/30
          border border-white/40 dark:border-gray-700/40
          shadow-2xl
          ${className}
        `}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary animate-pulse" />
            <h3 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Your Trip Departs In
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {timeRemaining.days > 0 && (
              <div className="flex flex-col items-center p-3 rounded-lg backdrop-blur-sm bg-white/40 dark:bg-gray-800/40 border border-white/50">
                <span className="text-2xl sm:text-3xl font-bold text-primary">
                  {timeRemaining.days}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {timeRemaining.days === 1 ? "Day" : "Days"}
                </span>
              </div>
            )}
            <div className="flex flex-col items-center p-3 rounded-lg backdrop-blur-sm bg-white/40 dark:bg-gray-800/40 border border-white/50">
              <span className="text-2xl sm:text-3xl font-bold text-primary">
                {String(timeRemaining.hours).padStart(2, "0")}
              </span>
              <span className="text-xs text-muted-foreground mt-1">Hours</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg backdrop-blur-sm bg-white/40 dark:bg-gray-800/40 border border-white/50">
              <span className="text-2xl sm:text-3xl font-bold text-primary">
                {String(timeRemaining.minutes).padStart(2, "0")}
              </span>
              <span className="text-xs text-muted-foreground mt-1">Mins</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg backdrop-blur-sm bg-white/40 dark:bg-gray-800/40 border border-white/50">
              <span className="text-2xl sm:text-3xl font-bold text-primary">
                {String(timeRemaining.seconds).padStart(2, "0")}
              </span>
              <span className="text-xs text-muted-foreground mt-1">Secs</span>
            </div>
          </div>

          {/* Urgency indicator */}
          {timeRemaining.totalSeconds < 7200 && ( // Less than 2 hours
            <div className="mt-4 p-3 rounded-lg bg-orange-100/80 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200 text-center">
                Prepare to leave soon! Arrive 20 minutes early
              </p>
            </div>
          )}

          {/* Date display */}
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(departureTime).toLocaleDateString("en-ET", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              at{" "}
              {new Date(departureTime).toLocaleTimeString("en-ET", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <Card className={`bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary animate-pulse" />
          <h3 className="text-lg font-semibold text-primary">Your Trip Departs In</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {timeRemaining.days > 0 && (
            <div className="flex flex-col items-center p-3 rounded-lg bg-white border border-primary/20">
              <span className="text-2xl sm:text-3xl font-bold text-primary">{timeRemaining.days}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {timeRemaining.days === 1 ? "Day" : "Days"}
              </span>
            </div>
          )}
          <div className="flex flex-col items-center p-3 rounded-lg bg-white border border-primary/20">
            <span className="text-2xl sm:text-3xl font-bold text-primary">
              {String(timeRemaining.hours).padStart(2, "0")}
            </span>
            <span className="text-xs text-muted-foreground mt-1">Hours</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-lg bg-white border border-primary/20">
            <span className="text-2xl sm:text-3xl font-bold text-primary">
              {String(timeRemaining.minutes).padStart(2, "0")}
            </span>
            <span className="text-xs text-muted-foreground mt-1">Mins</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-lg bg-white border border-primary/20">
            <span className="text-2xl sm:text-3xl font-bold text-primary">
              {String(timeRemaining.seconds).padStart(2, "0")}
            </span>
            <span className="text-xs text-muted-foreground mt-1">Secs</span>
          </div>
        </div>

        {/* Urgency indicator */}
        {timeRemaining.totalSeconds < 7200 && ( // Less than 2 hours
          <Badge variant="destructive" className="mt-4 w-full justify-center">
            Prepare to leave soon! Arrive 20 minutes early
          </Badge>
        )}

        {/* Date display */}
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {new Date(departureTime).toLocaleDateString("en-ET", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}{" "}
            at{" "}
            {new Date(departureTime).toLocaleTimeString("en-ET", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

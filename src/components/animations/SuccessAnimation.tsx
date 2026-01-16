/**
 * SUCCESS ANIMATIONS TEMPLATE
 * Ready-to-use success animation components
 */

'use client'

import { useEffect } from 'react'
import { CheckCircle2, Ticket } from 'lucide-react'
import { bookingSuccessConfetti, paymentSuccessConfetti } from '@/lib/confetti'
import { cn } from '@/lib/utils'

interface SuccessAnimationProps {
  variant: 'booking' | 'payment' | 'quick'
  message: string
  submessage?: string
  className?: string
  showConfetti?: boolean
  onComplete?: () => void
}

/**
 * Unified success animation component
 * Usage: <SuccessAnimation variant="booking" message="Booking confirmed!" />
 */
export function SuccessAnimation({
  variant,
  message,
  submessage,
  className,
  showConfetti = true,
  onComplete,
}: SuccessAnimationProps) {
  useEffect(() => {
    if (showConfetti) {
      if (variant === 'booking') {
        bookingSuccessConfetti()
      } else if (variant === 'payment') {
        paymentSuccessConfetti()
      }
    }

    // Call onComplete after animation
    const timer = setTimeout(() => {
      onComplete?.()
    }, 2000)

    return () => clearTimeout(timer)
  }, [variant, showConfetti, onComplete])

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 animate-fade-up', className)}>
      {/* Success icon with pop animation */}
      <div className="relative mb-6 animate-pop">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-glow-pulse" />
        <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl">
          {variant === 'booking' || variant === 'payment' ? (
            <CheckCircle2 className="h-12 w-12 text-white" strokeWidth={2.5} />
          ) : (
            <Ticket className="h-12 w-12 text-white" strokeWidth={2.5} />
          )}
        </div>
      </div>

      {/* Success message */}
      <h3 className="text-2xl font-display font-semibold text-foreground mb-2 text-center">
        {message}
      </h3>

      {submessage && (
        <p className="text-muted-foreground text-center max-w-md">
          {submessage}
        </p>
      )}

      {/* Animated checkmarks */}
      <div className="flex gap-2 mt-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-primary animate-pulse"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Ticket printing animation for payment success
 */
export function TicketPrintingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center p-8 animate-fade-up">
      <div className="relative w-64 h-80 perspective-1000">
        {/* Ticket sliding out */}
        <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl border border-primary/20 animate-slide-up">
          <div className="p-6 flex flex-col items-center justify-center h-full">
            <Ticket className="h-16 w-16 text-primary mb-4" />
            <div className="w-full space-y-2">
              <div className="h-2 bg-muted rounded animate-pulse" />
              <div className="h-2 bg-muted rounded animate-pulse w-3/4" style={{ animationDelay: '100ms' }} />
              <div className="h-2 bg-muted rounded animate-pulse w-1/2" style={{ animationDelay: '200ms' }} />
            </div>
          </div>
        </div>
      </div>

      <p className="mt-8 text-lg font-medium text-muted-foreground animate-pulse">
        Generating your ticket...
      </p>
    </div>
  )
}

/**
 * Error shake animation component
 * Usage: Wrap any element to make it shake on error
 */
export function ErrorShake({
  children,
  trigger,
  className,
}: {
  children: React.ReactNode
  trigger: boolean
  className?: string
}) {
  return (
    <div className={cn(trigger && 'animate-shake', className)}>
      {children}
    </div>
  )
}

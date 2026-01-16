/**
 * TIER 3 - PROGRESSIVE BOOKING WIZARD
 * Step-by-step booking flow with progress indicator
 */

'use client'

import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight, MapPin, Users, CreditCard, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Booking Step Type
 */
export type BookingStep =
  | 'trip-selection'
  | 'passenger-details'
  | 'seat-selection'
  | 'payment'
  | 'confirmation'

/**
 * Step Configuration
 */
const STEPS: Array<{
  id: BookingStep
  label: string
  shortLabel: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { id: 'trip-selection', label: 'Select Trip', shortLabel: 'Trip', icon: MapPin },
  { id: 'passenger-details', label: 'Passenger Details', shortLabel: 'Details', icon: Users },
  { id: 'seat-selection', label: 'Choose Seats', shortLabel: 'Seats', icon: Calendar },
  { id: 'payment', label: 'Payment', shortLabel: 'Pay', icon: CreditCard },
  { id: 'confirmation', label: 'Confirmation', shortLabel: 'Done', icon: Check },
]

/**
 * Progress Bar
 * Shows current step and completion progress
 */
export function BookingProgressBar({
  currentStep,
  completedSteps = [],
  className,
}: {
  currentStep: BookingStep
  completedSteps?: BookingStep[]
  className?: string
}) {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep)

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop - Full labels */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Progress line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
          <div
            className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
            style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
          />

          {/* Steps */}
          <div className="relative flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id)
              const isCurrent = step.id === currentStep
              const isPast = index < currentIndex
              const StepIcon = step.icon

              return (
                <div key={step.id} className="flex flex-col items-center">
                  {/* Circle */}
                  <div
                    className={cn(
                      'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300',
                      isCurrent && 'border-primary bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/50',
                      isCompleted && !isCurrent && 'border-primary bg-primary text-primary-foreground',
                      !isCurrent && !isCompleted && isPast && 'border-primary bg-background',
                      !isCurrent && !isCompleted && !isPast && 'border-border bg-muted'
                    )}
                  >
                    {isCompleted && !isCurrent ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>

                  {/* Label */}
                  <div className="mt-2 text-center">
                    <p
                      className={cn(
                        'text-sm font-medium transition-colors',
                        isCurrent && 'text-foreground',
                        !isCurrent && (isCompleted || isPast) && 'text-muted-foreground',
                        !isCurrent && !isCompleted && !isPast && 'text-muted-foreground/50'
                      )}
                    >
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-primary mt-0.5">Current Step</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile - Compact */}
      <div className="block md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Step {currentIndex + 1} of {STEPS.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(((currentIndex + 1) / STEPS.length) * 100)}% Complete
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <p className="text-sm font-medium mt-2 text-center">
          {STEPS[currentIndex].label}
        </p>
      </div>
    </div>
  )
}

/**
 * Step Navigation
 * Back/Next buttons with validation
 */
export function BookingStepNavigation({
  currentStep,
  onBack,
  onNext,
  isNextDisabled = false,
  isLastStep = false,
  isLoading = false,
  nextLabel,
}: {
  currentStep: BookingStep
  onBack: () => void
  onNext: () => void
  isNextDisabled?: boolean
  isLastStep?: boolean
  isLoading?: boolean
  nextLabel?: string
}) {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep)
  const isFirstStep = currentIndex === 0

  return (
    <div className="flex items-center justify-between gap-4 pt-6 border-t">
      <Button
        variant="outline"
        onClick={onBack}
        disabled={isFirstStep || isLoading}
        className="gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="text-center flex-1">
        <p className="text-sm text-muted-foreground">
          Step {currentIndex + 1} of {STEPS.length}
        </p>
      </div>

      <Button
        onClick={onNext}
        disabled={isNextDisabled || isLoading}
        className="gap-2"
      >
        {nextLabel || (isLastStep ? 'Complete Booking' : 'Continue')}
        {!isLastStep && <ChevronRight className="h-4 w-4" />}
      </Button>
    </div>
  )
}

/**
 * Step Container
 * Wraps step content with animation
 */
export function BookingStepContainer({
  step,
  currentStep,
  children,
}: {
  step: BookingStep
  currentStep: BookingStep
  children: React.ReactNode
}) {
  const isActive = step === currentStep

  if (!isActive) return null

  return (
    <div className="animate-fade-up">
      {children}
    </div>
  )
}

/**
 * Booking Summary Sidebar
 * Shows trip and passenger info throughout booking
 */
export function BookingSummarySidebar({
  trip,
  passengers = [],
  selectedSeats = [],
  totalPrice,
  className,
}: {
  trip: {
    companyName: string
    origin: string
    destination: string
    departureTime: Date
    price: number
  }
  passengers?: Array<{
    firstName: string
    lastName: string
  }>
  selectedSeats?: string[]
  totalPrice: number
  className?: string
}) {
  return (
    <Card className={cn('p-6 sticky top-6', className)}>
      <h3 className="font-semibold mb-4">Booking Summary</h3>

      {/* Trip Info */}
      <div className="space-y-3 pb-4 border-b">
        <div>
          <p className="text-sm text-muted-foreground">Company</p>
          <p className="font-medium">{trip.companyName}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Route</p>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="font-medium">{trip.origin}</span>
            <span className="text-muted-foreground">→</span>
            <MapPin className="h-4 w-4 text-secondary flex-shrink-0" />
            <span className="font-medium">{trip.destination}</span>
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Departure</p>
          <p className="font-medium">
            {trip.departureTime.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}{' '}
            at{' '}
            {trip.departureTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      {/* Passengers */}
      {passengers.length > 0 && (
        <div className="py-4 border-b">
          <p className="text-sm text-muted-foreground mb-2">
            Passengers ({passengers.length})
          </p>
          <div className="space-y-2">
            {passengers.map((passenger, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <span className="text-sm">
                  {passenger.firstName} {passenger.lastName}
                </span>
                {selectedSeats[index] && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    Seat {selectedSeats[index]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      <div className="pt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Ticket Price × {Math.max(1, passengers.length)}
          </span>
          <span className="font-medium">
            {(trip.price * Math.max(1, passengers.length)).toLocaleString()} Birr
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Service Fee (5%)</span>
          <span className="font-medium">
            {Math.round(trip.price * Math.max(1, passengers.length) * 0.05).toLocaleString()} Birr
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">VAT (15%)</span>
          <span className="font-medium">
            {Math.round(trip.price * Math.max(1, passengers.length) * 0.05 * 0.15).toLocaleString()} Birr
          </span>
        </div>
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-xl text-primary">
              {totalPrice.toLocaleString()} Birr
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

/**
 * Step Validation Message
 * Shows what's needed to proceed
 */
export function StepValidationMessage({
  message,
  type = 'info',
}: {
  message: string
  type?: 'info' | 'warning' | 'error'
}) {
  const colors = {
    info: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    warning: 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    error: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  }

  return (
    <div className={cn('rounded-lg p-4 border text-sm', colors[type])}>
      {message}
    </div>
  )
}

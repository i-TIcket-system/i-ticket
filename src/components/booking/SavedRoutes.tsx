/**
 * TIER 3 - ONE-CLICK REPEAT BOOKING
 * Saved routes for frequent travelers with quick rebooking
 */

'use client'

import { useState } from 'react'
import { MapPin, Calendar, Users, Star, Trash2, Clock, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

/**
 * Saved Route Card
 * Shows saved route with quick booking action
 */
export function SavedRouteCard({
  route,
  onBook,
  onDelete,
  showFrequency = true,
}: {
  route: {
    id: string
    origin: string
    destination: string
    lastBooked?: Date
    bookingCount: number
    averagePrice: number
    passengers: number
  }
  onBook: (routeId: string) => void
  onDelete: (routeId: string) => void
  showFrequency?: boolean
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const timeSinceLastBooking = route.lastBooked
    ? Math.floor((Date.now() - route.lastBooked.getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <>
      <Card className="p-4 hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
        {/* Gradient accent on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Route Info */}
          <div className="flex-1 space-y-3">
            {/* Origin → Destination */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="font-semibold text-lg">{route.origin}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-[1px] w-8 bg-border" />
                <span className="text-xs">→</span>
                <div className="h-[1px] w-8 bg-border" />
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-secondary flex-shrink-0" />
                <span className="font-semibold text-lg">{route.destination}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {/* Last booked */}
              {timeSinceLastBooking !== null && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {timeSinceLastBooking === 0
                      ? 'Booked today'
                      : timeSinceLastBooking === 1
                      ? 'Booked yesterday'
                      : `${timeSinceLastBooking} days ago`}
                  </span>
                </div>
              )}

              {/* Booking count */}
              {showFrequency && (
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {route.bookingCount} {route.bookingCount === 1 ? 'booking' : 'bookings'}
                  </span>
                </div>
              )}

              {/* Default passengers */}
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span>
                  {route.passengers} {route.passengers === 1 ? 'passenger' : 'passengers'}
                </span>
              </div>

              {/* Average price */}
              <Badge variant="secondary" className="font-semibold">
                ~{route.averagePrice.toLocaleString()} Birr
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onBook(route.id)}
              className="gap-2 btn-glow"
            >
              <Calendar className="h-4 w-4" />
              Book Again
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove saved route?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{route.origin} → {route.destination}</strong> from your saved routes.
              You can always save it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(route.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/**
 * Saved Routes List
 * Grid of saved routes with empty state
 */
export function SavedRoutesList({
  routes,
  onBook,
  onDelete,
  isLoading = false,
}: {
  routes: Array<{
    id: string
    origin: string
    destination: string
    lastBooked?: Date
    bookingCount: number
    averagePrice: number
    passengers: number
  }>
  onBook: (routeId: string) => void
  onDelete: (routeId: string) => void
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-5 w-24 bg-muted rounded" />
                <div className="h-4 w-8 bg-muted rounded" />
                <div className="h-5 w-24 bg-muted rounded" />
              </div>
              <div className="flex gap-4">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-4 w-20 bg-muted rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (routes.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Star className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">No saved routes yet</h3>
            <p className="text-muted-foreground">
              Book a trip and it will appear here for quick rebooking in the future.
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Search for trips
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {routes.map((route) => (
        <SavedRouteCard
          key={route.id}
          route={route}
          onBook={onBook}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

/**
 * Quick Booking Modal
 * Shows when user clicks "Book Again" on saved route
 */
export function QuickBookingModal({
  route,
  onConfirm,
  onCancel,
  isOpen,
}: {
  route: {
    origin: string
    destination: string
    passengers: number
    averagePrice: number
  }
  onConfirm: (date: Date, passengers: number) => void
  onCancel: () => void
  isOpen: boolean
}) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [passengers, setPassengers] = useState(route.passengers)

  // Default to tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Quick Booking
          </AlertDialogTitle>
          <AlertDialogDescription>
            <div className="space-y-4 pt-4">
              {/* Route */}
              <div className="flex items-center gap-2 text-base font-medium text-foreground">
                <span>{route.origin}</span>
                <span className="text-muted-foreground">→</span>
                <span>{route.destination}</span>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Travel Date</label>
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  min={tomorrow.toISOString().split('T')[0]}
                  className="w-full px-3 py-2 rounded-md border bg-background"
                />
              </div>

              {/* Passenger Count */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Passengers</label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setPassengers(Math.max(1, passengers - 1))}
                  >
                    -
                  </Button>
                  <span className="text-lg font-semibold min-w-[3ch] text-center">
                    {passengers}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setPassengers(Math.min(10, passengers + 1))}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Estimated Price */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estimated price</span>
                  <span className="font-semibold text-lg">
                    ~{(route.averagePrice * passengers).toLocaleString()} Birr
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on your previous bookings. Actual price may vary.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(selectedDate, passengers)}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            Search Trips
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

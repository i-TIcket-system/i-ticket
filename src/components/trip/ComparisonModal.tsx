/**
 * TIER 3 - TRIP COMPARISON MODAL
 * Side-by-side comparison of up to 3 trips
 */

'use client'

import { X, Check, Clock, MapPin, Bus, Wifi, Wind, Armchair, Users, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface Trip {
  id: string
  companyName: string
  origin: string
  destination: string
  departureTime: Date
  arrivalTime: Date
  duration: string
  price: number
  availableSeats: number
  totalSeats: number
  busType: string
  amenities: {
    hasWifi?: boolean
    hasAC?: boolean
    hasReclining?: boolean
  }
  intermediateStops?: number
  rating?: number
}

/**
 * Comparison Row
 * Single feature row with values for each trip
 */
function ComparisonRow({
  label,
  icon: Icon,
  values,
  highlight = false,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  values: (string | number | React.ReactNode)[]
  highlight?: boolean
}) {
  return (
    <div className={cn(
      'grid gap-4 py-4 border-b last:border-0',
      highlight && 'bg-muted/50'
    )}>
      <div className="col-span-full flex items-center gap-2 font-medium text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className={cn(
        'grid gap-4',
        values.length === 2 && 'grid-cols-2',
        values.length === 3 && 'grid-cols-3'
      )}>
        {values.map((value, index) => (
          <div key={index} className="text-center">
            {typeof value === 'string' || typeof value === 'number' ? (
              <span className="font-semibold">{value}</span>
            ) : (
              value
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Trip Comparison Header Card
 * Shows basic trip info at the top
 */
function ComparisonTripCard({
  trip,
  onRemove,
}: {
  trip: Trip
  onRemove: () => void
}) {
  return (
    <div className="relative p-4 rounded-lg border bg-card">
      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </Button>

      {/* Company name */}
      <div className="mb-3">
        <h4 className="font-semibold text-sm">{trip.companyName}</h4>
        <p className="text-xs text-muted-foreground mt-1">
          {trip.busType}
        </p>
      </div>

      {/* Route */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
          <span className="font-medium">{trip.origin}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3 w-3 flex-shrink-0" />
          <span>{trip.departureTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-secondary flex-shrink-0" />
          <span className="font-medium">{trip.destination}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3 w-3 flex-shrink-0" />
          <span>{trip.arrivalTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Price badge */}
      <div className="mt-3 pt-3 border-t">
        <Badge variant="secondary" className="w-full justify-center font-bold text-base py-1">
          {trip.price.toLocaleString()} Birr
        </Badge>
      </div>
    </div>
  )
}

/**
 * Trip Comparison Modal
 * Full comparison interface
 */
export function TripComparisonModal({
  trips,
  isOpen,
  onClose,
  onRemoveTrip,
  onSelectTrip,
}: {
  trips: Trip[]
  isOpen: boolean
  onClose: () => void
  onRemoveTrip: (tripId: string) => void
  onSelectTrip: (tripId: string) => void
}) {
  if (trips.length === 0) return null

  // Find best values for highlighting
  const lowestPrice = Math.min(...trips.map(t => t.price))
  const shortestDuration = Math.min(...trips.map(t => {
    const [hours, minutes] = t.duration.split(':').map(Number)
    return hours * 60 + minutes
  }))
  const mostSeats = Math.max(...trips.map(t => t.availableSeats))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bus className="h-5 w-5 text-primary" />
            Compare Trips ({trips.length})
          </DialogTitle>
          <DialogDescription>
            Compare features, prices, and amenities side-by-side
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Trip Cards */}
          <div className={cn(
            'grid gap-4',
            trips.length === 2 && 'grid-cols-2',
            trips.length === 3 && 'grid-cols-3'
          )}>
            {trips.map((trip) => (
              <ComparisonTripCard
                key={trip.id}
                trip={trip}
                onRemove={() => onRemoveTrip(trip.id)}
              />
            ))}
          </div>

          {/* Comparison Table */}
          <div className="border rounded-lg p-4">
            {/* Duration */}
            <ComparisonRow
              label="Travel Duration"
              icon={Clock}
              values={trips.map(trip => {
                const [hours, minutes] = trip.duration.split(':').map(Number)
                const totalMinutes = hours * 60 + minutes
                const isShortest = totalMinutes === shortestDuration
                return (
                  <div className={cn(
                    'flex items-center justify-center gap-1.5',
                    isShortest && 'text-green-600'
                  )}>
                    {isShortest && <Badge variant="outline" className="text-xs px-1 border-green-600 text-green-600">Fastest</Badge>}
                    <span className="font-semibold">{trip.duration}</span>
                  </div>
                )
              })}
            />

            {/* Price */}
            <ComparisonRow
              label="Ticket Price"
              icon={DollarSign}
              values={trips.map(trip => {
                const isLowest = trip.price === lowestPrice
                return (
                  <div className={cn(
                    'flex flex-col items-center gap-1',
                    isLowest && 'text-green-600'
                  )}>
                    {isLowest && <Badge variant="outline" className="text-xs px-1 border-green-600 text-green-600">Best Price</Badge>}
                    <span className="font-bold text-lg">{trip.price.toLocaleString()} Birr</span>
                  </div>
                )
              })}
              highlight
            />

            {/* Availability */}
            <ComparisonRow
              label="Available Seats"
              icon={Users}
              values={trips.map(trip => {
                const percentage = (trip.availableSeats / trip.totalSeats) * 100
                const isMostSeats = trip.availableSeats === mostSeats
                return (
                  <div className="flex flex-col items-center gap-1">
                    <span className={cn(
                      'font-semibold',
                      percentage <= 20 && 'text-orange-600',
                      isMostSeats && percentage > 20 && 'text-green-600'
                    )}>
                      {trip.availableSeats} / {trip.totalSeats}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {percentage.toFixed(0)}% available
                    </span>
                  </div>
                )
              })}
            />

            {/* Amenities */}
            <ComparisonRow
              label="Amenities"
              icon={Wifi}
              values={trips.map(trip => (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    {trip.amenities.hasWifi && (
                      <div className="flex items-center gap-1 text-xs">
                        <Wifi className="h-3 w-3 text-blue-600" />
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                    )}
                    {trip.amenities.hasAC && (
                      <div className="flex items-center gap-1 text-xs">
                        <Wind className="h-3 w-3 text-cyan-600" />
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                    )}
                    {trip.amenities.hasReclining && (
                      <div className="flex items-center gap-1 text-xs">
                        <Armchair className="h-3 w-3 text-purple-600" />
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                    )}
                  </div>
                  {!trip.amenities.hasWifi && !trip.amenities.hasAC && !trip.amenities.hasReclining && (
                    <span className="text-xs text-muted-foreground">Basic</span>
                  )}
                </div>
              ))}
            />

            {/* Intermediate Stops */}
            <ComparisonRow
              label="Stops"
              icon={MapPin}
              values={trips.map(trip => (
                <span className={cn(
                  'font-semibold',
                  (trip.intermediateStops || 0) === 0 && 'text-green-600'
                )}>
                  {trip.intermediateStops || 0} {(trip.intermediateStops || 0) === 1 ? 'stop' : 'stops'}
                </span>
              ))}
            />

            {/* Rating */}
            {trips.some(t => t.rating) && (
              <ComparisonRow
                label="Customer Rating"
                icon={Users}
                values={trips.map(trip => (
                  trip.rating ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-semibold text-lg">{trip.rating.toFixed(1)}</span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              'h-3 w-3 rounded-full',
                              i < Math.round(trip.rating || 0) ? 'bg-yellow-400' : 'bg-gray-300'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No ratings</span>
                  )
                ))}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className={cn(
            'grid gap-3',
            trips.length === 2 && 'grid-cols-2',
            trips.length === 3 && 'grid-cols-3'
          )}>
            {trips.map((trip) => (
              <Button
                key={trip.id}
                onClick={() => onSelectTrip(trip.id)}
                className="w-full gap-2"
              >
                Select {trip.companyName}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Compact Comparison Badge
 * Shows number of trips being compared
 */
export function ComparisonBadge({
  count,
  onClick,
}: {
  count: number
  onClick: () => void
}) {
  if (count === 0) return null

  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 gap-2 shadow-lg animate-pop"
    >
      <Bus className="h-4 w-4" />
      Compare {count} {count === 1 ? 'Trip' : 'Trips'}
      <Badge variant="secondary" className="ml-1">{count}</Badge>
    </Button>
  )
}

/**
 * SKELETON LOADERS - TIER 1
 * Loading state components that match actual content layout
 */

import { Card } from '@/components/ui/card'

/**
 * Trip Card Skeleton
 * Matches the layout of actual trip cards in search results
 */
export function TripCardSkeleton() {
  return (
    <Card className="p-6 animate-pulse">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Company logo skeleton */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-muted rounded-lg" />
        </div>

        {/* Trip details skeleton */}
        <div className="flex-1 space-y-4">
          {/* Company name */}
          <div className="h-5 bg-muted rounded w-32" />

          {/* Route */}
          <div className="flex items-center gap-2">
            <div className="h-6 bg-muted rounded w-24" />
            <div className="h-4 w-8 bg-muted rounded" />
            <div className="h-6 bg-muted rounded w-24" />
          </div>

          {/* Time and details */}
          <div className="flex flex-wrap gap-3">
            <div className="h-4 bg-muted rounded w-20" />
            <div className="h-4 bg-muted rounded w-16" />
            <div className="h-4 bg-muted rounded w-24" />
          </div>

          {/* Badges */}
          <div className="flex gap-2">
            <div className="h-6 bg-muted rounded-full w-16" />
            <div className="h-6 bg-muted rounded-full w-20" />
          </div>
        </div>

        {/* Price and action skeleton */}
        <div className="flex flex-col items-end justify-between gap-4">
          <div>
            <div className="h-8 bg-muted rounded w-24 mb-2" />
            <div className="h-4 bg-muted rounded w-16" />
          </div>
          <div className="h-10 bg-muted rounded w-32" />
        </div>
      </div>
    </Card>
  )
}

/**
 * Trip Card Skeleton Grid
 * Shows multiple skeleton cards
 */
export function TripCardSkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <TripCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Search Page Skeleton
 * Full page loading state with filters and cards
 */
export function SearchSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Filters skeleton */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 space-y-4 animate-pulse">
            <div className="h-6 bg-muted rounded w-24" />
            <div className="space-y-3">
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
            </div>
          </Card>

          <Card className="p-6 space-y-4 animate-pulse">
            <div className="h-6 bg-muted rounded w-32" />
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded" />
              <div className="h-8 bg-muted rounded" />
              <div className="h-8 bg-muted rounded" />
            </div>
          </Card>
        </div>

        {/* Results skeleton */}
        <div className="lg:col-span-3">
          <div className="mb-6 flex items-center justify-between animate-pulse">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="h-10 bg-muted rounded w-32" />
          </div>

          <TripCardSkeletonGrid count={5} />
        </div>
      </div>
    </div>
  )
}

/**
 * Seat Map Skeleton
 * Loading state for seat selection
 */
export function SeatMapSkeleton() {
  return (
    <Card className="p-6 animate-pulse">
      <div className="space-y-6">
        {/* Legend */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-20" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-20" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-24" />
          </div>
        </div>

        {/* Seat grid */}
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-muted rounded"
              style={{ animationDelay: `${i * 20}ms` }}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}

/**
 * Booking Form Skeleton
 * Loading state for booking page
 */
export function BookingFormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Card className="p-6 space-y-4">
        <div className="h-6 bg-muted rounded w-48" />
        <div className="space-y-3">
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="h-6 bg-muted rounded w-40" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
      </Card>
    </div>
  )
}

/**
 * Dashboard Stats Skeleton
 * Loading state for dashboard stats cards
 */
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-6 animate-pulse">
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-8 bg-muted rounded w-16" />
            <div className="h-3 bg-muted rounded w-32" />
          </div>
        </Card>
      ))}
    </div>
  )
}

/**
 * Table Skeleton
 * Generic table loading state
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <Card className="overflow-hidden">
      <div className="animate-pulse">
        {/* Header */}
        <div className="border-b p-4 bg-muted/50">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded" />
            ))}
          </div>
        </div>

        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="border-b p-4 last:border-0">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="h-4 bg-muted rounded"
                  style={{ animationDelay: `${(rowIndex * columns + colIndex) * 50}ms` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

/**
 * Booking Page Skeleton
 * Full booking page loading state
 */
export function BookingPageSkeleton() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 animate-pulse">
          <div className="h-4 bg-muted rounded w-32 mb-4" />
          <div className="h-8 bg-muted rounded w-64" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip summary */}
            <Card className="p-6 animate-pulse">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-muted rounded w-32" />
                  <div className="h-6 bg-muted rounded-full w-20" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-8 bg-muted rounded w-24" />
                  <div className="h-8 bg-muted rounded w-24" />
                </div>
              </div>
            </Card>

            {/* Passenger form */}
            <BookingFormSkeleton />

            {/* Seat map */}
            <SeatMapSkeleton />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 animate-pulse space-y-4">
              <div className="h-6 bg-muted rounded w-32" />
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded" />
              </div>
              <div className="h-10 bg-muted rounded" />
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Payment Page Skeleton
 * Payment page loading state
 */
export function PaymentPageSkeleton() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-6 animate-pulse">
          <div className="h-4 bg-muted rounded w-32" />
        </div>

        <div className="space-y-6">
          {/* Booking summary */}
          <Card className="p-6 animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-40" />
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-4 bg-muted rounded w-32" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-4 bg-muted rounded w-24" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-4 bg-muted rounded w-16" />
              </div>
            </div>
          </Card>

          {/* Payment method */}
          <Card className="p-6 animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-40" />
            <div className="space-y-3">
              <div className="h-20 bg-muted rounded" />
            </div>
          </Card>

          {/* Action button */}
          <div className="animate-pulse">
            <div className="h-12 bg-muted rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

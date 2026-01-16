/**
 * TIER 2 - SMART SEARCH COMPONENTS
 * Enhanced search with autocomplete, recent searches, and quick filters
 */

'use client'

import { useState } from 'react'
import { Clock, MapPin, TrendingUp, Zap, DollarSign, Star, Navigation } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * Quick Filter Pills
 * Fast filter buttons for common search preferences
 */
export function QuickFilterPills({
  activeFilter,
  onFilterChange,
}: {
  activeFilter?: string
  onFilterChange: (filter: string) => void
}) {
  const filters = [
    { id: 'fastest', label: 'Fastest', icon: Zap, color: 'text-yellow-600' },
    { id: 'cheapest', label: 'Cheapest', icon: DollarSign, color: 'text-green-600' },
    { id: 'highest-rated', label: 'Highest Rated', icon: Star, color: 'text-orange-600' },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={activeFilter === filter.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange(filter.id)}
          className="h-9 px-4 gap-2 transition-all hover:scale-105"
        >
          <filter.icon className={cn('h-4 w-4', activeFilter === filter.id ? 'text-white' : filter.color)} />
          {filter.label}
        </Button>
      ))}
    </div>
  )
}

/**
 * Search Autocomplete Dropdown
 * Shows recent searches, popular routes, and nearby cities
 */
export function SearchAutocompleteDropdown({
  searchType,
  query,
  recentSearches = [],
  popularRoutes = [],
  nearbyCities = [],
  onSelect,
}: {
  searchType: 'origin' | 'destination'
  query: string
  recentSearches?: string[]
  popularRoutes?: string[]
  nearbyCities?: Array<{ name: string; distance: string }>
  onSelect: (value: string) => void
}) {
  const hasResults = recentSearches.length > 0 || popularRoutes.length > 0 || nearbyCities.length > 0

  if (!hasResults) {
    return (
      <div className="absolute z-50 w-full mt-2 p-4 rounded-lg border bg-card shadow-lg">
        <p className="text-sm text-muted-foreground text-center">
          Start typing to see suggestions...
        </p>
      </div>
    )
  }

  return (
    <div className="absolute z-50 w-full mt-2 rounded-lg border bg-card shadow-2xl max-h-96 overflow-y-auto">
      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="p-3 border-b">
          <div className="flex items-center gap-2 mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <Clock className="h-3 w-3" />
            Recent Searches
          </div>
          <div className="space-y-1">
            {recentSearches.map((city, i) => (
              <button
                key={i}
                onClick={() => onSelect(city)}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors flex items-center gap-2 group"
              >
                <MapPin className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-sm">{city}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular Routes */}
      {popularRoutes.length > 0 && (
        <div className="p-3 border-b">
          <div className="flex items-center gap-2 mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <TrendingUp className="h-3 w-3" />
            Popular Routes
          </div>
          <div className="space-y-1">
            {popularRoutes.map((city, i) => (
              <button
                key={i}
                onClick={() => onSelect(city)}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors flex items-center gap-2 group"
              >
                <Star className="h-4 w-4 text-orange-500 group-hover:text-orange-600 transition-colors" />
                <span className="text-sm font-medium">{city}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  Popular
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nearby Cities */}
      {nearbyCities.length > 0 && (
        <div className="p-3">
          <div className="flex items-center gap-2 mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <Navigation className="h-3 w-3" />
            Nearby Cities
          </div>
          <div className="space-y-1">
            {nearbyCities.map((city, i) => (
              <button
                key={i}
                onClick={() => onSelect(city.name)}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary group-hover:text-secondary transition-colors" />
                  <span className="text-sm">{city.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{city.distance}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Search Input with Icon
 * Enhanced input with icon and loading state
 */
export function SearchInputWithIcon({
  icon: Icon,
  placeholder,
  value,
  onChange,
  onFocus,
  loading = false,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  placeholder: string
  value: string
  onChange: (value: string) => void
  onFocus?: () => void
  loading?: boolean
  className?: string
}) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none z-10" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        className={cn('pl-11 h-12', loading && 'pr-10', className)}
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  )
}

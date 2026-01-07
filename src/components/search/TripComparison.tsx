"use client"

import { X, Check, Clock, MapPin, DollarSign, Users, Coffee, Droplets, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCurrency, formatDuration, formatDate, BUS_TYPES } from "@/lib/utils"
import Link from "next/link"

interface Trip {
  id: string
  origin: string
  destination: string
  departureTime: string
  estimatedDuration: number
  distance: number | null
  price: number
  busType: string
  totalSlots: number
  availableSlots: number
  hasWater: boolean
  hasFood: boolean
  company: {
    id: string
    name: string
  }
}

interface TripComparisonProps {
  trips: Trip[]
  open: boolean
  onClose: () => void
}

export function TripComparison({ trips, open, onClose }: TripComparisonProps) {
  if (trips.length === 0) return null

  const comparisonRows = [
    {
      label: "Company",
      icon: <MapPin className="h-4 w-4" />,
      getValue: (trip: Trip) => trip.company.name,
    },
    {
      label: "Bus Type",
      icon: null,
      getValue: (trip: Trip) => BUS_TYPES.find((t) => t.value === trip.busType)?.label || trip.busType,
    },
    {
      label: "Departure",
      icon: <Calendar className="h-4 w-4" />,
      getValue: (trip: Trip) => formatDate(trip.departureTime) + " at " + new Date(trip.departureTime).toLocaleTimeString("en-ET", { hour: "2-digit", minute: "2-digit" }),
    },
    {
      label: "Duration",
      icon: <Clock className="h-4 w-4" />,
      getValue: (trip: Trip) => formatDuration(trip.estimatedDuration),
    },
    {
      label: "Distance",
      icon: <MapPin className="h-4 w-4" />,
      getValue: (trip: Trip) => trip.distance ? `${trip.distance} km` : "N/A",
    },
    {
      label: "Price",
      icon: <DollarSign className="h-4 w-4" />,
      getValue: (trip: Trip) => formatCurrency(Number(trip.price)),
      highlight: true,
    },
    {
      label: "Available Seats",
      icon: <Users className="h-4 w-4" />,
      getValue: (trip: Trip) => `${trip.availableSlots} / ${trip.totalSlots}`,
    },
    {
      label: "Water",
      icon: <Droplets className="h-4 w-4" />,
      getValue: (trip: Trip) => trip.hasWater ? "✓ Yes" : "✗ No",
      getColor: (trip: Trip) => trip.hasWater ? "text-green-600" : "text-muted-foreground",
    },
    {
      label: "Snacks",
      icon: <Coffee className="h-4 w-4" />,
      getValue: (trip: Trip) => trip.hasFood ? "✓ Yes" : "✗ No",
      getColor: (trip: Trip) => trip.hasFood ? "text-green-600" : "text-muted-foreground",
    },
  ]

  // Find cheapest trip for highlighting
  const cheapestPrice = Math.min(...trips.map((t) => Number(t.price)))

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Compare Trips ({trips.length})</span>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${trips.length}, 1fr)` }}>
            {/* Header Row */}
            <div className="font-medium text-sm text-muted-foreground">Feature</div>
            {trips.map((trip) => (
              <Card key={trip.id} className="overflow-hidden">
                <CardHeader className="pb-3 text-center">
                  <div className="h-12 w-12 mx-auto rounded-full bg-primary flex items-center justify-center text-white font-bold mb-2">
                    {trip.company.name.charAt(0)}
                  </div>
                  <CardTitle className="text-sm">{trip.company.name}</CardTitle>
                  <Badge variant="secondary" className="mx-auto mt-1">
                    {BUS_TYPES.find((t) => t.value === trip.busType)?.label || trip.busType}
                  </Badge>
                </CardHeader>
              </Card>
            ))}

            {/* Comparison Rows */}
            {comparisonRows.map((row, rowIndex) => (
              <>
                <div key={`label-${rowIndex}`} className="flex items-center gap-2 py-3 px-2 bg-muted/30 rounded-lg text-sm font-medium">
                  {row.icon}
                  {row.label}
                </div>
                {trips.map((trip) => {
                  const value = row.getValue(trip)
                  const color = row.getColor ? row.getColor(trip) : ""
                  const isHighlight = row.highlight && row.label === "Price" && Number(trip.price) === cheapestPrice

                  return (
                    <div
                      key={`${trip.id}-${rowIndex}`}
                      className={`flex items-center justify-center py-3 px-2 text-sm rounded-lg ${
                        isHighlight ? "bg-green-50 border border-green-200 font-bold text-green-700" : ""
                      } ${color}`}
                    >
                      {value}
                      {isHighlight && (
                        <Badge className="ml-2 bg-green-500 text-xs">Cheapest</Badge>
                      )}
                    </div>
                  )
                })}
              </>
            ))}

            {/* Action Row */}
            <div className="py-3"></div>
            {trips.map((trip) => (
              <div key={`action-${trip.id}`} className="py-3">
                <Link href={`/booking/${trip.id}`}>
                  <Button
                    className="w-full"
                    disabled={trip.availableSlots === 0}
                  >
                    {trip.availableSlots === 0 ? "Sold Out" : "Select This Trip"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

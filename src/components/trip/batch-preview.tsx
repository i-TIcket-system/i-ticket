"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Calendar, Clock } from "lucide-react"

interface BatchPreviewProps {
  origin: string
  destination: string
  selectedDates: Date[]
  departureTime: string
  createReturnTrips: boolean
  returnDepartureTime?: string
  price: string
}

export function BatchPreview({
  origin,
  destination,
  selectedDates,
  departureTime,
  createReturnTrips,
  returnDepartureTime,
  price,
}: BatchPreviewProps) {
  if (selectedDates.length === 0 || !origin || !destination) {
    return null
  }

  const addDays = (date: Date, days: number): Date => {
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() + days)
    return newDate
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const totalTrips = selectedDates.length * (createReturnTrips ? 2 : 1)

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Batch Preview</CardTitle>
          <Badge variant="secondary" className="text-sm">
            {totalTrips} trip{totalTrips !== 1 ? "s" : ""} will be created
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Forward Trips */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Forward Trips ({selectedDates.length})
          </p>
          <div className="space-y-2">
            {selectedDates.map((date, index) => (
              <div
                key={`forward-${index}`}
                className="flex items-center gap-3 p-2 rounded-md bg-white dark:bg-gray-900 border text-sm"
              >
                <div className="flex items-center gap-2 flex-1">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium">{formatDate(date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">{departureTime}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>{origin}</span>
                  <ArrowRight className="h-3 w-3 flex-shrink-0" />
                  <span>{destination}</span>
                </div>
                {price && (
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    {price} Birr
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Return Trips */}
        {createReturnTrips && returnDepartureTime && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
              Return Trips ({selectedDates.length})
            </p>
            <div className="space-y-2">
              {selectedDates.map((date, index) => {
                const returnDate = addDays(date, 1)
                return (
                  <div
                    key={`return-${index}`}
                    className="flex items-center gap-3 p-2 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-sm"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      <span className="font-medium">{formatDate(returnDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">{returnDepartureTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span>{destination}</span>
                      <ArrowRight className="h-3 w-3 flex-shrink-0" />
                      <span>{origin}</span>
                    </div>
                    {price && (
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        {price} Birr
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total trips:</span>
            <span className="font-semibold">{totalTrips}</span>
          </div>
          {price && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Total revenue potential:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {(parseFloat(price) * totalTrips).toLocaleString()} Birr
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Clock, Wrench, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface MaintenanceWindow {
  start: string
  end: string
  durationHours: number
  beforeTrip: string | null
  suitableTasks: string[]
}

interface MaintenanceWindowSuggestionsProps {
  vehicleId: string
}

export function MaintenanceWindowSuggestions({ vehicleId }: MaintenanceWindowSuggestionsProps) {
  const [windows, setWindows] = useState<MaintenanceWindow[]>([])
  const [loading, setLoading] = useState(true)
  const [plateNumber, setPlateNumber] = useState("")

  useEffect(() => {
    async function fetchWindows() {
      try {
        const res = await fetch(`/api/company/analytics/maintenance-windows?vehicleId=${vehicleId}`)
        if (res.ok) {
          const data = await res.json()
          setWindows(data.windows || [])
          setPlateNumber(data.plateNumber || "")
        }
      } catch (error) {
        console.error("Failed to fetch maintenance windows:", error)
      } finally {
        setLoading(false)
      }
    }
    if (vehicleId) fetchWindows()
  }, [vehicleId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (windows.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        No maintenance windows found in the next 14 days
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Available windows for {plateNumber} in the next 14 days:
      </p>
      {windows.slice(0, 5).map((w, i) => (
        <div key={i} className="p-3 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-600" />
              <span className="font-medium text-sm">{w.durationHours}h available</span>
            </div>
            {w.beforeTrip && (
              <span className="text-xs text-muted-foreground">Before: {w.beforeTrip}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            {formatDate(w.start)} — {formatDate(w.end)}
          </p>
          <div className="flex flex-wrap gap-1">
            {w.suitableTasks.slice(0, 4).map((task) => (
              <Badge key={task} variant="secondary" className="text-xs">
                <Wrench className="h-3 w-3 mr-1" />
                {task}
              </Badge>
            ))}
            {w.suitableTasks.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{w.suitableTasks.length - 4} more
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

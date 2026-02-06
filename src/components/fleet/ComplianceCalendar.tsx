"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface CalendarEvent {
  date: string
  vehicleId: string
  plateNumber: string
  type: string
  label: string
  isOverdue: boolean
}

const TYPE_COLORS: Record<string, string> = {
  REGISTRATION: "bg-blue-100 text-blue-800 border-blue-200",
  INSURANCE: "bg-purple-100 text-purple-800 border-purple-200",
  INSPECTION: "bg-teal-100 text-teal-800 border-teal-200",
  SERVICE: "bg-orange-100 text-orange-800 border-orange-200",
}

export function ComplianceCalendar() {
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [byDate, setByDate] = useState<Record<string, CalendarEvent[]>>({})
  const [loading, setLoading] = useState(true)
  const [overdueCount, setOverdueCount] = useState(0)

  useEffect(() => {
    async function fetchCalendar() {
      setLoading(true)
      try {
        const res = await fetch(`/api/company/analytics/compliance-calendar?month=${month}&year=${year}`)
        if (res.ok) {
          const data = await res.json()
          setEvents(data.events || [])
          setByDate(data.byDate || {})
          setOverdueCount(data.overdueCount || 0)
        }
      } catch (error) {
        console.error("Failed to fetch compliance calendar:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchCalendar()
  }, [month, year])

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1) }
    else setMonth(month - 1)
  }

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1) }
    else setMonth(month + 1)
  }

  const monthName = new Date(year, month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const today = new Date().toISOString().split("T")[0]

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h3 className="font-semibold">{monthName}</h3>
          {overdueCount > 0 && (
            <Badge variant="destructive" className="mt-1">
              {overdueCount} overdue
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="min-h-[60px]" />
          }

          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          const dayEvents = byDate[dateStr] || []
          const isToday = dateStr === today
          const hasOverdue = dayEvents.some((e) => e.isOverdue)

          return (
            <div
              key={dateStr}
              className={`min-h-[60px] p-1 rounded border text-xs ${
                isToday
                  ? "border-teal-500 bg-teal-50"
                  : hasOverdue
                  ? "border-red-200 bg-red-50"
                  : dayEvents.length > 0
                  ? "border-blue-200 bg-blue-50/30"
                  : "border-gray-100"
              }`}
            >
              <div className={`font-medium mb-0.5 ${isToday ? "text-teal-700" : ""}`}>
                {day}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 2).map((e, j) => (
                  <div
                    key={`${e.vehicleId}-${e.type}-${j}`}
                    className={`px-1 py-0.5 rounded text-[10px] truncate border ${
                      e.isOverdue ? "bg-red-100 text-red-800 border-red-200" : TYPE_COLORS[e.type] || "bg-gray-100"
                    }`}
                    title={e.label}
                  >
                    {e.plateNumber}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-[10px] text-muted-foreground text-center">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 text-xs">
        {Object.entries({ REGISTRATION: "Registration", INSURANCE: "Insurance", INSPECTION: "Inspection", SERVICE: "Service" }).map(
          ([type, label]) => (
            <div key={type} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded ${TYPE_COLORS[type]?.split(" ")[0] || "bg-gray-200"}`} />
              <span className="text-muted-foreground">{label}</span>
            </div>
          )
        )}
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-200" />
          <span className="text-muted-foreground">Overdue</span>
        </div>
      </div>
    </div>
  )
}

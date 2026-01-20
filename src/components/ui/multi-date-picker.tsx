"use client"

import * as React from "react"
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MultiDatePickerProps {
  selectedDates: Date[]
  onChange: (dates: Date[]) => void
  maxSelections?: number
  minDate?: Date
  disabled?: boolean
}

export function MultiDatePicker({
  selectedDates,
  onChange,
  maxSelections = 10,
  minDate = new Date(),
  disabled = false,
}: MultiDatePickerProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const isDateSelected = (date: Date) => {
    return selectedDates.some(d =>
      d.getFullYear() === date.getFullYear() &&
      d.getMonth() === date.getMonth() &&
      d.getDate() === date.getDate()
    )
  }

  const isDateDisabled = (date: Date) => {
    // Check if before minimum date
    const minDateStart = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    if (checkDate < minDateStart) return true

    // 24-Hour Rule: Gray out the day after any selected date
    // (Bus/driver returns on that day, so unavailable for new forward trip)
    for (const selectedDate of selectedDates) {
      const dayAfterSelected = new Date(selectedDate)
      dayAfterSelected.setDate(dayAfterSelected.getDate() + 1)

      if (
        checkDate.getFullYear() === dayAfterSelected.getFullYear() &&
        checkDate.getMonth() === dayAfterSelected.getMonth() &&
        checkDate.getDate() === dayAfterSelected.getDate()
      ) {
        return true // This is a return day, can't use for forward trip
      }
    }

    return false
  }

  const handleDateClick = (day: number) => {
    if (disabled) return

    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day, 12, 0, 0)

    if (isDateDisabled(clickedDate)) return

    const isSelected = isDateSelected(clickedDate)

    if (isSelected) {
      // Remove date
      const updatedDates = selectedDates.filter(d =>
        !(d.getFullYear() === clickedDate.getFullYear() &&
          d.getMonth() === clickedDate.getMonth() &&
          d.getDate() === clickedDate.getDate())
      )
      onChange(updatedDates)
    } else {
      // Add date if not at max
      if (selectedDates.length >= maxSelections) return

      const updatedDates = [...selectedDates, clickedDate].sort((a, b) => a.getTime() - b.getTime())
      onChange(updatedDates)
    }
  }

  const handleRemoveDate = (dateToRemove: Date) => {
    const updatedDates = selectedDates.filter(d =>
      !(d.getFullYear() === dateToRemove.getFullYear() &&
        d.getMonth() === dateToRemove.getMonth() &&
        d.getDate() === dateToRemove.getDate())
    )
    onChange(updatedDates)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  const days = daysInMonth(currentMonth)
  const startDay = firstDayOfMonth(currentMonth)
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="space-y-2">
      {/* Calendar - Reduced Size */}
      <div className="border rounded-lg p-2 bg-white dark:bg-gray-950 max-w-xs">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={previousMonth}
            disabled={disabled}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <h3 className="text-xs font-semibold">{monthName}</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={nextMonth}
            disabled={disabled}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {weekDays.map((day) => (
            <div key={day} className="text-[10px] font-medium text-center text-muted-foreground py-1">
              {day.substring(0, 2)}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Days of month */}
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
            const selected = isDateSelected(date)
            const isDisabled = isDateDisabled(date)
            const today = new Date()
            const isToday = date.getDate() === today.getDate() &&
                           date.getMonth() === today.getMonth() &&
                           date.getFullYear() === today.getFullYear()

            return (
              <button
                key={day}
                type="button"
                onClick={() => handleDateClick(day)}
                disabled={disabled || isDisabled}
                className={cn(
                  "aspect-square p-1 text-xs rounded transition-colors",
                  "hover:bg-muted focus:outline-none focus:ring-1 focus:ring-primary",
                  selected && "bg-primary text-primary-foreground hover:bg-primary/90 font-semibold",
                  isDisabled && "opacity-30 cursor-not-allowed hover:bg-transparent",
                  isToday && !selected && "border border-primary",
                  !selected && !isDisabled && "hover:bg-muted"
                )}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>

      {/* Help Text with 24-Hour Rule Explanation */}
      <p className="text-xs text-muted-foreground">
        {selectedDates.length === 0 && `Click dates to select up to ${maxSelections} dates. Day after each selection is grayed out (return day).`}
        {selectedDates.length > 0 && selectedDates.length < maxSelections && `${selectedDates.length}/${maxSelections} dates selected - gray dates are return days (unavailable)`}
        {selectedDates.length === maxSelections && `Maximum ${maxSelections} dates selected`}
      </p>

      {/* Selected Dates */}
      {selectedDates.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 rounded-md border bg-muted/30 dark:bg-muted/10">
          {selectedDates.map((date, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-primary/10 text-primary border border-primary/20 dark:bg-primary/20"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span className="font-medium">{formatDate(date)}</span>
              <button
                type="button"
                onClick={() => handleRemoveDate(date)}
                className="hover:bg-primary/20 dark:hover:bg-primary/30 rounded-full p-0.5 transition-colors"
                disabled={disabled}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

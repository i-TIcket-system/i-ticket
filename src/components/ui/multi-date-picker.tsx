"use client"

import * as React from "react"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  const [inputValue, setInputValue] = React.useState("")

  const handleAddDate = () => {
    if (!inputValue || selectedDates.length >= maxSelections) return

    // Parse date at noon to avoid timezone issues
    const [year, month, day] = inputValue.split('-').map(Number)
    const newDate = new Date(year, month - 1, day, 12, 0, 0)
    const dateStr = newDate.toDateString()

    // Check if already selected
    const isAlreadySelected = selectedDates.some(d => d.toDateString() === dateStr)
    if (isAlreadySelected) {
      setInputValue("")
      return
    }

    // Check if before min date (compare date strings to avoid timezone issues)
    const minDateStr = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
    const checkDate = new Date(year, month - 1, day)
    if (checkDate < minDateStr) {
      setInputValue("")
      return
    }

    // Add date
    const updatedDates = [...selectedDates, newDate].sort((a, b) => a.getTime() - b.getTime())
    onChange(updatedDates)
    setInputValue("")
  }

  const handleRemoveDate = (dateToRemove: Date) => {
    const updatedDates = selectedDates.filter(d => d.toDateString() !== dateToRemove.toDateString())
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

  const minDateStr = minDate.toISOString().split("T")[0]

  return (
    <div className="space-y-3">
      {/* Date Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="date"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            min={minDateStr}
            disabled={disabled || selectedDates.length >= maxSelections}
            className="pl-10"
            placeholder="Select date"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddDate()
              }
            }}
          />
        </div>
        <Button
          type="button"
          onClick={handleAddDate}
          disabled={!inputValue || disabled || selectedDates.length >= maxSelections}
          variant="outline"
        >
          Add Date
        </Button>
      </div>

      {/* Help Text */}
      <p className="text-xs text-muted-foreground">
        {selectedDates.length === 0 && `Select up to ${maxSelections} dates`}
        {selectedDates.length > 0 && selectedDates.length < maxSelections && `${selectedDates.length}/${maxSelections} dates selected`}
        {selectedDates.length === maxSelections && `Maximum ${maxSelections} dates selected`}
      </p>

      {/* Selected Dates */}
      {selectedDates.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 rounded-md border bg-muted/30">
          {selectedDates.map((date, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-primary/10 text-primary border border-primary/20"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span className="font-medium">{formatDate(date)}</span>
              <button
                type="button"
                onClick={() => handleRemoveDate(date)}
                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
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

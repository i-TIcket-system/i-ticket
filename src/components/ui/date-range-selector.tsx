"use client"

import { useState } from "react"
import { Calendar } from "lucide-react"
import { Button } from "./button"
import { Input } from "./input"
import { Label } from "./label"

interface DateRangeSelectorProps {
  onRangeChange: (start: string, end: string) => void
  defaultRange?: "7days" | "30days" | "90days"
}

export function DateRangeSelector({ onRangeChange, defaultRange = "30days" }: DateRangeSelectorProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedPreset, setSelectedPreset] = useState(defaultRange)

  const handlePreset = (preset: "7days" | "30days" | "90days") => {
    const end = new Date()
    const start = new Date()

    switch (preset) {
      case "7days":
        start.setDate(start.getDate() - 7)
        break
      case "30days":
        start.setDate(start.getDate() - 30)
        break
      case "90days":
        start.setDate(start.getDate() - 90)
        break
    }

    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]

    setStartDate(startStr)
    setEndDate(endStr)
    setSelectedPreset(preset)
    onRangeChange(startStr, endStr)
  }

  const handleCustomRange = () => {
    if (startDate && endDate) {
      onRangeChange(startDate, endDate)
      setSelectedPreset(null as any)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-2">
        <Button
          variant={selectedPreset === "7days" ? "default" : "outline"}
          size="sm"
          onClick={() => handlePreset("7days")}
        >
          7 Days
        </Button>
        <Button
          variant={selectedPreset === "30days" ? "default" : "outline"}
          size="sm"
          onClick={() => handlePreset("30days")}
        >
          30 Days
        </Button>
        <Button
          variant={selectedPreset === "90days" ? "default" : "outline"}
          size="sm"
          onClick={() => handlePreset("90days")}
        >
          90 Days
        </Button>
      </div>
    </div>
  )
}

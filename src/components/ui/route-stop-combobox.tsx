"use client"

import * as React from "react"
import { MapPin, Map, X, Circle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { fuzzyMatch } from "@/lib/fuzzy-match"
import { buildRouteSuggestions, type RouteSuggestion } from "@/lib/route-locations"

export interface RouteStopComboboxProps {
  value: string
  onChange: (value: string) => void
  routeStops: string[]
  placeholder?: string
  disabled?: boolean
  onOpenMap?: () => void
}

export function RouteStopCombobox({
  value,
  onChange,
  routeStops,
  placeholder = "Type or select a location",
  disabled,
  onOpenMap,
}: RouteStopComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  const allSuggestions = React.useMemo(
    () => buildRouteSuggestions(routeStops),
    [routeStops]
  )

  const filteredSuggestions = React.useMemo(() => {
    if (!inputValue) return allSuggestions

    const allLabels = allSuggestions.map((s) => s.label)
    const matched = fuzzyMatch(inputValue, allLabels, 15)
    const matchedSet = new Set(matched.map((m) => m.value))

    // Preserve type info by filtering original suggestions
    return allSuggestions.filter((s) => matchedSet.has(s.label))
  }, [inputValue, allSuggestions])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
    setIsOpen(true)
  }

  const handleSelect = (label: string) => {
    setInputValue(label)
    onChange(label)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    setInputValue("")
    onChange("")
    inputRef.current?.focus()
  }

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />

        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-16 text-gray-900 dark:text-gray-100"
          autoComplete="off"
        />

        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          {onOpenMap && (
            <button
              type="button"
              onClick={onOpenMap}
              disabled={disabled}
              className="h-7 w-7 rounded hover:bg-primary/10 flex items-center justify-center text-primary disabled:opacity-50"
              title="Select on map"
            >
              <Map className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {isOpen && !disabled && filteredSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-xl z-50 max-h-64 overflow-y-auto"
        >
          <div className="p-1">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.label}-${index}`}
                type="button"
                onClick={() => handleSelect(suggestion.label)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-sm transition-colors",
                  "flex items-center gap-2",
                  suggestion.label === inputValue
                    ? "bg-primary text-white font-medium"
                    : "text-gray-900 dark:text-gray-100 hover:bg-primary/10 hover:text-primary"
                )}
              >
                {suggestion.type === "stop" ? (
                  <Circle
                    className={cn(
                      "h-3 w-3 flex-shrink-0",
                      suggestion.label === inputValue
                        ? "text-white fill-white"
                        : "text-primary fill-primary"
                    )}
                  />
                ) : (
                  <MapPin
                    className={cn(
                      "h-3 w-3 flex-shrink-0 ml-2",
                      suggestion.label === inputValue
                        ? "text-white"
                        : "text-gray-400 dark:text-gray-500"
                    )}
                  />
                )}
                <span
                  className={cn(
                    "text-sm flex-1",
                    suggestion.type === "stop" && "font-medium"
                  )}
                >
                  {suggestion.label}
                </span>
                {suggestion.type === "stop" && (
                  <span
                    className={cn(
                      "text-[10px] uppercase tracking-wide",
                      suggestion.label === inputValue
                        ? "text-white/70"
                        : "text-muted-foreground"
                    )}
                  >
                    Stop
                  </span>
                )}
              </button>
            ))}
          </div>

          {inputValue &&
            !filteredSuggestions.some((s) => s.label === inputValue) && (
              <div className="p-2 border-t bg-muted/30">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Using custom location: &ldquo;{inputValue}&rdquo;
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  )
}

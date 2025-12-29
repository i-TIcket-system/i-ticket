"use client"

import * as React from "react"
import { MapPin, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface CityComboboxProps {
  value: string
  onChange: (value: string) => void
  suggestions: string[]
  placeholder?: string
  disabled?: boolean
  className?: string
  icon?: React.ReactNode
  excludeCity?: string // City to exclude from suggestions (e.g., origin when selecting destination)
}

/**
 * City input with autocomplete suggestions
 * Allows both manual input AND selection from suggestions
 * Users can type any city name, not limited to predefined list
 */
export const CityCombobox = React.forwardRef<HTMLInputElement, CityComboboxProps>(
  ({ value, onChange, suggestions, placeholder, disabled, className, icon, excludeCity }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState(value)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const dropdownRef = React.useRef<HTMLDivElement>(null)

    // Sync with external value changes
    React.useEffect(() => {
      setInputValue(value)
    }, [value])

    // Filter suggestions based on input
    const filteredSuggestions = React.useMemo(() => {
      // Filter out any empty, null, or undefined values first
      const validSuggestions = suggestions.filter(s => s && typeof s === 'string' && s.trim().length > 0)

      if (!inputValue) {
        const result = validSuggestions.filter(s => s !== excludeCity).slice(0, 8)
        console.log('[CityCombobox] Showing', result.length, 'suggestions:', result)
        return result
      }

      const result = validSuggestions
        .filter(city =>
          city !== excludeCity &&
          city.toLowerCase().includes(inputValue.toLowerCase())
        )
        .slice(0, 8) // Limit to 8 suggestions for performance

      console.log('[CityCombobox] Filtered suggestions for "' + inputValue + '":', result)
      return result
    }, [inputValue, suggestions, excludeCity])

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setInputValue(newValue)
      onChange(newValue) // Always update parent with typed value
      setIsOpen(true) // Show suggestions when typing
    }

    // Handle suggestion click
    const handleSuggestionClick = (city: string) => {
      setInputValue(city)
      onChange(city)
      setIsOpen(false)
      inputRef.current?.blur()
    }

    // Handle clear
    const handleClear = () => {
      setInputValue("")
      onChange("")
      inputRef.current?.focus()
    }

    // Close dropdown when clicking outside
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
        <div className="relative">
          {icon || <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />}

          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder || "Type or select a city"}
            disabled={disabled}
            className={cn("pl-10 pr-8", className)}
            autoComplete="off"
          />

          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full hover:bg-muted flex items-center justify-center"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {isOpen && filteredSuggestions.length > 0 && !disabled && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto"
          >
            <div className="p-1">
              {filteredSuggestions.map((city, index) => (
                <button
                  key={`${city}-${index}`}
                  type="button"
                  onClick={() => handleSuggestionClick(city)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                    "flex items-center gap-2",
                    city === inputValue && "bg-accent/50"
                  )}
                >
                  <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-foreground font-normal flex-1">
                    {city || "[Empty]"}
                  </span>
                </button>
              ))}
            </div>

            {/* Show hint if user is typing custom city */}
            {inputValue && !filteredSuggestions.includes(inputValue) && (
              <div className="border-t p-2 bg-muted/30">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Press Enter to search for "{inputValue}"
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
)

CityCombobox.displayName = "CityCombobox"

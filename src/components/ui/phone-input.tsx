"use client"

import * as React from "react"
import { Phone } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  value: string
  onChange: (value: string) => void
  error?: string
}

/**
 * Ethiopian phone number input with automatic formatting and validation
 * Format: 09XX XXX XXX (e.g., 0911 234 567)
 * Pattern: Must start with 09 followed by 8 digits
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value, onChange, error, disabled, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)

    const formatPhoneNumber = (input: string): string => {
      // Remove all non-digit characters
      const digits = input.replace(/\D/g, "")

      // Limit to 10 digits
      const limited = digits.slice(0, 10)

      // Format as: 09XX XXX XXX
      if (limited.length <= 4) {
        return limited
      } else if (limited.length <= 7) {
        return `${limited.slice(0, 4)} ${limited.slice(4)}`
      } else {
        return `${limited.slice(0, 4)} ${limited.slice(4, 7)} ${limited.slice(7)}`
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value
      const digits = input.replace(/\D/g, "")

      // Only allow digits and limit to 10
      if (digits.length <= 10) {
        onChange(digits)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter
      if ([8, 9, 27, 13, 46].includes(e.keyCode)) {
        return
      }
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      if ((e.ctrlKey || e.metaKey) && [65, 67, 86, 88].includes(e.keyCode)) {
        return
      }
      // Allow: home, end, left, right
      if (e.keyCode >= 35 && e.keyCode <= 39) {
        return
      }
      // Ensure that it's a number and stop the keypress if not
      if ((e.shiftKey || e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault()
      }
    }

    const isValid = (phone: string): boolean => {
      return /^09\d{8}$/.test(phone)
    }

    const getValidationMessage = (): string | null => {
      if (!value) return null
      if (value.length < 10) return `${10 - value.length} more digits needed`
      if (!value.startsWith("09")) return "Must start with 09"
      if (!isValid(value)) return "Invalid phone number"
      return null
    }

    const displayValue = formatPhoneNumber(value)
    const validationMessage = error || getValidationMessage()
    const showError = !isFocused && validationMessage

    return (
      <div className="relative">
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            {...props}
            ref={ref}
            type="tel"
            inputMode="numeric"
            pattern="09[0-9]{8}"
            maxLength={12} // 10 digits + 2 spaces
            value={displayValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            className={cn(
              "pl-10",
              showError && "border-destructive focus-visible:ring-destructive",
              className
            )}
            placeholder="0911 234 567"
            aria-label="Ethiopian phone number"
            aria-describedby={showError ? "phone-error" : undefined}
            aria-invalid={showError ? true : undefined}
          />
          {value && isValid(value) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg
                className="h-4 w-4 text-green-500"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          )}
        </div>
        {showError && (
          <p id="phone-error" className="text-xs text-destructive mt-1" role="alert">
            {validationMessage}
          </p>
        )}
        {isFocused && !showError && value.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Ethiopian format: 09XX XXX XXX
          </p>
        )}
      </div>
    )
  }
)

PhoneInput.displayName = "PhoneInput"

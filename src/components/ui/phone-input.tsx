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
 * Supports three formats:
 * 1. 09XX XXX XXX (mobile starting with 09)
 * 2. 07XX XXX XXX (mobile starting with 07)
 * 3. +251 9XX XXX XXX (international format for iOS)
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value, onChange, error, disabled, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)

    // Normalize phone number to local format (09XX or 07XX)
    const normalizePhone = (input: string): string => {
      // Remove all non-digit and non-plus characters
      let cleaned = input.replace(/[^\d+]/g, "")

      // Handle international format +251
      if (cleaned.startsWith("+251")) {
        // Convert +251 9XX XXX XXX to 09XX XXX XXX
        const withoutCountryCode = cleaned.substring(4) // Remove +251
        if (withoutCountryCode.startsWith("9")) {
          return "0" + withoutCountryCode.slice(0, 9) // 09 + 8 digits
        } else if (withoutCountryCode.startsWith("7")) {
          return "0" + withoutCountryCode.slice(0, 9) // 07 + 8 digits
        }
        return withoutCountryCode.slice(0, 10)
      } else if (cleaned.startsWith("251")) {
        // Handle 251 without +
        const withoutCountryCode = cleaned.substring(3)
        if (withoutCountryCode.startsWith("9")) {
          return "0" + withoutCountryCode.slice(0, 9)
        } else if (withoutCountryCode.startsWith("7")) {
          return "0" + withoutCountryCode.slice(0, 9)
        }
        return withoutCountryCode.slice(0, 10)
      }

      // Local format - limit to 10 digits
      return cleaned.slice(0, 10)
    }

    const formatPhoneNumber = (phone: string): string => {
      if (!phone) return ""

      // Format as: 09XX XXX XXX or 07XX XXX XXX
      if (phone.length <= 4) {
        return phone
      } else if (phone.length <= 7) {
        return `${phone.slice(0, 4)} ${phone.slice(4)}`
      } else {
        return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7, 10)}`
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value
      const normalized = normalizePhone(input)
      onChange(normalized)
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
      // Allow + sign only at the beginning
      if (e.key === "+" && e.currentTarget.selectionStart === 0) {
        return
      }
      // Ensure that it's a number and stop the keypress if not
      if ((e.shiftKey || e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault()
      }
    }

    const isValid = (phone: string): boolean => {
      // Valid if starts with 09 or 07 and has exactly 10 digits
      return /^0[79]\d{8}$/.test(phone)
    }

    const getValidationMessage = (): string | null => {
      if (!value) return null

      if (value.length < 10) {
        return `${10 - value.length} more digits needed`
      }

      if (!value.startsWith("09") && !value.startsWith("07")) {
        return "Must start with 09 or 07"
      }

      if (!isValid(value)) {
        return "Invalid phone number"
      }

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
            inputMode="tel"
            maxLength={14} // Accommodate formatted local number
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
            placeholder="0911 234 567 or +251 911 234 567"
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
          <p id="phone-error" className="text-xs text-destructive mt-1" role="alert" aria-live="polite">
            {validationMessage}
          </p>
        )}
        {isFocused && !showError && value.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Formats: 09XX XXX XXX, 07XX XXX XXX, or +251 9XX XXX XXX
          </p>
        )}
      </div>
    )
  }
)

PhoneInput.displayName = "PhoneInput"

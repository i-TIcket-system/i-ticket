/**
 * TIER 5 - ACCESSIBILITY ENHANCEMENTS
 * A11y utilities and components for better accessibility
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Eye, EyeOff, Type, Contrast, ZoomIn, ZoomOut, Volume2, Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/**
 * Accessibility Settings
 */
export interface A11ySettings {
  fontSize: 'small' | 'medium' | 'large' | 'x-large'
  highContrast: boolean
  reduceMotion: boolean
  screenReader: boolean
  keyboardOnly: boolean
}

/**
 * Accessibility Menu
 * Floating button with A11y settings
 */
export function AccessibilityMenu({
  settings,
  onSettingsChange,
}: {
  settings: A11ySettings
  onSettingsChange: (settings: A11ySettings) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  const fontSizeOptions: Array<{
    value: A11ySettings['fontSize']
    label: string
    scale: string
  }> = [
    { value: 'small', label: 'Small', scale: '90%' },
    { value: 'medium', label: 'Medium', scale: '100%' },
    { value: 'large', label: 'Large', scale: '110%' },
    { value: 'x-large', label: 'Extra Large', scale: '125%' },
  ]

  const handleFontSizeChange = (value: A11ySettings['fontSize']) => {
    onSettingsChange({ ...settings, fontSize: value })

    // Apply to document
    const root = document.documentElement
    const scale = fontSizeOptions.find(o => o.value === value)?.scale || '100%'
    root.style.fontSize = scale
  }

  const handleHighContrastChange = (enabled: boolean) => {
    onSettingsChange({ ...settings, highContrast: enabled })

    // Apply to document
    const root = document.documentElement
    if (enabled) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }
  }

  const handleReduceMotionChange = (enabled: boolean) => {
    onSettingsChange({ ...settings, reduceMotion: enabled })

    // Apply to document
    const root = document.documentElement
    if (enabled) {
      root.style.setProperty('--animation-duration', '0.01ms')
    } else {
      root.style.removeProperty('--animation-duration')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-20 right-6 z-40 h-14 w-14 rounded-full shadow-lg"
          aria-label="Accessibility Settings"
        >
          <Eye className="h-6 w-6" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Accessibility Settings
          </DialogTitle>
          <DialogDescription>
            Customize your viewing experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Font Size */}
          <div>
            <label className="text-sm font-medium mb-3 flex items-center gap-2">
              <Type className="h-4 w-4 text-primary" />
              Text Size
            </label>
            <div className="grid grid-cols-2 gap-2">
              {fontSizeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={settings.fontSize === option.value ? 'default' : 'outline'}
                  onClick={() => handleFontSizeChange(option.value)}
                  className="justify-start"
                >
                  {option.label}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {option.scale}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Contrast className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">High Contrast</p>
                <p className="text-xs text-muted-foreground">
                  Increase color contrast for better visibility
                </p>
              </div>
            </div>
            <Switch
              checked={settings.highContrast}
              onCheckedChange={handleHighContrastChange}
            />
          </div>

          {/* Reduce Motion */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Reduce Motion</p>
                <p className="text-xs text-muted-foreground">
                  Minimize animations and transitions
                </p>
              </div>
            </div>
            <Switch
              checked={settings.reduceMotion}
              onCheckedChange={handleReduceMotionChange}
            />
          </div>

          {/* Keyboard Navigation Help */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {/* Show keyboard shortcuts dialog */}}
            >
              <Keyboard className="h-4 w-4" />
              View Keyboard Shortcuts
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Skip to Content Link
 * Allows keyboard users to skip navigation
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
    >
      Skip to main content
    </a>
  )
}

/**
 * Screen Reader Only Text
 * Hidden text for screen readers
 */
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>
}

/**
 * Focus Trap
 * Traps focus within a component (for modals, dialogs)
 */
export function FocusTrap({
  children,
  enabled = true,
}: {
  children: React.ReactNode
  enabled?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    firstFocusable?.focus()

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [enabled])

  return <div ref={containerRef}>{children}</div>
}

/**
 * Keyboard Shortcut Indicator
 * Shows keyboard shortcut hint
 */
export function KeyboardShortcut({
  keys,
  description,
  className,
}: {
  keys: string[]
  description: string
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between gap-4 text-sm', className)}>
      <span className="text-muted-foreground">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <span key={index}>
            <kbd className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded">
              {key}
            </kbd>
            {index < keys.length - 1 && <span className="mx-1 text-muted-foreground">+</span>}
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * Keyboard Shortcuts Dialog
 * Lists all available keyboard shortcuts
 */
export function KeyboardShortcutsDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const shortcuts = [
    { keys: ['Tab'], description: 'Navigate forward through interactive elements' },
    { keys: ['Shift', 'Tab'], description: 'Navigate backward' },
    { keys: ['Enter'], description: 'Activate selected element' },
    { keys: ['Esc'], description: 'Close dialog or cancel action' },
    { keys: ['/', '?'], description: 'Open search' },
    { keys: ['Ctrl', 'K'], description: 'Quick search trips' },
    { keys: ['Alt', '1'], description: 'Go to home' },
    { keys: ['Alt', '2'], description: 'Go to bookings' },
    { keys: ['Alt', '3'], description: 'Go to tickets' },
    { keys: ['Alt', 'N'], description: 'Open notifications' },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your navigation with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((shortcut, index) => (
            <KeyboardShortcut
              key={index}
              keys={shortcut.keys}
              description={shortcut.description}
              className="p-3 rounded-lg hover:bg-muted transition-colors"
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Live Region for Screen Readers
 * Announces dynamic content changes
 */
export function LiveRegion({
  message,
  priority = 'polite',
}: {
  message: string
  priority?: 'polite' | 'assertive'
}) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  )
}

/**
 * Progress Announcer
 * Announces progress to screen readers
 */
export function ProgressAnnouncer({
  current,
  total,
  label,
}: {
  current: number
  total: number
  label: string
}) {
  const percentage = Math.round((current / total) * 100)

  return (
    <LiveRegion
      message={`${label}: ${current} of ${total} complete. ${percentage}%`}
      priority="polite"
    />
  )
}

/**
 * Landmark Regions Helper
 * Adds semantic landmark regions
 */
export function LandmarkRegions({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipToContent />
      <div id="main-content" role="main">
        {children}
      </div>
    </>
  )
}

/**
 * Focus Visible Indicator
 * Shows custom focus indicator
 */
export function FocusVisibleIndicator({ className }: { className?: string }) {
  return (
    <style jsx global>{`
      .focus-visible:focus {
        outline: 2px solid hsl(var(--primary));
        outline-offset: 2px;
        border-radius: 4px;
      }

      .focus-visible:focus:not(:focus-visible) {
        outline: none;
      }
    `}</style>
  )
}

/**
 * High Contrast Mode CSS
 * Styles for high contrast mode
 */
export function HighContrastStyles() {
  return (
    <style jsx global>{`
      .high-contrast {
        --background: 0 0% 0%;
        --foreground: 0 0% 100%;
        --card: 0 0% 10%;
        --card-foreground: 0 0% 100%;
        --primary: 180 100% 50%;
        --primary-foreground: 0 0% 0%;
        --border: 0 0% 50%;
        --input: 0 0% 50%;
      }

      .high-contrast * {
        border-width: 2px !important;
      }

      .high-contrast img {
        filter: contrast(1.2) brightness(1.1);
      }
    `}</style>
  )
}

/**
 * Text-to-Speech Button
 * Reads text aloud using Web Speech API
 */
export function TextToSpeechButton({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const [isSpeaking, setIsSpeaking] = useState(false)

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser')
      return
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.9
    utterance.pitch = 1

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleSpeak}
      className={cn('h-8 w-8', className)}
      aria-label={isSpeaking ? 'Stop reading' : 'Read aloud'}
    >
      <Volume2 className={cn('h-4 w-4', isSpeaking && 'text-primary animate-pulse')} />
    </Button>
  )
}

/**
 * Dyslexia-Friendly Font Toggle
 * Switches to OpenDyslexic font
 */
export function DyslexiaFriendlyToggle() {
  const [enabled, setEnabled] = useState(false)

  const handleToggle = () => {
    const root = document.documentElement
    if (enabled) {
      root.style.fontFamily = ''
    } else {
      // Load OpenDyslexic font (needs to be added to project)
      root.style.fontFamily = 'OpenDyslexic, sans-serif'
    }
    setEnabled(!enabled)
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Type className="h-4 w-4 text-primary" />
        <div>
          <p className="text-sm font-medium">Dyslexia-Friendly Font</p>
          <p className="text-xs text-muted-foreground">
            Use a font designed for readers with dyslexia
          </p>
        </div>
      </div>
      <Switch checked={enabled} onCheckedChange={handleToggle} />
    </div>
  )
}

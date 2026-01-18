/**
 * ENHANCED CARD COMPONENT - TIER 1
 * Card with glassmorphism and gradient borders
 * GLASSMORPHISM TRANSFORMATION - Extended with dramatic glass variants
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Apply glassmorphism effect
   * - true/false: Apply default glass-enhanced
   * - 'subtle': Light glass (90-85% opacity, 16px blur)
   * - 'moderate': Medium glass (80-70% opacity, 24px blur)
   * - 'dramatic': Heavy glass (75-65% opacity, 28px blur)
   * - 'teal': Teal-tinted dramatic glass
   * - 'dark': Dark glass for dark backgrounds
   */
  glass?: boolean | 'subtle' | 'moderate' | 'dramatic' | 'teal' | 'dark'

  /**
   * Ethiopian pattern background
   * - 'tilahun': Tilahun Weave pattern
   * - 'lalibela': Lalibela Windows pattern
   * - 'coffee': Coffee Ceremony pattern
   */
  ethiopianPattern?: 'tilahun' | 'lalibela' | 'coffee'

  /**
   * Ethiopian flag border accent
   * - true: Apply to top
   * - 'top' | 'bottom' | 'left' | 'right': Specific side
   */
  flagBorder?: boolean | 'top' | 'bottom' | 'left' | 'right'

  /**
   * Apply shimmer animation
   */
  shimmer?: boolean

  /**
   * Apply lift effect on hover
   */
  lift?: boolean

  /**
   * Show gradient border on hover
   */
  gradientBorder?: boolean

  /**
   * Make card interactive with hover effects
   */
  interactive?: boolean

  /**
   * Glow effect intensity (0-3)
   */
  glow?: 0 | 1 | 2 | 3
}

/**
 * Enhanced Card with glassmorphism, gradient borders, and hover effects
 *
 * @example
 * // Basic glassmorphism card
 * <EnhancedCard glass>Content</EnhancedCard>
 *
 * @example
 * // Dramatic glass with Ethiopian pattern
 * <EnhancedCard glass="dramatic" ethiopianPattern="tilahun" lift>Content</EnhancedCard>
 *
 * @example
 * // Teal glass with flag border and shimmer
 * <EnhancedCard glass="teal" flagBorder shimmer>Content</EnhancedCard>
 *
 * @example
 * // Interactive card with gradient border
 * <EnhancedCard interactive gradientBorder>Clickable content</EnhancedCard>
 *
 * @example
 * // Glassmorphism card with glow
 * <EnhancedCard glass glow={2}>Glowing content</EnhancedCard>
 */
export function EnhancedCard({
  className,
  glass = false,
  ethiopianPattern,
  flagBorder,
  shimmer = false,
  lift = false,
  gradientBorder = false,
  interactive = false,
  glow = 0,
  children,
  ...props
}: EnhancedCardProps) {
  // Determine glass variant
  const getGlassClass = () => {
    if (!glass) return null
    if (glass === true) return 'glass-enhanced' // Default
    return `glass-${glass}` // subtle, moderate, dramatic, teal, dark
  }

  // Determine Ethiopian pattern class
  const getPatternClass = () => {
    if (!ethiopianPattern) return null
    switch (ethiopianPattern) {
      case 'tilahun':
        return 'pattern-tilahun-weave'
      case 'lalibela':
        return 'pattern-lalibela-window'
      case 'coffee':
        return 'pattern-coffee-ceremony'
      default:
        return null
    }
  }

  // Determine flag border class
  const getFlagBorderClass = () => {
    if (!flagBorder) return null
    if (flagBorder === true) return 'glass-flag-top' // Default to top
    return `glass-flag-${flagBorder}`
  }

  return (
    <div
      className={cn(
        // Base styles
        'rounded-xl transition-all duration-300 relative',

        // Glassmorphism variants
        getGlassClass(),

        // Shimmer effect
        shimmer && 'glass-shimmer',

        // Lift effect
        lift && 'glass-lift',

        // Ethiopian pattern background
        getPatternClass(),

        // Ethiopian flag border
        getFlagBorderClass(),

        // Regular card (if not glass)
        !glass && 'bg-card border border-border',

        // Interactive effects
        interactive && 'card-interactive cursor-pointer',
        interactive && glass && 'glass-hover', // Use glass-hover if glass is enabled
        interactive && !glass && 'hover:shadow-2xl hover:shadow-primary/10',

        // Gradient border
        gradientBorder && 'overflow-hidden',
        gradientBorder && 'before:absolute before:inset-0 before:p-[2px] before:rounded-xl before:-z-10',
        gradientBorder && 'before:bg-gradient-to-br before:from-primary before:via-secondary before:to-primary',
        gradientBorder && 'before:opacity-0 before:transition-opacity before:duration-300',
        gradientBorder && 'hover:before:opacity-100',

        // Glow effects
        glow === 1 && 'shadow-lg shadow-primary/20',
        glow === 2 && 'shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40',
        glow === 3 && 'shadow-2xl shadow-primary/40 animate-glow-pulse',

        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Enhanced Card Header
 */
export function EnhancedCardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
}

/**
 * Enhanced Card Title
 */
export function EnhancedCardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
}

/**
 * Enhanced Card Description
 */
export function EnhancedCardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

/**
 * Enhanced Card Content
 */
export function EnhancedCardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />
}

/**
 * Enhanced Card Footer
 */
export function EnhancedCardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
}

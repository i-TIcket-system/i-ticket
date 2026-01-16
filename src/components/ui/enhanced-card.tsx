/**
 * ENHANCED CARD COMPONENT - TIER 1
 * Card with glassmorphism and gradient borders
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Apply glassmorphism effect
   */
  glass?: boolean

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
  gradientBorder = false,
  interactive = false,
  glow = 0,
  children,
  ...props
}: EnhancedCardProps) {
  return (
    <div
      className={cn(
        // Base styles
        'rounded-xl transition-all duration-300',

        // Glassmorphism
        glass && 'backdrop-blur-xl bg-white/70 dark:bg-background/70 border border-white/30 dark:border-white/10',
        glass && 'shadow-xl shadow-black/5',

        // Regular card (if not glass)
        !glass && 'bg-card border border-border',

        // Interactive effects
        interactive && 'card-interactive cursor-pointer',
        interactive && 'hover:shadow-2xl hover:shadow-primary/10',

        // Gradient border
        gradientBorder && 'relative overflow-hidden',
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

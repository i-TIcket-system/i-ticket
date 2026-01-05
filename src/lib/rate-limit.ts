/**
 * Simple in-memory rate limiter
 * For production, consider using Redis-based rate limiting (@upstash/ratelimit)
 */

interface RateLimitRecord {
  count: number
  resetTime: number
}

class RateLimiter {
  private store = new Map<string, RateLimitRecord>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired records every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, record] of Array.from(this.store.entries())) {
        if (now > record.resetTime) {
          this.store.delete(key)
        }
      }
    }, 60000)
  }

  /**
   * Check if request is within rate limit
   * @param identifier - Unique identifier (IP, phone, email, etc.)
   * @param maxRequests - Maximum requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns true if allowed, false if rate limited
   */
  check(identifier: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now()
    const record = this.store.get(identifier)

    if (!record || now > record.resetTime) {
      // First request or window expired, create new record
      this.store.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      })
      return true
    }

    if (record.count >= maxRequests) {
      // Rate limit exceeded
      return false
    }

    // Increment count
    record.count++
    return true
  }

  /**
   * Get remaining requests for identifier
   */
  getRemaining(identifier: string, maxRequests: number): number {
    const record = this.store.get(identifier)
    if (!record || Date.now() > record.resetTime) {
      return maxRequests
    }
    return Math.max(0, maxRequests - record.count)
  }

  /**
   * Reset rate limit for identifier (useful for testing)
   */
  reset(identifier: string): void {
    this.store.delete(identifier)
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.store.clear()
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
  }
}

// Singleton instance
const globalRateLimiter = new RateLimiter()

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Authentication endpoints
  LOGIN: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  REGISTER: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  FORGOT_PASSWORD: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour

  // Booking endpoints
  CREATE_BOOKING: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 bookings per minute

  // Payment endpoints
  PROCESS_PAYMENT: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 payments per minute

  // Support endpoints
  CREATE_TICKET: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 tickets per hour

  // General API
  API_DEFAULT: { maxRequests: 60, windowMs: 60 * 1000 }, // 60 requests per minute

  // Webhooks (more restrictive)
  WEBHOOK: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 callbacks per minute
}

/**
 * Apply rate limiting to a request
 * @param identifier - Unique identifier (IP, phone, email)
 * @param config - Rate limit configuration
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: { maxRequests: number; windowMs: number }
): boolean {
  return globalRateLimiter.check(identifier, config.maxRequests, config.windowMs)
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a default (should not happen in production)
  return 'unknown'
}

/**
 * Enhanced rate limiting: Check BOTH IP and user-based limits
 * Prevents attacks using multiple IPs
 *
 * @param request - HTTP request
 * @param userId - Optional user ID for user-based limiting
 * @param config - Rate limit configuration
 * @returns true if allowed, false if rate limited
 */
export function checkEnhancedRateLimit(
  request: Request,
  userId: string | null | undefined,
  config: { maxRequests: number; windowMs: number }
): boolean {
  // Check 1: IP-based rate limiting
  const ip = getClientIdentifier(request)
  const ipAllowed = globalRateLimiter.check(
    `ip:${ip}`,
    config.maxRequests,
    config.windowMs
  )

  if (!ipAllowed) {
    return false
  }

  // Check 2: User-based rate limiting (if authenticated)
  if (userId) {
    const userAllowed = globalRateLimiter.check(
      `user:${userId}`,
      config.maxRequests,
      config.windowMs
    )

    if (!userAllowed) {
      return false
    }
  }

  return true
}

/**
 * Per-booking rate limiting (prevent payment spam on single booking)
 *
 * @param bookingId - Booking ID
 * @param maxAttempts - Maximum payment attempts allowed
 * @param windowMs - Time window
 * @returns true if allowed, false if rate limited
 */
export function checkBookingRateLimit(
  bookingId: string,
  maxAttempts: number = 3,
  windowMs: number = 60 * 60 * 1000 // 1 hour
): boolean {
  return globalRateLimiter.check(
    `booking:${bookingId}`,
    maxAttempts,
    windowMs
  )
}

/**
 * Helper function to create rate limit error response
 */
export function rateLimitExceeded(retryAfter: number = 60) {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
      retryAfter
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString()
      }
    }
  )
}

export default globalRateLimiter

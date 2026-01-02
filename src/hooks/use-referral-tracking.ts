"use client"

import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"

const COOKIE_NAME = "iticket_ref"
const VISITOR_ID_KEY = "iticket_visitor_id"
const COOKIE_DURATION_DAYS = 90

/**
 * Get or create a persistent visitor ID
 * This ID stays the same forever for this browser/device
 */
function getOrCreateVisitorId(): string {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY)

  if (!visitorId) {
    // Generate a unique ID that persists forever
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    localStorage.setItem(VISITOR_ID_KEY, visitorId)
  }

  return visitorId
}

/**
 * Generate a visitor hash for deduplication
 * Uses persistent visitor ID + device info
 */
async function generateVisitorHash(): Promise<string> {
  const visitorId = getOrCreateVisitorId()

  const data = [
    visitorId,
    navigator.userAgent,
    screen.width.toString(),
    screen.height.toString(),
  ].join('|')

  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32)
}

/**
 * Get device type from user agent
 */
function getDeviceType(): string {
  const ua = navigator.userAgent
  if (/iPad|Tablet/i.test(ua)) return 'TABLET'
  if (/Mobile|Android|iPhone/i.test(ua)) return 'MOBILE'
  return 'DESKTOP'
}

/**
 * Get browser name from user agent
 */
function getBrowserName(): string {
  const ua = navigator.userAgent
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return 'Chrome'
  if (/Firefox/i.test(ua)) return 'Firefox'
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari'
  if (/Edg/i.test(ua)) return 'Edge'
  if (/Opera|OPR/i.test(ua)) return 'Opera'
  return 'Unknown'
}

/**
 * Get OS name from user agent
 */
function getOSName(): string {
  const ua = navigator.userAgent
  if (/Windows/i.test(ua)) return 'Windows'
  if (/Mac/i.test(ua)) return 'macOS'
  if (/Android/i.test(ua)) return 'Android'
  if (/iPhone|iPad|iOS/i.test(ua)) return 'iOS'
  if (/Linux/i.test(ua)) return 'Linux'
  return 'Unknown'
}

/**
 * Set a cookie with the referral code
 */
function setReferralCookie(code: string): void {
  const expires = new Date()
  expires.setDate(expires.getDate() + COOKIE_DURATION_DAYS)
  document.cookie = `${COOKIE_NAME}=${code}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

/**
 * Get the referral code from cookie
 */
export function getReferralCode(): string | null {
  if (typeof document === 'undefined') return null

  const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`))
  if (match) return match[2]

  // Fallback to localStorage
  return localStorage.getItem(COOKIE_NAME)
}

/**
 * Track the QR scan via API
 */
async function trackScan(referralCode: string): Promise<void> {
  try {
    const visitorHash = await generateVisitorHash()

    await fetch('/api/track/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referralCode,
        visitorHash,
        deviceInfo: {
          type: getDeviceType(),
          browser: getBrowserName(),
          os: getOSName(),
        },
        landingPage: window.location.pathname,
        referrerUrl: document.referrer || undefined,
      }),
    })
  } catch (error) {
    // Silently fail - tracking shouldn't block user experience
    console.error('Failed to track scan:', error)
  }
}

/**
 * Hook to detect and track referral codes from URL
 * Usage: Call this hook in your root layout or main page component
 *
 * IMPORTANT: First-come attribution - if user already has a referral,
 * new referral codes are ignored. The first sales person keeps the credit.
 */
export function useReferralTracking(): void {
  const searchParams = useSearchParams()
  const hasTracked = useRef(false)

  useEffect(() => {
    if (hasTracked.current) return

    const newRefCode = searchParams.get('ref')
    if (!newRefCode) return

    hasTracked.current = true

    // FIRST-COME ATTRIBUTION: Check if user already has a referral
    const existingRefCode = getReferralCode()

    if (existingRefCode) {
      // User already attributed to another sales person - don't overwrite
      // Just clean the URL and exit
      const url = new URL(window.location.href)
      url.searchParams.delete('ref')
      window.history.replaceState({}, '', url.pathname + url.search)
      return
    }

    // New referral - store and track
    setReferralCookie(newRefCode)
    localStorage.setItem(COOKIE_NAME, newRefCode)
    localStorage.setItem(`${COOKIE_NAME}_time`, Date.now().toString())

    // Track the scan
    trackScan(newRefCode)

    // Clean URL (remove ?ref= from address bar)
    const url = new URL(window.location.href)
    url.searchParams.delete('ref')
    window.history.replaceState({}, '', url.pathname + url.search)
  }, [searchParams])
}

/**
 * Clear the referral tracking (for testing/debugging)
 */
export function clearReferralTracking(): void {
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  localStorage.removeItem(COOKIE_NAME)
  localStorage.removeItem(`${COOKIE_NAME}_time`)
}

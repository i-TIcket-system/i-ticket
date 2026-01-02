import prisma from "../db"
import QRCode from "qrcode"

/**
 * Generate a referral code from a name
 * Format: Name letters (uppercase, 3-5 chars) + 2-3 random digits
 * Examples: "Abel Tadesse" -> "ABEL23", "Abi" -> "ABI123", "Ayu" -> "AYU45"
 */
export function generateReferralCode(name: string): string {
  // Get alphabetic characters only
  const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase()

  // Use 3-5 letters from name (depending on length)
  const nameLength = Math.min(Math.max(cleanName.length, 3), 5)
  const namePrefix = cleanName.substring(0, nameLength).padEnd(3, 'X')

  // Add random digits (more digits for shorter names to ensure uniqueness)
  const digitCount = namePrefix.length <= 3 ? 3 : 2
  const minDigit = Math.pow(10, digitCount - 1)
  const maxDigit = Math.pow(10, digitCount) - 1
  const randomDigits = Math.floor(minDigit + Math.random() * (maxDigit - minDigit + 1))

  return `${namePrefix}${randomDigits}`
}

/**
 * Generate a unique referral code that doesn't exist in the database
 */
export async function generateUniqueReferralCode(name: string): Promise<string> {
  let code = generateReferralCode(name)
  let attempts = 0

  while (attempts < 10) {
    const existing = await prisma.salesPerson.findUnique({
      where: { referralCode: code }
    })

    if (!existing) return code

    // Try with different random numbers
    code = generateReferralCode(name)
    attempts++
  }

  // Fallback: use timestamp-based suffix
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4)
  return `${name.substring(0, 2).toUpperCase()}${timestamp}`
}

/**
 * Generate QR code data URL for a referral code
 */
export async function generateSalesPersonQR(referralCode: string): Promise<string> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const referralUrl = `${baseUrl}/?ref=${referralCode}`

  const qrDataUrl = await QRCode.toDataURL(referralUrl, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H' // High error correction for printed flyers
  })

  return qrDataUrl
}

/**
 * Get referral URL for a sales person
 */
export function getReferralUrl(referralCode: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return `${baseUrl}/?ref=${referralCode}`
}

/**
 * Parse device info from user agent string
 */
export function parseDeviceInfo(userAgent: string): {
  deviceType: string
  browser: string
  os: string
} {
  let deviceType = 'DESKTOP'
  if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
    deviceType = /iPad|Tablet/i.test(userAgent) ? 'TABLET' : 'MOBILE'
  }

  let browser = 'Unknown'
  if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) browser = 'Chrome'
  else if (/Firefox/i.test(userAgent)) browser = 'Firefox'
  else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari'
  else if (/Edg/i.test(userAgent)) browser = 'Edge'
  else if (/Opera|OPR/i.test(userAgent)) browser = 'Opera'

  let os = 'Unknown'
  if (/Windows/i.test(userAgent)) os = 'Windows'
  else if (/Mac/i.test(userAgent)) os = 'macOS'
  else if (/Linux/i.test(userAgent) && !/Android/i.test(userAgent)) os = 'Linux'
  else if (/Android/i.test(userAgent)) os = 'Android'
  else if (/iPhone|iPad|iOS/i.test(userAgent)) os = 'iOS'

  return { deviceType, browser, os }
}

/**
 * Calculate sales commission (5% of platform's 5%)
 */
export function calculateSalesCommission(
  ticketAmount: number,
  platformCommissionRate: number = 0.05
): {
  platformCommission: number
  salesCommission: number
} {
  const platformCommission = ticketAmount * platformCommissionRate
  const salesCommission = platformCommission * 0.05 // 5% of platform's 5%

  return {
    platformCommission: Math.round(platformCommission * 100) / 100,
    salesCommission: Math.round(salesCommission * 100) / 100
  }
}

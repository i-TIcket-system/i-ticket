/**
 * Commission and VAT Calculation Utilities
 *
 * Ethiopian tax law requires 15% VAT on service fees (platform commission)
 *
 * Platform commission structure:
 * - Base commission: 5% of ticket price
 * - VAT on commission: 15% of commission
 * - Total commission: commission + VAT
 */

export const COMMISSION_RATE = 0.05 // 5% platform commission
export const VAT_RATE = 0.15 // 15% Ethiopian VAT

export interface CommissionBreakdown {
  baseCommission: number // 5% of totalAmount
  vat: number // 15% of baseCommission
  totalCommission: number // baseCommission + vat
}

/**
 * Calculate commission breakdown for a booking
 * @param ticketPrice - Base ticket price (price * passengers) - what company receives
 * @returns Commission breakdown with base commission, VAT, and total
 *
 * Example: For 850 ETB ticket
 * - baseCommission = 850 * 0.05 = 42.5 ETB (exact)
 * - vat = 42.5 * 0.15 = 6.375 ETB (exact)
 * - totalCommission = 48.875 ETB (exact)
 * - Passenger pays = 850 + 48.875 = 898.875 ETB
 */
export function calculateCommission(ticketPrice: number): CommissionBreakdown {
  // Don't round intermediate calculations - keep exact values for accuracy
  const baseCommission = ticketPrice * COMMISSION_RATE
  const vat = baseCommission * VAT_RATE
  const totalCommission = baseCommission + vat

  return {
    baseCommission,  // e.g., 42.5 (exact)
    vat,  // e.g., 6.375 (exact)
    totalCommission,  // e.g., 48.875 (exact)
  }
}

/**
 * Calculate booking amounts for passenger payment
 * Passengers pay: ticket price + commission + VAT
 * @param ticketPrice - Base ticket price per passenger
 * @param passengerCount - Number of passengers
 * @returns Complete breakdown of what passenger pays
 */
export function calculateBookingAmounts(
  ticketPrice: number,
  passengerCount: number
): {
  ticketTotal: number // What company receives (ticket price × passengers)
  commission: CommissionBreakdown // Platform commission + VAT
  totalAmount: number // What passenger pays (ticket + commission + VAT) - ROUNDED for easy payment
} {
  const ticketTotal = ticketPrice * passengerCount
  const commission = calculateCommission(ticketTotal)
  // Keep exact amount - ETB has cents (santim), rounding loses money
  // Round to 2 decimal places to avoid floating point issues (e.g., 3172.4999999 → 3172.50)
  const rawTotal = ticketTotal + commission.totalCommission
  const totalAmount = Math.round(rawTotal * 100) / 100

  return {
    ticketTotal,
    commission,
    totalAmount, // Passenger pays this - exact amount with cents
  }
}

/**
 * Calculate company revenue from a booking
 * Company receives the ticket price; platform receives commission + VAT
 * @param ticketPrice - Base ticket price (what company gets)
 * @param totalAmount - Total amount passenger paid (ticket + commission + VAT)
 * @returns Revenue breakdown
 */
export function calculateCompanyRevenue(ticketPrice: number, totalAmount: number): {
  ticketPrice: number // What company receives
  totalAmount: number // What passenger paid
  commission: CommissionBreakdown // What platform receives
} {
  const commission = calculateCommission(ticketPrice)

  return {
    ticketPrice, // Company gets the full ticket price
    totalAmount, // Passenger paid ticket + commission + VAT
    commission, // Platform gets commission + VAT
  }
}

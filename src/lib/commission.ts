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
 */
export function calculateCommission(ticketPrice: number): CommissionBreakdown {
  const baseCommission = Math.round(ticketPrice * COMMISSION_RATE)
  const vat = Math.round(baseCommission * VAT_RATE)
  const totalCommission = baseCommission + vat

  return {
    baseCommission,
    vat,
    totalCommission,
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
  totalAmount: number // What passenger pays (ticket + commission + VAT)
} {
  const ticketTotal = ticketPrice * passengerCount
  const commission = calculateCommission(ticketTotal)
  const totalAmount = ticketTotal + commission.totalCommission

  return {
    ticketTotal,
    commission,
    totalAmount, // Passenger pays this (ticket + commission + VAT)
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

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
 * @param totalAmount - Total booking amount (price * passengers)
 * @returns Commission breakdown with base commission, VAT, and total
 */
export function calculateCommission(totalAmount: number): CommissionBreakdown {
  const baseCommission = Math.round(totalAmount * COMMISSION_RATE)
  const vat = Math.round(baseCommission * VAT_RATE)
  const totalCommission = baseCommission + vat

  return {
    baseCommission,
    vat,
    totalCommission,
  }
}

/**
 * Calculate total amount customer pays (ticket price + commission with VAT)
 * Use this when platform fee is passed to customer
 * @param ticketPrice - Base ticket price
 * @param passengerCount - Number of passengers
 * @returns Total amount including commission and VAT
 */
export function calculateTotalWithCommission(
  ticketPrice: number,
  passengerCount: number
): {
  ticketTotal: number
  commission: CommissionBreakdown
  grandTotal: number
} {
  const ticketTotal = ticketPrice * passengerCount
  const commission = calculateCommission(ticketTotal)

  return {
    ticketTotal,
    commission,
    grandTotal: ticketTotal + commission.totalCommission,
  }
}

/**
 * Calculate net revenue for bus company (after platform commission + VAT)
 * @param totalAmount - Total booking amount
 * @returns Net amount company receives
 */
export function calculateCompanyRevenue(totalAmount: number): {
  totalAmount: number
  commission: CommissionBreakdown
  netToCompany: number
} {
  const commission = calculateCommission(totalAmount)
  const netToCompany = totalAmount - commission.totalCommission

  return {
    totalAmount,
    commission,
    netToCompany,
  }
}

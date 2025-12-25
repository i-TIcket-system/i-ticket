import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-ET', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}min`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}min`
}

export function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function calculateCommission(amount: number): number {
  return amount * 0.05 // 5% commission
}

export function getSlotsPercentage(available: number, total: number): number {
  return Math.round((available / total) * 100)
}

export function isLowSlots(available: number, total: number): boolean {
  return getSlotsPercentage(available, total) <= 10
}

export const ETHIOPIAN_CITIES = [
  'Addis Ababa',
  'Bahir Dar',
  'Gondar',
  'Mekelle',
  'Hawassa',
  'Dire Dawa',
  'Jimma',
  'Dessie',
  'Adama',
  'Harar',
  'Arba Minch',
  'Axum',
  'Lalibela',
  'Debre Markos',
  'Nekemte',
  'Gambela',
  'Assosa',
  'Semera',
  'Jijiga',
  'Sodo',
]

export const BUS_TYPES = [
  { value: 'standard', label: 'Standard', description: 'Basic comfortable seats' },
  { value: 'vip', label: 'VIP', description: 'Extra legroom, reclining seats' },
  { value: 'luxury', label: 'Luxury', description: 'Premium seats, refreshments included' },
]

/**
 * Get next available seat numbers for a trip
 * @param tripId - ID of the trip
 * @param count - Number of seats needed
 * @param totalSlots - Total slots in the trip
 * @param tx - Prisma transaction client
 * @returns Array of available seat numbers
 */
export async function getAvailableSeatNumbers(
  tripId: string,
  count: number,
  totalSlots: number,
  tx: any
): Promise<number[]> {
  // Get all occupied seats for this trip
  const occupiedPassengers = await tx.passenger.findMany({
    where: {
      booking: {
        tripId,
        status: {
          not: "CANCELLED"
        }
      },
      seatNumber: {
        not: null
      }
    },
    select: {
      seatNumber: true
    }
  })

  const occupiedSeats = new Set(
    occupiedPassengers
      .map((p: any) => p.seatNumber)
      .filter((seat: number | null): seat is number => seat !== null)
  )

  // Find available seats
  const availableSeats: number[] = []
  for (let seat = 1; seat <= totalSlots; seat++) {
    if (!occupiedSeats.has(seat)) {
      availableSeats.push(seat)
      if (availableSeats.length === count) {
        break
      }
    }
  }

  if (availableSeats.length < count) {
    throw new Error("Not enough seats available")
  }

  return availableSeats
}

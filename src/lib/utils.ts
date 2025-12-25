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

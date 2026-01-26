/**
 * Message Formatters for Telegram Bot
 * Utilities for formatting data into user-friendly messages
 */

import { Language } from "../messages";

// Ethiopia timezone
const ETHIOPIA_TIMEZONE = "Africa/Addis_Ababa";

/**
 * Format currency (ETB)
 */
export function formatCurrency(amount: number): string {
  return `${amount.toFixed(2)} ETB`;
}

/**
 * Format date for display (in Ethiopia timezone)
 */
export function formatDate(date: Date | string, lang: Language = "EN"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat(lang === "AM" ? "am-ET" : "en-ET", {
    dateStyle: "medium",
    timeZone: ETHIOPIA_TIMEZONE,
  }).format(dateObj);
}

/**
 * Format time for display (in Ethiopia timezone)
 */
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat("en-ET", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: ETHIOPIA_TIMEZONE,
  }).format(dateObj);
}

/**
 * Format date and time for display (in Ethiopia timezone)
 */
export function formatDateTime(date: Date | string, lang: Language = "EN"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat(lang === "AM" ? "am-ET" : "en-ET", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: ETHIOPIA_TIMEZONE,
  }).format(dateObj);
}

/**
 * Format trip duration
 * @param minutes - Duration in minutes (as stored in database)
 */
export function formatDuration(minutes: number, lang: Language = "EN"): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (lang === "AM") {
    return m > 0 ? `${h} ሰዓት ${m} ደቂቃ` : `${h} ሰዓት`;
  }

  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Format seat numbers (e.g., "1, 2, 3" or "1-3")
 */
export function formatSeats(seats: number[]): string {
  if (seats.length === 0) return "-";
  if (seats.length === 1) return seats[0].toString();

  // Check if consecutive
  const sorted = [...seats].sort((a, b) => a - b);
  let isConsecutive = true;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) {
      isConsecutive = false;
      break;
    }
  }

  if (isConsecutive) {
    return `${sorted[0]}-${sorted[sorted.length - 1]}`;
  }

  return sorted.join(", ");
}

/**
 * Format passenger list for confirmation
 */
export function formatPassengerList(
  passengers: Array<{
    name: string;
    seatNumber?: number | null;
  }>,
  lang: Language = "EN"
): string {
  return passengers
    .map((p, i) => {
      const seat = p.seatNumber ? ` (${lang === "EN" ? "Seat" : "መቀመጫ"} ${p.seatNumber})` : "";
      return `${i + 1}. ${p.name}${seat}`;
    })
    .join("\n");
}

/**
 * Format booking status
 */
export function formatBookingStatus(status: string, lang: Language = "EN"): string {
  const statusMap: Record<string, { EN: string; AM: string }> = {
    PENDING: { EN: "⏳ Pending Payment", AM: "⏳ ክፍያ በመጠባበቅ ላይ" },
    PAID: { EN: "✅ Confirmed", AM: "✅ ተረጋግጧል" },
    CANCELLED: { EN: "❌ Cancelled", AM: "❌ ተሰርዟል" },
    COMPLETED: { EN: "✓ Completed", AM: "✓ ተጠናቋል" },
  };

  return statusMap[status]?.[lang] || status;
}

/**
 * Format trip status
 */
export function formatTripStatus(status: string, lang: Language = "EN"): string {
  const statusMap: Record<string, { EN: string; AM: string }> = {
    SCHEDULED: { EN: "📅 Scheduled", AM: "📅 ታቅዷል" },
    BOARDING: { EN: "🚌 Boarding", AM: "🚌 መሳፈር" },
    DEPARTED: { EN: "🛣️ Departed", AM: "🛣️ ተነስቷል" },
    COMPLETED: { EN: "✓ Completed", AM: "✓ ተጠናቋል" },
    CANCELLED: { EN: "❌ Cancelled", AM: "❌ ተሰርዟል" },
  };

  return statusMap[status]?.[lang] || status;
}

/**
 * Format bus type
 */
export function formatBusType(busType: string, lang: Language = "EN"): string {
  const typeMap: Record<string, { EN: string; AM: string }> = {
    MINI: { EN: "Mini Bus", AM: "ትንሽ አውቶቡስ" },
    STANDARD: { EN: "Standard Bus", AM: "መደበኛ አውቶቡስ" },
    LUXURY: { EN: "Luxury Bus", AM: "ቅንጦተኛ አውቶቡስ" },
  };

  return typeMap[busType]?.[lang] || busType;
}

/**
 * Format amenities list
 */
export function formatAmenities(hasWater: boolean, hasFood: boolean, lang: Language = "EN"): string {
  const amenities: string[] = [];

  if (hasWater) {
    amenities.push(lang === "EN" ? "💧 Water" : "💧 ውሃ");
  }

  if (hasFood) {
    amenities.push(lang === "EN" ? "🍽️ Food" : "🍽️ ምግብ");
  }

  if (amenities.length === 0) {
    return lang === "EN" ? "No amenities" : "ምንም አገልግሎቶች የሉም";
  }

  return amenities.join(" • ");
}

/**
 * Format route (origin → destination)
 */
export function formatRoute(origin: string, destination: string): string {
  return `${origin} → ${destination}`;
}

/**
 * Format payment breakdown for booking confirmation
 */
export function formatPaymentBreakdown(
  ticketTotal: number,
  commission: number,
  vat: number,
  lang: Language = "EN"
): string {
  const total = ticketTotal + commission + vat;

  if (lang === "AM") {
    return `የትኬት ድምር: ${formatCurrency(ticketTotal)}
የአገልግሎት ክፍያ: ${formatCurrency(commission)}
ተ.እ.ታ (15%): ${formatCurrency(vat)}
━━━━━━━━━━━━━━━━━
*ድምር: ${formatCurrency(total)}*`;
  }

  return `Ticket Total: ${formatCurrency(ticketTotal)}
Service Charge: ${formatCurrency(commission)}
VAT (15%): ${formatCurrency(vat)}
━━━━━━━━━━━━━━━━━
*TOTAL: ${formatCurrency(total)}*`;
}

/**
 * Escape markdown special characters (for Telegram MarkdownV2)
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Format phone number (Ethiopian format)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, "");

  // Format as 09XX XXX XXX
  if (digits.length === 10 && digits.startsWith("09")) {
    return `${digits.substring(0, 4)} ${digits.substring(4, 7)} ${digits.substring(7)}`;
  }

  return phone;
}

/**
 * Format booking summary for confirmation message
 */
export function formatBookingSummary(
  booking: {
    company: string;
    origin: string;
    destination: string;
    departureTime: Date | string;
    passengerCount: number;
    passengers: Array<{ name: string; seatNumber?: number | null }>;
    ticketTotal: number;
    commission: number;
    vat: number;
  },
  lang: Language = "EN"
): string {
  const total = booking.ticketTotal + booking.commission + booking.vat;

  if (lang === "AM") {
    return `🚌 ${booking.company}
📍 ${formatRoute(booking.origin, booking.destination)}
📅 ${formatDateTime(booking.departureTime, lang)}

👥 *ተሳፋሪዎች (${booking.passengerCount}):*
${formatPassengerList(booking.passengers, lang)}

💰 *የክፍያ ዝርዝር:*
${formatPaymentBreakdown(booking.ticketTotal, booking.commission, booking.vat, lang)}`;
  }

  return `🚌 ${booking.company}
📍 ${formatRoute(booking.origin, booking.destination)}
📅 ${formatDateTime(booking.departureTime, lang)}

👥 *Passengers (${booking.passengerCount}):*
${formatPassengerList(booking.passengers, lang)}

💰 *Payment Breakdown:*
${formatPaymentBreakdown(booking.ticketTotal, booking.commission, booking.vat, lang)}`;
}

/**
 * Format trip card for search results
 * Handles both string company names and company objects
 */
export function formatTripCard(
  trip: {
    company: string | { name: string };
    origin: string;
    destination: string;
    departureTime: Date | string;
    estimatedDuration?: number;
    price: number;
    availableSlots: number;
    busType?: string;
    hasWater?: boolean;
    hasFood?: boolean;
  },
  lang: Language = "EN"
): string {
  // Handle company as string or object
  const companyName = typeof trip.company === "string" ? trip.company : trip.company.name;

  // Handle optional fields with defaults
  const duration = trip.estimatedDuration ?? 0;
  const busType = trip.busType ?? "STANDARD";
  const hasWater = trip.hasWater ?? false;
  const hasFood = trip.hasFood ?? false;

  // Build duration string only if duration is available
  const durationStr = duration > 0 ? ` • ${formatDuration(duration, lang)}` : "";

  // Build amenities string only if any amenities exist
  const amenitiesStr = (hasWater || hasFood) ? `\n${formatAmenities(hasWater, hasFood, lang)}` : "";

  if (lang === "AM") {
    return `🚌 *${companyName}*

📍 ${formatRoute(trip.origin, trip.destination)}
🕐 ${formatTime(trip.departureTime)}${durationStr}
💺 ${trip.availableSlots} መቀመጫዎች አሉ
🚌 ${formatBusType(busType, lang)}${amenitiesStr}

💰 *ዋጋ:* ${formatCurrency(trip.price)} በአንድ ሰው`;
  }

  return `🚌 *${companyName}*

📍 ${formatRoute(trip.origin, trip.destination)}
🕐 ${formatTime(trip.departureTime)}${durationStr}
💺 ${trip.availableSlots} seats available
🚌 ${formatBusType(busType, lang)}${amenitiesStr}

💰 *Price:* ${formatCurrency(trip.price)} per person`;
}

/**
 * Format error message
 */
export function formatError(error: string, lang: Language = "EN"): string {
  return `❌ ${error}`;
}

/**
 * Format success message
 */
export function formatSuccess(message: string): string {
  return `✅ ${message}`;
}

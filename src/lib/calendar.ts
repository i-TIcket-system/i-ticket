/**
 * Generate iCalendar (.ics) file content for trip booking
 * Compatible with Google Calendar, Apple Calendar, Outlook, etc.
 */

interface CalendarEvent {
  tripId: string
  origin: string
  destination: string
  departureTime: Date
  estimatedDuration: number // in minutes
  companyName: string
  passengerNames: string[]
  seatNumbers: number[]
  bookingId: string
}

export function generateICSFile(event: CalendarEvent): string {
  const {
    origin,
    destination,
    departureTime,
    estimatedDuration,
    companyName,
    passengerNames,
    seatNumbers,
    bookingId,
  } = event

  // Calculate end time
  const endTime = new Date(departureTime.getTime() + estimatedDuration * 60000)

  // Format dates for iCal (YYYYMMDDTHHMMSSZ)
  const formatICalDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
  }

  const dtStart = formatICalDate(departureTime)
  const dtEnd = formatICalDate(endTime)
  const dtStamp = formatICalDate(new Date())

  // Create description with passenger details
  const passengerList = passengerNames
    .map((name, i) => `${name} - Seat ${seatNumbers[i]}`)
    .join("\\n")

  const description = `Bus trip from ${origin} to ${destination}\\n\\nCompany: ${companyName}\\nBooking ID: ${bookingId}\\n\\nPassengers:\\n${passengerList}\\n\\nPlease arrive 15-20 minutes before departure.`

  const location = `${origin}, Ethiopia`
  const summary = `${companyName} - ${origin} to ${destination}`

  // Generate ICS content
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//i-Ticket//Bus Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:i-Ticket Bus Trip",
    "X-WR-TIMEZONE:Africa/Addis_Ababa",
    "BEGIN:VEVENT",
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `DTSTAMP:${dtStamp}`,
    `UID:iticket-${bookingId}@i-ticket.et`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H", // Alert 2 hours before
    "DESCRIPTION:Your bus departs in 2 hours! Don't forget your ticket.",
    "ACTION:DISPLAY",
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT24H", // Alert 1 day before
    "DESCRIPTION:Bus trip tomorrow! ${origin} to ${destination}",
    "ACTION:DISPLAY",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")

  return icsContent
}

/**
 * Trigger download of ICS file in browser
 */
export function downloadICSFile(icsContent: string, filename: string) {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

/**
 * Format event name for file download
 */
export function getICSFilename(origin: string, destination: string, date: Date): string {
  const dateStr = date.toISOString().split("T")[0]
  return `iTicket-${origin}-${destination}-${dateStr}.ics`.replace(/\s/g, "-")
}

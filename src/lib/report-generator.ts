import ExcelJS from "exceljs"
import prisma from "./db"
import { formatCurrency, formatDate } from "./utils"

/**
 * Generate professional passenger manifest Excel file
 * Optimized for landscape A4 printing with letterhead and color theme
 */
export async function generatePassengerManifest(tripId: string): Promise<Buffer> {
  // Fetch all trip data with paid bookings
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      company: true,
      bookings: {
        where: { status: "PAID" },
        include: {
          passengers: true,
          user: {
            select: { name: true, phone: true }
          },
          tickets: {
            select: { shortCode: true }
          }
        },
        orderBy: { createdAt: "asc" }
      }
    }
  })

  if (!trip) {
    throw new Error("Trip not found")
  }

  // Create workbook with landscape orientation
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "i-Ticket Platform"
  workbook.created = new Date()
  workbook.company = "i-Ticket Ethiopia"

  const sheet = workbook.addWorksheet("Passenger Manifest", {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      margins: {
        left: 0.5,
        right: 0.5,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3
      }
    },
    views: [{ showGridLines: false }]
  })

  // Color Theme
  const colors = {
    primary: "FF018790",      // i-Ticket teal
    primaryDark: "FF016670",  // Darker teal
    header: "FF018790",       // Teal header
    lightGray: "FFF5F5F5",    // Light background
    white: "FFFFFFFF",
    darkGray: "FF333333",
    success: "FF22C55E",      // Green
    warning: "FFFBBF24",      // Yellow
  }

  let currentRow = 1

  // ============================================
  // LETTERHEAD / HEADER SECTION
  // ============================================

  // Company Logo Area (merged cells)
  sheet.mergeCells(`A${currentRow}:B${currentRow + 2}`)
  const logoCell = sheet.getCell(`A${currentRow}`)
  logoCell.value = "i-TICKET"
  logoCell.font = { bold: true, size: 24, color: { argb: colors.primary } }
  logoCell.alignment = { vertical: "middle", horizontal: "center" }
  logoCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.lightGray } }

  // Document Title
  sheet.mergeCells(`C${currentRow}:K${currentRow}`)
  const titleCell = sheet.getCell(`C${currentRow}`)
  titleCell.value = "PASSENGER MANIFEST"
  titleCell.font = { bold: true, size: 20, color: { argb: colors.darkGray } }
  titleCell.alignment = { vertical: "middle", horizontal: "center" }

  currentRow++

  // Subtitle
  sheet.mergeCells(`C${currentRow}:K${currentRow}`)
  const subtitleCell = sheet.getCell(`C${currentRow}`)
  subtitleCell.value = "Official Bus Passenger List"
  subtitleCell.font = { size: 11, color: { argb: "FF666666" }, italic: true }
  subtitleCell.alignment = { vertical: "middle", horizontal: "center" }

  currentRow += 2
  sheet.addRow([]) // Spacing
  currentRow++

  // ============================================
  // TRIP INFORMATION SECTION
  // ============================================

  const infoStartRow = currentRow

  // Left column info
  sheet.getCell(`A${currentRow}`).value = "Company:"
  sheet.getCell(`A${currentRow}`).font = { bold: true }
  sheet.getCell(`B${currentRow}`).value = trip.company.name
  sheet.getCell(`B${currentRow}`).font = { size: 11 }

  sheet.getCell(`C${currentRow}`).value = "Bus Type:"
  sheet.getCell(`C${currentRow}`).font = { bold: true }
  sheet.getCell(`D${currentRow}`).value = trip.busType.toUpperCase()

  currentRow++

  sheet.getCell(`A${currentRow}`).value = "Route:"
  sheet.getCell(`A${currentRow}`).font = { bold: true }
  sheet.mergeCells(`B${currentRow}:D${currentRow}`)
  sheet.getCell(`B${currentRow}`).value = `${trip.origin} → ${trip.destination}`
  sheet.getCell(`B${currentRow}`).font = { bold: true, size: 12, color: { argb: colors.primary } }

  currentRow++

  if (trip.route) {
    sheet.getCell(`A${currentRow}`).value = "Full Route:"
    sheet.getCell(`A${currentRow}`).font = { bold: true }
    sheet.mergeCells(`B${currentRow}:D${currentRow}`)
    sheet.getCell(`B${currentRow}`).value = trip.route
    currentRow++
  }

  sheet.getCell(`A${currentRow}`).value = "Departure:"
  sheet.getCell(`A${currentRow}`).font = { bold: true }
  sheet.getCell(`B${currentRow}`).value = formatDate(trip.departureTime)

  sheet.getCell(`C${currentRow}`).value = "Time:"
  sheet.getCell(`C${currentRow}`).font = { bold: true }
  sheet.getCell(`D${currentRow}`).value = new Date(trip.departureTime).toLocaleTimeString("en-ET", {
    hour: "2-digit",
    minute: "2-digit"
  })

  currentRow++

  sheet.getCell(`A${currentRow}`).value = "Capacity:"
  sheet.getCell(`A${currentRow}`).font = { bold: true }
  sheet.getCell(`B${currentRow}`).value = `${trip.totalSlots} seats`

  sheet.getCell(`C${currentRow}`).value = "Price:"
  sheet.getCell(`C${currentRow}`).font = { bold: true }
  sheet.getCell(`D${currentRow}`).value = formatCurrency(Number(trip.price))

  currentRow += 2
  sheet.addRow([]) // Spacing
  currentRow++

  // ============================================
  // PASSENGER LIST SECTION
  // ============================================

  // Section header
  sheet.mergeCells(`A${currentRow}:K${currentRow}`)
  const sectionHeader = sheet.getCell(`A${currentRow}`)
  sectionHeader.value = "SECTION 1: I-TICKET PLATFORM BOOKINGS"
  sectionHeader.font = { bold: true, size: 12, color: { argb: colors.white } }
  sectionHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.primaryDark } }
  sectionHeader.alignment = { horizontal: "center", vertical: "middle" }
  sheet.getRow(currentRow).height = 25
  currentRow++

  // Column headers
  const columnHeaders = [
    "Seat",
    "Passenger Name",
    "National ID",
    "Phone Number",
    "Pickup Location",
    "Dropoff Location",
    "Booked By",
    "Booking Time",
    "Booking ID",
    "Ticket Code",
    "Status"
  ]

  const headerRow = sheet.addRow(columnHeaders)
  headerRow.height = 30
  headerRow.eachCell((cell, colNumber) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.header } }
    cell.font = { bold: true, color: { argb: colors.white }, size: 11 }
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
    cell.border = {
      top: { style: "medium", color: { argb: colors.primaryDark } },
      bottom: { style: "medium", color: { argb: colors.primaryDark } },
      left: { style: "thin", color: { argb: colors.primaryDark } },
      right: { style: "thin", color: { argb: colors.primaryDark } }
    }
  })

  // Collect all passengers with booking details
  const allPassengers: any[] = []
  for (const booking of trip.bookings) {
    for (const passenger of booking.passengers) {
      allPassengers.push({
        ...passenger,
        bookingId: booking.id,
        bookedBy: booking.user.name,
        bookedByPhone: booking.user.phone,
        bookingTime: booking.createdAt,
        isQuickTicket: booking.isQuickTicket,
        ticketCode: booking.tickets.find((t) => t.shortCode)?.shortCode || "N/A"
      })
    }
  }

  // Sort by seat number
  allPassengers.sort((a, b) => (a.seatNumber || 999) - (b.seatNumber || 999))

  // Add passenger rows with alternating colors
  allPassengers.forEach((p, index) => {
    const bookingTime = new Date(p.bookingTime).toLocaleString("en-ET", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })

    const bookedByText = p.isQuickTicket
      ? `${trip.company.name} (Office)`
      : `${p.bookedBy} (Online)`

    const row = sheet.addRow([
      p.seatNumber || "N/A",
      p.name,
      p.nationalId,
      p.phone,
      p.pickupLocation || "Standard",
      p.dropoffLocation || "Standard",
      bookedByText,
      bookingTime,
      p.bookingId.slice(0, 8).toUpperCase(),
      p.ticketCode,
      "PAID"
    ])

    row.height = 20

    // Alternating row colors
    const bgColor = index % 2 === 0 ? colors.white : colors.lightGray

    row.eachCell((cell, colNumber) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } }
      cell.alignment = { vertical: "middle", horizontal: colNumber === 2 ? "left" : "center" }
      cell.border = {
        top: { style: "thin", color: { argb: "FFDDDDDD" } },
        bottom: { style: "thin", color: { argb: "FFDDDDDD" } },
        left: { style: "thin", color: { argb: "FFDDDDDD" } },
        right: { style: "thin", color: { argb: "FFDDDDDD" } }
      }

      // Highlight seat number
      if (colNumber === 1) {
        cell.font = { bold: true, size: 11, color: { argb: colors.primary } }
      }

      // Status column - green badge
      if (colNumber === 11) {
        cell.font = { bold: true, color: { argb: colors.success } }
      }
    })
  })

  currentRow = sheet.lastRow!.number + 2

  // ============================================
  // MANUAL SALES SECTION
  // ============================================

  sheet.mergeCells(`A${currentRow}:K${currentRow}`)
  const manualSectionHeader = sheet.getCell(`A${currentRow}`)
  manualSectionHeader.value = "SECTION 2: MANUAL/OFFICE TICKET SALES"
  manualSectionHeader.font = { bold: true, size: 12, color: { argb: colors.white } }
  manualSectionHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.warning } }
  manualSectionHeader.alignment = { horizontal: "center", vertical: "middle" }
  sheet.getRow(currentRow).height = 25
  currentRow++

  const iTicketPassengers = allPassengers.length
  const totalBooked = trip.totalSlots - trip.availableSlots
  const manualSales = totalBooked - iTicketPassengers

  sheet.getCell(`A${currentRow}`).value = "Total Manual/Office Sales:"
  sheet.getCell(`A${currentRow}`).font = { bold: true }
  sheet.getCell(`B${currentRow}`).value = `${manualSales} tickets`
  sheet.getCell(`B${currentRow}`).font = { size: 11, color: { argb: colors.warning } }
  currentRow++

  sheet.mergeCells(`A${currentRow}:K${currentRow}`)
  sheet.getCell(`A${currentRow}`).value = "Note: Passenger details not available for tickets sold at office/terminal"
  sheet.getCell(`A${currentRow}`).font = { italic: true, size: 10, color: { argb: "FF666666" } }
  sheet.getCell(`A${currentRow}`).alignment = { horizontal: "center" }

  currentRow += 2

  // ============================================
  // SUMMARY SECTION
  // ============================================

  sheet.mergeCells(`A${currentRow}:K${currentRow}`)
  const summaryHeader = sheet.getCell(`A${currentRow}`)
  summaryHeader.value = "REVENUE & CAPACITY SUMMARY"
  summaryHeader.font = { bold: true, size: 12, color: { argb: colors.white } }
  summaryHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.primaryDark } }
  summaryHeader.alignment = { horizontal: "center", vertical: "middle" }
  sheet.getRow(currentRow).height = 25
  currentRow++

  const totalRevenue = trip.bookings.reduce((sum, b) => sum + Number(b.totalAmount), 0)
  const totalCommission = trip.bookings.reduce((sum, b) => sum + Number(b.commission), 0)

  // Summary table with professional layout
  const summaryData = [
    ["Capacity Information", "", "Revenue Information", ""],
    ["Total Capacity:", `${trip.totalSlots} seats`, "I-Ticket Revenue:", formatCurrency(totalRevenue)],
    ["I-Ticket Bookings:", `${iTicketPassengers} passengers`, "Platform Commission:", formatCurrency(totalCommission)],
    ["Manual/Office Sales:", `${manualSales} tickets`, "Company Net Revenue:", formatCurrency(totalRevenue - totalCommission)],
    ["Total Booked:", `${totalBooked}/${trip.totalSlots}`, "Average per Seat:", formatCurrency(Number(trip.price))],
    ["Available Seats:", `${trip.availableSlots}`, "Bus Occupancy:", `${Math.round((totalBooked / trip.totalSlots) * 100)}%`],
  ]

  summaryData.forEach((rowData, index) => {
    const row = sheet.addRow(rowData)
    row.height = 22

    if (index === 0) {
      // Header row
      row.eachCell((cell, colNumber) => {
        cell.font = { bold: true, size: 11 }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.lightGray } }
        cell.alignment = { horizontal: "center", vertical: "middle" }
      })
    } else {
      // Data rows
      row.getCell(1).font = { bold: true, size: 10 }
      row.getCell(2).font = { size: 10, color: { argb: colors.primary } }
      row.getCell(3).font = { bold: true, size: 10 }
      row.getCell(4).font = { size: 10, color: { argb: colors.success } }

      // Add borders
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFDDDDDD" } },
          bottom: { style: "thin", color: { argb: "FFDDDDDD" } },
          left: { style: "thin", color: { argb: "FFDDDDDD" } },
          right: { style: "thin", color: { argb: "FFDDDDDD" } }
        }
      })
    }
    currentRow++
  })

  currentRow += 2

  // ============================================
  // FOOTER SECTION
  // ============================================

  sheet.addRow([])
  currentRow++

  // Footer divider
  sheet.mergeCells(`A${currentRow}:K${currentRow}`)
  const footerDivider = sheet.getCell(`A${currentRow}`)
  footerDivider.border = { top: { style: "medium", color: { argb: colors.primary } } }
  currentRow++

  // Generated timestamp
  const footerRow1 = sheet.addRow([
    "Generated:",
    new Date().toLocaleString("en-ET", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }),
    "",
    "",
    "",
    "",
    "",
    "Document ID:",
    tripId.slice(0, 12).toUpperCase()
  ])
  footerRow1.font = { size: 9, color: { argb: "FF666666" } }

  currentRow++

  const footerRow2 = sheet.addRow([
    "Platform:",
    "i-Ticket Ethiopia - Digital Bus Ticketing System",
    "",
    "",
    "",
    "",
    "",
    "Website:",
    "https://i-ticket.et"
  ])
  footerRow2.font = { size: 9, color: { argb: "FF666666" } }

  currentRow++

  // Signature section
  currentRow += 2
  sheet.getCell(`A${currentRow}`).value = "___________________________"
  sheet.getCell(`A${currentRow + 1}`).value = "Company Representative"
  sheet.getCell(`A${currentRow + 1}`).font = { size: 9, italic: true }

  sheet.getCell(`E${currentRow}`).value = "___________________________"
  sheet.getCell(`E${currentRow + 1}`).value = "Driver Signature"
  sheet.getCell(`E${currentRow + 1}`).font = { size: 9, italic: true }

  sheet.getCell(`I${currentRow}`).value = "___________________________"
  sheet.getCell(`I${currentRow + 1}`).value = "Date & Time"
  sheet.getCell(`I${currentRow + 1}`).font = { size: 9, italic: true }

  // ============================================
  // COLUMN WIDTHS (Optimized for Landscape)
  // ============================================

  sheet.getColumn(1).width = 8   // Seat
  sheet.getColumn(2).width = 22  // Passenger Name
  sheet.getColumn(3).width = 15  // National ID
  sheet.getColumn(4).width = 14  // Phone
  sheet.getColumn(5).width = 18  // Pickup
  sheet.getColumn(6).width = 18  // Dropoff
  sheet.getColumn(7).width = 20  // Booked By
  sheet.getColumn(8).width = 16  // Booking Time
  sheet.getColumn(9).width = 12  // Booking ID
  sheet.getColumn(10).width = 12 // Ticket Code
  sheet.getColumn(11).width = 10 // Status

  // Set print area to include all content
  sheet.pageSetup.printArea = `A1:K${currentRow + 1}`
  sheet.pageSetup.printTitlesRow = '1:13' // Repeat header rows on each page

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

import ExcelJS from "exceljs"
import prisma from "./db"
import { formatCurrency, formatDate } from "./utils"

/**
 * Options for platform revenue report generation
 */
interface ReportOptions {
  startDate: Date
  endDate: Date
  companyId?: string
  channel?: 'WEB' | 'SMS' | 'ALL'
  generatedBy: { id: string; name: string }
}

/**
 * Generate professional platform revenue Excel invoice
 * Shows all bookings processed through i-Ticket with 5% commission breakdown
 * Optimized for A4 printing with company letterhead and professional styling
 */
export async function generatePlatformRevenueReport(options: ReportOptions): Promise<Buffer> {
  const { startDate, endDate, companyId, channel, generatedBy } = options

  // Fetch all paid bookings in date range
  const bookings = await prisma.booking.findMany({
    where: {
      status: "PAID",
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      ...(companyId && { trip: { companyId } })
    },
    include: {
      user: {
        select: { name: true, phone: true }
      },
      trip: {
        select: {
          origin: true,
          destination: true,
          route: true,
          intermediateStops: true,
          departureTime: true,
          busType: true,
          price: true,
          company: {
            select: { id: true, name: true }
          }
        }
      },
      passengers: {
        select: { name: true, seatNumber: true }
      },
      tickets: {
        select: { shortCode: true }
      },
      payment: {
        select: { method: true, initiatedVia: true, status: true, transactionId: true }
      }
    },
    orderBy: [
      { trip: { company: { name: 'asc' } } },
      { createdAt: 'asc' }
    ]
  })

  // Filter by channel if specified
  const filteredBookings = channel && channel !== 'ALL'
    ? bookings.filter(b => b.payment?.initiatedVia === channel)
    : bookings

  // Create workbook
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "i-Ticket Platform"
  workbook.company = "i-Ticket Ethiopia Plc"
  workbook.created = new Date()

  const sheet = workbook.addWorksheet("Platform Revenue", {
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

  // Color Theme - i-Ticket Teal (matching brand)
  const colors = {
    primary: "FF018790",      // i-Ticket teal
    primaryDark: "FF016670",  // Darker teal
    header: "FF018790",       // Teal header
    lightTeal: "FFE6F7F7",    // Light teal background
    lightGray: "FFF5F5F5",    // Alternating rows
    white: "FFFFFFFF",
    darkGray: "FF333333",
    success: "FF22C55E",      // Green
    warning: "FFFBBF24",      // Yellow
    info: "FF3B82F6",         // Blue
  }

  let currentRow = 1

  // ============================================
  // LETTERHEAD / HEADER SECTION
  // ============================================

  // Company Logo Area
  sheet.mergeCells(`A${currentRow}:B${currentRow + 2}`)
  const logoCell = sheet.getCell(`A${currentRow}`)
  logoCell.value = "i-TICKET"
  logoCell.font = { bold: true, size: 26, color: { argb: colors.primary } }
  logoCell.alignment = { vertical: "middle", horizontal: "center" }
  logoCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.lightTeal } }

  // Document Title
  sheet.mergeCells(`C${currentRow}:L${currentRow}`)
  const titleCell = sheet.getCell(`C${currentRow}`)
  titleCell.value = "PLATFORM REVENUE INVOICE"
  titleCell.font = { bold: true, size: 22, color: { argb: colors.darkGray } }
  titleCell.alignment = { vertical: "middle", horizontal: "center" }

  currentRow++

  // Report Number
  const reportId = `REV-${new Date().toISOString().split('T')[0]}-${Date.now().toString().slice(-6)}`
  sheet.mergeCells(`C${currentRow}:L${currentRow}`)
  const reportIdCell = sheet.getCell(`C${currentRow}`)
  reportIdCell.value = `Report No: ${reportId}`
  reportIdCell.font = { size: 11, color: { argb: "FF666666" }, italic: true }
  reportIdCell.alignment = { vertical: "middle", horizontal: "center" }

  currentRow += 2

  // Company Information (Left) and Report Info (Right)
  sheet.getCell(`A${currentRow}`).value = "i-Ticket Ethiopia Plc"
  sheet.getCell(`A${currentRow}`).font = { bold: true, size: 11 }

  sheet.getCell(`H${currentRow}`).value = "Period:"
  sheet.getCell(`H${currentRow}`).font = { bold: true }
  sheet.mergeCells(`I${currentRow}:L${currentRow}`)
  sheet.getCell(`I${currentRow}`).value = `${formatDate(startDate)} - ${formatDate(endDate)}`

  currentRow++

  sheet.getCell(`A${currentRow}`).value = "Bole Road, Addis Ababa, Ethiopia"
  sheet.getCell(`A${currentRow}`).font = { size: 10, color: { argb: "FF666666" } }

  sheet.getCell(`H${currentRow}`).value = "Generated:"
  sheet.getCell(`H${currentRow}`).font = { bold: true }
  sheet.mergeCells(`I${currentRow}:L${currentRow}`)
  sheet.getCell(`I${currentRow}`).value = new Date().toLocaleString("en-ET", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })

  currentRow++

  sheet.getCell(`A${currentRow}`).value = "Phone: +251 911 123 456"
  sheet.getCell(`A${currentRow}`).font = { size: 10, color: { argb: "FF666666" } }

  sheet.getCell(`H${currentRow}`).value = "Generated By:"
  sheet.getCell(`H${currentRow}`).font = { bold: true }
  sheet.mergeCells(`I${currentRow}:L${currentRow}`)
  sheet.getCell(`I${currentRow}`).value = generatedBy.name

  currentRow++

  sheet.getCell(`A${currentRow}`).value = "Email: finance@i-ticket.et"
  sheet.getCell(`A${currentRow}`).font = { size: 10, color: { argb: "FF666666" } }

  currentRow += 2

  // ============================================
  // EXECUTIVE SUMMARY SECTION
  // ============================================

  sheet.mergeCells(`A${currentRow}:L${currentRow}`)
  const summaryTitleCell = sheet.getCell(`A${currentRow}`)
  summaryTitleCell.value = "EXECUTIVE SUMMARY"
  summaryTitleCell.font = { bold: true, size: 14, color: { argb: colors.white } }
  summaryTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.primaryDark } }
  summaryTitleCell.alignment = { horizontal: "center", vertical: "middle" }
  sheet.getRow(currentRow).height = 28
  currentRow++

  // Calculate totals
  const totalBookings = filteredBookings.length
  const totalPassengers = filteredBookings.reduce((sum, b) => sum + b.passengers.length, 0)
  const uniqueCompanies = new Set(filteredBookings.map(b => b.trip.company.id)).size
  const totalGrossRevenue = filteredBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0)
  const totalPlatformCommission = filteredBookings.reduce((sum, b) => sum + Number(b.commission), 0)
  const totalNetToCompanies = totalGrossRevenue - totalPlatformCommission

  const webBookings = filteredBookings.filter(b => b.payment?.initiatedVia === 'WEB').length
  const smsBookings = filteredBookings.filter(b => b.payment?.initiatedVia === 'SMS').length
  const telebirrPayments = filteredBookings.filter(b => b.payment?.method === 'TELEBIRR').length
  const demoPayments = filteredBookings.filter(b => b.payment?.method === 'DEMO').length

  // Summary table
  const summaryData = [
    ["Total Bookings:", totalBookings, "", "Total Gross Revenue:", formatCurrency(totalGrossRevenue)],
    ["Total Passengers:", totalPassengers, "", "Platform Commission (5%):", formatCurrency(totalPlatformCommission)],
    ["Companies:", uniqueCompanies, "", "Net to Companies (95%):", formatCurrency(totalNetToCompanies)],
    ["", "", "", "", ""],
    ["Web Bookings:", `${webBookings} (${Math.round(webBookings/totalBookings*100)}%)`, "", "TeleBirr Payments:", `${telebirrPayments} (${Math.round(telebirrPayments/totalBookings*100)}%)`],
    ["SMS Bookings:", `${smsBookings} (${Math.round(smsBookings/totalBookings*100)}%)`, "", "Demo Payments:", `${demoPayments} (${Math.round(demoPayments/totalBookings*100)}%)`],
  ]

  summaryData.forEach((rowData) => {
    const row = sheet.addRow(rowData)
    row.height = 22

    // Style left section
    row.getCell(1).font = { bold: true, size: 11 }
    row.getCell(2).font = { size: 11, color: { argb: colors.info } }

    // Style right section
    row.getCell(4).font = { bold: true, size: 11 }
    row.getCell(5).font = { size: 11, color: { argb: colors.success }, bold: true }

    // Add subtle background
    row.eachCell((cell) => {
      if (cell.value) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.lightGray } }
      }
    })

    currentRow++
  })

  currentRow += 2

  // ============================================
  // BOOKINGS BY COMPANY SECTIONS
  // ============================================

  // Group bookings by company
  const bookingsByCompany = filteredBookings.reduce((acc, booking) => {
    const companyId = booking.trip.company.id
    if (!acc[companyId]) {
      acc[companyId] = {
        companyName: booking.trip.company.name,
        bookings: []
      }
    }
    acc[companyId].bookings.push(booking)
    return acc
  }, {} as Record<string, { companyName: string; bookings: any[] }>)

  // Iterate through each company
  Object.entries(bookingsByCompany).forEach(([companyId, companyData]) => {
    const { companyName, bookings: companyBookings } = companyData

    // Company section header
    sheet.mergeCells(`A${currentRow}:L${currentRow}`)
    const companyHeader = sheet.getCell(`A${currentRow}`)
    companyHeader.value = `${companyName.toUpperCase()} (${companyBookings.length} Bookings)`
    companyHeader.font = { bold: true, size: 12, color: { argb: colors.white } }
    companyHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.primary } }
    companyHeader.alignment = { horizontal: "center", vertical: "middle" }
    sheet.getRow(currentRow).height = 26
    currentRow++

    // Column headers
    const columnHeaders = [
      "Booking ID",
      "Customer\nName",
      "Phone",
      "Route",
      "Departure",
      "Pax",
      "Ticket\nPrice",
      "Total\nAmount",
      "Platform\nComm. (5%)",
      "Channel",
      "Payment\nMethod",
      "Ticket\nCodes"
    ]

    const headerRow = sheet.addRow(columnHeaders)
    headerRow.height = 35
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.header } }
      cell.font = { bold: true, color: { argb: colors.white }, size: 10 }
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
      cell.border = {
        top: { style: "medium", color: { argb: colors.primaryDark } },
        bottom: { style: "medium", color: { argb: colors.primaryDark } },
        left: { style: "thin", color: { argb: colors.primaryDark } },
        right: { style: "thin", color: { argb: colors.primaryDark } }
      }
    })
    currentRow++

    // Booking detail rows
    let companySubtotalRevenue = 0
    let companySubtotalCommission = 0

    companyBookings.forEach((booking, index) => {
      const route = booking.trip.intermediateStops
        ? `${booking.trip.origin} via ${JSON.parse(booking.trip.intermediateStops).join(', ')} ${booking.trip.destination}`
        : `${booking.trip.origin} → ${booking.trip.destination}`

      const departureTime = new Date(booking.trip.departureTime).toLocaleString("en-ET", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })

      const ticketCodes = booking.tickets.map(t => t.shortCode).join(", ") || "N/A"
      const passengerCount = booking.passengers.length
      const totalAmount = Number(booking.totalAmount)
      const commission = Number(booking.commission)

      companySubtotalRevenue += totalAmount
      companySubtotalCommission += commission

      const row = sheet.addRow([
        booking.id.slice(0, 8).toUpperCase(),
        booking.user.name || "Guest",
        booking.user.phone,
        route,
        departureTime,
        passengerCount,
        formatCurrency(Number(booking.trip.price)),
        formatCurrency(totalAmount),
        formatCurrency(commission),
        booking.payment?.initiatedVia || "WEB",
        booking.payment?.method || "N/A",
        ticketCodes
      ])

      row.height = 20

      // Alternating row colors
      const bgColor = index % 2 === 0 ? colors.white : colors.lightGray

      row.eachCell((cell, colNumber) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } }
        cell.alignment = {
          vertical: "middle",
          horizontal: colNumber === 2 || colNumber === 4 ? "left" : "center",
          wrapText: colNumber === 4 // Wrap route text
        }
        cell.border = {
          top: { style: "thin", color: { argb: "FFDDDDDD" } },
          bottom: { style: "thin", color: { argb: "FFDDDDDD" } },
          left: { style: "thin", color: { argb: "FFDDDDDD" } },
          right: { style: "thin", color: { argb: "FFDDDDDD" } }
        }
        cell.font = { size: 10 }

        // Highlight booking ID
        if (colNumber === 1) {
          cell.font = { bold: true, size: 9, color: { argb: colors.primary } }
        }

        // Highlight amounts
        if (colNumber === 8 || colNumber === 9) {
          cell.font = { bold: true, size: 10, color: { argb: colors.success } }
        }

        // Channel badge
        if (colNumber === 10) {
          cell.font = { bold: true, size: 9, color: { argb: booking.payment?.initiatedVia === 'SMS' ? colors.info : colors.darkGray } }
        }
      })

      currentRow++
    })

    // Company subtotal row
    const subtotalRow = sheet.addRow([
      "", "", "", "", "", "",
      `${companyName.toUpperCase()} SUBTOTAL →`,
      formatCurrency(companySubtotalRevenue),
      formatCurrency(companySubtotalCommission),
      "", "", ""
    ])
    subtotalRow.height = 24
    subtotalRow.eachCell((cell, colNumber) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.lightTeal } }
      cell.font = { bold: true, size: 11, color: { argb: colors.primaryDark } }
      cell.alignment = { vertical: "middle", horizontal: colNumber >= 7 ? "center" : "right" }
      cell.border = {
        top: { style: "medium", color: { argb: colors.primary } },
        bottom: { style: "medium", color: { argb: colors.primary } }
      }
    })

    currentRow++
    sheet.addRow([]) // Spacing between companies
    currentRow++
  })

  // ============================================
  // GRAND TOTALS SECTION
  // ============================================

  sheet.mergeCells(`A${currentRow}:L${currentRow}`)
  const grandTotalHeader = sheet.getCell(`A${currentRow}`)
  grandTotalHeader.value = "GRAND TOTALS"
  grandTotalHeader.font = { bold: true, size: 14, color: { argb: colors.white } }
  grandTotalHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.primaryDark } }
  grandTotalHeader.alignment = { horizontal: "center", vertical: "middle" }
  sheet.getRow(currentRow).height = 28
  currentRow++

  const grandTotalsData = [
    ["Total Gross Revenue:", formatCurrency(totalGrossRevenue)],
    ["Total Platform Commission (5%):", formatCurrency(totalPlatformCommission)],
    ["Total Net to Companies (95%):", formatCurrency(totalNetToCompanies)]
  ]

  grandTotalsData.forEach((rowData, index) => {
    sheet.mergeCells(`A${currentRow}:J${currentRow}`)
    sheet.getCell(`A${currentRow}`).value = rowData[0]
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 13 }
    sheet.getCell(`A${currentRow}`).alignment = { horizontal: "right" }

    sheet.mergeCells(`K${currentRow}:L${currentRow}`)
    sheet.getCell(`K${currentRow}`).value = rowData[1]
    sheet.getCell(`K${currentRow}`).font = {
      bold: true,
      size: 14,
      color: { argb: index === 1 ? colors.success : colors.darkGray }
    }
    sheet.getCell(`K${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
    sheet.getCell(`K${currentRow}`).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: index === 1 ? "FFD1FAE5" : colors.lightGray }
    }

    sheet.getRow(currentRow).height = 26
    currentRow++
  })

  currentRow += 2

  // ============================================
  // APPROVAL SIGNATURES SECTION
  // ============================================

  sheet.mergeCells(`A${currentRow}:L${currentRow}`)
  const signatureHeader = sheet.getCell(`A${currentRow}`)
  signatureHeader.value = "APPROVAL SIGNATURES"
  signatureHeader.font = { bold: true, size: 12, color: { argb: colors.white } }
  signatureHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.primary } }
  signatureHeader.alignment = { horizontal: "center", vertical: "middle" }
  sheet.getRow(currentRow).height = 24
  currentRow += 2

  // Signature lines
  const signatures = [
    { label: "Prepared By", role: "Finance Officer" },
    { label: "Reviewed By", role: "Finance Manager" },
    { label: "Approved By", role: "CEO / Director" }
  ]

  signatures.forEach((sig, idx) => {
    const col = idx * 4 + 1 // Columns A, E, I

    sheet.getCell(currentRow, col).value = "_".repeat(30)
    sheet.getCell(currentRow, col).font = { size: 10 }

    sheet.getCell(currentRow + 1, col).value = sig.label
    sheet.getCell(currentRow + 1, col).font = { bold: true, size: 10 }

    sheet.getCell(currentRow + 2, col).value = sig.role
    sheet.getCell(currentRow + 2, col).font = { italic: true, size: 9, color: { argb: "FF666666" } }

    sheet.getCell(currentRow + 4, col).value = "Date: ________________"
    sheet.getCell(currentRow + 4, col).font = { size: 9 }
  })

  currentRow += 6

  // ============================================
  // FOOTER SECTION
  // ============================================

  sheet.addRow([])
  currentRow++

  // Footer divider
  sheet.mergeCells(`A${currentRow}:L${currentRow}`)
  const footerDivider = sheet.getCell(`A${currentRow}`)
  footerDivider.border = { top: { style: "medium", color: { argb: colors.primary } } }
  currentRow++

  // Footer info
  sheet.mergeCells(`A${currentRow}:L${currentRow}`)
  const footerInfo = sheet.getCell(`A${currentRow}`)
  footerInfo.value = "Generated by i-Ticket Platform | https://i-ticket.et | support@i-ticket.et"
  footerInfo.font = { size: 9, color: { argb: "FF666666" } }
  footerInfo.alignment = { horizontal: "center" }

  currentRow++

  sheet.mergeCells(`A${currentRow}:L${currentRow}`)
  const docIdFooter = sheet.getCell(`A${currentRow}`)
  docIdFooter.value = `Document ID: ${reportId}`
  docIdFooter.font = { size: 8, color: { argb: "FF999999" }, italic: true }
  docIdFooter.alignment = { horizontal: "center" }

  // ============================================
  // COLUMN WIDTHS (Optimized for Landscape)
  // ============================================

  sheet.getColumn(1).width = 12  // Booking ID
  sheet.getColumn(2).width = 18  // Customer Name
  sheet.getColumn(3).width = 13  // Phone
  sheet.getColumn(4).width = 25  // Route
  sheet.getColumn(5).width = 14  // Departure
  sheet.getColumn(6).width = 5   // Pax
  sheet.getColumn(7).width = 11  // Ticket Price
  sheet.getColumn(8).width = 11  // Total Amount
  sheet.getColumn(9).width = 11  // Commission
  sheet.getColumn(10).width = 8  // Channel
  sheet.getColumn(11).width = 10 // Payment Method
  sheet.getColumn(12).width = 15 // Ticket Codes

  // Set print area
  sheet.pageSetup.printArea = `A1:L${currentRow}`

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

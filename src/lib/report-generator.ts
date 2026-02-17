import ExcelJS from "exceljs"
import prisma from "./db"
import { formatCurrency, formatDate } from "./utils"

/**
 * Generate professional passenger manifest Excel file
 * Optimized for landscape A4 printing with letterhead and color theme
 */
export async function generatePassengerManifest(tripId: string): Promise<Buffer> {
  // Fetch all trip data with paid bookings and trip log
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      company: true,
      driver: {
        select: {
          name: true,
          phone: true,
          licenseNumber: true
        }
      },
      conductor: {
        select: {
          name: true,
          phone: true
        }
      },
      vehicle: {
        select: {
          plateNumber: true,
          sideNumber: true,
          make: true,
          model: true
        }
      },
      tripLog: true,
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
  sheet.mergeCells(`C${currentRow}:J${currentRow}`)
  const titleCell = sheet.getCell(`C${currentRow}`)
  titleCell.value = "PASSENGER MANIFEST"
  titleCell.font = { bold: true, size: 20, color: { argb: colors.darkGray } }
  titleCell.alignment = { vertical: "middle", horizontal: "center" }

  currentRow++

  // Subtitle
  sheet.mergeCells(`C${currentRow}:J${currentRow}`)
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

  currentRow++

  // Vehicle info
  if (trip.vehicle) {
    sheet.getCell(`A${currentRow}`).value = "Vehicle:"
    sheet.getCell(`A${currentRow}`).font = { bold: true }
    sheet.getCell(`B${currentRow}`).value = `${trip.vehicle.plateNumber}${trip.vehicle.sideNumber ? ` (${trip.vehicle.sideNumber})` : ''}`

    sheet.getCell(`C${currentRow}`).value = "Make/Model:"
    sheet.getCell(`C${currentRow}`).font = { bold: true }
    sheet.getCell(`D${currentRow}`).value = `${trip.vehicle.make} ${trip.vehicle.model}`
    currentRow++
  }

  // Trip Log - Odometer & Fuel Readings
  if (trip.tripLog) {
    currentRow++
    sheet.mergeCells(`A${currentRow}:J${currentRow}`)
    const tripLogHeader = sheet.getCell(`A${currentRow}`)
    tripLogHeader.value = "TRIP LOG - ODOMETER & FUEL READINGS"
    tripLogHeader.font = { bold: true, size: 11, color: { argb: colors.white } }
    tripLogHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.primaryDark } }
    tripLogHeader.alignment = { horizontal: "center", vertical: "middle" }
    sheet.getRow(currentRow).height = 22
    currentRow++

    // Start readings
    if (trip.tripLog.startOdometer) {
      sheet.getCell(`A${currentRow}`).value = "Start Odometer:"
      sheet.getCell(`A${currentRow}`).font = { bold: true }
      sheet.getCell(`B${currentRow}`).value = `${trip.tripLog.startOdometer.toLocaleString()} km`
      sheet.getCell(`B${currentRow}`).font = { color: { argb: colors.primary } }

      if (trip.tripLog.startFuel !== null && trip.tripLog.startFuel !== undefined) {
        sheet.getCell(`C${currentRow}`).value = "Start Fuel:"
        sheet.getCell(`C${currentRow}`).font = { bold: true }
        sheet.getCell(`D${currentRow}`).value = `${trip.tripLog.startFuel} ${trip.tripLog.startFuelUnit || 'L'}`
      }

      if (trip.tripLog.startedByName) {
        sheet.getCell(`E${currentRow}`).value = "Recorded by:"
        sheet.getCell(`E${currentRow}`).font = { bold: true }
        sheet.getCell(`F${currentRow}`).value = trip.tripLog.startedByName
      }
      currentRow++
    }

    // End readings
    if (trip.tripLog.endOdometer) {
      sheet.getCell(`A${currentRow}`).value = "End Odometer:"
      sheet.getCell(`A${currentRow}`).font = { bold: true }
      sheet.getCell(`B${currentRow}`).value = `${trip.tripLog.endOdometer.toLocaleString()} km`
      sheet.getCell(`B${currentRow}`).font = { color: { argb: colors.primary } }

      if (trip.tripLog.endFuel !== null && trip.tripLog.endFuel !== undefined) {
        sheet.getCell(`C${currentRow}`).value = "End Fuel:"
        sheet.getCell(`C${currentRow}`).font = { bold: true }
        sheet.getCell(`D${currentRow}`).value = `${trip.tripLog.endFuel} ${trip.tripLog.startFuelUnit || 'L'}`
      }

      if (trip.tripLog.endedByName) {
        sheet.getCell(`E${currentRow}`).value = "Recorded by:"
        sheet.getCell(`E${currentRow}`).font = { bold: true }
        sheet.getCell(`F${currentRow}`).value = trip.tripLog.endedByName
      }
      currentRow++
    }

    // Calculated metrics
    if (trip.tripLog.distanceTraveled) {
      sheet.getCell(`A${currentRow}`).value = "Distance Traveled:"
      sheet.getCell(`A${currentRow}`).font = { bold: true }
      sheet.getCell(`B${currentRow}`).value = `${trip.tripLog.distanceTraveled.toLocaleString()} km`
      sheet.getCell(`B${currentRow}`).font = { bold: true, color: { argb: colors.success } }

      if (trip.tripLog.fuelConsumed) {
        sheet.getCell(`C${currentRow}`).value = "Fuel Consumed:"
        sheet.getCell(`C${currentRow}`).font = { bold: true }
        sheet.getCell(`D${currentRow}`).value = `${trip.tripLog.fuelConsumed.toFixed(1)} L`
      }

      if (trip.tripLog.fuelEfficiency) {
        sheet.getCell(`E${currentRow}`).value = "Fuel Efficiency:"
        sheet.getCell(`E${currentRow}`).font = { bold: true }
        sheet.getCell(`F${currentRow}`).value = `${trip.tripLog.fuelEfficiency.toFixed(2)} km/L`
        sheet.getCell(`F${currentRow}`).font = { color: { argb: colors.success } }
      }
      currentRow++
    }
  }

  currentRow++
  sheet.addRow([]) // Spacing
  currentRow++

  // ============================================
  // PASSENGER LIST SECTION
  // ============================================

  // Section header
  sheet.mergeCells(`A${currentRow}:J${currentRow}`)
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
        isReplacement: booking.isReplacement,
        ticketCode: booking.tickets.find((t) => t.shortCode)?.shortCode || "N/A"
      })
    }
  }

  // Sort by seat number
  allPassengers.sort((a, b) => (a.seatNumber || 999) - (b.seatNumber || 999))

  // Add passenger rows with alternating colors
  // For manual sales (isQuickTicket), show empty rows with only seat number filled
  allPassengers.forEach((p, index) => {
    const bookingTime = new Date(p.bookingTime).toLocaleString("en-ET", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })

    const isManualSale = p.isQuickTicket

    const isReplacement = p.isReplacement
    // Determine display status: boarding status takes priority for departed/completed trips
    let displayStatus = isManualSale ? "MANUAL" : "PAID"
    if (isReplacement) {
      displayStatus = "REPLACEMENT"
    } else if (p.boardingStatus === "BOARDED") {
      displayStatus = "BOARDED"
    } else if (p.boardingStatus === "NO_SHOW") {
      displayStatus = "NO-SHOW"
    }

    // For manual tickets, show empty cells (only seat number and "Manual Sale" status)
    const row = sheet.addRow([
      p.seatNumber || "N/A",
      isManualSale && !isReplacement ? "" : p.name,
      isManualSale && !isReplacement ? "" : p.phone,
      isManualSale ? "" : (p.pickupLocation || "Standard"),
      isManualSale ? "" : (p.dropoffLocation || "Standard"),
      isReplacement ? "Replacement Sale" : isManualSale ? "Office Sale" : `${p.bookedBy} (Online)`,
      isManualSale ? "" : bookingTime,
      isManualSale && !isReplacement ? "" : p.bookingId.slice(0, 8).toUpperCase(),
      isManualSale && !isReplacement ? "" : p.ticketCode,
      displayStatus
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

      // Status column - color based on status (column 10)
      if (colNumber === 10) {
        let statusColor = colors.success // default green for PAID/BOARDED
        if (displayStatus === "MANUAL") statusColor = colors.warning
        else if (displayStatus === "NO-SHOW") statusColor = "FFEF4444" // red
        else if (displayStatus === "REPLACEMENT") statusColor = "FF3B82F6" // blue
        cell.font = { bold: true, color: { argb: statusColor } }
      }
    })
  })

  currentRow = sheet.lastRow!.number + 2

  // Count online vs manual passengers (now both are in allPassengers array)
  const onlinePassengers = allPassengers.filter(p => !p.isQuickTicket)
  const manualPassengers = allPassengers.filter(p => p.isQuickTicket && !p.isReplacement)
  const replacementPassengers = allPassengers.filter(p => p.isReplacement)
  const onlineCount = onlinePassengers.length
  const manualCount = manualPassengers.length
  const replacementCount = replacementPassengers.length
  const totalBooked = onlineCount + manualCount + replacementCount

  // Boarding stats
  const boardedCount = allPassengers.filter(p => p.boardingStatus === "BOARDED").length
  const noShowCount = allPassengers.filter(p => p.boardingStatus === "NO_SHOW").length
  const pendingCount = allPassengers.filter(p => p.boardingStatus === "PENDING").length

  // ============================================
  // SUMMARY NOTES SECTION
  // ============================================

  sheet.mergeCells(`A${currentRow}:J${currentRow}`)
  const noteHeader = sheet.getCell(`A${currentRow}`)
  noteHeader.value = "BOOKING SUMMARY"
  noteHeader.font = { bold: true, size: 12, color: { argb: colors.white } }
  noteHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.warning } }
  noteHeader.alignment = { horizontal: "center", vertical: "middle" }
  sheet.getRow(currentRow).height = 25
  currentRow++

  sheet.getCell(`A${currentRow}`).value = "Online Bookings (i-Ticket):"
  sheet.getCell(`A${currentRow}`).font = { bold: true }
  sheet.getCell(`B${currentRow}`).value = `${onlineCount} passengers`
  sheet.getCell(`B${currentRow}`).font = { size: 11, color: { argb: colors.success } }

  sheet.getCell(`D${currentRow}`).value = "Manual/Office Sales:"
  sheet.getCell(`D${currentRow}`).font = { bold: true }
  sheet.getCell(`E${currentRow}`).value = `${manualCount} tickets`
  sheet.getCell(`E${currentRow}`).font = { size: 11, color: { argb: colors.warning } }
  currentRow++

  // Boarding status summary (only if there are boarding events)
  if (boardedCount > 0 || noShowCount > 0) {
    sheet.getCell(`A${currentRow}`).value = "Boarded:"
    sheet.getCell(`A${currentRow}`).font = { bold: true }
    sheet.getCell(`B${currentRow}`).value = `${boardedCount} passengers`
    sheet.getCell(`B${currentRow}`).font = { size: 11, color: { argb: colors.success } }

    sheet.getCell(`D${currentRow}`).value = "No-Show:"
    sheet.getCell(`D${currentRow}`).font = { bold: true }
    sheet.getCell(`E${currentRow}`).value = `${noShowCount} passengers`
    sheet.getCell(`E${currentRow}`).font = { size: 11, color: { argb: "FFEF4444" } }

    if (replacementCount > 0) {
      sheet.getCell(`G${currentRow}`).value = "Replacement Sales:"
      sheet.getCell(`G${currentRow}`).font = { bold: true }
      sheet.getCell(`H${currentRow}`).value = `${replacementCount} tickets`
      sheet.getCell(`H${currentRow}`).font = { size: 11, color: { argb: "FF3B82F6" } }
    }
    currentRow++
  }

  sheet.mergeCells(`A${currentRow}:J${currentRow}`)
  sheet.getCell(`A${currentRow}`).value = "Note: Manual ticket passengers are shown with seat numbers only. Details can be collected at boarding."
  sheet.getCell(`A${currentRow}`).font = { italic: true, size: 10, color: { argb: "FF666666" } }
  sheet.getCell(`A${currentRow}`).alignment = { horizontal: "center" }

  currentRow += 2

  // ============================================
  // SUMMARY SECTION
  // ============================================

  sheet.mergeCells(`A${currentRow}:J${currentRow}`)
  const summaryHeader = sheet.getCell(`A${currentRow}`)
  summaryHeader.value = "REVENUE & CAPACITY SUMMARY"
  summaryHeader.font = { bold: true, size: 12, color: { argb: colors.white } }
  summaryHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.primaryDark } }
  summaryHeader.alignment = { horizontal: "center", vertical: "middle" }
  sheet.getRow(currentRow).height = 25
  currentRow++

  // Only count revenue from online bookings (manual sales have commission 0)
  // RULE-007: Commission = 5% of ticket price, VAT = 15% of commission
  const onlineRevenue = trip.bookings
    .filter((b) => !b.isQuickTicket)
    .reduce((sum, b) => sum + Number(b.totalAmount), 0)
  const totalCommission = trip.bookings.reduce((sum, b) => sum + Number(b.commission), 0)
  const totalCommissionVAT = trip.bookings.reduce((sum, b) => sum + Number(b.commissionVAT || 0), 0)

  // Company Net = Online Revenue - Service Charge - VAT on Service Charge
  // Example: 105.75 - 5.00 - 0.75 = 100.00 ETB (company receives full ticket price)
  const companyNetRevenue = onlineRevenue - totalCommission - totalCommissionVAT

  // Summary table with professional layout
  const summaryData = [
    ["Capacity Information", "", "Revenue Information", ""],
    ["Total Capacity:", `${trip.totalSlots} seats`, "Online Revenue (i-Ticket):", formatCurrency(onlineRevenue)],
    ["Online Bookings:", `${onlineCount} passengers`, "Service Charge (5%):", formatCurrency(totalCommission)],
    ["Manual/Office Sales:", `${manualCount} tickets`, "VAT on Service Charge (15%):", formatCurrency(totalCommissionVAT)],
    ["Total Booked:", `${totalBooked}/${trip.totalSlots}`, "Company Net Revenue:", formatCurrency(companyNetRevenue)],
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
  sheet.mergeCells(`A${currentRow}:J${currentRow}`)
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

  // Company Representative
  const companyRepCell = sheet.getCell(`A${currentRow}`)
  companyRepCell.value = "___________________________"
  companyRepCell.alignment = { horizontal: "center" }

  const companyRepLabelCell = sheet.getCell(`A${currentRow + 1}`)
  companyRepLabelCell.value = "Company Representative"
  companyRepLabelCell.font = { size: 9, italic: true }
  companyRepLabelCell.alignment = { horizontal: "center" }

  // Driver signature (with actual name if available)
  const driverCell = sheet.getCell(`E${currentRow}`)
  driverCell.value = "___________________________"
  driverCell.alignment = { horizontal: "center" }

  const driverLabelCell = sheet.getCell(`E${currentRow + 1}`)
  if (trip.driver) {
    driverLabelCell.value = `Driver: ${trip.driver.name}`
    if (trip.driver.licenseNumber) {
      const driverLicenseCell = sheet.getCell(`E${currentRow + 2}`)
      driverLicenseCell.value = `License: ${trip.driver.licenseNumber}`
      driverLicenseCell.font = { size: 8, color: { argb: "FF666666" } }
      driverLicenseCell.alignment = { horizontal: "center" }
    }
  } else {
    driverLabelCell.value = "Driver Signature"
  }
  driverLabelCell.font = { size: 9, italic: true }
  driverLabelCell.alignment = { horizontal: "center" }

  // Conductor signature (with actual name if available) - REPLACES "Date & Time"
  const conductorCell = sheet.getCell(`I${currentRow}`)
  conductorCell.value = "___________________________"
  conductorCell.alignment = { horizontal: "center" }

  const conductorLabelCell = sheet.getCell(`I${currentRow + 1}`)
  if (trip.conductor) {
    conductorLabelCell.value = `Conductor: ${trip.conductor.name}`
  } else {
    conductorLabelCell.value = "Conductor Signature"
  }
  conductorLabelCell.font = { size: 9, italic: true }
  conductorLabelCell.alignment = { horizontal: "center" }

  // ============================================
  // COLUMN WIDTHS (Optimized for Landscape)
  // ============================================

  sheet.getColumn(1).width = 8   // Seat
  sheet.getColumn(2).width = 24  // Passenger Name (wider now)
  sheet.getColumn(3).width = 15  // Phone
  sheet.getColumn(4).width = 18  // Pickup
  sheet.getColumn(5).width = 18  // Dropoff
  sheet.getColumn(6).width = 22  // Booked By
  sheet.getColumn(7).width = 16  // Booking Time
  sheet.getColumn(8).width = 12  // Booking ID
  sheet.getColumn(9).width = 12  // Ticket Code
  sheet.getColumn(10).width = 10 // Status

  // Set print area to include all content (now column J after removing National ID)
  sheet.pageSetup.printArea = `A1:J${currentRow + 1}`
  sheet.pageSetup.printTitlesRow = '1:13' // Repeat header rows on each page

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

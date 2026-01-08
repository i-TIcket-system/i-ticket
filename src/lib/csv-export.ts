/**
 * CSV Export Utility
 * Simple CSV generation without external dependencies
 */

export function exportToCSV(data: any[], filename: string, headers?: string[]) {
  if (!data || data.length === 0) {
    alert('No data to export')
    return
  }

  // Generate headers from first row if not provided
  const csvHeaders = headers || Object.keys(data[0])

  // Create CSV content
  const csvRows = []

  // Add header row
  csvRows.push(csvHeaders.join(','))

  // Add data rows
  for (const row of data) {
    const values = csvHeaders.map(header => {
      const value = row[header]
      // Escape quotes and wrap in quotes if contains comma or quote
      const escaped = String(value || '').replace(/"/g, '""')
      return escaped.includes(',') || escaped.includes('"') ? `"${escaped}"` : escaped
    })
    csvRows.push(values.join(','))
  }

  // Create blob and download
  const csvContent = csvRows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * P3-SEC-008: Safe export fields whitelist
 * Export bookings to CSV with only approved fields
 */
const SAFE_EXPORT_FIELDS = [
  'Booking ID',
  'Date',
  'Customer',
  'Phone',
  'Route',
  'Company',
  'Amount',
  'Status'
] as const

export function exportBookingsToCSV(
  bookings: any[],
  filename?: string,
  filters?: { status?: string; channel?: string; company?: string }
) {
  // P3-UX-011: Generate filename with filter context
  if (!filename) {
    const today = new Date().toISOString().split('T')[0]
    let generatedFilename = `bookings-${today}`

    if (filters?.status && filters.status !== 'all') {
      generatedFilename += `-${filters.status.toLowerCase()}`
    }
    if (filters?.channel) {
      generatedFilename += `-${filters.channel.toLowerCase()}`
    }
    if (filters?.company) {
      generatedFilename += `-${filters.company.toLowerCase().replace(/\s+/g, '-').slice(0, 20)}`
    }
    if (bookings.length > 0) {
      generatedFilename += `-${bookings.length}records`
    }

    filename = generatedFilename + '.csv'
  }

  const csvData = bookings.map(booking => ({
    'Booking ID': booking.id.slice(0, 12), // Truncate for privacy
    'Date': new Date(booking.createdAt).toLocaleString(),
    'Customer': booking.user?.name || 'N/A',
    'Phone': booking.user?.phone || 'N/A',
    'Route': `${booking.trip?.origin} → ${booking.trip?.destination}`,
    'Company': booking.trip?.company?.name || 'N/A',
    'Amount': booking.totalAmount,
    'Status': booking.status,
  }))

  exportToCSV(csvData, filename, [...SAFE_EXPORT_FIELDS])
}

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
 * Export bookings to CSV
 */
export function exportBookingsToCSV(bookings: any[], filename: string = 'bookings.csv') {
  const csvData = bookings.map(booking => ({
    'Booking ID': booking.id,
    'Date': new Date(booking.createdAt).toLocaleString(),
    'Customer': booking.user?.name || 'N/A',
    'Phone': booking.user?.phone || 'N/A',
    'Route': `${booking.trip?.origin} → ${booking.trip?.destination}`,
    'Company': booking.trip?.company?.name || 'N/A',
    'Amount': booking.totalAmount,
    'Status': booking.status,
  }))

  exportToCSV(csvData, filename)
}

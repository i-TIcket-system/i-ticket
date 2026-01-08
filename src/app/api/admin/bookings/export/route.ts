import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/lib/auth"
import { checkRateLimit, getClientIdentifier, rateLimitExceeded } from "@/lib/rate-limit"

/**
 * GET /api/admin/bookings/export
 *
 * P0-SEC-001: Server-side CSV export with proper authorization
 * Exports booking data to CSV with role-based filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Only SUPER_ADMIN can export bookings (for now)
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Only Super Admins can export booking data." },
        { status: 403 }
      )
    }

    // P0: Rate limiting - max 10 exports per hour per user
    const clientId = `export:${session.user.id}`
    if (!checkRateLimit(clientId, { maxRequests: 10, windowMs: 60 * 60 * 1000 })) {
      return rateLimitExceeded(3600)
    }

    // Server-side filtering - Super Admin sees all bookings
    const bookings = await prisma.booking.findMany({
      where: {},
      include: {
        user: {
          select: { name: true, phone: true }
        },
        trip: {
          include: {
            company: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 1000 // Limit to 1000 most recent bookings
    })

    // Generate CSV rows
    const csvRows = []

    // Header row
    csvRows.push([
      'Booking ID',
      'Date',
      'Customer',
      'Phone',
      'Route',
      'Company',
      'Amount (ETB)',
      'Status'
    ].join(','))

    // Data rows
    for (const booking of bookings) {
      const row = [
        booking.id.slice(0, 12), // Truncate ID for privacy
        new Date(booking.createdAt).toLocaleString('en-ET'),
        escapeCSV(booking.user?.name || 'N/A'),
        escapeCSV(booking.user?.phone || 'N/A'),
        escapeCSV(`${booking.trip?.origin} → ${booking.trip?.destination}`),
        escapeCSV(booking.trip?.company?.name || 'N/A'),
        booking.totalAmount.toFixed(2),
        booking.status
      ]
      csvRows.push(row.join(','))
    }

    const csvContent = csvRows.join('\n')
    const today = new Date().toISOString().split('T')[0]
    const filename = `bookings-${today}-${bookings.length}records.csv`

    // P0: Audit log for CSV export
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: 'CSV_EXPORT',
        details: `Exported ${bookings.length} booking records to CSV. User: ${session.user.name}, Role: ${session.user.role}`
      }
    })

    console.log(`[CSV EXPORT] ${session.user.name} exported ${bookings.length} bookings`)

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      }
    })
  } catch (error) {
    console.error("CSV export error:", error)
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    )
  }
}

/**
 * Escape CSV field - handle commas, quotes, newlines
 */
function escapeCSV(value: string): string {
  if (!value) return ''

  const stringValue = String(value)

  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

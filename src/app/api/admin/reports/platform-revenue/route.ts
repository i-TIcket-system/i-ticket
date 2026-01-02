import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generatePlatformRevenueReport } from "@/lib/platform-revenue-report"
import prisma from "@/lib/db"

/**
 * GET /api/admin/reports/platform-revenue
 *
 * Generate platform revenue invoice Excel file
 * Shows all bookings with 5% commission breakdown
 *
 * Query parameters:
 * - date: Single date (YYYY-MM-DD) - defaults to today
 * - startDate: Range start (YYYY-MM-DD)
 * - endDate: Range end (YYYY-MM-DD)
 * - companyId: Filter by specific company (optional)
 * - channel: Filter by channel (WEB/SMS/ALL) - defaults to ALL
 *
 * Requires: Super Admin authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized - Super admin access required" },
        { status: 403 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get('date')
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const companyId = searchParams.get('companyId') || undefined
    const channel = (searchParams.get('channel') as 'WEB' | 'SMS' | 'ALL') || 'ALL'

    // Determine date range
    let startDate: Date
    let endDate: Date

    if (dateParam) {
      // Single date - show that day only
      startDate = new Date(dateParam)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(dateParam)
      endDate.setHours(23, 59, 59, 999)
    } else if (startDateParam && endDateParam) {
      // Date range
      startDate = new Date(startDateParam)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(endDateParam)
      endDate.setHours(23, 59, 59, 999)
    } else {
      // Default to today
      startDate = new Date()
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date()
      endDate.setHours(23, 59, 59, 999)
    }

    // Validate date range (max 90 days)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > 90) {
      return NextResponse.json(
        { error: "Date range cannot exceed 90 days" },
        { status: 400 }
      )
    }

    // Generate report
    const reportBuffer = await generatePlatformRevenueReport({
      startDate,
      endDate,
      companyId,
      channel,
      generatedBy: {
        id: session.user.id,
        name: session.user.name || 'Super Admin'
      }
    })

    // Log report generation
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: 'PLATFORM_REVENUE_REPORT_GENERATED',
        details: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          companyId,
          channel,
          reportSize: reportBuffer.length
        })
      }
    })

    // Format filename
    const dateStr = dateParam
      ? dateParam
      : `${startDateParam}_to_${endDateParam}`

    const filename = `platform-revenue-${dateStr}.xlsx`

    // Return Excel file
    return new NextResponse(new Uint8Array(reportBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': reportBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('[Platform Revenue Report] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate report',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

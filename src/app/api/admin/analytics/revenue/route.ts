import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

/**
 * GET /api/admin/analytics/revenue
 *
 * Get revenue time series for charts
 * Returns daily revenue data for the last 30 days
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized - Super admin access required" },
        { status: 403 }
      )
    }

    // Get last 30 days of revenue data
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    // Query daily revenue with explicit type casting for SQL injection safety
    const dailyRevenue = await prisma.$queryRaw<Array<{
      date: Date
      revenue: number
      commission: number
      bookings: number
    }>>`
      SELECT
        DATE("createdAt") as date,
        COALESCE(SUM("totalAmount"), 0)::float as revenue,
        COALESCE(SUM("commission"), 0)::float as commission,
        COUNT(*)::int as bookings
      FROM "Booking"
      WHERE status = 'PAID'
        AND "createdAt" >= ${thirtyDaysAgo}::timestamp
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `

    // Format for recharts
    const chartData = dailyRevenue.map(row => ({
      date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: Math.round(row.revenue),
      commission: Math.round(row.commission),
      bookings: row.bookings
    }))

    // Calculate summary stats
    const totalRevenue = dailyRevenue.reduce((sum, row) => sum + row.revenue, 0)
    const totalCommission = dailyRevenue.reduce((sum, row) => sum + row.commission, 0)
    const avgDailyRevenue = totalRevenue / (dailyRevenue.length || 1)

    return NextResponse.json({
      chartData,
      summary: {
        totalRevenue,
        totalCommission,
        avgDailyRevenue,
        daysIncluded: dailyRevenue.length
      }
    })
  } catch (error) {
    console.error('[Revenue Analytics] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch revenue analytics' },
      { status: 500 }
    )
  }
}

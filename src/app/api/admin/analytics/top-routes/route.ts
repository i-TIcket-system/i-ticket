import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

/**
 * GET /api/admin/analytics/top-routes
 *
 * Get top 5 most popular routes
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Get top routes from last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Use parameterized query with explicit type casting for SQL injection safety
    const topRoutes = await prisma.$queryRaw<Array<{
      origin: string
      destination: string
      bookings: bigint
      revenue: bigint
    }>>`
      SELECT
        t.origin,
        t.destination,
        COUNT(b.id) as bookings,
        COALESCE(SUM(b."totalAmount"), 0) as revenue
      FROM "Trip" t
      INNER JOIN "Booking" b ON b."tripId" = t.id
      WHERE b.status = 'PAID'
        AND b."createdAt" >= ${thirtyDaysAgo}::timestamp
      GROUP BY t.origin, t.destination
      ORDER BY bookings DESC
      LIMIT 5
    `

    // Convert bigint to number for JSON serialization
    const formattedRoutes = topRoutes.map(route => ({
      origin: route.origin,
      destination: route.destination,
      bookings: Number(route.bookings),
      revenue: Number(route.revenue)
    }))

    return NextResponse.json({ topRoutes: formattedRoutes })
  } catch (error) {
    console.error('[Top Routes] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch top routes' },
      { status: 500 }
    )
  }
}

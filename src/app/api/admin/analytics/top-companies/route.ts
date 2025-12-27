import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

/**
 * GET /api/admin/analytics/top-companies
 *
 * Get top 5 performing companies
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

    // Get companies with their booking counts and revenue
    const companies = await prisma.company.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        isActive: true,
        trips: {
          select: {
            bookings: {
              where: { status: 'PAID' },
              select: {
                totalAmount: true
              }
            }
          }
        }
      }
    })

    // Calculate totals for each company
    const companyStats = companies.map(company => {
      const allBookings = company.trips.flatMap(trip => trip.bookings)
      const bookings = allBookings.length
      const revenue = allBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0)

      return {
        id: company.id,
        name: company.name,
        bookings,
        revenue,
        avgBookingValue: bookings > 0 ? revenue / bookings : 0
      }
    })

    // Sort by bookings and take top 5
    const topCompanies = companyStats
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5)

    return NextResponse.json({ topCompanies })
  } catch (error) {
    console.error('[Top Companies] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch top companies' },
      { status: 500 }
    )
  }
}

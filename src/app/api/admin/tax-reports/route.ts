import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireSuperAdmin, handleAuthError } from "@/lib/auth-helpers"

/**
 * GET /api/admin/tax-reports
 *
 * Tax compliance reporting for Ethiopian Revenue Authority (ERA)
 * Shows monthly/quarterly/yearly VAT collection from platform commissions
 *
 * Query params:
 * - period: "monthly" | "quarterly" | "yearly" (default: monthly)
 * - year: YYYY (default: current year)
 * - month: 1-12 (required if period=monthly)
 * - quarter: 1-4 (required if period=quarterly)
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "monthly"
    const yearParam = searchParams.get("year")
    const year = parseInt(yearParam || new Date().getFullYear().toString())
    const monthParam = searchParams.get("month")
    const month = monthParam ? parseInt(monthParam) : null
    const quarterParam = searchParams.get("quarter")
    const quarter = quarterParam ? parseInt(quarterParam) : null

    // Validate inputs
    if (isNaN(year) || year < 2020 || year > 2100) {
      return NextResponse.json(
        { error: "Invalid year parameter" },
        { status: 400 }
      )
    }

    if (period === "monthly" && (!month || month < 1 || month > 12)) {
      return NextResponse.json(
        { error: "Month parameter required for monthly reports (1-12)" },
        { status: 400 }
      )
    }

    if (period === "quarterly" && (!quarter || quarter < 1 || quarter > 4)) {
      return NextResponse.json(
        { error: "Quarter parameter required for quarterly reports (1-4)" },
        { status: 400 }
      )
    }

    // Calculate date range based on period
    let startDate: Date
    let endDate: Date

    if (period === "monthly") {
      startDate = new Date(year, month! - 1, 1)
      endDate = new Date(year, month!, 0, 23, 59, 59, 999)
    } else if (period === "quarterly") {
      const quarterStartMonth = (quarter! - 1) * 3
      startDate = new Date(year, quarterStartMonth, 1)
      endDate = new Date(year, quarterStartMonth + 3, 0, 23, 59, 59, 999)
    } else {
      // Yearly
      startDate = new Date(year, 0, 1)
      endDate = new Date(year, 11, 31, 23, 59, 59, 999)
    }

    // Fetch paid bookings in date range
    const bookings = await prisma.booking.findMany({
      where: {
        status: "PAID",
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        totalAmount: true,
        commission: true,
        commissionVAT: true,
        createdAt: true,
        trip: {
          select: {
            origin: true,
            destination: true,
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        payment: {
          select: {
            method: true,
            transactionId: true
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    })

    // Calculate totals
    const totalBookings = bookings.length
    const totalPassengerPayments = bookings.reduce((sum, b) => sum + Number(b.totalAmount), 0)
    const totalCommission = bookings.reduce((sum, b) => sum + Number(b.commission), 0)
    const totalVAT = bookings.reduce((sum, b) => sum + Number(b.commissionVAT), 0)
    const totalPlatformRevenue = totalCommission + totalVAT

    // Group by company for detailed breakdown
    const byCompany = bookings.reduce((acc, booking) => {
      const companyId = booking.trip.company.id
      if (!acc[companyId]) {
        acc[companyId] = {
          companyId,
          companyName: booking.trip.company.name,
          bookings: 0,
          totalAmount: 0,
          commission: 0,
          vat: 0
        }
      }
      acc[companyId].bookings++
      acc[companyId].totalAmount += Number(booking.totalAmount)
      acc[companyId].commission += Number(booking.commission)
      acc[companyId].vat += Number(booking.commissionVAT)
      return acc
    }, {} as Record<string, any>)

    const companyBreakdown = Object.values(byCompany).sort((a: any, b: any) => b.vat - a.vat)

    // Group by month for trend analysis
    const byMonth = bookings.reduce((acc, booking) => {
      const monthKey = new Date(booking.createdAt).toISOString().substring(0, 7) // YYYY-MM
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          bookings: 0,
          commission: 0,
          vat: 0
        }
      }
      acc[monthKey].bookings++
      acc[monthKey].commission += Number(booking.commission)
      acc[monthKey].vat += Number(booking.commissionVAT)
      return acc
    }, {} as Record<string, any>)

    const monthlyTrend = Object.values(byMonth).sort((a: any, b: any) =>
      a.month.localeCompare(b.month)
    )

    // Calculate running total of VAT liability (all time up to end date)
    const runningTotal = await prisma.booking.aggregate({
      where: {
        status: "PAID",
        createdAt: {
          lte: endDate
        }
      },
      _sum: {
        commissionVAT: true
      }
    })

    return NextResponse.json({
      period,
      year,
      month,
      quarter,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary: {
        totalBookings,
        totalPassengerPayments,
        totalCommission,
        totalVAT,
        totalPlatformRevenue,
        runningVATLiability: Number(runningTotal._sum.commissionVAT) || 0
      },
      companyBreakdown,
      monthlyTrend,
      bookings: bookings.map(b => ({
        id: b.id,
        date: b.createdAt,
        route: `${b.trip.origin} → ${b.trip.destination}`,
        company: b.trip.company.name,
        totalAmount: Number(b.totalAmount),
        commission: Number(b.commission),
        vat: Number(b.commissionVAT),
        paymentMethod: b.payment?.method || "N/A",
        transactionId: b.payment?.transactionId || "N/A"
      }))
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

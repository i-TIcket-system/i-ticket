import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireSuperAdmin, handleAuthError } from "@/lib/auth-helpers"

/**
 * Get system-wide statistics for super admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()

    // Define date ranges
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      // Total counts
      totalUsers,
      customerCount,
      companyAdminCount,
      guestUserCount,
      totalCompanies,
      activeCompanies,
      totalTrips,
      activeTrips,
      totalBookings,
      paidBookings,
      pendingBookings,
      cancelledBookings,

      // Revenue aggregations
      totalRevenue,
      todayRevenue,
      yesterdayRevenue,
      weekRevenue,
      monthRevenue,

      // Channel breakdown
      webBookings,
      smsBookings,

      // Payment methods
      telebirrPayments,
      demoPayments,

      // Today's activity
      todayBookings,
      todayUsers,

      // Recent bookings
      recentBookings,

      // NEW: Business Insights - Booking analytics by hour for peak hours
      bookingsByHour,
    ] = await Promise.all([
      // User counts
      prisma.user.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.user.count({ where: { role: "COMPANY_ADMIN" } }),
      prisma.user.count({ where: { isGuestUser: true } }),

      // Company counts
      prisma.company.count(),
      prisma.company.count({ where: { isActive: true } }),

      // Trip counts
      prisma.trip.count(),
      prisma.trip.count({
        where: {
          isActive: true,
          departureTime: { gte: now },
        },
      }),

      // Booking counts
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "PAID" } }),
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.booking.count({ where: { status: "CANCELLED" } }),

      // Revenue totals
      prisma.booking.aggregate({
        where: { status: "PAID" },
        _sum: { totalAmount: true, commission: true },
      }),
      prisma.booking.aggregate({
        where: { status: "PAID", createdAt: { gte: todayStart } },
        _sum: { totalAmount: true, commission: true },
      }),
      prisma.booking.aggregate({
        where: { status: "PAID", createdAt: { gte: yesterdayStart, lt: todayStart } },
        _sum: { totalAmount: true, commission: true },
      }),
      prisma.booking.aggregate({
        where: { status: "PAID", createdAt: { gte: weekAgo } },
        _sum: { totalAmount: true, commission: true },
      }),
      prisma.booking.aggregate({
        where: { status: "PAID", createdAt: { gte: monthAgo } },
        _sum: { totalAmount: true, commission: true },
      }),

      // Channel breakdown
      prisma.payment.count({
        where: { status: "SUCCESS", initiatedVia: "WEB" }
      }),
      prisma.payment.count({
        where: { status: "SUCCESS", initiatedVia: "SMS" }
      }),

      // Payment methods
      prisma.payment.count({
        where: { status: "SUCCESS", method: "TELEBIRR" }
      }),
      prisma.payment.count({
        where: { status: "SUCCESS", method: "DEMO" }
      }),

      // Today's activity
      prisma.booking.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),

      // Recent bookings
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, phone: true },
          },
          trip: {
            include: {
              company: {
                select: { name: true },
              },
            },
          },
        },
      }),

      // NEW: Get all bookings with timestamps for hourly analysis
      prisma.booking.findMany({
        where: { status: "PAID", createdAt: { gte: weekAgo } },
        select: { createdAt: true }
      }),
    ])

    // Calculate changes
    const todayRevenueValue = todayRevenue._sum.totalAmount || 0
    const yesterdayRevenueValue = yesterdayRevenue._sum.totalAmount || 0
    const revenueChange = yesterdayRevenueValue > 0
      ? ((todayRevenueValue - yesterdayRevenueValue) / yesterdayRevenueValue) * 100
      : 0

    // P1-QA-001: Calculate Business Insights with division-by-zero guards
    // 1. Average Booking Value - FIXED: Guard against zero division
    const avgBookingValue = paidBookings > 0
      ? (totalRevenue._sum.totalAmount || 0) / paidBookings
      : 0

    // 2. Cancellation Rate - FIXED: Guard against zero division
    const cancellationRate = totalBookings > 0
      ? (cancelledBookings / totalBookings) * 100
      : 0

    // 3. Booking Success Rate (paid / total) - FIXED: Guard against zero division
    const bookingSuccessRate = totalBookings > 0
      ? (paidBookings / totalBookings) * 100
      : 0

    // 4. Peak Booking Hours (analyze last 7 days)
    const hourlyDistribution: { [hour: number]: number } = {}
    bookingsByHour.forEach((booking: any) => {
      const hour = new Date(booking.createdAt).getHours()
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1
    })

    // Find top 3 peak hours - P2-QA-005: Use 12-hour format for Ethiopian users
    let peakHours = Object.entries(hourlyDistribution)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([hour, count]) => {
        const hourNum = parseInt(hour)
        // Validate hourNum to prevent NaN issues (should always be valid from DB, but defensive)
        if (isNaN(hourNum) || hourNum < 0 || hourNum > 23) {
          return { hour: 0, count: count as number, label: '12:00 AM' }
        }
        const ampm = hourNum >= 12 ? 'PM' : 'AM'
        const hour12 = hourNum % 12 || 12

        return {
          hour: hourNum,
          count: count as number,
          label: `${hour12}:00 ${ampm}`
        }
      })

    // P1-QA-001: Return default peak hours if no booking data (12-hour format)
    if (peakHours.length === 0) {
      peakHours = [
        { hour: 9, count: 0, label: '9:00 AM' },
        { hour: 14, count: 0, label: '2:00 PM' },
        { hour: 17, count: 0, label: '5:00 PM' }
      ]
    }

    return NextResponse.json({
      stats: {
        users: {
          total: totalUsers,
          customers: customerCount,
          companyAdmins: companyAdminCount,
          guests: guestUserCount,
          newToday: todayUsers,
        },
        companies: {
          total: totalCompanies,
          active: activeCompanies,
          inactive: totalCompanies - activeCompanies,
        },
        trips: {
          total: totalTrips,
          active: activeTrips,
        },
        bookings: {
          total: totalBookings,
          paid: paidBookings,
          pending: pendingBookings,
          cancelled: cancelledBookings,
          today: todayBookings,
        },
        revenue: {
          total: totalRevenue._sum.totalAmount || 0,
          commission: totalRevenue._sum.commission || 0,
          today: todayRevenueValue,
          todayCommission: todayRevenue._sum.commission || 0,
          yesterday: yesterdayRevenueValue,
          thisWeek: weekRevenue._sum.totalAmount || 0,
          thisMonth: monthRevenue._sum.totalAmount || 0,
          change: revenueChange,
        },
        channels: {
          web: webBookings,
          sms: smsBookings,
          total: webBookings + smsBookings,
        },
        payments: {
          telebirr: telebirrPayments,
          demo: demoPayments,
        },
        // NEW: Business Insights
        insights: {
          avgBookingValue,
          cancellationRate,
          bookingSuccessRate,
          peakHours,
        },
      },
      recentBookings,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

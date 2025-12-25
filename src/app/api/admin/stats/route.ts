import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireSuperAdmin, handleAuthError } from "@/lib/auth-helpers"

/**
 * Get system-wide statistics for super admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const [
      totalUsers,
      totalCompanies,
      totalTrips,
      totalBookings,
      totalRevenue,
      activeTrips,
      pendingBookings,
      recentBookings,
    ] = await Promise.all([
      // Total counts
      prisma.user.count(),
      prisma.company.count(),
      prisma.trip.count(),
      prisma.booking.count(),

      // Total revenue (sum of all paid bookings)
      prisma.booking.aggregate({
        where: { status: "PAID" },
        _sum: { totalAmount: true, commission: true },
      }),

      // Active trips count
      prisma.trip.count({
        where: {
          isActive: true,
          departureTime: { gte: new Date() },
        },
      }),

      // Pending bookings count
      prisma.booking.count({
        where: { status: "PENDING" },
      }),

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
    ])

    return NextResponse.json({
      stats: {
        users: {
          total: totalUsers,
        },
        companies: {
          total: totalCompanies,
        },
        trips: {
          total: totalTrips,
          active: activeTrips,
        },
        bookings: {
          total: totalBookings,
          pending: pendingBookings,
        },
        revenue: {
          total: totalRevenue._sum.totalAmount || 0,
          commission: totalRevenue._sum.commission || 0,
        },
      },
      recentBookings,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

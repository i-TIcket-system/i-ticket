import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    if (session.user.role !== "COMPANY_ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    const companyFilter: any = {}
    if (session.user.role === "COMPANY_ADMIN" && session.user.companyId) {
      companyFilter.companyId = session.user.companyId
    }

    // Get total trips
    const totalTrips = await prisma.trip.count({
      where: companyFilter,
    })

    // Get active trips (future departures)
    const activeTrips = await prisma.trip.count({
      where: {
        ...companyFilter,
        departureTime: { gte: new Date() },
        isActive: true,
      },
    })

    // Get total bookings and revenue
    const bookingsData = await prisma.booking.aggregate({
      where: {
        trip: companyFilter,
        status: "PAID",
      },
      _count: true,
      _sum: {
        totalAmount: true,
      },
    })

    const stats = {
      totalTrips,
      activeTrips,
      totalBookings: bookingsData._count,
      totalRevenue: Number(bookingsData._sum.totalAmount) || 0,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Stats fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

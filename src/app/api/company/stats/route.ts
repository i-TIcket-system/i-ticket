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
    // CRITICAL FIX: Aggregate commission and VAT to calculate ACTUAL company revenue
    // Company revenue = totalAmount - commission - commissionVAT
    const bookingsData = await prisma.booking.aggregate({
      where: {
        trip: companyFilter,
        status: "PAID",
      },
      _count: true,
      _sum: {
        totalAmount: true,
        commission: true,
        commissionVAT: true,
      },
    })

    // Fleet metrics
    const vehicleCompanyFilter = session.user.role === "COMPANY_ADMIN" && session.user.companyId
      ? { companyId: session.user.companyId }
      : {}

    const [vehicleStats, tripLogStats] = await Promise.all([
      // Vehicle counts by status
      prisma.vehicle.groupBy({
        by: ['status'],
        where: vehicleCompanyFilter,
        _count: true,
      }),
      // Trip log aggregates (completed trips with logs)
      prisma.tripLog.aggregate({
        where: vehicleCompanyFilter,
        _sum: {
          distanceTraveled: true,
          fuelConsumed: true,
        },
        _count: true,
        _avg: {
          fuelEfficiency: true,
        },
      }),
    ])

    // Transform vehicle stats
    const vehicleCounts = {
      total: 0,
      active: 0,
      maintenance: 0,
      inactive: 0,
    }
    vehicleStats.forEach((v) => {
      vehicleCounts.total += v._count
      if (v.status === 'ACTIVE') vehicleCounts.active = v._count
      if (v.status === 'MAINTENANCE') vehicleCounts.maintenance = v._count
      if (v.status === 'INACTIVE') vehicleCounts.inactive = v._count
    })

    // CRITICAL FIX: Calculate actual company revenue (exclude platform fees)
    // Company receives: Ticket price only
    // Platform receives: Commission + VAT
    const totalPaid = Number(bookingsData._sum.totalAmount) || 0
    const platformCommission = Number(bookingsData._sum.commission) || 0
    const platformVAT = Number(bookingsData._sum.commissionVAT) || 0
    const actualCompanyRevenue = totalPaid - platformCommission - platformVAT

    const stats = {
      totalTrips,
      activeTrips,
      totalBookings: bookingsData._count,
      totalRevenue: actualCompanyRevenue, // FIXED: Now shows actual revenue (excludes platform fees)
      // Additional transparency fields
      totalPassengerPayments: totalPaid, // Total amount passengers paid
      platformCommission, // Amount paid to i-Ticket as commission
      platformVAT, // VAT collected by i-Ticket
      // Fleet metrics
      vehicles: vehicleCounts,
      fleetMetrics: {
        totalDistance: tripLogStats._sum.distanceTraveled || 0,
        totalFuelConsumed: tripLogStats._sum.fuelConsumed || 0,
        avgFuelEfficiency: tripLogStats._avg.fuelEfficiency || 0,
        completedTripLogs: tripLogStats._count,
      },
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

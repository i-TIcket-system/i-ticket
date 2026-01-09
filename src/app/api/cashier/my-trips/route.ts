import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

/**
 * GET /api/cashier/my-trips
 * Returns trips assigned to the logged-in manual ticketer
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is a manual ticketer
    if (
      session.user.role !== "COMPANY_ADMIN" ||
      session.user.staffRole !== "MANUAL_TICKETER"
    ) {
      return NextResponse.json(
        { error: "Access denied. Only manual ticketers can access this endpoint." },
        { status: 403 }
      )
    }

    const userId = session.user.id

    // Get trips assigned to this ticketer
    const trips = await prisma.trip.findMany({
      where: {
        manualTicketerId: userId,
        // Show trips from past 24 hours to 7 days ahead
        departureTime: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days ahead
        },
      },
      select: {
        id: true,
        origin: true,
        destination: true,
        departureTime: true,
        estimatedDuration: true,
        price: true,
        busType: true,
        totalSlots: true,
        availableSlots: true,
        vehicle: {
          select: {
            plateNumber: true,
            sideNumber: true,
          },
        },
      },
      orderBy: {
        departureTime: "asc",
      },
    })

    // Calculate today's stats for this ticketer
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // Get bookings created by this ticketer today (manual tickets)
    const todayBookings = await prisma.booking.findMany({
      where: {
        isQuickTicket: true, // Manual tickets are quick tickets
        trip: {
          manualTicketerId: userId,
        },
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: {
          not: "CANCELLED",
        },
      },
      select: {
        totalAmount: true,
        passengers: {
          select: { id: true },
        },
      },
    })

    const stats = {
      totalSold: todayBookings.reduce((sum, b) => sum + b.passengers.length, 0),
      totalRevenue: todayBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0),
      tripsWorked: new Set(trips.filter((t) => new Date(t.departureTime) <= new Date()).map((t) => t.id)).size,
    }

    return NextResponse.json({
      trips,
      stats,
    })
  } catch (error) {
    console.error("Cashier trips fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch assigned trips" },
      { status: 500 }
    )
  }
}

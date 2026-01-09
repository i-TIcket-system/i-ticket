import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

/**
 * GET /api/cashier/trip/[tripId]
 * Returns trip details for the assigned cashier
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
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

    const tripId = params.tripId
    const userId = session.user.id

    // Get trip details - verify it's assigned to this ticketer
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        manualTicketerId: userId,
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
        company: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found or not assigned to you" },
        { status: 404 }
      )
    }

    // Get recent sales for this trip by this ticketer (last 10)
    const recentBookings = await prisma.booking.findMany({
      where: {
        tripId: tripId,
        isQuickTicket: true,
        status: {
          not: "CANCELLED",
        },
      },
      select: {
        id: true,
        totalAmount: true,
        createdAt: true,
        passengers: {
          select: {
            seatNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    })

    const recentSales = recentBookings.map((b) => ({
      id: b.id,
      seatNumbers: b.passengers
        .map((p) => p.seatNumber)
        .filter((s): s is number => s !== null)
        .sort((a, b) => a - b),
      amount: Number(b.totalAmount),
      time: b.createdAt.toISOString(),
    }))

    return NextResponse.json({
      trip,
      recentSales,
    })
  } catch (error) {
    console.error("Cashier trip fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch trip details" },
      { status: 500 }
    )
  }
}

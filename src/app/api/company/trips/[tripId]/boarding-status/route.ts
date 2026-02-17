import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/lib/auth"

/**
 * GET /api/company/trips/[tripId]/boarding-status
 * Returns all passengers with boarding status for the boarding checklist
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { tripId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (session.user.role !== "COMPANY_ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        companyId: true,
        status: true,
        totalSlots: true,
        noShowCount: true,
        releasedSeats: true,
        replacementsSold: true,
      },
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Company segregation
    if (session.user.role === "COMPANY_ADMIN" && trip.companyId !== session.user.companyId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Guard: only BOARDING or DEPARTED
    if (!["BOARDING", "DEPARTED"].includes(trip.status)) {
      return NextResponse.json(
        { error: `Boarding checklist is only available for BOARDING or DEPARTED trips (current: ${trip.status})` },
        { status: 400 }
      )
    }

    // Get all passengers from PAID bookings
    const bookings = await prisma.booking.findMany({
      where: {
        tripId,
        status: "PAID",
      },
      include: {
        passengers: {
          select: {
            id: true,
            name: true,
            phone: true,
            seatNumber: true,
            boardingStatus: true,
            pickupLocation: true,
            dropoffLocation: true,
          },
        },
        tickets: {
          select: {
            id: true,
            shortCode: true,
            isUsed: true,
            passengerName: true,
            seatNumber: true,
          },
        },
        user: {
          select: { name: true, phone: true },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    // Flatten passengers with ticket info
    const passengers = bookings.flatMap((booking) =>
      booking.passengers.map((p) => {
        const ticket = booking.tickets.find(
          (t) => t.seatNumber === p.seatNumber || t.passengerName === p.name
        )
        return {
          id: p.id,
          name: p.name,
          phone: p.phone,
          seatNumber: p.seatNumber,
          boardingStatus: p.boardingStatus,
          pickupLocation: p.pickupLocation,
          dropoffLocation: p.dropoffLocation,
          bookingId: booking.id,
          isReplacement: booking.isReplacement,
          isQuickTicket: booking.isQuickTicket,
          ticketShortCode: ticket?.shortCode || null,
          ticketUsed: ticket?.isUsed || false,
          bookedBy: booking.user.name,
          bookedByPhone: booking.user.phone,
        }
      })
    )

    // Sort by seat number
    passengers.sort((a, b) => (a.seatNumber || 999) - (b.seatNumber || 999))

    // Summary counts
    const boarded = passengers.filter((p) => p.boardingStatus === "BOARDED").length
    const pending = passengers.filter((p) => p.boardingStatus === "PENDING").length
    const noShow = passengers.filter((p) => p.boardingStatus === "NO_SHOW").length

    return NextResponse.json({
      passengers,
      summary: {
        total: passengers.length,
        boarded,
        pending,
        noShow,
        noShowCount: trip.noShowCount,
        releasedSeats: trip.releasedSeats,
        replacementsSold: trip.replacementsSold,
      },
    })
  } catch (error) {
    console.error("Boarding status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

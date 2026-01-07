import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

/**
 * GET /api/trips/[tripId]/seats
 * Returns occupied seat numbers for a trip (for real-time seat map)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const tripId = params.tripId

    // Fetch trip to get total slots
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        totalSlots: true,
        availableSlots: true,
      },
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Get all occupied seats (exclude cancelled bookings)
    const occupiedPassengers = await prisma.passenger.findMany({
      where: {
        booking: {
          tripId,
          status: {
            not: "CANCELLED",
          },
        },
        seatNumber: {
          not: null,
        },
      },
      select: {
        seatNumber: true,
      },
    })

    // Extract seat numbers
    const occupiedSeats = occupiedPassengers
      .map((p) => p.seatNumber)
      .filter((seat): seat is number => seat !== null)
      .sort((a, b) => a - b)

    // Generate available seats array
    const availableSeats: number[] = []
    for (let seat = 1; seat <= trip.totalSlots; seat++) {
      if (!occupiedSeats.includes(seat)) {
        availableSeats.push(seat)
      }
    }

    return NextResponse.json({
      totalSlots: trip.totalSlots,
      availableSlots: trip.availableSlots,
      occupiedSeats,
      availableSeats,
    })
  } catch (error) {
    console.error("Seats fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch seat availability" },
      { status: 500 }
    )
  }
}

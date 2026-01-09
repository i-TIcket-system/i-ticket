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

    // Extract seat numbers from passengers
    const assignedSeats = occupiedPassengers
      .map((p) => p.seatNumber)
      .filter((seat): seat is number => seat !== null)
      .sort((a, b) => a - b)

    // Calculate how many seats should be occupied based on availableSlots
    const expectedOccupied = trip.totalSlots - trip.availableSlots

    // Use assigned seats if we have them, otherwise derive from slot count
    // This handles legacy data or manual ticket sales that didn't assign seat numbers
    let occupiedSeats: number[]
    if (assignedSeats.length >= expectedOccupied) {
      // We have seat assignments, use them
      occupiedSeats = assignedSeats
    } else {
      // Not enough seat assignments - fill in missing with first available seats
      const occupiedSet = new Set(assignedSeats)
      let seatToAssign = 1
      while (occupiedSet.size < expectedOccupied && seatToAssign <= trip.totalSlots) {
        if (!occupiedSet.has(seatToAssign)) {
          occupiedSet.add(seatToAssign)
        }
        seatToAssign++
      }
      occupiedSeats = Array.from(occupiedSet).sort((a, b) => a - b)
    }

    // Generate available seats array
    const occupiedSet = new Set(occupiedSeats)
    const availableSeats: number[] = []
    for (let seat = 1; seat <= trip.totalSlots; seat++) {
      if (!occupiedSet.has(seat)) {
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

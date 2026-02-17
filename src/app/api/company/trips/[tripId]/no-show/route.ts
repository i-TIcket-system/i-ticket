import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { transactionWithTimeout } from "@/lib/db"
import { authOptions } from "@/lib/auth"

/**
 * POST /api/company/trips/[tripId]/no-show
 * Mark passengers as NO_SHOW after trip has departed
 */
export async function POST(
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

    const body = await request.json()
    const { passengerIds } = body

    if (!Array.isArray(passengerIds) || passengerIds.length === 0) {
      return NextResponse.json(
        { error: "passengerIds must be a non-empty array" },
        { status: 400 }
      )
    }

    const result = await transactionWithTimeout(async (tx) => {
      // Get trip
      const trip = await tx.trip.findUnique({
        where: { id: tripId },
        select: {
          id: true,
          companyId: true,
          status: true,
          noShowCount: true,
          releasedSeats: true,
          replacementsSold: true,
        },
      })

      if (!trip) {
        throw new Error("Trip not found")
      }

      // Company segregation
      if (session.user.role === "COMPANY_ADMIN" && trip.companyId !== session.user.companyId) {
        throw new Error("ACCESS_DENIED")
      }

      // Guard: only DEPARTED trips
      if (trip.status !== "DEPARTED") {
        throw new Error(`No-show marking is only allowed for DEPARTED trips (current: ${trip.status})`)
      }

      // Verify each passenger belongs to this trip via a PAID booking
      const passengers = await tx.passenger.findMany({
        where: {
          id: { in: passengerIds },
          booking: {
            tripId,
            status: "PAID",
          },
        },
        include: {
          booking: {
            select: {
              id: true,
              tripId: true,
              status: true,
              tickets: {
                select: {
                  id: true,
                  isUsed: true,
                  seatNumber: true,
                },
              },
            },
          },
        },
      })

      if (passengers.length !== passengerIds.length) {
        const foundIds = new Set(passengers.map((p: { id: string }) => p.id))
        const missing = passengerIds.filter((id: string) => !foundIds.has(id))
        throw new Error(`Passengers not found or not in this trip: ${missing.join(", ")}`)
      }

      const markedPassengers: { id: string; name: string; seatNumber: number | null }[] = []
      const skippedPassengers: { id: string; name: string; reason: string }[] = []

      for (const passenger of passengers) {
        // Skip already NO_SHOW (idempotent)
        if (passenger.boardingStatus === "NO_SHOW") {
          skippedPassengers.push({
            id: passenger.id,
            name: passenger.name,
            reason: "Already marked as NO_SHOW",
          })
          continue
        }

        // Can't mark BOARDED passengers as no-show
        if (passenger.boardingStatus === "BOARDED") {
          skippedPassengers.push({
            id: passenger.id,
            name: passenger.name,
            reason: "Already BOARDED",
          })
          continue
        }

        // Check if ticket is already used (scanned at boarding)
        const ticket = passenger.booking.tickets.find(
          (t: { id: string; isUsed: boolean; seatNumber: number | null }) => t.seatNumber === passenger.seatNumber
        )
        if (ticket?.isUsed) {
          skippedPassengers.push({
            id: passenger.id,
            name: passenger.name,
            reason: "Ticket already scanned/used",
          })
          continue
        }

        // Mark as NO_SHOW
        await tx.passenger.update({
          where: { id: passenger.id },
          data: { boardingStatus: "NO_SHOW" },
        })

        markedPassengers.push({
          id: passenger.id,
          name: passenger.name,
          seatNumber: passenger.seatNumber,
        })
      }

      if (markedPassengers.length === 0) {
        return {
          success: true,
          noShowCount: trip.noShowCount,
          releasedSeats: trip.releasedSeats,
          markedPassengers: [],
          skippedPassengers,
          message: "No passengers were marked as no-show",
        }
      }

      // Update trip counters
      const newNoShowCount = trip.noShowCount + markedPassengers.length
      const newReleasedSeats = newNoShowCount - trip.replacementsSold

      const updatedTrip = await tx.trip.update({
        where: { id: tripId },
        data: {
          noShowCount: newNoShowCount,
          releasedSeats: newReleasedSeats,
        },
      })

      // Audit log
      await tx.adminLog.create({
        data: {
          userId: session.user.id,
          action: "PASSENGER_NO_SHOW",
          tripId,
          details: `${session.user.name} marked ${markedPassengers.length} passenger(s) as NO_SHOW: ${markedPassengers.map((p) => `${p.name} (Seat ${p.seatNumber})`).join(", ")}`,
        },
      })

      console.log(
        `[NO-SHOW] ${session.user.name} marked ${markedPassengers.length} passengers as NO_SHOW on trip ${tripId}. Released seats: ${updatedTrip.releasedSeats}`
      )

      return {
        success: true,
        noShowCount: updatedTrip.noShowCount,
        releasedSeats: updatedTrip.releasedSeats,
        markedPassengers,
        skippedPassengers,
      }
    })

    if ((result as any) === "ACCESS_DENIED") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("No-show marking error:", error)

    if (error.message === "ACCESS_DENIED") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message?.includes("only allowed") ? 400 : 500 }
    )
  }
}

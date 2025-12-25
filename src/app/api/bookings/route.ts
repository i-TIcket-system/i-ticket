import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/lib/auth"
import { getAvailableSeatNumbers } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tripId, passengers, totalAmount, commission } = body

    // Validate input
    if (!tripId || !passengers || passengers.length === 0) {
      return NextResponse.json(
        { error: "Trip ID and passengers are required" },
        { status: 400 }
      )
    }

    if (passengers.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 passengers per booking" },
        { status: 400 }
      )
    }

    // Use transaction to ensure atomic booking
    const booking = await prisma.$transaction(async (tx) => {
      // Get trip with lock
      const trip = await tx.trip.findUnique({
        where: { id: tripId },
      })

      if (!trip) {
        throw new Error("Trip not found")
      }

      if (trip.bookingHalted) {
        throw new Error("Booking is currently halted for this trip")
      }

      if (trip.availableSlots < passengers.length) {
        throw new Error("Not enough seats available")
      }

      // Get available seat numbers
      const seatNumbers = await getAvailableSeatNumbers(
        tripId,
        passengers.length,
        trip.totalSlots,
        tx
      )

      // Create booking with seat assignments
      const newBooking = await tx.booking.create({
        data: {
          tripId,
          userId: session.user.id,
          totalAmount,
          commission,
          status: "PENDING",
          passengers: {
            create: passengers.map((p: any, index: number) => ({
              name: p.name,
              nationalId: p.nationalId,
              phone: p.phone,
              seatNumber: seatNumbers[index], // Assign seat number
              specialNeeds: p.specialNeeds || null,
              pickupLocation: p.pickupLocation || null,
              dropoffLocation: p.dropoffLocation || null,
            })),
          },
        },
        include: {
          passengers: true,
          trip: {
            include: {
              company: true,
            },
          },
        },
      })

      // Update available slots
      await tx.trip.update({
        where: { id: tripId },
        data: {
          availableSlots: {
            decrement: passengers.length,
          },
        },
      })

      // CRITICAL: Auto-halt if slots drop to 10 or below
      const updatedTrip = await tx.trip.findUnique({
        where: { id: tripId },
      })

      if (updatedTrip && updatedTrip.availableSlots <= 10 && !updatedTrip.bookingHalted) {
        // Halt booking automatically
        await tx.trip.update({
          where: { id: tripId },
          data: {
            lowSlotAlertSent: true,
            bookingHalted: true,
          },
        })

        // Log the auto-halt event
        await tx.adminLog.create({
          data: {
            userId: "SYSTEM",
            action: "AUTO_HALT_LOW_SLOTS",
            tripId,
            details: JSON.stringify({
              reason: "Slots dropped to 10 or below",
              availableSlots: updatedTrip.availableSlots,
              totalSlots: updatedTrip.totalSlots,
              triggeredBy: "online_booking",
              timestamp: new Date().toISOString(),
            }),
          },
        })

        // In production, send SMS notification to company admin
        console.log(`[ALERT] Trip ${tripId} auto-halted: Only ${updatedTrip.availableSlots} slots remaining`)
      }

      // BUS FULL: Generate manifest if all seats are sold
      if (updatedTrip && updatedTrip.availableSlots === 0 && !updatedTrip.reportGenerated) {
        await tx.trip.update({
          where: { id: tripId },
          data: { reportGenerated: true }
        })

        await tx.adminLog.create({
          data: {
            userId: "SYSTEM",
            action: "BUS_FULL_MANIFEST_READY",
            tripId,
            details: JSON.stringify({
              totalSlots: updatedTrip.totalSlots,
              iTicketBookings: await tx.passenger.count({
                where: { booking: { tripId, status: "PAID" } }
              }),
              generatedAt: new Date().toISOString(),
            }),
          },
        })

        console.log(`[MANIFEST] Bus FULL for trip ${tripId}! Passenger manifest ready for download.`)
      }

      return newBooking
    })

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error("Booking error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Booking failed" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")

    const where: any = { userId: session.user.id }
    if (status) {
      where.status = status
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        trip: {
          include: {
            company: true,
          },
        },
        passengers: true,
        payment: true,
        tickets: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error("Bookings fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

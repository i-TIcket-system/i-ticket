import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/lib/auth"

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

      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          tripId,
          userId: session.user.id,
          totalAmount,
          commission,
          status: "PENDING",
          passengers: {
            create: passengers.map((p: any) => ({
              name: p.name,
              nationalId: p.nationalId,
              phone: p.phone,
              specialNeeds: p.specialNeeds || null,
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

      // Check if low slot alert needed
      const updatedTrip = await tx.trip.findUnique({
        where: { id: tripId },
      })

      if (updatedTrip) {
        const slotsPercentage = (updatedTrip.availableSlots / updatedTrip.totalSlots) * 100

        if (slotsPercentage <= 10 && !updatedTrip.lowSlotAlertSent) {
          // Mark alert as sent and halt booking
          await tx.trip.update({
            where: { id: tripId },
            data: {
              lowSlotAlertSent: true,
              bookingHalted: true,
            },
          })

          // Log the event
          await tx.adminLog.create({
            data: {
              userId: "SYSTEM",
              action: "LOW_SLOT_ALERT",
              tripId,
              details: `Trip reached ${slotsPercentage.toFixed(1)}% availability. Online booking halted automatically.`,
            },
          })

          // In production, send SMS notification to company admin here
          console.log(`[SMS] Low slot alert for trip ${tripId}: ${slotsPercentage.toFixed(1)}% remaining`)
        }
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

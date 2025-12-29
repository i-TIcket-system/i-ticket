import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Fetch booking with user details
    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      include: {
        trip: {
          include: {
            company: true,
            driver: {
              select: {
                id: true,
                name: true,
                phone: true,
                licenseNumber: true,
              },
            },
            conductor: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        passengers: true,
        payment: true,
        tickets: true,
        user: {
          select: {
            id: true,
            isGuestUser: true,
          }
        }
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    // Allow access if:
    // 1. User is logged in and owns the booking
    // 2. User is admin
    // 3. Booking belongs to a guest user (no authentication required for guest bookings)
    if (session?.user?.id) {
      // Logged in user - check ownership
      if (booking.userId !== session.user.id && session.user.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        )
      }
    } else {
      // Not logged in - only allow if this is a guest booking
      if (!booking.user.isGuestUser) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        )
      }
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error("Booking fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // SECURITY: Verify ownership before allowing update
    const existingBooking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      select: { userId: true, status: true }
    })

    if (!existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Only booking owner or super admin can update
    if (existingBooking.userId !== session.user.id && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "You can only update your own bookings" },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Only allow updating specific fields (prevent malicious updates)
    const allowedUpdates: any = {}

    // Only allow status updates to CANCELLED by user
    if (body.status === "CANCELLED" && existingBooking.status === "PENDING") {
      allowedUpdates.status = "CANCELLED"
    }

    // If no valid updates, return error
    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json(
        { error: "No valid updates provided or booking cannot be modified" },
        { status: 400 }
      )
    }

    const booking = await prisma.booking.update({
      where: { id: params.bookingId },
      data: allowedUpdates,
      include: {
        trip: true,
        passengers: true,
      },
    })

    // If cancelled, restore available slots
    if (allowedUpdates.status === "CANCELLED") {
      const passengerCount = await prisma.passenger.count({
        where: { bookingId: params.bookingId }
      })

      await prisma.trip.update({
        where: { id: booking.tripId },
        data: {
          availableSlots: { increment: passengerCount }
        }
      })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error("Booking update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

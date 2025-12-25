import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { tripId } = await params

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

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        bookings: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
            passengers: {
              select: {
                id: true,
                name: true,
                nationalId: true,
                phone: true,
                seatNumber: true,
              },
            },
            tickets: {
              select: {
                id: true,
                shortCode: true,
                isUsed: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      )
    }

    // Verify company access for COMPANY_ADMIN
    if (session.user.role === "COMPANY_ADMIN" && trip.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    return NextResponse.json({ trip })
  } catch (error) {
    console.error("Trip fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { tripId } = await params

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

    // Find existing trip
    const existingTrip = await prisma.trip.findUnique({
      where: { id: tripId },
    })

    if (!existingTrip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      )
    }

    // Verify company access
    if (session.user.role === "COMPANY_ADMIN" && existingTrip.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      origin,
      destination,
      departureTime,
      estimatedDuration,
      price,
      busType,
      totalSlots,
      hasWater,
      hasFood,
      bookingHalted,
      isActive,
    } = body

    // Calculate new available slots if total slots changed
    let newAvailableSlots = existingTrip.availableSlots
    if (totalSlots && totalSlots !== existingTrip.totalSlots) {
      const slotsDifference = totalSlots - existingTrip.totalSlots
      newAvailableSlots = Math.max(0, existingTrip.availableSlots + slotsDifference)
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        ...(origin && { origin }),
        ...(destination && { destination }),
        ...(departureTime && { departureTime: new Date(departureTime) }),
        ...(estimatedDuration && { estimatedDuration }),
        ...(price && { price }),
        ...(busType && { busType }),
        ...(totalSlots && { totalSlots, availableSlots: newAvailableSlots }),
        ...(hasWater !== undefined && { hasWater }),
        ...(hasFood !== undefined && { hasFood }),
        ...(bookingHalted !== undefined && { bookingHalted }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ trip: updatedTrip })
  } catch (error) {
    console.error("Trip update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { tripId } = await params

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

    const existingTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bookings: {
          where: { status: "PAID" },
        },
      },
    })

    if (!existingTrip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      )
    }

    // Verify company access
    if (session.user.role === "COMPANY_ADMIN" && existingTrip.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    // Prevent deletion if there are paid bookings
    if (existingTrip.bookings.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete trip with existing bookings. Deactivate it instead." },
        { status: 400 }
      )
    }

    await prisma.trip.delete({
      where: { id: tripId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Trip delete error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

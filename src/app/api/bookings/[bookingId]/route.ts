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

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
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
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    // Check ownership (unless admin)
    if (booking.userId !== session.user.id && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
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

    const body = await request.json()

    const booking = await prisma.booking.update({
      where: { id: params.bookingId },
      data: body,
      include: {
        trip: true,
        passengers: true,
      },
    })

    return NextResponse.json({ booking })
  } catch (error) {
    console.error("Booking update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

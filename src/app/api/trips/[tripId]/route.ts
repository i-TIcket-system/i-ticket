import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: params.tripId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            phones: true,
            email: true,
          },
        },
      },
    })

    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const body = await request.json()

    const trip = await prisma.trip.update({
      where: { id: params.tripId },
      data: body,
    })

    return NextResponse.json({ trip })
  } catch (error) {
    console.error("Trip update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

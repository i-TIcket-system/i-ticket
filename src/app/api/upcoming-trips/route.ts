import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { handleApiError } from "@/lib/utils"

export async function GET() {
  try {
    const now = new Date()
    // Get trips for the next 3 days
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    const trips = await prisma.trip.findMany({
      where: {
        isActive: true,
        bookingHalted: false,
        availableSlots: { gt: 0 },
        departureTime: {
          gte: now,
          lte: threeDaysFromNow,
        },
      },
      orderBy: { departureTime: "asc" },
      select: {
        id: true,
        origin: true,
        destination: true,
        departureTime: true,
        price: true,
        busType: true,
        totalSlots: true,
        availableSlots: true,
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
      take: 6, // Max 6 trips
    })

    return NextResponse.json({ trips })
  } catch (error) {
    console.error("Upcoming trips fetch error:", error)
    const { message, status } = handleApiError(error)
    return NextResponse.json({ error: message }, { status })
  }
}

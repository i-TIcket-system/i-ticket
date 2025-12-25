import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const origin = searchParams.get("origin")
    const destination = searchParams.get("destination")
    const date = searchParams.get("date")
    const busType = searchParams.get("busType")
    const sortBy = searchParams.get("sortBy") || "departureTime"

    // Build where clause
    const where: any = {
      isActive: true,
      bookingHalted: false,
      availableSlots: { gt: 0 },
    }

    if (origin) {
      where.origin = { contains: origin }
    }

    if (destination) {
      where.destination = { contains: destination }
    }

    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      where.departureTime = {
        gte: startOfDay,
        lte: endOfDay,
      }
    } else {
      // Default: show future trips only
      where.departureTime = { gte: new Date() }
    }

    if (busType && busType !== "all") {
      where.busType = busType
    }

    // Build order by
    let orderBy: any = { departureTime: "asc" }
    switch (sortBy) {
      case "price":
        orderBy = { price: "asc" }
        break
      case "priceDesc":
        orderBy = { price: "desc" }
        break
      case "slots":
        orderBy = { availableSlots: "desc" }
        break
    }

    const trips = await prisma.trip.findMany({
      where,
      orderBy,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 50,
    })

    return NextResponse.json({ trips })
  } catch (error) {
    console.error("Trips fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Create a new trip (Company Admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const trip = await prisma.trip.create({
      data: {
        companyId: body.companyId,
        origin: body.origin,
        destination: body.destination,
        route: body.route,
        departureTime: new Date(body.departureTime),
        estimatedDuration: body.estimatedDuration,
        price: body.price,
        busType: body.busType,
        totalSlots: body.totalSlots,
        availableSlots: body.totalSlots,
        hasWater: body.hasWater || false,
        hasFood: body.hasFood || false,
      },
      include: {
        company: true,
      },
    })

    return NextResponse.json({ trip }, { status: 201 })
  } catch (error) {
    console.error("Trip creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { searchTripsSchema, validateQueryParams } from "@/lib/validations"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Validate query parameters
    const validation = validateQueryParams(searchParams, searchTripsSchema)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { origin, destination, date, page = 1, limit = 20 } = validation.data
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

    // Get total count for pagination
    const total = await prisma.trip.count({ where })

    // Get trips with pagination
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
      take: limit,
      skip: (page - 1) * limit,
    })

    return NextResponse.json({
      trips,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    })
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
    // Import auth helpers dynamically to avoid circular dependencies
    const { requireCompanyAdmin, handleAuthError } = await import("@/lib/auth-helpers")
    const { createTripSchema, validateRequest } = await import("@/lib/validations")
    const { ensureCityExists } = await import("@/app/api/cities/route")

    // Require company admin authentication
    let companyId: string
    try {
      const auth = await requireCompanyAdmin()
      companyId = auth.companyId
    } catch (error) {
      return handleAuthError(error)
    }

    // Validate request body
    const validation = await validateRequest(request, createTripSchema)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const data = validation.data

    // Track cities in database for auto-population
    await Promise.all([
      ensureCityExists(data.origin),
      ensureCityExists(data.destination)
    ])

    // Create trip for authenticated company only
    const trip = await prisma.trip.create({
      data: {
        companyId, // Use authenticated user's companyId
        origin: data.origin,
        destination: data.destination,
        route: data.route,
        departureTime: new Date(data.departureTime),
        estimatedDuration: data.estimatedDuration,
        price: data.price,
        busType: data.busType,
        totalSlots: data.totalSlots,
        availableSlots: data.totalSlots,
        hasWater: data.hasWater,
        hasFood: data.hasFood,
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

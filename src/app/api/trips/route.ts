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
      select: {
        id: true,
        origin: true,
        destination: true,
        route: true,
        intermediateStops: true,
        departureTime: true,
        estimatedDuration: true,
        price: true,
        busType: true,
        totalSlots: true,
        availableSlots: true,
        hasWater: true,
        hasFood: true,
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

    // Validate vehicle assignment if provided
    if (data.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: data.vehicleId },
        select: {
          id: true,
          companyId: true,
          status: true,
          plateNumber: true,
          sideNumber: true,
        }
      })

      if (!vehicle) {
        return NextResponse.json(
          { error: "Vehicle not found" },
          { status: 404 }
        )
      }

      // Verify vehicle belongs to same company
      if (vehicle.companyId !== companyId) {
        return NextResponse.json(
          { error: "Cannot assign vehicle from another company" },
          { status: 403 }
        )
      }

      // Check vehicle status
      if (vehicle.status === "INACTIVE") {
        return NextResponse.json(
          { error: "Vehicle is inactive and cannot be assigned to trips" },
          { status: 400 }
        )
      }

      if (vehicle.status === "MAINTENANCE") {
        return NextResponse.json(
          { error: "Vehicle is in maintenance and cannot be assigned to trips" },
          { status: 400 }
        )
      }

      // Check for conflicting trips (vehicle already assigned to active trip at same time)
      const departureTime = new Date(data.departureTime)
      const conflictingTrip = await prisma.trip.findFirst({
        where: {
          vehicleId: data.vehicleId,
          isActive: true,
          departureTime: {
            // Check if there's any trip within ±12 hours (rough estimate for trip conflict)
            gte: new Date(departureTime.getTime() - 12 * 60 * 60 * 1000),
            lte: new Date(departureTime.getTime() + 12 * 60 * 60 * 1000)
          }
        },
        select: {
          id: true,
          origin: true,
          destination: true,
          departureTime: true
        }
      })

      if (conflictingTrip) {
        return NextResponse.json(
          {
            error: `Vehicle ${vehicle.plateNumber}${vehicle.sideNumber ? ` (${vehicle.sideNumber})` : ''} already has an active trip at this time: ${conflictingTrip.origin} → ${conflictingTrip.destination} on ${conflictingTrip.departureTime.toLocaleString()}`
          },
          { status: 409 }
        )
      }
    }

    // Get session for logging
    const { getServerSession } = await import("next-auth")
    const { authOptions } = await import("@/lib/auth")
    const session = await getServerSession(authOptions)

    // Create trip for authenticated company only
    const trip = await prisma.trip.create({
      data: {
        companyId, // Use authenticated user's companyId
        origin: data.origin,
        destination: data.destination,
        route: data.route,
        intermediateStops: data.intermediateStops,
        departureTime: new Date(data.departureTime),
        estimatedDuration: data.estimatedDuration,
        price: data.price,
        busType: data.busType,
        totalSlots: data.totalSlots,
        availableSlots: data.totalSlots,
        hasWater: data.hasWater,
        hasFood: data.hasFood,
        driverId: data.driverId || null,
        conductorId: data.conductorId || null,
        manualTicketerId: data.manualTicketerId || null,
        vehicleId: data.vehicleId || null,
      },
      include: {
        company: true,
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            licenseNumber: true,
          }
        },
        conductor: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        },
        manualTicketer: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        },
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            sideNumber: true,
            make: true,
            model: true,
            busType: true,
            totalSeats: true,
          }
        },
      },
    })

    // Log trip creation for dispute management
    if (session?.user) {
      await prisma.adminLog.create({
        data: {
          userId: session.user.id,
          action: "TRIP_CREATED",
          tripId: trip.id,
          details: `Trip created: ${session.user.name} (${trip.company.name}) created trip from ${trip.origin} to ${trip.destination}. Departure: ${trip.departureTime.toISOString()}, Price: ${trip.price} ETB, Capacity: ${trip.totalSlots} seats, Bus Type: ${trip.busType}.`,
        },
      })

      console.log(`[TRIP CREATE] ${session.user.name} created trip ${trip.id}: ${trip.origin} to ${trip.destination}`)
    }

    return NextResponse.json({ trip }, { status: 201 })
  } catch (error) {
    console.error("Trip creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

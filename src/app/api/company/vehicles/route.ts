import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { createVehicleSchema } from "@/lib/validations"
import { checkRateLimit, rateLimitExceeded } from "@/lib/rate-limit"

// GET /api/company/vehicles - List all vehicles for the company
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Auth check
    if (!session?.user || session.user.role !== "COMPANY_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Company admin access required" },
        { status: 401 }
      )
    }

    if (!session.user.companyId) {
      return NextResponse.json(
        { error: "No company associated with this account" },
        { status: 404 }
      )
    }

    // Get query params for filtering
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") // Optional: filter by status

    // Build where clause
    const whereClause: any = {
      companyId: session.user.companyId,
    }

    if (status && ["ACTIVE", "MAINTENANCE", "INACTIVE"].includes(status)) {
      whereClause.status = status
    }

    // Fetch vehicles with trip count
    const vehicles = await prisma.vehicle.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { trips: true }
        },
        trips: {
          where: {
            departureTime: {
              gte: new Date() // Only upcoming trips
            },
            isActive: true
          },
          select: {
            id: true,
            origin: true,
            destination: true,
            departureTime: true
          },
          orderBy: {
            departureTime: 'asc'
          },
          take: 1 // Next upcoming trip
        }
      },
      orderBy: [
        { status: 'asc' }, // ACTIVE first
        { plateNumber: 'asc' }
      ]
    })

    return NextResponse.json({
      vehicles: vehicles.map(v => ({
        ...v,
        tripCount: v._count.trips,
        nextTrip: v.trips[0] || null,
        _count: undefined,
        trips: undefined
      }))
    })

  } catch (error) {
    console.error("Error fetching vehicles:", error)
    return NextResponse.json(
      { error: "Failed to fetch vehicles" },
      { status: 500 }
    )
  }
}

// POST /api/company/vehicles - Create new vehicle
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Auth check
    if (!session?.user || session.user.role !== "COMPANY_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Company admin access required" },
        { status: 401 }
      )
    }

    if (!session.user.companyId) {
      return NextResponse.json(
        { error: "No company associated with this account" },
        { status: 404 }
      )
    }

    // Rate limiting - 20 vehicle additions per hour
    const clientId = `vehicle-add-${session.user.id}`
    if (!checkRateLimit(clientId, { maxRequests: 20, windowMs: 60 * 60 * 1000 })) {
      return rateLimitExceeded(3600)
    }

    const body = await req.json()

    // Log request for debugging
    console.log("[Vehicle Create] Request body:", JSON.stringify(body, null, 2))

    // Validate input
    const validation = createVehicleSchema.safeParse(body)
    if (!validation.success) {
      // Format validation errors to be more descriptive
      const errors = validation.error.errors.map(err => {
        const field = err.path.join('.')
        const fieldDisplay = field || 'general'
        return `${fieldDisplay}: ${err.message}`
      })
      const errorMessage = errors.join('; ')

      console.error("[Vehicle Create] Validation failed:", errorMessage)
      console.error("[Vehicle Create] Full errors:", JSON.stringify(validation.error.errors, null, 2))

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    const data = validation.data

    // Check if plate number already exists for this company
    const existingPlate = await prisma.vehicle.findFirst({
      where: {
        companyId: session.user.companyId,
        plateNumber: data.plateNumber
      }
    })

    if (existingPlate) {
      return NextResponse.json(
        { error: "A vehicle with this plate number already exists in your fleet" },
        { status: 409 }
      )
    }

    // Check if side number already exists (if provided)
    if (data.sideNumber) {
      const existingSide = await prisma.vehicle.findFirst({
        where: {
          companyId: session.user.companyId,
          sideNumber: data.sideNumber
        }
      })

      if (existingSide) {
        return NextResponse.json(
          { error: "A vehicle with this side number already exists in your fleet" },
          { status: 409 }
        )
      }
    }

    // Create vehicle
    const vehicle = await prisma.vehicle.create({
      data: {
        ...data,
        companyId: session.user.companyId,
        color: data.color || null,
        sideNumber: data.sideNumber || null,
        registrationExpiry: data.registrationExpiry ? new Date(data.registrationExpiry) : null,
        insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : null,
        lastServiceDate: data.lastServiceDate ? new Date(data.lastServiceDate) : null,
        nextServiceDate: data.nextServiceDate ? new Date(data.nextServiceDate) : null,
      }
    })

    // Log the action
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        companyId: session.user.companyId,
        action: "VEHICLE_ADDED",
        details: `Added vehicle: ${data.plateNumber}${data.sideNumber ? ` (${data.sideNumber})` : ''} - ${data.make} ${data.model}`
      }
    })

    return NextResponse.json({
      success: true,
      vehicle
    }, { status: 201 })

  } catch (error) {
    console.error("Error adding vehicle:", error)
    return NextResponse.json(
      { error: "Failed to add vehicle" },
      { status: 500 }
    )
  }
}

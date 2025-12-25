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
    // Import auth helpers dynamically
    const { requireCompanyAdmin, handleAuthError } = await import("@/lib/auth-helpers")
    const { updateTripSchema, validateRequest } = await import("@/lib/validations")

    // Require company admin authentication
    let companyId: string
    try {
      const auth = await requireCompanyAdmin()
      companyId = auth.companyId
    } catch (error) {
      return handleAuthError(error)
    }

    // Verify trip exists and belongs to this company
    const existingTrip = await prisma.trip.findUnique({
      where: { id: params.tripId },
      select: { companyId: true }
    })

    if (!existingTrip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    if (existingTrip.companyId !== companyId) {
      return NextResponse.json(
        { error: "You can only update your own company's trips" },
        { status: 403 }
      )
    }

    // Validate request body
    const validation = await validateRequest(request, updateTripSchema)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const data = validation.data

    // Prepare update data
    const updateData: any = {}
    if (data.origin) updateData.origin = data.origin
    if (data.destination) updateData.destination = data.destination
    if (data.route !== undefined) updateData.route = data.route
    if (data.departureTime) updateData.departureTime = new Date(data.departureTime)
    if (data.estimatedDuration) updateData.estimatedDuration = data.estimatedDuration
    if (data.price) updateData.price = data.price
    if (data.busType) updateData.busType = data.busType
    if (data.totalSlots) {
      updateData.totalSlots = data.totalSlots
      // Recalculate available slots if total changed
      const currentTrip = await prisma.trip.findUnique({
        where: { id: params.tripId },
        select: { totalSlots: true, availableSlots: true }
      })
      if (currentTrip) {
        const bookedSlots = currentTrip.totalSlots - currentTrip.availableSlots
        updateData.availableSlots = data.totalSlots - bookedSlots
      }
    }
    if (data.hasWater !== undefined) updateData.hasWater = data.hasWater
    if (data.hasFood !== undefined) updateData.hasFood = data.hasFood

    const trip = await prisma.trip.update({
      where: { id: params.tripId },
      data: updateData,
      include: {
        company: true,
      },
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

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

const statusUpdateSchema = z.object({
  status: z.enum(["SCHEDULED", "BOARDING", "DEPARTED", "COMPLETED", "CANCELLED"]),
  notes: z.string().optional(),
})

// Valid status transitions
const validTransitions: Record<string, string[]> = {
  SCHEDULED: ["BOARDING", "CANCELLED"],
  BOARDING: ["DEPARTED", "CANCELLED"],
  DEPARTED: ["COMPLETED"],
  COMPLETED: [], // Final state
  CANCELLED: [], // Final state
}

/**
 * PATCH - Update trip status (start boarding, depart, complete, cancel)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Must be company admin or authorized staff
    if (session.user.role !== "COMPANY_ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    const { tripId } = await params
    const body = await request.json()
    const validatedData = statusUpdateSchema.parse(body)

    // Get the trip and verify ownership
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        company: true,
        driver: { select: { name: true } },
        conductor: { select: { name: true } },
        vehicle: { select: { plateNumber: true, sideNumber: true } },
        _count: { select: { bookings: true } },
      },
    })

    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      )
    }

    // Verify company ownership (unless super admin)
    if (session.user.role === "COMPANY_ADMIN" && trip.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: "Not authorized to update this trip" },
        { status: 403 }
      )
    }

    // SECURITY: For DEPARTED status, only pure admin or assigned driver can change
    if (validatedData.status === "DEPARTED") {
      const isPureAdmin = session.user.role === "COMPANY_ADMIN" && !session.user.staffRole
      const isAssignedDriver = session.user.id === trip.driverId
      const isSuperAdmin = session.user.role === "SUPER_ADMIN"

      if (!isPureAdmin && !isAssignedDriver && !isSuperAdmin) {
        return NextResponse.json(
          { error: "Only admin or the assigned driver can start the trip" },
          { status: 403 }
        )
      }
    }

    // Check valid status transition
    const currentStatus = trip.status || "SCHEDULED"
    const allowedTransitions = validTransitions[currentStatus] || []

    if (!allowedTransitions.includes(validatedData.status)) {
      return NextResponse.json(
        {
          error: `Invalid status transition from ${currentStatus} to ${validatedData.status}`,
          allowedTransitions,
        },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      status: validatedData.status,
    }

    // Record actual departure time and auto-halt booking when status changes to DEPARTED
    if (validatedData.status === "DEPARTED") {
      updateData.actualDepartureTime = new Date()
      updateData.bookingHalted = true
    }

    // Record actual arrival time when status changes to COMPLETED
    if (validatedData.status === "COMPLETED") {
      updateData.actualArrivalTime = new Date()
    }

    // Update the trip status
    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: updateData,
    })

    // Create admin log entry
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: `TRIP_STATUS_${validatedData.status}`,
        details: JSON.stringify({
          tripId,
          previousStatus: currentStatus,
          newStatus: validatedData.status,
          route: `${trip.origin} → ${trip.destination}`,
          departureTime: trip.departureTime,
          actualDepartureTime: updateData.actualDepartureTime,
          actualArrivalTime: updateData.actualArrivalTime,
          notes: validatedData.notes,
          vehiclePlate: trip.vehicle?.plateNumber,
          driverName: trip.driver?.name,
        }),
        tripId,
        companyId: trip.companyId,
      },
    })

    // Create additional log for auto-halt when trip departs
    if (validatedData.status === "DEPARTED") {
      await prisma.adminLog.create({
        data: {
          userId: session.user.id,
          action: "AUTO_HALT_TRIP_DEPARTED",
          details: JSON.stringify({
            tripId,
            route: `${trip.origin} → ${trip.destination}`,
            departureTime: trip.departureTime,
            actualDepartureTime: updateData.actualDepartureTime,
            reason: "Trip departed - booking automatically halted",
          }),
          tripId,
          companyId: trip.companyId,
        },
      })
    }

    // If trip is completed or cancelled, update vehicle availability if assigned
    if ((validatedData.status === "COMPLETED" || validatedData.status === "CANCELLED") && trip.vehicleId) {
      // Mark vehicle as available (could add more logic here)
      await prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: "ACTIVE" },
      })
    }

    return NextResponse.json({
      success: true,
      trip: updatedTrip,
      message: `Trip status updated to ${validatedData.status}${
        validatedData.status === "DEPARTED"
          ? ". Booking has been automatically halted as trip has departed."
          : ""
      }`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Trip status update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * GET - Get available status transitions for a trip
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { tripId } = await params

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { status: true, companyId: true },
    })

    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      )
    }

    // Verify company ownership
    if (session.user.role === "COMPANY_ADMIN" && trip.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      )
    }

    const currentStatus = trip.status || "SCHEDULED"
    const allowedTransitions = validTransitions[currentStatus] || []

    return NextResponse.json({
      currentStatus,
      allowedTransitions,
      statusLabels: {
        SCHEDULED: "Scheduled",
        BOARDING: "Boarding",
        DEPARTED: "Departed",
        COMPLETED: "Completed",
        CANCELLED: "Cancelled",
      },
    })
  } catch (error) {
    console.error("Get trip status error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

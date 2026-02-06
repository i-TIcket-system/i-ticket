import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"
import { generateAndStoreManifest } from "@/lib/manifest-generator"
import { getAllowedStatusTransitions } from "@/lib/trip-status"

const statusUpdateSchema = z.object({
  status: z.enum(["SCHEDULED", "DELAYED", "BOARDING", "DEPARTED", "COMPLETED", "CANCELLED"]),
  notes: z.string().optional(),
  delayReason: z.enum(["TRAFFIC", "BREAKDOWN", "WEATHER", "WAITING_PASSENGERS", "OTHER"]).optional(),
})

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

    // Check valid status transition using helper function
    const currentStatus = trip.status || "SCHEDULED"
    const allowedTransitions = getAllowedStatusTransitions(currentStatus)

    if (!allowedTransitions.includes(validatedData.status)) {
      return NextResponse.json(
        {
          error: `Invalid status transition from ${currentStatus} to ${validatedData.status}`,
          allowedTransitions,
        },
        { status: 400 }
      )
    }

    // Pre-trip safety check: If vehicle risk >= 85, require recent PRE_TRIP inspection
    if (validatedData.status === "DEPARTED" && trip.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: trip.vehicleId },
        select: { maintenanceRiskScore: true, plateNumber: true },
      })

      if (vehicle && vehicle.maintenanceRiskScore && vehicle.maintenanceRiskScore >= 85) {
        const skipCheck = body.skipPreTripCheck === true
        const skipReason = typeof body.skipPreTripCheckReason === "string" ? body.skipPreTripCheckReason : ""

        if (!skipCheck) {
          // Check for recent PRE_TRIP inspection within 24 hours
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
          const recentInspection = await prisma.vehicleInspection.findFirst({
            where: {
              vehicleId: trip.vehicleId,
              inspectionType: "PRE_TRIP",
              createdAt: { gte: twentyFourHoursAgo },
              status: { in: ["PASS", "PASS_WITH_DEFECTS"] },
            },
            orderBy: { createdAt: "desc" },
          })

          if (!recentInspection) {
            return NextResponse.json(
              {
                error: `Vehicle ${vehicle.plateNumber} has critical risk score (${vehicle.maintenanceRiskScore}/100). A PRE_TRIP inspection within the last 24 hours is required before departure.`,
                requiresPreTripInspection: true,
                vehicleRiskScore: vehicle.maintenanceRiskScore,
                canOverride: true,
              },
              { status: 422 }
            )
          }
        } else if (skipReason.length < 10) {
          return NextResponse.json(
            { error: "Override reason must be at least 10 characters" },
            { status: 400 }
          )
        } else {
          // Log the override
          await prisma.adminLog.create({
            data: {
              userId: session.user.id,
              action: "PRE_TRIP_CHECK_OVERRIDE",
              details: `Skipped pre-trip inspection for critical vehicle ${vehicle.plateNumber} (risk: ${vehicle.maintenanceRiskScore}). Reason: ${skipReason}`,
              tripId,
              companyId: trip.companyId,
            },
          })
        }
      }
    }

    // Prepare update data with explicit TypeScript typing for boolean flags
    interface TripStatusUpdate {
      status: string
      actualDepartureTime?: Date
      actualArrivalTime?: Date
      bookingHalted?: boolean // Explicit boolean type (not truthy/falsy)
      delayReason?: string | null
      delayedAt?: Date | null
    }

    const updateData: TripStatusUpdate = {
      status: validatedData.status,
    }

    // Handle DELAYED status - allow bookings to continue
    if (validatedData.status === "DELAYED") {
      updateData.delayReason = validatedData.delayReason || null
      updateData.delayedAt = new Date()
      // Note: Do NOT halt booking for DELAYED - user requirement
    }

    // Record actual departure time and auto-halt booking when status changes to DEPARTED
    if (validatedData.status === "DEPARTED") {
      updateData.actualDepartureTime = new Date()
      updateData.bookingHalted = true as boolean // Explicit boolean assignment
      // Clear delay fields when departing
      updateData.delayReason = null
      updateData.delayedAt = null
    }

    // Record actual arrival time and force halt when status changes to COMPLETED
    if (validatedData.status === "COMPLETED") {
      updateData.actualArrivalTime = new Date()
      updateData.bookingHalted = true as boolean // Force halt - trip is complete
    }

    // Force halt when status changes to CANCELLED
    if (validatedData.status === "CANCELLED") {
      updateData.bookingHalted = true as boolean // Force halt - trip is cancelled
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

      // Auto-generate manifest for Super Admin (i-Ticket platform) tracking
      // This runs asynchronously and doesn't block the API response
      // Companies are NOT notified - they download manually when needed
      generateAndStoreManifest(tripId, "AUTO_DEPARTED").catch((error) => {
        console.error("Failed to auto-generate manifest on DEPARTED:", error)
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

    // Auto-update staff status based on trip status
    const staffIds = [trip.driverId, trip.conductorId].filter((id): id is string => !!id)

    if (validatedData.status === "DEPARTED" && staffIds.length > 0) {
      // Update staff status to ON_TRIP (don't change if they're ON_LEAVE)
      await prisma.user.updateMany({
        where: {
          id: { in: staffIds },
          staffStatus: { not: "ON_LEAVE" },
        },
        data: { staffStatus: "ON_TRIP" },
      })
    }

    if ((validatedData.status === "COMPLETED" || validatedData.status === "CANCELLED") && staffIds.length > 0) {
      // Check if staff have other active trips before resetting to AVAILABLE
      for (const staffId of staffIds) {
        const activeTrips = await prisma.trip.count({
          where: {
            OR: [{ driverId: staffId }, { conductorId: staffId }],
            status: "DEPARTED",
            id: { not: tripId },
          },
        })

        // Only reset to AVAILABLE if no other active trips
        if (activeTrips === 0) {
          await prisma.user.update({
            where: { id: staffId },
            data: { staffStatus: "AVAILABLE" },
          })
        }
      }
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
    const allowedTransitions = getAllowedStatusTransitions(currentStatus)

    return NextResponse.json({
      currentStatus,
      allowedTransitions,
      statusLabels: {
        SCHEDULED: "Scheduled",
        DELAYED: "Delayed",
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

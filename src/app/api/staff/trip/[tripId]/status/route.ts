import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"
import { generateAndStoreManifest } from "@/lib/manifest-generator"

/**
 * Staff Trip Status Update API
 *
 * BUSINESS LOGIC (Jan 21, 2026):
 * - DRIVER can update trip status: SCHEDULED → BOARDING → DEPARTED → COMPLETED
 * - DRIVER cannot CANCEL trips (admin-only)
 * - Driver must be assigned to the trip to update its status
 * - This is critical because driver is WITH the vehicle (can record odometer, fuel)
 * - Admin can ALSO update status (for oversight), but typically driver does it
 */

const statusUpdateSchema = z.object({
  status: z.enum(["BOARDING", "DEPARTED", "COMPLETED"]), // Driver can't CANCEL or set SCHEDULED
  notes: z.string().optional(),
})

// Valid status transitions for staff
const validTransitions: Record<string, string[]> = {
  SCHEDULED: ["BOARDING"],      // Driver starts boarding
  BOARDING: ["DEPARTED"],       // Driver departs
  DEPARTED: ["COMPLETED"],      // Driver completes trip
  COMPLETED: [],                // Final state - no changes
  CANCELLED: [],                // Final state - no changes (admin-only to set this)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Must be staff (COMPANY_ADMIN with staffRole)
    if (session.user.role !== "COMPANY_ADMIN" || !session.user.staffRole) {
      return NextResponse.json(
        { error: "Staff access required" },
        { status: 403 }
      )
    }

    // Only DRIVER can update trip status via staff API
    // (Conductors scan tickets, ticketers sell tickets - they don't control the trip)
    if (session.user.staffRole !== "DRIVER") {
      return NextResponse.json(
        { error: "Only drivers can update trip status" },
        { status: 403 }
      )
    }

    const tripId = params.tripId
    const body = await request.json()
    const validatedData = statusUpdateSchema.parse(body)

    // Get trip and verify driver is assigned
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        status: true,
        driverId: true,
        companyId: true,
        origin: true,
        destination: true,
        totalSlots: true,
        availableSlots: true,
        bookingHalted: true,
        company: {
          select: { name: true }
        }
      }
    })

    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      )
    }

    // CRITICAL: Driver must be assigned to this trip
    if (trip.driverId !== session.user.id) {
      return NextResponse.json(
        { error: "You are not assigned as the driver for this trip" },
        { status: 403 }
      )
    }

    // Validate status transition
    const allowedTransitions = validTransitions[trip.status] || []
    if (!allowedTransitions.includes(validatedData.status)) {
      return NextResponse.json(
        {
          error: `Cannot change status from ${trip.status} to ${validatedData.status}`,
          currentStatus: trip.status,
          allowedTransitions
        },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      status: validatedData.status,
    }

    // Record actual times based on status
    if (validatedData.status === "DEPARTED") {
      updateData.actualDepartureTime = new Date()
      updateData.bookingHalted = true // Stop all booking when trip departs
    }

    if (validatedData.status === "COMPLETED") {
      updateData.actualArrivalTime = new Date()
      updateData.bookingHalted = true // Ensure booking is halted
      updateData.trackingActive = false // Deactivate GPS tracking
    }

    // Update trip status
    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: updateData,
    })

    // Create audit log
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: `TRIP_STATUS_${validatedData.status}`,
        tripId: tripId,
        details: JSON.stringify({
          previousStatus: trip.status,
          newStatus: validatedData.status,
          updatedBy: "DRIVER",
          driverName: session.user.name,
          notes: validatedData.notes,
          timestamp: new Date().toISOString(),
        }),
      },
    })

    // Auto-generate manifest when trip departs (regardless of capacity)
    // Reason: Buses may depart without being fully booked - travelers can join on the way
    if (validatedData.status === "DEPARTED") {
      try {
        await generateAndStoreManifest(tripId, "AUTO_DEPARTED")
        console.log(`[MANIFEST] Auto-generated for trip ${tripId} (departed)`)
      } catch (manifestError) {
        console.error("[MANIFEST] Generation failed:", manifestError)
        // Non-blocking - don't fail the status update
      }
    }

    return NextResponse.json({
      success: true,
      message: `Trip status updated to ${validatedData.status}`,
      trip: {
        id: updatedTrip.id,
        status: updatedTrip.status,
        actualDepartureTime: updatedTrip.actualDepartureTime,
        actualArrivalTime: updatedTrip.actualArrivalTime,
      }
    })

  } catch (error) {
    console.error("Staff trip status update error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update trip status" },
      { status: 500 }
    )
  }
}

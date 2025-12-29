import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireCompanyAdmin, handleAuthError } from "@/lib/auth-helpers"

/**
 * Toggle booking halt status (admin override)
 * Allows company admin to resume or halt online bookings manually
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { session, companyId } = await requireCompanyAdmin()

    const { action } = await request.json()

    if (!["RESUME", "HALT"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be RESUME or HALT" },
        { status: 400 }
      )
    }

    // Verify trip belongs to company
    const trip = await prisma.trip.findUnique({
      where: { id: params.tripId },
      select: {
        id: true,
        companyId: true,
        bookingHalted: true,
        availableSlots: true,
        totalSlots: true,
        origin: true,
        destination: true,
      }
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    if (trip.companyId !== companyId) {
      return NextResponse.json(
        { error: "You can only manage your company's trips" },
        { status: 403 }
      )
    }

    // Update booking status and reset low seat alert flag
    const shouldHalt = action === "HALT"

    const updatedTrip = await prisma.trip.update({
      where: { id: params.tripId },
      data: {
        bookingHalted: shouldHalt,
        lowSlotAlertSent: false, // Reset alert flag when admin takes action
      },
    })

    // Log the action
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: action === "HALT" ? "BOOKING_HALTED_MANUAL" : "BOOKING_RESUMED_MANUAL",
        tripId: params.tripId,
        details: JSON.stringify({
          action,
          performedBy: session.user.name,
          availableSlots: trip.availableSlots,
          totalSlots: trip.totalSlots,
          reason: action === "HALT" ? "Admin manually halted booking" : "Admin override - resuming online booking",
          timestamp: new Date().toISOString(),
        }),
      },
    })

    return NextResponse.json({
      success: true,
      message: action === "HALT"
        ? "Online booking halted successfully"
        : "Online booking resumed successfully",
      trip: {
        id: updatedTrip.id,
        bookingHalted: updatedTrip.bookingHalted,
        availableSlots: updatedTrip.availableSlots,
      },
    })
  } catch (error) {
    console.error("Toggle booking error:", error)
    return handleAuthError(error)
  }
}

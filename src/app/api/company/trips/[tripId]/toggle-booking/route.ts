import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireCompanyAdmin, handleAuthError } from "@/lib/auth-helpers"
import { createNotification } from "@/lib/notifications"

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

    const { action, autoResumeEnabled } = await request.json()

    if (!["RESUME", "HALT"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be RESUME or HALT" },
        { status: 400 }
      )
    }

    // Validate autoResumeEnabled if provided
    if (autoResumeEnabled !== undefined && typeof autoResumeEnabled !== 'boolean') {
      return NextResponse.json(
        { error: "autoResumeEnabled must be a boolean" },
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
        departureTime: true,
        driverId: true,
        conductorId: true,
        manualTicketerId: true,
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

    // Update booking status
    const shouldHalt = action === "HALT"

    const updatedTrip = await prisma.trip.update({
      where: { id: params.tripId },
      data: {
        bookingHalted: shouldHalt,

        // When HALTING manually: Reset all flags to allow auto-halt to work again
        ...(shouldHalt && {
          lowSlotAlertSent: false,
          adminResumedFromAutoHalt: false,
          autoResumeEnabled: false,  // Reset permanent override
        }),

        // When RESUMING: Set override flag(s) based on admin preference
        ...(!shouldHalt && {
          adminResumedFromAutoHalt: true,  // One-time override (always set)
          ...(autoResumeEnabled !== undefined && {
            autoResumeEnabled: autoResumeEnabled,  // Permanent override (if checkbox provided)
          }),
        }),
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
          reason: action === "HALT"
            ? "Admin manually halted booking"
            : autoResumeEnabled
              ? "Admin override - resuming with permanent auto-resume enabled (no future auto-halts)"
              : "Admin override - resuming online booking (one-time)",
          autoResumeEnabled: autoResumeEnabled ?? false,
          timestamp: new Date().toISOString(),
        }),
      },
    })

    // Create notifications for assigned staff and super admins
    const tripRoute = `${trip.origin} → ${trip.destination}`
    const notificationType = shouldHalt ? "TRIP_HALTED" : "TRIP_RESUMED"
    const notificationData = {
      tripId: params.tripId,
      tripRoute,
      reason: shouldHalt ? "Admin manually halted bookings" : undefined,
    }

    // Notify assigned staff
    const staffIds = [trip.driverId, trip.conductorId, trip.manualTicketerId].filter(Boolean) as string[]
    for (const staffId of staffIds) {
      createNotification({
        recipientId: staffId,
        recipientType: "USER",
        type: notificationType,
        data: notificationData,
      })
    }

    // Notify super admins
    const superAdmins = await prisma.user.findMany({
      where: { role: "SUPER_ADMIN" },
      select: { id: true },
    })
    for (const admin of superAdmins) {
      createNotification({
        recipientId: admin.id,
        recipientType: "USER",
        type: notificationType,
        data: notificationData,
      })
    }

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

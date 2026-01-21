import { NextRequest, NextResponse } from "next/server"
import prisma, { transactionWithTimeout } from "@/lib/db"
import { requireCompanyAdmin, handleAuthError } from "@/lib/auth-helpers"
import { createLowSlotAlertTask } from "@/lib/clickup"
import { getAvailableSeatNumbers } from "@/lib/utils"
import { createErrorResponse } from "@/lib/error-handler"

/**
 * Record a manual ticket sale (sold at company office)
 * Creates placeholder booking with seat assignments, decrements available slots
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { companyId, userId } = await requireCompanyAdmin()

    const { passengerCount = 1 } = await request.json()

    if (passengerCount < 1 || passengerCount > 10) {
      return NextResponse.json(
        { error: "Invalid passenger count (1-10)" },
        { status: 400 }
      )
    }

    // Verify trip exists and belongs to company
    const trip = await prisma.trip.findUnique({
      where: { id: params.tripId },
      select: {
        id: true,
        companyId: true,
        availableSlots: true,
        totalSlots: true,
        price: true,
        origin: true,
        destination: true,
        departureTime: true,
        status: true,
        bookingHalted: true,
        reportGenerated: true,
        lowSlotAlertSent: true,
        adminResumedFromAutoHalt: true,
        autoResumeEnabled: true,
        company: {
          select: {
            name: true,
            disableAutoHaltGlobally: true
          }
        }
      }
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    if (trip.companyId !== companyId) {
      return NextResponse.json(
        { error: "You can only sell tickets for your company's trips" },
        { status: 403 }
      )
    }

    // CRITICAL: Block manual ticket sales on departed, completed, or cancelled trips
    if (trip.status === "DEPARTED" || trip.status === "COMPLETED" || trip.status === "CANCELLED") {
      return NextResponse.json(
        { error: `Cannot sell tickets for this trip. Trip status: ${trip.status}` },
        { status: 400 }
      )
    }

    if (trip.availableSlots < passengerCount) {
      return NextResponse.json(
        { error: `Only ${trip.availableSlots} seats available` },
        { status: 400 }
      )
    }

    // P2: Update available slots in transaction with timeout
    const result = await transactionWithTimeout(async (tx) => {
      // AUTO-ASSIGNMENT: Get available seat numbers automatically
      const seatNumbers = await getAvailableSeatNumbers(
        params.tripId,
        passengerCount,
        trip.totalSlots,
        tx
      )

      // Create placeholder booking for manual sale (no commission - sold at office)
      const totalAmount = Number(trip.price) * passengerCount
      const booking = await tx.booking.create({
        data: {
          tripId: params.tripId,
          userId, // Company admin who recorded the sale
          totalAmount,
          commission: 0, // No platform commission for office sales
          status: "PAID", // Manual sales are already paid
          isQuickTicket: true, // Marks as manual/office sale
          passengers: {
            create: seatNumbers.map((seatNumber, index) => ({
              name: `Manual Sale #${index + 1}`,
              nationalId: `MANUAL-${Date.now()}-${index}`,
              phone: "OFFICE",
              seatNumber,
              pickupLocation: null,
              dropoffLocation: null,
            })),
          },
        },
      })

      // Decrement available slots
      const updatedTrip = await tx.trip.update({
        where: { id: params.tripId },
        data: {
          availableSlots: {
            decrement: passengerCount,
          },
        },
      })

      // AUTO-HALT ONLINE BOOKING: If slots drop to 10 or below, halt ONLINE booking (manual ticketing unaffected)
      if (
        updatedTrip.availableSlots <= 10 &&
        !updatedTrip.bookingHalted &&
        !trip.adminResumedFromAutoHalt &&
        !trip.autoResumeEnabled &&  // Trip-specific bypass
        !trip.company.disableAutoHaltGlobally  // Company-wide bypass
      ) {
        await tx.trip.update({
          where: { id: params.tripId },
          data: {
            bookingHalted: true,
            lowSlotAlertSent: true,
          },
        })

        await tx.adminLog.create({
          data: {
            userId: "SYSTEM",
            action: "AUTO_HALT_LOW_SLOTS",
            tripId: params.tripId,
            details: JSON.stringify({
              reason: "Slots dropped to 10 or below",
              availableSlots: updatedTrip.availableSlots,
              totalSlots: updatedTrip.totalSlots,
              triggeredBy: "manual_ticket_sale",
              timestamp: new Date().toISOString(),
            }),
          },
        })

        console.log(`[AUTO-HALT] Online booking halted for trip ${params.tripId} (${updatedTrip.availableSlots} seats remaining). Manual ticketing can continue.`)

        // Create ClickUp alert (non-blocking)
        createLowSlotAlertTask({
          tripId: params.tripId,
          origin: trip.origin,
          destination: trip.destination,
          departureTime: trip.departureTime,
          availableSlots: updatedTrip.availableSlots,
          totalSlots: updatedTrip.totalSlots,
          companyName: trip.company.name,
          triggeredBy: "manual_ticket_sale",
        })
      }

      // Log the manual sale with seat numbers
      await tx.adminLog.create({
        data: {
          userId: companyId,
          action: "MANUAL_TICKET_SALE",
          tripId: params.tripId,
          details: JSON.stringify({
            passengerCount,
            seatNumbers,
            bookingId: booking.id,
            remainingSlots: updatedTrip.availableSlots,
            soldAt: new Date().toISOString(),
          }),
        },
      })

      // BUS FULL: Mark manifest ready if all seats sold
      if (updatedTrip.availableSlots === 0 && !trip.reportGenerated) {
        await tx.trip.update({
          where: { id: params.tripId },
          data: {
            reportGenerated: true,
            lowSlotAlertSent: false, // Dismiss low slot alert when fully sold
          }
        })

        await tx.adminLog.create({
          data: {
            userId: "SYSTEM",
            action: "BUS_FULL_MANIFEST_READY",
            tripId: params.tripId,
            details: JSON.stringify({
              totalSlots: updatedTrip.totalSlots,
              triggeredBy: "manual_ticket_sale",
              generatedAt: new Date().toISOString(),
            }),
          },
        })

        console.log(`[MANIFEST] Bus FULL for trip ${params.tripId}! Download manifest from trip details.`)
      }

      return { updatedTrip, seatNumbers, bookingId: booking.id }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully recorded ${passengerCount} manual ticket sale(s)`,
      trip: {
        id: result.updatedTrip.id,
        availableSlots: result.updatedTrip.availableSlots,
        totalSlots: result.updatedTrip.totalSlots,
        slotsPercentage: Math.round((result.updatedTrip.availableSlots / result.updatedTrip.totalSlots) * 100),
      },
      seatNumbers: result.seatNumbers,
      bookingId: result.bookingId,
    })
  } catch (error) {
    console.error("Manual ticket sale error:", error)

    // Handle auth errors separately
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return handleAuthError(error)
    }

    return createErrorResponse(error, 400)
  }
}

import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireCompanyAdmin, handleAuthError } from "@/lib/auth-helpers"

/**
 * Record a manual ticket sale (sold at company office)
 * Decrements available slots and logs the sale
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { companyId } = await requireCompanyAdmin()

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
        origin: true,
        destination: true,
        bookingHalted: true,
        reportGenerated: true,
        lowSlotAlertSent: true,
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

    if (trip.availableSlots < passengerCount) {
      return NextResponse.json(
        { error: `Only ${trip.availableSlots} seats available` },
        { status: 400 }
      )
    }

    // Update available slots in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Decrement available slots
      const updatedTrip = await tx.trip.update({
        where: { id: params.tripId },
        data: {
          availableSlots: {
            decrement: passengerCount,
          },
        },
      })

      // Log the manual sale
      await tx.adminLog.create({
        data: {
          userId: companyId,
          action: "MANUAL_TICKET_SALE",
          tripId: params.tripId,
          details: JSON.stringify({
            passengerCount,
            remainingSlots: updatedTrip.availableSlots,
            soldAt: new Date().toISOString(),
          }),
        },
      })

      // CRITICAL: Auto-halt if slots drop to 10 or below
      // Skip if: sold out (0), already halted, or admin already handled (lowSlotAlertSent)
      if (updatedTrip.availableSlots > 0 && updatedTrip.availableSlots <= 10 && !trip.bookingHalted && !trip.lowSlotAlertSent) {
        await tx.trip.update({
          where: { id: params.tripId },
          data: {
            lowSlotAlertSent: true,
            bookingHalted: true,
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

        console.log(`[ALERT] Trip ${params.tripId} auto-halted: Only ${updatedTrip.availableSlots} slots remaining`)
      }

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

      return updatedTrip
    })

    return NextResponse.json({
      success: true,
      message: `Successfully recorded ${passengerCount} manual ticket sale(s)`,
      trip: {
        id: result.id,
        availableSlots: result.availableSlots,
        totalSlots: result.totalSlots,
        slotsPercentage: Math.round((result.availableSlots / result.totalSlots) * 100),
      },
    })
  } catch (error) {
    console.error("Manual ticket sale error:", error)
    return handleAuthError(error)
  }
}

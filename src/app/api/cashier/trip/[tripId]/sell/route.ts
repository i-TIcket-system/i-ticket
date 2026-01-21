import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { transactionWithTimeout } from "@/lib/db"
import { generateShortCode } from "@/lib/utils"
import { calculateBookingAmounts } from "@/lib/commission"
import QRCode from "qrcode"
import { createErrorResponse } from "@/lib/error-handler"
import { createLowSlotAlertTask } from "@/lib/clickup"

/**
 * POST /api/cashier/trip/[tripId]/sell
 * Sells tickets for the assigned trip - cashier can select specific seats
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is a manual ticketer
    if (
      session.user.role !== "COMPANY_ADMIN" ||
      session.user.staffRole !== "MANUAL_TICKETER"
    ) {
      return NextResponse.json(
        { error: "Access denied. Only manual ticketers can access this endpoint." },
        { status: 403 }
      )
    }

    const tripId = params.tripId
    const userId = session.user.id
    const body = await request.json()
    const { passengerCount = 1, selectedSeats } = body

    // Validate passenger count
    if (passengerCount < 1 || passengerCount > 10) {
      return NextResponse.json(
        { error: "Invalid passenger count. Must be between 1 and 10." },
        { status: 400 }
      )
    }

    // Validate selected seats if provided
    if (selectedSeats) {
      if (!Array.isArray(selectedSeats) || selectedSeats.length !== passengerCount) {
        return NextResponse.json(
          { error: `Please select exactly ${passengerCount} seat${passengerCount > 1 ? "s" : ""}.` },
          { status: 400 }
        )
      }
    }

    // Use transaction with timeout for safety
    const result = await transactionWithTimeout(
      async (tx) => {
        // Get trip with lock - verify it's assigned to this ticketer
        const trip = await tx.trip.findFirst({
          where: {
            id: tripId,
            manualTicketerId: userId,
          },
          select: {
            id: true,
            price: true,
            totalSlots: true,
            availableSlots: true,
            status: true,
            origin: true,
            destination: true,
            departureTime: true,
            companyId: true,
            bookingHalted: true,
            reportGenerated: true,
            lowSlotAlertSent: true,
            adminResumedFromAutoHalt: true,
            autoResumeEnabled: true,
            company: {
              select: {
                name: true,
                disableAutoHaltGlobally: true,
              },
            },
            vehicle: {
              select: {
                plateNumber: true,
                sideNumber: true,
              },
            },
          },
        })

        if (!trip) {
          throw new Error("Trip not found or not assigned to you")
        }

        // CRITICAL: Block ticket sales on departed, completed, or cancelled trips
        if (trip.status === "DEPARTED" || trip.status === "COMPLETED" || trip.status === "CANCELLED") {
          throw new Error(`Cannot sell tickets for this trip. Trip status: ${trip.status}`)
        }

        // Check available slots
        if (trip.availableSlots < passengerCount) {
          throw new Error(
            `Not enough seats available. Only ${trip.availableSlots} seat${trip.availableSlots !== 1 ? "s" : ""} left.`
          )
        }

        // Get currently occupied seats with booking info
        const occupiedPassengers = await tx.passenger.findMany({
          where: {
            booking: {
              tripId: tripId,
              status: { not: "CANCELLED" },
            },
            seatNumber: { not: null },
          },
          select: {
            seatNumber: true,
            booking: {
              select: { isQuickTicket: true }
            }
          },
        })

        const occupiedSeats = new Set(
          occupiedPassengers
            .map((p: { seatNumber: number | null }) => p.seatNumber)
            .filter((s: number | null): s is number => s !== null)
        )

        // Create map of seat to booking type for descriptive errors
        const seatToBookingType = new Map(
          occupiedPassengers
            .filter((p: { seatNumber: number | null }) => p.seatNumber !== null)
            .map((p: { seatNumber: number | null; booking: { isQuickTicket: boolean } }) => [
              p.seatNumber as number,
              p.booking.isQuickTicket ? "manual ticketing" : "online booking"
            ])
        )

        // Determine seat numbers to assign
        let seatsToAssign: number[] = []

        if (selectedSeats && selectedSeats.length > 0) {
          // Validate selected seats are available
          for (const seat of selectedSeats) {
            if (seat < 1 || seat > trip.totalSlots) {
              throw new Error(`Invalid seat number: ${seat}`)
            }
            if (occupiedSeats.has(seat)) {
              const saleType = seatToBookingType.get(seat) || "unknown source"
              throw new Error(`Seat ${seat} is already sold (${saleType}). Please select another seat.`)
            }
          }
          seatsToAssign = selectedSeats.sort((a: number, b: number) => a - b)
        } else {
          // Auto-assign seats (first available)
          for (let i = 1; i <= trip.totalSlots && seatsToAssign.length < passengerCount; i++) {
            if (!occupiedSeats.has(i)) {
              seatsToAssign.push(i)
            }
          }

          if (seatsToAssign.length < passengerCount) {
            throw new Error("Not enough available seats")
          }
        }

        // Calculate booking amounts (passenger pays ticket + commission + VAT)
        const amounts = calculateBookingAmounts(Number(trip.price), passengerCount)

        // Create booking first (without tickets - we'll create them separately)
        const booking = await tx.booking.create({
          data: {
            tripId: trip.id,
            userId: userId, // Assign to the ticketer's user
            status: "PAID", // Mark as paid immediately (cash payment)
            totalAmount: amounts.totalAmount, // Passenger pays ticket + commission + VAT
            commission: amounts.commission.baseCommission,
            commissionVAT: amounts.commission.vat,
            isQuickTicket: true,
            passengers: {
              create: seatsToAssign.map((seatNumber, index) => ({
                name: `Walk-in Passenger ${index + 1}`,
                nationalId: "",
                phone: "",
                seatNumber: seatNumber,
              })),
            },
          },
          include: {
            passengers: true,
          },
        })

        // Generate tickets for each passenger (one ticket per passenger)
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
        const tickets = await Promise.all(
          booking.passengers.map(async (passenger: { id: string; name: string; seatNumber: number | null }) => {
            const shortCode = generateShortCode()
            const verificationUrl = `${baseUrl}/verify/${shortCode}`
            const qrCode = await QRCode.toDataURL(verificationUrl, {
              width: 300,
              margin: 2,
              color: { dark: "#000000", light: "#ffffff" },
            })

            return await tx.ticket.create({
              data: {
                bookingId: booking.id,
                tripId: trip.id,
                passengerName: passenger.name,
                seatNumber: passenger.seatNumber,
                qrCode,
                shortCode,
                isUsed: false,
              },
            })
          })
        )

        // Create payment record (cash payment)
        await tx.payment.create({
          data: {
            bookingId: booking.id,
            amount: amounts.totalAmount, // Total passenger pays (ticket + commission + VAT)
            status: "SUCCESS",
            transactionId: `CASH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            method: "CASH",
            initiatedVia: "WEB",
          },
        })

        // Update trip available slots
        const updatedTrip = await tx.trip.update({
          where: { id: tripId },
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
            where: { id: tripId },
            data: {
              bookingHalted: true,
              lowSlotAlertSent: true,
            },
          })

          await tx.adminLog.create({
            data: {
              userId: "SYSTEM",
              action: "AUTO_HALT_LOW_SLOTS",
              tripId: tripId,
              details: JSON.stringify({
                reason: "Slots dropped to 10 or below",
                availableSlots: updatedTrip.availableSlots,
                totalSlots: updatedTrip.totalSlots,
                triggeredBy: "cashier_ticket_sale",
                timestamp: new Date().toISOString(),
              }),
            },
          })

          console.log(`[AUTO-HALT] Online booking halted for trip ${tripId} (${updatedTrip.availableSlots} seats remaining). Manual ticketing can continue.`)

          // Create ClickUp alert (non-blocking)
          createLowSlotAlertTask({
            tripId: tripId,
            origin: trip.origin,
            destination: trip.destination,
            departureTime: trip.departureTime,
            availableSlots: updatedTrip.availableSlots,
            totalSlots: trip.totalSlots,
            companyName: trip.company.name,
            triggeredBy: "manual_ticket_sale",
          })
        }

        return {
          bookingId: booking.id,
          shortCodes: tickets.map((t) => t.shortCode),
          seatNumbers: seatsToAssign,
          totalAmount: amounts.totalAmount, // Total passenger paid
          ticketPrice: amounts.ticketTotal, // What company receives
          commission: amounts.commission.baseCommission,
          commissionVAT: amounts.commission.vat,
          companyName: trip.company.name,
          route: `${trip.origin} → ${trip.destination}`,
          departureTime: trip.departureTime,
          vehicle: trip.vehicle,
        }
      },
      15000 // 15 second timeout
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error("Cashier ticket sale error:", error)
    return createErrorResponse(error, 500)
  }
}

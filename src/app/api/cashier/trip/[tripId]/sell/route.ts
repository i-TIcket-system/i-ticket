import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { transactionWithTimeout } from "@/lib/db"
import { generateShortCode } from "@/lib/utils"
import { calculateCommission } from "@/lib/commission"
import QRCode from "qrcode"

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
            origin: true,
            destination: true,
            departureTime: true,
            companyId: true,
            company: {
              select: {
                name: true,
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

        // Check available slots
        if (trip.availableSlots < passengerCount) {
          throw new Error(
            `Not enough seats available. Only ${trip.availableSlots} seat${trip.availableSlots !== 1 ? "s" : ""} left.`
          )
        }

        // Get currently occupied seats
        const occupiedPassengers = await tx.passenger.findMany({
          where: {
            booking: {
              tripId: tripId,
              status: { not: "CANCELLED" },
            },
            seatNumber: { not: null },
          },
          select: { seatNumber: true },
        })

        const occupiedSeats = new Set(
          occupiedPassengers
            .map((p: { seatNumber: number | null }) => p.seatNumber)
            .filter((s: number | null): s is number => s !== null)
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
              throw new Error(`Seat ${seat} is already occupied`)
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

        // Calculate total with commission and VAT
        const totalAmount = Number(trip.price) * passengerCount
        const commissionBreakdown = calculateCommission(totalAmount)

        // Create booking first (without tickets - we'll create them separately)
        const booking = await tx.booking.create({
          data: {
            tripId: trip.id,
            userId: userId, // Assign to the ticketer's user
            status: "PAID", // Mark as paid immediately (cash payment)
            totalAmount: totalAmount,
            commission: commissionBreakdown.baseCommission,
            commissionVAT: commissionBreakdown.vat,
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
            amount: totalAmount,
            status: "SUCCESS",
            transactionId: `CASH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            method: "CASH",
            initiatedVia: "WEB",
          },
        })

        // Update trip available slots
        await tx.trip.update({
          where: { id: tripId },
          data: {
            availableSlots: {
              decrement: passengerCount,
            },
          },
        })

        return {
          bookingId: booking.id,
          shortCodes: tickets.map((t) => t.shortCode),
          seatNumbers: seatsToAssign,
          totalAmount: totalAmount,
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
    const message = error instanceof Error ? error.message : "Failed to sell tickets"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

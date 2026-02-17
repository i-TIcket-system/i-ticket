import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { transactionWithTimeout } from "@/lib/db"
import { authOptions } from "@/lib/auth"
import { generateShortCode } from "@/lib/utils"
import QRCode from "qrcode"

/**
 * POST /api/company/trips/[tripId]/replacement-ticket
 * Sell replacement tickets for no-show seats (staff/cashier only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { tripId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (session.user.role !== "COMPANY_ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const { passengerCount = 1 } = body

    if (passengerCount < 1 || passengerCount > 10) {
      return NextResponse.json(
        { error: "Passenger count must be between 1 and 10" },
        { status: 400 }
      )
    }

    const result = await transactionWithTimeout(async (tx) => {
      // Get trip
      const trip = await tx.trip.findUnique({
        where: { id: tripId },
        select: {
          id: true,
          companyId: true,
          status: true,
          price: true,
          totalSlots: true,
          availableSlots: true,
          origin: true,
          destination: true,
          departureTime: true,
          noShowCount: true,
          releasedSeats: true,
          replacementsSold: true,
          company: {
            select: { name: true },
          },
          vehicle: {
            select: { plateNumber: true, sideNumber: true },
          },
        },
      })

      if (!trip) {
        throw new Error("Trip not found")
      }

      // Company segregation
      if (session.user.role === "COMPANY_ADMIN" && trip.companyId !== session.user.companyId) {
        throw new Error("ACCESS_DENIED")
      }

      // Guard: only DEPARTED trips
      if (trip.status !== "DEPARTED") {
        throw new Error(`Replacement tickets can only be sold for DEPARTED trips (current: ${trip.status})`)
      }

      // Guard: enough released seats
      if (trip.releasedSeats < passengerCount) {
        throw new Error(
          `Not enough released seats. Available: ${trip.releasedSeats}, requested: ${passengerCount}`
        )
      }

      // Find no-show seats that haven't been reassigned yet
      // These are passengers with NO_SHOW status whose seats aren't taken by replacement bookings
      const noShowPassengers = await tx.passenger.findMany({
        where: {
          boardingStatus: "NO_SHOW",
          seatNumber: { not: null },
          booking: {
            tripId,
            status: "PAID",
            isReplacement: false, // Only original bookings
          },
        },
        select: {
          id: true,
          seatNumber: true,
          name: true,
        },
        orderBy: { seatNumber: "asc" },
      })

      // Find seats already taken by existing replacement bookings
      const replacementPassengers = await tx.passenger.findMany({
        where: {
          booking: {
            tripId,
            status: "PAID",
            isReplacement: true,
          },
        },
        select: { seatNumber: true },
      })

      const alreadyReplacedSeats = new Set(
        replacementPassengers
          .map((p: { seatNumber: number | null }) => p.seatNumber)
          .filter((s: number | null): s is number => s !== null)
      )

      // Available no-show seats (not yet reassigned)
      type NoShowPassenger = { id: string; seatNumber: number | null; name: string }
      const availableNoShowSeats = noShowPassengers.filter(
        (p: NoShowPassenger) => p.seatNumber !== null && !alreadyReplacedSeats.has(p.seatNumber!)
      )

      if (availableNoShowSeats.length < passengerCount) {
        throw new Error(
          `Only ${availableNoShowSeats.length} no-show seat(s) available for replacement`
        )
      }

      // Take the first N seats
      const seatsToAssign = availableNoShowSeats.slice(0, passengerCount)
      const seatNumbers = seatsToAssign.map((s: NoShowPassenger) => s.seatNumber as number)

      // Create replacement booking
      // Commission is 0 for manual/replacement sales (same as cashier pattern)
      const totalAmount = Number(trip.price) * passengerCount

      const booking = await tx.booking.create({
        data: {
          tripId: trip.id,
          userId: session.user.id,
          status: "PAID",
          totalAmount,
          commission: 0,
          commissionVAT: 0,
          isQuickTicket: true,
          isReplacement: true,
          replacedPassengerId: seatsToAssign[0].id, // Link to first no-show passenger
          passengers: {
            create: seatNumbers.map((seatNumber: number, index: number) => ({
              name: `Replacement Passenger ${index + 1}`,
              nationalId: "",
              phone: "",
              seatNumber,
              boardingStatus: "BOARDED", // Replacement passengers are already boarding
            })),
          },
        },
        include: {
          passengers: true,
        },
      })

      // Generate tickets
      const baseUrl = process.env.NEXTAUTH_URL || "https://i-ticket.et"
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

      // Create CASH payment record
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: totalAmount,
          status: "SUCCESS",
          transactionId: `REPL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          method: "CASH",
          initiatedVia: "WEB",
        },
      })

      // Update trip counters
      // DO NOT change availableSlots — seats were already counted as sold
      const updatedTrip = await tx.trip.update({
        where: { id: tripId },
        data: {
          replacementsSold: { increment: passengerCount },
          releasedSeats: { decrement: passengerCount },
        },
      })

      // Audit log
      await tx.adminLog.create({
        data: {
          userId: session.user.id,
          action: "REPLACEMENT_TICKET_SALE",
          tripId,
          details: `${session.user.name} sold ${passengerCount} replacement ticket(s) for no-show seats: ${seatNumbers.join(", ")}. Trip: ${trip.origin} → ${trip.destination}. Revenue: ${totalAmount} ETB`,
        },
      })

      console.log(
        `[REPLACEMENT] ${session.user.name} sold ${passengerCount} replacement tickets on trip ${tripId}. Seats: ${seatNumbers.join(", ")}. Remaining released: ${updatedTrip.releasedSeats}`
      )

      return {
        success: true,
        bookingId: booking.id,
        seatNumbers,
        shortCodes: tickets.map((t) => t.shortCode),
        totalAmount,
        releasedSeats: updatedTrip.releasedSeats,
        companyName: trip.company.name,
        route: `${trip.origin} → ${trip.destination}`,
        vehicle: trip.vehicle,
      }
    }, 15000) // 15 second timeout

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Replacement ticket error:", error)

    if (error.message === "ACCESS_DENIED") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message?.includes("only be sold") || error.message?.includes("Not enough") ? 400 : 500 }
    )
  }
}

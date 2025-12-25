import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/lib/auth"
import { generateShortCode } from "@/lib/utils"
import QRCode from "qrcode"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bookingId, method } = body

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        passengers: true,
        trip: {
          include: {
            company: true,
          },
        },
        payment: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    if (booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    if (booking.status === "PAID") {
      return NextResponse.json(
        { error: "Booking already paid" },
        { status: 400 }
      )
    }

    // Customer pays: ticket price + 5% commission
    const totalAmount = Number(booking.totalAmount) + Number(booking.commission)

    // In demo mode, simulate successful payment
    // In production, integrate with TeleBirr API
    const isDemoMode = process.env.DEMO_MODE === "true" || method === "DEMO"

    if (isDemoMode) {
      // Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }

    // Use transaction to create payment and tickets
    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          bookingId,
          amount: totalAmount,
          method: isDemoMode ? "DEMO" : "TELEBIRR",
          transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          status: "SUCCESS",
        },
      })

      // Update booking status
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "PAID" },
      })

      // Generate tickets for each passenger
      const tickets = await Promise.all(
        booking.passengers.map(async (passenger) => {
          const shortCode = generateShortCode()

          // Generate QR code data
          const qrData = JSON.stringify({
            ticketId: shortCode,
            bookingId,
            tripId: booking.tripId,
            passenger: passenger.name,
            origin: booking.trip.origin,
            destination: booking.trip.destination,
            departure: booking.trip.departureTime,
            company: booking.trip.company.name,
          })

          // Generate QR code as data URL
          const qrCode = await QRCode.toDataURL(qrData, {
            width: 300,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#ffffff",
            },
          })

          return tx.ticket.create({
            data: {
              bookingId,
              tripId: booking.tripId,
              passengerName: passenger.name,
              seatNumber: passenger.seatNumber,
              qrCode,
              shortCode,
            },
          })
        })
      )

      // Log SMS notification (in production, actually send SMS)
      console.log(`[SMS] Tickets sent to ${session.user.phone}:`)
      tickets.forEach((ticket) => {
        console.log(`  - ${ticket.passengerName}: ${ticket.shortCode}`)
      })

      return { payment, tickets }
    })

    return NextResponse.json({
      success: true,
      payment: result.payment,
      tickets: result.tickets,
    })
  } catch (error) {
    console.error("Payment error:", error)
    return NextResponse.json(
      { error: "Payment processing failed" },
      { status: 500 }
    )
  }
}

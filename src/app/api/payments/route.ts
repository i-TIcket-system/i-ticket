import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/lib/auth"
import { generateShortCode } from "@/lib/utils"
import QRCode from "qrcode"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const body = await request.json()
    const { bookingId, method } = body

    // Get booking with user details
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
        user: {
          select: {
            id: true,
            isGuestUser: true,
          }
        }
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    // Allow payment if:
    // 1. User is logged in and owns the booking
    // 2. Booking belongs to a guest user (no authentication required)
    if (session?.user?.id) {
      // Logged in user - verify ownership
      if (booking.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        )
      }
    } else {
      // Not logged in - only allow if this is a guest booking
      if (!booking.user.isGuestUser) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        )
      }
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

          // Generate QR code with URL that anyone can scan
          // When scanned, opens a public page showing ticket details
          const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
          const verificationUrl = `${baseUrl}/verify/${shortCode}`

          // Generate QR code as data URL
          const qrCode = await QRCode.toDataURL(verificationUrl, {
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

      // Log payment for dispute management
      await tx.adminLog.create({
        data: {
          userId: session.user.id,
          action: "PAYMENT_SUCCESS",
          tripId: booking.tripId,
          details: `Payment successful: ${session.user.name} (${session.user.phone}) paid ${totalAmount} ETB for booking ${bookingId}. Method: ${payment.method}, Transaction ID: ${payment.transactionId}. ${booking.passengers.length} tickets generated.`,
        },
      })

      // Log SMS notification (in production, actually send SMS)
      console.log(`[SMS] Tickets sent to ${session.user.phone}:`)
      tickets.forEach((ticket) => {
        console.log(`  - ${ticket.passengerName}: ${ticket.shortCode}`)
      })
      console.log(`[PAYMENT LOG] ${session.user.name} paid ${totalAmount} ETB for booking ${bookingId}`)

      return { payment, tickets }
    })

    return NextResponse.json({
      success: true,
      payment: result.payment,
      tickets: result.tickets,
    })
  } catch (error) {
    console.error("Payment error:", error)

    // Log payment failure for dispute management
    try {
      const session = await getServerSession(authOptions)
      if (session?.user?.id) {
        const body = await request.json()
        await prisma.adminLog.create({
          data: {
            userId: session.user.id,
            action: "PAYMENT_FAILED",
            details: `Payment failed for user ${session.user.name} (${session.user.phone}). Booking ID: ${body.bookingId}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        })
      }
    } catch (logError) {
      console.error("Failed to log payment error:", logError)
    }

    return NextResponse.json(
      { error: "Payment processing failed" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma, { transactionWithTimeout } from "@/lib/db"
import { authOptions } from "@/lib/auth"
import { generateShortCode } from "@/lib/utils"
import QRCode from "qrcode"
import { checkEnhancedRateLimit, checkBookingRateLimit, RATE_LIMITS, rateLimitExceeded } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { bookingId, method } = body

    // SECURITY: Enhanced rate limiting (IP + user + per-booking)
    // Prevents attacks using multiple IPs or spamming same booking
    if (!checkEnhancedRateLimit(request, session?.user?.id, RATE_LIMITS.PROCESS_PAYMENT)) {
      return rateLimitExceeded(60)
    }

    // SECURITY: Per-booking rate limiting (max 3 payment attempts per booking per hour)
    if (!checkBookingRateLimit(bookingId, 3, 60 * 60 * 1000)) {
      return rateLimitExceeded(3600) // Retry after 1 hour
    }

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

    // SECURITY: Recalculate amount server-side (never trust client)
    const passengerCount = booking.passengers.length
    const tripPrice = Number(booking.trip.price)
    const expectedTicketAmount = tripPrice * passengerCount
    const expectedCommission = Math.round(expectedTicketAmount * 0.05)
    const expectedTotal = expectedTicketAmount + expectedCommission

    // Verify booking amounts match expected calculation
    if (Math.abs(Number(booking.totalAmount) - expectedTicketAmount) > 0.01) {
      console.error(`[Payment] Amount mismatch: Expected ${expectedTicketAmount}, got ${booking.totalAmount}`)
      return NextResponse.json(
        { error: "Booking amount mismatch. Please create a new booking." },
        { status: 400 }
      )
    }

    if (Math.abs(Number(booking.commission) - expectedCommission) > 0.01) {
      console.error(`[Payment] Commission mismatch: Expected ${expectedCommission}, got ${booking.commission}`)
      return NextResponse.json(
        { error: "Commission calculation error. Please create a new booking." },
        { status: 400 }
      )
    }

    // Customer pays: ticket price + 5% commission
    const totalAmount = expectedTotal

    // In demo mode, simulate successful payment
    // In production, integrate with TeleBirr API
    const isDemoMode = process.env.DEMO_MODE === "true" || method === "DEMO"

    if (isDemoMode) {
      // Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }

    // P2: Use transaction with timeout to create payment and tickets
    const result = await transactionWithTimeout(async (tx) => {
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

      // Get user details for logging (works for both logged-in and guest users)
      const userForLogging = await tx.user.findUnique({
        where: { id: booking.userId },
        select: { id: true, name: true, phone: true, isGuestUser: true }
      })

      // Log payment for dispute management
      await tx.adminLog.create({
        data: {
          userId: booking.userId,
          action: "PAYMENT_SUCCESS",
          tripId: booking.tripId,
          details: `Payment successful: ${userForLogging?.name || 'Guest'} (${userForLogging?.phone}) paid ${totalAmount} ETB for booking ${bookingId}. Method: ${payment.method}, Transaction ID: ${payment.transactionId}. ${booking.passengers.length} tickets generated. ${userForLogging?.isGuestUser ? '[GUEST CHECKOUT]' : ''}`,
        },
      })

      // INTERNAL: Create sales commission if user was referred (with 70/30 split)
      const salesReferral = await tx.salesReferral.findUnique({
        where: { userId: booking.userId },
        include: {
          salesPerson: {
            include: {
              recruiter: true // Include recruiter for 70/30 split
            }
          }
        }
      })

      if (salesReferral && salesReferral.salesPerson.status === 'ACTIVE') {
        const platformCommission = Number(booking.commission)
        const salesCommission = platformCommission * 0.05 // 5% of platform's 5%

        // Multi-tier commission: Check if sales person has a recruiter
        const hasRecruiter = salesReferral.salesPerson.recruiterId && salesReferral.salesPerson.recruiter?.status === 'ACTIVE'

        if (hasRecruiter) {
          // 70/30 SPLIT: Sales person gets 70%, recruiter gets 30%
          const salesPersonShare = salesCommission * 0.70 // 70% to sales person
          const recruiterShare = salesCommission * 0.30   // 30% to recruiter

          // Create commission for sales person (70%)
          await tx.salesCommission.create({
            data: {
              salesPersonId: salesReferral.salesPersonId,
              bookingId: booking.id,
              ticketAmount: Number(booking.totalAmount),
              platformCommission,
              salesCommission: salesPersonShare,
              recruiterCommissionAmount: recruiterShare,
              recruiterId: salesReferral.salesPerson.recruiterId,
              isRecruiterCommission: false,
              status: 'PENDING',
            }
          })

          // Create commission for recruiter (30%)
          await tx.salesCommission.create({
            data: {
              salesPersonId: salesReferral.salesPerson.recruiterId!,
              bookingId: booking.id,
              ticketAmount: Number(booking.totalAmount),
              platformCommission,
              salesCommission: recruiterShare,
              recruiterCommissionAmount: 0,
              recruiterId: null,
              isRecruiterCommission: true,
              status: 'PENDING',
            }
          })
        } else {
          // No recruiter: Sales person gets 100% (Tier 1)
          await tx.salesCommission.create({
            data: {
              salesPersonId: salesReferral.salesPersonId,
              bookingId: booking.id,
              ticketAmount: Number(booking.totalAmount),
              platformCommission,
              salesCommission, // Full 100%
              recruiterCommissionAmount: 0,
              recruiterId: null,
              isRecruiterCommission: false,
              status: 'PENDING',
            }
          })
        }
      }

      // Log SMS notification (in production, actually send SMS)
      console.log(`[SMS] Tickets sent to ${userForLogging?.phone}:`)
      tickets.forEach((ticket) => {
        console.log(`  - ${ticket.passengerName}: ${ticket.shortCode}`)
      })
      console.log(`[PAYMENT LOG] ${userForLogging?.name || 'Guest'} paid ${totalAmount} ETB for booking ${bookingId}${userForLogging?.isGuestUser ? ' [GUEST CHECKOUT]' : ''}`)

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

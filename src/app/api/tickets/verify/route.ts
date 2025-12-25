import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAuth } from "@/lib/auth-helpers"
import { verifyTicketSchema, validateRequest } from "@/lib/validations"

/**
 * Verify a ticket by QR code or short code
 * Used by bus conductors to validate tickets before boarding
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication (company admin or super admin)
    const session = await requireAuth()

    if (session.user.role !== "COMPANY_ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only company admins can verify tickets" },
        { status: 403 }
      )
    }

    // Validate request body
    const validation = await validateRequest(request, verifyTicketSchema)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { code } = validation.data

    // Find ticket by short code
    const ticket = await prisma.ticket.findUnique({
      where: { shortCode: code.toUpperCase() },
      include: {
        booking: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
            passengers: true,
          },
        },
        trip: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json(
        {
          valid: false,
          error: "Ticket not found. Please check the code and try again."
        },
        { status: 404 }
      )
    }

    // Check if ticket belongs to company admin's company
    if (session.user.role === "COMPANY_ADMIN" && session.user.companyId !== ticket.trip.companyId) {
      return NextResponse.json(
        {
          valid: false,
          error: "This ticket belongs to another company"
        },
        { status: 403 }
      )
    }

    // Check if booking is paid
    if (ticket.booking.status !== "PAID") {
      return NextResponse.json({
        valid: false,
        error: `Ticket is not paid. Status: ${ticket.booking.status}`,
        ticket: {
          shortCode: ticket.shortCode,
          passengerName: ticket.passengerName,
          seatNumber: ticket.seatNumber,
          trip: {
            origin: ticket.trip.origin,
            destination: ticket.trip.destination,
            departureTime: ticket.trip.departureTime,
          },
          booking: {
            status: ticket.booking.status,
          }
        }
      })
    }

    // Check if ticket already used
    if (ticket.isUsed) {
      return NextResponse.json({
        valid: false,
        error: `Ticket already used on ${ticket.usedAt?.toISOString()}`,
        ticket: {
          shortCode: ticket.shortCode,
          passengerName: ticket.passengerName,
          seatNumber: ticket.seatNumber,
          usedAt: ticket.usedAt,
        }
      })
    }

    // Check if trip date is today or in the future
    const tripDate = new Date(ticket.trip.departureTime)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (tripDate < today) {
      return NextResponse.json({
        valid: false,
        error: "This ticket is for a past trip",
        ticket: {
          shortCode: ticket.shortCode,
          passengerName: ticket.passengerName,
          trip: {
            departureTime: ticket.trip.departureTime,
          }
        }
      })
    }

    // Ticket is valid - return full details
    return NextResponse.json({
      valid: true,
      message: "Ticket is valid and ready for boarding",
      ticket: {
        id: ticket.id,
        shortCode: ticket.shortCode,
        passengerName: ticket.passengerName,
        seatNumber: ticket.seatNumber,
        qrCode: ticket.qrCode,
        createdAt: ticket.createdAt,
        trip: {
          id: ticket.trip.id,
          origin: ticket.trip.origin,
          destination: ticket.trip.destination,
          departureTime: ticket.trip.departureTime,
          busType: ticket.trip.busType,
          company: ticket.trip.company.name,
        },
        booking: {
          id: ticket.booking.id,
          totalAmount: ticket.booking.totalAmount,
          bookedBy: ticket.booking.user.name,
          bookedByPhone: ticket.booking.user.phone,
          passengerCount: ticket.booking.passengers.length,
        }
      }
    })
  } catch (error: any) {
    console.error("Ticket verification error:", error)

    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: error.message === "UNAUTHORIZED" ? "Authentication required" : "Insufficient permissions" },
        { status: error.message === "UNAUTHORIZED" ? 401 : 403 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Mark a ticket as used
 * Called after successful verification and passenger boarding
 */
export async function PATCH(request: NextRequest) {
  try {
    // Require authentication (company admin or super admin)
    const session = await requireAuth()

    if (session.user.role !== "COMPANY_ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only company admins can mark tickets as used" },
        { status: 403 }
      )
    }

    const { ticketId } = await request.json()

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 })
    }

    // Get ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        trip: {
          select: {
            companyId: true,
          }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Check ownership
    if (session.user.role === "COMPANY_ADMIN" && session.user.companyId !== ticket.trip.companyId) {
      return NextResponse.json(
        { error: "You can only mark tickets for your company's trips" },
        { status: 403 }
      )
    }

    if (ticket.isUsed) {
      return NextResponse.json({ error: "Ticket already used" }, { status: 400 })
    }

    // Mark ticket as used
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Ticket marked as used successfully",
      ticket: updatedTicket,
    })
  } catch (error: any) {
    console.error("Mark ticket as used error:", error)

    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: error.message === "UNAUTHORIZED" ? "Authentication required" : "Insufficient permissions" },
        { status: error.message === "UNAUTHORIZED" ? 401 : 403 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

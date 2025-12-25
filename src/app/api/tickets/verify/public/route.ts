import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

/**
 * Public ticket verification endpoint
 * Anyone can verify a ticket by scanning QR code - no authentication required
 * This is read-only and does NOT mark tickets as used
 */
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { valid: false, error: "Ticket code is required" },
        { status: 400 }
      )
    }

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
                phones: true,
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

    // Check if booking is paid
    if (ticket.booking.status !== "PAID") {
      return NextResponse.json({
        valid: false,
        error: `Ticket payment is ${ticket.booking.status}. Please complete payment first.`,
        ticket: {
          shortCode: ticket.shortCode,
          passengerName: ticket.passengerName,
          seatNumber: ticket.seatNumber,
          trip: {
            origin: ticket.trip.origin,
            destination: ticket.trip.destination,
            departureTime: ticket.trip.departureTime,
            busType: ticket.trip.busType,
            company: ticket.trip.company.name,
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
        error: `Ticket already scanned and used on ${ticket.usedAt?.toLocaleString("en-ET")}`,
        ticket: {
          shortCode: ticket.shortCode,
          passengerName: ticket.passengerName,
          seatNumber: ticket.seatNumber,
          usedAt: ticket.usedAt,
          trip: {
            origin: ticket.trip.origin,
            destination: ticket.trip.destination,
          }
        }
      })
    }

    // Check if trip is today or in the future
    const tripDate = new Date(ticket.trip.departureTime)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (tripDate < today) {
      return NextResponse.json({
        valid: false,
        error: "This ticket is for a past trip and is no longer valid.",
        ticket: {
          shortCode: ticket.shortCode,
          passengerName: ticket.passengerName,
          trip: {
            departureTime: ticket.trip.departureTime,
          }
        }
      })
    }

    // Ticket is VALID - Return full information for display
    return NextResponse.json({
      valid: true,
      message: "Ticket is valid. Passenger authorized to board.",
      ticket: {
        id: ticket.id,
        shortCode: ticket.shortCode,
        passengerName: ticket.passengerName,
        seatNumber: ticket.seatNumber,
        qrCode: ticket.qrCode,
        isUsed: ticket.isUsed,
        createdAt: ticket.createdAt,
        trip: {
          id: ticket.trip.id,
          origin: ticket.trip.origin,
          destination: ticket.trip.destination,
          departureTime: ticket.trip.departureTime,
          busType: ticket.trip.busType,
          company: ticket.trip.company.name,
          companyPhones: ticket.trip.company.phones,
        },
        booking: {
          id: ticket.booking.id,
          totalAmount: ticket.booking.totalAmount,
          bookedBy: ticket.booking.user.name,
          bookedByPhone: ticket.booking.user.phone,
          passengerCount: ticket.booking.passengers.length,
          status: ticket.booking.status,
        }
      }
    })
  } catch (error: any) {
    console.error("Public ticket verification error:", error)
    return NextResponse.json(
      {
        valid: false,
        error: "Unable to verify ticket. Please try again or contact support."
      },
      { status: 500 }
    )
  }
}

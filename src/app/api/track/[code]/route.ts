import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

/**
 * Track booking by booking ID or ticket code
 * Public endpoint - no authentication required
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code.trim().toUpperCase()

    // Try to find by booking ID first
    let booking = await prisma.booking.findUnique({
      where: { id: params.code },
      include: {
        passengers: {
          select: {
            id: true,
            name: true,
            seatNumber: true,
            phone: true,
          }
        },
        trip: {
          select: {
            id: true,
            origin: true,
            destination: true,
            departureTime: true,
            busType: true,
            company: {
              select: {
                name: true,
              }
            }
          }
        }
      }
    })

    // If not found by booking ID, try to find by ticket short code
    if (!booking) {
      const ticket = await prisma.ticket.findUnique({
        where: { shortCode: code },
        include: {
          booking: {
            include: {
              passengers: {
                select: {
                  id: true,
                  name: true,
                  seatNumber: true,
                  phone: true,
                }
              },
              trip: {
                select: {
                  id: true,
                  origin: true,
                  destination: true,
                  departureTime: true,
                  busType: true,
                  company: {
                    select: {
                      name: true,
                    }
                  }
                }
              }
            }
          }
        }
      })

      if (ticket) {
        booking = ticket.booking
      }
    }

    if (!booking) {
      return NextResponse.json(
        { error: "No booking found with that ID or ticket code" },
        { status: 404 }
      )
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error("Track booking error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

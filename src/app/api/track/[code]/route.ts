import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { handleApiError } from "@/lib/utils"

/**
 * Track booking by booking ID or ticket code
 * Public endpoint - no authentication required
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code.trim()
    const codeUpper = code.toUpperCase()

    // Try to find by booking ID first (case-sensitive, use trimmed original)
    let booking = await prisma.booking.findUnique({
      where: { id: code },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        commission: true,
        commissionVAT: true,
        createdAt: true,
        passengers: {
          select: {
            id: true,
            name: true,
            seatNumber: true,
            // phone removed for privacy - public endpoint should not expose PII
          }
        },
        trip: {
          select: {
            id: true,
            origin: true,
            destination: true,
            departureTime: true,
            busType: true,
            status: true,
            trackingActive: true,
            company: {
              select: {
                name: true,
              }
            }
          }
        }
      }
    })

    // If not found by booking ID, try to find by ticket short code (uppercase)
    if (!booking) {
      const ticket = await prisma.ticket.findUnique({
        where: { shortCode: codeUpper },
        select: {
          booking: {
            select: {
              id: true,
              status: true,
              totalAmount: true,
              commission: true,
              commissionVAT: true,
              createdAt: true,
              passengers: {
                select: {
                  id: true,
                  name: true,
                  seatNumber: true,
                  // phone removed for privacy - public endpoint should not expose PII
                }
              },
              trip: {
                select: {
                  id: true,
                  origin: true,
                  destination: true,
                  departureTime: true,
                  busType: true,
                  status: true,
                  trackingActive: true,
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
    const { message, status } = handleApiError(error)
    return NextResponse.json({ error: message }, { status })
  }
}

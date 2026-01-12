import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

/**
 * Get trips assigned to the authenticated staff member
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "COMPANY_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Staff access required" },
        { status: 401 }
      )
    }

    if (!session.user.staffRole) {
      return NextResponse.json(
        { error: "No staff role assigned" },
        { status: 403 }
      )
    }

    const userId = session.user.id

    // Build query based on staff role
    const whereClause: any = {
      OR: []
    }

    if (session.user.staffRole === "DRIVER") {
      whereClause.OR.push({ driverId: userId })
    }

    if (session.user.staffRole === "CONDUCTOR") {
      whereClause.OR.push({ conductorId: userId })
    }

    if (session.user.staffRole === "MANUAL_TICKETER") {
      whereClause.OR.push({ manualTicketerId: userId })
    }

    if (session.user.staffRole === "ADMIN") {
      // Admins see all company trips
      whereClause.OR = []
      whereClause.companyId = session.user.companyId
    }

    // Fetch trips
    const trips = await prisma.trip.findMany({
      where: whereClause.OR.length > 0 ? whereClause : { companyId: session.user.companyId },
      include: {
        company: {
          select: {
            name: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        conductor: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        manualTicketer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            sideNumber: true,
            make: true,
            model: true,
            currentOdometer: true,
          },
        },
        bookings: {
          where: { status: "PAID" },
          select: {
            id: true,
            totalAmount: true,
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: { departureTime: "asc" },
    })

    return NextResponse.json({ trips })
  } catch (error) {
    console.error("Staff trips fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

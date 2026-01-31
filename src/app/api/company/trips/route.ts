import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/lib/auth"
import { sortTripsByStatusAndTime } from "@/lib/sort-trips"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    if (session.user.role !== "COMPANY_ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)

    // Pagination params
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20')), 100)
    const skip = (page - 1) * limit
    const paginated = searchParams.get('paginated') === 'true'

    const where: any = {}

    // Company admins only see their company's trips
    if (session.user.role === "COMPANY_ADMIN" && session.user.companyId) {
      where.companyId = session.user.companyId
    }

    // If paginated, use skip/take for server-side pagination
    if (paginated) {
      const [trips, total] = await Promise.all([
        prisma.trip.findMany({
          where,
          orderBy: { departureTime: "asc" },
          skip,
          take: limit,
          include: {
            company: {
              select: { name: true },
            },
            _count: {
              select: {
                bookings: { where: { status: "PAID" } },
              },
            },
            bookings: {
              where: { status: "CANCELLED" },
              select: { id: true },
            },
          },
        }),
        prisma.trip.count({ where })
      ])

      // Transform trips to include booking breakdown
      const tripsWithBookingBreakdown = trips.map(trip => ({
        ...trip,
        paidBookings: trip._count.bookings,
        cancelledBookings: trip.bookings.length,
        bookings: undefined, // Remove raw bookings array from response
      }))

      // Sort by status priority (active first), then departure time
      const sortedTrips = sortTripsByStatusAndTime(tripsWithBookingBreakdown)

      return NextResponse.json({
        trips: sortedTrips,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    }

    // Non-paginated (default for backwards compatibility)
    const trips = await prisma.trip.findMany({
      where,
      orderBy: { departureTime: "asc" },
      include: {
        company: {
          select: { name: true },
        },
        _count: {
          select: {
            bookings: { where: { status: "PAID" } },
          },
        },
        bookings: {
          where: { status: "CANCELLED" },
          select: { id: true },
        },
      },
    })

    // Transform trips to include booking breakdown
    const tripsWithBookingBreakdown = trips.map(trip => ({
      ...trip,
      paidBookings: trip._count.bookings,
      cancelledBookings: trip.bookings.length,
      bookings: undefined, // Remove raw bookings array from response
    }))

    // Sort by status priority (active first), then departure time
    const sortedTrips = sortTripsByStatusAndTime(tripsWithBookingBreakdown)

    return NextResponse.json({ trips: sortedTrips })
  } catch (error) {
    console.error("Trips fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

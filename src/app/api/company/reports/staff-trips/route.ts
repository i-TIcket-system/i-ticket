import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireCompanyAdmin, handleAuthError } from "@/lib/auth-helpers"

/**
 * GET /api/company/reports/staff-trips
 *
 * Get comprehensive staff trip reports showing which routes were handled by which staff members
 * Supports filtering by date range and staff type (driver, conductor, ticketer)
 */
export async function GET(request: NextRequest) {
  try {
    const { session, companyId } = await requireCompanyAdmin()
    const searchParams = request.nextUrl.searchParams

    const staffType = searchParams.get("staffType") // "driver", "conductor", "ticketer", or "all"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const staffId = searchParams.get("staffId") // Filter by specific staff member

    // Build date filter
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      dateFilter.lte = end
    }

    const whereClause: any = {
      companyId,
      ...(Object.keys(dateFilter).length > 0 && { departureTime: dateFilter }),
    }

    // Add staff filter if specified
    if (staffId) {
      whereClause.OR = [
        { driverId: staffId },
        { conductorId: staffId },
        { manualTicketerId: staffId },
      ]
    }

    // Fetch trips with staff details
    const trips = await prisma.trip.findMany({
      where: whereClause,
      select: {
        id: true,
        origin: true,
        destination: true,
        route: true,
        departureTime: true,
        totalSlots: true,
        availableSlots: true,
        price: true,
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            licenseNumber: true,
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
        _count: {
          select: {
            bookings: {
              where: {
                status: "PAID",
              },
            },
          },
        },
      },
      orderBy: {
        departureTime: "desc",
      },
    })

    // Process data into staff-centric reports
    const driverReports = new Map<string, any>()
    const conductorReports = new Map<string, any>()
    const ticketerReports = new Map<string, any>()

    trips.forEach((trip) => {
      const bookedSeats = trip.totalSlots - trip.availableSlots
      const revenue = bookedSeats * trip.price

      // Driver stats
      if (trip.driver) {
        const existing = driverReports.get(trip.driver.id) || {
          staff: trip.driver,
          totalTrips: 0,
          totalPassengers: 0,
          totalRevenue: 0,
          routes: new Map<string, number>(),
          trips: [],
        }

        existing.totalTrips++
        existing.totalPassengers += bookedSeats
        existing.totalRevenue += revenue

        const routeKey = `${trip.origin} → ${trip.destination}`
        existing.routes.set(routeKey, (existing.routes.get(routeKey) || 0) + 1)

        existing.trips.push({
          id: trip.id,
          route: routeKey,
          fullRoute: trip.route,
          departureTime: trip.departureTime,
          passengers: bookedSeats,
          revenue,
        })

        driverReports.set(trip.driver.id, existing)
      }

      // Conductor stats
      if (trip.conductor) {
        const existing = conductorReports.get(trip.conductor.id) || {
          staff: trip.conductor,
          totalTrips: 0,
          totalPassengers: 0,
          totalRevenue: 0,
          routes: new Map<string, number>(),
          trips: [],
        }

        existing.totalTrips++
        existing.totalPassengers += bookedSeats
        existing.totalRevenue += revenue

        const routeKey = `${trip.origin} → ${trip.destination}`
        existing.routes.set(routeKey, (existing.routes.get(routeKey) || 0) + 1)

        existing.trips.push({
          id: trip.id,
          route: routeKey,
          fullRoute: trip.route,
          departureTime: trip.departureTime,
          passengers: bookedSeats,
          revenue,
        })

        conductorReports.set(trip.conductor.id, existing)
      }

      // Ticketer stats
      if (trip.manualTicketer) {
        const existing = ticketerReports.get(trip.manualTicketer.id) || {
          staff: trip.manualTicketer,
          totalTrips: 0,
          totalPassengers: 0,
          totalRevenue: 0,
          routes: new Map<string, number>(),
          trips: [],
        }

        existing.totalTrips++
        existing.totalPassengers += bookedSeats
        existing.totalRevenue += revenue

        const routeKey = `${trip.origin} → ${trip.destination}`
        existing.routes.set(routeKey, (existing.routes.get(routeKey) || 0) + 1)

        existing.trips.push({
          id: trip.id,
          route: routeKey,
          fullRoute: trip.route,
          departureTime: trip.departureTime,
          passengers: bookedSeats,
          revenue,
        })

        ticketerReports.set(trip.manualTicketer.id, existing)
      }
    })

    // Convert Maps to arrays and format routes
    const formatReport = (report: any) => ({
      ...report,
      routes: (Array.from(report.routes.entries()) as [string, number][]).map((entry) => ({
        route: entry[0],
        tripCount: entry[1],
      })).sort((a, b) => b.tripCount - a.tripCount),
    })

    const response: any = {}

    if (!staffType || staffType === "all" || staffType === "driver") {
      response.drivers = Array.from(driverReports.values())
        .map(formatReport)
        .sort((a, b) => b.totalTrips - a.totalTrips)
    }

    if (!staffType || staffType === "all" || staffType === "conductor") {
      response.conductors = Array.from(conductorReports.values())
        .map(formatReport)
        .sort((a, b) => b.totalTrips - a.totalTrips)
    }

    if (!staffType || staffType === "all" || staffType === "ticketer") {
      response.ticketers = Array.from(ticketerReports.values())
        .map(formatReport)
        .sort((a, b) => b.totalTrips - a.totalTrips)
    }

    // Summary statistics
    response.summary = {
      totalTrips: trips.length,
      uniqueDrivers: driverReports.size,
      uniqueConductors: conductorReports.size,
      uniqueTicketers: ticketerReports.size,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Staff trip reports error:", error)
    return handleAuthError(error)
  }
}

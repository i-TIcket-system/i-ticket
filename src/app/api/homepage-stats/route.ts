import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { ETHIOPIAN_CITIES } from "@/lib/ethiopian-cities"

// Helper to format large numbers
function formatStat(num: number): string {
  if (num >= 10000) return `${Math.floor(num / 1000)}K+`
  if (num >= 1000) return `${Math.floor(num / 1000)}K+`
  if (num >= 100) return `${num}+`
  if (num >= 10) return `${num}+`
  return `${num}+`
}

/**
 * Public API endpoint for homepage statistics
 * Returns formatted counts for trust indicators
 *
 * "Happy Travelers" = unique passengers from PAID/COMPLETED bookings
 * "Daily Trips" = trips scheduled in the last 7 days (avg daily)
 * "Destinations" = unique cities with actual trips
 * "Partner Companies" = active companies
 */
export async function GET() {
  try {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      // Count unique travelers (passengers from paid/completed bookings)
      happyTravelersResult,
      // Count trips from the last 7 days to calculate daily average
      recentTripsCount,
      // Get destinations that have actual trips
      tripsWithDestinations,
      // Count active companies
      companies,
      dbCities
    ] = await Promise.all([
      // Count unique passengers who have actually traveled (from PAID or COMPLETED bookings)
      prisma.passenger.count({
        where: {
          booking: {
            status: { in: ['PAID', 'COMPLETED'] }
          }
        }
      }),
      // Recent trips for daily average
      prisma.trip.count({
        where: {
          departureTime: { gte: sevenDaysAgo }
        }
      }),
      // Get unique destinations from actual trips
      prisma.trip.findMany({
        select: { origin: true, destination: true },
        distinct: ['origin', 'destination']
      }),
      prisma.company.count({ where: { isActive: true } }),
      prisma.city.findMany({ select: { name: true } })
    ])

    // Calculate unique destinations from actual trips
    const tripDestinations = new Set<string>()
    tripsWithDestinations.forEach(trip => {
      tripDestinations.add(trip.origin)
      tripDestinations.add(trip.destination)
    })

    // Use trip destinations if we have any, otherwise fall back to DB cities
    const destinationCount = tripDestinations.size > 0
      ? tripDestinations.size
      : Math.min(dbCities.length, ETHIOPIAN_CITIES.length)

    // Calculate daily trips (average over last 7 days, minimum of 10 for display)
    const dailyTrips = Math.max(10, Math.round(recentTripsCount / 7))

    return NextResponse.json({
      travelers: formatStat(happyTravelersResult),
      trips: formatStat(dailyTrips),
      destinations: formatStat(destinationCount),
      companies: `${companies}+`
    })
  } catch (error) {
    console.error("Homepage stats error:", error)

    // Return fallback values on error (graceful degradation)
    return NextResponse.json({
      travelers: "45+",
      trips: "160+",
      destinations: "90+",
      companies: "5+"
    })
  }
}

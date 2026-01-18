import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Get popular routes based on:
    // 1. Number of bookings per route
    // 2. Number of trips created per route
    // Weighted towards recent activity (last 90 days)

    const threeMonthsAgo = new Date()
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90)

    // Get routes from trips (grouped by origin-destination)
    const tripRoutes = await prisma.trip.groupBy({
      by: ["origin", "destination"],
      where: {
        status: {
          in: ["SCHEDULED", "BOARDING", "DEPARTED", "COMPLETED"],
        },
        departureTime: {
          gte: threeMonthsAgo,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 10,
    })

    // Get routes from bookings (to see what customers actually book)
    const bookingRoutes = await prisma.$queryRaw<
      Array<{ origin: string; destination: string; count: bigint }>
    >`
      SELECT t.origin, t.destination, COUNT(b.id)::int as count
      FROM "Booking" b
      INNER JOIN "Trip" t ON b."tripId" = t.id
      WHERE b."createdAt" >= ${threeMonthsAgo}
      AND b.status != 'CANCELLED'
      GROUP BY t.origin, t.destination
      ORDER BY count DESC
      LIMIT 10
    `

    // Combine and score routes
    const routeScores = new Map<string, number>()

    // Score from trips (weight: 1)
    tripRoutes.forEach((route) => {
      const key = `${route.origin}|${route.destination}`
      routeScores.set(key, (routeScores.get(key) || 0) + route._count.id)
    })

    // Score from bookings (weight: 2 - more important as it reflects actual demand)
    bookingRoutes.forEach((route) => {
      const key = `${route.origin}|${route.destination}`
      const count = Number(route.count)
      routeScores.set(key, (routeScores.get(key) || 0) + count * 2)
    })

    // Convert to array and sort by score
    const sortedRoutes = Array.from(routeScores.entries())
      .map(([key, score]) => {
        const [from, to] = key.split("|")
        return { from, to, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3) // Top 3 routes
      .map(({ from, to }) => ({ from, to }))

    // If no routes found, return default popular routes
    if (sortedRoutes.length === 0) {
      return NextResponse.json({
        routes: [
          { from: "Addis Ababa", to: "Bahir Dar" },
          { from: "Addis Ababa", to: "Hawassa" },
          { from: "Addis Ababa", to: "Gondar" },
        ],
      })
    }

    return NextResponse.json({
      routes: sortedRoutes,
    })
  } catch (error) {
    console.error("Error fetching popular routes:", error)
    // Return default routes on error
    return NextResponse.json({
      routes: [
        { from: "Addis Ababa", to: "Bahir Dar" },
        { from: "Addis Ababa", to: "Hawassa" },
        { from: "Addis Ababa", to: "Gondar" },
      ],
    })
  }
}

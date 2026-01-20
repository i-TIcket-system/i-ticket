import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Helper to format large numbers
function formatStat(num: number): string {
  if (num >= 10000) return `${Math.floor(num / 1000)}K+`
  if (num >= 1000) return `${Math.floor(num / 1000)}K+`
  if (num >= 100) return `${num}+`
  return `${num}+`
}

/**
 * Public API endpoint for homepage statistics
 * Returns formatted counts for trust indicators
 */
export async function GET() {
  try {
    const [customers, trips, cities, companies] = await Promise.all([
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.trip.count(),
      db.city.count(),
      db.company.count({ where: { isActive: true } })
    ])

    return NextResponse.json({
      travelers: formatStat(customers),
      trips: formatStat(trips),
      destinations: formatStat(cities),
      companies: `${companies}+`
    })
  } catch (error) {
    console.error("Homepage stats error:", error)

    // Return fallback values on error (graceful degradation)
    return NextResponse.json({
      travelers: "1K+",
      trips: "100+",
      destinations: "20+",
      companies: "5+"
    })
  }
}

import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { ETHIOPIAN_CITIES } from "@/lib/ethiopian-cities"

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
    const [customers, trips, dbCities, companies] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.trip.count(),
      prisma.city.findMany({ select: { name: true } }),
      prisma.company.count({ where: { isActive: true } })
    ])

    // Combine static Ethiopian cities + organic database cities
    const allCities = new Set([...ETHIOPIAN_CITIES, ...dbCities.map(c => c.name)])
    const totalCities = allCities.size

    return NextResponse.json({
      travelers: formatStat(customers),
      trips: formatStat(trips),
      destinations: formatStat(totalCities),
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

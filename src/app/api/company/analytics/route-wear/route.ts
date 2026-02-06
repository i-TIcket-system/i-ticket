import { NextResponse } from "next/server"
import { requireCompanyAdmin, handleAuthError } from "@/lib/auth-helpers"
import prisma from "@/lib/db"

export async function GET() {
  try {
    const { companyId } = await requireCompanyAdmin()

    // Get completed trips with trip logs for the company
    const trips = await prisma.trip.findMany({
      where: {
        companyId,
        status: "COMPLETED",
        tripLog: { isNot: null },
      },
      select: {
        origin: true,
        destination: true,
        distance: true,
        tripLog: {
          select: {
            distanceTraveled: true,
            fuelConsumed: true,
            fuelEfficiency: true,
          },
        },
      },
      orderBy: { departureTime: "desc" },
      take: 500, // Last 500 completed trips
    })

    // Get post-trip inspections with defects
    const inspections = await prisma.vehicleInspection.findMany({
      where: {
        vehicle: { companyId },
        inspectionType: "POST_TRIP",
      },
      select: {
        defectsFound: true,
        criticalDefects: true,
        createdAt: true,
        vehicleId: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    // Aggregate by route
    const routeMap: Record<
      string,
      {
        route: string
        tripCount: number
        totalDistance: number
        avgFuelEfficiency: number
        fuelEfficiencyReadings: number[]
        totalDefects: number
        totalCriticalDefects: number
      }
    > = {}

    for (const trip of trips) {
      const route = `${trip.origin} → ${trip.destination}`

      if (!routeMap[route]) {
        routeMap[route] = {
          route,
          tripCount: 0,
          totalDistance: 0,
          avgFuelEfficiency: 0,
          fuelEfficiencyReadings: [],
          totalDefects: 0,
          totalCriticalDefects: 0,
        }
      }

      const r = routeMap[route]
      r.tripCount++
      r.totalDistance += trip.tripLog?.distanceTraveled || trip.distance || 0

      if (trip.tripLog?.fuelEfficiency && trip.tripLog.fuelEfficiency > 0) {
        r.fuelEfficiencyReadings.push(trip.tripLog.fuelEfficiency)
      }
    }

    // Calculate wear index for each route
    const routes = Object.values(routeMap)
      .map((r) => {
        const avgEff = r.fuelEfficiencyReadings.length > 0
          ? r.fuelEfficiencyReadings.reduce((sum, e) => sum + e, 0) / r.fuelEfficiencyReadings.length
          : 0

        // Fuel efficiency degradation (compare first half vs second half of readings)
        let efficiencyDegradation = 0
        if (r.fuelEfficiencyReadings.length >= 6) {
          const half = Math.floor(r.fuelEfficiencyReadings.length / 2)
          const recentAvg = r.fuelEfficiencyReadings.slice(0, half).reduce((s, e) => s + e, 0) / half
          const olderAvg = r.fuelEfficiencyReadings.slice(half).reduce((s, e) => s + e, 0) / (r.fuelEfficiencyReadings.length - half)
          if (olderAvg > 0) efficiencyDegradation = ((recentAvg - olderAvg) / olderAvg) * 100
        }

        // Wear index: higher = more wear (0-100 scale)
        // Based on: defect rate + fuel degradation + distance factor
        const defectRate = r.tripCount > 0 ? (r.totalDefects / r.tripCount) * 10 : 0
        const avgDistance = r.tripCount > 0 ? r.totalDistance / r.tripCount : 0
        const distanceFactor = Math.min(avgDistance / 10, 30) // Max 30 from distance

        const wearIndex = Math.min(100, Math.round(
          defectRate + Math.abs(efficiencyDegradation) + distanceFactor
        ))

        return {
          route: r.route,
          tripCount: r.tripCount,
          totalDistance: r.totalDistance,
          avgFuelEfficiency: Math.round(avgEff * 100) / 100,
          efficiencyDegradation: Math.round(efficiencyDegradation * 10) / 10,
          totalDefects: r.totalDefects,
          wearIndex,
        }
      })
      .filter((r) => r.tripCount >= 2) // Minimum 2 trips for meaningful data
      .sort((a, b) => b.wearIndex - a.wearIndex)

    return NextResponse.json({ routes })
  } catch (error) {
    return handleAuthError(error)
  }
}

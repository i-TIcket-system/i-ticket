import { NextRequest, NextResponse } from "next/server"
import { requireCompanyAdmin, handleAuthError } from "@/lib/auth-helpers"
import prisma from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { companyId } = await requireCompanyAdmin()

    const { searchParams } = new URL(request.url)
    const days = Math.min(90, Math.max(7, parseInt(searchParams.get("days") || "30") || 30))

    const daysAgo = new Date(Date.now() - days * 86400000)

    // Get company vehicles
    const vehicles = await prisma.vehicle.findMany({
      where: { companyId, status: { in: ["ACTIVE", "MAINTENANCE"] } },
      select: { id: true, plateNumber: true },
    })

    const vehicleIds = vehicles.map((v) => v.id)
    const vehicleMap = new Map(vehicles.map((v) => [v.id, v.plateNumber]))

    // Fetch risk history
    const history = await prisma.vehicleRiskHistory.findMany({
      where: {
        vehicleId: { in: vehicleIds },
        recordedAt: { gte: daysAgo },
      },
      orderBy: { recordedAt: "asc" },
      select: {
        vehicleId: true,
        riskScore: true,
        recordedAt: true,
      },
    })

    // Group by vehicle
    const grouped: Record<string, { date: string; score: number }[]> = {}
    for (const h of history) {
      if (!grouped[h.vehicleId]) grouped[h.vehicleId] = []
      grouped[h.vehicleId].push({
        date: h.recordedAt.toISOString().split("T")[0],
        score: h.riskScore,
      })
    }

    const trends = Object.entries(grouped).map(([vehicleId, data]) => ({
      vehicleId,
      plateNumber: vehicleMap.get(vehicleId) || "Unknown",
      data,
    }))

    return NextResponse.json({ trends })
  } catch (error) {
    return handleAuthError(error)
  }
}

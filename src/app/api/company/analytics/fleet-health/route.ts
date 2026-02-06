import { NextResponse } from "next/server"
import { requireCompanyAdmin, handleAuthError } from "@/lib/auth-helpers"
import prisma from "@/lib/db"

export async function GET() {
  try {
    const { companyId } = await requireCompanyAdmin()

    const vehicles = await prisma.vehicle.findMany({
      where: { companyId, status: { in: ["ACTIVE", "MAINTENANCE"] } },
      select: {
        id: true,
        plateNumber: true,
        sideNumber: true,
        maintenanceRiskScore: true,
        predictedFailureDate: true,
        predictedFailureType: true,
      },
    })

    const totalVehicles = vehicles.length
    const scores = vehicles.map((v) => v.maintenanceRiskScore || 0)
    const avgRisk = totalVehicles > 0
      ? scores.reduce((sum, s) => sum + s, 0) / totalVehicles
      : 0

    const riskDistribution = {
      low: vehicles.filter((v) => (v.maintenanceRiskScore || 0) < 40).length,
      medium: vehicles.filter((v) => {
        const s = v.maintenanceRiskScore || 0
        return s >= 40 && s < 60
      }).length,
      high: vehicles.filter((v) => {
        const s = v.maintenanceRiskScore || 0
        return s >= 60 && s < 85
      }).length,
      critical: vehicles.filter((v) => (v.maintenanceRiskScore || 0) >= 85).length,
    }

    const highRiskVehicles = vehicles
      .filter((v) => (v.maintenanceRiskScore || 0) >= 70)
      .map((v) => ({
        id: v.id,
        plateNumber: v.plateNumber,
        sideNumber: v.sideNumber,
        riskScore: v.maintenanceRiskScore,
        predictedFailureDate: v.predictedFailureDate,
        predictedFailureType: v.predictedFailureType,
      }))
      .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))

    const now = new Date()
    const sevenDays = new Date(now.getTime() + 7 * 86400000)

    const [upcomingMaintenance, overdueMaintenance] = await Promise.all([
      prisma.maintenanceSchedule.count({
        where: {
          vehicle: { companyId },
          isActive: true,
          nextDueDate: { gt: now, lte: sevenDays },
        },
      }),
      prisma.maintenanceSchedule.count({
        where: {
          vehicle: { companyId },
          isActive: true,
          nextDueDate: { lt: now },
        },
      }),
    ])

    return NextResponse.json({
      fleetHealthScore: Math.round(100 - avgRisk),
      totalVehicles,
      riskDistribution,
      highRiskVehicles,
      upcomingMaintenance,
      overdueMaintenance,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

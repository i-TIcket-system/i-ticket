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
        make: true,
        model: true,
        year: true,
        purchasePrice: true,
        purchaseDate: true,
        maintenanceCostYTD: true,
        fuelCostYTD: true,
        currentOdometer: true,
        createdAt: true,
      },
    })

    // Get total maintenance costs per vehicle (all time)
    const workOrderCosts = await prisma.workOrder.groupBy({
      by: ["vehicleId"],
      where: { companyId, status: "COMPLETED" },
      _sum: { totalCost: true },
    })
    const costMap = new Map(workOrderCosts.map((w) => [w.vehicleId, w._sum.totalCost || 0]))

    // Get total fuel costs per vehicle (all time)
    const fuelCosts = await prisma.fuelEntry.groupBy({
      by: ["vehicleId"],
      where: { companyId },
      _sum: { costBirr: true },
    })
    const fuelMap = new Map(fuelCosts.map((f) => [f.vehicleId, f._sum.costBirr || 0]))

    const tcoData = vehicles.map((v) => {
      const purchase = v.purchasePrice || 0
      const maintenance = costMap.get(v.id) || 0
      const fuel = fuelMap.get(v.id) || 0
      const total = purchase + maintenance + fuel

      // Calculate cost per km
      const costPerKm = v.currentOdometer && v.currentOdometer > 0
        ? total / v.currentOdometer
        : null

      // Calculate age in months
      const ageMonths = Math.floor(
        (Date.now() - (v.purchaseDate || v.createdAt).getTime()) / (30 * 86400000)
      )

      return {
        vehicleId: v.id,
        plateNumber: v.plateNumber,
        sideNumber: v.sideNumber,
        make: v.make,
        model: v.model,
        year: v.year,
        purchasePrice: Math.round(purchase),
        totalMaintenance: Math.round(maintenance),
        totalFuel: Math.round(fuel),
        totalCostOfOwnership: Math.round(total),
        costPerKm: costPerKm ? Math.round(costPerKm * 100) / 100 : null,
        ageMonths,
        currentOdometer: v.currentOdometer,
      }
    })

    // Sort by TCO descending
    tcoData.sort((a, b) => b.totalCostOfOwnership - a.totalCostOfOwnership)

    // Fleet totals
    const fleetTotals = {
      totalPurchase: tcoData.reduce((sum, v) => sum + v.purchasePrice, 0),
      totalMaintenance: tcoData.reduce((sum, v) => sum + v.totalMaintenance, 0),
      totalFuel: tcoData.reduce((sum, v) => sum + v.totalFuel, 0),
      totalTCO: tcoData.reduce((sum, v) => sum + v.totalCostOfOwnership, 0),
    }

    return NextResponse.json({ vehicles: tcoData, fleetTotals })
  } catch (error) {
    return handleAuthError(error)
  }
}

import { NextRequest, NextResponse } from "next/server"
import { requireCompanyAdmin, handleAuthError } from "@/lib/auth-helpers"
import prisma from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { companyId } = await requireCompanyAdmin()

    const { searchParams } = new URL(request.url)
    const vehicleIdsParam = searchParams.get("vehicleIds")

    let whereClause: Record<string, unknown> = {
      companyId,
      status: { in: ["ACTIVE", "MAINTENANCE"] },
    }

    if (vehicleIdsParam) {
      const ids = vehicleIdsParam.split(",").slice(0, 5)
      whereClause = { ...whereClause, id: { in: ids } }
    }

    const vehicles = await prisma.vehicle.findMany({
      where: whereClause,
      select: {
        id: true,
        plateNumber: true,
        sideNumber: true,
        make: true,
        model: true,
        year: true,
        totalSeats: true,
        status: true,
        maintenanceRiskScore: true,
        currentOdometer: true,
        fuelEfficiencyL100km: true,
        maintenanceCostYTD: true,
        lastServiceDate: true,
        inspectionDueDate: true,
        _count: {
          select: {
            trips: true,
            workOrders: { where: { status: "COMPLETED" } },
          },
        },
      },
      orderBy: { maintenanceRiskScore: "desc" },
      take: vehicleIdsParam ? undefined : 10,
    })

    const result = vehicles.map((v) => ({
      id: v.id,
      plateNumber: v.plateNumber,
      sideNumber: v.sideNumber,
      make: v.make,
      model: v.model,
      year: v.year,
      totalSeats: v.totalSeats,
      status: v.status,
      maintenanceRiskScore: v.maintenanceRiskScore,
      currentOdometer: v.currentOdometer,
      fuelEfficiencyL100km: v.fuelEfficiencyL100km,
      maintenanceCostYTD: v.maintenanceCostYTD,
      tripCount: v._count.trips,
      workOrderCount: v._count.workOrders,
      lastServiceDate: v.lastServiceDate?.toISOString() || null,
    }))

    return NextResponse.json({ vehicles: result })
  } catch (error) {
    return handleAuthError(error)
  }
}

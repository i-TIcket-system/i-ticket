import { NextRequest, NextResponse } from "next/server"
import { requireCompanyAdmin, handleAuthError } from "@/lib/auth-helpers"
import prisma from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { companyId } = await requireCompanyAdmin()

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const dateFilter: Record<string, unknown> = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate + "T23:59:59.999Z")

    const completedWhere: Record<string, unknown> = {
      companyId,
      status: "COMPLETED",
    }
    if (startDate || endDate) {
      completedWhere.completedAt = dateFilter
    }

    // Get completed work orders with costs
    const workOrders = await prisma.workOrder.findMany({
      where: completedWhere,
      select: {
        id: true,
        title: true,
        taskType: true,
        laborCost: true,
        partsCost: true,
        totalCost: true,
        completedAt: true,
        vehicleId: true,
        vehicle: {
          select: { plateNumber: true, sideNumber: true, make: true, model: true },
        },
      },
      orderBy: { completedAt: "desc" },
    })

    // Summary stats
    const totalCost = workOrders.reduce((sum, wo) => sum + wo.totalCost, 0)
    const totalLabor = workOrders.reduce((sum, wo) => sum + wo.laborCost, 0)
    const totalParts = workOrders.reduce((sum, wo) => sum + wo.partsCost, 0)

    // By vehicle
    const byVehicle: Record<string, { plateNumber: string; totalCost: number; workOrderCount: number }> = {}
    for (const wo of workOrders) {
      const key = wo.vehicleId
      if (!byVehicle[key]) {
        byVehicle[key] = {
          plateNumber: wo.vehicle.plateNumber,
          totalCost: 0,
          workOrderCount: 0,
        }
      }
      byVehicle[key].totalCost += wo.totalCost
      byVehicle[key].workOrderCount++
    }

    // By task type
    const byTaskType: Record<string, { count: number; totalCost: number }> = {}
    for (const wo of workOrders) {
      if (!byTaskType[wo.taskType]) {
        byTaskType[wo.taskType] = { count: 0, totalCost: 0 }
      }
      byTaskType[wo.taskType].count++
      byTaskType[wo.taskType].totalCost += wo.totalCost
    }

    // Monthly breakdown
    const byMonth: Record<string, { month: string; totalCost: number; laborCost: number; partsCost: number; count: number }> = {}
    for (const wo of workOrders) {
      if (!wo.completedAt) continue
      const month = wo.completedAt.toISOString().substring(0, 7) // YYYY-MM
      if (!byMonth[month]) {
        byMonth[month] = { month, totalCost: 0, laborCost: 0, partsCost: 0, count: 0 }
      }
      byMonth[month].totalCost += wo.totalCost
      byMonth[month].laborCost += wo.laborCost
      byMonth[month].partsCost += wo.partsCost
      byMonth[month].count++
    }

    return NextResponse.json({
      summary: {
        totalWorkOrders: workOrders.length,
        totalCost: Math.round(totalCost),
        totalLabor: Math.round(totalLabor),
        totalParts: Math.round(totalParts),
      },
      byVehicle: Object.entries(byVehicle)
        .map(([vehicleId, data]) => ({ vehicleId, ...data, totalCost: Math.round(data.totalCost) }))
        .sort((a, b) => b.totalCost - a.totalCost),
      byTaskType: Object.entries(byTaskType)
        .map(([taskType, data]) => ({ taskType, ...data, totalCost: Math.round(data.totalCost) }))
        .sort((a, b) => b.totalCost - a.totalCost),
      byMonth: Object.values(byMonth)
        .map((m) => ({
          ...m,
          totalCost: Math.round(m.totalCost),
          laborCost: Math.round(m.laborCost),
          partsCost: Math.round(m.partsCost),
        }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      workOrders: workOrders.slice(0, 100),
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

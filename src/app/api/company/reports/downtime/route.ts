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

    const where: Record<string, unknown> = { companyId }
    if (startDate || endDate) {
      where.startedAt = dateFilter
    }

    const downtimeRecords = await prisma.vehicleDowntime.findMany({
      where,
      include: {
        vehicle: {
          select: { plateNumber: true, sideNumber: true, make: true, model: true },
        },
      },
      orderBy: { startedAt: "desc" },
    })

    // Calculate duration for records without endedAt (still ongoing)
    const now = new Date()
    const records = downtimeRecords.map((d) => {
      const duration = d.durationHours || (
        d.endedAt
          ? (d.endedAt.getTime() - d.startedAt.getTime()) / 3600000
          : (now.getTime() - d.startedAt.getTime()) / 3600000
      )

      return {
        id: d.id,
        vehicleId: d.vehicleId,
        plateNumber: d.vehicle.plateNumber,
        sideNumber: d.vehicle.sideNumber,
        vehicleName: `${d.vehicle.make} ${d.vehicle.model}`,
        reason: d.reason,
        startedAt: d.startedAt.toISOString(),
        endedAt: d.endedAt?.toISOString() || null,
        durationHours: Math.round(duration * 10) / 10,
        isOngoing: !d.endedAt,
        notes: d.notes,
        workOrderId: d.workOrderId,
      }
    })

    // Aggregate by vehicle
    const byVehicle: Record<string, { plateNumber: string; totalHours: number; recordCount: number; ongoingCount: number }> = {}
    for (const r of records) {
      if (!byVehicle[r.vehicleId]) {
        byVehicle[r.vehicleId] = { plateNumber: r.plateNumber, totalHours: 0, recordCount: 0, ongoingCount: 0 }
      }
      byVehicle[r.vehicleId].totalHours += r.durationHours
      byVehicle[r.vehicleId].recordCount++
      if (r.isOngoing) byVehicle[r.vehicleId].ongoingCount++
    }

    // Aggregate by reason
    const byReason: Record<string, { count: number; totalHours: number }> = {}
    for (const r of records) {
      if (!byReason[r.reason]) byReason[r.reason] = { count: 0, totalHours: 0 }
      byReason[r.reason].count++
      byReason[r.reason].totalHours += r.durationHours
    }

    const totalDowntimeHours = records.reduce((sum, r) => sum + r.durationHours, 0)

    return NextResponse.json({
      summary: {
        totalRecords: records.length,
        totalDowntimeHours: Math.round(totalDowntimeHours * 10) / 10,
        ongoingCount: records.filter((r) => r.isOngoing).length,
        avgDowntimeHours: records.length > 0
          ? Math.round((totalDowntimeHours / records.length) * 10) / 10
          : 0,
      },
      byVehicle: Object.entries(byVehicle)
        .map(([vehicleId, data]) => ({
          vehicleId,
          ...data,
          totalHours: Math.round(data.totalHours * 10) / 10,
        }))
        .sort((a, b) => b.totalHours - a.totalHours),
      byReason: Object.entries(byReason)
        .map(([reason, data]) => ({
          reason,
          ...data,
          totalHours: Math.round(data.totalHours * 10) / 10,
        }))
        .sort((a, b) => b.totalHours - a.totalHours),
      records: records.slice(0, 100),
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

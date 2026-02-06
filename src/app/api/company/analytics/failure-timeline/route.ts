import { NextResponse } from "next/server"
import { requireCompanyAdmin, handleAuthError } from "@/lib/auth-helpers"
import prisma from "@/lib/db"

export async function GET() {
  try {
    const { companyId } = await requireCompanyAdmin()

    const now = new Date()
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 86400000)

    // Get predicted failures
    const predictedVehicles = await prisma.vehicle.findMany({
      where: {
        companyId,
        status: { in: ["ACTIVE", "MAINTENANCE"] },
        predictedFailureDate: { gte: now, lte: ninetyDaysFromNow },
      },
      select: {
        id: true,
        plateNumber: true,
        predictedFailureDate: true,
        predictedFailureType: true,
        maintenanceRiskScore: true,
      },
    })

    const predictions = predictedVehicles.map((v) => ({
      vehicleId: v.id,
      plateNumber: v.plateNumber,
      date: v.predictedFailureDate!.toISOString(),
      type: "prediction" as const,
      label: `Predicted ${v.predictedFailureType || "General"} failure`,
      riskScore: v.maintenanceRiskScore,
    }))

    // Get scheduled maintenance
    const schedules = await prisma.maintenanceSchedule.findMany({
      where: {
        vehicle: { companyId },
        isActive: true,
        nextDueDate: { lte: ninetyDaysFromNow },
      },
      select: {
        vehicleId: true,
        taskName: true,
        nextDueDate: true,
        priority: true,
        vehicle: {
          select: { plateNumber: true },
        },
      },
    })

    const scheduled = schedules
      .filter((s) => s.nextDueDate)
      .map((s) => ({
        vehicleId: s.vehicleId,
        plateNumber: s.vehicle.plateNumber,
        date: s.nextDueDate!.toISOString(),
        type: "scheduled" as const,
        label: s.taskName,
        priority: s.priority,
      }))

    // Merge and sort all events by date
    const events = [...predictions, ...scheduled].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    return NextResponse.json({ events })
  } catch (error) {
    return handleAuthError(error)
  }
}

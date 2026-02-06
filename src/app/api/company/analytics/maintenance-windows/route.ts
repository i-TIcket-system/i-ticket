import { NextRequest, NextResponse } from "next/server"
import { requireCompanyAdmin, handleAuthError } from "@/lib/auth-helpers"
import prisma from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { companyId } = await requireCompanyAdmin()

    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get("vehicleId")

    if (!vehicleId) {
      return NextResponse.json({ error: "vehicleId required" }, { status: 400 })
    }

    // Verify vehicle belongs to company
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, companyId },
      select: { id: true, plateNumber: true, maintenanceRiskScore: true },
    })

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    // Get upcoming scheduled trips for this vehicle (next 14 days)
    const now = new Date()
    const fourteenDays = new Date(now.getTime() + 14 * 86400000)

    const trips = await prisma.trip.findMany({
      where: {
        vehicleId,
        companyId,
        departureTime: { gte: now, lte: fourteenDays },
        status: { in: ["SCHEDULED", "BOARDING", "DELAYED"] },
        isActive: true,
      },
      select: {
        id: true,
        origin: true,
        destination: true,
        departureTime: true,
        estimatedDuration: true,
      },
      orderBy: { departureTime: "asc" },
    })

    // Find gaps between trips
    const windows: {
      start: string
      end: string
      durationHours: number
      beforeTrip: string | null
      suitableTasks: string[]
    }[] = []

    // Window from now to first trip
    if (trips.length > 0) {
      const firstTrip = trips[0]
      const gapHours = (firstTrip.departureTime.getTime() - now.getTime()) / 3600000
      if (gapHours >= 2) {
        windows.push({
          start: now.toISOString(),
          end: firstTrip.departureTime.toISOString(),
          durationHours: Math.round(gapHours * 10) / 10,
          beforeTrip: `${firstTrip.origin} → ${firstTrip.destination}`,
          suitableTasks: getSuitableTasks(gapHours),
        })
      }
    }

    // Gaps between consecutive trips
    for (let i = 0; i < trips.length - 1; i++) {
      const current = trips[i]
      const next = trips[i + 1]
      // Estimate end of current trip
      const tripEndTime = current.departureTime.getTime() + (current.estimatedDuration || 0) * 60000
      const gapHours = (next.departureTime.getTime() - tripEndTime) / 3600000

      if (gapHours >= 2) {
        windows.push({
          start: new Date(tripEndTime).toISOString(),
          end: next.departureTime.toISOString(),
          durationHours: Math.round(gapHours * 10) / 10,
          beforeTrip: `${next.origin} → ${next.destination}`,
          suitableTasks: getSuitableTasks(gapHours),
        })
      }
    }

    // Window after last trip
    if (trips.length > 0) {
      const lastTrip = trips[trips.length - 1]
      const tripEndTime = lastTrip.departureTime.getTime() + (lastTrip.estimatedDuration || 0) * 60000
      const gapHours = (fourteenDays.getTime() - tripEndTime) / 3600000

      if (gapHours >= 4) {
        windows.push({
          start: new Date(tripEndTime).toISOString(),
          end: fourteenDays.toISOString(),
          durationHours: Math.round(gapHours * 10) / 10,
          beforeTrip: null,
          suitableTasks: getSuitableTasks(gapHours),
        })
      }
    }

    // If no trips, the whole period is a window
    if (trips.length === 0) {
      const hours = (fourteenDays.getTime() - now.getTime()) / 3600000
      windows.push({
        start: now.toISOString(),
        end: fourteenDays.toISOString(),
        durationHours: Math.round(hours * 10) / 10,
        beforeTrip: null,
        suitableTasks: getSuitableTasks(hours),
      })
    }

    return NextResponse.json({
      vehicleId,
      plateNumber: vehicle.plateNumber,
      riskScore: vehicle.maintenanceRiskScore,
      windows,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

function getSuitableTasks(hours: number): string[] {
  const tasks: string[] = []
  if (hours >= 1) tasks.push("Quick Inspection")
  if (hours >= 2) tasks.push("Oil Check", "Tire Inspection", "Fluid Top-up")
  if (hours >= 4) tasks.push("Oil Change", "Brake Inspection", "Filter Replacement")
  if (hours >= 8) tasks.push("Full Service", "Brake Pad Replacement", "Battery Replacement")
  if (hours >= 24) tasks.push("Major Overhaul", "Transmission Service", "Engine Diagnostics")
  return tasks
}

import { NextRequest, NextResponse } from "next/server"
import { requireCompanyAdmin, handleAuthError } from "@/lib/auth-helpers"
import prisma from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { companyId } = await requireCompanyAdmin()

    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()))

    // Get all active vehicles with compliance dates
    const vehicles = await prisma.vehicle.findMany({
      where: { companyId, status: { in: ["ACTIVE", "MAINTENANCE"] } },
      select: {
        id: true,
        plateNumber: true,
        sideNumber: true,
        registrationExpiry: true,
        insuranceExpiry: true,
        inspectionDueDate: true,
        nextServiceDate: true,
      },
    })

    // Build calendar events
    const events: {
      date: string
      vehicleId: string
      plateNumber: string
      type: string // REGISTRATION, INSURANCE, INSPECTION, SERVICE
      label: string
      isOverdue: boolean
    }[] = []

    const now = new Date()
    const monthStart = new Date(year, month - 1, 1)
    const monthEnd = new Date(year, month, 0, 23, 59, 59)

    for (const v of vehicles) {
      const dates = [
        { date: v.registrationExpiry, type: "REGISTRATION", label: "Registration Expiry" },
        { date: v.insuranceExpiry, type: "INSURANCE", label: "Insurance Expiry" },
        { date: v.inspectionDueDate, type: "INSPECTION", label: "Inspection Due" },
        { date: v.nextServiceDate, type: "SERVICE", label: "Service Due" },
      ]

      for (const d of dates) {
        if (!d.date) continue

        // Include if the date falls within the requested month, OR is overdue (past date)
        const dateInMonth = d.date >= monthStart && d.date <= monthEnd
        const isOverdue = d.date < now

        if (dateInMonth || isOverdue) {
          events.push({
            date: d.date.toISOString().split("T")[0],
            vehicleId: v.id,
            plateNumber: v.plateNumber,
            type: d.type,
            label: `${v.plateNumber}: ${d.label}`,
            isOverdue,
          })
        }
      }
    }

    // Sort events by date
    events.sort((a, b) => a.date.localeCompare(b.date))

    // Group by date for calendar rendering
    const byDate: Record<string, typeof events> = {}
    for (const e of events) {
      if (!byDate[e.date]) byDate[e.date] = []
      byDate[e.date].push(e)
    }

    // Count overdue items
    const overdueCount = events.filter((e) => e.isOverdue).length

    return NextResponse.json({
      month,
      year,
      events,
      byDate,
      overdueCount,
      totalVehicles: vehicles.length,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

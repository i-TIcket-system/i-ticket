import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { Prisma } from "@prisma/client"

/**
 * BUG FIX v2.10.5: Staff Work Orders API
 * Get work orders assigned to the authenticated staff (Driver/Conductor)
 * Uses same pattern as mechanic work orders API
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Must be staff (Driver or Conductor)
    if (
      session.user.role !== "COMPANY_ADMIN" ||
      !session.user.staffRole ||
      !["DRIVER", "CONDUCTOR"].includes(session.user.staffRole)
    ) {
      return NextResponse.json(
        { error: "Staff access required (Driver or Conductor)" },
        { status: 403 }
      )
    }

    // Ensure companyId exists
    if (!session.user.companyId) {
      return NextResponse.json(
        { error: "Company association required" },
        { status: 403 }
      )
    }

    const companyId = session.user.companyId
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // Build where clause - fetch all potentially relevant work orders
    // We'll filter client-side because assignedStaffIds is JSON string
    const where: Prisma.WorkOrderWhereInput = {
      companyId,
      OR: [
        { assignedToId: session.user.id },
        { assignedStaffIds: { not: null } },  // Get all with multi-assignment
      ],
    }

    if (status && status !== "ALL") {
      where.status = status
    }

    // Fetch work orders and filter client-side for JSON array membership
    const allWorkOrders = await prisma.workOrder.findMany({
      where,
      select: {
        id: true,
        workOrderNumber: true,
        vehicleId: true,
        title: true,
        description: true,
        taskType: true,
        priority: true,
        status: true,
        assignedToId: true,
        assignedToName: true,
        assignedStaffIds: true,
        scheduledDate: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            sideNumber: true,
            make: true,
            model: true,
            year: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: [
        { priority: "desc" },
        { scheduledDate: "asc" },
        { createdAt: "desc" },
      ],
    })

    // Filter client-side to check JSON array membership
    const filteredWorkOrders = allWorkOrders.filter(wo => {
      // Check legacy assignment
      if (wo.assignedToId === session.user.id) return true

      // Check new multi-staff assignment
      if (wo.assignedStaffIds) {
        try {
          const staffIds = JSON.parse(wo.assignedStaffIds)
          return Array.isArray(staffIds) && staffIds.includes(session.user.id)
        } catch {
          return false
        }
      }

      return false
    })

    // v2.10.6: Sort COMPLETED/CANCELLED to bottom, active statuses first
    const statusOrder: Record<string, number> = {
      OPEN: 0,
      IN_PROGRESS: 1,
      BLOCKED: 2,
      COMPLETED: 3,
      CANCELLED: 4,
    }
    const workOrders = filteredWorkOrders.sort((a, b) => {
      const statusA = statusOrder[a.status] ?? 5
      const statusB = statusOrder[b.status] ?? 5
      if (statusA !== statusB) return statusA - statusB
      // Within same status group, sort by priority (desc) then date (desc)
      if (a.priority !== b.priority) return b.priority - a.priority
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // Get stats - reuse same filtering logic
    const statsWhere: Prisma.WorkOrderWhereInput = {
      companyId,
      OR: [
        { assignedToId: session.user.id },
        { assignedStaffIds: { not: null } },
      ],
    }

    const allStatsWorkOrders = await prisma.workOrder.findMany({
      where: statsWhere,
      select: {
        id: true,
        status: true,
        assignedToId: true,
        assignedStaffIds: true,
      },
    })

    // Filter and group stats
    const filteredStatsWorkOrders = allStatsWorkOrders.filter(wo => {
      if (wo.assignedToId === session.user.id) return true
      if (wo.assignedStaffIds) {
        try {
          const staffIds = JSON.parse(wo.assignedStaffIds)
          return Array.isArray(staffIds) && staffIds.includes(session.user.id)
        } catch {
          return false
        }
      }
      return false
    })

    const statsMap = filteredStatsWorkOrders.reduce((acc, wo) => {
      acc[wo.status] = (acc[wo.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      workOrders,
      stats: {
        open: statsMap["OPEN"] || 0,
        inProgress: statsMap["IN_PROGRESS"] || 0,
        blocked: statsMap["BLOCKED"] || 0,
        completed: statsMap["COMPLETED"] || 0,
        cancelled: statsMap["CANCELLED"] || 0,
        total: workOrders.length,
      },
    })
  } catch (error) {
    console.error("Staff work orders fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { Prisma } from "@prisma/client"

/**
 * Get work orders assigned to the authenticated mechanic
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

    // Must be a mechanic
    if (session.user.role !== "COMPANY_ADMIN" || session.user.staffRole !== "MECHANIC") {
      return NextResponse.json(
        { error: "Mechanic access required" },
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
        partsUsed: {
          select: {
            id: true,
            partName: true,
            quantity: true,
            totalPrice: true,
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
    const workOrders = allWorkOrders.filter(wo => {
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
    console.error("Mechanic work orders fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

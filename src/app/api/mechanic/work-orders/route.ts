import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

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

    // Build where clause
    const where: any = {
      companyId,
      assignedToId: session.user.id,
    }

    if (status && status !== "ALL") {
      where.status = status
    }

    // Fetch work orders assigned to this mechanic
    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
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

    // Get stats
    const stats = await prisma.workOrder.groupBy({
      by: ["status"],
      where: {
        companyId,
        assignedToId: session.user.id,
      },
      _count: {
        _all: true,
      },
    })

    const statsMap = stats.reduce((acc, s) => {
      acc[s.status] = s._count._all
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

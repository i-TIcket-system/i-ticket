import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

/**
 * Get all work orders for finance staff - focused on cost tracking
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

    // Must be finance staff
    if (session.user.role !== "COMPANY_ADMIN" || session.user.staffRole !== "FINANCE") {
      return NextResponse.json(
        { error: "Finance access required" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Build where clause
    const where: any = {
      companyId: session.user.companyId,
    }

    if (status && status !== "ALL") {
      where.status = status
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    // Fetch all work orders for the company
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
          },
        },
        partsUsed: {
          select: {
            id: true,
            partName: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            supplier: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Calculate cost statistics
    const costStats = await prisma.workOrder.aggregate({
      where: {
        companyId: session.user.companyId,
      },
      _sum: {
        laborCost: true,
        partsCost: true,
        totalCost: true,
      },
      _avg: {
        totalCost: true,
      },
      _count: true,
    })

    // Get stats by status
    const statusStats = await prisma.workOrder.groupBy({
      by: ["status"],
      where: {
        companyId: session.user.companyId,
      },
      _sum: {
        totalCost: true,
      },
      _count: true,
    })

    // Get monthly spending (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlySpending = await prisma.workOrder.groupBy({
      by: ["createdAt"],
      where: {
        companyId: session.user.companyId,
        status: "COMPLETED",
        createdAt: { gte: sixMonthsAgo },
      },
      _sum: {
        totalCost: true,
      },
    })

    return NextResponse.json({
      workOrders,
      stats: {
        totalLaborCost: costStats._sum.laborCost || 0,
        totalPartsCost: costStats._sum.partsCost || 0,
        totalCost: costStats._sum.totalCost || 0,
        averageCost: costStats._avg.totalCost || 0,
        totalWorkOrders: costStats._count,
        byStatus: statusStats.reduce((acc, s) => {
          acc[s.status] = {
            count: s._count,
            totalCost: s._sum.totalCost || 0,
          }
          return acc
        }, {} as Record<string, { count: number; totalCost: number }>),
      },
    })
  } catch (error) {
    console.error("Finance work orders fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

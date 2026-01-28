import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { Prisma } from "@prisma/client"
import { z } from "zod"

// Issue 2.4: RULE-014 - Validation schema for finance query parameters
// BUG FIX v2.10.5: Added .nullish() to handle null from searchParams.get()
const financeQuerySchema = z.object({
  status: z.string().nullish(),
  startDate: z.string().nullish().refine(
    (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
    "Invalid date format. Use YYYY-MM-DD"
  ),
  endDate: z.string().nullish().refine(
    (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
    "Invalid date format. Use YYYY-MM-DD"
  ),
})

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

    // Ensure companyId exists
    if (!session.user.companyId) {
      return NextResponse.json(
        { error: "Company association required" },
        { status: 403 }
      )
    }

    const companyId = session.user.companyId
    const { searchParams } = new URL(request.url)

    // Issue 2.4: Validate query parameters with Zod
    const queryValidation = financeQuerySchema.safeParse({
      status: searchParams.get("status"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    })

    if (!queryValidation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryValidation.error.format() },
        { status: 400 }
      )
    }

    const { status, startDate, endDate } = queryValidation.data

    // Build where clause with proper Prisma types
    const where: Prisma.WorkOrderWhereInput = {
      companyId,
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
    const workOrdersRaw = await prisma.workOrder.findMany({
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
            partNumber: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            supplier: true,
            // Issue 1.2: Parts status fields for approval workflow visibility
            status: true,
            notes: true,
            requestedBy: true,
            requestedAt: true,
            approvedBy: true,
            approvedAt: true,
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

    // v2.10.6: Sort COMPLETED/CANCELLED to bottom, active statuses first
    const statusOrder: Record<string, number> = {
      OPEN: 0,
      IN_PROGRESS: 1,
      BLOCKED: 2,
      COMPLETED: 3,
      CANCELLED: 4,
    }
    const workOrders = workOrdersRaw.sort((a, b) => {
      const statusA = statusOrder[a.status] ?? 5
      const statusB = statusOrder[b.status] ?? 5
      if (statusA !== statusB) return statusA - statusB
      // Within same status group, sort by date (desc)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // Calculate cost statistics
    const costStats = await prisma.workOrder.aggregate({
      where: {
        companyId,
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
        companyId,
      },
      _sum: {
        totalCost: true,
      },
      _count: {
        _all: true,
      },
    })

    // Get monthly spending (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlySpending = await prisma.workOrder.groupBy({
      by: ["createdAt"],
      where: {
        companyId,
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
        totalLaborCost: costStats._sum?.laborCost ?? 0,
        totalPartsCost: costStats._sum?.partsCost ?? 0,
        totalCost: costStats._sum?.totalCost ?? 0,
        averageCost: costStats._avg?.totalCost ?? 0,
        totalWorkOrders: costStats._count,
        byStatus: statusStats.reduce((acc, s) => {
          acc[s.status] = {
            count: s._count._all,
            totalCost: s._sum?.totalCost ?? 0,
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

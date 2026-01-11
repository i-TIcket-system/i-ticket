import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

/**
 * Get audit logs for the company admin's company
 * Filtered to show only logs related to their company
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only company admins can access
    if (session.user.role !== "COMPANY_ADMIN" || !session.user.companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const companyId = session.user.companyId

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = 20

    // Always filter by company
    const where: any = {
      companyId: companyId,
    }

    if (action && action !== "ALL") {
      where.action = action
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        where.createdAt.gte = start
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        where,
        select: {
          id: true,
          userId: true,
          action: true,
          details: true,
          companyId: true,
          tripId: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.adminLog.count({ where })
    ])

    // Fetch user names for logs
    const userIds = Array.from(new Set(logs.map(log => log.userId).filter(id => id !== "SYSTEM")))

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, staffRole: true }
    })

    // Map user data to logs
    const enrichedLogs = logs.map(log => ({
      ...log,
      user: log.userId === "SYSTEM"
        ? { name: "System", email: "system@i-ticket.et", staffRole: null }
        : users.find(u => u.id === log.userId) || { name: "Unknown", email: "", staffRole: null },
    }))

    return NextResponse.json({
      logs: enrichedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    })
  } catch (error) {
    console.error("Company audit logs fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

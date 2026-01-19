import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireSuperAdmin, handleAuthError } from "@/lib/auth-helpers"
import { paginationSchema } from "@/lib/validations"

/**
 * Get audit logs with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const companyId = searchParams.get("companyId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // M1 FIX: Use pagination schema to reject scientific notation and floats
    const paginationParams = Object.fromEntries(searchParams.entries())
    const { page } = paginationSchema.parse(paginationParams)
    const limit = 20

    const where: any = {}

    if (action && action !== "ALL") {
      where.action = action
    }

    if (companyId && companyId !== "ALL") {
      where.companyId = companyId
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

    // Fetch user and company names for logs
    const userIds = Array.from(new Set(logs.map(log => log.userId).filter(id => id !== "SYSTEM")))
    const companyIds = Array.from(new Set(logs.map(log => log.companyId).filter(Boolean))) as string[]

    const [users, companies] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true }
      }),
      prisma.company.findMany({
        where: { id: { in: companyIds } },
        select: { id: true, name: true }
      })
    ])

    // Map user and company data to logs
    const enrichedLogs = logs.map(log => ({
      ...log,
      user: log.userId === "SYSTEM"
        ? { name: "System", email: "system@i-ticket.et" }
        : users.find(u => u.id === log.userId) || { name: "Unknown", email: "" },
      company: log.companyId
        ? companies.find(c => c.id === log.companyId) || { name: "Unknown" }
        : null
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
    console.error("Audit logs fetch error:", error)
    return handleAuthError(error)
  }
}

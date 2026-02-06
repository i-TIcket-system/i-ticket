import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireSuperAdmin, handleAuthError } from "@/lib/auth-helpers"
import { z } from "zod"

/**
 * GET /api/admin/bookings
 * Get bookings with filters and pagination for super admin dashboard
 */

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.enum(["PAID", "PENDING", "CANCELLED", "ALL"]).default("ALL"),
  companyId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const searchParams = request.nextUrl.searchParams
    const params = querySchema.parse({
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 10,
      status: searchParams.get("status") ?? "ALL",
      companyId: searchParams.get("companyId") ?? undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    })

    // Build where clause
    const where: any = {}

    // Status filter
    if (params.status !== "ALL") {
      where.status = params.status
    }

    // Company filter
    if (params.companyId) {
      where.trip = {
        companyId: params.companyId,
      }
    }

    // Date range filter
    if (params.startDate || params.endDate) {
      where.createdAt = {}
      if (params.startDate) {
        const start = new Date(params.startDate)
        start.setHours(0, 0, 0, 0)
        where.createdAt.gte = start
      }
      if (params.endDate) {
        const end = new Date(params.endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    // Search filter (by customer name or phone)
    if (params.search) {
      where.user = {
        OR: [
          { name: { contains: params.search, mode: "insensitive" } },
          { phone: { contains: params.search } },
        ],
      }
    }

    // Get total count for pagination
    const total = await prisma.booking.count({ where })

    // Get bookings with pagination
    const bookings = await prisma.booking.findMany({
      where,
      take: params.limit,
      skip: (params.page - 1) * params.limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, phone: true },
        },
        trip: {
          include: {
            company: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    return NextResponse.json({
      bookings,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      )
    }
    return handleAuthError(error)
  }
}

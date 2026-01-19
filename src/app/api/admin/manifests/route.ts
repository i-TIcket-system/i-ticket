import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

/**
 * GET /api/admin/manifests
 * Super Admin: View all auto-generated manifests across all companies
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Super Admin access required" },
        { status: 401 }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const companyId = searchParams.get("companyId")
    const downloadType = searchParams.get("downloadType")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")

    // Build filter conditions
    const where: any = {}

    if (companyId) {
      where.companyId = companyId
    }

    if (downloadType && downloadType !== "ALL") {
      where.downloadType = downloadType
    }

    if (startDate) {
      where.downloadedAt = {
        ...where.downloadedAt,
        gte: new Date(startDate)
      }
    }

    if (endDate) {
      where.downloadedAt = {
        ...where.downloadedAt,
        lte: new Date(endDate)
      }
    }

    // Fetch manifests with pagination
    const [manifests, totalCount] = await Promise.all([
      prisma.manifestDownload.findMany({
        where,
        include: {
          trip: {
            select: {
              id: true,
              origin: true,
              destination: true,
              departureTime: true,
              status: true,
              company: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: { downloadedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.manifestDownload.count({ where })
    ])

    // Calculate summary stats
    const stats = await prisma.manifestDownload.aggregate({
      where,
      _sum: {
        passengerCount: true,
        totalRevenue: true,
        fileSize: true
      },
      _count: {
        id: true
      }
    })

    // Get company list for filter dropdown
    const companies = await prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    })

    return NextResponse.json({
      manifests,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats: {
        totalManifests: stats._count.id,
        totalPassengers: stats._sum.passengerCount || 0,
        totalRevenue: stats._sum.totalRevenue || 0,
        platformCommission: (stats._sum.totalRevenue || 0) * 0.05,
        totalFileSize: stats._sum.fileSize || 0
      },
      companies
    })

  } catch (error) {
    console.error("Error fetching manifests:", error)
    return NextResponse.json(
      { error: "Failed to fetch manifests" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireSuperAdmin, handleAuthError } from "@/lib/auth-helpers"

/**
 * Get all companies for admin management
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            users: true,
            trips: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ companies })
  } catch (error) {
    return handleAuthError(error)
  }
}

/**
 * Toggle company active status
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const { companyId, isActive } = await request.json()

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 })
    }

    const company = await prisma.company.update({
      where: { id: companyId },
      data: { isActive },
    })

    return NextResponse.json({
      success: true,
      message: `Company ${isActive ? "activated" : "deactivated"} successfully`,
      company,
    })
  } catch (error) {
    console.error("Company update error:", error)
    return handleAuthError(error)
  }
}

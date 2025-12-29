import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireSuperAdmin, handleAuthError } from "@/lib/auth-helpers"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const CompanyStatusSchema = z.object({
  companyId: z.string().min(1, "Company ID is required"),
  isActive: z.boolean(),
  reason: z.string()
    .trim()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must not exceed 500 characters"),
})

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
 * Toggle company active status with audit logging
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireSuperAdmin()
    const session = await getServerSession(authOptions)

    // Validate request body
    const body = await request.json()
    const validation = CompanyStatusSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { companyId, isActive, reason } = validation.data

    // Get existing company
    const existingCompany = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, isActive: true }
    })

    if (!existingCompany) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    // Prevent no-op updates
    if (existingCompany.isActive === isActive) {
      return NextResponse.json(
        { error: `Company is already ${isActive ? "active" : "inactive"}` },
        { status: 400 }
      )
    }

    // Update company + create audit log in transaction
    const [company, auditLog] = await prisma.$transaction([
      prisma.company.update({
        where: { id: companyId },
        data: { isActive },
      }),
      prisma.adminLog.create({
        data: {
          userId: session!.user.id,
          action: isActive ? "COMPANY_ACTIVATED" : "COMPANY_DEACTIVATED",
          companyId: companyId,
          details: JSON.stringify({
            companyId,
            companyName: existingCompany.name,
            previousState: existingCompany.isActive,
            newState: isActive,
            reason,
            adminName: session!.user.name,
            adminEmail: session!.user.email,
            timestamp: new Date().toISOString(),
          }),
        },
      }),
    ])

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

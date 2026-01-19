import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireSuperAdmin, handleAuthError } from "@/lib/auth-helpers"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAuditLogTask } from "@/lib/clickup"

const UpdateCompanySchema = z.object({
  // Company info
  companyName: z.string().min(2, "Company name must be at least 2 characters").optional(),
  companyPhone: z.string().regex(/^09\d{8}$/, "Phone must be Ethiopian format (09XXXXXXXX)").optional(),
  companyEmail: z.string().email("Invalid email address").optional(),
  address: z.string().optional(),

  // Bank info
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankBranch: z.string().optional(),

  // Admin contact info (update company record, not user)
  adminName: z.string().min(2, "Admin name must be at least 2 characters").optional(),
  adminPhone: z.string().regex(/^09\d{8}$/, "Admin phone must be Ethiopian format (09XXXXXXXX)").optional(),
  adminEmail: z.string().email("Invalid admin email address").optional(),
})

/**
 * Update company details
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    await requireSuperAdmin()
    const session = await getServerSession(authOptions)

    const { companyId } = params

    // Validate request body
    const body = await request.json()
    const validation = UpdateCompanySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const {
      companyName,
      companyPhone,
      companyEmail,
      address,
      bankName,
      bankAccount,
      bankBranch,
      adminName,
      adminPhone,
      adminEmail,
    } = validation.data

    // Get existing company
    const existingCompany = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        phones: true,
        email: true,
        address: true,
        bankName: true,
        bankAccount: true,
        bankBranch: true,
        adminName: true,
        adminPhone: true,
        adminEmail: true,
      },
    })

    if (!existingCompany) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    // Check for duplicate company phone (if changing)
    if (companyPhone && companyPhone !== JSON.parse(existingCompany.phones)[0]) {
      const duplicatePhone = await prisma.company.findFirst({
        where: {
          id: { not: companyId },
          phones: { contains: companyPhone },
        },
      })

      if (duplicatePhone) {
        return NextResponse.json(
          { error: "A company with this phone number already exists" },
          { status: 400 }
        )
      }
    }

    // Build update data object (only include fields that were provided)
    const updateData: any = {}

    if (companyName !== undefined) updateData.name = companyName
    if (companyPhone !== undefined) updateData.phones = JSON.stringify([companyPhone])
    if (companyEmail !== undefined) updateData.email = companyEmail
    if (address !== undefined) updateData.address = address
    if (bankName !== undefined) updateData.bankName = bankName
    if (bankAccount !== undefined) updateData.bankAccount = bankAccount
    if (bankBranch !== undefined) updateData.bankBranch = bankBranch
    if (adminName !== undefined) updateData.adminName = adminName
    if (adminPhone !== undefined) updateData.adminPhone = adminPhone
    if (adminEmail !== undefined) updateData.adminEmail = adminEmail

    // Update company + create audit log in transaction
    const [company] = await prisma.$transaction([
      prisma.company.update({
        where: { id: companyId },
        data: updateData,
      }),
      prisma.adminLog.create({
        data: {
          userId: session!.user.id,
          action: "COMPANY_UPDATED",
          companyId: companyId,
          details: JSON.stringify({
            companyId,
            companyName: existingCompany.name,
            updatedBy: session!.user.name,
            updatedByEmail: session!.user.email,
            changes: updateData,
            timestamp: new Date().toISOString(),
          }),
        },
      }),
    ])

    // Create ClickUp audit task (non-blocking)
    createAuditLogTask({
      action: "COMPANY_UPDATED",
      userId: session!.user.id,
      userName: session!.user.name,
      companyId,
      companyName: existingCompany.name,
      details: `Company details updated: ${Object.keys(updateData).join(", ")}`,
    })

    return NextResponse.json({
      success: true,
      message: "Company updated successfully",
      company,
    })
  } catch (error) {
    console.error("Company update error:", error)
    return handleAuthError(error)
  }
}

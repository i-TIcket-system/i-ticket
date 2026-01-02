import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

// Validation schema
const updateCompanySchema = z.object({
  name: z.string().min(2, "Company name required").optional(),
  email: z.string().email("Invalid email").optional(),
  phones: z.array(z.string()).optional(),
  // Contact information
  fax: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  poBox: z.string().optional(),
  tinNumber: z.string().optional(),
  // Bank information
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankBranch: z.string().optional(),
  // Key contacts
  adminName: z.string().optional(),
  adminPhone: z.string().optional(),
  adminEmail: z.string().email("Invalid admin email").optional().or(z.literal("")),
  supportName: z.string().optional(),
  supportPhone: z.string().optional(),
  // Report signatories
  preparedBy: z.string().optional(),
  reviewedBy: z.string().optional(),
  approvedBy: z.string().optional(),
})

// GET /api/company/profile - Get company information
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "COMPANY_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Company admin access required" },
        { status: 401 }
      )
    }

    if (!session.user.companyId) {
      return NextResponse.json(
        { error: "No company associated with this account" },
        { status: 404 }
      )
    }

    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: {
        id: true,
        name: true,
        logo: true,
        phones: true,
        email: true,
        isActive: true,
        // Contact information
        fax: true,
        website: true,
        address: true,
        poBox: true,
        tinNumber: true,
        // Bank information
        bankName: true,
        bankAccount: true,
        bankBranch: true,
        // Key contacts
        adminName: true,
        adminPhone: true,
        adminEmail: true,
        supportName: true,
        supportPhone: true,
        // Report signatories
        preparedBy: true,
        reviewedBy: true,
        approvedBy: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ company })

  } catch (error) {
    console.error("Error fetching company profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch company profile" },
      { status: 500 }
    )
  }
}

// PATCH /api/company/profile - Update company information
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "COMPANY_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Company admin access required" },
        { status: 401 }
      )
    }

    if (!session.user.companyId) {
      return NextResponse.json(
        { error: "No company associated with this account" },
        { status: 404 }
      )
    }

    const body = await req.json()

    // Validate input
    const validation = updateCompanySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Build update data with proper types
    const updateData: Record<string, any> = {}

    // Basic info
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.email !== undefined) updateData.email = validatedData.email

    // Convert phones array to JSON string if provided
    if (validatedData.phones !== undefined) {
      updateData.phones = JSON.stringify(validatedData.phones)
    }

    // Contact information
    if (validatedData.fax !== undefined) updateData.fax = validatedData.fax || null
    if (validatedData.website !== undefined) updateData.website = validatedData.website || null
    if (validatedData.address !== undefined) updateData.address = validatedData.address || null
    if (validatedData.poBox !== undefined) updateData.poBox = validatedData.poBox || null
    if (validatedData.tinNumber !== undefined) updateData.tinNumber = validatedData.tinNumber || null

    // Bank information
    if (validatedData.bankName !== undefined) updateData.bankName = validatedData.bankName || null
    if (validatedData.bankAccount !== undefined) updateData.bankAccount = validatedData.bankAccount || null
    if (validatedData.bankBranch !== undefined) updateData.bankBranch = validatedData.bankBranch || null

    // Key contacts
    if (validatedData.adminName !== undefined) updateData.adminName = validatedData.adminName || null
    if (validatedData.adminPhone !== undefined) updateData.adminPhone = validatedData.adminPhone || null
    if (validatedData.adminEmail !== undefined) updateData.adminEmail = validatedData.adminEmail || null
    if (validatedData.supportName !== undefined) updateData.supportName = validatedData.supportName || null
    if (validatedData.supportPhone !== undefined) updateData.supportPhone = validatedData.supportPhone || null

    // Report signatories
    if (validatedData.preparedBy !== undefined) updateData.preparedBy = validatedData.preparedBy || null
    if (validatedData.reviewedBy !== undefined) updateData.reviewedBy = validatedData.reviewedBy || null
    if (validatedData.approvedBy !== undefined) updateData.approvedBy = validatedData.approvedBy || null

    // Update company
    const company = await prisma.company.update({
      where: { id: session.user.companyId },
      data: updateData
    })

    // Log the update
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: "COMPANY_PROFILE_UPDATED",
        details: `Updated company profile: ${Object.keys(updateData).join(", ")}`
      }
    })

    return NextResponse.json({
      success: true,
      company
    })

  } catch (error) {
    console.error("Error updating company profile:", error)
    return NextResponse.json(
      { error: "Failed to update company profile" },
      { status: 500 }
    )
  }
}

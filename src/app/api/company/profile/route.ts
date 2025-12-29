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

    const updates = validation.data

    // Convert phones array to JSON string if provided
    if (updates.phones) {
      (updates as any).phones = JSON.stringify(updates.phones)
    }

    // Update company
    const company = await prisma.company.update({
      where: { id: session.user.companyId },
      data: updates
    })

    // Log the update
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: "COMPANY_PROFILE_UPDATED",
        details: `Updated company profile: ${Object.keys(updates).join(", ")}`
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

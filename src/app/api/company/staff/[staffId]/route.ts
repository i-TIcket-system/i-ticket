import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

// Validation schema for updates
const updateStaffSchema = z.object({
  name: z.string().min(2, "Name required").optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  staffRole: z.string()
    .min(2, "Staff role must be at least 2 characters")
    .max(50, "Staff role must not exceed 50 characters")
    .regex(/^[A-Z_]+$/, "Staff role must be uppercase with underscores only (e.g., SUPERVISOR, QUALITY_INSPECTOR)")
    .optional(),
  staffStatus: z.enum(["AVAILABLE", "ON_TRIP", "ON_LEAVE"]).optional(),
  licenseNumber: z.string().optional().or(z.literal("")),
  employeeId: z.string().optional().or(z.literal("")),
})

// DELETE /api/company/staff/[staffId] - Remove staff member
export async function DELETE(
  req: NextRequest,
  { params }: { params: { staffId: string } }
) {
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

    // Get staff member
    const staffMember = await prisma.user.findUnique({
      where: { id: params.staffId },
      select: { id: true, companyId: true, name: true, staffRole: true }
    })

    if (!staffMember) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      )
    }

    // Verify staff belongs to the same company
    if (staffMember.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: "Cannot delete staff from another company" },
        { status: 403 }
      )
    }

    // Prevent deleting yourself
    if (staffMember.id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    // Delete staff member
    await prisma.user.delete({
      where: { id: params.staffId }
    })

    // Log the action
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: "STAFF_MEMBER_REMOVED",
        details: `Removed ${staffMember.staffRole}: ${staffMember.name}`
      }
    })

    return NextResponse.json({
      success: true,
      message: "Staff member removed successfully"
    })

  } catch (error) {
    console.error("Error deleting staff:", error)
    return NextResponse.json(
      { error: "Failed to delete staff member" },
      { status: 500 }
    )
  }
}

// PATCH /api/company/staff/[staffId] - Update staff member
export async function PATCH(
  req: NextRequest,
  { params }: { params: { staffId: string } }
) {
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
    const validation = updateStaffSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    // Get staff member
    const staffMember = await prisma.user.findUnique({
      where: { id: params.staffId },
      select: { id: true, companyId: true }
    })

    if (!staffMember) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      )
    }

    // Verify staff belongs to the same company
    if (staffMember.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: "Cannot update staff from another company" },
        { status: 403 }
      )
    }

    const updates = validation.data

    // Update staff member
    const updatedStaff = await prisma.user.update({
      where: { id: params.staffId },
      data: updates
    })

    // Log the action
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: "STAFF_MEMBER_UPDATED",
        details: `Updated staff member: ${Object.keys(updates).join(", ")}`
      }
    })

    return NextResponse.json({
      success: true,
      staff: updatedStaff
    })

  } catch (error) {
    console.error("Error updating staff:", error)
    return NextResponse.json(
      { error: "Failed to update staff member" },
      { status: 500 }
    )
  }
}

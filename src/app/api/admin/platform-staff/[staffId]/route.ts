import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireSuperAdmin, handleAuthError } from "@/lib/auth-helpers"

/**
 * GET /api/admin/platform-staff/[staffId]
 *
 * Get single platform staff member details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { staffId: string } }
) {
  try {
    await requireSuperAdmin()

    const staff = await prisma.platformStaff.findUnique({
      where: { id: params.staffId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profilePicture: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ staff })
  } catch (error) {
    return handleAuthError(error)
  }
}

/**
 * PATCH /api/admin/platform-staff/[staffId]
 *
 * Update platform staff member
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { staffId: string } }
) {
  try {
    await requireSuperAdmin()

    const body = await request.json()
    const {
      position,
      status,
      reportsTo,
      permissions,
      notes
    } = body

    const staff = await prisma.platformStaff.findUnique({
      where: { id: params.staffId }
    })

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      )
    }

    // Update staff member
    const updated = await prisma.platformStaff.update({
      where: { id: params.staffId },
      data: {
        ...(position && { position }),
        ...(status && { status }),
        ...(reportsTo !== undefined && { reportsTo }),
        ...(permissions && { permissions: JSON.stringify(permissions) }),
        ...(notes !== undefined && { notes })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profilePicture: true
          }
        }
      }
    })

    // Log the update
    await prisma.adminLog.create({
      data: {
        userId: staff.userId,
        action: 'PLATFORM_STAFF_UPDATED',
        details: `Platform staff updated: ${updated.user.name} (${updated.employeeId})`
      }
    })

    return NextResponse.json({
      staff: updated,
      message: "Staff member updated successfully"
    })
  } catch (error) {
    console.error("[Platform Staff] Update error:", error)
    return handleAuthError(error)
  }
}

/**
 * DELETE /api/admin/platform-staff/[staffId]
 *
 * Delete (deactivate) platform staff member
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { staffId: string } }
) {
  try {
    await requireSuperAdmin()

    const staff = await prisma.platformStaff.findUnique({
      where: { id: params.staffId },
      include: { user: true }
    })

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      )
    }

    // Don't actually delete, just set status to TERMINATED
    await prisma.platformStaff.update({
      where: { id: params.staffId },
      data: { status: 'TERMINATED' }
    })

    // Log the termination
    await prisma.adminLog.create({
      data: {
        userId: staff.userId,
        action: 'PLATFORM_STAFF_TERMINATED',
        details: `Platform staff terminated: ${staff.user.name} (${staff.employeeId})`
      }
    })

    return NextResponse.json({
      message: "Staff member terminated successfully"
    })
  } catch (error) {
    console.error("[Platform Staff] Delete error:", error)
    return handleAuthError(error)
  }
}

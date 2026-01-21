import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireSuperAdmin, handleAuthError } from "@/lib/auth-helpers"
import { hash } from "bcryptjs"
import { PLATFORM_STAFF_ROLES, DEPARTMENTS } from "@/lib/platform-staff-roles"

/**
 * GET /api/admin/platform-staff
 *
 * Get all platform staff members
 * Query params:
 * - department: Filter by department
 * - status: Filter by status (ACTIVE, ON_LEAVE, etc.)
 * - search: Search by name, email, or employee ID
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const { searchParams } = new URL(request.url)
    const department = searchParams.get("department")
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const where: any = {}

    if (department) {
      where.department = department
    }

    if (status) {
      where.status = status
    }

    const staff = await prisma.platformStaff.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profilePicture: true,
          }
        }
      },
      orderBy: [
        { department: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Filter by search if provided
    let filteredStaff = staff
    if (search) {
      const searchLower = search.toLowerCase()
      filteredStaff = staff.filter(s =>
        s.user.name?.toLowerCase().includes(searchLower) ||
        s.email.toLowerCase().includes(searchLower) ||
        s.employeeId.toLowerCase().includes(searchLower) ||
        s.position.toLowerCase().includes(searchLower)
      )
    }

    // Get department counts
    const departmentCounts = await prisma.platformStaff.groupBy({
      by: ['department'],
      where: { status: 'ACTIVE' },
      _count: true
    })

    const stats = {
      total: staff.length,
      active: staff.filter(s => s.status === 'ACTIVE').length,
      onLeave: staff.filter(s => s.status === 'ON_LEAVE').length,
      suspended: staff.filter(s => s.status === 'SUSPENDED').length,
      byDepartment: departmentCounts.reduce((acc, curr) => {
        acc[curr.department] = curr._count
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({
      staff: filteredStaff,
      stats
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

/**
 * POST /api/admin/platform-staff
 *
 * Create a new platform staff member
 */
export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const body = await request.json()
    const {
      name,
      phone,
      email,
      role,
      department,
      position,
      employeeId,
      hireDate,
      reportsTo,
      permissions,
      notes
    } = body

    // Validation
    if (!name || !phone || !email || !role || !department || !position || !employeeId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate role exists
    if (!Object.values(PLATFORM_STAFF_ROLES).includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      )
    }

    // Validate department exists
    if (!Object.values(DEPARTMENTS).includes(department)) {
      return NextResponse.json(
        { error: "Invalid department" },
        { status: 400 }
      )
    }

    // Check if employee ID already exists
    const existingEmployeeId = await prisma.platformStaff.findUnique({
      where: { employeeId }
    })

    if (existingEmployeeId) {
      return NextResponse.json(
        { error: "Employee ID already exists" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingEmail = await prisma.platformStaff.findUnique({
      where: { email }
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      )
    }

    // Check if phone already exists in User table
    const existingPhone = await prisma.user.findUnique({
      where: { phone }
    })

    if (existingPhone) {
      return NextResponse.json(
        { error: "Phone number already registered" },
        { status: 400 }
      )
    }

    // Generate temporary password
    const tempPassword = `iTKT${Math.random().toString(36).slice(-8)}`
    const hashedPassword = await hash(tempPassword, 10)

    // Create user and platform staff in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user account
      const user = await tx.user.create({
        data: {
          name,
          phone,
          email,
          password: hashedPassword,
          role: 'SUPER_ADMIN', // Platform staff have SUPER_ADMIN role
          mustChangePassword: true // Force password change on first login
        }
      })

      // Create platform staff profile
      const staff = await tx.platformStaff.create({
        data: {
          userId: user.id,
          role,
          department,
          position,
          employeeId,
          email,
          phone,
          hireDate: hireDate ? new Date(hireDate) : new Date(),
          reportsTo: reportsTo || null,
          permissions: JSON.stringify(permissions || {}),
          notes: notes || null,
          status: 'ACTIVE'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true
            }
          }
        }
      })

      // Log the creation
      await tx.adminLog.create({
        data: {
          userId: user.id,
          action: 'PLATFORM_STAFF_CREATED',
          details: `Platform staff created: ${name} (${employeeId}) - ${role} in ${department}`
        }
      })

      return { staff, tempPassword }
    })

    return NextResponse.json({
      staff: result.staff,
      tempPassword: result.tempPassword,
      message: "Staff member created successfully. Temporary password provided."
    })
  } catch (error) {
    console.error("[Platform Staff] Create error:", error)
    return handleAuthError(error)
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { hash } from "bcryptjs"
import { z } from "zod"
import { checkRateLimit, getClientIdentifier, rateLimitExceeded } from "@/lib/rate-limit"

// Validation schema
const createStaffSchema = z.object({
  name: z.string().min(2, "Name required"),
  phone: z.string().regex(/^09\d{8}$/, "Invalid Ethiopian phone number"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[a-z]/, "Must contain lowercase letter")
    .regex(/[0-9]/, "Must contain number"),
  staffRole: z.enum(["ADMIN", "DRIVER", "CONDUCTOR", "MANUAL_TICKETER"]),
  licenseNumber: z.string().optional().or(z.literal("")),
  employeeId: z.string().optional().or(z.literal("")),
})

// GET /api/company/staff - List all staff members for the company
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

    // Get all staff members for this company
    const staff = await prisma.user.findMany({
      where: {
        companyId: session.user.companyId,
        role: "COMPANY_ADMIN", // All staff have COMPANY_ADMIN role
        staffRole: { not: null } // Only users with a staff role
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        staffRole: true,
        licenseNumber: true,
        employeeId: true,
        createdAt: true,
      },
      orderBy: [
        { staffRole: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({ staff })

  } catch (error) {
    console.error("Error fetching staff:", error)
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    )
  }
}

// POST /api/company/staff - Add new staff member
export async function POST(req: NextRequest) {
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

    // Rate limiting - 10 staff additions per hour
    const clientId = `staff-${session.user.id}`
    if (!checkRateLimit(clientId, { maxRequests: 10, windowMs: 60 * 60 * 1000 })) {
      return rateLimitExceeded(3600)
    }

    const body = await req.json()

    // Validate input
    const validation = createStaffSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, phone, email, password, staffRole, licenseNumber, employeeId } = validation.data

    // Check if phone already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this phone number already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create staff member
    const staffMember = await prisma.user.create({
      data: {
        name,
        phone,
        email: email || null,
        password: hashedPassword,
        role: "COMPANY_ADMIN", // All staff are company admins
        companyId: session.user.companyId,
        staffRole,
        licenseNumber: licenseNumber || null,
        employeeId: employeeId || null,
      }
    })

    // Log the action
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: "STAFF_MEMBER_ADDED",
        details: `Added ${staffRole}: ${name} (${phone})`
      }
    })

    return NextResponse.json({
      success: true,
      staff: {
        id: staffMember.id,
        name: staffMember.name,
        phone: staffMember.phone,
        staffRole: staffMember.staffRole,
      }
    })

  } catch (error) {
    console.error("Error adding staff:", error)
    return NextResponse.json(
      { error: "Failed to add staff member" },
      { status: 500 }
    )
  }
}

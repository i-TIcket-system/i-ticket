import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireSuperAdmin, handleAuthError } from "@/lib/auth-helpers"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAuditLogTask } from "@/lib/clickup"
import bcrypt from "bcryptjs"

const CompanyStatusSchema = z.object({
  companyId: z.string().min(1, "Company ID is required"),
  isActive: z.boolean(),
  reason: z.string()
    .trim()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must not exceed 500 characters"),
})

const CreateCompanySchema = z.object({
  // Company info
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  companyPhone: z.string().regex(/^09\d{8}$/, "Phone must be Ethiopian format (09XXXXXXXX)"),
  companyEmail: z.string().email("Invalid email address"),
  address: z.string().optional(),

  // Bank info (optional)
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankBranch: z.string().optional(),

  // Admin account info
  adminName: z.string().min(2, "Admin name must be at least 2 characters"),
  adminPhone: z.string().regex(/^09\d{8}$/, "Admin phone must be Ethiopian format (09XXXXXXXX)"),
  adminEmail: z.string().email("Invalid admin email address"),
})

// Generate secure temporary password
function generateTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ" // Exclude I, O
  const lower = "abcdefghjkmnpqrstuvwxyz" // Exclude i, l, o
  const numbers = "23456789" // Exclude 0, 1
  const special = "!@#$%^&*"

  const all = upper + lower + numbers + special

  let password = ""
  password += upper[Math.floor(Math.random() * upper.length)]
  password += lower[Math.floor(Math.random() * lower.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Fill remaining 4 characters
  for (let i = 0; i < 4; i++) {
    password += all[Math.floor(Math.random() * all.length)]
  }

  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// Generate unique phone number for default staff (Ethiopian format)
function generateStaffPhone(companyId: string, staffIndex: number): string {
  // Use company ID hash + staff index to generate unique phone number
  const hash = companyId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const uniqueDigits = ((hash + staffIndex) % 100000000).toString().padStart(8, '0')
  return `09${uniqueDigits}`
}

// Generate slug from company name
function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

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
 * Create a new company with admin account
 */
export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin()
    const session = await getServerSession(authOptions)

    // Validate request body
    const body = await request.json()
    const validation = CreateCompanySchema.safeParse(body)

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

    // Check for duplicate company phone
    const existingCompanyByPhone = await prisma.company.findFirst({
      where: {
        phones: {
          contains: companyPhone,
        },
      },
    })

    if (existingCompanyByPhone) {
      return NextResponse.json(
        { error: "A company with this phone number already exists" },
        { status: 400 }
      )
    }

    // Check for duplicate admin phone
    const existingUserByPhone = await prisma.user.findUnique({
      where: { phone: adminPhone },
    })

    if (existingUserByPhone) {
      return NextResponse.json(
        { error: "A user with this admin phone number already exists" },
        { status: 400 }
      )
    }

    // Generate temporary password
    const tempPassword = generateTempPassword()
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // Create company + default staff in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: companyName,
          phones: JSON.stringify([companyPhone]),
          email: companyEmail,
          address: address || null,
          bankName: bankName || null,
          bankAccount: bankAccount || null,
          bankBranch: bankBranch || null,
          adminName,
          adminPhone,
          adminEmail,
        },
      })

      const companySlug = generateSlug(companyName)

      // Create admin user
      const admin = await tx.user.create({
        data: {
          name: adminName,
          phone: adminPhone,
          email: adminEmail,
          password: hashedPassword,
          role: "COMPANY_ADMIN",
          staffRole: "ADMIN",
          companyId: company.id,
          mustChangePassword: true, // Force password change on first login
        },
      })

      // Create default driver staff
      const driverPassword = generateTempPassword()
      const driverPhone = generateStaffPhone(company.id, 1)
      const driver = await tx.user.create({
        data: {
          name: `${companyName} Driver`,
          phone: driverPhone,
          email: `driver@${companySlug}.et`,
          password: await bcrypt.hash(driverPassword, 12),
          role: "COMPANY_ADMIN",
          staffRole: "DRIVER",
          companyId: company.id,
          mustChangePassword: true,
        },
      })

      // Create default manual ticketer staff
      const ticketerPassword = generateTempPassword()
      const ticketerPhone = generateStaffPhone(company.id, 2)
      const ticketer = await tx.user.create({
        data: {
          name: `${companyName} Ticketer`,
          phone: ticketerPhone,
          email: `ticketer@${companySlug}.et`,
          password: await bcrypt.hash(ticketerPassword, 12),
          role: "COMPANY_ADMIN",
          staffRole: "MANUAL_TICKETER",
          companyId: company.id,
          mustChangePassword: true,
        },
      })

      // Create audit log
      await tx.adminLog.create({
        data: {
          userId: session!.user.id,
          action: "COMPANY_CREATED",
          companyId: company.id,
          details: JSON.stringify({
            companyId: company.id,
            companyName: company.name,
            companyPhone,
            adminName,
            adminPhone,
            adminEmail,
            defaultStaffCreated: 3,
            createdBy: session!.user.name,
            createdByEmail: session!.user.email,
            timestamp: new Date().toISOString(),
          }),
        },
      })

      return { company, admin, driver, ticketer, driverPassword, ticketerPassword, driverPhone, ticketerPhone }
    })

    // Create ClickUp audit task (non-blocking)
    createAuditLogTask({
      action: "COMPANY_CREATED",
      userId: session!.user.id,
      userName: session!.user.name,
      companyId: result.company.id,
      companyName: result.company.name,
      details: `New company registered: ${companyName}. Admin: ${adminName} (${adminPhone})`,
    })

    return NextResponse.json({
      success: true,
      message: "Company created successfully with 3 default staff members",
      company: result.company,
      staff: [
        {
          role: "Admin",
          name: result.admin.name,
          phone: result.admin.phone,
          email: result.admin.email,
          tempPassword: tempPassword,
        },
        {
          role: "Driver",
          name: result.driver.name,
          phone: result.driverPhone,
          email: result.driver.email,
          tempPassword: result.driverPassword,
        },
        {
          role: "Manual Ticketer",
          name: result.ticketer.name,
          phone: result.ticketerPhone,
          email: result.ticketer.email,
          tempPassword: result.ticketerPassword,
        },
      ],
    })
  } catch (error) {
    console.error("Company creation error:", error)
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

    // Create ClickUp audit task (non-blocking)
    createAuditLogTask({
      action: isActive ? "COMPANY_ACTIVATED" : "COMPANY_DEACTIVATED",
      userId: session!.user.id,
      userName: session!.user.name,
      companyId,
      companyName: existingCompany.name,
      details: reason,
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

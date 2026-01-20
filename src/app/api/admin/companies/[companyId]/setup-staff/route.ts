import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireSuperAdmin, handleAuthError } from "@/lib/auth-helpers"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"

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
  // Use company ID hash + staff index + timestamp to ensure uniqueness
  const hash = companyId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const timestamp = Date.now() % 1000
  const uniqueDigits = ((hash + staffIndex + timestamp) % 100000000).toString().padStart(8, '0')
  return `09${uniqueDigits}`
}

// Generate slug from company name
function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/**
 * Setup default staff for existing company (Admin, Driver, Manual Ticketer)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    await requireSuperAdmin()
    const session = await getServerSession(authOptions)

    const companyId = params.companyId

    // Get company details
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: { users: true }
        }
      }
    })

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      )
    }

    // Check if company already has staff
    if (company._count.users > 0) {
      return NextResponse.json(
        { error: "Company already has staff members. Cannot auto-setup." },
        { status: 400 }
      )
    }

    const companySlug = generateSlug(company.name)

    // Create default staff in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create admin staff
      const adminPassword = generateTempPassword()
      const adminPhone = generateStaffPhone(company.id, 0)
      const admin = await tx.user.create({
        data: {
          name: `${company.name} Admin`,
          phone: adminPhone,
          email: `admin@${companySlug}.et`,
          password: await bcrypt.hash(adminPassword, 12),
          role: "COMPANY_ADMIN",
          staffRole: "ADMIN",
          companyId: company.id,
          mustChangePassword: true,
        },
      })

      // Create driver staff
      const driverPassword = generateTempPassword()
      const driverPhone = generateStaffPhone(company.id, 1)
      const driver = await tx.user.create({
        data: {
          name: `${company.name} Driver`,
          phone: driverPhone,
          email: `driver@${companySlug}.et`,
          password: await bcrypt.hash(driverPassword, 12),
          role: "COMPANY_ADMIN",
          staffRole: "DRIVER",
          companyId: company.id,
          mustChangePassword: true,
        },
      })

      // Create manual ticketer staff
      const ticketerPassword = generateTempPassword()
      const ticketerPhone = generateStaffPhone(company.id, 2)
      const ticketer = await tx.user.create({
        data: {
          name: `${company.name} Ticketer`,
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
          action: "COMPANY_STAFF_SETUP",
          companyId: company.id,
          details: JSON.stringify({
            companyId: company.id,
            companyName: company.name,
            staffCreated: 3,
            performedBy: session!.user.name,
            performedByEmail: session!.user.email,
            timestamp: new Date().toISOString(),
          }),
        },
      })

      return {
        admin,
        driver,
        ticketer,
        adminPassword,
        driverPassword,
        ticketerPassword,
        adminPhone,
        driverPhone,
        ticketerPhone,
      }
    })

    return NextResponse.json({
      success: true,
      message: "Default staff created successfully",
      staff: [
        {
          role: "Admin",
          name: result.admin.name,
          phone: result.adminPhone,
          email: result.admin.email,
          tempPassword: result.adminPassword,
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
    console.error("Staff setup error:", error)
    return handleAuthError(error)
  }
}

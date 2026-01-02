import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { hash } from "bcryptjs"
import prisma from "@/lib/db"
import { requireSuperAdmin, handleAuthError } from "@/lib/auth-helpers"
import { generateUniqueReferralCode, generateSalesPersonQR } from "@/lib/sales/referral-utils"

const createSalesPersonSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^09\d{8}$/, "Invalid phone format (09XXXXXXXX)"),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
})

// GET /api/admin/sales-persons - List all sales persons with stats
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const salesPersons = await prisma.salesPerson.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            qrScans: true,
            referrals: true,
            commissions: true,
          }
        }
      }
    })

    // Get aggregated stats for each sales person
    const salesPersonsWithStats = await Promise.all(
      salesPersons.map(async (sp) => {
        // Get unique scans count
        const uniqueScans = await prisma.salesQrScan.groupBy({
          by: ['visitorHash'],
          where: { salesPersonId: sp.id },
          _count: true,
        })

        // Get commission totals
        const commissionStats = await prisma.salesCommission.aggregate({
          where: { salesPersonId: sp.id },
          _sum: {
            salesCommission: true,
          },
          _count: true,
        })

        const pendingCommissions = await prisma.salesCommission.aggregate({
          where: {
            salesPersonId: sp.id,
            status: 'PENDING',
          },
          _sum: {
            salesCommission: true,
          },
        })

        return {
          id: sp.id,
          name: sp.name,
          phone: sp.phone,
          email: sp.email,
          referralCode: sp.referralCode,
          status: sp.status,
          createdAt: sp.createdAt,
          lastLoginAt: sp.lastLoginAt,
          stats: {
            totalScans: sp._count.qrScans,
            uniqueVisitors: uniqueScans.length,
            conversions: sp._count.referrals,
            conversionRate: sp._count.qrScans > 0
              ? Math.round((sp._count.referrals / uniqueScans.length) * 100)
              : 0,
            totalCommission: commissionStats._sum.salesCommission || 0,
            pendingCommission: pendingCommissions._sum.salesCommission || 0,
            bookingsGenerated: commissionStats._count || 0,
          }
        }
      })
    )

    return NextResponse.json({ salesPersons: salesPersonsWithStats })
  } catch (error) {
    return handleAuthError(error)
  }
}

// POST /api/admin/sales-persons - Create new sales person
export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const body = await request.json()
    const data = createSalesPersonSchema.parse(body)

    // Check if phone already exists
    const existingPhone = await prisma.salesPerson.findUnique({
      where: { phone: data.phone }
    })

    if (existingPhone) {
      return NextResponse.json(
        { error: "A sales person with this phone number already exists" },
        { status: 409 }
      )
    }

    // Check if phone exists in User table too
    const existingUser = await prisma.user.findUnique({
      where: { phone: data.phone }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "This phone number is already registered as a user" },
        { status: 409 }
      )
    }

    // Generate unique referral code
    const referralCode = await generateUniqueReferralCode(data.name)

    // Hash password
    const hashedPassword = await hash(data.password, 12)

    // Create sales person
    const salesPerson = await prisma.salesPerson.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        password: hashedPassword,
        referralCode,
        status: 'ACTIVE',
      }
    })

    // Generate QR code
    const qrCodeUrl = await generateSalesPersonQR(referralCode)

    // Log admin action
    await prisma.adminLog.create({
      data: {
        userId: salesPerson.id,
        action: 'SALES_PERSON_CREATED',
        details: JSON.stringify({
          salesPersonId: salesPerson.id,
          name: salesPerson.name,
          phone: salesPerson.phone,
          referralCode,
        })
      }
    })

    return NextResponse.json({
      success: true,
      salesPerson: {
        id: salesPerson.id,
        name: salesPerson.name,
        phone: salesPerson.phone,
        email: salesPerson.email,
        referralCode: salesPerson.referralCode,
        status: salesPerson.status,
        createdAt: salesPerson.createdAt,
        qrCodeUrl,
      }
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }
    return handleAuthError(error)
  }
}

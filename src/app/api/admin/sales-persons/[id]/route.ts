import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { hash } from "bcryptjs"
import prisma from "@/lib/db"
import { requireSuperAdmin, handleAuthError } from "@/lib/auth-helpers"
import { generateSalesPersonQR, getReferralUrl } from "@/lib/sales/referral-utils"

const updateSalesPersonSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

// GET /api/admin/sales-persons/[id] - Get single sales person details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin()
    const { id } = await params

    const salesPerson = await prisma.salesPerson.findUnique({
      where: { id },
      include: {
        referrals: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                createdAt: true,
              }
            }
          },
          orderBy: { attributedAt: 'desc' },
          take: 50,
        },
        commissions: {
          include: {
            booking: {
              include: {
                trip: {
                  select: {
                    origin: true,
                    destination: true,
                    departureTime: true,
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        _count: {
          select: {
            qrScans: true,
            referrals: true,
            commissions: true,
          }
        }
      }
    })

    if (!salesPerson) {
      return NextResponse.json(
        { error: "Sales person not found" },
        { status: 404 }
      )
    }

    // Get unique scans
    const uniqueScans = await prisma.salesQrScan.groupBy({
      by: ['visitorHash'],
      where: { salesPersonId: id },
    })

    // Get commission aggregates
    const totalCommission = await prisma.salesCommission.aggregate({
      where: { salesPersonId: id },
      _sum: { salesCommission: true },
    })

    const pendingCommission = await prisma.salesCommission.aggregate({
      where: { salesPersonId: id, status: 'PENDING' },
      _sum: { salesCommission: true },
    })

    const paidCommission = await prisma.salesCommission.aggregate({
      where: { salesPersonId: id, status: 'PAID' },
      _sum: { salesCommission: true },
    })

    // Get recent scans breakdown
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const last7Days = new Date(today)
    last7Days.setDate(last7Days.getDate() - 7)
    const last30Days = new Date(today)
    last30Days.setDate(last30Days.getDate() - 30)

    const [todayScans, weekScans, monthScans] = await Promise.all([
      prisma.salesQrScan.count({ where: { salesPersonId: id, createdAt: { gte: today } } }),
      prisma.salesQrScan.count({ where: { salesPersonId: id, createdAt: { gte: last7Days } } }),
      prisma.salesQrScan.count({ where: { salesPersonId: id, createdAt: { gte: last30Days } } }),
    ])

    // Generate QR code
    const qrCodeUrl = await generateSalesPersonQR(salesPerson.referralCode)
    const referralUrl = getReferralUrl(salesPerson.referralCode)

    return NextResponse.json({
      salesPerson: {
        id: salesPerson.id,
        name: salesPerson.name,
        phone: salesPerson.phone,
        email: salesPerson.email,
        referralCode: salesPerson.referralCode,
        referralUrl,
        qrCodeUrl,
        status: salesPerson.status,
        createdAt: salesPerson.createdAt,
        lastLoginAt: salesPerson.lastLoginAt,
        stats: {
          totalScans: salesPerson._count.qrScans,
          uniqueVisitors: uniqueScans.length,
          conversions: salesPerson._count.referrals,
          conversionRate: uniqueScans.length > 0
            ? Math.round((salesPerson._count.referrals / uniqueScans.length) * 100)
            : 0,
          totalCommission: totalCommission._sum.salesCommission || 0,
          pendingCommission: pendingCommission._sum.salesCommission || 0,
          paidCommission: paidCommission._sum.salesCommission || 0,
          bookingsGenerated: salesPerson._count.commissions,
          scansToday: todayScans,
          scansThisWeek: weekScans,
          scansThisMonth: monthScans,
        },
        referrals: salesPerson.referrals.map(r => ({
          userId: r.user.id,
          userName: r.user.name,
          userPhone: r.user.phone,
          userCreatedAt: r.user.createdAt,
          attributedAt: r.attributedAt,
        })),
        recentCommissions: salesPerson.commissions.map(c => ({
          id: c.id,
          bookingId: c.bookingId,
          trip: `${c.booking.trip.origin} → ${c.booking.trip.destination}`,
          tripDate: c.booking.trip.departureTime,
          ticketAmount: c.ticketAmount,
          salesCommission: c.salesCommission,
          status: c.status,
          createdAt: c.createdAt,
        })),
      }
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

// PATCH /api/admin/sales-persons/[id] - Update sales person
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin()
    const { id } = await params

    const body = await request.json()
    const data = updateSalesPersonSchema.parse(body)

    // Check if sales person exists
    const existing = await prisma.salesPerson.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Sales person not found" },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email || null
    if (data.status) updateData.status = data.status
    if (data.password) updateData.password = await hash(data.password, 12)

    const salesPerson = await prisma.salesPerson.update({
      where: { id },
      data: updateData,
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        userId: id,
        action: 'SALES_PERSON_UPDATED',
        details: JSON.stringify({
          salesPersonId: id,
          changes: Object.keys(updateData).filter(k => k !== 'password'),
          statusChange: data.status ? `${existing.status} → ${data.status}` : undefined,
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
      }
    })
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

// DELETE /api/admin/sales-persons/[id] - Deactivate sales person
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin()
    const { id } = await params

    const existing = await prisma.salesPerson.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Sales person not found" },
        { status: 404 }
      )
    }

    // Soft delete - set status to INACTIVE
    await prisma.salesPerson.update({
      where: { id },
      data: { status: 'INACTIVE' }
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        userId: id,
        action: 'SALES_PERSON_DEACTIVATED',
        details: JSON.stringify({
          salesPersonId: id,
          name: existing.name,
          phone: existing.phone,
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: "Sales person deactivated"
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

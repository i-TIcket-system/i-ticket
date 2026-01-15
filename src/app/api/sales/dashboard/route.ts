import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireSalesPerson, handleAuthError } from "@/lib/auth-helpers"
import { generateSalesPersonQR, getReferralUrl } from "@/lib/sales/referral-utils"

// GET /api/sales/dashboard - Get sales person's own dashboard stats
export async function GET(request: NextRequest) {
  try {
    const session = await requireSalesPerson()
    const salesPersonId = session.user.id

    const salesPerson = await prisma.salesPerson.findUnique({
      where: { id: salesPersonId },
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

    if (!salesPerson) {
      return NextResponse.json(
        { error: "Sales person not found" },
        { status: 404 }
      )
    }

    // Get unique scans
    const uniqueScans = await prisma.salesQrScan.groupBy({
      by: ['visitorHash'],
      where: { salesPersonId },
    })

    // Get commission aggregates (both direct and team commissions)
    const [totalCommission, pendingCommission, paidCommission, directCommissions, teamCommissions] = await Promise.all([
      prisma.salesCommission.aggregate({
        where: { salesPersonId },
        _sum: { salesCommission: true },
      }),
      prisma.salesCommission.aggregate({
        where: { salesPersonId, status: 'PENDING' },
        _sum: { salesCommission: true },
      }),
      prisma.salesCommission.aggregate({
        where: { salesPersonId, status: 'PAID' },
        _sum: { salesCommission: true },
      }),
      // Direct commissions from customer referrals (70% or 100%)
      prisma.salesCommission.aggregate({
        where: { salesPersonId, isRecruiterCommission: false },
        _sum: { salesCommission: true },
      }),
      // Team commissions (30% from recruited sales persons)
      prisma.salesCommission.aggregate({
        where: { salesPersonId, isRecruiterCommission: true },
        _sum: { salesCommission: true },
      }),
    ])

    // Get team stats
    const recruitsCount = await prisma.salesPerson.count({
      where: { recruiterId: salesPersonId }
    })

    // Get time-based stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const last7Days = new Date(today)
    last7Days.setDate(last7Days.getDate() - 7)
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

    const [scansToday, scansThisWeek, scansThisMonth, conversionsThisWeek, commissionThisMonth, commissionLastMonth] = await Promise.all([
      prisma.salesQrScan.count({ where: { salesPersonId, createdAt: { gte: today } } }),
      prisma.salesQrScan.count({ where: { salesPersonId, createdAt: { gte: last7Days } } }),
      prisma.salesQrScan.count({ where: { salesPersonId, createdAt: { gte: thisMonth } } }),
      prisma.salesReferral.count({ where: { salesPersonId, attributedAt: { gte: last7Days } } }),
      prisma.salesCommission.aggregate({
        where: { salesPersonId, createdAt: { gte: thisMonth } },
        _sum: { salesCommission: true },
      }),
      prisma.salesCommission.aggregate({
        where: { salesPersonId, createdAt: { gte: lastMonth, lt: thisMonth } },
        _sum: { salesCommission: true },
      }),
    ])

    // Get recent referrals
    const recentReferrals = await prisma.salesReferral.findMany({
      where: { salesPersonId },
      include: {
        user: {
          select: { id: true, name: true, phone: true, createdAt: true }
        }
      },
      orderBy: { attributedAt: 'desc' },
      take: 5,
    })

    // Get recent commissions
    const recentCommissions = await prisma.salesCommission.findMany({
      where: { salesPersonId },
      include: {
        booking: {
          include: {
            trip: {
              select: { origin: true, destination: true, departureTime: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    // Generate QR code
    const qrCodeUrl = await generateSalesPersonQR(salesPerson.referralCode)
    const referralUrl = getReferralUrl(salesPerson.referralCode)

    return NextResponse.json({
      salesPerson: {
        id: salesPerson.id,
        name: salesPerson.name,
        referralCode: salesPerson.referralCode,
        referralUrl,
        qrCodeUrl,
        createdAt: salesPerson.createdAt,
      },
      stats: {
        totalScans: salesPerson._count.qrScans,
        uniqueVisitors: uniqueScans.length,
        totalConversions: salesPerson._count.referrals,
        conversionRate: uniqueScans.length > 0
          ? Math.round((salesPerson._count.referrals / uniqueScans.length) * 100)
          : 0,
        commission: {
          total: totalCommission._sum.salesCommission || 0,
          pending: pendingCommission._sum.salesCommission || 0,
          paid: paidCommission._sum.salesCommission || 0,
          thisMonth: commissionThisMonth._sum.salesCommission || 0,
          lastMonth: commissionLastMonth._sum.salesCommission || 0,
          direct: directCommissions._sum.salesCommission || 0, // From customer referrals
          team: teamCommissions._sum.salesCommission || 0, // From recruited team (30%)
        },
        team: {
          recruitsCount,
          teamEarnings: teamCommissions._sum.salesCommission || 0,
        },
        recentActivity: {
          scansToday,
          scansThisWeek,
          scansThisMonth,
          conversionsThisWeek,
          bookingsGenerated: salesPerson._count.commissions,
        },
      },
      recentReferrals: recentReferrals.map(r => ({
        userId: r.user.id,
        userName: r.user.name,
        userPhone: r.user.phone,
        attributedAt: r.attributedAt,
      })),
      recentCommissions: recentCommissions.map(c => ({
        id: c.id,
        trip: `${c.booking.trip.origin} → ${c.booking.trip.destination}`,
        tripDate: c.booking.trip.departureTime,
        ticketAmount: c.ticketAmount,
        salesCommission: c.salesCommission,
        status: c.status,
        createdAt: c.createdAt,
      })),
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

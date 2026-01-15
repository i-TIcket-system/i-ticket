import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireSalesPerson, handleAuthError } from "@/lib/auth-helpers"

// GET /api/sales/commissions - Get sales person's commission history
export async function GET(request: NextRequest) {
  try {
    const session = await requireSalesPerson()
    const salesPersonId = session.user.id

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // PENDING, PAID, or null for all

    // Validate pagination params to prevent NaN issues
    const parsedPage = parseInt(searchParams.get('page') || '1')
    const parsedLimit = parseInt(searchParams.get('limit') || '20')
    const page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage
    const limit = isNaN(parsedLimit) || parsedLimit < 1 ? 20 : Math.min(parsedLimit, 100)

    const where: any = { salesPersonId }
    if (status) {
      where.status = status
    }

    const [commissions, total] = await Promise.all([
      prisma.salesCommission.findMany({
        where,
        include: {
          booking: {
            include: {
              trip: {
                select: {
                  origin: true,
                  destination: true,
                  departureTime: true,
                  company: {
                    select: { name: true }
                  }
                }
              },
              user: {
                select: { name: true, phone: true }
              }
            }
          },
          payout: {
            select: {
              id: true,
              paymentMethod: true,
              createdAt: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.salesCommission.count({ where }),
    ])

    // Get summary stats
    const [pendingSum, paidSum] = await Promise.all([
      prisma.salesCommission.aggregate({
        where: { salesPersonId, status: 'PENDING' },
        _sum: { salesCommission: true },
        _count: true,
      }),
      prisma.salesCommission.aggregate({
        where: { salesPersonId, status: 'PAID' },
        _sum: { salesCommission: true },
        _count: true,
      }),
    ])

    return NextResponse.json({
      commissions: commissions.map(c => ({
        id: c.id,
        bookingId: c.bookingId,
        trip: `${c.booking.trip.origin} → ${c.booking.trip.destination}`,
        tripDate: c.booking.trip.departureTime,
        companyName: c.booking.trip.company.name,
        customerName: c.booking.user.name,
        customerPhone: c.booking.user.phone,
        ticketAmount: c.ticketAmount,
        platformCommission: c.platformCommission,
        salesCommission: c.salesCommission,
        status: c.status,
        paidAt: c.paidAt,
        payout: c.payout ? {
          id: c.payout.id,
          paymentMethod: c.payout.paymentMethod,
          paidAt: c.payout.createdAt,
        } : null,
        createdAt: c.createdAt,
      })),
      summary: {
        pending: {
          count: pendingSum._count || 0,
          amount: pendingSum._sum.salesCommission || 0,
        },
        paid: {
          count: paidSum._count || 0,
          amount: paidSum._sum.salesCommission || 0,
        },
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

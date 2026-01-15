import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireSalesPerson, handleAuthError } from "@/lib/auth-helpers"

// GET /api/sales/referrals - Get sales person's referred users
export async function GET(request: NextRequest) {
  try {
    const session = await requireSalesPerson()
    const salesPersonId = session.user.id

    const { searchParams } = new URL(request.url)

    // Validate pagination params to prevent NaN issues
    const parsedPage = parseInt(searchParams.get('page') || '1')
    const parsedLimit = parseInt(searchParams.get('limit') || '20')
    const page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage
    const limit = isNaN(parsedLimit) || parsedLimit < 1 ? 20 : Math.min(parsedLimit, 100)

    const [referrals, total] = await Promise.all([
      prisma.salesReferral.findMany({
        where: { salesPersonId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              _count: {
                select: {
                  bookings: {
                    where: { status: 'CONFIRMED' }
                  }
                }
              }
            }
          }
        },
        orderBy: { attributedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.salesReferral.count({ where: { salesPersonId } }),
    ])

    // Get total bookings from referred users
    const referredUserIds = referrals.map(r => r.userId)
    const totalBookings = referredUserIds.length > 0
      ? await prisma.booking.count({
          where: {
            userId: { in: referredUserIds },
            status: 'CONFIRMED'
          }
        })
      : 0

    // Count active referrals (users who have made at least one booking)
    const activeReferrals = referrals.filter(r => r.user._count.bookings > 0).length

    return NextResponse.json({
      referrals: referrals.map(r => ({
        id: r.id,
        userId: r.user.id,
        userName: r.user.name,
        userPhone: r.user.phone,
        userEmail: r.user.email,
        bookingsCount: r.user._count.bookings,
        totalSpent: 0, // Can be computed if needed
        attributedAt: r.attributedAt,
      })),
      summary: {
        totalReferrals: total,
        activeReferrals,
        totalBookings,
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

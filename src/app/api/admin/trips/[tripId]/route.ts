import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

/**
 * GET /api/admin/trips/[tripId]
 * Super Admin - View detailed trip information
 *
 * CRITICAL: Logs access with companyId = NULL (Super Admin audit only)
 * Companies will NOT see these logs in their audit view
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { tripId } = params

    // Fetch trip with all details
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        vehicle: {
          select: {
            plateNumber: true,
            sideNumber: true,
            busType: true,
            currentOdometer: true,
          },
        },
        driver: {
          select: {
            name: true,
            phone: true,
          },
        },
        conductor: {
          select: {
            name: true,
            phone: true,
          },
        },
        manualTicketer: {
          select: {
            name: true,
            phone: true,
          },
        },
        tripLog: {
          select: {
            startOdometer: true,
            endOdometer: true,
            startFuel: true,
            endFuel: true,
            distanceTraveled: true,
            fuelConsumed: true,
            fuelEfficiency: true,
            startedByName: true,
            endedByName: true,
          },
        },
        bookings: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
            passengers: {
              select: {
                name: true,
                phone: true,
                seatNumber: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // CRITICAL: Log Super Admin access with companyId = NULL
    // This ensures companies CANNOT see this log in their audit view
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: 'SUPER_ADMIN_VIEW_TRIP',
        companyId: null, // 🚫 NULL = Companies cannot see this log
        tripId: trip.id,
        details: JSON.stringify({
          superAdminName: session.user.name,
          viewedCompanyId: trip.companyId,
          viewedCompanyName: trip.company.name,
          route: `${trip.origin} → ${trip.destination}`,
          accessedAt: new Date().toISOString(),
          reason: 'Trip detail view', // Can add UI for custom reasons later
        }),
      },
    })

    return NextResponse.json({
      trip,
      auditLogged: true,
    })
  } catch (error) {
    console.error('Error fetching trip details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trip details' },
      { status: 500 }
    )
  }
}

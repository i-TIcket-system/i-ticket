import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { sortTripsByStatusAndTime } from '@/lib/sort-trips'

/**
 * GET /api/admin/trips
 * Super Admin - Get all trips from all companies with filtering/sorting
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    const skip = (page - 1) * limit

    // Filters (with input length validation to prevent ReDoS)
    const companyId = searchParams.get('companyId') || undefined
    const status = searchParams.get('status') || undefined
    const origin = searchParams.get('origin')?.trim().slice(0, 100) || undefined
    const destination = searchParams.get('destination')?.trim().slice(0, 100) || undefined
    const dateFrom = searchParams.get('dateFrom') || undefined
    const dateTo = searchParams.get('dateTo') || undefined
    const search = searchParams.get('search')?.trim().slice(0, 100) || undefined

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'departureTime'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'

    // Build where clause
    const where: any = {}

    if (companyId) {
      where.companyId = companyId
    }

    if (status) {
      where.status = status
    }

    if (origin) {
      where.origin = { contains: origin, mode: 'insensitive' }
    }

    if (destination) {
      where.destination = { contains: destination, mode: 'insensitive' }
    }

    if (dateFrom || dateTo) {
      where.departureTime = {}
      if (dateFrom) {
        where.departureTime.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.departureTime.lte = new Date(dateTo)
      }
    }

    if (search) {
      where.OR = [
        { origin: { contains: search, mode: 'insensitive' } },
        { destination: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Build orderBy
    const orderBy: any = {}
    if (sortBy === 'company') {
      orderBy.company = { name: sortOrder }
    } else if (sortBy === 'availableSlots') {
      orderBy.availableSlots = sortOrder
    } else if (sortBy === 'totalSlots') {
      orderBy.totalSlots = sortOrder
    } else if (sortBy === 'price') {
      orderBy.price = sortOrder
    } else {
      orderBy[sortBy] = sortOrder
    }

    // Fetch trips with pagination
    const [trips, totalCount] = await Promise.all([
      prisma.trip.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              plateNumber: true,
              sideNumber: true,
              busType: true,
            },
          },
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          conductor: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          _count: {
            select: {
              bookings: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.trip.count({ where }),
    ])

    const totalPages = Math.ceil(totalCount / limit)

    // If sorting by departureTime (default), apply status priority sorting
    // Otherwise, respect custom sorting
    const finalTrips = sortBy === 'departureTime'
      ? sortTripsByStatusAndTime(trips, sortOrder)
      : trips

    return NextResponse.json({
      trips: finalTrips,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching all trips:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    )
  }
}

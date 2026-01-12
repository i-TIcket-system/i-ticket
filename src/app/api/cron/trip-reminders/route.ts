import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { formatDate, formatCurrency } from '@/lib/utils'

/**
 * Trip Reminder Cron Job
 *
 * Runs every hour to send reminder notifications to passengers:
 * 1. Day before (20-28 hours before departure)
 * 2. Hours before (2-4 hours before departure)
 *
 * Authentication: Requires CRON_SECRET header
 *
 * Usage (Vercel Cron):
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/trip-reminders",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 *
 * Manual trigger:
 * curl -X POST http://localhost:3000/api/cron/trip-reminders \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Authentication
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.CRON_SECRET || 'dev-secret-only-for-testing'

    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing CRON_SECRET' },
        { status: 401 }
      )
    }

    console.log('[CRON] Starting trip reminders job...')

    const now = new Date()

    // Calculate time windows
    const dayBeforeStart = new Date(now.getTime() + 20 * 60 * 60 * 1000) // 20 hours from now
    const dayBeforeEnd = new Date(now.getTime() + 28 * 60 * 60 * 1000)   // 28 hours from now
    const hoursBeforeStart = new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2 hours from now
    const hoursBeforeEnd = new Date(now.getTime() + 4 * 60 * 60 * 1000)   // 4 hours from now

    let dayBeforeCount = 0
    let hoursBeforeCount = 0
    let totalNotifications = 0

    // Step 1: Day before reminders (20-28 hours window)
    console.log('[CRON] Step 1: Sending day-before reminders...')
    const dayBeforeTrips = await prisma.trip.findMany({
      where: {
        departureTime: {
          gte: dayBeforeStart,
          lte: dayBeforeEnd,
        },
        status: {
          in: ['SCHEDULED', 'BOARDING'],
        },
        isActive: true,
      },
      include: {
        company: {
          select: {
            name: true,
          },
        },
        bookings: {
          where: {
            status: 'PAID',
          },
          select: {
            id: true,
            userId: true,
            passengers: {
              select: {
                name: true,
                seatNumber: true,
              },
            },
          },
        },
      },
    })

    for (const trip of dayBeforeTrips) {
      for (const booking of trip.bookings) {
        // Check if we already sent a day-before reminder for this booking
        const existingNotification = await prisma.notification.findFirst({
          where: {
            recipientId: booking.userId,
            bookingId: booking.id,
            type: 'TRIP_REMINDER_DAY_BEFORE',
          },
        })

        if (existingNotification) {
          continue // Already sent
        }

        // Create day-before reminder notification
        const seatNumbers = booking.passengers
          .map((p) => p.seatNumber)
          .filter((s) => s !== null)
          .join(', ')

        const passengerNames = booking.passengers
          .map((p) => p.name)
          .join(', ')

        await prisma.notification.create({
          data: {
            recipientId: booking.userId,
            recipientType: 'USER',
            type: 'TRIP_REMINDER_DAY_BEFORE',
            title: '🚌 Trip Tomorrow - Get Ready!',
            message: `Your ${trip.company.name} bus from ${trip.origin} to ${trip.destination} departs tomorrow at ${formatDate(trip.departureTime)}. Passengers: ${passengerNames}. Seat(s): ${seatNumbers}. Have a safe journey!`,
            tripId: trip.id,
            bookingId: booking.id,
            companyId: trip.companyId,
            metadata: JSON.stringify({
              route: `${trip.origin} → ${trip.destination}`,
              departureTime: trip.departureTime,
              seatNumbers,
              passengerNames,
            }),
            priority: 3, // High priority
          },
        })

        totalNotifications++
        dayBeforeCount++
      }
    }

    console.log(`[CRON] Sent ${dayBeforeCount} day-before reminders for ${dayBeforeTrips.length} trips`)

    // Step 2: Hours before reminders (2-4 hours window)
    console.log('[CRON] Step 2: Sending hours-before reminders...')
    const hoursBeforeTrips = await prisma.trip.findMany({
      where: {
        departureTime: {
          gte: hoursBeforeStart,
          lte: hoursBeforeEnd,
        },
        status: {
          in: ['SCHEDULED', 'BOARDING'],
        },
        isActive: true,
      },
      include: {
        company: {
          select: {
            name: true,
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
        vehicle: {
          select: {
            plateNumber: true,
            sideNumber: true,
          },
        },
        bookings: {
          where: {
            status: 'PAID',
          },
          select: {
            id: true,
            userId: true,
            passengers: {
              select: {
                name: true,
                seatNumber: true,
                pickupLocation: true,
              },
            },
          },
        },
      },
    })

    for (const trip of hoursBeforeTrips) {
      for (const booking of trip.bookings) {
        // Check if we already sent a hours-before reminder for this booking
        const existingNotification = await prisma.notification.findFirst({
          where: {
            recipientId: booking.userId,
            bookingId: booking.id,
            type: 'TRIP_REMINDER_HOURS_BEFORE',
          },
        })

        if (existingNotification) {
          continue // Already sent
        }

        // Create hours-before reminder notification
        const seatNumbers = booking.passengers
          .map((p) => p.seatNumber)
          .filter((s) => s !== null)
          .join(', ')

        const passengerNames = booking.passengers
          .map((p) => p.name)
          .join(', ')

        const pickupLocation = booking.passengers[0]?.pickupLocation || 'Standard pickup point'

        // Calculate hours until departure
        const hoursUntil = Math.round((new Date(trip.departureTime).getTime() - now.getTime()) / (1000 * 60 * 60))

        let vehicleInfo = ''
        if (trip.vehicle) {
          vehicleInfo = ` Bus: ${trip.vehicle.plateNumber}${trip.vehicle.sideNumber ? ` (${trip.vehicle.sideNumber})` : ''}.`
        }

        let driverInfo = ''
        if (trip.driver) {
          driverInfo = ` Driver: ${trip.driver.name} (${trip.driver.phone}).`
        }

        await prisma.notification.create({
          data: {
            recipientId: booking.userId,
            recipientType: 'USER',
            type: 'TRIP_REMINDER_HOURS_BEFORE',
            title: `⏰ Departing in ${hoursUntil} hours!`,
            message: `Your ${trip.company.name} bus from ${trip.origin} to ${trip.destination} departs in about ${hoursUntil} hours. Pickup: ${pickupLocation}. Seat(s): ${seatNumbers}.${vehicleInfo}${driverInfo} Please arrive 30 minutes early.`,
            tripId: trip.id,
            bookingId: booking.id,
            companyId: trip.companyId,
            metadata: JSON.stringify({
              route: `${trip.origin} → ${trip.destination}`,
              departureTime: trip.departureTime,
              seatNumbers,
              passengerNames,
              pickupLocation,
              vehiclePlate: trip.vehicle?.plateNumber,
              driverName: trip.driver?.name,
              hoursUntil,
            }),
            priority: 4, // Urgent priority
          },
        })

        totalNotifications++
        hoursBeforeCount++
      }
    }

    console.log(`[CRON] Sent ${hoursBeforeCount} hours-before reminders for ${hoursBeforeTrips.length} trips`)

    const duration = Date.now() - startTime
    const summary = {
      success: true,
      duration: `${duration}ms`,
      dayBeforeReminders: {
        trips: dayBeforeTrips.length,
        notifications: dayBeforeCount,
      },
      hoursBeforeReminders: {
        trips: hoursBeforeTrips.length,
        notifications: hoursBeforeCount,
      },
      totalNotifications,
    }

    console.log('[CRON] Trip reminders job completed:', summary)
    return NextResponse.json(summary)
  } catch (error) {
    console.error('[CRON] Trip reminders error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cleanupExpiredSessions } from "@/lib/sms/session";
import { getSmsGateway } from "@/lib/sms/gateway";

// GET /api/cron/cleanup
//
// Cleanup cron job - runs periodically to:
// 1. Delete expired SMS sessions
// 2. Handle payment timeouts
// 3. General cleanup tasks
//
// Should be configured to run every 5-15 minutes via Vercel Cron or external scheduler
// Example Vercel cron config (vercel.json):
// { "crons": [{ "path": "/api/cron/cleanup", "schedule": "*/15 * * * *" }] }
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional security measure)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[Cron] Unauthorized cleanup attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Starting cleanup job...');

    const results = {
      sessionsDeleted: 0,
      paymentsTimedOut: 0,
      bookingsCancelled: 0,
      notificationsSent: 0,
      tripsDelayed: 0,
      tripsDeparted: 0,
      tripsCompleted: 0,
      tripsCancelled: 0,
      timestamp: new Date().toISOString()
    };

    // 1. Cleanup expired SMS sessions
    results.sessionsDeleted = await cleanupExpiredSessions();

    // 2. Handle payment timeouts (payments pending for > 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const timedOutPayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: fiveMinutesAgo },
        initiatedVia: 'SMS'
      },
      include: {
        booking: {
          include: {
            user: true,
            passengers: true,
            trip: true
          }
        }
      }
    });

    for (const payment of timedOutPayments) {
      await handlePaymentTimeout(payment);
      results.paymentsTimedOut++;
      results.notificationsSent++;
    }

    // 3. Cleanup old pending bookings (> 15 minutes old)
    // This includes:
    // - Bookings with no payment record at all
    // - Bookings with PENDING payment (user created payment intent but didn't complete)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const stalePendingBookings = await prisma.booking.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: fifteenMinutesAgo }
      },
      include: {
        passengers: true,
        trip: true,
        payment: true
      }
    });

    for (const booking of stalePendingBookings) {
      await cancelStaleBooking(booking);
      results.bookingsCancelled++;
    }

    // 4. Auto-update status of trips (delayed, departed, and completed)
    // 4a. Mark trips as DELAYED if 30+ min past departure time and still SCHEDULED
    const delayedTripsCount = await markTripsAsDelayed();
    results.tripsDelayed = delayedTripsCount;

    // 4b. Mark recently-past trips as DEPARTED (within 1 hour of departure time)
    const departedTripsCount = await markTripsAsDeparted();
    results.tripsDeparted = departedTripsCount;

    // 4c. Mark old DEPARTED/DELAYED trips as COMPLETED/CANCELLED
    const oldTripsResult = await updateOldTripStatuses();
    results.tripsCompleted = oldTripsResult.completed;
    results.tripsCancelled = oldTripsResult.cancelled;

    console.log('[Cron] Cleanup completed:', results);

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('[Cron] Cleanup error:', error);
    return NextResponse.json(
      {
        error: 'Cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle payment timeout
 */
async function handlePaymentTimeout(payment: any) {
  const { booking } = payment;

  console.log(`[Cron] Timing out payment: ${payment.transactionId}`);

  await prisma.$transaction(async (tx) => {
    // Update payment status
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'TIMEOUT' }
    });

    // Cancel booking
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED' }
    });

    // Release seats
    await tx.trip.update({
      where: { id: booking.tripId },
      data: {
        availableSlots: { increment: booking.passengers.length }
      }
    });

    // Log
    await tx.adminLog.create({
      data: {
        userId: booking.userId,
        action: 'PAYMENT_TIMEOUT',
        tripId: booking.tripId,
        details: JSON.stringify({
          bookingId: booking.id,
          transactionId: payment.transactionId,
          amount: payment.amount,
          passengerCount: booking.passengers.length
        })
      }
    });

    // Notify user via SMS
    const gateway = getSmsGateway();
    await gateway.send(
      booking.user.phone,
      `Payment timed out.\nBooking ${booking.id} cancelled.\n\nSeats released. To rebook, send: BOOK`
    );
  });
}

/**
 * Cancel stale pending booking (with or without payment)
 */
async function cancelStaleBooking(booking: any) {
  console.log(`[Cron] Cancelling stale booking: ${booking.id}`);

  await prisma.$transaction(async (tx) => {
    // Update booking
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED' }
    });

    // Cancel pending payment if exists
    if (booking.payment && booking.payment.status === 'PENDING') {
      await tx.payment.update({
        where: { id: booking.payment.id },
        data: { status: 'CANCELLED' }
      });
    }

    // Release seats
    await tx.trip.update({
      where: { id: booking.tripId },
      data: {
        availableSlots: { increment: booking.passengers.length }
      }
    });

    // Log
    await tx.adminLog.create({
      data: {
        userId: booking.userId,
        action: 'BOOKING_STALE_CANCELLED',
        tripId: booking.tripId,
        details: JSON.stringify({
          bookingId: booking.id,
          reason: 'No payment completed within 15 minutes',
          hadPaymentIntent: !!booking.payment
        })
      }
    });
  });
}

/**
 * Mark trips as DELAYED when 30+ minutes past departure and still SCHEDULED
 * DELAYED trips can still accept bookings (both online and manual)
 */
async function markTripsAsDelayed() {
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
  let delayedCount = 0;

  try {
    // Find SCHEDULED trips that are 30+ minutes past departure time
    const tripsToDelay = await prisma.trip.findMany({
      where: {
        departureTime: {
          lt: thirtyMinutesAgo,
        },
        status: 'SCHEDULED', // Only SCHEDULED, not BOARDING or DELAYED
      },
      select: {
        id: true,
        status: true,
        departureTime: true,
        companyId: true,
      },
    });

    for (const trip of tripsToDelay) {
      try {
        await prisma.$transaction(async (tx) => {
          // Mark trip as DELAYED (booking NOT halted - allow both online and manual)
          await tx.trip.update({
            where: { id: trip.id },
            data: {
              status: 'DELAYED',
              delayedAt: now,
              // Don't halt booking - user wants to allow bookings for delayed trips
            },
          });

          // Create audit log
          await tx.adminLog.create({
            data: {
              userId: 'SYSTEM',
              action: 'TRIP_STATUS_AUTO_DELAYED',
              tripId: trip.id,
              companyId: trip.companyId,
              details: JSON.stringify({
                oldStatus: trip.status,
                newStatus: 'DELAYED',
                reason: 'Automatic - 30 minutes past departure time',
                departureTime: trip.departureTime.toISOString(),
                processedAt: now.toISOString(),
              }),
            },
          });
        });

        delayedCount++;
        console.log(`[Cron] Trip ${trip.id} marked as DELAYED`);
      } catch (error) {
        console.error(`[Cron] Failed to mark trip ${trip.id} as DELAYED:`, error);
      }
    }

    console.log(`[Cron] Auto-delayed ${delayedCount} trips`);
  } catch (error) {
    console.error('[Cron] Error marking trips as DELAYED:', error);
  }

  return delayedCount;
}

/**
 * Mark trips as DEPARTED when their departure time has passed
 * This creates the expected SCHEDULED/DELAYED → DEPARTED → COMPLETED lifecycle
 * Also catches trips that were missed and are still SCHEDULED/BOARDING/DELAYED
 */
async function markTripsAsDeparted() {
  const now = new Date();
  let departedCount = 0;

  try {
    // Find ALL trips that have past departure time and are still SCHEDULED, BOARDING, or DELAYED
    // This catches trips that may have been missed due to cron gaps
    const pastTrips = await prisma.trip.findMany({
      where: {
        departureTime: {
          lt: now,
        },
        status: {
          in: ['SCHEDULED', 'BOARDING', 'DELAYED'],
        },
      },
      select: {
        id: true,
        status: true,
        departureTime: true,
        companyId: true,
        delayedAt: true,
      },
    });

    for (const trip of pastTrips) {
      // For DELAYED trips, only auto-depart if it's been at least 1 hour past departure
      // (give staff time to manually handle delayed trips)
      const oneHourPastDeparture = new Date(trip.departureTime.getTime() + 60 * 60 * 1000);
      if (trip.status === 'DELAYED' && now < oneHourPastDeparture) {
        continue; // Skip - give delayed trip more time
      }

      try {
        await prisma.$transaction(async (tx) => {
          // Mark trip as DEPARTED
          await tx.trip.update({
            where: { id: trip.id },
            data: {
              status: 'DEPARTED',
              actualDepartureTime: trip.departureTime,
              bookingHalted: true, // No more bookings for departed trips
            },
          });

          // Create audit log
          await tx.adminLog.create({
            data: {
              userId: 'SYSTEM',
              action: 'TRIP_STATUS_AUTO_DEPARTED',
              tripId: trip.id,
              companyId: trip.companyId,
              details: JSON.stringify({
                oldStatus: trip.status,
                newStatus: 'DEPARTED',
                reason: trip.status === 'DELAYED'
                  ? 'Automatic - delayed trip auto-departed after 1 hour'
                  : 'Automatic - departure time passed',
                departureTime: trip.departureTime.toISOString(),
                processedAt: now.toISOString(),
              }),
            },
          });
        });

        departedCount++;
        console.log(`[Cron] Trip ${trip.id} marked as DEPARTED (was ${trip.status})`);
      } catch (error) {
        console.error(`[Cron] Failed to mark trip ${trip.id} as DEPARTED:`, error);
      }
    }

    console.log(`[Cron] Auto-departed ${departedCount} trips`);
  } catch (error) {
    console.error('[Cron] Error marking trips as DEPARTED:', error);
  }

  return departedCount;
}

/**
 * Update old trip statuses (trips with past departure dates)
 * - DEPARTED trips (older than estimated duration) → COMPLETED
 * - SCHEDULED/BOARDING/DELAYED trips with bookings that are very old → COMPLETED
 * - SCHEDULED/BOARDING trips without bookings that are very old → CANCELLED
 *
 * Note: This function now only handles DEPARTED trips for COMPLETED transition.
 * SCHEDULED/BOARDING/DELAYED → DEPARTED is handled by markTripsAsDeparted().
 */
async function updateOldTripStatuses() {
  const now = new Date();
  let completed = 0;
  let cancelled = 0;

  try {
    // Find DEPARTED trips that should be marked COMPLETED
    // (estimated arrival time has passed)
    const departedTrips = await prisma.trip.findMany({
      where: {
        status: 'DEPARTED',
      },
      include: {
        bookings: {
          where: {
            status: {
              in: ['PAID', 'COMPLETED'],
            },
          },
          select: {
            id: true,
          },
        },
      },
    });

    for (const trip of departedTrips) {
      try {
        // Calculate estimated arrival time
        const estimatedArrivalTime = new Date(
          trip.departureTime.getTime() + trip.estimatedDuration * 60 * 60 * 1000
        );

        // Only mark as COMPLETED if arrival time has passed
        if (now < estimatedArrivalTime) {
          continue; // Trip still in transit
        }

        await prisma.$transaction(async (tx) => {
          await tx.trip.update({
            where: { id: trip.id },
            data: {
              status: 'COMPLETED',
              actualDepartureTime: trip.actualDepartureTime || trip.departureTime,
              actualArrivalTime: now,
              bookingHalted: true,
            },
          });

          await tx.adminLog.create({
            data: {
              userId: 'SYSTEM',
              action: 'TRIP_STATUS_AUTO_UPDATE',
              tripId: trip.id,
              companyId: trip.companyId,
              details: JSON.stringify({
                oldStatus: 'DEPARTED',
                newStatus: 'COMPLETED',
                reason: 'Automatic - estimated arrival time passed',
                departureTime: trip.departureTime.toISOString(),
                estimatedArrivalTime: estimatedArrivalTime.toISOString(),
              }),
            },
          });
        });

        completed++;
        console.log(`[Cron] Trip ${trip.id} marked as COMPLETED`);
      } catch (error) {
        console.error(`[Cron] Failed to complete trip ${trip.id}:`, error);
      }
    }

    // Handle very old trips that are still SCHEDULED/BOARDING (24+ hours old)
    // This catches edge cases where trips were never properly transitioned
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const veryOldTrips = await prisma.trip.findMany({
      where: {
        departureTime: {
          lt: twentyFourHoursAgo,
        },
        status: {
          in: ['SCHEDULED', 'BOARDING'],
        },
      },
      include: {
        bookings: {
          where: {
            status: {
              in: ['PAID', 'COMPLETED'],
            },
          },
          select: {
            id: true,
          },
        },
      },
    });

    for (const trip of veryOldTrips) {
      try {
        const hasBookings = trip.bookings.length > 0;
        const newStatus = hasBookings ? 'COMPLETED' : 'CANCELLED';

        await prisma.$transaction(async (tx) => {
          await tx.trip.update({
            where: { id: trip.id },
            data: {
              status: newStatus,
              actualDepartureTime: trip.departureTime,
              actualArrivalTime: new Date(
                trip.departureTime.getTime() + trip.estimatedDuration * 60 * 60 * 1000
              ),
              bookingHalted: true,
            },
          });

          await tx.adminLog.create({
            data: {
              userId: 'SYSTEM',
              action: 'TRIP_STATUS_AUTO_UPDATE',
              tripId: trip.id,
              companyId: trip.companyId,
              details: JSON.stringify({
                oldStatus: trip.status,
                newStatus,
                reason: 'Automatic cleanup - trip 24+ hours past departure',
                departureTime: trip.departureTime.toISOString(),
                hasBookings,
              }),
            },
          });
        });

        if (newStatus === 'COMPLETED') {
          completed++;
          console.log(`[Cron] Very old trip ${trip.id} marked as COMPLETED`);
        } else {
          cancelled++;
          console.log(`[Cron] Very old trip ${trip.id} marked as CANCELLED (no bookings)`);
        }
      } catch (error) {
        console.error(`[Cron] Failed to update very old trip ${trip.id}:`, error);
      }
    }

    console.log(`[Cron] Old trip cleanup: ${completed} completed, ${cancelled} cancelled`);
  } catch (error) {
    console.error('[Cron] Error updating old trip statuses:', error);
  }

  return { completed, cancelled };
}

/**
 * POST endpoint for manual trigger (admin only)
 */
export async function POST(request: NextRequest) {
  return GET(request);
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cleanupExpiredSessions } from "@/lib/sms/session";
import { getSmsGateway } from "@/lib/sms/gateway";
import { getNowEthiopia, hasDepartedEthiopia, msUntilDepartureEthiopia } from "@/lib/utils";

// GET /api/cron/cleanup
//
// Cleanup cron job - runs periodically to:
// 1. Delete expired SMS sessions
// 2. Handle payment timeouts
// 3. General cleanup tasks
//
// Should be configured to run every 5-10 minutes via Vercel Cron or external scheduler
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
      staffStatusReset: 0,
      positionsPurged: 0,
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

    // 3. Cleanup old pending bookings (> 10 minutes old)
    // This includes:
    // - Bookings with no payment record at all
    // - Bookings with PENDING payment (user created payment intent but didn't complete)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const stalePendingBookings = await prisma.booking.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: tenMinutesAgo }
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

    // 5. Reset staff status for completed/cancelled trips
    // Drivers and conductors who no longer have active trips should be set to AVAILABLE
    results.staffStatusReset = await resetStaffStatusForCompletedTrips();

    // 6. Purge old GPS tracking positions (>7 days for completed/cancelled trips)
    results.positionsPurged = await purgeOldTrackingPositions();

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
          reason: 'No payment completed within 10 minutes',
          hadPaymentIntent: !!booking.payment
        })
      }
    });
  });
}

/**
 * Mark trips as DELAYED when 30+ minutes past departure and still SCHEDULED
 * DELAYED trips can still accept bookings (both online and manual)
 *
 * CRITICAL FIX: Uses Ethiopia timezone utilities to avoid marking future trips as delayed
 * when server runs in UTC (AWS EC2)
 */
async function markTripsAsDelayed() {
  const now = getNowEthiopia();  // FIX: Use Ethiopia time, not server UTC
  let delayedCount = 0;

  try {
    // Find SCHEDULED trips - we'll filter by Ethiopia time in the loop
    const scheduledTrips = await prisma.trip.findMany({
      where: {
        status: 'SCHEDULED', // Only SCHEDULED, not BOARDING or DELAYED
      },
      select: {
        id: true,
        status: true,
        departureTime: true,
        companyId: true,
      },
    });

    for (const trip of scheduledTrips) {
      // FIX: Use Ethiopia timezone for comparison
      const msLate = -msUntilDepartureEthiopia(trip.departureTime);

      // Skip if trip hasn't departed yet or is less than 30 minutes late
      if (msLate < 30 * 60 * 1000) {
        continue;
      }

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
                reason: 'Automatic - 30 minutes past departure time (Ethiopia TZ)',
                departureTime: trip.departureTime.toISOString(),
                processedAt: now.toISOString(),
                minutesLate: Math.round(msLate / 60000),
              }),
            },
          });
        });

        delayedCount++;
        console.log(`[Cron] Trip ${trip.id} marked as DELAYED (${Math.round(msLate / 60000)} min late)`);
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
 *
 * CRITICAL FIX: Uses Ethiopia timezone utilities to avoid marking future trips as departed
 * when server runs in UTC (AWS EC2)
 */
async function markTripsAsDeparted() {
  const now = getNowEthiopia();  // FIX: Use Ethiopia time, not server UTC
  let departedCount = 0;

  try {
    // Find trips that are still SCHEDULED, BOARDING, or DELAYED
    // We'll filter by Ethiopia time in the loop
    const activeTrips = await prisma.trip.findMany({
      where: {
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
        driverId: true,
        conductorId: true,
      },
    });

    for (const trip of activeTrips) {
      // FIX: Use Ethiopia timezone for comparison
      if (!hasDepartedEthiopia(trip.departureTime)) {
        continue; // Trip hasn't departed yet in Ethiopia time
      }

      // For DELAYED trips, only auto-depart if it's been at least 1 hour past departure
      // (give staff time to manually handle delayed trips)
      const msLate = -msUntilDepartureEthiopia(trip.departureTime);
      if (trip.status === 'DELAYED' && msLate < 60 * 60 * 1000) {
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

          // Auto-update staff status to ON_TRIP (admin can override manually)
          const staffIds = [trip.driverId, trip.conductorId].filter((id): id is string => !!id);
          if (staffIds.length > 0) {
            await tx.user.updateMany({
              where: {
                id: { in: staffIds },
                staffStatus: { not: 'ON_LEAVE' }, // Don't change if on leave
              },
              data: { staffStatus: 'ON_TRIP' },
            });
          }

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
                  ? 'Automatic - delayed trip auto-departed after 1 hour (Ethiopia TZ)'
                  : 'Automatic - departure time passed (Ethiopia TZ)',
                departureTime: trip.departureTime.toISOString(),
                processedAt: now.toISOString(),
                minutesPast: Math.round(msLate / 60000),
                staffUpdated: staffIds,
              }),
            },
          });
        });

        departedCount++;
        console.log(`[Cron] Trip ${trip.id} marked as DEPARTED (was ${trip.status}, ${Math.round(msLate / 60000)} min past)`);
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
 *
 * CRITICAL FIX: Uses Ethiopia timezone for accurate time comparisons
 */
async function updateOldTripStatuses() {
  const now = getNowEthiopia();  // FIX: Use Ethiopia time
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
        // FIX: estimatedDuration is stored in MINUTES (see CLAUDE.md), not hours!
        // Add 2-hour safety buffer for traffic, delays, rest stops, etc.
        const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
        const estimatedArrivalTime = new Date(
          trip.departureTime.getTime() +
          (trip.estimatedDuration * 60 * 1000) +  // minutes -> ms (FIX)
          TWO_HOURS_MS                             // 2hr buffer
        );

        // Only mark as COMPLETED if arrival time + buffer has passed
        if (now < estimatedArrivalTime) {
          continue; // Trip still in transit or within safety buffer
        }

        await prisma.$transaction(async (tx) => {
          await tx.trip.update({
            where: { id: trip.id },
            data: {
              status: 'COMPLETED',
              actualDepartureTime: trip.actualDepartureTime || trip.departureTime,
              actualArrivalTime: now,
              bookingHalted: true,
              trackingActive: false, // Deactivate GPS tracking
              trackingToken: null, // Invalidate OsmAnd token
            },
          });

          // Reset staff status to AVAILABLE (only if they have no other active trips)
          const staffIds = [trip.driverId, trip.conductorId].filter((id): id is string => !!id);
          for (const staffId of staffIds) {
            const otherActiveTrips = await tx.trip.count({
              where: {
                OR: [{ driverId: staffId }, { conductorId: staffId }],
                status: 'DEPARTED',
                id: { not: trip.id },
              },
            });
            if (otherActiveTrips === 0) {
              await tx.user.update({
                where: { id: staffId },
                data: { staffStatus: 'AVAILABLE' },
              });
            }
          }

          await tx.adminLog.create({
            data: {
              userId: 'SYSTEM',
              action: 'TRIP_STATUS_AUTO_UPDATE',
              tripId: trip.id,
              companyId: trip.companyId,
              details: JSON.stringify({
                oldStatus: 'DEPARTED',
                newStatus: 'COMPLETED',
                reason: 'Automatic - estimated arrival time + 2hr buffer passed',
                departureTime: trip.departureTime.toISOString(),
                estimatedArrivalTime: estimatedArrivalTime.toISOString(),
                safetyBufferHours: 2,
                staffReset: staffIds,
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
              // FIX: estimatedDuration is stored in MINUTES, not hours
              actualArrivalTime: new Date(
                trip.departureTime.getTime() + trip.estimatedDuration * 60 * 1000
              ),
              bookingHalted: true,
              trackingActive: false, // Deactivate GPS tracking
              trackingToken: null, // Invalidate OsmAnd token
            },
          });

          // Reset staff status to AVAILABLE (only if no other active trips)
          const staffIds = [trip.driverId, trip.conductorId].filter((id): id is string => !!id);
          for (const staffId of staffIds) {
            const otherActiveTrips = await tx.trip.count({
              where: {
                OR: [{ driverId: staffId }, { conductorId: staffId }],
                status: 'DEPARTED',
                id: { not: trip.id },
              },
            });
            if (otherActiveTrips === 0) {
              await tx.user.update({
                where: { id: staffId },
                data: { staffStatus: 'AVAILABLE' },
              });
            }
          }

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
                staffReset: staffIds,
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
 * Reset staff status to AVAILABLE for staff whose trips have completed/cancelled
 * Only applies to drivers and conductors (they travel with the bus)
 * Manual ticketers work at stations and don't have ON_TRIP status
 */
async function resetStaffStatusForCompletedTrips(): Promise<number> {
  let resetCount = 0;
  try {
    // Find drivers/conductors who are ON_TRIP but may have no active trips
    const staffOnTrip = await prisma.user.findMany({
      where: {
        staffStatus: 'ON_TRIP',
        role: 'COMPANY_ADMIN', // Staff are stored with COMPANY_ADMIN role + staffRole
        staffRole: { in: ['DRIVER', 'CONDUCTOR'] } // Only traveling staff
      },
      select: { id: true, name: true, staffRole: true }
    });

    for (const staff of staffOnTrip) {
      // Check if this staff has any active trips (based on their role)
      const activeTripsCount = await prisma.trip.count({
        where: {
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
          OR: [
            ...(staff.staffRole === 'DRIVER' ? [{ driverId: staff.id }] : []),
            ...(staff.staffRole === 'CONDUCTOR' ? [{ conductorId: staff.id }] : [])
          ]
        }
      });

      if (activeTripsCount === 0) {
        // No active trips, reset to AVAILABLE
        await prisma.user.update({
          where: { id: staff.id },
          data: { staffStatus: 'AVAILABLE' }
        });
        resetCount++;
        console.log(`[Cron] Reset ${staff.name} (${staff.staffRole}) status to AVAILABLE - no active trips`);
      }
    }

    if (resetCount > 0) {
      console.log(`[Cron] Reset ${resetCount} staff members to AVAILABLE status`);
    }
  } catch (error) {
    console.error('[Cron] Error resetting staff status:', error);
  }
  return resetCount;
}

/**
 * Purge old GPS tracking positions for completed/cancelled trips (>7 days)
 * Keeps recent positions for analytics/replay
 */
async function purgeOldTrackingPositions(): Promise<number> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const result = await prisma.tripPosition.deleteMany({
      where: {
        receivedAt: { lt: sevenDaysAgo },
        trip: {
          status: { in: ['COMPLETED', 'CANCELLED'] },
        },
      },
    });

    if (result.count > 0) {
      console.log(`[Cron] Purged ${result.count} old GPS tracking positions`);
    }

    return result.count;
  } catch (error) {
    console.error('[Cron] Error purging tracking positions:', error);
    return 0;
  }
}

/**
 * POST endpoint for manual trigger (admin only)
 */
export async function POST(request: NextRequest) {
  return GET(request);
}

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
 * POST endpoint for manual trigger (admin only)
 */
export async function POST(request: NextRequest) {
  return GET(request);
}

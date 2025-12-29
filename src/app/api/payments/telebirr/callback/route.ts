import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyTelebirrSignature, type TelebirrCallbackPayload } from "@/lib/payments/telebirr";
import { generateShortCode } from "@/lib/utils";
import { getSmsGateway } from "@/lib/sms/gateway";
import QRCode from "qrcode";

/**
 * POST /api/payments/telebirr/callback
 *
 * Webhook endpoint called by TeleBirr when payment is completed
 * This is called after user approves payment via MMI popup
 *
 * Expected payload:
 * {
 *   transactionId: "TB_123456789",
 *   outTradeNo: "booking_abc123",  // Our booking ID
 *   status: "SUCCESS",
 *   amount: "1050.00",
 *   currency: "ETB",
 *   timestamp: "2025-12-27T10:35:00Z",
 *   signature: "abc123..."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: TelebirrCallbackPayload = await request.json();
    const { transactionId, outTradeNo, status, amount, signature, timestamp } = body;

    console.log(`[TeleBirr Callback] Received: ${transactionId}, Status: ${status}`);

    const isDemoMode = process.env.DEMO_MODE === 'true';

    if (!isDemoMode) {
      // Security Check 1: Verify signature
      if (!verifyTelebirrSignature(body)) {
        console.error('[TeleBirr Callback] Invalid signature');
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }

      // Security Check 2: Validate timestamp (prevent replay attacks)
      if (timestamp) {
        const callbackTime = new Date(timestamp).getTime();
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        // Reject callbacks older than 5 minutes
        if (Math.abs(now - callbackTime) > fiveMinutes) {
          console.error('[TeleBirr Callback] Timestamp too old or in future');
          return NextResponse.json(
            { error: "Request expired" },
            { status: 401 }
          );
        }
      }

      // Security Check 3: IP Whitelisting (if configured)
      const allowedIPs = process.env.TELEBIRR_WEBHOOK_IPS?.split(',') || [];
      if (allowedIPs.length > 0) {
        const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                        request.headers.get('x-real-ip') ||
                        'unknown';

        if (!allowedIPs.includes(clientIP)) {
          console.error(`[TeleBirr Callback] Unauthorized IP: ${clientIP}`);
          return NextResponse.json(
            { error: "Unauthorized IP address" },
            { status: 403 }
          );
        }
      }
    }

    // Find payment by transaction ID
    const payment = await prisma.payment.findFirst({
      where: { transactionId },
      include: {
        booking: {
          include: {
            user: true,
            passengers: true,
            trip: {
              include: {
                company: true
              }
            }
          }
        }
      }
    });

    if (!payment) {
      console.error(`[TeleBirr Callback] Payment not found: ${transactionId}`);
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Check if already processed
    if (payment.status === 'SUCCESS') {
      console.log(`[TeleBirr Callback] Payment already processed: ${transactionId}`);
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    // Process based on status
    if (status === 'SUCCESS') {
      await handleSuccessfulPayment(payment, body);
    } else {
      await handleFailedPayment(payment, body);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[TeleBirr Callback] Error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handleSuccessfulPayment(payment: any, callback: TelebirrCallbackPayload) {
  const { transactionId, amount } = callback;

  console.log(`[TeleBirr Callback] Processing successful payment: ${transactionId}`);

  await prisma.$transaction(async (tx) => {
    // 1. Update payment status
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESS',
        updatedAt: new Date()
      }
    });

    // 2. Update booking status
    await tx.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'PAID' }
    });

    // 3. Generate tickets for each passenger
    const tickets = await Promise.all(
      payment.booking.passengers.map(async (passenger: any) => {
        const shortCode = generateShortCode();

        // Generate QR code
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const verificationUrl = `${baseUrl}/verify/${shortCode}`;
        const qrCode = await QRCode.toDataURL(verificationUrl, {
          width: 300,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' }
        });

        // Create ticket
        return await tx.ticket.create({
          data: {
            bookingId: payment.bookingId,
            tripId: payment.booking.tripId,
            passengerName: passenger.name,
            seatNumber: passenger.seatNumber,
            qrCode,
            shortCode,
            isUsed: false
          }
        });
      })
    );

    // 4. Log admin action
    await tx.adminLog.create({
      data: {
        userId: payment.booking.userId,
        action: 'PAYMENT_SUCCESS_SMS',
        tripId: payment.booking.tripId,
        details: JSON.stringify({
          transactionId,
          amount: parseFloat(amount),
          method: 'TELEBIRR',
          passengerCount: payment.booking.passengers.length,
          ticketCodes: tickets.map(t => t.shortCode)
        })
      }
    });

    // 5. Send tickets via SMS
    await sendTicketsSms(payment.booking, tickets);

    console.log(`[TeleBirr Callback] Payment processed successfully: ${tickets.length} tickets generated`);
  });
}

/**
 * Handle failed payment
 */
async function handleFailedPayment(payment: any, callback: TelebirrCallbackPayload) {
  const { transactionId } = callback;

  console.log(`[TeleBirr Callback] Processing failed payment: ${transactionId}`);

  await prisma.$transaction(async (tx) => {
    // Update payment status
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        updatedAt: new Date()
      }
    });

    // Update booking status
    await tx.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'CANCELLED' }
    });

    // Release seats (increment available slots)
    await tx.trip.update({
      where: { id: payment.booking.tripId },
      data: {
        availableSlots: { increment: payment.booking.passengers.length }
      }
    });

    // Log
    await tx.adminLog.create({
      data: {
        userId: payment.booking.userId,
        action: 'PAYMENT_FAILED_SMS',
        tripId: payment.booking.tripId,
        details: JSON.stringify({
          transactionId,
          reason: 'Payment failed or rejected by user'
        })
      }
    });

    // Notify user via SMS
    const gateway = getSmsGateway();
    await gateway.send(
      payment.booking.user.phone,
      `Payment failed.\nBooking ${payment.booking.id} cancelled.\n\nTo rebook, send: BOOK`
    );
  });
}

/**
 * Send tickets to user via SMS
 */
async function sendTicketsSms(booking: any, tickets: any[]) {
  const gateway = getSmsGateway();
  const { user, trip, passengers } = booking;

  // Format trip date/time
  const departureTime = new Date(trip.departureTime);
  const dateStr = departureTime.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const timeStr = departureTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // If single passenger, send single SMS with all details
  if (tickets.length === 1) {
    const ticket = tickets[0];
    const message = `
PAYMENT RECEIVED!

YOUR TICKET
Code: ${ticket.shortCode}
Seat: ${ticket.seatNumber}
Name: ${ticket.passengerName}

Trip: ${trip.origin} → ${trip.destination}
Date: ${dateStr}
Time: ${timeStr}
Bus: ${trip.company.name}

Show code ${ticket.shortCode} to conductor.

i-Ticket
    `.trim();

    await gateway.send(user.phone, message);
  } else {
    // Multiple passengers - send summary first, then individual tickets
    const summaryMessage = `
PAYMENT RECEIVED!

${tickets.length} TICKETS for ${trip.origin} → ${trip.destination}
Date: ${dateStr}, ${timeStr}
Bus: ${trip.company.name}

Ticket codes:
${tickets.map((t, i) => `${i + 1}. ${t.passengerName}: ${t.shortCode} (Seat ${t.seatNumber})`).join('\n')}

Show codes to conductor.
i-Ticket
    `.trim();

    await gateway.send(user.phone, summaryMessage);
  }

  console.log(`[SMS] Sent ${tickets.length} ticket(s) to ${user.phone}`);
}

/**
 * GET /api/payments/telebirr/callback
 *
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "OK",
    service: "TeleBirr Payment Callback",
    timestamp: new Date().toISOString()
  });
}

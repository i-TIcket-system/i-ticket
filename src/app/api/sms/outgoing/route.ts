import { NextRequest, NextResponse } from "next/server";
import { getSmsGateway } from "@/lib/sms/gateway";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Validate Ethiopian phone number format
 */
function validateEthiopianPhone(phone: string): boolean {
  return /^09\d{8}$/.test(phone);
}

/**
 * POST /api/sms/outgoing
 *
 * Internal API endpoint to send SMS messages
 * Used by the application to send SMS notifications, tickets, etc.
 *
 * Request body:
 * {
 *   to: "0912345678",
 *   message: "Your ticket code is ABC123",
 *   sessionId?: "sess_abc123"  // Optional: for SMS bot context
 * }
 *
 * Auth: Requires admin session OR valid SMS session
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { to, message, sessionId } = body;

    // Validate phone number
    if (!to || !validateEthiopianPhone(to)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Validate message
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Authorization check
    // Allow if:
    // 1. User is admin/company admin (for sending notifications)
    // 2. Valid SMS session exists (for bot responses)
    let authorized = false;

    if (session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'COMPANY_ADMIN') {
      authorized = true;
    } else if (sessionId) {
      // Check if valid SMS session exists
      const smsSession = await prisma.smsSession.findUnique({
        where: { sessionId }
      });

      if (smsSession && smsSession.phone === to) {
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Send SMS
    const gateway = getSmsGateway();
    const success = await gateway.sendWithRetry(to, message);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to send SMS" },
        { status: 500 }
      );
    }

    // Log successful send
    await prisma.adminLog.create({
      data: {
        userId: session?.user?.id || "SYSTEM",
        action: "SMS_SENT",
        details: JSON.stringify({
          to,
          messageLength: message.length,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      to,
      sentAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[SMS Outgoing] Error:', error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sms/outgoing
 *
 * Get SMS sending statistics (admin only)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get SMS stats from last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const smsSent = await prisma.adminLog.count({
      where: {
        action: "SMS_SENT",
        createdAt: { gte: yesterday },
      },
    });

    const smsReceived = await prisma.adminLog.count({
      where: {
        action: "SMS_RECEIVED",
        createdAt: { gte: yesterday },
      },
    });

    return NextResponse.json({
      last24Hours: {
        sent: smsSent,
        received: smsReceived,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[SMS Outgoing Stats] Error:', error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

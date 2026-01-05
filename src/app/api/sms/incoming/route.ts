import { NextRequest, NextResponse } from "next/server";
import { getSmsGateway, type InboundSmsPayload } from "@/lib/sms/gateway";
import prisma from "@/lib/db";

/**
 * Rate limiter for SMS messages
 * Prevents spam by limiting messages per phone number
 */
const rateLimiter = new Map<string, number[]>();

/**
 * Check if phone number has exceeded rate limit
 *
 * @param phone - Phone number to check
 * @returns boolean - true if rate limit is OK, false if exceeded
 */
function checkRateLimit(phone: string): boolean {
  const now = Date.now();
  const timestamps = rateLimiter.get(phone) || [];

  // Remove timestamps older than 1 minute
  const recentTimestamps = timestamps.filter(t => now - t < 60000);

  // Max 10 messages per minute
  if (recentTimestamps.length >= 10) {
    return false;
  }

  recentTimestamps.push(now);
  rateLimiter.set(phone, recentTimestamps);
  return true;
}

/**
 * Validate Ethiopian phone number format
 *
 * @param phone - Phone number to validate
 * @returns boolean - true if valid Ethiopian format
 */
function validateEthiopianPhone(phone: string): boolean {
  // Must be 10 digits starting with 09
  return /^09\d{8}$/.test(phone);
}

/**
 * Sanitize user input to prevent injection attacks
 * Enhanced security: HTML encoding + strict character allowlist
 *
 * @param input - User input string
 * @returns Sanitized string
 */
function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // Step 1: Basic cleanup
  let sanitized = input.trim()

  // Step 2: Limit length FIRST (prevent ReDoS attacks)
  sanitized = sanitized.slice(0, 500)

  // Step 3: Remove dangerous characters (strict allowlist)
  // Allow: letters, numbers, spaces, basic punctuation, Amharic characters
  sanitized = sanitized.replace(/[^\w\s\-.,አ-ፚ]/g, '')

  // Step 4: HTML encode for XSS prevention
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')

  // Step 5: Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim()

  return sanitized
}

/**
 * POST /api/sms/incoming
 *
 * Webhook endpoint to receive incoming SMS messages from gateway
 * This is called by the SMS gateway (Negarit/GeezSMS) when a user sends an SMS
 *
 * Expected payload format:
 * {
 *   from: "0912345678",
 *   to: "9999",
 *   message: "BOOK ADDIS HAWASSA JAN15",
 *   timestamp: "2025-12-27T10:00:00Z",
 *   messageId: "msg_123"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: InboundSmsPayload = await request.json();
    const { from, message, messageId, timestamp } = body;

    // Security Check 1: Verify webhook signature
    const signature = request.headers.get('X-SMS-Signature') || request.headers.get('Authorization');
    const gateway = getSmsGateway();

    if (!gateway.verifyWebhookSignature(body, signature || '')) {
      console.error('[SMS Webhook] Invalid signature');
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Security Check 2: Validate timestamp (prevent replay attacks)
    if (timestamp) {
      const smsTime = new Date(timestamp).getTime();
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (Math.abs(now - smsTime) > fiveMinutes) {
        console.error('[SMS Webhook] Message timestamp too old');
        return NextResponse.json(
          { error: "Message expired" },
          { status: 401 }
        );
      }
    }

    // Validate phone number
    if (!from || !validateEthiopianPhone(from)) {
      console.error('[SMS Webhook] Invalid phone number:', from);
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(from)) {
      console.warn(`[SMS Webhook] Rate limit exceeded for ${from}`);

      // Send rate limit warning
      const gateway = getSmsGateway();
      await gateway.send(
        from,
        "Too many messages. Please wait 1 minute.\n\nFor help: Reply HELP"
      );

      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Sanitize input
    const sanitizedMessage = sanitizeInput(message);

    if (!sanitizedMessage) {
      return NextResponse.json(
        { error: "Empty message" },
        { status: 400 }
      );
    }

    console.log(`[SMS Webhook] Received from ${from}: ${sanitizedMessage}`);

    // Process message through SMS bot
    const { processMessage } = await import("@/lib/sms/bot");
    const response = await processMessage(from, sanitizedMessage);

    // Send response
    const smsGateway = getSmsGateway();
    await smsGateway.send(from, response);

    // Log to AdminLog for tracking
    await prisma.adminLog.create({
      data: {
        userId: "SYSTEM",
        action: "SMS_RECEIVED",
        details: JSON.stringify({
          phone: from,
          message: sanitizedMessage,
          messageId,
          timestamp,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      messageId,
    });
  } catch (error) {
    console.error('[SMS Webhook] Error:', error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sms/incoming
 *
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "OK",
    service: "i-Ticket SMS Webhook",
    timestamp: new Date().toISOString(),
  });
}

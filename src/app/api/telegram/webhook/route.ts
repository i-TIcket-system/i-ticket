/**
 * Telegram Webhook API Route
 * Receives updates from Telegram and processes them through the bot
 */

import { NextRequest, NextResponse } from "next/server";
import { initializeBot, processUpdate, bot } from "@/lib/telegram/bot";
import crypto from "crypto";

// Initialize bot on first load
if (bot && process.env.TELEGRAM_BOT_ENABLED === "true") {
  initializeBot();
}

// ==================== RATE LIMITING ====================

// In-memory rate limit storage (per chat ID)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limit config
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute per chat

/**
 * Check rate limit for a chat
 */
function checkRateLimit(chatId: string | number): { allowed: boolean; remaining: number } {
  const key = String(chatId);
  const now = Date.now();

  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0 };
  }

  // Increment counter
  entry.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - entry.count };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];

  rateLimitMap.forEach((entry, key) => {
    if (now > entry.resetTime) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => rateLimitMap.delete(key));
}, 5 * 60 * 1000); // Cleanup every 5 minutes

// ==================== END RATE LIMITING ====================

/**
 * Verify webhook request is from Telegram
 */
function verifyTelegramRequest(request: NextRequest): boolean {
  // Get the secret token from env
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!secretToken) {
    console.warn("[Telegram Webhook] No secret token configured");
    return true; // Allow if no secret configured (development)
  }

  // Get the X-Telegram-Bot-Api-Secret-Token header
  const headerToken = request.headers.get("X-Telegram-Bot-Api-Secret-Token");

  if (!headerToken) {
    console.error("[Telegram Webhook] Missing secret token header");
    return false;
  }

  // Compare tokens
  return headerToken === secretToken;
}

/**
 * POST /api/telegram/webhook
 * Receives updates from Telegram
 */
export async function POST(request: NextRequest) {
  try {
    // Check if bot is enabled
    if (process.env.TELEGRAM_BOT_ENABLED !== "true") {
      console.log("[Telegram Webhook] Bot disabled");
      return NextResponse.json(
        { success: false, error: "Bot disabled" },
        { status: 503 }
      );
    }

    // Verify request is from Telegram
    if (!verifyTelegramRequest(request)) {
      console.error("[Telegram Webhook] Invalid request - secret token mismatch");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse update
    const update = await request.json();

    // Extract chat ID for rate limiting
    const chatId =
      update?.message?.chat?.id ||
      update?.callback_query?.message?.chat?.id ||
      update?.edited_message?.chat?.id;

    // Apply rate limiting if we have a chat ID
    if (chatId) {
      const { allowed, remaining } = checkRateLimit(chatId);

      if (!allowed) {
        console.warn(`[Telegram Webhook] Rate limit exceeded for chat ${chatId}`);

        // Silently accept but don't process (prevents Telegram from retrying)
        // User will see no response for excessive spam
        return NextResponse.json({
          success: true,
          rate_limited: true,
        });
      }
    }

    console.log(
      `[Telegram Webhook] Received update:`,
      JSON.stringify(update, null, 2).substring(0, 200)
    );

    // Process update
    await processUpdate(update);

    // Return success
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Telegram Webhook] Error processing update:", error);

    // Log error details
    if (error.message) {
      console.error("[Telegram Webhook] Error message:", error.message);
    }

    if (error.stack) {
      console.error("[Telegram Webhook] Stack trace:", error.stack);
    }

    // Return 200 to prevent Telegram from retrying
    // (errors should be logged but not retried)
    return NextResponse.json({
      success: false,
      error: "Internal error",
    });
  }
}

/**
 * GET /api/telegram/webhook
 * Get webhook status (for debugging)
 */
export async function GET(request: NextRequest) {
  try {
    if (!bot) {
      return NextResponse.json({
        enabled: false,
        message: "Bot not initialized",
      });
    }

    const botInfo = await bot.telegram.getMe();

    return NextResponse.json({
      enabled: process.env.TELEGRAM_BOT_ENABLED === "true",
      botUsername: botInfo.username,
      botName: botInfo.first_name,
      message: "Webhook endpoint ready",
    });
  } catch (error: any) {
    console.error("[Telegram Webhook] GET error:", error);

    return NextResponse.json({
      enabled: process.env.TELEGRAM_BOT_ENABLED === "true",
      error: error.message,
    });
  }
}

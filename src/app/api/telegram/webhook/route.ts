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

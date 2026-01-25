/**
 * Telegram Session Cleanup Cron Job
 * Removes expired Telegram sessions
 *
 * Run: Every hour
 * Route: GET /api/cron/telegram-cleanup
 */

import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredSessions } from "@/lib/telegram/middleware/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Verify cron job authorization (same as other cron jobs)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error("[Telegram Cleanup] Unauthorized cron request");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[Telegram Cleanup] Starting cleanup...");

    // Clean up expired sessions
    const deletedCount = await cleanupExpiredSessions();

    console.log(`[Telegram Cleanup] Cleaned up ${deletedCount} expired sessions`);

    return NextResponse.json({
      success: true,
      deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Telegram Cleanup] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

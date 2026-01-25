/**
 * Telegram Bot Authentication Middleware
 * Handles user authentication and session management
 */

import { Context, Middleware } from "telegraf";
import { prisma } from "@/lib/db";
import { Language } from "../messages";

// Extend Telegraf context with our custom properties
export interface TelegramContext extends Context {
  session?: {
    id: string;
    userId?: string;
    state: string;
    language: Language;
    data: any;
  };
  dbSession?: any;
  dbUser?: any;
}

/**
 * Session middleware - loads or creates session for each user
 */
export const sessionMiddleware: Middleware<TelegramContext> = async (ctx, next) => {
  const chatId = ctx.chat?.id;

  if (!chatId) {
    return next();
  }

  try {
    // Find or create session
    let session = await prisma.telegramSession.findUnique({
      where: { chatId: BigInt(chatId) },
      include: { user: true },
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes

    if (!session) {
      // Create new session
      session = await prisma.telegramSession.create({
        data: {
          chatId: BigInt(chatId),
          sessionId: `tg_${chatId}_${Date.now()}`,
          state: "IDLE",
          language: "EN",
          lastMessageAt: now,
          expiresAt,
          messageCount: 1,
        },
        include: { user: true },
      });
    } else {
      // Check if session expired
      if (session.expiresAt < now) {
        // Reset expired session
        session = await prisma.telegramSession.update({
          where: { chatId: BigInt(chatId) },
          data: {
            state: "IDLE",
            origin: null,
            destination: null,
            date: null,
            selectedTripId: null,
            passengerCount: 0,
            seatPreference: null,
            passengerData: null,
            currentPassengerIndex: 0,
            selectedSeats: null,
            bookingId: null,
            paymentTransactionId: null,
            lastMessageAt: now,
            expiresAt,
            messageCount: 1,
          },
          include: { user: true },
        });
      } else {
        // Update session activity
        session = await prisma.telegramSession.update({
          where: { chatId: BigInt(chatId) },
          data: {
            lastMessageAt: now,
            expiresAt,
            messageCount: { increment: 1 },
          },
          include: { user: true },
        });
      }
    }

    // Attach session to context
    ctx.dbSession = session;
    ctx.dbUser = session.user;

    // Create simplified session object
    ctx.session = {
      id: session.id,
      userId: session.userId || undefined,
      state: session.state,
      language: (session.language as Language) || "EN",
      data: {
        origin: session.origin,
        destination: session.destination,
        date: session.date,
        selectedTripId: session.selectedTripId,
        passengerCount: session.passengerCount,
        seatPreference: session.seatPreference,
        passengerData: session.passengerData ? JSON.parse(session.passengerData) : null,
        currentPassengerIndex: session.currentPassengerIndex,
        selectedSeats: session.selectedSeats ? JSON.parse(session.selectedSeats) : null,
        bookingId: session.bookingId,
        paymentTransactionId: session.paymentTransactionId,
      },
    };

    await next();
  } catch (error) {
    console.error("[Telegram Auth] Session middleware error:", error);
    // Don't call next() again - if we're in catch, either:
    // 1. Error happened before next() - handlers shouldn't run with broken session
    // 2. Error happened during/after next() - calling again causes "next() called multiple times"
  }
};

/**
 * Update session state
 */
export async function updateSessionState(
  chatId: number,
  state: string,
  data?: Record<string, any>
) {
  try {
    const updateData: any = { state };

    if (data) {
      // Map data fields to database fields
      if (data.origin !== undefined) updateData.origin = data.origin;
      if (data.destination !== undefined) updateData.destination = data.destination;
      if (data.date !== undefined) updateData.date = data.date;
      if (data.selectedTripId !== undefined) updateData.selectedTripId = data.selectedTripId;
      if (data.passengerCount !== undefined) updateData.passengerCount = data.passengerCount;
      if (data.seatPreference !== undefined) updateData.seatPreference = data.seatPreference;
      if (data.passengerData !== undefined) {
        updateData.passengerData = JSON.stringify(data.passengerData);
      }
      if (data.currentPassengerIndex !== undefined) {
        updateData.currentPassengerIndex = data.currentPassengerIndex;
      }
      if (data.selectedSeats !== undefined) {
        updateData.selectedSeats = JSON.stringify(data.selectedSeats);
      }
      if (data.bookingId !== undefined) updateData.bookingId = data.bookingId;
      if (data.paymentTransactionId !== undefined) {
        updateData.paymentTransactionId = data.paymentTransactionId;
      }
    }

    await prisma.telegramSession.update({
      where: { chatId: BigInt(chatId) },
      data: updateData,
    });
  } catch (error) {
    console.error("[Telegram Auth] Update session state error:", error);
    throw error;
  }
}

/**
 * Update session language
 */
export async function updateSessionLanguage(chatId: number, language: Language) {
  try {
    await prisma.telegramSession.update({
      where: { chatId: BigInt(chatId) },
      data: { language },
    });
  } catch (error) {
    console.error("[Telegram Auth] Update language error:", error);
    throw error;
  }
}

/**
 * Link Telegram session to user account
 */
export async function linkSessionToUser(chatId: number, userId: string) {
  try {
    await prisma.telegramSession.update({
      where: { chatId: BigInt(chatId) },
      data: { userId },
    });
  } catch (error) {
    console.error("[Telegram Auth] Link user error:", error);
    throw error;
  }
}

/**
 * Verify and process phone number from Telegram
 */
export async function verifyPhoneNumber(
  chatId: number,
  phone: string
): Promise<{ user: any; isNew: boolean }> {
  try {
    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizedPhone = phone.replace(/\D/g, "");

    // Validate Ethiopian phone format (09XXXXXXXX or 251XXXXXXXXX)
    let formattedPhone = normalizedPhone;

    if (normalizedPhone.startsWith("251") && normalizedPhone.length === 12) {
      // Convert 251XXXXXXXXX to 09XXXXXXXX
      formattedPhone = "0" + normalizedPhone.substring(3);
    }

    if (!formattedPhone.startsWith("09") || formattedPhone.length !== 10) {
      throw new Error("Invalid Ethiopian phone number format");
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { phone: formattedPhone },
    });

    let isNew = false;

    if (!user) {
      // Create guest user
      user = await prisma.user.create({
        data: {
          phone: formattedPhone,
          role: "CUSTOMER",
          isGuestUser: true,
        },
      });
      isNew = true;
    }

    // Link session to user
    await linkSessionToUser(chatId, user.id);

    return { user, isNew };
  } catch (error) {
    console.error("[Telegram Auth] Verify phone error:", error);
    throw error;
  }
}

/**
 * Check if user is authenticated (has phone number)
 */
export function isAuthenticated(ctx: TelegramContext): boolean {
  return !!ctx.dbUser;
}

/**
 * Middleware to require authentication
 */
export const requireAuth: Middleware<TelegramContext> = async (ctx, next) => {
  if (!isAuthenticated(ctx)) {
    const lang = ctx.session?.language || "EN";

    await ctx.reply(
      lang === "EN"
        ? "⚠️ Please share your phone number first to use this feature.\n\nUse /start to begin."
        : "⚠️ ይህንን ባህሪ ለመጠቀም በመጀመሪያ የስልክ ቁጥርዎን ያጋሩ።\n\nለመጀመር /start ይጠቀሙ።"
    );
    return;
  }

  await next();
};

/**
 * Reset session to idle state
 */
export async function resetSession(chatId: number) {
  try {
    await prisma.telegramSession.update({
      where: { chatId: BigInt(chatId) },
      data: {
        state: "IDLE",
        origin: null,
        destination: null,
        date: null,
        selectedTripId: null,
        passengerCount: 0,
        seatPreference: null,
        passengerData: null,
        currentPassengerIndex: 0,
        selectedSeats: null,
        bookingId: null,
        paymentTransactionId: null,
      },
    });
  } catch (error) {
    console.error("[Telegram Auth] Reset session error:", error);
    throw error;
  }
}

/**
 * Get session data helper
 */
export function getSessionData<T = any>(ctx: TelegramContext, key: string): T | null {
  return ctx.session?.data?.[key] || null;
}

/**
 * Set session data helper - updates a single data field without changing state
 */
export async function setSessionData(
  chatId: number,
  key: string,
  value: any
) {
  // Get current state first to avoid overwriting it
  const session = await prisma.telegramSession.findUnique({
    where: { chatId: BigInt(chatId) },
    select: { state: true },
  });
  const currentState = session?.state || "IDLE";
  await updateSessionState(chatId, currentState, { [key]: value });
}

/**
 * Clean up expired sessions (cron job)
 */
export async function cleanupExpiredSessions() {
  try {
    const result = await prisma.telegramSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    console.log(`[Telegram Auth] Cleaned up ${result.count} expired sessions`);
    return result.count;
  } catch (error) {
    console.error("[Telegram Auth] Cleanup error:", error);
    throw error;
  }
}

import prisma from "@/lib/db";
import type { SmsSession } from "@prisma/client";
import crypto from "crypto";

/**
 * Session expiry time in minutes
 */
const SESSION_TIMEOUT_MINUTES = 15;

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString('hex');
  return `sess_${timestamp}_${random}`;
}

/**
 * Get or create SMS session for a phone number
 *
 * @param phone - User's phone number (09XXXXXXXX)
 * @returns Active session or new session
 */
export async function getOrCreateSession(phone: string): Promise<SmsSession> {
  // Try to find active session
  const existingSession = await prisma.smsSession.findFirst({
    where: {
      phone,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (existingSession) {
    return existingSession;
  }

  // Create new session
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MINUTES * 60 * 1000);

  const newSession = await prisma.smsSession.create({
    data: {
      phone,
      sessionId,
      state: 'IDLE',
      language: 'EN', // Default, will be detected from first message
      expiresAt,
    }
  });

  console.log(`[SMS Session] Created new session for ${phone}: ${sessionId}`);

  return newSession;
}

/**
 * Update session state
 *
 * @param sessionId - Session ID
 * @param updates - Fields to update
 * @returns Updated session
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<SmsSession>
): Promise<SmsSession> {
  const newExpiresAt = new Date(Date.now() + SESSION_TIMEOUT_MINUTES * 60 * 1000);

  const updatedSession = await prisma.smsSession.update({
    where: { sessionId },
    data: {
      ...updates,
      lastMessageAt: new Date(),
      expiresAt: newExpiresAt,
      messageCount: { increment: 1 }
    }
  });

  return updatedSession;
}

/**
 * Get session by session ID
 *
 * @param sessionId - Session ID
 * @returns Session or null if not found/expired
 */
export async function getSession(sessionId: string): Promise<SmsSession | null> {
  const session = await prisma.smsSession.findUnique({
    where: { sessionId }
  });

  // Check if expired
  if (session && session.expiresAt < new Date()) {
    console.log(`[SMS Session] Session ${sessionId} has expired`);
    return null;
  }

  return session;
}

/**
 * Clear/delete session
 *
 * @param sessionId - Session ID
 */
export async function clearSession(sessionId: string): Promise<void> {
  await prisma.smsSession.delete({
    where: { sessionId }
  }).catch(() => {
    // Session may not exist, ignore error
  });

  console.log(`[SMS Session] Cleared session ${sessionId}`);
}

/**
 * Store passenger data in session
 *
 * @param sessionId - Session ID
 * @param passengers - Array of passenger objects
 */
export async function storePassengerData(
  sessionId: string,
  passengers: Array<{ name: string; id: string }>
): Promise<void> {
  await prisma.smsSession.update({
    where: { sessionId },
    data: {
      passengerData: JSON.stringify(passengers)
    }
  });
}

/**
 * Get passenger data from session
 *
 * @param session - Session object
 * @returns Array of passengers or empty array
 */
export function getPassengerData(session: SmsSession): Array<{ name: string; id: string }> {
  if (!session.passengerData) {
    return [];
  }

  try {
    return JSON.parse(session.passengerData);
  } catch (error) {
    console.error('[SMS Session] Failed to parse passenger data:', error);
    return [];
  }
}

/**
 * Add single passenger to session data
 *
 * @param session - Session object
 * @param passenger - Passenger object
 * @returns Updated session
 */
export async function addPassenger(
  session: SmsSession,
  passenger: { name: string; id: string }
): Promise<SmsSession> {
  const passengers = getPassengerData(session);
  passengers.push(passenger);

  return await prisma.smsSession.update({
    where: { sessionId: session.sessionId },
    data: {
      passengerData: JSON.stringify(passengers),
      currentPassengerIndex: passengers.length
    }
  });
}

/**
 * Check if all passengers have been collected
 *
 * @param session - Session object
 * @returns true if all passengers collected
 */
export function allPassengersCollected(session: SmsSession): boolean {
  const passengers = getPassengerData(session);
  return passengers.length >= session.passengerCount;
}

/**
 * Cleanup expired sessions
 *
 * Should be run periodically (e.g., via cron job)
 *
 * @returns Number of sessions deleted
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.smsSession.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  });

  if (result.count > 0) {
    console.log(`[SMS Session] Cleaned up ${result.count} expired sessions`);
  }

  return result.count;
}

/**
 * Get active session count (for monitoring)
 *
 * @returns Number of active sessions
 */
export async function getActiveSessionCount(): Promise<number> {
  return await prisma.smsSession.count({
    where: {
      expiresAt: { gt: new Date() }
    }
  });
}

/**
 * Get session statistics
 *
 * @returns Session stats object
 */
export async function getSessionStats() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const [
    activeCount,
    totalCount,
    recentCount
  ] = await Promise.all([
    prisma.smsSession.count({
      where: { expiresAt: { gt: now } }
    }),
    prisma.smsSession.count(),
    prisma.smsSession.count({
      where: { createdAt: { gte: oneHourAgo } }
    })
  ]);

  return {
    active: activeCount,
    total: totalCount,
    lastHour: recentCount,
    timestamp: now.toISOString()
  };
}

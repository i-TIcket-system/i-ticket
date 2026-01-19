import prisma from "@/lib/db"
import { Prisma } from "@prisma/client"

/**
 * Safely creates an admin log entry without throwing errors.
 * Failures are logged to console but don't interrupt business logic.
 *
 * Use this for non-critical audit logging where failures shouldn't
 * break the main operation.
 *
 * @example
 * await safeAdminLog({
 *   userId: session.user.id,
 *   companyId: session.user.companyId,
 *   action: "TRIP_CREATED",
 *   details: { tripId: trip.id }
 * })
 */
export async function safeAdminLog(data: Prisma.AdminLogCreateInput): Promise<void> {
  try {
    await prisma.adminLog.create({ data })
  } catch (error) {
    console.error('[AdminLog] Failed to create audit log:', error)
    console.error('[AdminLog] Data:', JSON.stringify(data, null, 2))
    // Don't throw - audit logs are non-critical
  }
}

/**
 * Creates an admin log entry within an existing Prisma transaction.
 * Failures are logged to console but don't interrupt the transaction.
 *
 * Use this when you need to log actions as part of a larger transaction.
 *
 * @example
 * await prisma.$transaction(async (tx) => {
 *   const booking = await tx.booking.create({ data: bookingData })
 *   await transactionalAdminLog(tx, {
 *     userId: session.user.id,
 *     action: "BOOKING_CREATED",
 *     details: { bookingId: booking.id }
 *   })
 * })
 */
export async function transactionalAdminLog(
  tx: Prisma.TransactionClient,
  data: Prisma.AdminLogCreateInput
): Promise<void> {
  try {
    await tx.adminLog.create({ data })
  } catch (error) {
    console.error('[AdminLog] Failed to create transactional audit log:', error)
    console.error('[AdminLog] Data:', JSON.stringify(data, null, 2))
    // Don't throw - audit logs are non-critical
  }
}

/**
 * Type alias for better readability when passing transaction clients
 */
export type TransactionClient = Prisma.TransactionClient

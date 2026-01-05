import crypto from 'crypto'
import prisma from '@/lib/db'

/**
 * Generate deterministic hash of callback payload
 * Used for exact replay detection
 */
export function generateCallbackHash(payload: Record<string, any>): string {
  // Sort keys for deterministic hash
  const sorted = Object.keys(payload).sort().reduce((acc, key) => {
    // Skip signature field
    if (key !== 'signature') {
      acc[key] = payload[key]
    }
    return acc
  }, {} as Record<string, any>)

  const content = JSON.stringify(sorted)
  return crypto.createHash('sha256').update(content).digest('hex')
}

/**
 * Check if callback has already been processed
 * Returns: { processed: boolean, existingRecord?: ProcessedCallback }
 */
export async function isCallbackProcessed(
  transactionId: string,
  callbackHash: string
): Promise<{ processed: boolean, existingRecord?: any }> {
  // Check by transaction ID first (fast index lookup)
  const byTransactionId = await prisma.processedCallback.findUnique({
    where: { transactionId }
  })

  if (byTransactionId) {
    return { processed: true, existingRecord: byTransactionId }
  }

  // Check by callback hash (detects replays with different transaction IDs)
  const byHash = await prisma.processedCallback.findUnique({
    where: { callbackHash }
  })

  if (byHash) {
    return { processed: true, existingRecord: byHash }
  }

  return { processed: false }
}

/**
 * Record processed callback (idempotency key)
 */
export async function recordProcessedCallback(
  transactionId: string,
  bookingId: string,
  callbackHash: string,
  payload: any,
  status: string,
  amount: number,
  signature: string
): Promise<void> {
  await prisma.processedCallback.create({
    data: {
      transactionId,
      bookingId,
      callbackHash,
      nonce: payload.nonce || null,
      status,
      amount,
      signature,
      rawPayload: JSON.stringify(payload)
    }
  })
}

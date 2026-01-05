import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'

/**
 * Generate cryptographically secure reset token
 * Returns: { token: string (plain), tokenHash: string (for storage) }
 */
export function generateResetToken(): { token: string; tokenHash: string } {
  // Generate 32-byte random token
  const token = crypto.randomBytes(32).toString('hex') // 64 character hex string

  // Hash token before storage (prevents token theft from database)
  const tokenHash = bcrypt.hashSync(token, 10)

  return { token, tokenHash }
}

/**
 * Create password reset request
 */
export async function createPasswordReset(
  userId: string,
  expiryHours: number = 1
): Promise<{ token: string; expiresAt: Date }> {
  const { token, tokenHash } = generateResetToken()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + expiryHours)

  // Invalidate any existing unused tokens for this user
  await prisma.passwordReset.updateMany({
    where: {
      userId,
      isUsed: false,
      expiresAt: { gt: new Date() }
    },
    data: {
      isUsed: true,
      usedAt: new Date()
    }
  })

  // Create new reset token
  await prisma.passwordReset.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  })

  return { token, expiresAt }
}

/**
 * Verify and consume reset token
 * Returns userId if valid, null if invalid/expired/used
 */
export async function verifyResetToken(token: string): Promise<string | null> {
  // Find all non-used, non-expired reset tokens
  const activeResets = await prisma.passwordReset.findMany({
    where: {
      isUsed: false,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      user: {
        select: { id: true }
      }
    }
  })

  // Check each token hash (bcrypt compare)
  for (const reset of activeResets) {
    const isValid = await bcrypt.compare(token, reset.tokenHash)

    if (isValid) {
      // Mark as used immediately (prevents reuse)
      await prisma.passwordReset.update({
        where: { id: reset.id },
        data: {
          isUsed: true,
          usedAt: new Date()
        }
      })

      return reset.userId
    }
  }

  return null
}

/**
 * Clean up expired reset tokens (call via cron)
 */
export async function cleanupExpiredResetTokens(): Promise<number> {
  const result = await prisma.passwordReset.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        {
          isUsed: true,
          usedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // 7 days old
        }
      ]
    }
  })

  return result.count
}

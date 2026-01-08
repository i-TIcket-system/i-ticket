import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma

// P2: Transaction timeout utility (10 seconds max)
export async function transactionWithTimeout<T>(
  callback: (tx: any) => Promise<T>,
  timeoutMs: number = 10000 // 10 seconds default
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Transaction timeout exceeded'))
    }, timeoutMs)
  })

  const transactionPromise = prisma.$transaction(callback, {
    maxWait: 5000, // Max time to wait for transaction to start (5s)
    timeout: timeoutMs, // Max time for transaction to complete (10s)
  })

  return Promise.race([transactionPromise, timeoutPromise])
}

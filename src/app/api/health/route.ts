import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Health Check API
 * Used by Render, AWS, and monitoring services to verify app status
 *
 * GET /api/health
 *
 * Returns:
 * - 200 OK: App is healthy, database connected
 * - 503 Service Unavailable: Database connection failed
 */
export async function GET() {
  const startTime = Date.now()

  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '2.6.0',
      database: 'connected',
      responseTime: `${responseTime}ms`,
    })
  } catch (error) {
    const responseTime = Date.now() - startTime

    console.error('Health check failed:', error)

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: 'disconnected',
        responseTime: `${responseTime}ms`,
        error: 'Database connection failed',
      },
      { status: 503 }
    )
  }
}

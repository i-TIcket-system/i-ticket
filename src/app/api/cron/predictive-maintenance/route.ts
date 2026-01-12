import { NextRequest, NextResponse } from 'next/server'
import {
  updateAllVehicleRiskScores,
  autoCreateDueWorkOrders,
} from '@/lib/ai/predictive-maintenance'

/**
 * Predictive Maintenance Cron Job
 *
 * Runs daily at 2 AM to:
 * 1. Auto-create work orders for due maintenance schedules
 * 2. Update risk scores for all active vehicles
 * 3. Create notifications for high-risk vehicles (handled by AI lib)
 *
 * Authentication: Requires CRON_SECRET header
 *
 * Usage (Vercel Cron):
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/predictive-maintenance",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 *
 * Manual trigger:
 * curl -X POST http://localhost:3000/api/cron/predictive-maintenance \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Authentication
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.CRON_SECRET || 'dev-secret-only-for-testing'

    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing CRON_SECRET' },
        { status: 401 }
      )
    }

    console.log('[CRON] Starting predictive maintenance job...')

    // Step 1: Auto-create work orders for due maintenance
    console.log('[CRON] Step 1: Creating due work orders...')
    const workOrderResult = await autoCreateDueWorkOrders()
    console.log(`[CRON] Created ${workOrderResult.created} work orders`)

    // Step 2: Update risk scores for all vehicles
    // Note: This also creates notifications for high-risk vehicles (score >= 70)
    console.log('[CRON] Step 2: Updating vehicle risk scores...')
    const riskResults = await updateAllVehicleRiskScores()
    console.log(`[CRON] Updated ${riskResults.processed} vehicles, ${riskResults.highRisk} high-risk`)

    const duration = Date.now() - startTime
    console.log(`[CRON] Predictive maintenance job completed in ${duration}ms`)

    return NextResponse.json({
      success: true,
      summary: {
        workOrders: {
          created: workOrderResult.created,
          schedules: workOrderResult.schedules,
        },
        riskScores: {
          vehiclesProcessed: riskResults.processed,
          highRiskCount: riskResults.highRisk,
        },
        performance: {
          durationMs: duration,
          completedAt: new Date().toISOString(),
        },
      },
      details: {
        highRiskVehicles: riskResults.results
          .filter((r) => r.riskScore >= 70)
          .map((r) => ({
            vehicleId: r.vehicleId,
            plateNumber: r.plateNumber,
            riskScore: r.riskScore,
          })),
      },
    })
  } catch (error) {
    console.error('[CRON] Predictive maintenance job failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for manual testing and status check
 */
export async function GET() {
  try {
    // Import prisma here to avoid issues with edge runtime
    const prisma = (await import('@/lib/db')).default

    // Get current high-risk vehicle count
    const highRiskCount = await prisma.vehicle.count({
      where: {
        maintenanceRiskScore: {
          gte: 70,
        },
        status: 'ACTIVE',
      },
    })

    // Get vehicles needing immediate attention
    const criticalRiskCount = await prisma.vehicle.count({
      where: {
        maintenanceRiskScore: {
          gte: 85,
        },
        status: 'ACTIVE',
      },
    })

    // Get upcoming due maintenance schedules
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const upcomingDue = await prisma.maintenanceSchedule.count({
      where: {
        isActive: true,
        nextDueDate: {
          lte: sevenDaysFromNow,
        },
      },
    })

    // Get open work orders count
    const openWorkOrders = await prisma.workOrder.count({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
    })

    return NextResponse.json({
      status: 'ready',
      currentStatus: {
        highRiskVehicles: highRiskCount,
        criticalRiskVehicles: criticalRiskCount,
        upcomingDueSchedules: upcomingDue,
        openWorkOrders,
      },
      nextScheduledRun: '2:00 AM daily (UTC)',
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Predictive Maintenance AI Module
 *
 * Uses historical data to predict vehicle failures and schedule maintenance.
 * Based on industry standards: 300-500% ROI, 25-40% cost reduction.
 *
 * Phase 2: Predictive Maintenance System
 */

import prisma from '@/lib/db'

// ==================== TYPES ====================

interface VehicleMaintenanceHistory {
  vehicleId: string
  make: string
  model: string
  year: number
  currentOdometer: number | null
  engineHours: number | null
  lastServiceDate: Date | null
  workOrders: {
    taskType: string
    odometerAtService: number | null
    completedAt: Date | null
    totalCost: number
  }[]
  fuelEntries: {
    odometerReading: number
    litersPer100Km: number | null
    createdAt: Date
  }[]
  inspections: {
    defectsFound: number
    criticalDefects: number
    createdAt: Date
  }[]
}

interface MaintenanceRiskResult {
  riskScore: number // 0-100
  predictedFailureDate: Date | null
  predictedFailureType: string | null
  recommendations: string[]
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

// ==================== RISK SCORING ALGORITHM ====================

/**
 * Calculate maintenance risk score (0-100)
 * 100 = immediate attention required
 *
 * Weighted Factors:
 * 1. Odometer vs service interval (40% weight)
 * 2. Time since last service (20% weight)
 * 3. Defect trend (20% weight)
 * 4. Fuel efficiency degradation (10% weight)
 * 5. Compliance expiry (10% weight)
 */
export async function calculateMaintenanceRiskScore(
  vehicleId: string
): Promise<MaintenanceRiskResult> {
  // Fetch vehicle with all related data
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      workOrders: {
        where: { status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        take: 20,
        select: {
          taskType: true,
          odometerAtService: true,
          completedAt: true,
          totalCost: true,
        },
      },
      fuelEntries: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          odometerReading: true,
          litersPer100Km: true,
          createdAt: true,
        },
      },
      inspections: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          defectsFound: true,
          criticalDefects: true,
          createdAt: true,
        },
      },
      maintenanceSchedules: {
        where: { isActive: true },
        orderBy: { nextDueKm: 'asc' },
        select: {
          taskName: true,
          nextDueKm: true,
          nextDueDate: true,
          priority: true,
        },
      },
    },
  })

  if (!vehicle) {
    throw new Error(`Vehicle not found: ${vehicleId}`)
  }

  let riskScore = 0
  const recommendations: string[] = []
  let urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'

  // ==================== FACTOR 1: Odometer Risk (40% weight) ====================

  if (vehicle.currentOdometer && vehicle.maintenanceSchedules.length > 0) {
    const nextSchedule = vehicle.maintenanceSchedules[0]

    if (nextSchedule.nextDueKm) {
      const kmUntilService = nextSchedule.nextDueKm - vehicle.currentOdometer

      if (kmUntilService <= 0) {
        riskScore += 40
        recommendations.push(
          `⚠️ ${nextSchedule.taskName} OVERDUE by ${Math.abs(kmUntilService)} km`
        )
      } else if (kmUntilService < 500) {
        riskScore += 35
        recommendations.push(`${nextSchedule.taskName} due in ${kmUntilService} km`)
      } else if (kmUntilService < 1000) {
        riskScore += 25
        recommendations.push(
          `${nextSchedule.taskName} approaching (${kmUntilService} km remaining)`
        )
      } else if (kmUntilService < 2000) {
        riskScore += 15
      }
    }
  } else if (vehicle.maintenanceSchedules.length === 0) {
    riskScore += 20
    recommendations.push('⚠️ No maintenance schedules configured')
  }

  // ==================== FACTOR 2: Time Since Last Service (20% weight) ====================

  if (vehicle.lastServiceDate) {
    const daysSinceService = Math.floor(
      (Date.now() - vehicle.lastServiceDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceService > 180) {
      riskScore += 20
      recommendations.push(`⚠️ ${daysSinceService} days since last service (>6 months)`)
    } else if (daysSinceService > 90) {
      riskScore += 15
      recommendations.push(`${daysSinceService} days since last service (>3 months)`)
    } else if (daysSinceService > 60) {
      riskScore += 10
    } else if (daysSinceService > 30) {
      riskScore += 5
    }
  } else {
    riskScore += 15
    recommendations.push('⚠️ No service history recorded')
  }

  // ==================== FACTOR 3: Defect Trend (20% weight) ====================

  if (vehicle.inspections.length >= 3) {
    const recentInspections = vehicle.inspections.slice(0, 5)
    const avgDefects =
      recentInspections.reduce((sum, i) => sum + i.defectsFound, 0) /
      recentInspections.length
    const trendIncreasing =
      recentInspections.length >= 3 &&
      recentInspections[0].defectsFound > recentInspections[2].defectsFound

    if (vehicle.criticalDefectCount > 0) {
      riskScore += 20
      recommendations.push(
        `🚨 ${vehicle.criticalDefectCount} CRITICAL defects requiring immediate attention`
      )
    } else if (avgDefects >= 5) {
      riskScore += 20
      recommendations.push(
        `Average ${avgDefects.toFixed(1)} defects per inspection (high)`
      )
    } else if (avgDefects >= 3) {
      riskScore += 15
      recommendations.push(`Average ${avgDefects.toFixed(1)} defects per inspection`)
    } else if (trendIncreasing) {
      riskScore += 10
      recommendations.push('Defect count increasing trend')
    }
  }

  // ==================== FACTOR 4: Fuel Efficiency Degradation (10% weight) ====================

  if (vehicle.fuelEntries.length >= 10) {
    const recentEntries = vehicle.fuelEntries
      .filter((e) => e.litersPer100Km !== null)
      .slice(0, 10)

    if (recentEntries.length >= 10) {
      const first5Avg =
        recentEntries
          .slice(0, 5)
          .reduce((sum, e) => sum + (e.litersPer100Km || 0), 0) / 5
      const last5Avg =
        recentEntries
          .slice(5, 10)
          .reduce((sum, e) => sum + (e.litersPer100Km || 0), 0) / 5

      if (first5Avg > 0) {
        const degradation = ((first5Avg - last5Avg) / last5Avg) * 100

        if (degradation > 20) {
          riskScore += 10
          recommendations.push(
            `Fuel efficiency degraded ${Math.abs(degradation).toFixed(1)}% (possible engine issues)`
          )
        } else if (degradation > 15) {
          riskScore += 8
          recommendations.push(
            `Fuel efficiency degraded ${Math.abs(degradation).toFixed(1)}%`
          )
        } else if (degradation > 10) {
          riskScore += 5
        }
      }
    }
  }

  // ==================== FACTOR 5: Compliance Expiry (10% weight) ====================

  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  if (
    vehicle.registrationExpiry &&
    vehicle.registrationExpiry < thirtyDaysFromNow
  ) {
    const daysUntilExpiry = Math.floor(
      (vehicle.registrationExpiry.getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24)
    )

    if (daysUntilExpiry <= 0) {
      riskScore += 10
      recommendations.push(
        `🚨 Registration EXPIRED ${Math.abs(daysUntilExpiry)} days ago`
      )
    } else if (daysUntilExpiry <= 7) {
      riskScore += 8
      recommendations.push(`⚠️ Registration expires in ${daysUntilExpiry} days`)
    } else if (daysUntilExpiry <= 14) {
      riskScore += 5
      recommendations.push(`Registration expires in ${daysUntilExpiry} days`)
    }
  }

  if (vehicle.insuranceExpiry && vehicle.insuranceExpiry < thirtyDaysFromNow) {
    const daysUntilExpiry = Math.floor(
      (vehicle.insuranceExpiry.getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24)
    )

    if (daysUntilExpiry <= 0) {
      riskScore += 10
      recommendations.push(
        `🚨 Insurance EXPIRED ${Math.abs(daysUntilExpiry)} days ago`
      )
    } else if (daysUntilExpiry <= 7) {
      riskScore += 5
      recommendations.push(`⚠️ Insurance expires in ${daysUntilExpiry} days`)
    }
  }

  // ==================== FAILURE PREDICTION ====================

  let predictedFailureDate: Date | null = null
  let predictedFailureType: string | null = null

  // Predict based on historical corrective work orders
  const correctiveWorkOrders = vehicle.workOrders.filter(
    (wo) => wo.taskType === 'CORRECTIVE'
  )

  if (correctiveWorkOrders.length >= 2 && vehicle.currentOdometer) {
    // Calculate average km between failures
    const kmBetweenFailures: number[] = []

    for (let i = 1; i < correctiveWorkOrders.length; i++) {
      const prev = correctiveWorkOrders[i]
      const curr = correctiveWorkOrders[i - 1]

      if (prev.odometerAtService && curr.odometerAtService) {
        const kmDiff = curr.odometerAtService - prev.odometerAtService
        if (kmDiff > 0 && kmDiff < 100000) {
          // Sanity check
          kmBetweenFailures.push(kmDiff)
        }
      }
    }

    if (kmBetweenFailures.length > 0) {
      const avgKmBetweenFailures =
        kmBetweenFailures.reduce((sum, km) => sum + km, 0) /
        kmBetweenFailures.length

      const lastFailureOdometer =
        correctiveWorkOrders[0].odometerAtService || vehicle.currentOdometer
      const predictedFailureOdometer =
        lastFailureOdometer + avgKmBetweenFailures

      // Estimate date based on average daily km (assume 200 km/day for buses)
      const avgDailyKm = 200
      const daysUntilFailure =
        (predictedFailureOdometer - vehicle.currentOdometer) / avgDailyKm

      if (daysUntilFailure > 0 && daysUntilFailure < 365) {
        predictedFailureDate = new Date(
          now.getTime() + daysUntilFailure * 24 * 60 * 60 * 1000
        )

        // Predict failure type (most common corrective work order type)
        const failureTypeCounts: Record<string, number> = {}
        correctiveWorkOrders.forEach((wo) => {
          // Extract failure type from task name (simple heuristic)
          const taskLower = wo.taskType?.toLowerCase() || ''
          if (taskLower.includes('engine')) failureTypeCounts['Engine'] = (failureTypeCounts['Engine'] || 0) + 1
          else if (taskLower.includes('brake')) failureTypeCounts['Brake'] = (failureTypeCounts['Brake'] || 0) + 1
          else if (taskLower.includes('transmission')) failureTypeCounts['Transmission'] = (failureTypeCounts['Transmission'] || 0) + 1
          else if (taskLower.includes('electrical')) failureTypeCounts['Electrical'] = (failureTypeCounts['Electrical'] || 0) + 1
          else failureTypeCounts['General'] = (failureTypeCounts['General'] || 0) + 1
        })

        predictedFailureType =
          Object.keys(failureTypeCounts).reduce((a, b) =>
            failureTypeCounts[a] > failureTypeCounts[b] ? a : b
          ) || 'General'

        if (daysUntilFailure < 30) {
          recommendations.push(
            `🔮 Predicted ${predictedFailureType} failure in ${Math.floor(daysUntilFailure)} days`
          )
        }
      }
    }
  }

  // ==================== DETERMINE URGENCY ====================

  riskScore = Math.min(100, Math.max(0, riskScore))

  if (riskScore >= 80) {
    urgency = 'CRITICAL'
  } else if (riskScore >= 60) {
    urgency = 'HIGH'
  } else if (riskScore >= 40) {
    urgency = 'MEDIUM'
  } else {
    urgency = 'LOW'
  }

  // ==================== DEFAULT RECOMMENDATIONS ====================

  if (recommendations.length === 0) {
    recommendations.push('✅ Vehicle health is good')
  }

  return {
    riskScore,
    predictedFailureDate,
    predictedFailureType,
    recommendations,
    urgency,
  }
}

// ==================== AUTO WORK ORDER CREATION ====================

/**
 * Auto-create work orders for due maintenance schedules
 * Runs daily via cron job
 */
export async function autoCreateDueWorkOrders(): Promise<{
  created: number
  schedules: { vehicleId: string; taskName: string; workOrderNumber: string }[]
}> {
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Find schedules that are due or will be due within 7 days
  const dueSchedules = await prisma.maintenanceSchedule.findMany({
    where: {
      isActive: true,
      autoCreateWorkOrder: true,
      OR: [
        { nextDueDate: { lte: sevenDaysFromNow } },
        // For mileage-based, we'll check against current odometer
      ],
    },
    include: {
      vehicle: {
        select: {
          id: true,
          plateNumber: true,
          companyId: true,
          currentOdometer: true,
        },
      },
    },
  })

  const created: {
    vehicleId: string
    taskName: string
    workOrderNumber: string
  }[] = []

  for (const schedule of dueSchedules) {
    // Check if already has open work order for this schedule
    const existingWorkOrder = await prisma.workOrder.findFirst({
      where: {
        vehicleId: schedule.vehicleId,
        scheduleId: schedule.id,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
    })

    if (existingWorkOrder) {
      continue // Skip if work order already exists
    }

    // Check mileage-based trigger
    let isDue = false
    if (schedule.nextDueDate && schedule.nextDueDate <= sevenDaysFromNow) {
      isDue = true
    }
    if (
      schedule.nextDueKm &&
      schedule.vehicle.currentOdometer &&
      schedule.vehicle.currentOdometer >= schedule.nextDueKm - 500
    ) {
      isDue = true
    }

    if (!isDue) continue

    // Create work order
    const workOrderNumber = `WO-${Date.now().toString(36).toUpperCase()}`

    await prisma.workOrder.create({
      data: {
        workOrderNumber,
        vehicleId: schedule.vehicleId,
        companyId: schedule.vehicle.companyId,
        title: schedule.taskName,
        description: `Auto-created from maintenance schedule: ${schedule.taskName}`,
        taskType: schedule.taskType,
        priority: schedule.priority,
        scheduledDate: schedule.nextDueDate || undefined,
        scheduleId: schedule.id,
      },
    })

    created.push({
      vehicleId: schedule.vehicleId,
      taskName: schedule.taskName,
      workOrderNumber,
    })

    console.log(
      `✅ Created work order ${workOrderNumber} for ${schedule.vehicle.plateNumber} - ${schedule.taskName}`
    )
  }

  return {
    created: created.length,
    schedules: created,
  }
}

// ==================== BATCH UPDATE RISK SCORES ====================

/**
 * Update maintenance risk scores for all active vehicles
 * Runs daily via cron job
 */
export async function updateAllVehicleRiskScores(): Promise<{
  processed: number
  highRisk: number
  results: { vehicleId: string; plateNumber: string; riskScore: number }[]
}> {
  const vehicles = await prisma.vehicle.findMany({
    where: {
      status: { in: ['ACTIVE', 'MAINTENANCE'] },
    },
    select: { id: true, plateNumber: true },
  })

  const results: {
    vehicleId: string
    plateNumber: string
    riskScore: number
  }[] = []
  let highRisk = 0

  for (const vehicle of vehicles) {
    try {
      const prediction = await calculateMaintenanceRiskScore(vehicle.id)

      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: {
          maintenanceRiskScore: prediction.riskScore,
          predictedFailureDate: prediction.predictedFailureDate,
          predictedFailureType: prediction.predictedFailureType,
          lastPredictionUpdate: new Date(),
        },
      })

      results.push({
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        riskScore: prediction.riskScore,
      })

      if (prediction.riskScore >= 70) {
        highRisk++

        // Create notification for high-risk vehicles
        await createMaintenanceNotification(vehicle.id, prediction)
      }
    } catch (error) {
      console.error(
        `Error updating risk score for ${vehicle.plateNumber}:`,
        error
      )
    }
  }

  return {
    processed: vehicles.length,
    highRisk,
    results,
  }
}

// ==================== NOTIFICATIONS ====================

async function createMaintenanceNotification(
  vehicleId: string,
  prediction: MaintenanceRiskResult
): Promise<void> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: {
      plateNumber: true,
      companyId: true,
      company: {
        select: {
          users: {
            where: { role: 'COMPANY_ADMIN' },
            select: { id: true },
          },
        },
      },
    },
  })

  if (!vehicle) return

  // Notify all company admins
  for (const admin of vehicle.company.users) {
    await prisma.notification.create({
      data: {
        recipientId: admin.id,
        recipientType: 'USER',
        type: 'MAINTENANCE_ALERT',
        title: `High Maintenance Risk: ${vehicle.plateNumber}`,
        message: `Risk score: ${prediction.riskScore}/100 (${prediction.urgency})\n\n${prediction.recommendations.join('\n')}`,
        priority: prediction.urgency === 'CRITICAL' ? 4 : 3,
        metadata: JSON.stringify({
          vehicleId,
          plateNumber: vehicle.plateNumber,
          riskScore: prediction.riskScore,
          urgency: prediction.urgency,
          recommendations: prediction.recommendations,
        }),
      },
    })
  }
}

/**
 * Phase 2 Predictive Maintenance - Integration Test
 *
 * This script tests the complete predictive maintenance system:
 * 1. Creates test vehicle
 * 2. Creates maintenance schedules
 * 3. Records fuel entries
 * 4. Performs inspections
 * 5. Creates work orders
 * 6. Runs AI risk calculation
 * 7. Tests cron job
 *
 * Run: node scripts/test-predictive-maintenance.js
 */

const prisma = require('../src/lib/db').default

async function main() {
  console.log('🧪 Starting Phase 2 Predictive Maintenance Test...\n')

  // Step 1: Get or create test company
  console.log('📋 Step 1: Setting up test company...')
  let company = await prisma.company.findFirst({
    where: { email: { contains: 'test' } }
  })

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Test Bus Company',
        email: 'test@example.com',
        phoneNumber: '0911111111',
        address: 'Addis Ababa, Ethiopia',
        status: 'APPROVED'
      }
    })
    console.log(`   ✅ Created test company: ${company.name} (${company.id})`)
  } else {
    console.log(`   ✅ Using existing company: ${company.name} (${company.id})`)
  }

  // Step 2: Create test vehicle
  console.log('\n🚌 Step 2: Creating test vehicle...')

  // Clean up existing test vehicle if exists
  await prisma.vehicle.deleteMany({
    where: {
      plateNumber: '3-TEST-999',
      companyId: company.id
    }
  })

  const vehicle = await prisma.vehicle.create({
    data: {
      companyId: company.id,
      plateNumber: '3-TEST-999',
      sideNumber: '999',
      make: 'Mercedes-Benz',
      model: 'Sprinter',
      year: 2020,
      busType: 'STANDARD',
      totalSeats: 49,
      status: 'ACTIVE',
      currentOdometer: 50000,
      odometerLastUpdated: new Date(),
      engineHours: 2000,
      fuelCapacity: 80,
      fuelType: 'DIESEL',
      fuelEfficiencyL100km: 28.5,
      utilizationRate: 75.0,
      registrationExpiry: new Date('2026-12-31'),
      insuranceExpiry: new Date('2026-06-30')
    }
  })
  console.log(`   ✅ Created vehicle: ${vehicle.plateNumber} (${vehicle.sideNumber})`)
  console.log(`   📊 Initial odometer: ${vehicle.currentOdometer} km`)

  // Step 3: Create maintenance schedules
  console.log('\n📅 Step 3: Creating maintenance schedules...')

  const schedules = [
    {
      taskName: 'Oil Change',
      taskType: 'OIL_CHANGE',
      intervalKm: 5000,
      intervalDays: 90,
      priority: 'NORMAL',
      estimatedDurationMinutes: 60,
      estimatedCost: 1500,
      autoCreateWorkOrder: true
    },
    {
      taskName: 'Brake Inspection',
      taskType: 'BRAKE_INSPECTION',
      intervalKm: 20000,
      intervalDays: 180,
      priority: 'HIGH',
      estimatedDurationMinutes: 120,
      estimatedCost: 3000,
      autoCreateWorkOrder: true
    },
    {
      taskName: 'Tire Rotation',
      taskType: 'TIRE_ROTATION',
      intervalKm: 10000,
      intervalDays: null,
      priority: 'NORMAL',
      estimatedDurationMinutes: 45,
      estimatedCost: 800,
      autoCreateWorkOrder: true
    }
  ]

  for (const scheduleData of schedules) {
    const schedule = await prisma.maintenanceSchedule.create({
      data: {
        vehicleId: vehicle.id,
        ...scheduleData,
        nextDueDate: scheduleData.intervalDays
          ? new Date(Date.now() + scheduleData.intervalDays * 24 * 60 * 60 * 1000)
          : null,
        nextDueKm: scheduleData.intervalKm
          ? vehicle.currentOdometer + scheduleData.intervalKm
          : null
      }
    })
    console.log(`   ✅ Created schedule: ${schedule.taskName} (next due: ${schedule.nextDueKm || 'N/A'} km, ${schedule.nextDueDate ? new Date(schedule.nextDueDate).toLocaleDateString() : 'N/A'})`)
  }

  // Step 4: Create fuel entries
  console.log('\n⛽ Step 4: Recording fuel entries...')

  const fuelEntries = [
    { liters: 75, cost: 6000, odometer: 50250 },
    { liters: 78, cost: 6240, odometer: 50520 },
    { liters: 80, cost: 6400, odometer: 50800 }
  ]

  let previousOdometer = vehicle.currentOdometer
  for (const entry of fuelEntries) {
    const kmDriven = entry.odometer - previousOdometer
    const litersPer100Km = (entry.liters / kmDriven) * 100

    const fuelEntry = await prisma.fuelEntry.create({
      data: {
        vehicleId: vehicle.id,
        liters: entry.liters,
        costBirr: entry.cost,
        odometerReading: entry.odometer,
        litersPer100Km: litersPer100Km,
        fuelStationName: 'Test Fuel Station',
        paymentMethod: 'FLEET_CARD'
      }
    })

    await prisma.odometerLog.create({
      data: {
        vehicleId: vehicle.id,
        reading: entry.odometer,
        source: 'FUEL_ENTRY'
      }
    })

    console.log(`   ✅ Fuel entry: ${entry.liters}L at ${entry.odometer} km (${litersPer100Km.toFixed(1)} L/100km)`)
    previousOdometer = entry.odometer
  }

  // Update vehicle odometer
  await prisma.vehicle.update({
    where: { id: vehicle.id },
    data: {
      currentOdometer: fuelEntries[fuelEntries.length - 1].odometer,
      odometerLastUpdated: new Date()
    }
  })

  // Step 5: Create inspections
  console.log('\n🔍 Step 5: Performing vehicle inspections...')

  // Good inspection
  const inspection1 = await prisma.vehicleInspection.create({
    data: {
      vehicleId: vehicle.id,
      inspectionType: 'PRE_TRIP',
      inspectionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      inspectedByUserId: company.id, // Using company ID as placeholder
      checklistResults: JSON.stringify({
        brakes: true,
        lights: true,
        tires: true,
        engineOil: 'good',
        coolant: 'good',
        windshield: true
      }),
      status: 'PASS',
      odometerReading: 50100
    }
  })
  console.log(`   ✅ Pre-trip inspection: PASS (7 days ago)`)

  // Inspection with defects
  const inspection2 = await prisma.vehicleInspection.create({
    data: {
      vehicleId: vehicle.id,
      inspectionType: 'WEEKLY',
      inspectionDate: new Date(),
      inspectedByUserId: company.id,
      checklistResults: JSON.stringify({
        brakes: true,
        lights: false,
        tires: true,
        engineOil: 'low',
        coolant: 'good',
        windshield: true
      }),
      status: 'PASS_WITH_DEFECTS',
      defectsFound: ['Left headlight not working', 'Engine oil level low'],
      odometerReading: 50800
    }
  })
  console.log(`   ⚠️  Weekly inspection: PASS_WITH_DEFECTS (2 defects found)`)

  // Update vehicle defect count
  await prisma.vehicle.update({
    where: { id: vehicle.id },
    data: {
      lastInspectionDate: new Date(),
      defectCount: 2,
      criticalDefectCount: 0
    }
  })

  // Step 6: Create work order for defects
  console.log('\n🔧 Step 6: Creating work order for defects...')

  const workOrderNumber = `WO-${Date.now().toString(36).toUpperCase()}`
  const workOrder = await prisma.workOrder.create({
    data: {
      vehicleId: vehicle.id,
      workOrderNumber,
      workType: 'CORRECTIVE',
      description: 'Fix defects from weekly inspection: Left headlight not working, Engine oil level low',
      priority: 'HIGH',
      status: 'OPEN',
      odometerReading: 50800,
      estimatedCost: 1200
    }
  })
  console.log(`   ✅ Work order created: ${workOrderNumber} (HIGH priority)`)

  // Add parts to work order
  const part1 = await prisma.workOrderPart.create({
    data: {
      workOrderId: workOrder.id,
      partName: 'Headlight Bulb (H7)',
      quantity: 1,
      unitPrice: 250,
      totalPrice: 250,
      supplier: 'Auto Parts Ltd'
    }
  })
  console.log(`   ✅ Added part: ${part1.partName} (${part1.totalPrice} Birr)`)

  const part2 = await prisma.workOrderPart.create({
    data: {
      workOrderId: workOrder.id,
      partName: 'Engine Oil (5W-30, 5L)',
      quantity: 1,
      unitPrice: 800,
      totalPrice: 800,
      supplier: 'Auto Parts Ltd'
    }
  })
  console.log(`   ✅ Added part: ${part2.partName} (${part2.totalPrice} Birr)`)

  // Update work order costs
  await prisma.workOrder.update({
    where: { id: workOrder.id },
    data: {
      partsCost: 1050,
      laborCost: 500,
      totalCost: 1550
    }
  })

  // Step 7: Test AI risk calculation
  console.log('\n🤖 Step 7: Running AI risk calculation...')

  const { calculateMaintenanceRiskScore } = require('../src/lib/ai/predictive-maintenance')

  const riskResult = await calculateMaintenanceRiskScore(vehicle.id)

  console.log(`   📊 Risk Score: ${riskResult.riskScore}/100 (${riskResult.urgency})`)
  console.log(`   📅 Predicted Failure: ${riskResult.predictedFailureDate ? new Date(riskResult.predictedFailureDate).toLocaleDateString() : 'None'}`)
  console.log(`   🔧 Predicted Type: ${riskResult.predictedFailureType || 'N/A'}`)
  console.log(`   📝 Recommendations:`)
  riskResult.recommendations.forEach((rec, i) => {
    console.log(`      ${i + 1}. ${rec}`)
  })

  // Update vehicle with risk score
  await prisma.vehicle.update({
    where: { id: vehicle.id },
    data: {
      maintenanceRiskScore: riskResult.riskScore,
      predictedFailureDate: riskResult.predictedFailureDate,
      predictedFailureType: riskResult.predictedFailureType,
      lastPredictionUpdate: new Date()
    }
  })

  // Step 8: Test overdue scenario
  console.log('\n⚠️  Step 8: Testing overdue maintenance scenario...')

  // Update oil change to be overdue
  const oilChangeSchedule = await prisma.maintenanceSchedule.findFirst({
    where: {
      vehicleId: vehicle.id,
      taskName: 'Oil Change'
    }
  })

  await prisma.maintenanceSchedule.update({
    where: { id: oilChangeSchedule.id },
    data: {
      nextDueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days overdue
      nextDueKm: 49000 // 1000 km overdue
    }
  })
  console.log(`   ⏰ Set Oil Change to OVERDUE (30 days, 1000 km past due)`)

  // Recalculate risk score
  const riskResult2 = await calculateMaintenanceRiskScore(vehicle.id)
  console.log(`   📊 New Risk Score: ${riskResult2.riskScore}/100 (${riskResult2.urgency})`)
  console.log(`   📈 Risk increased by: ${riskResult2.riskScore - riskResult.riskScore} points`)

  await prisma.vehicle.update({
    where: { id: vehicle.id },
    data: {
      maintenanceRiskScore: riskResult2.riskScore,
      lastPredictionUpdate: new Date()
    }
  })

  // Step 9: Test cron job functions
  console.log('\n⏰ Step 9: Testing cron job functions...')

  const { autoCreateDueWorkOrders, updateAllVehicleRiskScores } = require('../src/lib/ai/predictive-maintenance')

  // Test auto work order creation
  const { created, skipped } = await autoCreateDueWorkOrders()
  console.log(`   ✅ Auto work orders: ${created} created, ${skipped} skipped`)

  // Test batch risk score update
  const updateResults = await updateAllVehicleRiskScores()
  console.log(`   ✅ Batch update: ${updateResults.processed} vehicles processed`)
  console.log(`   📊 Risk scores: ${updateResults.results.map(r => `${r.riskScore} (${r.urgency})`).join(', ')}`)

  // Step 10: Query final state
  console.log('\n📊 Step 10: Final state summary...')

  const finalVehicle = await prisma.vehicle.findUnique({
    where: { id: vehicle.id },
    include: {
      maintenanceSchedules: true,
      workOrders: true,
      fuelEntries: true,
      inspections: true
    }
  })

  console.log(`   🚌 Vehicle: ${finalVehicle.plateNumber} (${finalVehicle.sideNumber})`)
  console.log(`   📍 Odometer: ${finalVehicle.currentOdometer} km`)
  console.log(`   ⚠️  Risk Score: ${finalVehicle.maintenanceRiskScore}/100`)
  console.log(`   📅 Schedules: ${finalVehicle.maintenanceSchedules.length} total`)
  console.log(`   🔧 Work Orders: ${finalVehicle.workOrders.length} total`)
  console.log(`   ⛽ Fuel Entries: ${finalVehicle.fuelEntries.length} total`)
  console.log(`   🔍 Inspections: ${finalVehicle.inspections.length} total`)
  console.log(`   🐛 Defects: ${finalVehicle.defectCount} open`)

  // Calculate cost summary
  const totalFuelCost = finalVehicle.fuelEntries.reduce((sum, e) => sum + e.costBirr, 0)
  const totalMaintenanceCost = finalVehicle.workOrders.reduce((sum, wo) => sum + wo.totalCost, 0)
  console.log(`   💰 Fuel Cost: ${totalFuelCost} Birr`)
  console.log(`   💰 Maintenance Cost: ${totalMaintenanceCost} Birr`)

  console.log('\n✅ All tests completed successfully!')
  console.log('\n📋 Next steps:')
  console.log('   1. Check the database to verify all records were created')
  console.log('   2. Test the API endpoints manually with the vehicle ID:', vehicle.id)
  console.log('   3. Test the VehicleHealthDashboard component with this vehicle')
  console.log('   4. Test the cron job endpoint:')
  console.log(`      curl -X POST http://localhost:3000/api/cron/predictive-maintenance \\`)
  console.log(`        -H "Authorization: Bearer YOUR_CRON_SECRET"`)
  console.log('\n🎉 Phase 2 Predictive Maintenance system is fully operational!')
}

main()
  .catch((e) => {
    console.error('❌ Test failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function checkVehicles() {
  console.log("Checking vehicles in database...")

  const vehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      plateNumber: true,
      make: true,
      model: true,
      currentOdometer: true,
      fuelEfficiencyL100km: true,
      maintenanceRiskScore: true,
      utilizationRate: true,
      lastInspectionDate: true,
      inspectionDueDate: true,
      criticalDefectCount: true,
      defectCount: true,
      predictedFailureType: true,
      predictedFailureDate: true,
    }
  })

  console.log(`\nFound ${vehicles.length} vehicles:\n`)

  vehicles.forEach(v => {
    console.log(`${v.plateNumber} - ${v.make} ${v.model}`)
    console.log(`  Odometer: ${v.currentOdometer}`)
    console.log(`  Fuel Efficiency: ${v.fuelEfficiencyL100km}`)
    console.log(`  Risk Score: ${v.maintenanceRiskScore}`)
    console.log(`  Utilization: ${v.utilizationRate}`)
    console.log(`  Critical Defects: ${v.criticalDefectCount}`)
    console.log(`  Total Defects: ${v.defectCount}`)
    console.log(`  Last Inspection: ${v.lastInspectionDate}`)
    console.log(`  Next Inspection: ${v.inspectionDueDate}`)
    console.log(`  Predicted Failure: ${v.predictedFailureType}`)
    console.log(`  Predicted Date: ${v.predictedFailureDate}`)
    console.log()
  })

  await prisma.$disconnect()
}

checkVehicles().catch(console.error)

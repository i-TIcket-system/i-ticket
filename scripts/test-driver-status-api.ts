/**
 * Test Driver Trip Status API - Direct Database Simulation
 * Simulates the API logic to verify status transitions work correctly
 */

import prisma from "../src/lib/db"

const validTransitions: Record<string, string[]> = {
  SCHEDULED: ["BOARDING"],
  BOARDING: ["DEPARTED"],
  DEPARTED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
}

async function simulateStatusUpdate(
  tripId: string,
  driverId: string,
  newStatus: string
): Promise<{ success: boolean; message: string; data?: any }> {

  // Get trip and verify driver assignment
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: {
      id: true,
      status: true,
      driverId: true,
      companyId: true,
      origin: true,
      destination: true,
      availableSlots: true,
      bookingHalted: true,
      company: { select: { name: true } }
    }
  })

  if (!trip) {
    return { success: false, message: "Trip not found" }
  }

  // Verify driver is assigned
  if (trip.driverId !== driverId) {
    return { success: false, message: "Driver not assigned to this trip" }
  }

  // Validate status transition
  const allowedTransitions = validTransitions[trip.status] || []
  if (!allowedTransitions.includes(newStatus)) {
    return {
      success: false,
      message: "Invalid transition: " + trip.status + " → " + newStatus + ". Allowed: " + (allowedTransitions.join(", ") || "none")
    }
  }

  // Prepare update data
  const updateData: any = { status: newStatus }

  if (newStatus === "DEPARTED") {
    updateData.actualDepartureTime = new Date()
    updateData.bookingHalted = true
  }

  if (newStatus === "COMPLETED") {
    updateData.actualArrivalTime = new Date()
    updateData.bookingHalted = true
  }

  // Update trip
  const updatedTrip = await prisma.trip.update({
    where: { id: tripId },
    data: updateData,
  })

  // Create audit log
  await prisma.adminLog.create({
    data: {
      userId: driverId,
      action: "TRIP_STATUS_" + newStatus,
      tripId: tripId,
      details: JSON.stringify({
        previousStatus: trip.status,
        newStatus: newStatus,
        updatedBy: "DRIVER",
        timestamp: new Date().toISOString(),
      }),
    },
  })

  return {
    success: true,
    message: "Status updated: " + trip.status + " → " + newStatus,
    data: {
      id: updatedTrip.id,
      status: updatedTrip.status,
      actualDepartureTime: updatedTrip.actualDepartureTime,
      actualArrivalTime: updatedTrip.actualArrivalTime,
      bookingHalted: updatedTrip.bookingHalted,
    }
  }
}

async function testDriverStatusAPI() {
  console.log("=".repeat(60))
  console.log("DRIVER STATUS API SIMULATION TEST")
  console.log("=".repeat(60))

  // Find driver
  const driver = await prisma.user.findFirst({
    where: { role: "COMPANY_ADMIN", staffRole: "DRIVER" },
    select: { id: true, name: true }
  })

  if (!driver) {
    console.log("❌ No driver found")
    return
  }

  console.log("\n✅ Driver: " + driver.name)

  // Find trip
  const trip = await prisma.trip.findFirst({
    where: { driverId: driver.id, status: "SCHEDULED" },
    select: { id: true, origin: true, destination: true, status: true }
  })

  if (!trip) {
    console.log("❌ No SCHEDULED trip found for driver")
    return
  }

  console.log("✅ Trip: " + trip.origin + " → " + trip.destination + " (" + trip.status + ")")
  console.log("   Trip ID: " + trip.id)

  // Test 1: Invalid transition (SCHEDULED → DEPARTED - should fail)
  console.log("\n" + "-".repeat(60))
  console.log("TEST 1: Invalid transition (SCHEDULED → DEPARTED)")
  console.log("-".repeat(60))

  const test1 = await simulateStatusUpdate(trip.id, driver.id, "DEPARTED")
  console.log("Result: " + (test1.success ? "✅ SUCCESS" : "❌ BLOCKED"))
  console.log("Message: " + test1.message)

  // Test 2: Valid transition (SCHEDULED → BOARDING)
  console.log("\n" + "-".repeat(60))
  console.log("TEST 2: Valid transition (SCHEDULED → BOARDING)")
  console.log("-".repeat(60))

  const test2 = await simulateStatusUpdate(trip.id, driver.id, "BOARDING")
  console.log("Result: " + (test2.success ? "✅ SUCCESS" : "❌ FAILED"))
  console.log("Message: " + test2.message)
  if (test2.data) {
    console.log("New Status: " + test2.data.status)
  }

  // Test 3: Valid transition (BOARDING → DEPARTED)
  console.log("\n" + "-".repeat(60))
  console.log("TEST 3: Valid transition (BOARDING → DEPARTED)")
  console.log("-".repeat(60))

  const test3 = await simulateStatusUpdate(trip.id, driver.id, "DEPARTED")
  console.log("Result: " + (test3.success ? "✅ SUCCESS" : "❌ FAILED"))
  console.log("Message: " + test3.message)
  if (test3.data) {
    console.log("New Status: " + test3.data.status)
    console.log("Actual Departure: " + test3.data.actualDepartureTime)
    console.log("Booking Halted: " + test3.data.bookingHalted)
  }

  // Test 4: Valid transition (DEPARTED → COMPLETED)
  console.log("\n" + "-".repeat(60))
  console.log("TEST 4: Valid transition (DEPARTED → COMPLETED)")
  console.log("-".repeat(60))

  const test4 = await simulateStatusUpdate(trip.id, driver.id, "COMPLETED")
  console.log("Result: " + (test4.success ? "✅ SUCCESS" : "❌ FAILED"))
  console.log("Message: " + test4.message)
  if (test4.data) {
    console.log("New Status: " + test4.data.status)
    console.log("Actual Arrival: " + test4.data.actualArrivalTime)
  }

  // Test 5: Invalid transition (COMPLETED → anything)
  console.log("\n" + "-".repeat(60))
  console.log("TEST 5: Invalid transition (COMPLETED → BOARDING)")
  console.log("-".repeat(60))

  const test5 = await simulateStatusUpdate(trip.id, driver.id, "BOARDING")
  console.log("Result: " + (test5.success ? "✅ SUCCESS" : "❌ BLOCKED"))
  console.log("Message: " + test5.message)

  // Test 6: Wrong driver
  console.log("\n" + "-".repeat(60))
  console.log("TEST 6: Wrong driver tries to update")
  console.log("-".repeat(60))

  const test6 = await simulateStatusUpdate(trip.id, "wrong-driver-id", "BOARDING")
  console.log("Result: " + (test6.success ? "✅ SUCCESS" : "❌ BLOCKED"))
  console.log("Message: " + test6.message)

  // Check audit logs created
  console.log("\n" + "=".repeat(60))
  console.log("AUDIT LOGS CREATED")
  console.log("=".repeat(60))

  const logs = await prisma.adminLog.findMany({
    where: { tripId: trip.id, action: { startsWith: "TRIP_STATUS" } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { action: true, createdAt: true, details: true }
  })

  for (const log of logs) {
    const details = JSON.parse(log.details || "{}")
    console.log("\n  " + log.action + " at " + log.createdAt.toISOString())
    console.log("    " + details.previousStatus + " → " + details.newStatus)
  }

  // Reset trip back to SCHEDULED for future tests
  console.log("\n" + "=".repeat(60))
  console.log("RESETTING TRIP TO SCHEDULED (for future tests)")
  console.log("=".repeat(60))

  await prisma.trip.update({
    where: { id: trip.id },
    data: {
      status: "SCHEDULED",
      actualDepartureTime: null,
      actualArrivalTime: null,
      bookingHalted: false,
    }
  })
  console.log("✅ Trip reset to SCHEDULED")

  console.log("\n" + "=".repeat(60))
  console.log("ALL TESTS COMPLETE")
  console.log("=".repeat(60))
}

testDriverStatusAPI()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

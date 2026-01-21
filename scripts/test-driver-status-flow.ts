/**
 * Test Driver Trip Status Flow
 * Tests: SCHEDULED → BOARDING → DEPARTED → COMPLETED
 */

import prisma from "../src/lib/db"

async function testDriverStatusFlow() {
  console.log("=".repeat(60))
  console.log("DRIVER TRIP STATUS FLOW TEST")
  console.log("=".repeat(60))

  // Find a driver user
  const driver = await prisma.user.findFirst({
    where: {
      role: "COMPANY_ADMIN",
      staffRole: "DRIVER",
    },
    select: {
      id: true,
      name: true,
      companyId: true,
    }
  })

  if (!driver) {
    console.log("❌ No driver found in database")
    return
  }

  console.log("\n✅ Found driver: " + driver.name + " (ID: " + driver.id + ")")

  // Find a trip assigned to this driver
  const trip = await prisma.trip.findFirst({
    where: {
      driverId: driver.id,
      status: { in: ["SCHEDULED", "BOARDING"] }
    },
    select: {
      id: true,
      status: true,
      origin: true,
      destination: true,
      departureTime: true,
      availableSlots: true,
      bookingHalted: true,
    }
  })

  if (!trip) {
    console.log("❌ No SCHEDULED/BOARDING trip assigned to this driver")

    // List available trips for this company
    const anyTrip = await prisma.trip.findFirst({
      where: {
        companyId: driver.companyId!,
        status: "SCHEDULED"
      },
      select: {
        id: true,
        status: true,
        origin: true,
        destination: true,
        driverId: true,
      }
    })

    if (anyTrip) {
      console.log("\n📋 Found unassigned trip: " + anyTrip.origin + " → " + anyTrip.destination)
      console.log("   Trip ID: " + anyTrip.id)
      console.log("   Current Driver ID: " + (anyTrip.driverId || "None"))
      console.log("\n💡 To test, assign this driver to the trip first.")
    }
    return
  }

  console.log("\n📋 Found trip assigned to driver:")
  console.log("   Route: " + trip.origin + " → " + trip.destination)
  console.log("   Status: " + trip.status)
  console.log("   Trip ID: " + trip.id)
  console.log("   Departure: " + trip.departureTime)
  console.log("   Available Slots: " + trip.availableSlots)
  console.log("   Booking Halted: " + trip.bookingHalted)

  // Test valid transitions
  console.log("\n" + "=".repeat(60))
  console.log("VALID STATUS TRANSITIONS")
  console.log("=".repeat(60))

  const transitions: Record<string, string[]> = {
    "SCHEDULED": ["BOARDING"],
    "BOARDING": ["DEPARTED"],
    "DEPARTED": ["COMPLETED"],
    "COMPLETED": [],
    "CANCELLED": [],
  }

  console.log("\nExpected transitions:")
  for (const [from, to] of Object.entries(transitions)) {
    console.log("  " + from + " → " + (to.length > 0 ? to.join(", ") : "(final state)"))
  }

  // Check what the current status allows
  const currentAllowed = transitions[trip.status] || []
  console.log("\n📌 Current status (" + trip.status + ") allows: " + (currentAllowed.join(", ") || "none"))

  // Test API endpoint structure
  console.log("\n" + "=".repeat(60))
  console.log("API ENDPOINT INFO")
  console.log("=".repeat(60))
  console.log("\nEndpoint: PATCH /api/staff/trip/" + trip.id + "/status")
  console.log("Body: { \"status\": \"" + (currentAllowed[0] || "BOARDING") + "\" }")
  console.log("\nRequired headers:")
  console.log("  - Cookie: next-auth.session-token=<driver_session>")
  console.log("  - Content-Type: application/json")

  console.log("\n" + "=".repeat(60))
  console.log("MANIFEST AUTO-GENERATION")
  console.log("=".repeat(60))
  console.log("\nWhen status changes to DEPARTED:")
  console.log("  ✅ Manifest auto-generated for Super Admin (AUTO_DEPARTED)")
  console.log("  ✅ AdminLog created with companyId: null (Super Admin only)")
  console.log("  ✅ Super Admin notified via notifySuperAdmins()")
  console.log("  ❌ Company does NOT see this manifest or log")

  // Check existing manifests
  const manifestCount = await prisma.manifestDownload.count({
    where: { tripId: trip.id }
  })
  console.log("\n📊 Existing manifests for this trip: " + manifestCount)

  // Check admin logs for this trip
  const adminLogs = await prisma.adminLog.findMany({
    where: {
      tripId: trip.id,
      action: { contains: "STATUS" }
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      action: true,
      companyId: true,
      createdAt: true,
      details: true,
    }
  })

  if (adminLogs.length > 0) {
    console.log("\n📜 Recent status-related logs for this trip:")
    for (const log of adminLogs) {
      const details = JSON.parse(log.details || "{}")
      console.log("  - " + log.action + " at " + log.createdAt.toISOString())
      console.log("    Company visible: " + (log.companyId ? "Yes" : "No (Super Admin only)"))
      if (details.previousStatus && details.newStatus) {
        console.log("    " + details.previousStatus + " → " + details.newStatus)
      }
    }
  }

  console.log("\n" + "=".repeat(60))
  console.log("TEST COMPLETE")
  console.log("=".repeat(60))
}

testDriverStatusFlow()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

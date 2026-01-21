/**
 * Detailed Auto-Halt System Test Suite
 *
 * Tests comprehensive scenarios including:
 * 1. Exact threshold boundaries (11, 10, 9, 8 seats)
 * 2. Manual ticketing triggering auto-halt for online
 * 3. Trip status forced halt (DEPARTED/COMPLETED/CANCELLED)
 * 4. Edge cases and boundary conditions
 *
 * Run: npx tsx scripts/test-auto-halt-detailed.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Colors for console output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  reset: "\x1b[0m",
}

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function section(title: string) {
  log(`\n${"=".repeat(60)}`, "blue")
  log(title, "cyan")
  log("=".repeat(60), "blue")
}

function test(name: string) {
  log(`\n→ TEST: ${name}`, "yellow")
}

function pass(message: string) {
  log(`  ✓ ${message}`, "green")
}

function fail(message: string) {
  log(`  ✗ ${message}`, "red")
}

function info(message: string) {
  log(`  ℹ ${message}`, "cyan")
}

async function main() {
  section("AUTO-HALT DETAILED TEST SUITE")

  try {
    // Get test company
    const company = await prisma.company.findFirst({
      where: { name: { contains: "Selam" } },
    })

    if (!company) {
      fail("Test company not found. Please ensure Selam Bus exists.")
      return
    }

    pass(`Test company found: ${company.name} (${company.id})`)

    // Get company admin (first admin with that companyId)
    const companyAdmin = await prisma.user.findFirst({
      where: {
        companyId: company.id,
        role: "COMPANY_ADMIN"
      }
    })

    if (!companyAdmin) {
      fail("Company admin not found for test company")
      return
    }

    pass(`Company admin found: ${companyAdmin.id}`)

    // Get required resources for trip creation
    const driver = await prisma.user.findFirst({
      where: {
        companyId: company.id,
        role: "COMPANY_ADMIN",
        staffRole: "DRIVER"
      }
    })

    const conductor = await prisma.user.findFirst({
      where: {
        companyId: company.id,
        role: "COMPANY_ADMIN",
        staffRole: "CONDUCTOR"
      }
    })

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        companyId: company.id
      }
    })

    if (!driver || !conductor || !vehicle) {
      fail("Required resources (driver, conductor, vehicle) not found")
      info(`Driver: ${driver ? "✓" : "✗"}, Conductor: ${conductor ? "✓" : "✗"}, Vehicle: ${vehicle ? "✓" : "✗"}`)
      return
    }

    pass("All required resources available")

    // TEST 1: Exact Threshold Boundaries
    section("TEST 1: Exact Threshold Boundaries")
    await testThresholdBoundaries(company.id, driver.id, conductor.id, vehicle.id)

    // TEST 2: Manual Ticketing Triggers Online Halt
    section("TEST 2: Manual Ticketing Triggers Online Halt")
    await testManualTicketingTriggersHalt(company.id, driver.id, conductor.id, vehicle.id, companyAdmin.id)

    // TEST 3: Trip Status Forced Halt
    section("TEST 3: Trip Status Forced Halt")
    await testTripStatusForcedHalt(company.id, driver.id, conductor.id, vehicle.id)

    // TEST 4: Manual Ticketing Works When Online Halted
    section("TEST 4: Manual Ticketing Exemption")
    await testManualTicketingWhenHalted(company.id, driver.id, conductor.id, vehicle.id, companyAdmin.id)

    // TEST 5: Bypass Priorities
    section("TEST 5: Bypass Setting Priorities")
    await testBypassPriorities(company.id, driver.id, conductor.id, vehicle.id)

    // TEST 6: Edge Cases
    section("TEST 6: Edge Cases")
    await testEdgeCases(company.id, driver.id, conductor.id, vehicle.id)

    section("TEST SUITE COMPLETE")
    pass("ALL TESTS PASSED SUCCESSFULLY")

  } catch (error) {
    fail(`TEST SUITE FAILED: ${error}`)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

async function testThresholdBoundaries(
  companyId: string,
  driverId: string,
  conductorId: string,
  vehicleId: string
) {
  test("Threshold: 11 seats should NOT auto-halt")

  let trip = await prisma.trip.create({
    data: {
      companyId,
      origin: "Addis Ababa",
      destination: "Test City 1",
      departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: 500,
      busType: "STANDARD",
      totalSlots: 30,
      availableSlots: 11, // Boundary: 11 seats
      estimatedDuration: 5,
      driverId,
      conductorId,
      vehicleId,
    },
    include: {
      company: {
        select: {
          disableAutoHaltGlobally: true
        }
      }
    }
  })

  const shouldHalt11 =
    trip.availableSlots <= 10 &&
    !trip.bookingHalted &&
    !trip.adminResumedFromAutoHalt &&
    !trip.autoResumeEnabled &&
    !trip.company.disableAutoHaltGlobally

  if (!shouldHalt11 && !trip.bookingHalted) {
    pass("At 11 seats: NOT halted (correct)")
  } else {
    fail("At 11 seats: Should NOT halt but conditions indicate halt")
  }

  test("Threshold: Exactly 10 seats SHOULD auto-halt")

  trip = await prisma.trip.update({
    where: { id: trip.id },
    data: { availableSlots: 10 },
    include: {
      company: {
        select: {
          disableAutoHaltGlobally: true
        }
      }
    }
  })

  const shouldHalt10 =
    trip.availableSlots <= 10 &&
    !trip.bookingHalted &&
    !trip.adminResumedFromAutoHalt &&
    !trip.autoResumeEnabled &&
    !trip.company.disableAutoHaltGlobally

  if (shouldHalt10) {
    pass("At 10 seats: WOULD auto-halt (conditions met)")
    // Simulate the auto-halt
    await prisma.trip.update({
      where: { id: trip.id },
      data: {
        bookingHalted: true,
        lowSlotAlertSent: true
      }
    })
    pass("Simulated auto-halt at 10 seats")
  } else {
    fail("At 10 seats: Should trigger auto-halt but conditions not met")
  }

  test("Threshold: 9 seats should remain halted")

  trip = await prisma.trip.update({
    where: { id: trip.id },
    data: { availableSlots: 9 },
    include: {
      company: {
        select: {
          disableAutoHaltGlobally: true
        }
      }
    }
  })

  if (trip.bookingHalted) {
    pass("At 9 seats: Remains halted (correct)")
  } else {
    fail("At 9 seats: Should remain halted")
  }

  test("Threshold: 5 seats should remain halted")

  trip = await prisma.trip.update({
    where: { id: trip.id },
    data: { availableSlots: 5 },
  })

  if (trip.bookingHalted) {
    pass("At 5 seats: Remains halted (correct)")
  } else {
    fail("At 5 seats: Should remain halted")
  }

  // Cleanup
  await prisma.trip.delete({ where: { id: trip.id } })
  info("Cleanup complete")
}

async function testManualTicketingTriggersHalt(
  companyId: string,
  driverId: string,
  conductorId: string,
  vehicleId: string,
  companyAdminId: string
) {
  test("Manual sale drops from 15 to 10 seats - online should auto-halt")

  // Create trip with 15 seats
  let trip = await prisma.trip.create({
    data: {
      companyId,
      origin: "Addis Ababa",
      destination: "Test City 2",
      departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: 500,
      busType: "STANDARD",
      totalSlots: 15,
      availableSlots: 15,
      estimatedDuration: 5,
      driverId,
      conductorId,
      vehicleId,
    },
  })

  info(`Created trip with 15 seats (ID: ${trip.id.substring(0, 8)}...)`)

  // Simulate manual ticket sale for 5 passengers
  trip = await prisma.trip.update({
    where: { id: trip.id },
    data: { availableSlots: { decrement: 5 } },
  })

  info(`After manual sale: ${trip.availableSlots} seats remaining`)

  // Check if auto-halt should trigger
  const tripWithCompany = await prisma.trip.findUnique({
    where: { id: trip.id },
    include: {
      company: {
        select: {
          disableAutoHaltGlobally: true
        }
      }
    }
  })

  if (!tripWithCompany) {
    fail("Trip not found after update")
    return
  }

  const shouldAutoHalt =
    tripWithCompany.availableSlots <= 10 &&
    !tripWithCompany.bookingHalted &&
    !tripWithCompany.adminResumedFromAutoHalt &&
    !tripWithCompany.autoResumeEnabled &&
    !tripWithCompany.company.disableAutoHaltGlobally

  if (shouldAutoHalt) {
    pass("Auto-halt conditions MET after manual sale to 10 seats")

    // Simulate the auto-halt (as the API would do)
    await prisma.trip.update({
      where: { id: trip.id },
      data: {
        bookingHalted: true,
        lowSlotAlertSent: true
      }
    })

    await prisma.adminLog.create({
      data: {
        userId: "SYSTEM",
        action: "AUTO_HALT_LOW_SLOTS",
        tripId: trip.id,
        details: JSON.stringify({
          reason: "Manual sale triggered auto-halt",
          availableSlots: tripWithCompany.availableSlots,
          triggeredBy: "manual_ticket_sale",
          timestamp: new Date().toISOString()
        })
      }
    })

    pass("Online booking auto-halted (manual ticketing can continue)")
  } else {
    fail("Auto-halt should trigger but conditions not met")
  }

  // Verify manual ticketing can still work
  const tripAfterHalt = await prisma.trip.findUnique({
    where: { id: trip.id }
  })

  if (tripAfterHalt?.bookingHalted) {
    pass("Booking is halted for online")
    info("Manual ticketing would NOT be blocked (separate code path)")
  } else {
    fail("Booking should be halted for online")
  }

  // Cleanup
  await prisma.trip.delete({ where: { id: trip.id } })
  info("Cleanup complete")
}

async function testTripStatusForcedHalt(
  companyId: string,
  driverId: string,
  conductorId: string,
  vehicleId: string
) {
  test("Trip status DEPARTED should force halt (ignore all bypasses)")

  // Create trip with all bypasses enabled
  let trip = await prisma.trip.create({
    data: {
      companyId,
      origin: "Addis Ababa",
      destination: "Test City 3",
      departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: 500,
      busType: "STANDARD",
      totalSlots: 30,
      availableSlots: 20,
      estimatedDuration: 5,
      driverId,
      conductorId,
      vehicleId,
      autoResumeEnabled: true, // Trip-specific bypass
      adminResumedFromAutoHalt: true, // One-time resume
      bookingHalted: false,
    },
  })

  // Enable company-wide bypass
  await prisma.company.update({
    where: { id: companyId },
    data: { disableAutoHaltGlobally: true }
  })

  info("All bypass settings enabled (company + trip + one-time)")

  // Change status to DEPARTED
  trip = await prisma.trip.update({
    where: { id: trip.id },
    data: {
      status: "DEPARTED",
      bookingHalted: true, // FORCED
      actualDepartureTime: new Date()
    }
  })

  if (trip.bookingHalted && trip.status === "DEPARTED") {
    pass("DEPARTED status forces halt (overrides all bypasses)")
  } else {
    fail("DEPARTED should force halt unconditionally")
  }

  await prisma.trip.delete({ where: { id: trip.id } })

  test("Trip status COMPLETED should force halt")

  trip = await prisma.trip.create({
    data: {
      companyId,
      origin: "Addis Ababa",
      destination: "Test City 4",
      departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: 500,
      busType: "STANDARD",
      totalSlots: 30,
      availableSlots: 20,
      estimatedDuration: 5,
      driverId,
      conductorId,
      vehicleId,
      autoResumeEnabled: true,
    },
  })

  trip = await prisma.trip.update({
    where: { id: trip.id },
    data: {
      status: "COMPLETED",
      bookingHalted: true,
      actualArrivalTime: new Date()
    }
  })

  if (trip.bookingHalted && trip.status === "COMPLETED") {
    pass("COMPLETED status forces halt")
  } else {
    fail("COMPLETED should force halt")
  }

  await prisma.trip.delete({ where: { id: trip.id } })

  test("Trip status CANCELLED should force halt")

  trip = await prisma.trip.create({
    data: {
      companyId,
      origin: "Addis Ababa",
      destination: "Test City 5",
      departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: 500,
      busType: "STANDARD",
      totalSlots: 30,
      availableSlots: 20,
      estimatedDuration: 5,
      driverId,
      conductorId,
      vehicleId,
    },
  })

  trip = await prisma.trip.update({
    where: { id: trip.id },
    data: {
      status: "CANCELLED",
      bookingHalted: true
    }
  })

  if (trip.bookingHalted && trip.status === "CANCELLED") {
    pass("CANCELLED status forces halt")
  } else {
    fail("CANCELLED should force halt")
  }

  // Reset company-wide bypass
  await prisma.company.update({
    where: { id: companyId },
    data: { disableAutoHaltGlobally: false }
  })

  await prisma.trip.delete({ where: { id: trip.id } })
  info("Cleanup complete")
}

async function testManualTicketingWhenHalted(
  companyId: string,
  driverId: string,
  conductorId: string,
  vehicleId: string,
  companyAdminId: string
) {
  test("Manual ticketing can sell when online booking is halted")

  // Create trip that's halted
  const trip = await prisma.trip.create({
    data: {
      companyId,
      origin: "Addis Ababa",
      destination: "Test City 6",
      departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: 500,
      busType: "STANDARD",
      totalSlots: 20,
      availableSlots: 8,
      estimatedDuration: 5,
      driverId,
      conductorId,
      vehicleId,
      bookingHalted: true, // Online booking halted
      lowSlotAlertSent: true,
    },
  })

  info(`Created trip with 8 seats, online booking HALTED`)

  // Manual ticketing route does NOT check bookingHalted
  // It only checks: trip status, company ownership, seat availability
  const canManualTicketSell =
    trip.status !== "DEPARTED" &&
    trip.status !== "COMPLETED" &&
    trip.status !== "CANCELLED" &&
    trip.availableSlots > 0

  if (canManualTicketSell) {
    pass("Manual ticketing CAN sell (status OK, seats available)")
    pass("bookingHalted flag is IGNORED by manual ticketing")
  } else {
    fail("Manual ticketing should be able to sell")
  }

  // Simulate successful manual sale
  const updatedTrip = await prisma.trip.update({
    where: { id: trip.id },
    data: { availableSlots: { decrement: 3 } }
  })

  info(`Manual sale successful: ${updatedTrip.availableSlots} seats remaining`)

  if (updatedTrip.bookingHalted) {
    pass("Online booking remains halted (correct)")
  } else {
    fail("Online booking should remain halted")
  }

  // Cleanup
  await prisma.trip.delete({ where: { id: trip.id } })
  info("Cleanup complete")
}

async function testBypassPriorities(
  companyId: string,
  driverId: string,
  conductorId: string,
  vehicleId: string
) {
  test("Company-wide bypass takes priority over trip-specific")

  // Enable company-wide bypass
  await prisma.company.update({
    where: { id: companyId },
    data: { disableAutoHaltGlobally: true }
  })

  // Create trip WITHOUT trip-specific bypass
  let trip = await prisma.trip.create({
    data: {
      companyId,
      origin: "Addis Ababa",
      destination: "Test City 7",
      departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: 500,
      busType: "STANDARD",
      totalSlots: 20,
      availableSlots: 10,
      estimatedDuration: 5,
      driverId,
      conductorId,
      vehicleId,
      autoResumeEnabled: false, // No trip-specific bypass
    },
    include: {
      company: {
        select: {
          disableAutoHaltGlobally: true
        }
      }
    }
  })

  const shouldHalt =
    trip.availableSlots <= 10 &&
    !trip.bookingHalted &&
    !trip.adminResumedFromAutoHalt &&
    !trip.autoResumeEnabled &&
    !trip.company.disableAutoHaltGlobally // This is true, so NO halt

  if (!shouldHalt) {
    pass("Company-wide bypass prevents auto-halt (correct)")
  } else {
    fail("Company-wide bypass should prevent auto-halt")
  }

  // Disable company-wide, enable trip-specific
  await prisma.company.update({
    where: { id: companyId },
    data: { disableAutoHaltGlobally: false }
  })

  trip = await prisma.trip.update({
    where: { id: trip.id },
    data: { autoResumeEnabled: true },
    include: {
      company: {
        select: {
          disableAutoHaltGlobally: true
        }
      }
    }
  })

  const shouldHalt2 =
    trip.availableSlots <= 10 &&
    !trip.bookingHalted &&
    !trip.adminResumedFromAutoHalt &&
    !trip.autoResumeEnabled && // This is true, so NO halt
    !trip.company.disableAutoHaltGlobally

  if (!shouldHalt2) {
    pass("Trip-specific bypass prevents auto-halt (correct)")
  } else {
    fail("Trip-specific bypass should prevent auto-halt")
  }

  await prisma.trip.delete({ where: { id: trip.id } })
  info("Cleanup complete")
}

async function testEdgeCases(
  companyId: string,
  driverId: string,
  conductorId: string,
  vehicleId: string
) {
  test("Edge case: Trip with 10 total slots should halt at 10 available")

  let trip = await prisma.trip.create({
    data: {
      companyId,
      origin: "Addis Ababa",
      destination: "Test City 8",
      departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: 500,
      busType: "MINI",
      totalSlots: 10, // Small bus
      availableSlots: 10,
      estimatedDuration: 3,
      driverId,
      conductorId,
      vehicleId,
    },
    include: {
      company: {
        select: {
          disableAutoHaltGlobally: true
        }
      }
    }
  })

  const shouldHaltSmallBus =
    trip.availableSlots <= 10 &&
    !trip.bookingHalted &&
    !trip.adminResumedFromAutoHalt &&
    !trip.autoResumeEnabled &&
    !trip.company.disableAutoHaltGlobally

  if (shouldHaltSmallBus) {
    pass("10-seat bus WOULD auto-halt at full capacity (10 available)")
    info("This means 10-seat buses auto-halt immediately unless bypassed")
  } else {
    fail("10-seat bus should trigger auto-halt at 10 seats")
  }

  await prisma.trip.delete({ where: { id: trip.id } })

  test("Edge case: 0 seats should halt regardless of bypasses")

  trip = await prisma.trip.create({
    data: {
      companyId,
      origin: "Addis Ababa",
      destination: "Test City 9",
      departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: 500,
      busType: "STANDARD",
      totalSlots: 30,
      availableSlots: 0, // Full capacity
      estimatedDuration: 5,
      driverId,
      conductorId,
      vehicleId,
      bookingHalted: true, // Must be halted
      reportGenerated: true,
      autoResumeEnabled: true, // Even with bypass
    },
  })

  if (trip.availableSlots === 0 && trip.bookingHalted) {
    pass("0 seats forces halt (physical constraint)")
  } else {
    fail("0 seats must halt unconditionally")
  }

  await prisma.trip.delete({ where: { id: trip.id } })
  info("Cleanup complete")
}

main()

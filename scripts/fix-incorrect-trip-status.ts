/**
 * FIX INCORRECT TRIP STATUS SCRIPT
 *
 * This script resets trips that were incorrectly marked as COMPLETED/DEPARTED/HALTED
 * due to the timezone bug (server running in UTC comparing with Ethiopia time).
 *
 * The bug: AWS EC2 runs in UTC. When the cron job compared departure times using
 * `new Date(trip.departureTime) < new Date()`, it incorrectly marked future trips
 * as departed because of the 3-hour timezone difference.
 *
 * Run this ONCE after deploying the timezone fix:
 *   npx tsx scripts/fix-incorrect-trip-status.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Ethiopia timezone constant
const ETHIOPIA_TIMEZONE = "Africa/Addis_Ababa";

/**
 * Get current time in Ethiopia timezone
 */
function getNowEthiopia(): Date {
  const now = new Date();
  const ethiopiaString = now.toLocaleString("en-US", {
    timeZone: ETHIOPIA_TIMEZONE,
  });
  return new Date(ethiopiaString);
}

/**
 * Convert a date to Ethiopia timezone for comparison
 */
function toEthiopiaTime(date: Date | string): Date {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const ethiopiaString = dateObj.toLocaleString("en-US", {
    timeZone: ETHIOPIA_TIMEZONE,
  });
  return new Date(ethiopiaString);
}

/**
 * Check if a departure time is in the future in Ethiopia timezone
 */
function isFutureEthiopia(departureTime: Date | string): boolean {
  const departure = toEthiopiaTime(departureTime);
  const now = getNowEthiopia();
  return departure > now;
}

async function fixIncorrectTripStatus() {
  const now = getNowEthiopia();
  console.log("🔧 Starting trip status correction...");
  console.log(`📅 Current Ethiopia time: ${now.toISOString()}\n`);

  try {
    // Find trips that were incorrectly marked:
    // 1. Status is COMPLETED, DEPARTED, or DELAYED but departure is STILL in the future
    // 2. bookingHalted = true but departure is still in the future
    const incorrectlyMarkedTrips = await prisma.trip.findMany({
      where: {
        OR: [
          // Trips marked as DEPARTED/COMPLETED but haven't departed yet
          {
            status: { in: ["DEPARTED", "COMPLETED"] },
          },
          // Trips marked as DELAYED but haven't reached departure time
          {
            status: "DELAYED",
          },
          // Trips with booking halted (likely from auto-halt triggered by timezone bug)
          {
            bookingHalted: true,
            status: "SCHEDULED",
          },
        ],
      },
      include: {
        company: {
          select: { name: true },
        },
        bookings: {
          where: { status: "PAID" },
          select: { id: true },
        },
      },
      orderBy: { departureTime: "asc" },
    });

    console.log(
      `📊 Found ${incorrectlyMarkedTrips.length} trips to analyze\n`
    );

    let resetCount = 0;
    let unhaltedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const trip of incorrectlyMarkedTrips) {
      try {
        // Check if departure time is STILL in the future (Ethiopia time)
        const isFuture = isFutureEthiopia(trip.departureTime);

        if (!isFuture) {
          // Trip has actually departed - skip
          console.log(
            `⏭️  ${trip.company.name}: ${trip.origin} → ${trip.destination} - Already departed (${trip.status})`
          );
          skippedCount++;
          continue;
        }

        // This trip was incorrectly marked - reset it
        const oldStatus = trip.status;
        const wasHalted = trip.bookingHalted;
        const hasBookings = trip.bookings.length > 0;

        // Determine what needs to be reset
        const updates: any = {};

        // Reset status if it was incorrectly set to DEPARTED/COMPLETED/DELAYED
        if (["DEPARTED", "COMPLETED", "DELAYED"].includes(trip.status)) {
          updates.status = "SCHEDULED";
          updates.actualDepartureTime = null;
          updates.actualArrivalTime = null;
          updates.delayedAt = null;
        }

        // Reset bookingHalted ONLY if:
        // 1. Status was changed due to auto-departed (not manual halt)
        // 2. Trip has available slots
        // 3. We're resetting status back to SCHEDULED
        if (wasHalted && trip.availableSlots > 0 && updates.status) {
          // Check if this was auto-halted vs manually halted
          // Auto-halt from cron sets bookingHalted=true when marking DEPARTED
          // We'll reset it if status was DEPARTED/COMPLETED
          if (["DEPARTED", "COMPLETED"].includes(oldStatus)) {
            updates.bookingHalted = false;
            updates.adminResumedFromAutoHalt = true; // Flag to prevent re-halt
          }
        }

        if (Object.keys(updates).length === 0) {
          console.log(
            `⏭️  ${trip.company.name}: ${trip.origin} → ${trip.destination} - No changes needed`
          );
          skippedCount++;
          continue;
        }

        // Apply the fix
        await prisma.$transaction(async (tx) => {
          await tx.trip.update({
            where: { id: trip.id },
            data: updates,
          });

          // Create audit log
          await tx.adminLog.create({
            data: {
              userId: "SYSTEM",
              action: "TRIP_STATUS_TIMEZONE_FIX",
              tripId: trip.id,
              companyId: trip.companyId,
              details: JSON.stringify({
                reason: "Reset trip incorrectly marked due to UTC/Ethiopia timezone bug",
                oldStatus,
                newStatus: updates.status || oldStatus,
                wasHalted,
                nowHalted: updates.bookingHalted ?? wasHalted,
                departureTime: trip.departureTime.toISOString(),
                ethiopiaNow: now.toISOString(),
                hasBookings,
                fixedAt: new Date().toISOString(),
              }),
            },
          });
        });

        if (updates.status) {
          console.log(
            `✅ ${trip.company.name}: ${trip.origin} → ${trip.destination} (${oldStatus} → SCHEDULED)`
          );
          resetCount++;
        }

        if (updates.bookingHalted === false) {
          console.log(
            `   ↳ Booking resumed (was incorrectly halted)`
          );
          unhaltedCount++;
        }
      } catch (error) {
        const errorMsg = `Failed to fix trip ${trip.id}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log("\n📈 Fix Summary:");
    console.log(`   ✅ Trips reset to SCHEDULED: ${resetCount}`);
    console.log(`   🔓 Trips with booking resumed: ${unhaltedCount}`);
    console.log(`   ⏭️  Trips skipped (already departed): ${skippedCount}`);

    if (errors.length > 0) {
      console.log(`   ❌ Errors: ${errors.length}`);
      console.log("\n❌ Errors encountered:");
      errors.forEach((err) => console.log(`   - ${err}`));
    }

    console.log("\n✅ Fix completed!");
  } catch (error) {
    console.error("❌ Fatal error during fix:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixIncorrectTripStatus();

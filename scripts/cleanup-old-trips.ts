// Script to cleanup old trips with dates in the past
// This should be run ONCE to clean up existing data
// Then the cron job will handle future trips automatically
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupOldTrips() {
  try {
    const now = new Date();

    console.log("🔧 Starting old trip cleanup...\n");

    // Find all trips with departure time before now that need status updates
    const oldTrips = await prisma.trip.findMany({
      where: {
        departureTime: {
          lt: now,
        },
        status: {
          notIn: ["COMPLETED", "CANCELLED"],
        },
      },
      include: {
        bookings: {
          where: {
            status: {
              in: ["PAID", "COMPLETED"],
            },
          },
        },
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log(`📊 Found ${oldTrips.length} trips to update\n`);

    if (oldTrips.length === 0) {
      console.log("✅ No trips need cleanup!");
      return;
    }

    let completedCount = 0;
    let cancelledCount = 0;
    const errors: string[] = [];

    for (const trip of oldTrips) {
      try {
        const hasBookings = trip.bookings.length > 0;
        const newStatus = hasBookings || trip.status === "DEPARTED" ? "COMPLETED" : "CANCELLED";

        // Calculate actual times based on estimated duration
        // FIX: estimatedDuration is stored in MINUTES, not hours!
        const actualDepartureTime = trip.departureTime;
        const actualArrivalTime = new Date(
          actualDepartureTime.getTime() + trip.estimatedDuration * 60 * 1000
        );

        await prisma.trip.update({
          where: { id: trip.id },
          data: {
            status: newStatus,
            actualDepartureTime,
            actualArrivalTime,
          },
        });

        if (newStatus === "COMPLETED") {
          completedCount++;
          console.log(
            `✅ ${trip.company.name}: ${trip.origin} → ${trip.destination} (${trip.status} → COMPLETED)`
          );
        } else {
          cancelledCount++;
          console.log(
            `🚫 ${trip.company.name}: ${trip.origin} → ${trip.destination} (${trip.status} → CANCELLED)`
          );
        }

        // Create audit log
        await prisma.adminLog.create({
          data: {
            userId: "SYSTEM",
            action: "TRIP_STATUS_AUTO_UPDATE",
            tripId: trip.id,
            companyId: trip.companyId,
            details: JSON.stringify({
              oldStatus: trip.status,
              newStatus,
              reason: "Automatic cleanup - departure date in the past",
              departureTime: trip.departureTime.toISOString(),
              hasBookings,
            }),
          },
        });
      } catch (error) {
        const errorMsg = `Failed to update trip ${trip.id}: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log("\n📈 Cleanup Summary:");
    console.log(`   ✅ Marked as COMPLETED: ${completedCount}`);
    console.log(`   🚫 Marked as CANCELLED: ${cancelledCount}`);

    if (errors.length > 0) {
      console.log(`   ❌ Errors: ${errors.length}`);
      console.log("\n❌ Errors encountered:");
      errors.forEach((err) => console.log(`   - ${err}`));
    }

    console.log("\n✅ Cleanup completed!");
  } catch (error) {
    console.error("❌ Fatal error during cleanup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOldTrips();

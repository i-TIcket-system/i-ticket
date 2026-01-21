// Script to fix bookingHalted for DEPARTED, COMPLETED, and CANCELLED trips
// These trip statuses should ALWAYS have bookingHalted = true
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixBookingHalted() {
  try {
    console.log("🔧 Fixing bookingHalted for DEPARTED, COMPLETED, and CANCELLED trips...\n");

    // Find trips with these statuses but bookingHalted = false
    const tripsToFix = await prisma.trip.findMany({
      where: {
        status: {
          in: ["DEPARTED", "COMPLETED", "CANCELLED"],
        },
        bookingHalted: false,
      },
      select: {
        id: true,
        status: true,
        origin: true,
        destination: true,
        departureTime: true,
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log(`📊 Found ${tripsToFix.length} trips to fix\n`);

    if (tripsToFix.length === 0) {
      console.log("✅ All trips already have correct bookingHalted status!");
      return;
    }

    let fixed = 0;
    const errors: string[] = [];

    for (const trip of tripsToFix) {
      try {
        await prisma.trip.update({
          where: { id: trip.id },
          data: { bookingHalted: true },
        });

        console.log(
          `✅ Fixed: ${trip.company.name} - ${trip.origin} → ${trip.destination} (${trip.status})`
        );
        fixed++;
      } catch (error) {
        const errorMsg = `Failed to update trip ${trip.id}: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log("\n📈 Fix Summary:");
    console.log(`   ✅ Fixed: ${fixed} trips`);

    if (errors.length > 0) {
      console.log(`   ❌ Errors: ${errors.length}`);
      console.log("\n❌ Errors encountered:");
      errors.forEach((err) => console.log(`   - ${err}`));
    }

    console.log("\n✅ Fix completed!");
  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBookingHalted();

// Script to check for trips with dates before current date
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkOldTrips() {
  try {
    const now = new Date();

    // Find all trips with departure time before now
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
        company: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        departureTime: "asc",
      },
    });

    console.log(`\n📊 Found ${oldTrips.length} trips with old dates that need status updates\n`);

    if (oldTrips.length === 0) {
      console.log("✅ All trips are up to date!");
      return;
    }

    // Group by status
    const byStatus = oldTrips.reduce((acc, trip) => {
      acc[trip.status] = (acc[trip.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("📈 Breakdown by current status:");
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} trips`);
    });

    // Show some examples
    console.log("\n📝 Sample trips (first 10):");
    oldTrips.slice(0, 10).forEach((trip) => {
      const daysAgo = Math.floor(
        (now.getTime() - new Date(trip.departureTime).getTime()) / (1000 * 60 * 60 * 24)
      );
      console.log(
        `   - ${trip.company.name}: ${trip.origin} → ${trip.destination} (${daysAgo} days ago, Status: ${trip.status})`
      );
    });

    // Check if any have bookings
    const withBookings = await prisma.trip.count({
      where: {
        id: {
          in: oldTrips.map((t) => t.id),
        },
        bookings: {
          some: {},
        },
      },
    });

    console.log(`\n💺 ${withBookings} trips have bookings`);
    console.log(`📭 ${oldTrips.length - withBookings} trips have no bookings\n`);
  } catch (error) {
    console.error("❌ Error checking old trips:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOldTrips();

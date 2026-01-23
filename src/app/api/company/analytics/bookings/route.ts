// RULE-001: Company Data Segregation
// Bookings analytics API - Returns booking status breakdown and weekly occupancy
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireCompanyAdmin, handleAuthError } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const { companyId } = await requireCompanyAdmin();

    // Get booking status breakdown (all time)
    const statusCounts = await prisma.booking.groupBy({
      by: ["status"],
      where: {
        trip: {
          companyId, // RULE-001: Company segregation
        },
      },
      _count: {
        status: true,
      },
    });

    const bookingStats = {
      paid: statusCounts.find((s) => s.status === "PAID")?._count.status || 0,
      pending: statusCounts.find((s) => s.status === "PENDING")?._count.status || 0,
      cancelled: statusCounts.find((s) => s.status === "CANCELLED")?._count.status || 0,
    };

    // Get weekly occupancy for last 8 weeks
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    eightWeeksAgo.setHours(0, 0, 0, 0);

    const trips = await prisma.trip.findMany({
      where: {
        companyId, // RULE-001: Company segregation
        departureTime: {
          gte: eightWeeksAgo,
        },
        status: {
          in: ["DEPARTED", "COMPLETED"],
        },
      },
      select: {
        totalSlots: true,
        availableSlots: true,
        departureTime: true,
      },
    });

    // Group by week and calculate average occupancy
    const weeklyOccupancy = new Map<number, { total: number; count: number }>();

    trips.forEach((trip) => {
      const weekNumber = Math.floor(
        (Date.now() - trip.departureTime.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      const weekKey = 7 - weekNumber; // Reverse so Week 1 is oldest

      if (weekKey >= 1 && weekKey <= 8) {
        const occupancy =
          trip.totalSlots > 0
            ? ((trip.totalSlots - trip.availableSlots) / trip.totalSlots) * 100
            : 0;

        const existing = weeklyOccupancy.get(weekKey) || { total: 0, count: 0 };
        existing.total += occupancy;
        existing.count += 1;
        weeklyOccupancy.set(weekKey, existing);
      }
    });

    // Calculate averages
    const occupancyData = Array.from({ length: 8 }, (_, i) => {
      const weekKey = i + 1;
      const data = weeklyOccupancy.get(weekKey);
      return {
        week: `Week ${weekKey}`,
        occupancy: data ? Math.round(data.total / data.count) : 0,
      };
    });

    return NextResponse.json({
      bookingStats,
      occupancyData,
    });
  } catch (error) {
    console.error("Bookings analytics error:", error);
    return handleAuthError(error);
  }
}

// RULE-001: Company Data Segregation
// Routes analytics API - Returns top 5 routes by bookings and revenue (last 30 days)
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireCompanyAdmin, handleAuthError } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const { companyId } = await requireCompanyAdmin();

    // Get date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Fetch all trips from last 30 days with their bookings
    const trips = await prisma.trip.findMany({
      where: {
        companyId, // RULE-001: Company segregation
        departureTime: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        origin: true,
        destination: true,
        bookings: {
          where: {
            status: "PAID",
          },
          select: {
            totalAmount: true,
            commission: true,
            commissionVAT: true,
          },
        },
      },
    });

    // Group by route
    const routeStats = new Map<
      string,
      { route: string; bookings: number; revenue: number }
    >();

    trips.forEach((trip) => {
      const routeKey = `${trip.origin} → ${trip.destination}`;
      const existing = routeStats.get(routeKey) || {
        route: routeKey,
        bookings: 0,
        revenue: 0,
      };

      existing.bookings += trip.bookings.length;
      existing.revenue += trip.bookings.reduce(
        (sum, booking) => {
          // Company gets: totalAmount - commission - commissionVAT
          const companyRevenue = (booking.totalAmount || 0) - (booking.commission || 0) - (booking.commissionVAT || 0);
          return sum + companyRevenue;
        },
        0
      );

      routeStats.set(routeKey, existing);
    });

    // Sort by bookings and get top 5
    const topRoutes = Array.from(routeStats.values())
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);

    return NextResponse.json({ topRoutes });
  } catch (error) {
    console.error("Routes analytics error:", error);
    return handleAuthError(error);
  }
}

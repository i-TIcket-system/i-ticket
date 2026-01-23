// RULE-001: Company Data Segregation
// Revenue analytics API - Returns daily revenue for last 30 days
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

    // Fetch all PAID bookings from last 30 days
    const bookings = await prisma.booking.findMany({
      where: {
        trip: {
          companyId, // RULE-001: Company segregation
        },
        status: "PAID",
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        totalAmount: true,
        commission: true,
        commissionVAT: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Group by date and calculate daily revenue
    const revenueByDate = new Map<string, { revenue: number; bookings: number }>();

    // Initialize all 30 days with 0
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dateKey = date.toISOString().split("T")[0];
      revenueByDate.set(dateKey, { revenue: 0, bookings: 0 });
    }

    // Aggregate bookings by date
    bookings.forEach((booking) => {
      const dateKey = booking.createdAt.toISOString().split("T")[0];
      const existing = revenueByDate.get(dateKey);
      if (existing) {
        // Company gets: totalAmount - commission - commissionVAT
        const companyRevenue = (booking.totalAmount || 0) - (booking.commission || 0) - (booking.commissionVAT || 0);
        existing.revenue += companyRevenue;
        existing.bookings += 1;
      }
    });

    // Convert to array format for charts
    const data = Array.from(revenueByDate.entries()).map(([date, stats]) => ({
      date,
      revenue: stats.revenue,
      bookings: stats.bookings,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Revenue analytics error:", error);
    return handleAuthError(error);
  }
}

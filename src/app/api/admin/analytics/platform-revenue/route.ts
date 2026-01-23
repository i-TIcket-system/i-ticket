// Super Admin Analytics - Platform Revenue
// Returns total platform revenue (5% commission + 15% VAT) from all bookings
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireSuperAdmin, handleAuthError } from "@/lib/auth-helpers";

export async function GET() {
  try {
    await requireSuperAdmin();

    // Get all PAID bookings
    const bookings = await prisma.booking.findMany({
      where: {
        status: "PAID",
      },
      select: {
        commission: true,
        commissionVAT: true,
        createdAt: true,
        _count: {
          select: {
            passengers: true,
          },
        },
      },
    });

    // Calculate totals
    const totalRevenue = bookings.reduce((sum, booking) => {
      return sum + (booking.commission || 0) + (booking.commissionVAT || 0);
    }, 0);

    const totalCommission = bookings.reduce((sum, booking) => {
      return sum + (booking.commission || 0);
    }, 0);

    const totalVAT = bookings.reduce((sum, booking) => {
      return sum + (booking.commissionVAT || 0);
    }, 0);

    const totalBookings = bookings.length;
    const totalPassengers = bookings.reduce((sum, b) => sum + b._count.passengers, 0);

    // Calculate last 30 days for trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBookings = bookings.filter(
      (b) => b.createdAt >= thirtyDaysAgo
    );

    const recentRevenue = recentBookings.reduce((sum, booking) => {
      return sum + (booking.commission || 0) + (booking.commissionVAT || 0);
    }, 0);

    // Calculate previous 30 days for comparison
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const previousBookings = bookings.filter(
      (b) => b.createdAt >= sixtyDaysAgo && b.createdAt < thirtyDaysAgo
    );

    const previousRevenue = previousBookings.reduce((sum, booking) => {
      return sum + (booking.commission || 0) + (booking.commissionVAT || 0);
    }, 0);

    const percentChange =
      previousRevenue > 0
        ? ((recentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    return NextResponse.json({
      totalRevenue,
      totalCommission,
      totalVAT,
      totalBookings,
      totalPassengers,
      recentRevenue,
      percentChange: Math.round(percentChange * 10) / 10,
    });
  } catch (error) {
    console.error("Platform revenue analytics error:", error);
    return handleAuthError(error);
  }
}

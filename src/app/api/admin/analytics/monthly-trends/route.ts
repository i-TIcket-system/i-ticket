// Super Admin Analytics - Monthly Income/Expenses Trends
// Returns 12 months of platform income and expenses
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireSuperAdmin, handleAuthError } from "@/lib/auth-helpers";

export async function GET() {
  try {
    await requireSuperAdmin();

    // Get last 12 months of PAID bookings
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const bookings = await prisma.booking.findMany({
      where: {
        status: "PAID",
        createdAt: {
          gte: twelveMonthsAgo,
        },
      },
      select: {
        commission: true,
        commissionVAT: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Group by month
    const monthlyData = new Map<string, { income: number; expenses: number; netProfit: number }>();

    // Initialize all 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      const monthKey = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      monthlyData.set(monthKey, { income: 0, expenses: 0, netProfit: 0 });
    }

    // Aggregate income by month
    bookings.forEach((booking) => {
      const monthKey = booking.createdAt.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      const income = (booking.commission || 0) + (booking.commissionVAT || 0);

      const existing = monthlyData.get(monthKey);
      if (existing) {
        existing.income += income;
      }
    });

    // TODO: Replace with real expense data from PlatformExpenses table
    // For now, calculate estimated expenses (placeholder: 60% of income)
    monthlyData.forEach((data) => {
      data.expenses = Math.round(data.income * 0.6); // Placeholder: 60% expense ratio
      data.netProfit = data.income - data.expenses;
    });

    // Convert to array
    const monthlyTrends = Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      netProfit: data.netProfit,
    }));

    // Calculate totals
    const totalIncome = monthlyTrends.reduce((sum, m) => sum + m.income, 0);
    const totalExpenses = monthlyTrends.reduce((sum, m) => sum + m.expenses, 0);
    const totalNetProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (totalNetProfit / totalIncome) * 100 : 0;

    return NextResponse.json({
      monthlyTrends,
      summary: {
        totalIncome,
        totalExpenses,
        totalNetProfit,
        profitMargin: Math.round(profitMargin * 10) / 10,
      },
    });
  } catch (error) {
    console.error("Monthly trends analytics error:", error);
    return handleAuthError(error);
  }
}

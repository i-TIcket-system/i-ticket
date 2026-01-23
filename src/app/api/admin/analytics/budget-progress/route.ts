// Super Admin Analytics - Budget Progress
// Returns income and expense budget progress (% of target achieved)
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireSuperAdmin, handleAuthError } from "@/lib/auth-helpers";

export async function GET() {
  try {
    await requireSuperAdmin();

    // Get current month's data
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const bookings = await prisma.booking.findMany({
      where: {
        status: "PAID",
        createdAt: {
          gte: startOfMonth,
        },
      },
      select: {
        commission: true,
        commissionVAT: true,
      },
    });

    // Calculate actual income (commission + VAT)
    const actualIncome = bookings.reduce((sum, booking) => {
      return sum + (booking.commission || 0) + (booking.commissionVAT || 0);
    }, 0);

    // Calculate actual expenses (placeholder: 60% of income)
    const actualExpenses = Math.round(actualIncome * 0.6);

    // TODO: Replace with configurable budget targets from database
    // For now, use estimated monthly targets
    const monthlyIncomeTarget = 500000; // 500K ETB target
    const monthlyExpenseTarget = 300000; // 300K ETB budget

    const incomeProgress =
      monthlyIncomeTarget > 0
        ? Math.min((actualIncome / monthlyIncomeTarget) * 100, 100)
        : 0;

    const expenseProgress =
      monthlyExpenseTarget > 0
        ? Math.min((actualExpenses / monthlyExpenseTarget) * 100, 100)
        : 0;

    // Days elapsed in month (for prorated targets)
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate();
    const expectedProgressPercent = (daysElapsed / daysInMonth) * 100;

    return NextResponse.json({
      income: {
        actual: actualIncome,
        target: monthlyIncomeTarget,
        progress: Math.round(incomeProgress),
        expectedProgress: Math.round(expectedProgressPercent),
        status:
          incomeProgress >= expectedProgressPercent
            ? "on-track"
            : incomeProgress >= expectedProgressPercent * 0.9
            ? "at-risk"
            : "behind",
      },
      expenses: {
        actual: actualExpenses,
        target: monthlyExpenseTarget,
        progress: Math.round(expenseProgress),
        expectedProgress: Math.round(expectedProgressPercent),
        status:
          expenseProgress <= expectedProgressPercent
            ? "on-track"
            : expenseProgress <= expectedProgressPercent * 1.1
            ? "at-risk"
            : "over-budget",
      },
    });
  } catch (error) {
    console.error("Budget progress analytics error:", error);
    return handleAuthError(error);
  }
}

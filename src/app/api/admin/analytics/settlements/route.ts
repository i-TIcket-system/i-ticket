// Super Admin Analytics - Pending Settlements
// Returns money owed TO bus companies (their ticket revenue)
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireSuperAdmin, handleAuthError } from "@/lib/auth-helpers";

export async function GET() {
  try {
    await requireSuperAdmin();

    // Get all PAID bookings grouped by company
    const bookings = await prisma.booking.findMany({
      where: {
        status: "PAID",
      },
      select: {
        totalAmount: true,
        commission: true,
        commissionVAT: true,
        trip: {
          select: {
            companyId: true,
            company: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Group by company
    const settlementsByCompany = new Map<
      string,
      { companyName: string; owed: number; bookings: number }
    >();

    bookings.forEach((booking) => {
      const companyId = booking.trip.companyId;
      const existing = settlementsByCompany.get(companyId) || {
        companyName: booking.trip.company.name,
        owed: 0,
        bookings: 0,
      };

      // Company gets: totalAmount - commission - commissionVAT
      const companyShare = (booking.totalAmount || 0) - (booking.commission || 0) - (booking.commissionVAT || 0);
      existing.owed += companyShare;
      existing.bookings += 1;

      settlementsByCompany.set(companyId, existing);
    });

    // Total pending settlements
    const totalPending = Array.from(settlementsByCompany.values()).reduce(
      (sum, company) => sum + company.owed,
      0
    );

    // Top 5 companies by pending amount
    const topCompanies = Array.from(settlementsByCompany.entries())
      .map(([id, data]) => ({ companyId: id, ...data }))
      .sort((a, b) => b.owed - a.owed)
      .slice(0, 5);

    return NextResponse.json({
      totalPending,
      companiesCount: settlementsByCompany.size,
      topCompanies,
    });
  } catch (error) {
    console.error("Settlements analytics error:", error);
    return handleAuthError(error);
  }
}

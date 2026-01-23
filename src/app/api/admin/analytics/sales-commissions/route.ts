// Super Admin Analytics - Sales Commissions Payable
// Returns money owed to sales team (commissions not yet paid)
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireSuperAdmin, handleAuthError } from "@/lib/auth-helpers";

export async function GET() {
  try {
    await requireSuperAdmin();

    // Get all sales commissions
    const commissions = await prisma.salesCommission.findMany({
      include: {
        salesPerson: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    // Calculate totals by status
    const pending = commissions
      .filter((c) => c.status === "PENDING")
      .reduce((sum, c) => sum + c.salesCommission, 0);

    const approved = commissions
      .filter((c) => c.status === "APPROVED")
      .reduce((sum, c) => sum + c.salesCommission, 0);

    const paid = commissions
      .filter((c) => c.status === "PAID")
      .reduce((sum, c) => sum + c.salesCommission, 0);

    const totalPayable = pending + approved; // Not yet paid

    // Group by sales person
    const bySalesPerson = new Map<
      string,
      { name: string; phone: string; pending: number; approved: number }
    >();

    commissions
      .filter((c) => c.status !== "PAID")
      .forEach((commission) => {
        const key = commission.salesPersonId;
        const existing = bySalesPerson.get(key) || {
          name: commission.salesPerson.name,
          phone: commission.salesPerson.phone,
          pending: 0,
          approved: 0,
        };

        if (commission.status === "PENDING") {
          existing.pending += commission.salesCommission;
        } else if (commission.status === "APPROVED") {
          existing.approved += commission.salesCommission;
        }

        bySalesPerson.set(key, existing);
      });

    // Top 5 sales persons by payable salesCommission
    const topSalesPersons = Array.from(bySalesPerson.entries())
      .map(([id, data]) => ({
        salesPersonId: id,
        ...data,
        total: data.pending + data.approved,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return NextResponse.json({
      totalPayable,
      pending,
      approved,
      paid,
      salesPersonsCount: bySalesPerson.size,
      topSalesPersons,
    });
  } catch (error) {
    console.error("Sales commissions analytics error:", error);
    return handleAuthError(error);
  }
}

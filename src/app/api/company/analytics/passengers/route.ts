// RULE-001: Company Data Segregation
// Passenger analytics API - Returns total passengers and milestone progress
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireCompanyAdmin, handleAuthError } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const { companyId } = await requireCompanyAdmin();

    // Count total passengers from PAID bookings
    const bookings = await prisma.booking.findMany({
      where: {
        trip: {
          companyId, // RULE-001: Company segregation
        },
        status: "PAID",
      },
      select: {
        _count: {
          select: {
            passengers: true,
          },
        },
      },
    });

    const totalPassengers = bookings.reduce((sum, b) => sum + b._count.passengers, 0);

    // Milestone thresholds
    const milestones = [100, 1000, 10000, 100000, 1000000];

    // Find current and next milestone
    let currentMilestone = 0;
    let nextMilestone = milestones[0];

    for (const milestone of milestones) {
      if (totalPassengers >= milestone) {
        currentMilestone = milestone;
      } else {
        nextMilestone = milestone;
        break;
      }
    }

    // If exceeded all milestones
    if (totalPassengers >= milestones[milestones.length - 1]) {
      currentMilestone = milestones[milestones.length - 1];
      nextMilestone = currentMilestone * 10; // Next order of magnitude
    }

    // Calculate progress percentage
    const progressPercent =
      currentMilestone === 0
        ? (totalPassengers / nextMilestone) * 100
        : ((totalPassengers - currentMilestone) / (nextMilestone - currentMilestone)) * 100;

    return NextResponse.json({
      totalPassengers,
      currentMilestone,
      nextMilestone,
      progressPercent: Math.min(Math.round(progressPercent), 100),
    });
  } catch (error) {
    console.error("Passenger analytics error:", error);
    return handleAuthError(error);
  }
}

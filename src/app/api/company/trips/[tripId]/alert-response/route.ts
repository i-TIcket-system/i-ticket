import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/lib/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    if (session.user.role !== "COMPANY_ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { allowContinue } = body

    // CRITICAL: Verify trip belongs to this company (company segregation)
    const existingTrip = await prisma.trip.findUnique({
      where: { id: params.tripId },
      select: { id: true, companyId: true }
    })

    if (!existingTrip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Super admin can access any trip, company admin only their own
    if (session.user.role === "COMPANY_ADMIN" && existingTrip.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: "Access denied - Trip belongs to another company" },
        { status: 403 }
      )
    }

    // Update trip
    const trip = await prisma.trip.update({
      where: { id: params.tripId },
      data: {
        bookingHalted: !allowContinue,
      },
    })

    // Log the admin decision
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: allowContinue ? "ALLOW_BOOKING_CONTINUE" : "STOP_BOOKING",
        tripId: params.tripId,
        details: `Admin ${session.user.name} (${session.user.phone}) ${
          allowContinue ? "allowed" : "stopped"
        } online booking for trip ${trip.origin} to ${trip.destination}.`,
      },
    })

    // In production, send SMS notification here
    console.log(
      `[ADMIN LOG] ${session.user.name} ${
        allowContinue ? "CONTINUED" : "STOPPED"
      } booking for trip ${params.tripId}`
    )

    return NextResponse.json({ success: true, trip })
  } catch (error) {
    console.error("Alert response error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

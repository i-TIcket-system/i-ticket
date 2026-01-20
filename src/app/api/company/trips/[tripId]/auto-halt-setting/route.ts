import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

const AutoHaltSettingSchema = z.object({
  autoResumeEnabled: z.boolean()
})

/**
 * Update auto-halt setting for a specific trip
 * Allows companies to disable/enable auto-halt without changing booking status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "COMPANY_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Company admin access required" },
        { status: 401 }
      )
    }

    const tripId = params.tripId
    const body = await request.json()
    const validation = AutoHaltSettingSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { autoResumeEnabled } = validation.data

    // Verify trip belongs to user's company
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { companyId: true }
    })

    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      )
    }

    if (trip.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: "Forbidden - Trip belongs to another company" },
        { status: 403 }
      )
    }

    // Update auto-halt setting
    await prisma.trip.update({
      where: { id: tripId },
      data: { autoResumeEnabled }
    })

    return NextResponse.json({
      success: true,
      message: autoResumeEnabled
        ? "Auto-halt disabled - booking will continue below 10 seats"
        : "Auto-halt enabled - booking will halt at 10 seats"
    })
  } catch (error) {
    console.error("Auto-halt setting update error:", error)
    return NextResponse.json(
      { error: "Failed to update auto-halt setting" },
      { status: 500 }
    )
  }
}

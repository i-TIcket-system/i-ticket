import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

/**
 * GET /api/sales/recruiter-info?code=SALES123
 * Get sales person info by referral code (for showing recruitment banner)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.json(
        { error: "Referral code is required" },
        { status: 400 }
      )
    }

    // Find sales person by referral code
    const salesPerson = await prisma.salesPerson.findUnique({
      where: { referralCode: code },
      select: {
        id: true,
        name: true,
        referralCode: true,
        status: true,
        tier: true,
      },
    })

    if (!salesPerson) {
      return NextResponse.json(
        { error: "Sales person not found" },
        { status: 404 }
      )
    }

    // Check if sales person is active
    if (salesPerson.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This sales person is no longer active" },
        { status: 403 }
      )
    }

    return NextResponse.json({
      recruiter: {
        name: salesPerson.name,
        referralCode: salesPerson.referralCode,
        tier: salesPerson.tier,
      },
    })
  } catch (error) {
    console.error("Error fetching recruiter info:", error)
    return NextResponse.json(
      { error: "Failed to fetch recruiter info" },
      { status: 500 }
    )
  }
}

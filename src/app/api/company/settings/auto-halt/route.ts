import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireCompanyAdmin, handleAuthError } from "@/lib/auth-helpers"

/**
 * Toggle company-wide auto-halt setting
 * Allows company admin to disable/enable auto-halt for ALL trips at once
 */
export async function POST(request: NextRequest) {
  try {
    const { session, companyId } = await requireCompanyAdmin()

    const { disableAutoHaltGlobally } = await request.json()

    // Validate input
    if (typeof disableAutoHaltGlobally !== 'boolean') {
      return NextResponse.json(
        { error: "disableAutoHaltGlobally must be a boolean" },
        { status: 400 }
      )
    }

    // Update company setting
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        disableAutoHaltGlobally,
      },
      select: {
        id: true,
        name: true,
        disableAutoHaltGlobally: true,
      },
    })

    // Log the action
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: disableAutoHaltGlobally
          ? "AUTO_HALT_DISABLED_GLOBALLY"
          : "AUTO_HALT_ENABLED_GLOBALLY",
        companyId,
        details: JSON.stringify({
          performedBy: session.user.name,
          disableAutoHaltGlobally,
          message: disableAutoHaltGlobally
            ? "Auto-halt disabled for all trips"
            : "Auto-halt re-enabled for all trips",
          timestamp: new Date().toISOString(),
        }),
      },
    })

    return NextResponse.json({
      success: true,
      message: disableAutoHaltGlobally
        ? "Auto-halt disabled for all trips. Online booking will never stop at 10 seats."
        : "Auto-halt re-enabled for all trips. System will auto-halt at 10 seats remaining.",
      company: updatedCompany,
    })
  } catch (error) {
    console.error("Toggle company auto-halt error:", error)
    return handleAuthError(error)
  }
}

/**
 * Get company-wide auto-halt setting
 */
export async function GET() {
  try {
    const { companyId } = await requireCompanyAdmin()

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        disableAutoHaltGlobally: true,
      },
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      company,
    })
  } catch (error) {
    console.error("Get company auto-halt setting error:", error)
    return handleAuthError(error)
  }
}

import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireSalesPerson, handleAuthError } from "@/lib/auth-helpers"
import { generateSalesPersonQR, getReferralUrl } from "@/lib/sales/referral-utils"

/**
 * GET /api/sales/my-qr-code
 * Get current sales person's QR code and recruitment stats
 */
export async function GET() {
  try {
    const session = await requireSalesPerson()
    const salesPersonId = session.user.id

    // Get sales person data with recruits count
    const salesPerson = await prisma.salesPerson.findUnique({
      where: { id: salesPersonId },
      include: {
        _count: {
          select: {
            recruits: true, // Count recruited sales persons
          }
        }
      }
    })

    if (!salesPerson) {
      return NextResponse.json(
        { error: "Sales person not found" },
        { status: 404 }
      )
    }

    // Generate QR code using internal library (data URL - more reliable)
    const qrCodeUrl = await generateSalesPersonQR(salesPerson.referralCode)
    const referralUrl = getReferralUrl(salesPerson.referralCode)

    return NextResponse.json({
      referralCode: salesPerson.referralCode,
      referralUrl,
      qrCodeUrl,
      tier: salesPerson.tier,
      recruitsCount: salesPerson._count.recruits,
    })
  } catch (error: any) {
    console.error("QR Code API Error:", error?.message || error)
    return handleAuthError(error)
  }
}

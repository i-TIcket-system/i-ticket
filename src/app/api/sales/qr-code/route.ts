import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireSalesPerson, handleAuthError } from "@/lib/auth-helpers"
import { generateSalesPersonQR, getReferralUrl } from "@/lib/sales/referral-utils"

// GET /api/sales/qr-code - Get sales person's QR code
export async function GET(request: NextRequest) {
  try {
    const session = await requireSalesPerson()
    const salesPersonId = session.user.id

    const salesPerson = await prisma.salesPerson.findUnique({
      where: { id: salesPersonId },
      select: { referralCode: true, name: true }
    })

    if (!salesPerson) {
      return NextResponse.json(
        { error: "Sales person not found" },
        { status: 404 }
      )
    }

    const qrCodeUrl = await generateSalesPersonQR(salesPerson.referralCode)
    const referralUrl = getReferralUrl(salesPerson.referralCode)

    return NextResponse.json({
      name: salesPerson.name,
      referralCode: salesPerson.referralCode,
      referralUrl,
      qrCodeUrl,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

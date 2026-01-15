import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireSalesPerson, handleAuthError } from "@/lib/auth-helpers"
import { z } from "zod"

const updatePaymentSchema = z.object({
  bankAccountName: z.string().nullable().optional(),
  bankAccountNumber: z.string().nullable().optional(),
  bankName: z.string().nullable().optional(),
  alternativePhone: z.string().regex(/^09\d{8}$/).nullable().optional().or(z.literal("")),
})

// PUT /api/sales/profile/payment - Update payment settings
export async function PUT(request: NextRequest) {
  try {
    const session = await requireSalesPerson()
    const salesPersonId = session.user.id

    const body = await request.json()
    const validation = updatePaymentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { bankAccountName, bankAccountNumber, bankName, alternativePhone } = validation.data

    // Convert empty strings to null
    const updated = await prisma.salesPerson.update({
      where: { id: salesPersonId },
      data: {
        bankAccountName: bankAccountName || null,
        bankAccountNumber: bankAccountNumber || null,
        bankName: bankName || null,
        alternativePhone: alternativePhone || null,
      },
      select: {
        id: true,
        bankAccountName: true,
        bankAccountNumber: true,
        bankName: true,
        alternativePhone: true,
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}

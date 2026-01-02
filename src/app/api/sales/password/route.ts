import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireSalesPerson, handleAuthError } from "@/lib/auth-helpers"
import { z } from "zod"
import bcrypt from "bcryptjs"

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
})

// PUT /api/sales/password - Change sales person's password
export async function PUT(request: NextRequest) {
  try {
    const session = await requireSalesPerson()
    const salesPersonId = session.user.id

    const body = await request.json()
    const validation = changePasswordSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = validation.data

    // Get current password hash
    const salesPerson = await prisma.salesPerson.findUnique({
      where: { id: salesPersonId },
      select: { password: true }
    })

    if (!salesPerson) {
      return NextResponse.json(
        { error: "Sales person not found" },
        { status: 404 }
      )
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, salesPerson.password)
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await prisma.salesPerson.update({
      where: { id: salesPersonId },
      data: { password: hashedPassword }
    })

    return NextResponse.json({ success: true, message: "Password changed successfully" })
  } catch (error) {
    return handleAuthError(error)
  }
}

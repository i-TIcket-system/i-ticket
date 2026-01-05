import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import bcrypt from "bcryptjs"
import { resetPasswordSchema, validateRequest } from "@/lib/validations"
import { verifyResetToken } from "@/lib/password-reset"

/**
 * Reset password using reset token
 */
export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequest(request, resetPasswordSchema)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { token, newPassword } = validation.data

    // Verify token and get userId (also marks token as used)
    const userId = await verifyResetToken(token)

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    // Invalidate the token by logging the reset completion
    await prisma.adminLog.create({
      data: {
        userId,
        action: "PASSWORD_RESET_COMPLETED",
        details: `Password reset completed successfully`,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Password reset successful. You can now log in with your new password.",
    })
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

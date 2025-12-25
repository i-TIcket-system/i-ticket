import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import bcrypt from "bcryptjs"
import { resetPasswordSchema, validateRequest } from "@/lib/validations"

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

    // Find the most recent password reset request with this token
    const recentResets = await prisma.adminLog.findMany({
      where: {
        action: "PASSWORD_RESET_REQUEST",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Check last 100 reset requests
    })

    let matchingReset = null
    let userId = null

    for (const reset of recentResets) {
      try {
        const details = JSON.parse(reset.details || "{}")
        if (details.resetToken === token) {
          // Check if token is expired
          const expiresAt = new Date(details.expiresAt)
          if (expiresAt > new Date()) {
            matchingReset = reset
            userId = reset.userId
            break
          }
        }
      } catch (e) {
        // Skip invalid JSON
        continue
      }
    }

    if (!matchingReset || !userId) {
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

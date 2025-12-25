import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requestPasswordResetSchema, validateRequest } from "@/lib/validations"
import { generateShortCode } from "@/lib/utils"

/**
 * Request a password reset
 * Generates a reset token and sends it via SMS
 */
export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequest(request, requestPasswordResetSchema)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { phone } = validation.data

    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, name: true, phone: true }
    })

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with this phone number, you will receive a reset code via SMS"
      })
    }

    // Generate 6-digit reset code
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store reset token (in production, use a separate PasswordReset table)
    // For now, we'll use AdminLog as a temporary storage
    await prisma.adminLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET_REQUEST",
        details: JSON.stringify({
          resetToken,
          expiresAt: expiresAt.toISOString(),
          phone: user.phone,
        }),
      },
    })

    // In production, send SMS with reset code
    // For now, log to console in demo mode
    if (process.env.SMS_MOCK === "true") {
      console.log(`[SMS] Password reset code for ${user.phone}: ${resetToken}`)
      console.log(`This code expires at ${expiresAt.toISOString()}`)
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with this phone number, you will receive a reset code via SMS",
      // In demo mode, return the token (REMOVE IN PRODUCTION!)
      ...(process.env.DEMO_MODE === "true" && { resetToken, expiresAt }),
    })
  } catch (error) {
    console.error("Password reset request error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

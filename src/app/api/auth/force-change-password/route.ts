import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"

const ForceChangePasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

/**
 * Force password change for users with temporary passwords
 * No current password required (one-time exception)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validation = ForceChangePasswordSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { newPassword } = validation.data

    // Get user to verify mustChangePassword flag
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, mustChangePassword: true, name: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    if (!user.mustChangePassword) {
      return NextResponse.json(
        { error: "Password change not required. Use regular password change flow." },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password and clear mustChangePassword flag
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Password changed successfully. You can now use your new password to login.",
    })
  } catch (error) {
    console.error("Force password change error:", error)
    return NextResponse.json(
      { error: "Failed to change password. Please try again." },
      { status: 500 }
    )
  }
}

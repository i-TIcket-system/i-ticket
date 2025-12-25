import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAuth, handleAuthError } from "@/lib/auth-helpers"

/**
 * Get user profile
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        nationalId: true,
        role: true,
        companyId: true,
        nextOfKinName: true,
        nextOfKinPhone: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    return handleAuthError(error)
  }
}

/**
 * Update user profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()

    const body = await request.json()
    const { name, email, nationalId, nextOfKinName, nextOfKinPhone } = body

    // Validate Ethiopian phone format for next of kin if provided
    if (nextOfKinPhone && !/^09\d{8}$/.test(nextOfKinPhone)) {
      return NextResponse.json(
        { error: "Invalid Ethiopian phone number format for next of kin" },
        { status: 400 }
      )
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email: email || null }),
        ...(nationalId !== undefined && { nationalId: nationalId || null }),
        ...(nextOfKinName !== undefined && { nextOfKinName: nextOfKinName || null }),
        ...(nextOfKinPhone !== undefined && { nextOfKinPhone: nextOfKinPhone || null }),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        nationalId: true,
        role: true,
        nextOfKinName: true,
        nextOfKinPhone: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user,
    })
  } catch (error) {
    console.error("Profile update error:", error)
    return handleAuthError(error)
  }
}

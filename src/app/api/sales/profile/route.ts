import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireSalesPerson, handleAuthError } from "@/lib/auth-helpers"
import { z } from "zod"

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email().nullable().optional(),
})

// GET /api/sales/profile - Get sales person's profile
export async function GET(request: NextRequest) {
  try {
    const session = await requireSalesPerson()
    const salesPersonId = session.user.id

    const salesPerson = await prisma.salesPerson.findUnique({
      where: { id: salesPersonId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        referralCode: true,
        createdAt: true,
        lastLoginAt: true,
      }
    })

    if (!salesPerson) {
      return NextResponse.json(
        { error: "Sales person not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(salesPerson)
  } catch (error) {
    return handleAuthError(error)
  }
}

// PUT /api/sales/profile - Update sales person's profile
export async function PUT(request: NextRequest) {
  try {
    const session = await requireSalesPerson()
    const salesPersonId = session.user.id

    const body = await request.json()
    const validation = updateProfileSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, email } = validation.data

    // Check if email is taken by another sales person
    if (email) {
      const existingWithEmail = await prisma.salesPerson.findFirst({
        where: {
          email,
          id: { not: salesPersonId }
        }
      })

      if (existingWithEmail) {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.salesPerson.update({
      where: { id: salesPersonId },
      data: { name, email },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        referralCode: true,
        createdAt: true,
        lastLoginAt: true,
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}

import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import prisma from "@/lib/db"
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitExceeded } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 3 registration attempts per hour per IP
    const clientId = getClientIdentifier(request)
    if (!checkRateLimit(clientId, RATE_LIMITS.REGISTER)) {
      return rateLimitExceeded(3600) // Retry after 1 hour
    }

    const body = await request.json()
    const { name, phone, email, password } = body

    // Validation
    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: "Name, phone, and password are required" },
        { status: 400 }
      )
    }

    // Validate phone format
    if (!/^09\d{8}$/.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { phone },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this phone number already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        email: email || null,
        password: hashedPassword,
        role: "CUSTOMER",
      },
    })

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

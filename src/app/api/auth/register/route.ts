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
    const { name, phone, email, password, referralCode } = body

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

    // Create user with referral attribution in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          phone,
          email: email || null,
          password: hashedPassword,
          role: "CUSTOMER",
        },
      })

      // Handle referral attribution if referral code provided
      let salesReferral = null
      if (referralCode) {
        // Find the sales person
        const salesPerson = await tx.salesPerson.findUnique({
          where: {
            referralCode: referralCode,
            status: 'ACTIVE'
          }
        })

        if (salesPerson) {
          // Create the referral link (first-come attribution - this is the permanent link)
          salesReferral = await tx.salesReferral.create({
            data: {
              salesPersonId: salesPerson.id,
              userId: user.id,
            }
          })

          // Log the conversion for audit
          await tx.adminLog.create({
            data: {
              userId: user.id,
              action: 'SALES_REFERRAL_CONVERSION',
              details: JSON.stringify({
                salesPersonId: salesPerson.id,
                salesPersonName: salesPerson.name,
                referralCode,
                customerPhone: phone,
              })
            }
          })
        }
      }

      return { user, salesReferral }
    })

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: result.user.id,
          name: result.user.name,
          phone: result.user.phone,
        },
        referred: !!result.salesReferral,
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

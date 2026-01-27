import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import prisma from "@/lib/db"
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitExceeded } from "@/lib/rate-limit"
import { generateUniqueReferralCode, generateSalesPersonQR } from "@/lib/sales/referral-utils"
import { createErrorResponse } from "@/lib/error-handler"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 3 registration attempts per hour per IP
    const clientId = getClientIdentifier(request)
    if (!checkRateLimit(clientId, RATE_LIMITS.REGISTER)) {
      return rateLimitExceeded(3600) // Retry after 1 hour
    }

    const body = await request.json()
    const { name, phone, email, password, referralCode, registerAsSalesPerson } = body

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

    // Check if user or sales person exists with this phone
    const [existingUser, existingSales] = await Promise.all([
      prisma.user.findUnique({ where: { phone } }),
      prisma.salesPerson.findUnique({ where: { phone } }),
    ])

    if (existingUser || existingSales) {
      return NextResponse.json(
        { error: "This phone number is already registered" },
        { status: 409 }
      )
    }

    // If registering as sales person, require a recruiter referral code
    if (registerAsSalesPerson && !referralCode) {
      return NextResponse.json(
        { error: "A recruiter referral code is required to register as sales person" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user/sales person with referral attribution in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // BRANCH 1: Register as Sales Person (recruited)
      if (registerAsSalesPerson) {
        // Find the recruiter sales person
        const recruiter = await tx.salesPerson.findUnique({
          where: {
            referralCode: referralCode,
            status: 'ACTIVE'
          }
        })

        if (!recruiter) {
          throw new Error("Invalid or inactive recruiter referral code")
        }

        // Generate unique referral code for new sales person
        const newReferralCode = await generateUniqueReferralCode(name)

        // Create the sales person with recruiter link
        const salesPerson = await tx.salesPerson.create({
          data: {
            name,
            phone,
            email: email || null,
            password: hashedPassword,
            referralCode: newReferralCode,
            status: 'ACTIVE',
            recruiterId: recruiter.id, // Link to recruiter
            tier: recruiter.tier + 1, // One level below recruiter
          }
        })

        // Generate QR code for new sales person
        await generateSalesPersonQR(newReferralCode)

        // Log the sales person recruitment
        await tx.adminLog.create({
          data: {
            userId: salesPerson.id,
            action: 'SALES_PERSON_RECRUITED',
            details: JSON.stringify({
              salesPersonId: salesPerson.id,
              salesPersonName: salesPerson.name,
              recruiterId: recruiter.id,
              recruiterName: recruiter.name,
              tier: salesPerson.tier,
            })
          }
        })

        return { salesPerson, user: null, salesReferral: null }
      }

      // BRANCH 2: Register as Customer
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

      return { user, salesReferral, salesPerson: null }
    })

    // Return appropriate response based on registration type
    if (result.salesPerson) {
      return NextResponse.json(
        {
          message: "Sales person created successfully",
          salesPerson: {
            id: result.salesPerson.id,
            name: result.salesPerson.name,
            phone: result.salesPerson.phone,
            referralCode: result.salesPerson.referralCode,
            tier: result.salesPerson.tier,
          },
          isSalesPerson: true,
        },
        { status: 201 }
      )
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: result.user!.id,
          name: result.user!.name,
          phone: result.user!.phone,
        },
        referred: !!result.salesReferral,
        isSalesPerson: false,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return createErrorResponse(error, 400)
  }
}

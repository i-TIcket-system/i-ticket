import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { checkEnhancedRateLimit, RATE_LIMITS, rateLimitExceeded } from "@/lib/rate-limit"

const messageSchema = z.object({
  message: z.string().max(2000, "Message too long (max 2000 characters)").optional(),
})

/**
 * POST - Send message to i-Ticket platform (Super Admin)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Only company admins can send messages
    if (session.user.role !== "COMPANY_ADMIN") {
      return NextResponse.json(
        { error: "Only company admins can send messages" },
        { status: 403 }
      )
    }

    if (!session.user.companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      )
    }

    // Rate limiting: 10 messages per hour
    if (!checkEnhancedRateLimit(request, session.user.id, RATE_LIMITS.PROCESS_PAYMENT)) {
      return rateLimitExceeded(3600)
    }

    // Handle multipart form data (for attachments)
    const formData = await request.formData()
    const message = (formData.get("message") as string) || ""
    const files = formData.getAll("files") as File[]

    // Validate message
    const validatedData = messageSchema.parse({ message })

    // Ensure at least message or files are present
    if (!validatedData.message?.trim() && files.length === 0) {
      return NextResponse.json(
        { error: "Please provide a message or attach at least one file" },
        { status: 400 }
      )
    }

    // Process file attachments
    const attachments: Array<{
      name: string
      url: string
      size: number
      type: string
    }> = []

    if (files && files.length > 0) {
      // Limit: max 5 files, max 10MB per file
      if (files.length > 5) {
        return NextResponse.json(
          { error: "Maximum 5 files allowed per message" },
          { status: 400 }
        )
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), "public", "uploads", "company-messages")
      await mkdir(uploadsDir, { recursive: true })

      for (const file of files) {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: `File ${file.name} exceeds 10MB limit` },
            { status: 400 }
          )
        }

        // Generate unique filename
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(7)
        const extension = file.name.split(".").pop()
        const fileName = `${timestamp}-${random}.${extension}`
        const filePath = join(uploadsDir, fileName)

        // Write file
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filePath, buffer)

        // Add to attachments array
        attachments.push({
          name: file.name,
          url: `/uploads/company-messages/${fileName}`,
          size: file.size,
          type: file.type,
        })
      }
    }

    // Create message in database
    const companyMessage = await prisma.companyMessage.create({
      data: {
        message: validatedData.message?.trim() || (attachments.length > 0 ? "[File attachment]" : ""),
        attachments: attachments.length > 0 ? JSON.stringify(attachments) : null,
        senderId: session.user.id,
        senderName: session.user.name || "Unknown",
        senderRole: session.user.role,
        companyId: session.user.companyId,
        isReadByAdmin: false,
        isReadByCompany: true, // Company has read their own message
      },
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: companyMessage,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Company message send error:", error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}

/**
 * GET - Get all messages for this company
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Only company admins can access messages
    if (session.user.role !== "COMPANY_ADMIN") {
      return NextResponse.json(
        { error: "Only company admins can access messages" },
        { status: 403 }
      )
    }

    if (!session.user.companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      )
    }

    // Get all messages for this company (sorted by newest first)
    const messages = await prisma.companyMessage.findMany({
      where: {
        companyId: session.user.companyId, // CRITICAL: Company segregation
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Limit to last 100 messages for performance
    })

    return NextResponse.json({
      messages,
    })
  } catch (error) {
    console.error("Company messages fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}

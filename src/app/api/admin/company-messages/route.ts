import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { checkEnhancedRateLimit, RATE_LIMITS, rateLimitExceeded } from "@/lib/rate-limit"

const messageSchema = z.object({
  companyId: z.string().cuid(),
  message: z.string().max(2000, "Message too long (max 2000 characters)").optional(),
})

/**
 * GET - Get all company conversations (grouped by company)
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

    // Only super admins can access all company conversations
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      )
    }

    // Get all companies
    const companies = await prisma.company.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        logo: true,
      },
      orderBy: { name: "asc" },
    })

    // OPTIMIZATION: Batch fetch all messages and counts in 2 queries instead of 2N queries
    // Fetch all messages for all companies at once
    const allMessages = await prisma.companyMessage.findMany({
      where: {
        companyId: { in: companies.map(c => c.id) },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Group messages by company
    const messagesByCompany = allMessages.reduce((acc, message) => {
      if (!acc[message.companyId]) {
        acc[message.companyId] = []
      }
      // Take only last 100 messages per company
      if (acc[message.companyId].length < 100) {
        acc[message.companyId].push(message)
      }
      return acc
    }, {} as Record<string, typeof allMessages>)

    // Fetch unread counts for all companies at once
    const unreadCounts = await prisma.companyMessage.groupBy({
      by: ['companyId'],
      where: {
        companyId: { in: companies.map(c => c.id) },
        isReadByAdmin: false,
        senderRole: "COMPANY_ADMIN",
      },
      _count: true,
    })

    // Create lookup map for O(1) access
    const unreadCountMap = new Map(
      unreadCounts.map(item => [item.companyId, item._count])
    )

    // Build conversations in JavaScript (no more database queries)
    const conversations = companies.map((company) => {
      const messages = messagesByCompany[company.id] || []
      const reversedMessages = messages.slice().reverse() // Show oldest first

      return {
        company,
        messages: reversedMessages,
        unreadCount: unreadCountMap.get(company.id) || 0,
        lastMessage: messages[0] || null, // Most recent message (desc order)
      }
    })

    // Sort conversations by most recent message first
    conversations.sort((a, b) => {
      if (!a.lastMessage) return 1
      if (!b.lastMessage) return -1
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    })

    return NextResponse.json({
      conversations,
    })
  } catch (error) {
    console.error("Get company conversations error:", error)
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    )
  }
}

/**
 * POST - Send message to specific company
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

    // Only super admins can send messages
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      )
    }

    // Rate limiting: 10 messages per hour
    if (!checkEnhancedRateLimit(request, session.user.id, RATE_LIMITS.PROCESS_PAYMENT)) {
      return rateLimitExceeded(3600)
    }

    // Handle multipart form data (for attachments)
    const formData = await request.formData()
    const companyId = formData.get("companyId") as string
    const message = (formData.get("message") as string) || ""
    const files = formData.getAll("files") as File[]

    // Validate data
    const validatedData = messageSchema.parse({ companyId, message })

    // Ensure at least message or files are present
    if (!validatedData.message?.trim() && files.length === 0) {
      return NextResponse.json(
        { error: "Please provide a message or attach at least one file" },
        { status: 400 }
      )
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: validatedData.companyId },
      select: { id: true, name: true },
    })

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
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
        senderName: session.user.name || "Admin",
        senderRole: session.user.role,
        companyId: validatedData.companyId,
        isReadByAdmin: true, // Admin has read their own message
        isReadByCompany: false,
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

    console.error("Admin send message error:", error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}

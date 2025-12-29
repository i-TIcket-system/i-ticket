import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"

// Generate unique ticket number
function generateTicketNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Removed confusing chars like I, O, 0, 1
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `SUP-${code}`
}

// Validation schema
const createTicketSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  category: z.enum(["GENERAL", "TECHNICAL", "BOOKING", "PAYMENT", "ACCOUNT", "FEEDBACK"]).optional(),
})

// POST /api/support/tickets - Create new support ticket
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate input
    const validation = createTicketSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, email, phone, subject, message, category } = validation.data

    // Generate unique ticket number
    let ticketNumber = generateTicketNumber()
    let attempts = 0
    while (attempts < 5) {
      const existing = await prisma.supportTicket.findUnique({
        where: { ticketNumber }
      })
      if (!existing) break
      ticketNumber = generateTicketNumber()
      attempts++
    }

    // Auto-categorize and prioritize
    const detectedCategory = category || detectCategory(subject, message)
    const priority = detectPriority(subject, message)

    // Get user agent and IP
    const userAgent = req.headers.get("user-agent") || undefined
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] ||
                      req.headers.get("x-real-ip") ||
                      undefined

    // Create ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        name,
        email,
        phone,
        subject,
        message,
        category: detectedCategory,
        priority,
        userAgent,
        ipAddress,
      }
    })

    // TODO: Send email notification to user and admin

    return NextResponse.json({
      success: true,
      ticket: {
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        createdAt: ticket.createdAt,
      }
    })

  } catch (error) {
    console.error("Error creating support ticket:", error)
    return NextResponse.json(
      { error: "Failed to create support ticket" },
      { status: 500 }
    )
  }
}

// GET /api/support/tickets - Get all tickets (admin only)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const where: any = {}
    if (status) where.status = status
    if (priority) where.priority = parseInt(priority)

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: [
          { priority: "desc" },
          { createdAt: "desc" }
        ],
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.supportTicket.count({ where })
    ])

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error("Error fetching support tickets:", error)
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    )
  }
}

// Helper: Detect category from content
function detectCategory(subject: string, message: string): string {
  const text = (subject + " " + message).toLowerCase()

  if (text.match(/book|ticket|trip|seat|passenger/)) return "BOOKING"
  if (text.match(/payment|pay|telebirr|transaction|refund/)) return "PAYMENT"
  if (text.match(/login|password|account|register|sign/)) return "ACCOUNT"
  if (text.match(/error|bug|crash|slow|not working|broken/)) return "TECHNICAL"
  if (text.match(/suggest|feedback|improve|feature/)) return "FEEDBACK"

  return "GENERAL"
}

// Helper: Detect priority from content
function detectPriority(subject: string, message: string): number {
  const text = (subject + " " + message).toLowerCase()

  if (text.match(/urgent|asap|critical|emergency|immediately/)) return 4 // Urgent
  if (text.match(/important|cannot|can't|unable|blocked/)) return 3 // High
  if (text.match(/question|how to|help|need/)) return 2 // Medium

  return 2 // Default Medium
}

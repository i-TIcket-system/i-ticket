import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

const sendMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
  type: z.enum(["TEXT", "STATUS_UPDATE", "COST_APPROVAL", "URGENT"]).default("TEXT"),
})

// GET /api/company/work-orders/[workOrderId]/messages - Fetch all messages for a work order
export async function GET(
  req: NextRequest,
  { params }: { params: { workOrderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Auth check - must be company admin or staff
    if (!session?.user || session.user.role !== "COMPANY_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Company access required" },
        { status: 401 }
      )
    }

    const { workOrderId } = params

    // Verify work order exists and belongs to user's company
    const workOrder = await prisma.workOrder.findFirst({
      where: {
        id: workOrderId,
        companyId: session.user.companyId!,
      },
    })

    if (!workOrder) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 }
      )
    }

    // Fetch messages
    const messages = await prisma.workOrderMessage.findMany({
      where: { workOrderId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        senderId: true,
        senderName: true,
        senderRole: true,
        message: true,
        type: true,
        createdAt: true,
      },
    })

    // Mark if message is own
    const messagesWithOwnership = messages.map((msg) => ({
      ...msg,
      isOwn: msg.senderId === session.user.id,
    }))

    return NextResponse.json({ messages: messagesWithOwnership })
  } catch (error) {
    console.error("Error fetching work order messages:", error)
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}

// POST /api/company/work-orders/[workOrderId]/messages - Send a new message
export async function POST(
  req: NextRequest,
  { params }: { params: { workOrderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Auth check - must be company admin or staff
    if (!session?.user || session.user.role !== "COMPANY_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Company access required" },
        { status: 401 }
      )
    }

    const { workOrderId } = params

    // Verify work order exists and belongs to user's company
    const workOrder = await prisma.workOrder.findFirst({
      where: {
        id: workOrderId,
        companyId: session.user.companyId!,
      },
    })

    if (!workOrder) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const validation = sendMessageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { message, type } = validation.data

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        staffRole: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Determine sender role for display
    const senderRole = user.staffRole || "ADMIN"

    // Create message
    const newMessage = await prisma.workOrderMessage.create({
      data: {
        workOrderId,
        senderId: session.user.id,
        senderName: user.name || "Unknown",
        senderRole,
        message,
        type,
      },
    })

    return NextResponse.json({
      success: true,
      message: newMessage,
    })
  } catch (error) {
    console.error("Error sending work order message:", error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}

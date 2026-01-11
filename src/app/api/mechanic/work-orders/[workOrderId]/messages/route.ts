import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"
import { notifyWorkOrderStakeholders } from "@/lib/notifications"

const sendMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
  type: z.enum(["TEXT", "STATUS_UPDATE", "COST_APPROVAL", "URGENT"]).default("TEXT"),
})

/**
 * GET - Fetch messages for a work order (mechanic access)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { workOrderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "COMPANY_ADMIN" || session.user.staffRole !== "MECHANIC") {
      return NextResponse.json({ error: "Mechanic access required" }, { status: 403 })
    }

    const { workOrderId } = params

    // Verify work order is assigned to this mechanic
    const workOrder = await prisma.workOrder.findFirst({
      where: {
        id: workOrderId,
        companyId: session.user.companyId!,
        assignedToId: session.user.id,
      },
    })

    if (!workOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 })
    }

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

    const messagesWithOwnership = messages.map((msg) => ({
      ...msg,
      isOwn: msg.senderId === session.user.id,
    }))

    return NextResponse.json({ messages: messagesWithOwnership })
  } catch (error) {
    console.error("Mechanic messages fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST - Send a message on a work order (mechanic access)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { workOrderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "COMPANY_ADMIN" || session.user.staffRole !== "MECHANIC") {
      return NextResponse.json({ error: "Mechanic access required" }, { status: 403 })
    }

    const { workOrderId } = params

    // Verify work order is assigned to this mechanic
    const workOrder = await prisma.workOrder.findFirst({
      where: {
        id: workOrderId,
        companyId: session.user.companyId!,
        assignedToId: session.user.id,
      },
      select: {
        id: true,
        vehicleId: true,
      },
    })

    if (!workOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 })
    }

    const body = await request.json()
    const validation = sendMessageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { message, type } = validation.data

    const newMessage = await prisma.workOrderMessage.create({
      data: {
        workOrderId,
        senderId: session.user.id,
        senderName: session.user.name || "Mechanic",
        senderRole: "MECHANIC",
        message,
        type,
      },
    })

    // Notify other stakeholders about the new message (fire and forget)
    notifyWorkOrderStakeholders(
      workOrderId,
      workOrder.vehicleId,
      session.user.companyId!,
      "WORK_ORDER_MESSAGE",
      {
        senderName: session.user.name || "Mechanic",
        messagePreview: message.length > 50 ? message.substring(0, 50) + "..." : message,
      },
      session.user.id // exclude sender
    ).catch((err) => console.error("Failed to send message notification:", err))

    return NextResponse.json({
      success: true,
      message: newMessage,
    })
  } catch (error) {
    console.error("Mechanic message send error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

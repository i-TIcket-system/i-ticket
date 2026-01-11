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
 * Check if user has access to work order communication
 * Access granted to:
 * - Admin (company admin without staff role)
 * - Assigned mechanic
 * - Finance staff (can view all work orders)
 * - Drivers/conductors with upcoming trips using this vehicle
 */
async function checkWorkOrderAccess(
  userId: string,
  userStaffRole: string | null | undefined,
  workOrder: { id: string; vehicleId: string; assignedToId: string | null }
): Promise<boolean> {
  // Admin (no staff role) has full access
  if (!userStaffRole) {
    return true
  }

  // Finance staff can access all work orders
  if (userStaffRole === "FINANCE") {
    return true
  }

  // Assigned mechanic has access
  if (userStaffRole === "MECHANIC" && workOrder.assignedToId === userId) {
    return true
  }

  // Drivers/conductors with upcoming trips on this vehicle have access
  if (userStaffRole === "DRIVER" || userStaffRole === "CONDUCTOR") {
    const now = new Date()
    const upcomingTrip = await prisma.trip.findFirst({
      where: {
        vehicleId: workOrder.vehicleId,
        departureTime: { gte: now },
        OR: [
          { driverId: userId },
          { conductorId: userId },
        ],
      },
    })
    return !!upcomingTrip
  }

  return false
}

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

    // Check if user has access to this work order
    const hasAccess = await checkWorkOrderAccess(
      session.user.id,
      session.user.staffRole,
      workOrder
    )

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this work order" },
        { status: 403 }
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

    // Check if user has access to this work order
    const hasAccess = await checkWorkOrderAccess(
      session.user.id,
      session.user.staffRole,
      workOrder
    )

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this work order" },
        { status: 403 }
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

    // Notify other stakeholders about the new message (fire and forget)
    notifyWorkOrderStakeholders(
      workOrderId,
      workOrder.vehicleId,
      session.user.companyId!,
      "WORK_ORDER_MESSAGE",
      {
        senderName: user.name || "Unknown",
        messagePreview: message.length > 50 ? message.substring(0, 50) + "..." : message,
      },
      session.user.id // exclude sender
    ).catch((err) => console.error("Failed to send message notification:", err))

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

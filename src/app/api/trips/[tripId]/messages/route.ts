import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

/**
 * GET /api/trips/[tripId]/messages
 * Fetch messages for a specific trip
 * Accessible by: Company Admin or assigned staff (driver, conductor, ticketer)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tripId = params.tripId
    const userId = session.user.id

    // Get trip with staff assignments
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        companyId: true,
        driverId: true,
        conductorId: true,
        manualTicketerId: true,
      },
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Check access: Company admin of this company or assigned staff
    const isCompanyAdmin =
      session.user.role === "COMPANY_ADMIN" &&
      session.user.companyId === trip.companyId &&
      (!session.user.staffRole || session.user.staffRole === "ADMIN")

    const isAssignedStaff =
      trip.driverId === userId ||
      trip.conductorId === userId ||
      trip.manualTicketerId === userId

    if (!isCompanyAdmin && !isAssignedStaff) {
      return NextResponse.json(
        { error: "Access denied. You are not assigned to this trip." },
        { status: 403 }
      )
    }

    // Fetch messages
    const messages = await prisma.tripMessage.findMany({
      where: { tripId },
      orderBy: { createdAt: "asc" },
      include: {
        readReceipts: {
          where: { userId },
          select: { id: true },
        },
      },
    })

    // Mark unread messages as read
    const unreadMessageIds = messages
      .filter((m) => m.readReceipts.length === 0 && m.senderId !== userId)
      .map((m) => m.id)

    if (unreadMessageIds.length > 0) {
      await prisma.tripMessageReadReceipt.createMany({
        data: unreadMessageIds.map((messageId) => ({
          messageId,
          userId,
        })),
        skipDuplicates: true,
      })
    }

    // Format response
    const formattedMessages = messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.senderName,
      senderRole: m.senderRole,
      message: m.message,
      type: m.type,
      isOwn: m.senderId === userId,
      createdAt: m.createdAt.toISOString(),
    }))

    return NextResponse.json({ messages: formattedMessages })
  } catch (error) {
    console.error("Fetch trip messages error:", error)
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/trips/[tripId]/messages
 * Send a message to a trip
 * Accessible by: Company Admin or assigned staff
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tripId = params.tripId
    const userId = session.user.id
    const body = await request.json()
    const { message, type = "CHAT" } = body

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      )
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message too long (max 2000 characters)" },
        { status: 400 }
      )
    }

    // Get trip with staff assignments
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        companyId: true,
        driverId: true,
        conductorId: true,
        manualTicketerId: true,
      },
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Check access
    const isCompanyAdmin =
      session.user.role === "COMPANY_ADMIN" &&
      session.user.companyId === trip.companyId &&
      (!session.user.staffRole || session.user.staffRole === "ADMIN")

    const isAssignedStaff =
      trip.driverId === userId ||
      trip.conductorId === userId ||
      trip.manualTicketerId === userId

    if (!isCompanyAdmin && !isAssignedStaff) {
      return NextResponse.json(
        { error: "Access denied. You are not assigned to this trip." },
        { status: 403 }
      )
    }

    // Determine sender role
    let senderRole = "STAFF"
    if (isCompanyAdmin) {
      senderRole = "ADMIN"
    } else if (trip.driverId === userId) {
      senderRole = "DRIVER"
    } else if (trip.conductorId === userId) {
      senderRole = "CONDUCTOR"
    } else if (trip.manualTicketerId === userId) {
      senderRole = "TICKETER"
    }

    // Create message
    const newMessage = await prisma.tripMessage.create({
      data: {
        tripId,
        senderId: userId,
        senderName: session.user.name || "Unknown",
        senderRole,
        message: message.trim(),
        type,
      },
    })

    // Auto-read by sender
    await prisma.tripMessageReadReceipt.create({
      data: {
        messageId: newMessage.id,
        userId,
      },
    })

    return NextResponse.json({
      message: {
        id: newMessage.id,
        senderId: newMessage.senderId,
        senderName: newMessage.senderName,
        senderRole: newMessage.senderRole,
        message: newMessage.message,
        type: newMessage.type,
        isOwn: true,
        createdAt: newMessage.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Send trip message error:", error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}

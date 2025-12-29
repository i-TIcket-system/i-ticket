import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

// Validation schema for updates
const updateTicketSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.number().min(1).max(4).optional(),
  category: z.enum(["GENERAL", "TECHNICAL", "BOOKING", "PAYMENT", "ACCOUNT", "FEEDBACK"]).optional(),
  assignedToId: z.string().optional(),
  resolution: z.string().optional(),
  internalNotes: z.string().optional(),
  satisfactionScore: z.number().min(1).max(5).optional(),
})

// GET /api/support/tickets/[ticketId] - Get single ticket
export async function GET(
  req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.ticketId }
    })

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ ticket })

  } catch (error) {
    console.error("Error fetching ticket:", error)
    return NextResponse.json(
      { error: "Failed to fetch ticket" },
      { status: 500 }
    )
  }
}

// PATCH /api/support/tickets/[ticketId] - Update ticket (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role === "CUSTOMER") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()

    // Validate input
    const validation = updateTicketSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const updates = validation.data

    // If status changed to RESOLVED, set resolvedBy and resolvedAt
    if (updates.status === "RESOLVED") {
      updates.resolvedBy = session.user.id
      ;(updates as any).resolvedAt = new Date()
    }

    // Update ticket
    const ticket = await prisma.supportTicket.update({
      where: { id: params.ticketId },
      data: updates
    })

    return NextResponse.json({
      success: true,
      ticket
    })

  } catch (error) {
    console.error("Error updating ticket:", error)
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    )
  }
}

// DELETE /api/support/tickets/[ticketId] - Delete ticket (super admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    await prisma.supportTicket.delete({
      where: { id: params.ticketId }
    })

    return NextResponse.json({
      success: true,
      message: "Ticket deleted"
    })

  } catch (error) {
    console.error("Error deleting ticket:", error)
    return NextResponse.json(
      { error: "Failed to delete ticket" },
      { status: 500 }
    )
  }
}

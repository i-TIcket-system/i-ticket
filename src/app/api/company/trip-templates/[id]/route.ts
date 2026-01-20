import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema
const templateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100),
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  estimatedDuration: z.number().int().min(1, "Duration must be at least 1 hour"),
  distance: z.number().int().positive().optional().nullable(),
  price: z.number().positive("Price must be positive"),
  busType: z.string().min(1, "Bus type is required"),
  hasWater: z.boolean().default(false),
  hasFood: z.boolean().default(false),
  intermediateStops: z.string().optional().nullable(),
})

// GET /api/company/trip-templates/[id] - Get single template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, companyId: true },
    })

    if (user?.role !== "COMPANY_ADMIN" || !user.companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const template = await prisma.tripTemplate.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId, // Ensure company segregation
      },
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error("Failed to fetch template:", error)
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    )
  }
}

// PUT /api/company/trip-templates/[id] - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, companyId: true },
    })

    if (user?.role !== "COMPANY_ADMIN" || !user.companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Verify template belongs to company
    const existingTemplate = await prisma.tripTemplate.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    const body = await request.json()
    const validated = templateSchema.parse(body)

    // Update template
    const template = await prisma.tripTemplate.update({
      where: { id: params.id },
      data: {
        name: validated.name,
        origin: validated.origin,
        destination: validated.destination,
        estimatedDuration: validated.estimatedDuration,
        distance: validated.distance,
        price: validated.price,
        busType: validated.busType,
        hasWater: validated.hasWater,
        hasFood: validated.hasFood,
        intermediateStops: validated.intermediateStops,
      },
    })

    return NextResponse.json({ template })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to update template:", error)
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    )
  }
}

// DELETE /api/company/trip-templates/[id] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, companyId: true },
    })

    if (user?.role !== "COMPANY_ADMIN" || !user.companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Verify template belongs to company
    const existingTemplate = await prisma.tripTemplate.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Delete template
    await prisma.tripTemplate.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete template:", error)
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    )
  }
}

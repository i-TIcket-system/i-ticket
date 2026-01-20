import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

// Validation schema for creating/updating templates
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
  intermediateStops: z.string().optional().nullable(), // JSON array as string
})

// GET /api/company/trip-templates - List all templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is company admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, companyId: true },
    })

    if (user?.role !== "COMPANY_ADMIN" || !user.companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const origin = searchParams.get("origin")
    const destination = searchParams.get("destination")

    // Build filter
    const where: any = {
      companyId: user.companyId,
    }

    if (origin) {
      where.origin = origin
    }

    if (destination) {
      where.destination = destination
    }

    // Fetch templates
    const templates = await prisma.tripTemplate.findMany({
      where,
      orderBy: [
        { timesUsed: "desc" }, // Most used first
        { lastUsedAt: "desc" },
        { createdAt: "desc" },
      ],
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error("Failed to fetch trip templates:", error)
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    )
  }
}

// POST /api/company/trip-templates - Create new template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is company admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, companyId: true },
    })

    if (user?.role !== "COMPANY_ADMIN" || !user.companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validated = templateSchema.parse(body)

    // Create template
    const template = await prisma.tripTemplate.create({
      data: {
        companyId: user.companyId,
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

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to create trip template:", error)
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    )
  }
}

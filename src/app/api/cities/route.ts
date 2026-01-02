import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

/**
 * Get all active cities for dropdown population
 * Cities are auto-populated from trip creation
 */
export async function GET(request: NextRequest) {
  try {
    const cities = await prisma.city.findMany({
      where: { isActive: true },
      orderBy: [
        { tripCount: "desc" }, // Most used cities first
        { name: "asc" }
      ],
      select: {
        id: true,
        name: true,
        tripCount: true,
      }
    })

    return NextResponse.json({ cities })
  } catch (error) {
    console.error("Cities fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch cities" },
      { status: 500 }
    )
  }
}

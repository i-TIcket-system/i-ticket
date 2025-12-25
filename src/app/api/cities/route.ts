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

/**
 * Helper function to ensure a city exists in database
 * Called internally when creating trips
 */
export async function ensureCityExists(cityName: string): Promise<void> {
  if (!cityName || cityName.trim() === "") return

  const normalizedName = cityName.trim()

  // Check if city already exists
  const existing = await prisma.city.findUnique({
    where: { name: normalizedName }
  })

  if (!existing) {
    // Create new city
    await prisma.city.create({
      data: {
        name: normalizedName,
        tripCount: 1,
      }
    })

    console.log(`[CITY] New city added to registry: ${normalizedName}`)
  } else {
    // Increment trip count for existing city
    await prisma.city.update({
      where: { name: normalizedName },
      data: {
        tripCount: { increment: 1 }
      }
    })
  }
}

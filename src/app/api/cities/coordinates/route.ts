import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

/**
 * GET /api/cities/coordinates?names=Addis+Ababa,Adama,Hawassa
 * Returns lat/lng for given city names (used by map modal for route display).
 */
export async function GET(request: NextRequest) {
  try {
    const namesParam = request.nextUrl.searchParams.get("names")
    if (!namesParam) {
      return NextResponse.json(
        { error: "names parameter is required" },
        { status: 400 }
      )
    }

    const names = namesParam.split(",").map((n) => n.trim()).filter(Boolean)
    if (names.length === 0 || names.length > 20) {
      return NextResponse.json(
        { error: "Provide 1-20 city names" },
        { status: 400 }
      )
    }

    const cities = await prisma.city.findMany({
      where: { name: { in: names } },
      select: {
        name: true,
        latitude: true,
        longitude: true,
      },
    })

    return NextResponse.json({ cities })
  } catch (error) {
    console.error("City coordinates fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch city coordinates" },
      { status: 500 }
    )
  }
}

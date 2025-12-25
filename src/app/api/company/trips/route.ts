import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    if (session.user.role !== "COMPANY_ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    const where: any = {}

    // Company admins only see their company's trips
    if (session.user.role === "COMPANY_ADMIN" && session.user.companyId) {
      where.companyId = session.user.companyId
    }

    const trips = await prisma.trip.findMany({
      where,
      orderBy: { departureTime: "desc" },
      include: {
        company: {
          select: { name: true },
        },
        _count: {
          select: { bookings: true },
        },
      },
    })

    return NextResponse.json({ trips })
  } catch (error) {
    console.error("Trips fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

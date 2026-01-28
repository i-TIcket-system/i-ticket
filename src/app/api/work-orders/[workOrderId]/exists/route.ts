import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

/**
 * Check if a work order exists and is accessible by the current user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { workOrderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ exists: false }, { status: 401 })
    }

    const { workOrderId } = params

    // Check if work order exists for this company
    const workOrder = await prisma.workOrder.findFirst({
      where: {
        id: workOrderId,
        vehicle: {
          companyId: session.user.companyId || undefined,
        },
      },
      select: { id: true },
    })

    return NextResponse.json({ exists: !!workOrder })
  } catch (error) {
    console.error("Work order existence check error:", error)
    return NextResponse.json({ exists: false }, { status: 500 })
  }
}

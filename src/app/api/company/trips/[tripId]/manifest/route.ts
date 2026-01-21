import { NextRequest, NextResponse } from "next/server"
import { requireCompanyAdmin, handleAuthError } from "@/lib/auth-helpers"
import { generatePassengerManifest } from "@/lib/report-generator"
import prisma from "@/lib/db"

/**
 * Download passenger manifest for a trip
 * Companies can download manifest ANYTIME (no seat restriction)
 * - Trip doesn't need to be full
 * - Trip doesn't need to be departed
 * - This is for company operational use
 *
 * NOTE: Auto-generated manifests (for Super Admin) are separate
 * - Companies NEVER see auto-generated manifests
 * - Companies ONLY see their own manual downloads
 *
 * SECURITY: Verifies trip belongs to requesting company
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { companyId } = await requireCompanyAdmin()

    // CRITICAL: Verify trip belongs to this company (company segregation)
    const trip = await prisma.trip.findUnique({
      where: { id: params.tripId },
      select: { id: true, companyId: true }
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    if (trip.companyId !== companyId) {
      return NextResponse.json(
        { error: "Access denied - Trip belongs to another company" },
        { status: 403 }
      )
    }

    const buffer = await generatePassengerManifest(params.tripId)

    // Return Excel file
    const headers = new Headers()
    headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    headers.set("Content-Disposition", `attachment; filename="passenger-manifest-${params.tripId.slice(0, 8)}.xlsx"`)

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers,
    })
  } catch (error: any) {
    console.error("Manifest generation error:", error)

    if (error.message === "Trip not found") {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    return handleAuthError(error)
  }
}

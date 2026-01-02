import { NextRequest, NextResponse } from "next/server"
import { requireCompanyAdmin, handleAuthError } from "@/lib/auth-helpers"
import { generatePassengerManifest } from "@/lib/report-generator"

/**
 * Download passenger manifest for a trip
 * Available when bus is full or for past trips
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { companyId } = await requireCompanyAdmin()

    // Verify trip belongs to company (security check in manifest generator)
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

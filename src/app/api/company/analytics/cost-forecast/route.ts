import { NextResponse } from "next/server"
import { requireCompanyAdmin, handleAuthError } from "@/lib/auth-helpers"
import { generateCostForecast } from "@/lib/ai/predictive-maintenance"

export async function GET() {
  try {
    const { companyId } = await requireCompanyAdmin()

    const forecast = await generateCostForecast(companyId)

    return NextResponse.json(forecast)
  } catch (error) {
    return handleAuthError(error)
  }
}

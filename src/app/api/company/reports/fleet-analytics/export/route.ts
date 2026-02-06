import { NextResponse } from "next/server"
import { requireCompanyAdmin, handleAuthError } from "@/lib/auth-helpers"
import prisma from "@/lib/db"
import ExcelJS from "exceljs"

export async function GET() {
  try {
    const { companyId } = await requireCompanyAdmin()

    const vehicles = await prisma.vehicle.findMany({
      where: { companyId, status: { in: ["ACTIVE", "MAINTENANCE"] } },
      select: {
        plateNumber: true,
        sideNumber: true,
        make: true,
        model: true,
        year: true,
        totalSeats: true,
        status: true,
        maintenanceRiskScore: true,
        predictedFailureDate: true,
        predictedFailureType: true,
        currentOdometer: true,
        fuelEfficiencyL100km: true,
        maintenanceCostYTD: true,
        maintenanceCostMTD: true,
        fuelCostYTD: true,
        registrationExpiry: true,
        insuranceExpiry: true,
        lastServiceDate: true,
        inspectionDueDate: true,
        defectCount: true,
        criticalDefectCount: true,
        purchasePrice: true,
      },
      orderBy: { maintenanceRiskScore: "desc" },
    })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = "i-Ticket Fleet Management"

    // Sheet 1: Fleet Overview
    const overviewSheet = workbook.addWorksheet("Fleet Overview")
    overviewSheet.columns = [
      { header: "Plate #", key: "plate", width: 15 },
      { header: "Side #", key: "side", width: 10 },
      { header: "Make/Model", key: "makeModel", width: 20 },
      { header: "Year", key: "year", width: 8 },
      { header: "Seats", key: "seats", width: 8 },
      { header: "Status", key: "status", width: 14 },
      { header: "Risk Score", key: "risk", width: 12 },
      { header: "Predicted Failure", key: "failureType", width: 18 },
      { header: "Failure Date", key: "failureDate", width: 14 },
      { header: "Odometer (km)", key: "odometer", width: 15 },
      { header: "Fuel Eff. (L/100km)", key: "fuelEff", width: 18 },
      { header: "Maint. Cost YTD (ETB)", key: "maintCost", width: 20 },
      { header: "Fuel Cost YTD (ETB)", key: "fuelCost", width: 18 },
      { header: "Purchase Price (ETB)", key: "purchase", width: 20 },
      { header: "Registration Expiry", key: "regExpiry", width: 18 },
      { header: "Insurance Expiry", key: "insExpiry", width: 18 },
      { header: "Last Service", key: "lastService", width: 14 },
      { header: "Defects", key: "defects", width: 10 },
      { header: "Critical", key: "critical", width: 10 },
    ]

    for (const v of vehicles) {
      overviewSheet.addRow({
        plate: v.plateNumber,
        side: v.sideNumber || "",
        makeModel: `${v.make} ${v.model}`,
        year: v.year,
        seats: v.totalSeats,
        status: v.status,
        risk: v.maintenanceRiskScore || 0,
        failureType: v.predictedFailureType || "",
        failureDate: v.predictedFailureDate?.toISOString().split("T")[0] || "",
        odometer: v.currentOdometer || 0,
        fuelEff: v.fuelEfficiencyL100km || 0,
        maintCost: v.maintenanceCostYTD,
        fuelCost: v.fuelCostYTD,
        purchase: v.purchasePrice || 0,
        regExpiry: v.registrationExpiry?.toISOString().split("T")[0] || "",
        insExpiry: v.insuranceExpiry?.toISOString().split("T")[0] || "",
        lastService: v.lastServiceDate?.toISOString().split("T")[0] || "",
        defects: v.defectCount,
        critical: v.criticalDefectCount,
      })
    }

    // Style header
    overviewSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }
    overviewSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0E9494" },
    }

    // Conditional formatting for risk scores
    for (let i = 2; i <= vehicles.length + 1; i++) {
      const cell = overviewSheet.getCell(`G${i}`)
      const score = cell.value as number
      if (score >= 85) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF4444" } }
        cell.font = { color: { argb: "FFFFFFFF" }, bold: true }
      } else if (score >= 60) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF9900" } }
      } else if (score >= 40) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } }
      }
    }

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="fleet-analytics-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

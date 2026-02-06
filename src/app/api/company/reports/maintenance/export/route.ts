import { NextRequest, NextResponse } from "next/server"
import { requireCompanyAdmin, handleAuthError } from "@/lib/auth-helpers"
import prisma from "@/lib/db"
import ExcelJS from "exceljs"

export async function GET(request: NextRequest) {
  try {
    const { companyId } = await requireCompanyAdmin()

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const dateFilter: Record<string, unknown> = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate + "T23:59:59.999Z")

    const where: Record<string, unknown> = { companyId, status: "COMPLETED" }
    if (startDate || endDate) where.completedAt = dateFilter

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        vehicle: { select: { plateNumber: true, sideNumber: true, make: true, model: true } },
        partsUsed: true,
      },
      orderBy: { completedAt: "desc" },
    })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = "i-Ticket Fleet Management"

    // Sheet 1: Summary
    const summarySheet = workbook.addWorksheet("Summary")
    summarySheet.columns = [
      { header: "WO #", key: "wo", width: 18 },
      { header: "Vehicle", key: "vehicle", width: 15 },
      { header: "Task", key: "task", width: 30 },
      { header: "Type", key: "type", width: 15 },
      { header: "Labor (ETB)", key: "labor", width: 15 },
      { header: "Parts (ETB)", key: "parts", width: 15 },
      { header: "Total (ETB)", key: "total", width: 15 },
      { header: "Completed", key: "completed", width: 15 },
    ]

    for (const wo of workOrders) {
      summarySheet.addRow({
        wo: wo.workOrderNumber,
        vehicle: wo.vehicle.plateNumber,
        task: wo.title,
        type: wo.taskType,
        labor: wo.laborCost,
        parts: wo.partsCost,
        total: wo.totalCost,
        completed: wo.completedAt?.toISOString().split("T")[0] || "",
      })
    }

    // Style header
    summarySheet.getRow(1).font = { bold: true }
    summarySheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0E9494" },
    }
    summarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }

    // Sheet 2: Parts Detail
    const partsSheet = workbook.addWorksheet("Parts Used")
    partsSheet.columns = [
      { header: "WO #", key: "wo", width: 18 },
      { header: "Vehicle", key: "vehicle", width: 15 },
      { header: "Part Name", key: "part", width: 25 },
      { header: "Part #", key: "partNumber", width: 15 },
      { header: "Qty", key: "qty", width: 8 },
      { header: "Unit Price", key: "unitPrice", width: 15 },
      { header: "Total", key: "total", width: 15 },
      { header: "Supplier", key: "supplier", width: 20 },
    ]

    for (const wo of workOrders) {
      for (const part of wo.partsUsed) {
        partsSheet.addRow({
          wo: wo.workOrderNumber,
          vehicle: wo.vehicle.plateNumber,
          part: part.partName,
          partNumber: part.partNumber || "",
          qty: part.quantity,
          unitPrice: part.unitPrice,
          total: part.totalPrice,
          supplier: part.supplier || "",
        })
      }
    }

    partsSheet.getRow(1).font = { bold: true }
    partsSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0E9494" },
    }
    partsSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="maintenance-report-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

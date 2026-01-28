import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'
import * as XLSX from 'xlsx'

/**
 * v2.10.6: Work Order Excel Export API
 * Export work orders as Excel file for Admin and Finance
 */

// Validation schema for export query parameters
const exportQuerySchema = z.object({
  startDate: z.string().nullish().refine(
    (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
    "Invalid date format. Use YYYY-MM-DD"
  ),
  endDate: z.string().nullish().refine(
    (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
    "Invalid date format. Use YYYY-MM-DD"
  ),
  status: z.string().nullish(),
})

/**
 * GET /api/company/work-orders/export
 * Export work orders to Excel (Admin and Finance only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Must be company admin or finance staff
    if (session.user.role !== "COMPANY_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Allow both admin and finance staff
    const allowedStaffRoles = [null, "ADMIN", "FINANCE"]
    if (!allowedStaffRoles.includes(session.user.staffRole ?? null)) {
      return NextResponse.json({ error: "Admin or Finance access required" }, { status: 403 })
    }

    if (!session.user.companyId) {
      return NextResponse.json({ error: "Company association required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)

    // Validate query parameters
    const queryValidation = exportQuerySchema.safeParse({
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      status: searchParams.get("status"),
    })

    if (!queryValidation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryValidation.error.format() },
        { status: 400 }
      )
    }

    const { startDate, endDate, status } = queryValidation.data

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      vehicle: {
        companyId: session.user.companyId,
      },
    }

    if (status && status !== "ALL") {
      where.status = status
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    // Fetch work orders
    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        vehicle: {
          select: {
            plateNumber: true,
            sideNumber: true,
            make: true,
            model: true,
            year: true,
          },
        },
        partsUsed: {
          select: {
            partName: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Format data for Excel
    const excelData = workOrders.map((wo) => {
      // Build parts list string
      const partsList = wo.partsUsed
        .map((p) => `${p.partName} (${p.quantity}x @ ${p.unitPrice} Birr)`)
        .join("; ")

      return {
        "WO Number": wo.workOrderNumber,
        "Title": wo.title,
        "Vehicle": wo.vehicle.plateNumber,
        "Side #": wo.vehicle.sideNumber || "-",
        "Vehicle Model": `${wo.vehicle.year} ${wo.vehicle.make} ${wo.vehicle.model}`,
        "Task Type": wo.taskType,
        "Priority": wo.priority === 1 ? "Low" : wo.priority === 2 ? "Normal" : wo.priority === 3 ? "High" : "Urgent",
        "Status": wo.status.replace("_", " "),
        "Assigned To": wo.assignedToName || "Unassigned",
        "External Provider": wo.serviceProvider || "-",
        "Labor Cost (Birr)": wo.laborCost,
        "Parts Cost (Birr)": wo.partsCost,
        "Total Cost (Birr)": wo.totalCost,
        "Parts Used": partsList || "None",
        "Scheduled Date": wo.scheduledDate ? new Date(wo.scheduledDate).toLocaleDateString() : "-",
        "Started At": wo.startedAt ? new Date(wo.startedAt).toLocaleString() : "-",
        "Completed At": wo.completedAt ? new Date(wo.completedAt).toLocaleString() : "-",
        "Created At": new Date(wo.createdAt).toLocaleString(),
        "Description": wo.description || "-",
        "Completion Notes": wo.completionNotes || "-",
      }
    })

    // Create workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const colWidths = [
      { wch: 20 }, // WO Number
      { wch: 30 }, // Title
      { wch: 15 }, // Vehicle
      { wch: 10 }, // Side #
      { wch: 25 }, // Vehicle Model
      { wch: 12 }, // Task Type
      { wch: 10 }, // Priority
      { wch: 15 }, // Status
      { wch: 20 }, // Assigned To
      { wch: 20 }, // External Provider
      { wch: 15 }, // Labor Cost
      { wch: 15 }, // Parts Cost
      { wch: 15 }, // Total Cost
      { wch: 50 }, // Parts Used
      { wch: 15 }, // Scheduled Date
      { wch: 20 }, // Started At
      { wch: 20 }, // Completed At
      { wch: 20 }, // Created At
      { wch: 40 }, // Description
      { wch: 40 }, // Completion Notes
    ]
    worksheet["!cols"] = colWidths

    XLSX.utils.book_append_sheet(workbook, worksheet, "Work Orders")

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    // Create filename with date range
    let filename = "work-orders"
    if (startDate) filename += `-from-${startDate}`
    if (endDate) filename += `-to-${endDate}`
    filename += `.xlsx`

    // Return Excel file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Work order export error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}

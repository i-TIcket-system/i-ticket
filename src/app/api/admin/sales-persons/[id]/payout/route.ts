import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import prisma, { transactionWithTimeout } from "@/lib/db"
import { requireSuperAdmin, handleAuthError } from "@/lib/auth-helpers"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const payoutSchema = z.object({
  paymentMethod: z.enum(['CASH', 'TELEBIRR']),
  paymentRef: z.string().optional(),
  notes: z.string().optional(),
  commissionIds: z.array(z.string()).optional(), // If not provided, pay all pending
})

// POST /api/admin/sales-persons/[id]/payout - Process commission payout
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdmin()
    const { id } = await params

    const body = await request.json()
    const data = payoutSchema.parse(body)

    // Check if sales person exists
    const salesPerson = await prisma.salesPerson.findUnique({
      where: { id }
    })

    if (!salesPerson) {
      return NextResponse.json(
        { error: "Sales person not found" },
        { status: 404 }
      )
    }

    // Get pending commissions to pay
    const whereClause: any = {
      salesPersonId: id,
      status: 'PENDING',
    }

    if (data.commissionIds && data.commissionIds.length > 0) {
      whereClause.id = { in: data.commissionIds }
    }

    const pendingCommissions = await prisma.salesCommission.findMany({
      where: whereClause,
    })

    if (pendingCommissions.length === 0) {
      return NextResponse.json(
        { error: "No pending commissions to pay" },
        { status: 400 }
      )
    }

    // Calculate total payout
    const totalAmount = pendingCommissions.reduce(
      (sum, c) => sum + c.salesCommission,
      0
    )

    // P2: Process payout in transaction with timeout
    const payout = await transactionWithTimeout(async (tx) => {
      // Create payout record
      const newPayout = await tx.salesPayout.create({
        data: {
          salesPersonId: id,
          amount: totalAmount,
          commissionCount: pendingCommissions.length,
          paymentMethod: data.paymentMethod,
          paymentRef: data.paymentRef,
          processedBy: session.user.id,
          notes: data.notes,
        }
      })

      // Update all commissions to PAID
      await tx.salesCommission.updateMany({
        where: { id: { in: pendingCommissions.map(c => c.id) } },
        data: {
          status: 'PAID',
          payoutId: newPayout.id,
          paidAt: new Date(),
        }
      })

      // Log admin action
      await tx.adminLog.create({
        data: {
          userId: session.user.id,
          action: 'SALES_PAYOUT_PROCESSED',
          details: JSON.stringify({
            payoutId: newPayout.id,
            salesPersonId: id,
            salesPersonName: salesPerson.name,
            amount: totalAmount,
            commissionCount: pendingCommissions.length,
            paymentMethod: data.paymentMethod,
            paymentRef: data.paymentRef,
          })
        }
      })

      return newPayout
    })

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        salesPersonId: payout.salesPersonId,
        salesPersonName: salesPerson.name,
        amount: payout.amount,
        commissionCount: payout.commissionCount,
        paymentMethod: payout.paymentMethod,
        paymentRef: payout.paymentRef,
        createdAt: payout.createdAt,
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }
    return handleAuthError(error)
  }
}

// GET /api/admin/sales-persons/[id]/payout - Get payout history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin()
    const { id } = await params

    const payouts = await prisma.salesPayout.findMany({
      where: { salesPersonId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { commissions: true }
        }
      }
    })

    return NextResponse.json({
      payouts: payouts.map(p => ({
        id: p.id,
        amount: p.amount,
        commissionCount: p.commissionCount,
        paymentMethod: p.paymentMethod,
        paymentRef: p.paymentRef,
        notes: p.notes,
        createdAt: p.createdAt,
      }))
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma, { transactionWithTimeout } from "@/lib/db"
import { authOptions } from "@/lib/auth"
import { validateTripUpdate } from "@/lib/trip-update-validator"

/**
 * POST /api/company/trips/bulk
 *
 * Bulk operations on trips:
 * - updatePrice: Update price for multiple trips
 * - halt: Halt booking for multiple trips
 * - resume: Resume booking for multiple trips
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { action, tripIds, price } = body

    if (!action || !tripIds || !Array.isArray(tripIds) || tripIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid request. Provide action and tripIds array." },
        { status: 400 }
      )
    }

    if (tripIds.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 trips can be updated at once" },
        { status: 400 }
      )
    }

    // Verify all trips belong to the user's company (for COMPANY_ADMIN)
    if (session.user.role === "COMPANY_ADMIN") {
      const trips = await prisma.trip.findMany({
        where: {
          id: { in: tripIds }
        },
        select: {
          id: true,
          companyId: true
        }
      })

      const unauthorized = trips.some(trip => trip.companyId !== session.user.companyId)
      if (unauthorized) {
        return NextResponse.json(
          { error: "Access denied. Some trips do not belong to your company." },
          { status: 403 }
        )
      }
    }

    switch (action) {
      case "updatePrice": {
        if (!price || isNaN(parseFloat(price))) {
          return NextResponse.json(
            { error: "Valid price is required" },
            { status: 400 }
          )
        }

        const newPrice = parseFloat(price)
        if (newPrice <= 0 || newPrice > 100000) {
          return NextResponse.json(
            { error: "Price must be between 0 and 100,000 ETB" },
            { status: 400 }
          )
        }

        // P0-SEC-003: Wrap in transaction with timeout for atomicity
        const result = await transactionWithTimeout(async (tx) => {
          let updated = 0
          let failed = 0
          const errors: string[] = []

          for (const tripId of tripIds) {
            try {
              // Get trip with version for optimistic locking
              const trip = await tx.trip.findUnique({
                where: { id: tripId },
                include: {
                  bookings: { where: { status: 'PAID' } }
                }
              })

              if (!trip) {
                failed++
                errors.push(`Trip ${tripId}: Not found`)
                continue
              }

              // Check if has paid bookings
              if (trip.bookings.length > 0) {
                failed++
                errors.push(`Trip ${tripId}: Has ${trip.bookings.length} paid booking(s)`)
                continue
              }

              // Update with optimistic locking
              await tx.trip.update({
                where: { id: tripId, version: trip.version },
                data: {
                  price: newPrice,
                  version: { increment: 1 }
                }
              })
              updated++
            } catch (error: any) {
              failed++
              if (error.code === 'P2025') {
                errors.push(`Trip ${tripId}: Modified by another user`)
              } else {
                errors.push(`Trip ${tripId}: Update failed`)
              }
              console.error(`Bulk price update error for trip ${tripId}:`, error)
            }
          }

          return { updated, failed, errors }
        }, 15000) // 15 second timeout for bulk operations

        // Log bulk action (outside transaction)
        await prisma.adminLog.create({
          data: {
            userId: session.user.id,
            action: "BULK_PRICE_UPDATE",
            details: `Bulk price update: ${result.updated} trips updated to ${newPrice} ETB, ${result.failed} trips failed. User: ${session.user.name}`
          }
        })

        return NextResponse.json({
          success: true,
          updated: result.updated,
          failed: result.failed,
          errors: result.failed > 0 ? result.errors : undefined
        })
      }

      case "halt": {
        // Halt booking for multiple trips
        const whereClause: any = {
          id: { in: tripIds },
          // RULE-003: Cannot modify view-only trips (DEPARTED, COMPLETED, CANCELLED)
          // Also exclude past SCHEDULED trips (effectively DEPARTED)
          status: { notIn: ["DEPARTED", "COMPLETED", "CANCELLED"] },
          departureTime: { gte: new Date() }
        }
        if (session.user.role === "COMPANY_ADMIN" && session.user.companyId) {
          whereClause.companyId = session.user.companyId
        }

        const haltResult = await prisma.trip.updateMany({
          where: whereClause,
          data: {
            bookingHalted: true
          }
        })

        await prisma.adminLog.create({
          data: {
            userId: session.user.id,
            action: "BULK_HALT_BOOKING",
            details: `Bulk halt: ${haltResult.count} trips halted. User: ${session.user.name}`
          }
        })

        return NextResponse.json({
          success: true,
          updated: haltResult.count
        })
      }

      case "resume": {
        // Resume booking for multiple trips
        const whereClause: any = {
          id: { in: tripIds },
          // RULE-003: Cannot modify view-only trips (DEPARTED, COMPLETED, CANCELLED)
          // Also exclude past SCHEDULED trips (effectively DEPARTED)
          status: { notIn: ["DEPARTED", "COMPLETED", "CANCELLED"] },
          departureTime: { gte: new Date() }
        }
        if (session.user.role === "COMPANY_ADMIN" && session.user.companyId) {
          whereClause.companyId = session.user.companyId
        }

        const resumeResult = await prisma.trip.updateMany({
          where: whereClause,
          data: {
            bookingHalted: false
          }
        })

        await prisma.adminLog.create({
          data: {
            userId: session.user.id,
            action: "BULK_RESUME_BOOKING",
            details: `Bulk resume: ${resumeResult.count} trips resumed. User: ${session.user.name}`
          }
        })

        return NextResponse.json({
          success: true,
          updated: resumeResult.count
        })
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Must be 'updatePrice', 'halt', or 'resume'." },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Bulk operation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/company/trips/bulk
 *
 * Bulk delete trips (only if no paid bookings exist)
 */
export async function DELETE(request: NextRequest) {
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

    const body = await request.json()
    const { tripIds } = body

    if (!tripIds || !Array.isArray(tripIds) || tripIds.length === 0) {
      return NextResponse.json(
        { error: "Provide tripIds array" },
        { status: 400 }
      )
    }

    if (tripIds.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 trips can be deleted at once" },
        { status: 400 }
      )
    }

    // Verify all trips belong to the user's company (for COMPANY_ADMIN)
    if (session.user.role === "COMPANY_ADMIN") {
      const trips = await prisma.trip.findMany({
        where: {
          id: { in: tripIds }
        },
        select: {
          id: true,
          companyId: true
        }
      })

      const unauthorized = trips.some(trip => trip.companyId !== session.user.companyId)
      if (unauthorized) {
        return NextResponse.json(
          { error: "Access denied. Some trips do not belong to your company." },
          { status: 403 }
        )
      }
    }

    // P0-SEC-003: Wrap bulk delete in transaction with timeout
    const result = await transactionWithTimeout(async (tx) => {
      let deleted = 0
      let failed = 0
      const errors: string[] = []

      // Process each trip individually (must check for paid bookings)
      for (const tripId of tripIds) {
        try {
          const trip = await tx.trip.findUnique({
            where: { id: tripId },
            include: {
              bookings: {
                where: { status: "PAID" }
              }
            }
          })

          if (!trip) {
            failed++
            errors.push(`Trip ${tripId}: Not found`)
            continue
          }

          // Verify company access
          if (session.user.role === "COMPANY_ADMIN" && trip.companyId !== session.user.companyId) {
            failed++
            errors.push(`Trip ${tripId}: Access denied`)
            continue
          }

          // RULE-003: Cannot delete view-only trips (DEPARTED, COMPLETED, CANCELLED)
          // Also treat past SCHEDULED trips as view-only (effectively DEPARTED)
          const isPastTrip = new Date(trip.departureTime) < new Date()
          const effectiveStatus = isPastTrip && trip.status === "SCHEDULED" ? "DEPARTED" : trip.status

          if (["DEPARTED", "COMPLETED", "CANCELLED"].includes(effectiveStatus)) {
            failed++
            errors.push(`Trip ${tripId}: Cannot delete ${effectiveStatus} trip (view-only)`)
            continue
          }

          // Cannot delete if paid bookings exist
          if (trip.bookings.length > 0) {
            failed++
            errors.push(`Trip ${tripId}: Has ${trip.bookings.length} paid booking(s), cannot delete`)
            continue
          }

          // Safe to delete
          await tx.trip.delete({
            where: { id: tripId }
          })
          deleted++
        } catch (error) {
          failed++
          errors.push(`Trip ${tripId}: Delete failed`)
          console.error(`Bulk delete error for trip ${tripId}:`, error)
        }
      }

      return { deleted, failed, errors }
    }, 15000) // 15 second timeout

    // Log bulk delete action (outside transaction)
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: "BULK_DELETE_TRIPS",
        details: `Bulk delete: ${result.deleted} trips deleted, ${result.failed} trips failed. User: ${session.user.name}`
      }
    })

    return NextResponse.json({
      success: true,
      deleted: result.deleted,
      failed: result.failed,
      errors: result.failed > 0 ? result.errors : undefined
    })
  } catch (error) {
    console.error("Bulk delete error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

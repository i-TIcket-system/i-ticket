import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
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

    let updated = 0
    let failed = 0
    const errors: string[] = []

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

        // Process each trip individually (must check for paid bookings)
        for (const tripId of tripIds) {
          try {
            // Validate if trip can be updated
            const validation = await validateTripUpdate(tripId, { price: newPrice })

            if (validation.allowed) {
              await prisma.trip.update({
                where: { id: tripId },
                data: { price: newPrice }
              })
              updated++
            } else {
              failed++
              errors.push(`Trip ${tripId}: ${validation.reason}`)
            }
          } catch (error) {
            failed++
            errors.push(`Trip ${tripId}: Update failed`)
            console.error(`Bulk price update error for trip ${tripId}:`, error)
          }
        }

        // Log bulk action
        await prisma.adminLog.create({
          data: {
            userId: session.user.id,
            action: "BULK_PRICE_UPDATE",
            details: `Bulk price update: ${updated} trips updated to ${newPrice} ETB, ${failed} trips failed. User: ${session.user.name}`
          }
        })

        return NextResponse.json({
          success: true,
          updated,
          failed,
          errors: failed > 0 ? errors : undefined
        })
      }

      case "halt": {
        // Halt booking for multiple trips
        const whereClause: any = {
          id: { in: tripIds }
        }
        if (session.user.role === "COMPANY_ADMIN" && session.user.companyId) {
          whereClause.companyId = session.user.companyId
        }

        const result = await prisma.trip.updateMany({
          where: whereClause,
          data: {
            bookingHalted: true
          }
        })

        updated = result.count

        await prisma.adminLog.create({
          data: {
            userId: session.user.id,
            action: "BULK_HALT_BOOKING",
            details: `Bulk halt: ${updated} trips halted. User: ${session.user.name}`
          }
        })

        return NextResponse.json({
          success: true,
          updated
        })
      }

      case "resume": {
        // Resume booking for multiple trips
        const whereClause: any = {
          id: { in: tripIds }
        }
        if (session.user.role === "COMPANY_ADMIN" && session.user.companyId) {
          whereClause.companyId = session.user.companyId
        }

        const result = await prisma.trip.updateMany({
          where: whereClause,
          data: {
            bookingHalted: false
          }
        })

        updated = result.count

        await prisma.adminLog.create({
          data: {
            userId: session.user.id,
            action: "BULK_RESUME_BOOKING",
            details: `Bulk resume: ${updated} trips resumed. User: ${session.user.name}`
          }
        })

        return NextResponse.json({
          success: true,
          updated
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

    let deleted = 0
    let failed = 0
    const errors: string[] = []

    // Process each trip individually (must check for paid bookings)
    for (const tripId of tripIds) {
      try {
        const trip = await prisma.trip.findUnique({
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

        // Cannot delete if paid bookings exist
        if (trip.bookings.length > 0) {
          failed++
          errors.push(`Trip ${tripId}: Has paid bookings, cannot delete`)
          continue
        }

        // Safe to delete
        await prisma.trip.delete({
          where: { id: tripId }
        })
        deleted++
      } catch (error) {
        failed++
        errors.push(`Trip ${tripId}: Delete failed`)
        console.error(`Bulk delete error for trip ${tripId}:`, error)
      }
    }

    // Log bulk delete action
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: "BULK_DELETE_TRIPS",
        details: `Bulk delete: ${deleted} trips deleted, ${failed} trips failed. User: ${session.user.name}`
      }
    })

    return NextResponse.json({
      success: true,
      deleted,
      failed,
      errors: failed > 0 ? errors : undefined
    })
  } catch (error) {
    console.error("Bulk delete error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

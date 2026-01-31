import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/lib/auth"
import { createAuditLogTask } from "@/lib/clickup"
import { validateTripUpdate } from "@/lib/trip-update-validator"
import { createNotification } from "@/lib/notifications"
import { isTripViewOnly, getViewOnlyMessage, FINAL_TRIP_STATUSES } from "@/lib/trip-status"
import { hasDepartedEthiopia } from "@/lib/utils"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { tripId } = await params

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

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            licenseNumber: true,
          },
        },
        conductor: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        manualTicketer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            sideNumber: true,
            make: true,
            model: true,
            year: true,
            busType: true,
            totalSeats: true,
            status: true,
          },
        },
        bookings: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
            passengers: {
              select: {
                id: true,
                name: true,
                nationalId: true,
                phone: true,
                seatNumber: true,
              },
            },
            tickets: {
              select: {
                id: true,
                shortCode: true,
                isUsed: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      )
    }

    // Verify company access for COMPANY_ADMIN
    if (session.user.role === "COMPANY_ADMIN" && trip.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    return NextResponse.json({ trip })
  } catch (error) {
    console.error("Trip fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { tripId } = await params

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

    // Find existing trip
    const existingTrip = await prisma.trip.findUnique({
      where: { id: tripId },
    })

    if (!existingTrip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      )
    }

    // Verify company access
    if (session.user.role === "COMPANY_ADMIN" && existingTrip.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    // 🚨 CRITICAL: Block all modifications to DEPARTED, COMPLETED, CANCELLED, past, or sold-out trips
    // These trips are VIEW-ONLY - no edits allowed for data integrity and audit compliance
    // FIX: Use Ethiopia timezone for proper comparison
    const isPastTrip = hasDepartedEthiopia(existingTrip.departureTime)
    const effectiveStatus = isPastTrip && existingTrip.status === "SCHEDULED" ? "DEPARTED" : existingTrip.status
    const isSoldOut = existingTrip.availableSlots === 0

    if (isTripViewOnly(existingTrip.status, existingTrip.availableSlots) || isPastTrip) {
      let errorMessage = `Cannot modify ${effectiveStatus.toLowerCase()} trips`
      let detailMessage = getViewOnlyMessage(existingTrip.status)

      if (isSoldOut && !FINAL_TRIP_STATUSES.includes(existingTrip.status as any) && !isPastTrip) {
        errorMessage = "Cannot modify sold-out trips"
        detailMessage = "This trip has sold all available seats. Modifications are blocked to protect existing bookings."
      } else if (isPastTrip && existingTrip.status === "SCHEDULED") {
        detailMessage = "Trip departure time has passed. All modifications are blocked."
      }

      return NextResponse.json(
        {
          error: errorMessage,
          message: detailMessage,
          tripStatus: effectiveStatus,
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      origin,
      destination,
      departureTime,
      estimatedDuration,
      distance,
      price,
      busType,
      totalSlots,
      hasWater,
      hasFood,
      bookingHalted,
      isActive,
      driverId,
      conductorId,
      manualTicketerId,
      vehicleId,
    } = body

    // SECURITY: Validate update based on business rules
    // Only validate fields that are actually being changed
    const changedFields: Record<string, any> = {}
    if (price !== undefined && price !== existingTrip.price) changedFields.price = price
    if (totalSlots !== undefined && totalSlots !== existingTrip.totalSlots) changedFields.totalSlots = totalSlots
    if (busType !== undefined && busType !== existingTrip.busType) changedFields.busType = busType
    if (departureTime !== undefined) {
      const newDepartureTime = new Date(departureTime)
      if (newDepartureTime.getTime() !== existingTrip.departureTime.getTime()) {
        changedFields.departureTime = departureTime
      }
    }

    const validation = await validateTripUpdate(tripId, changedFields)

    if (!validation.allowed) {
      return NextResponse.json(
        {
          error: validation.reason,
          blockedFields: validation.blockedFields,
          paidBookingCount: validation.paidBookingCount
        },
        { status: 403 }
      )
    }

    // Track changes for audit logging
    const changes: string[] = []

    // Calculate new available slots if total slots changed
    let newAvailableSlots = existingTrip.availableSlots
    if (totalSlots && totalSlots !== existingTrip.totalSlots) {
      const slotsDifference = totalSlots - existingTrip.totalSlots
      newAvailableSlots = Math.max(0, existingTrip.availableSlots + slotsDifference)
    }

    // CRITICAL: If vehicle changes, synchronize ALL vehicle-related trip properties
    let vehicleUpdateData: any = {}
    if (vehicleId !== undefined && vehicleId !== existingTrip.vehicleId) {
      if (vehicleId) {
        // Fetch new vehicle details
        const newVehicle = await prisma.vehicle.findUnique({
          where: { id: vehicleId },
          select: {
            totalSeats: true,
            busType: true,
          },
        })

        if (!newVehicle) {
          return NextResponse.json(
            { error: "Selected vehicle not found" },
            { status: 400 }
          )
        }

        // Count current bookings to calculate available slots
        const bookedSeats = await prisma.passenger.count({
          where: {
            booking: {
              tripId: tripId,
              status: "PAID",
            },
          },
        })

        // Update trip to match new vehicle specifications
        vehicleUpdateData = {
          totalSlots: newVehicle.totalSeats,
          availableSlots: Math.max(0, newVehicle.totalSeats - bookedSeats),
          busType: newVehicle.busType,
        }

        // Override user-provided totalSlots and busType with vehicle values
        newAvailableSlots = vehicleUpdateData.availableSlots

        // Clear all seat assignments (new vehicle may have different layout)
        const clearedSeats = await prisma.passenger.updateMany({
          where: {
            booking: {
              tripId: tripId,
            },
            seatNumber: {
              not: null,
            },
          },
          data: {
            seatNumber: null,
          },
        })

        console.log(`[VEHICLE CHANGE] Trip ${tripId}: Synced to vehicle ${vehicleId}. Capacity: ${newVehicle.totalSeats}, Type: ${newVehicle.busType}, Cleared ${clearedSeats.count} seat assignments`)
        changes.push(`Vehicle changed - Updated capacity (${newVehicle.totalSeats} seats), bus type (${newVehicle.busType}), cleared ${clearedSeats.count} seat assignments`)
      } else {
        // Vehicle removed (set to null)
        console.log(`[VEHICLE CHANGE] Trip ${tripId}: Vehicle removed`)
        changes.push('Vehicle removed from trip')
      }
    }

    // P3: OPTIMISTIC LOCKING - Update with version check to prevent concurrent modifications
    let updatedTrip;
    try {
      updatedTrip = await prisma.trip.update({
        where: {
          id: tripId,
          version: existingTrip.version // Ensures no concurrent modification
        },
        data: {
          version: { increment: 1 }, // Increment version on each update
        ...(origin && { origin }),
        ...(destination && { destination }),
        ...(departureTime && { departureTime: new Date(departureTime) }),
        ...(estimatedDuration && { estimatedDuration }),
        ...(distance !== undefined && { distance: distance || null }),
        ...(price && { price }),
        // If vehicle changed, use vehicle's busType; otherwise use provided value
        ...(vehicleUpdateData.busType ? { busType: vehicleUpdateData.busType } : busType && { busType }),
        // If vehicle changed, use vehicle's capacity; otherwise use provided value
        ...(vehicleUpdateData.totalSlots
          ? { totalSlots: vehicleUpdateData.totalSlots, availableSlots: vehicleUpdateData.availableSlots }
          : totalSlots && { totalSlots, availableSlots: newAvailableSlots }),
        ...(hasWater !== undefined && { hasWater }),
        ...(hasFood !== undefined && { hasFood }),
        ...(bookingHalted !== undefined && { bookingHalted }),
        ...(isActive !== undefined && { isActive }),
        ...(driverId !== undefined && { driverId: driverId || null }),
        ...(conductorId !== undefined && { conductorId: conductorId || null }),
        ...(manualTicketerId !== undefined && { manualTicketerId: manualTicketerId || null }),
        ...(vehicleId !== undefined && { vehicleId: vehicleId || null }),
      },
      include: {
        company: {
          select: {
            name: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            licenseNumber: true,
          },
        },
        conductor: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        manualTicketer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            sideNumber: true,
            make: true,
            model: true,
            year: true,
            busType: true,
            totalSeats: true,
            status: true,
          },
        },
      },
    })
    } catch (error: any) {
      // Check if this is an optimistic locking error (record not found means version mismatch)
      if (error.code === 'P2025' || error.message?.includes('Record to update not found')) {
        // Fetch current version to inform user
        const currentTrip = await prisma.trip.findUnique({
          where: { id: tripId },
          select: { version: true }
        })

        return NextResponse.json(
          {
            error: 'Trip was modified by another user. Please refresh the page and try again.',
            code: 'OPTIMISTIC_LOCK_ERROR',
            expectedVersion: existingTrip.version,
            currentVersion: currentTrip?.version || 'unknown'
          },
          { status: 409 } // 409 Conflict
        )
      }
      throw error // Re-throw other errors
    }

    // Log trip update for dispute management (track what changed)
    if (price && price !== existingTrip.price) changes.push(`Price: ${existingTrip.price} → ${price} ETB`)
    if (totalSlots && totalSlots !== existingTrip.totalSlots) changes.push(`Capacity: ${existingTrip.totalSlots} → ${totalSlots} seats`)
    if (departureTime) changes.push(`Departure: ${existingTrip.departureTime.toISOString()} → ${new Date(departureTime).toISOString()}`)
    if (bookingHalted !== undefined && bookingHalted !== existingTrip.bookingHalted) changes.push(`Booking ${bookingHalted ? 'halted' : 'resumed'}`)
    if (isActive !== undefined && isActive !== existingTrip.isActive) changes.push(`Trip ${isActive ? 'activated' : 'deactivated'}`)

    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: "TRIP_UPDATED",
        tripId,
        details: `Trip updated: ${session.user.name} (${updatedTrip.company.name}) updated trip ${existingTrip.origin} to ${existingTrip.destination}. Changes: ${changes.length > 0 ? changes.join(', ') : 'Minor updates'}.`,
      },
    })

    console.log(`[TRIP UPDATE] ${session.user.name} updated trip ${tripId}: ${changes.join(', ')}`)

    // NOTIFICATIONS: Notify staff of assignment/unassignment changes
    const tripRoute = `${updatedTrip.origin} → ${updatedTrip.destination}`
    const departureStr = updatedTrip.departureTime.toLocaleDateString("en-ET", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

    // Driver assignment notifications
    if (driverId !== undefined && driverId !== existingTrip.driverId) {
      // Notify new driver of assignment
      if (driverId) {
        createNotification({
          recipientId: driverId,
          recipientType: "USER",
          type: "TRIP_ASSIGNED",
          data: { tripId, tripRoute, departureTime: departureStr, role: "Driver" },
        })
      }
      // Notify old driver of unassignment
      if (existingTrip.driverId) {
        createNotification({
          recipientId: existingTrip.driverId,
          recipientType: "USER",
          type: "TRIP_UNASSIGNED",
          data: { tripId, tripRoute, departureTime: departureStr, role: "Driver" },
        })
      }
    }

    // Conductor assignment notifications
    if (conductorId !== undefined && conductorId !== existingTrip.conductorId) {
      if (conductorId) {
        createNotification({
          recipientId: conductorId,
          recipientType: "USER",
          type: "TRIP_ASSIGNED",
          data: { tripId, tripRoute, departureTime: departureStr, role: "Conductor" },
        })
      }
      if (existingTrip.conductorId) {
        createNotification({
          recipientId: existingTrip.conductorId,
          recipientType: "USER",
          type: "TRIP_UNASSIGNED",
          data: { tripId, tripRoute, departureTime: departureStr, role: "Conductor" },
        })
      }
    }

    // Ticketer assignment notifications
    if (manualTicketerId !== undefined && manualTicketerId !== existingTrip.manualTicketerId) {
      if (manualTicketerId) {
        createNotification({
          recipientId: manualTicketerId,
          recipientType: "USER",
          type: "TRIP_ASSIGNED",
          data: { tripId, tripRoute, departureTime: departureStr, role: "Ticketer" },
        })
      }
      if (existingTrip.manualTicketerId) {
        createNotification({
          recipientId: existingTrip.manualTicketerId,
          recipientType: "USER",
          type: "TRIP_UNASSIGNED",
          data: { tripId, tripRoute, departureTime: departureStr, role: "Ticketer" },
        })
      }
    }

    return NextResponse.json({ trip: updatedTrip })
  } catch (error) {
    console.error("Trip update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { tripId } = await params

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

    const existingTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bookings: {
          where: { status: "PAID" },
        },
      },
    })

    if (!existingTrip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      )
    }

    // Verify company access
    if (session.user.role === "COMPANY_ADMIN" && existingTrip.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    // Prevent deletion if there are paid bookings
    if (existingTrip.bookings.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete trip with existing bookings. Deactivate it instead." },
        { status: 400 }
      )
    }

    // Get trip details before deletion for logging
    const tripDetails = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        company: {
          select: { name: true }
        }
      }
    })

    await prisma.trip.delete({
      where: { id: tripId },
    })

    // Log trip deletion for dispute management (critical for refund disputes)
    if (tripDetails) {
      await prisma.adminLog.create({
        data: {
          userId: session.user.id,
          action: "TRIP_DELETED",
          details: `Trip deleted: ${session.user.name} (${tripDetails.company.name}) deleted trip from ${tripDetails.origin} to ${tripDetails.destination}. Departure was: ${tripDetails.departureTime.toISOString()}, Price: ${tripDetails.price} ETB, Capacity: ${tripDetails.totalSlots} seats. Available slots at deletion: ${tripDetails.availableSlots}.`,
        },
      })

      // Create ClickUp audit task (non-blocking)
      createAuditLogTask({
        action: "TRIP_DELETED",
        userId: session.user.id,
        userName: session.user.name,
        companyName: tripDetails.company.name,
        tripId,
        details: `${tripDetails.origin} to ${tripDetails.destination}, was scheduled for ${tripDetails.departureTime.toISOString()}`,
      })

      console.log(`[TRIP DELETE] ${session.user.name} deleted trip ${tripId}: ${tripDetails.origin} to ${tripDetails.destination}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Trip delete error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

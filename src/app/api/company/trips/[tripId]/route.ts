import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/lib/auth"

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

    // Calculate new available slots if total slots changed
    let newAvailableSlots = existingTrip.availableSlots
    if (totalSlots && totalSlots !== existingTrip.totalSlots) {
      const slotsDifference = totalSlots - existingTrip.totalSlots
      newAvailableSlots = Math.max(0, existingTrip.availableSlots + slotsDifference)
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        ...(origin && { origin }),
        ...(destination && { destination }),
        ...(departureTime && { departureTime: new Date(departureTime) }),
        ...(estimatedDuration && { estimatedDuration }),
        ...(distance !== undefined && { distance: distance || null }),
        ...(price && { price }),
        ...(busType && { busType }),
        ...(totalSlots && { totalSlots, availableSlots: newAvailableSlots }),
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

    // Log trip update for dispute management (track what changed)
    const changes: string[] = []
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

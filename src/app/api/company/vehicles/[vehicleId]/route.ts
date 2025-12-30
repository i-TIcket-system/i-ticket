import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { updateVehicleSchema } from "@/lib/validations"

// GET /api/company/vehicles/[vehicleId] - Get single vehicle details
export async function GET(
  req: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Auth check
    if (!session?.user || session.user.role !== "COMPANY_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Company admin access required" },
        { status: 401 }
      )
    }

    if (!session.user.companyId) {
      return NextResponse.json(
        { error: "No company associated with this account" },
        { status: 404 }
      )
    }

    // Get vehicle with related data
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.vehicleId },
      include: {
        _count: {
          select: { trips: true }
        },
        trips: {
          where: {
            isActive: true
          },
          select: {
            id: true,
            origin: true,
            destination: true,
            departureTime: true,
            availableSlots: true,
            totalSlots: true
          },
          orderBy: {
            departureTime: 'desc'
          },
          take: 10 // Last 10 trips
        }
      }
    })

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehicle not found" },
        { status: 404 }
      )
    }

    // Verify vehicle belongs to the same company
    if (vehicle.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: "Cannot access vehicle from another company" },
        { status: 403 }
      )
    }

    return NextResponse.json({ vehicle })

  } catch (error) {
    console.error("Error fetching vehicle:", error)
    return NextResponse.json(
      { error: "Failed to fetch vehicle details" },
      { status: 500 }
    )
  }
}

// PATCH /api/company/vehicles/[vehicleId] - Update vehicle
export async function PATCH(
  req: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Auth check
    if (!session?.user || session.user.role !== "COMPANY_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Company admin access required" },
        { status: 401 }
      )
    }

    if (!session.user.companyId) {
      return NextResponse.json(
        { error: "No company associated with this account" },
        { status: 404 }
      )
    }

    const body = await req.json()

    // Validate input
    const validation = updateVehicleSchema.safeParse(body)
    if (!validation.success) {
      // Format validation errors to be more descriptive
      const errors = validation.error.errors.map(err => {
        const field = err.path.join('.')
        return field ? `${field}: ${err.message}` : err.message
      })
      const errorMessage = errors.length === 1
        ? errors[0]
        : `Validation errors: ${errors.join('; ')}`

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    // Get vehicle and verify ownership
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.vehicleId },
      select: {
        id: true,
        companyId: true,
        plateNumber: true,
        sideNumber: true
      }
    })

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehicle not found" },
        { status: 404 }
      )
    }

    // Verify vehicle belongs to the same company
    if (vehicle.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: "Cannot update vehicle from another company" },
        { status: 403 }
      )
    }

    const updates = validation.data

    // Check side number uniqueness if being updated
    if (updates.sideNumber && updates.sideNumber !== vehicle.sideNumber) {
      const existingSide = await prisma.vehicle.findFirst({
        where: {
          companyId: session.user.companyId,
          sideNumber: updates.sideNumber,
          NOT: { id: params.vehicleId }
        }
      })

      if (existingSide) {
        return NextResponse.json(
          { error: "Another vehicle already uses this side number" },
          { status: 409 }
        )
      }
    }

    // Update vehicle
    const updatedVehicle = await prisma.vehicle.update({
      where: { id: params.vehicleId },
      data: {
        ...updates,
        registrationExpiry: updates.registrationExpiry ? new Date(updates.registrationExpiry) : undefined,
        insuranceExpiry: updates.insuranceExpiry ? new Date(updates.insuranceExpiry) : undefined,
        lastServiceDate: updates.lastServiceDate ? new Date(updates.lastServiceDate) : undefined,
        nextServiceDate: updates.nextServiceDate ? new Date(updates.nextServiceDate) : undefined,
      }
    })

    // Log the action
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        companyId: session.user.companyId,
        action: "VEHICLE_UPDATED",
        details: `Updated vehicle ${vehicle.plateNumber}: ${Object.keys(updates).join(", ")}`
      }
    })

    return NextResponse.json({
      success: true,
      vehicle: updatedVehicle
    })

  } catch (error) {
    console.error("Error updating vehicle:", error)
    return NextResponse.json(
      { error: "Failed to update vehicle" },
      { status: 500 }
    )
  }
}

// DELETE /api/company/vehicles/[vehicleId] - Delete or deactivate vehicle
export async function DELETE(
  req: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Auth check
    if (!session?.user || session.user.role !== "COMPANY_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Company admin access required" },
        { status: 401 }
      )
    }

    if (!session.user.companyId) {
      return NextResponse.json(
        { error: "No company associated with this account" },
        { status: 404 }
      )
    }

    // Get vehicle and verify ownership
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.vehicleId },
      select: {
        id: true,
        companyId: true,
        plateNumber: true,
        sideNumber: true,
        _count: {
          select: {
            trips: {
              where: {
                departureTime: {
                  gte: new Date() // Future trips
                },
                isActive: true
              }
            }
          }
        }
      }
    })

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehicle not found" },
        { status: 404 }
      )
    }

    // Verify vehicle belongs to the same company
    if (vehicle.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: "Cannot delete vehicle from another company" },
        { status: 403 }
      )
    }

    // Check if vehicle has active/upcoming trips
    if (vehicle._count.trips > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete vehicle with ${vehicle._count.trips} upcoming trip(s). Please reassign or cancel trips first.`,
          hasActiveTrips: true,
          activeTripsCount: vehicle._count.trips
        },
        { status: 409 }
      )
    }

    // Soft delete: Set status to INACTIVE instead of hard delete
    // This preserves historical data
    const updatedVehicle = await prisma.vehicle.update({
      where: { id: params.vehicleId },
      data: { status: 'INACTIVE' }
    })

    // Log the action
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        companyId: session.user.companyId,
        action: "VEHICLE_DEACTIVATED",
        details: `Deactivated vehicle: ${vehicle.plateNumber}${vehicle.sideNumber ? ` (${vehicle.sideNumber})` : ''}`
      }
    })

    return NextResponse.json({
      success: true,
      message: "Vehicle deactivated successfully",
      vehicle: updatedVehicle
    })

  } catch (error) {
    console.error("Error deleting vehicle:", error)
    return NextResponse.json(
      { error: "Failed to delete vehicle" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

// Validation schema for same time mode
const sameTimeModeSchema = z.object({
  sameTimeForAll: z.literal(true),
  dates: z.array(z.string()).min(1, "At least one date required").max(10, "Maximum 10 trips per batch"),
  departureTime: z.string(), // HH:MM format
  returnDepartureTime: z.string().optional(), // HH:MM format (required if createReturnTrips)
})

// Validation schema for individual time mode
const individualTimeModeSchema = z.object({
  sameTimeForAll: z.literal(false),
  trips: z.array(z.object({
    date: z.string(),
    time: z.string(),
    returnTime: z.string().optional(),
  })).min(1, "At least one trip required").max(10, "Maximum 10 trips per batch"),
})

// Base schema shared by both modes
const baseBatchTripSchema = z.object({
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  estimatedDuration: z.number().int().positive(),
  distance: z.number().int().positive().optional(),
  price: z.number().positive(),
  busType: z.string(),
  totalSlots: z.number().int().positive(),
  hasWater: z.boolean().default(false),
  hasFood: z.boolean().default(false),
  intermediateStops: z.string().optional().nullable(),
  defaultPickup: z.string().max(200).optional().nullable(),
  defaultDropoff: z.string().max(200).optional().nullable(),
  driverId: z.string(),
  conductorId: z.string(),
  manualTicketerId: z.string().optional().nullable(),
  vehicleId: z.string(),
  createReturnTrips: z.boolean().default(false),
})

// Combined schema
const batchTripSchema = z.intersection(
  baseBatchTripSchema,
  z.union([sameTimeModeSchema, individualTimeModeSchema])
)

// Helper: Parse time string to hours/minutes
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(":").map(num => parseInt(num, 10))
  return { hours, minutes }
}

// Helper: Create datetime from date and time strings
function createDateTime(dateStr: string, timeStr: string): Date {
  const date = new Date(dateStr)
  const { hours, minutes } = parseTime(timeStr)
  date.setHours(hours, minutes, 0, 0)
  return date
}

// Helper: Add days to a date
function addDays(date: Date, days: number): Date {
  const newDate = new Date(date)
  newDate.setDate(newDate.getDate() + days)
  return newDate
}

// Validate 24-hour gaps between trips for staff/vehicle
async function validateAvailability(
  dates: Date[],
  driverId: string,
  conductorId: string,
  vehicleId: string,
  companyId: string
): Promise<{ valid: boolean; conflicts: string[] }> {
  const conflicts: string[] = []

  // Sort dates
  const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime())

  // Check internal gaps (between batch dates)
  for (let i = 1; i < sortedDates.length; i++) {
    const hoursDiff = (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 60 * 60)
    if (hoursDiff < 24) {
      conflicts.push(`Dates must be at least 24 hours apart: ${sortedDates[i - 1].toISOString()} and ${sortedDates[i].toISOString()}`)
    }
  }

  // Get all existing trips for this staff and vehicle within the date range
  const minDate = new Date(sortedDates[0])
  minDate.setDate(minDate.getDate() - 1) // Check 1 day before
  const maxDate = new Date(sortedDates[sortedDates.length - 1])
  maxDate.setDate(maxDate.getDate() + 1) // Check 1 day after

  const existingTrips = await prisma.trip.findMany({
    where: {
      companyId,
      status: { notIn: ["CANCELLED"] },
      departureTime: {
        gte: minDate,
        lte: maxDate,
      },
      OR: [
        { driverId },
        { conductorId },
        { vehicleId },
      ],
    },
    select: {
      id: true,
      departureTime: true,
      driverId: true,
      conductorId: true,
      vehicleId: true,
      origin: true,
      destination: true,
    },
  })

  // Check each batch date against existing trips
  for (const batchDate of sortedDates) {
    for (const trip of existingTrips) {
      const hoursDiff = Math.abs((batchDate.getTime() - trip.departureTime.getTime()) / (1000 * 60 * 60))

      if (hoursDiff < 24) {
        if (trip.driverId === driverId) {
          conflicts.push(`Driver already assigned to trip on ${trip.departureTime.toISOString()} (${trip.origin} → ${trip.destination})`)
        }
        if (trip.conductorId === conductorId) {
          conflicts.push(`Conductor already assigned to trip on ${trip.departureTime.toISOString()} (${trip.origin} → ${trip.destination})`)
        }
        if (trip.vehicleId === vehicleId) {
          conflicts.push(`Vehicle already assigned to trip on ${trip.departureTime.toISOString()} (${trip.origin} → ${trip.destination})`)
        }
      }
    }
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
  }
}

// POST /api/company/trips/batch - Create multiple trips
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, companyId: true },
    })

    if (user?.role !== "COMPANY_ADMIN" || !user.companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validated = batchTripSchema.parse(body)

    // Build route string
    const route = validated.intermediateStops
      ? `${validated.origin} → ${JSON.parse(validated.intermediateStops).join(" → ")} → ${validated.destination}`
      : null

    // Create array of forward trip datetimes
    let forwardDates: Date[]
    let returnDates: Date[]

    if (validated.sameTimeForAll) {
      // Same time for all trips
      forwardDates = validated.dates.map(dateStr =>
        createDateTime(dateStr, validated.departureTime)
      )

      // Create array of return trip datetimes (if enabled)
      returnDates = validated.createReturnTrips && validated.returnDepartureTime
        ? validated.dates.map(dateStr => {
            const nextDay = addDays(new Date(dateStr), 1)
            return createDateTime(nextDay.toISOString().split("T")[0], validated.returnDepartureTime!)
          })
        : []
    } else {
      // Individual times for each trip
      forwardDates = validated.trips.map(trip =>
        createDateTime(trip.date, trip.time)
      )

      // Create array of return trip datetimes (if enabled)
      returnDates = validated.createReturnTrips
        ? validated.trips
            .filter(trip => trip.returnTime)
            .map(trip => {
              const nextDay = addDays(new Date(trip.date), 1)
              return createDateTime(nextDay.toISOString().split("T")[0], trip.returnTime!)
            })
        : []
    }

    // Combine all dates for validation
    const allDates = [...forwardDates, ...returnDates]

    // Validate availability
    const availabilityCheck = await validateAvailability(
      allDates,
      validated.driverId,
      validated.conductorId,
      validated.vehicleId,
      user.companyId
    )

    if (!availabilityCheck.valid) {
      return NextResponse.json(
        {
          error: "Scheduling conflicts detected",
          conflicts: availabilityCheck.conflicts,
        },
        { status: 400 }
      )
    }

    // Create all trips in a transaction (atomic operation)
    const trips = await prisma.$transaction(async (tx) => {
      const createdTrips = []

      // Create forward trips
      for (const departureTime of forwardDates) {
        // Apply auto-halt rule: trips with ≤10 total slots start halted
        const shouldAutoHalt = validated.totalSlots <= 10;

        const trip = await tx.trip.create({
          data: {
            companyId: user.companyId!,
            origin: validated.origin,
            destination: validated.destination,
            route,
            intermediateStops: validated.intermediateStops,
            departureTime,
            estimatedDuration: validated.estimatedDuration,
            distance: validated.distance,
            price: validated.price,
            busType: validated.busType,
            totalSlots: validated.totalSlots,
            availableSlots: validated.totalSlots,
            bookingHalted: shouldAutoHalt,
            hasWater: validated.hasWater,
            hasFood: validated.hasFood,
            driverId: validated.driverId,
            conductorId: validated.conductorId,
            manualTicketerId: validated.manualTicketerId,
            vehicleId: validated.vehicleId,
            defaultPickup: validated.defaultPickup,
            defaultDropoff: validated.defaultDropoff,
          },
        })
        createdTrips.push(trip)
      }

      // Create return trips (if enabled)
      if (validated.createReturnTrips && returnDates.length > 0) {
        for (const departureTime of returnDates) {
          // Apply auto-halt rule: trips with ≤10 total slots start halted
          const shouldAutoHalt = validated.totalSlots <= 10;

          const trip = await tx.trip.create({
            data: {
              companyId: user.companyId!,
              origin: validated.destination, // Swap origin/destination
              destination: validated.origin,
              route: route ? route.split(" → ").reverse().join(" → ") : null, // Reverse route
              intermediateStops: validated.intermediateStops
                ? JSON.stringify(JSON.parse(validated.intermediateStops).reverse())
                : null,
              departureTime,
              estimatedDuration: validated.estimatedDuration,
              distance: validated.distance,
              price: validated.price,
              busType: validated.busType,
              totalSlots: validated.totalSlots,
              availableSlots: validated.totalSlots,
              bookingHalted: shouldAutoHalt,
              hasWater: validated.hasWater,
              hasFood: validated.hasFood,
              driverId: validated.driverId,
              conductorId: validated.conductorId,
              manualTicketerId: validated.manualTicketerId,
              vehicleId: validated.vehicleId,
              defaultPickup: validated.defaultDropoff,  // Swap for return trip
              defaultDropoff: validated.defaultPickup,  // Swap for return trip
            },
          })
          createdTrips.push(trip)
        }
      }

      return createdTrips
    })

    return NextResponse.json({
      success: true,
      tripsCreated: trips.length,
      trips,
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to create batch trips:", error)
    return NextResponse.json(
      { error: "Failed to create batch trips" },
      { status: 500 }
    )
  }
}

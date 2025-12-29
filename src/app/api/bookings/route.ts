import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/lib/auth"
import { getAvailableSeatNumbers } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { tripId, passengers, totalAmount, commission, smsSessionId } = body

    // Determine userId based on authentication method
    let userId: string;
    let smsSession = null; // Store SMS session for later use
    let user = null; // Store user for later use

    if (session?.user?.id) {
      // Web user with NextAuth session
      userId = session.user.id;
    } else if (smsSessionId) {
      // SMS user - get or create guest user by phone
      smsSession = await prisma.smsSession.findUnique({
        where: { sessionId: smsSessionId }
      });

      if (!smsSession) {
        return NextResponse.json(
          { error: "Invalid SMS session" },
          { status: 401 }
        );
      }

      // Get or create user by phone
      user = await prisma.user.findUnique({
        where: { phone: smsSession.phone }
      });

      if (!user) {
        // Create guest user
        user = await prisma.user.create({
          data: {
            phone: smsSession.phone,
            name: null, // Will be updated with first passenger's name
            password: null,
            isGuestUser: true,
            role: "CUSTOMER"
          }
        });

        console.log(`[SMS Booking] Created guest user for ${smsSession.phone}`);
      }

      userId = user.id;
    } else if (passengers && passengers.length > 0 && passengers[0].phone) {
      // Guest checkout - create guest user from first passenger's phone
      const firstPassenger = passengers[0];

      // Validate first passenger has required fields
      if (!firstPassenger.name || !firstPassenger.nationalId || !firstPassenger.phone) {
        return NextResponse.json(
          { error: "First passenger must have name, ID, and phone number" },
          { status: 400 }
        );
      }

      // Get or create guest user
      user = await prisma.user.findUnique({
        where: { phone: firstPassenger.phone }
      });

      if (!user) {
        // Create new guest user
        user = await prisma.user.create({
          data: {
            phone: firstPassenger.phone,
            name: firstPassenger.name,
            nationalId: firstPassenger.nationalId,
            password: null,
            isGuestUser: true,
            role: "CUSTOMER"
          }
        });

        console.log(`[Guest Checkout] Created guest user for ${firstPassenger.phone}`);
      }

      userId = user.id;
    } else {
      return NextResponse.json(
        { error: "Authentication required or provide complete passenger details" },
        { status: 401 }
      );
    }

    // Validate input
    if (!tripId || !passengers || passengers.length === 0) {
      return NextResponse.json(
        { error: "Trip ID and passengers are required" },
        { status: 400 }
      )
    }

    if (passengers.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 passengers per booking" },
        { status: 400 }
      )
    }

    // Use transaction to ensure atomic booking
    const booking = await prisma.$transaction(async (tx) => {
      // Get trip info
      const trip = await tx.trip.findUnique({
        where: { id: tripId },
      })

      if (!trip) {
        throw new Error("Trip not found")
      }

      if (trip.bookingHalted) {
        throw new Error("Booking is currently halted for this trip")
      }

      if (trip.availableSlots < passengers.length) {
        throw new Error("Not enough seats available")
      }

      // Get available seat numbers
      const seatNumbers = await getAvailableSeatNumbers(
        tripId,
        passengers.length,
        trip.totalSlots,
        tx
      )

      // Create booking with seat assignments
      const newBooking = await tx.booking.create({
        data: {
          tripId,
          userId, // Use determined userId (web or SMS guest)
          totalAmount,
          commission,
          status: "PENDING",
          passengers: {
            create: passengers.map((p: any, index: number) => ({
              name: p.name,
              nationalId: p.nationalId,
              phone: p.phone || smsSession?.phone || session?.user?.phone, // Use SMS phone if not provided
              seatNumber: seatNumbers[index], // Assign seat number
              specialNeeds: p.specialNeeds || null,
              pickupLocation: p.pickupLocation || null,
              dropoffLocation: p.dropoffLocation || null,
            })),
          },
        },
        include: {
          passengers: true,
          trip: {
            include: {
              company: true,
            },
          },
        },
      })

      // Update guest user with first passenger's name if not set
      if (smsSessionId && !user?.name && passengers.length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            name: passengers[0].name,
            nationalId: passengers[0].nationalId
          }
        });
      }

      // ATOMIC UPDATE: Only decrement if enough slots still available
      // This prevents race conditions by using a WHERE clause
      const updateResult = await tx.trip.updateMany({
        where: {
          id: tripId,
          availableSlots: {
            gte: passengers.length,
          },
          bookingHalted: false,
        },
        data: {
          availableSlots: {
            decrement: passengers.length,
          },
        },
      })

      // If no rows were updated, another booking took the seats
      if (updateResult.count === 0) {
        throw new Error("Seats no longer available. Please search again.")
      }

      // CRITICAL: Auto-halt if slots drop to 10 or below
      const updatedTrip = await tx.trip.findUnique({
        where: { id: tripId },
      })

      if (updatedTrip && updatedTrip.availableSlots <= 10 && !updatedTrip.bookingHalted) {
        // Halt booking automatically
        await tx.trip.update({
          where: { id: tripId },
          data: {
            lowSlotAlertSent: true,
            bookingHalted: true,
          },
        })

        // Log the auto-halt event
        await tx.adminLog.create({
          data: {
            userId: "SYSTEM",
            action: "AUTO_HALT_LOW_SLOTS",
            tripId,
            details: JSON.stringify({
              reason: "Slots dropped to 10 or below",
              availableSlots: updatedTrip.availableSlots,
              totalSlots: updatedTrip.totalSlots,
              triggeredBy: "online_booking",
              timestamp: new Date().toISOString(),
            }),
          },
        })

        // In production, send SMS notification to company admin
        console.log(`[ALERT] Trip ${tripId} auto-halted: Only ${updatedTrip.availableSlots} slots remaining`)
      }

      // BUS FULL: Generate manifest if all seats are sold
      if (updatedTrip && updatedTrip.availableSlots === 0 && !updatedTrip.reportGenerated) {
        await tx.trip.update({
          where: { id: tripId },
          data: { reportGenerated: true }
        })

        await tx.adminLog.create({
          data: {
            userId: "SYSTEM",
            action: "BUS_FULL_MANIFEST_READY",
            tripId,
            details: JSON.stringify({
              totalSlots: updatedTrip.totalSlots,
              iTicketBookings: await tx.passenger.count({
                where: { booking: { tripId, status: "PAID" } }
              }),
              generatedAt: new Date().toISOString(),
            }),
          },
        })

        console.log(`[MANIFEST] Bus FULL for trip ${tripId}! Passenger manifest ready for download.`)
      }

      return newBooking
    })

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error("Booking error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Booking failed" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")

    const where: any = { userId: session.user.id }
    if (status) {
      where.status = status
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        trip: {
          include: {
            company: true,
          },
        },
        passengers: true,
        payment: true,
        tickets: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error("Bookings fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

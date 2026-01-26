import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma, { transactionWithTimeout } from "@/lib/db"
import { authOptions } from "@/lib/auth"
import { getAvailableSeatNumbers, handleApiError } from "@/lib/utils"
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitExceeded } from "@/lib/rate-limit"
import { createLowSlotAlertTask } from "@/lib/clickup"
import { calculateCommission, calculateBookingAmounts } from "@/lib/commission"
import { generateAndStoreManifest } from "@/lib/manifest-generator"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 10 bookings per minute per IP
    const clientId = getClientIdentifier(request)
    if (!checkRateLimit(clientId, RATE_LIMITS.CREATE_BOOKING)) {
      return rateLimitExceeded(60) // Retry after 1 minute
    }

    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { tripId, passengers, totalAmount, commission, smsSessionId, selectedSeats } = body

    // Determine userId based on authentication method
    let userId: string;
    let smsSession = null; // Store SMS session for later use
    let user = null; // Store user for later use

    if (session?.user?.id) {
      // Web user with NextAuth session

      // SECURITY: Prevent company admins from booking trips
      if (session.user.role === "COMPANY_ADMIN" || session.user.role === "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Company admins cannot create bookings. Please use a customer account." },
          { status: 403 }
        );
      }

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

      // Validate first passenger has required fields (ID is optional - verified at boarding)
      if (!firstPassenger.name || !firstPassenger.phone) {
        return NextResponse.json(
          { error: "First passenger must have name and phone number" },
          { status: 400 }
        );
      }

      // Get or create guest user
      user = await prisma.user.findUnique({
        where: { phone: firstPassenger.phone }
      });

      // SECURITY: If user exists but is NOT a guest, require authentication
      if (user && !user.isGuestUser) {
        return NextResponse.json(
          { error: "This phone number is registered. Please login to book." },
          { status: 401 }
        );
      }

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

    // SECURITY: Validate passenger data
    let childCount = 0
    for (const passenger of passengers) {
      // Validate required fields for non-child passengers (ID is optional - verified at boarding)
      if (!passenger.isChild) {
        if (!passenger.name) {
          return NextResponse.json(
            { error: "All passengers must have a name" },
            { status: 400 }
          )
        }

        // Validate national ID format (basic check) - only if provided
        if (passenger.nationalId && passenger.nationalId.length > 0 && passenger.nationalId.length < 4) {
          return NextResponse.json(
            { error: "Invalid national ID format (minimum 4 characters)" },
            { status: 400 }
          )
        }
      } else {
        childCount++
      }

      // Validate name length
      if (passenger.name && (passenger.name.length < 2 || passenger.name.length > 100)) {
        return NextResponse.json(
          { error: "Passenger names must be between 2 and 100 characters" },
          { status: 400 }
        )
      }
    }

    // SECURITY: Limit child passengers (prevent abuse)
    if (childCount > 3) {
      return NextResponse.json(
        { error: "Maximum 3 child passengers per booking. Children must be accompanied by adults." },
        { status: 400 }
      )
    }

    // Require at least one adult if children are present
    if (childCount > 0 && childCount === passengers.length) {
      return NextResponse.json(
        { error: "Child passengers must be accompanied by at least one adult" },
        { status: 400 }
      )
    }

    // P2: Use transaction with timeout (10s) to ensure atomic booking with row-level locking
    const booking = await transactionWithTimeout(async (tx) => {
      // CRITICAL: Use SELECT FOR UPDATE NOWAIT to lock the trip row
      // This prevents concurrent bookings from reading stale availableSlots
      const trip = await tx.$queryRaw<Array<{
        id: string
        companyId: string
        availableSlots: number
        bookingHalted: boolean
        totalSlots: number
        price: number
        status: string
      }>>`
        SELECT id, "companyId", "availableSlots", "bookingHalted", "totalSlots", price, status
        FROM "Trip"
        WHERE id = ${tripId}
        FOR UPDATE NOWAIT
      `

      if (!trip || trip.length === 0) {
        throw new Error("Trip not found")
      }

      const lockedTrip = trip[0]

      // CRITICAL: Block booking on completed, cancelled, or departed trips
      if (lockedTrip.status === "COMPLETED" || lockedTrip.status === "CANCELLED" || lockedTrip.status === "DEPARTED") {
        throw new Error(`Cannot book this trip. Trip status: ${lockedTrip.status}`)
      }

      if (lockedTrip.bookingHalted) {
        throw new Error("Booking is currently halted for this trip")
      }

      // CRITICAL FIX (RACE CONDITION): Check for existing PENDING booking INSIDE transaction
      // This prevents duplicate bookings when user makes concurrent requests or goes back/forth
      // Moving this check inside the transaction (after trip lock) ensures atomicity
      const existingPendingBooking = await tx.booking.findFirst({
        where: {
          userId,
          tripId,
          status: "PENDING"
        },
        include: {
          passengers: true
        }
      });

      // Check available slots
      if (existingPendingBooking) {
        // UPDATING existing booking - check if we have enough slots for ADDITIONAL passengers
        const additionalSeatsNeeded = passengers.length - existingPendingBooking.passengers.length;
        if (additionalSeatsNeeded > 0 && lockedTrip.availableSlots < additionalSeatsNeeded) {
          throw new Error(`Only ${lockedTrip.availableSlots} additional seats available. You currently have ${existingPendingBooking.passengers.length} passenger(s).`)
        }
        // If reducing passengers (additionalSeatsNeeded < 0), no check needed - we're freeing seats
      } else {
        // NEW booking - check if we have enough slots for all passengers
        if (lockedTrip.availableSlots < passengers.length) {
          throw new Error(`Only ${lockedTrip.availableSlots} seats available`)
        }
      }

      // Seat assignment: Use selected seats if provided, otherwise auto-assign
      let seatNumbers: number[]

      if (selectedSeats && Array.isArray(selectedSeats) && selectedSeats.length > 0) {
        // MANUAL SELECTION: Validate user-selected seats
        if (selectedSeats.length !== passengers.length) {
          throw new Error(`You must select exactly ${passengers.length} seat${passengers.length > 1 ? 's' : ''} for ${passengers.length} passenger${passengers.length > 1 ? 's' : ''}`)
        }

        // Verify all selected seats are available (security check)
        // OPTION A: Exclude existing pending booking to allow atomic updates
        const occupiedPassengers = await tx.passenger.findMany({
          where: {
            booking: {
              tripId,
              status: {
                not: "CANCELLED",
              },
              // CRITICAL: Exclude the existing booking we're updating (if any)
              ...(existingPendingBooking ? {
                id: {
                  not: existingPendingBooking.id
                }
              } : {})
            },
            seatNumber: {
              in: selectedSeats,
            },
          },
          select: {
            seatNumber: true,
          },
        })

        if (occupiedPassengers.length > 0) {
          const occupiedNumbers = occupiedPassengers.map((p: any) => p.seatNumber).join(", ")
          const errorMsg = existingPendingBooking
            ? `Seats ${occupiedNumbers} are no longer available. Your booking still has your original seats.`
            : `Seats ${occupiedNumbers} are no longer available. Please select different seats.`;
          throw new Error(errorMsg)
        }

        // Verify seats are within valid range
        const invalidSeats = selectedSeats.filter((s: number) => s < 1 || s > lockedTrip.totalSlots)
        if (invalidSeats.length > 0) {
          throw new Error(`Invalid seat numbers: ${invalidSeats.join(", ")}`)
        }

        seatNumbers = selectedSeats
      } else {
        // AUTO-ASSIGNMENT: Get available seat numbers automatically
        seatNumbers = await getAvailableSeatNumbers(
          tripId,
          passengers.length,
          lockedTrip.totalSlots,
          tx
        )
      }

      // Calculate booking amounts (passenger pays ticket + commission + VAT)
      // Recalculate on server for accuracy - don't trust client values
      const passengerCount = passengers.length;
      const amounts = calculateBookingAmounts(lockedTrip.price, passengerCount);

      let newBooking;

      if (existingPendingBooking) {
        // UPDATE EXISTING PENDING BOOKING (Option A: Atomic Update - Safe)
        // This prevents duplicate bookings when user modifies seats/passengers
        // Seat validation already done above (lines 245-276) - it excludes this booking

        const oldPassengerCount = existingPendingBooking.passengers.length;
        const seatDifference = passengerCount - oldPassengerCount;

        // Delete old passengers (releases their seats)
        await tx.passenger.deleteMany({
          where: {
            bookingId: existingPendingBooking.id
          }
        });

        // Update booking with new amounts and create new passengers
        newBooking = await tx.booking.update({
          where: {
            id: existingPendingBooking.id
          },
          data: {
            totalAmount: amounts.totalAmount,
            commission: amounts.commission.baseCommission,
            commissionVAT: amounts.commission.vat,
            passengers: {
              create: passengers.map((p: any, index: number) => ({
                name: p.name,
                nationalId: p.isChild ? `CHILD-${Date.now()}-${index}` : (p.nationalId || "VERIFY_AT_BOARDING"),
                phone: p.isChild ? (passengers[0]?.phone || smsSession?.phone || "CHILD") : (p.phone || smsSession?.phone || session?.user?.phone),
                seatNumber: seatNumbers[index],
                specialNeeds: p.isChild ? "child" : (p.specialNeeds || null),
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
        });

        // Adjust trip's available slots based on seat difference
        // If user increased passengers, reduce available slots
        // If user decreased passengers, increase available slots
        if (seatDifference !== 0) {
          await tx.trip.update({
            where: { id: tripId },
            data: {
              availableSlots: {
                decrement: seatDifference // Can be negative (will increment)
              }
            }
          });
        }

        console.log(`[Booking Update] Updated existing pending booking ${existingPendingBooking.id} for user ${userId}. Seat diff: ${seatDifference}`);
      } else {
        // CREATE NEW BOOKING (first time booking this trip)
        newBooking = await tx.booking.create({
          data: {
            tripId,
            userId,
            totalAmount: amounts.totalAmount,
            commission: amounts.commission.baseCommission,
            commissionVAT: amounts.commission.vat,
            status: "PENDING",
            passengers: {
              create: passengers.map((p: any, index: number) => ({
                name: p.name,
                nationalId: p.isChild ? `CHILD-${Date.now()}-${index}` : (p.nationalId || "VERIFY_AT_BOARDING"),
                phone: p.isChild ? (passengers[0]?.phone || smsSession?.phone || "CHILD") : (p.phone || smsSession?.phone || session?.user?.phone),
                seatNumber: seatNumbers[index],
                specialNeeds: p.isChild ? "child" : (p.specialNeeds || null),
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
        });

        // Reduce available slots (only for new bookings)
        const updateResult = await tx.$executeRaw`
          UPDATE "Trip"
          SET "availableSlots" = "availableSlots" - ${passengers.length},
              "updatedAt" = NOW()
          WHERE id = ${tripId}
            AND "availableSlots" >= ${passengers.length}
            AND "bookingHalted" = false
        `;

        if (updateResult === 0) {
          throw new Error("Seats no longer available. Please search again.");
        }

        console.log(`[Booking Create] Created new pending booking ${newBooking.id} for user ${userId}`);
      }

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

      // CRITICAL: Auto-halt if slots drop to 10 or below
      const updatedTrip = await tx.trip.findUnique({
        where: { id: tripId },
        include: {
          company: {
            select: {
              disableAutoHaltGlobally: true,
            },
          },
        },
      })

      if (
        updatedTrip &&
        updatedTrip.availableSlots <= 10 &&
        !updatedTrip.bookingHalted &&
        !updatedTrip.adminResumedFromAutoHalt &&
        !updatedTrip.autoResumeEnabled &&  // Trip-specific: Admin hasn't enabled auto-resume for this trip
        !updatedTrip.company.disableAutoHaltGlobally  // Company-wide: Auto-halt not disabled globally
      ) {
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

        // Create ClickUp alert task (non-blocking)
        createLowSlotAlertTask({
          tripId,
          origin: newBooking.trip.origin,
          destination: newBooking.trip.destination,
          departureTime: newBooking.trip.departureTime,
          availableSlots: updatedTrip.availableSlots,
          totalSlots: updatedTrip.totalSlots,
          companyName: newBooking.trip.company.name,
          triggeredBy: 'online_booking',
        })

        // In production, send SMS notification to company admin
        console.log(`[ALERT] Trip ${tripId} auto-halted: Only ${updatedTrip.availableSlots} slots remaining`)
      }

      // BUS FULL: Generate manifest if all seats are sold
      if (updatedTrip && updatedTrip.availableSlots === 0 && !updatedTrip.reportGenerated) {
        await tx.trip.update({
          where: { id: tripId },
          data: {
            reportGenerated: true,
            adminResumedFromAutoHalt: false, // Reset override flag when sold out
            lowSlotAlertSent: false, // Dismiss low slot alert when fully sold
          }
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
    }) // Using default 10-second timeout from transactionWithTimeout

    // Auto-generate manifest for Super Admin if bus is full (async, non-blocking)
    // This runs AFTER the transaction completes to not delay the booking response
    // Check if availableSlots is 0 (trip is now full)
    const updatedTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { availableSlots: true, companyId: true }
    })

    if (updatedTrip && updatedTrip.availableSlots === 0) {
      // Fire and forget - don't await (non-blocking)
      generateAndStoreManifest(tripId, "AUTO_FULL_CAPACITY").catch((error) => {
        console.error("Failed to auto-generate manifest on full capacity:", error)
      })
    }

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error("Booking error:", error)

    // Handle lock timeout (NOWAIT failed - another booking in progress)
    if (error instanceof Error) {
      if (error.message.includes('could not obtain lock') ||
          error.message.includes('NOWAIT')) {
        return NextResponse.json(
          { error: "This trip is being booked by another user. Please try again in a moment." },
          { status: 409 }
        )
      }
    }

    // Use centralized error handler for database and other errors
    const { message, status } = handleApiError(error)
    return NextResponse.json({ error: message }, { status })
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
    const { message, status } = handleApiError(error)
    return NextResponse.json({ error: message }, { status })
  }
}

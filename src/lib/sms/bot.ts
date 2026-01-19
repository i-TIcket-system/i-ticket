import type { SmsSession } from "@prisma/client";
import prisma from "@/lib/db";
import {
  getOrCreateSession,
  updateSession,
  getPassengerData,
  addPassenger,
  allPassengersCollected
} from "./session";
import { getMessage, detectLanguage, type Language } from "./messages";
import { calculateBookingAmounts } from "@/lib/commission";

/**
 * SMS Bot State Machine
 *
 * Handles all conversation states and transitions for the SMS booking bot
 */

/**
 * All possible conversation states
 */
export type BotState =
  | 'IDLE'
  | 'SEARCH'
  | 'SELECT_TRIP'
  | 'ASK_PASSENGER_COUNT'
  | 'ASK_PASSENGER_NAME'
  | 'ASK_PASSENGER_ID'
  | 'CONFIRM_BOOKING'
  | 'WAIT_PAYMENT'
  | 'PAYMENT_SUCCESS';

/**
 * State transition result
 */
interface StateTransition {
  nextState: BotState;
  response: string;
}

/**
 * Parse BOOK command
 * Formats: "BOOK ADDIS HAWASSA JAN15", "BOOK", "መጽሐፍ አዲስ ሀዋሳ"
 */
function parseBookCommand(message: string): {
  origin?: string;
  destination?: string;
  date?: string;
} | null {
  const parts = message.trim().split(/\s+/);

  // Remove command keyword
  if (parts[0].toUpperCase() === 'BOOK' || parts[0] === 'መጽሐፍ') {
    parts.shift();
  }

  if (parts.length === 0) {
    return {}; // Will trigger step-by-step flow
  }

  if (parts.length >= 2) {
    return {
      origin: parts[0],
      destination: parts[1],
      date: parts[2] || 'TODAY'
    };
  }

  return null;
}

/**
 * Parse date string to Date object
 * Supports: TODAY, TOMORROW, JAN15, 15, DEC25
 */
function parseDate(dateStr: string): Date {
  const today = new Date();
  const upperDate = dateStr.toUpperCase();

  if (upperDate === 'TODAY' || upperDate === '0' || upperDate === 'ዛሬ') {
    return today;
  }

  if (upperDate === 'TOMORROW' || upperDate === '1' || upperDate === 'ነገ') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  // Try to parse as day number (e.g., "25" = 25th of current month)
  const dayMatch = /^(\d{1,2})$/.exec(dateStr);
  if (dayMatch) {
    const day = parseInt(dayMatch[1], 10);
    // QA-13 FIX: Validate parseInt result to prevent NaN issues
    if (isNaN(day) || day < 1 || day > 31) {
      return today; // Return default if invalid day
    }
    const result = new Date(today.getFullYear(), today.getMonth(), day);
    if (result < today) {
      result.setMonth(result.getMonth() + 1);
    }
    return result;
  }

  // Try to parse as MMMDD (e.g., "JAN15")
  const monthDayMatch = /^([A-Z]{3})(\d{1,2})$/i.exec(dateStr);
  if (monthDayMatch) {
    const months: { [key: string]: number } = {
      JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
      JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
    };
    const monthStr = monthDayMatch[1].toUpperCase();
    const day = parseInt(monthDayMatch[2], 10);

    // QA-13 FIX: Validate parseInt result and month
    if (isNaN(day) || day < 1 || day > 31 || months[monthStr] === undefined) {
      return today; // Return default if invalid
    }

    const result = new Date(today.getFullYear(), months[monthStr], day);
    if (result < today) {
      result.setFullYear(result.getFullYear() + 1);
    }
    return result;
  }

  // Default to today if can't parse
  return today;
}

/**
 * Search for trips
 */
async function searchTrips(origin: string, destination: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const trips = await prisma.trip.findMany({
    where: {
      origin: { contains: origin, mode: 'insensitive' },
      destination: { contains: destination, mode: 'insensitive' },
      departureTime: {
        gte: startOfDay,
        lte: endOfDay
      },
      isActive: true,
      availableSlots: { gt: 0 },
      bookingHalted: false
    },
    include: {
      company: true
    },
    orderBy: {
      departureTime: 'asc'
    },
    take: 5 // Max 5 results for SMS
  });

  return trips;
}

/**
 * Main message processor
 *
 * @param phone - User's phone number
 * @param message - User's message
 * @returns Response message to send back
 */
export async function processMessage(phone: string, message: string): Promise<string> {
  try {
    // Get or create session
    let session = await getOrCreateSession(phone);

    // Detect language if still in IDLE state
    if (session.state === 'IDLE' && session.language === 'EN') {
      const detectedLanguage = detectLanguage(message);
      session = await updateSession(session.sessionId, { language: detectedLanguage });
    }

    const lang = session.language as Language;

    // Check for special commands that work in any state
    const upperMessage = message.trim().toUpperCase();

    if (upperMessage === 'HELP' || message.includes('እርዳታ')) {
      return getMessage('help', lang);
    }

    if (upperMessage === 'CANCEL' || message.includes('ሰርዝ')) {
      await updateSession(session.sessionId, { state: 'IDLE' });
      return lang === 'AM' ?
        "ክፍለ ጊዜ ተሰርዟል። መጽሐፍ በመላክ እንደገና ይጀምሩ።" :
        "Session cancelled. Send BOOK to start again.";
    }

    // Handle CHECK command
    if (upperMessage.startsWith('CHECK ') || message.startsWith('ማረጋገጫ ')) {
      const code = message.split(/\s+/)[1];
      return await handleTicketVerification(code, lang);
    }

    // Route to appropriate state handler
    const { nextState, response } = await handleStateTransition(session, message);

    // Update session state
    await updateSession(session.sessionId, { state: nextState });

    return response;
  } catch (error) {
    console.error('[SMS Bot] Error processing message:', error);
    const lang = message.match(/[\u1200-\u137F]/) ? 'AM' : 'EN';
    return getMessage('systemError', lang);
  }
}

/**
 * Handle state transitions based on current state
 */
async function handleStateTransition(
  session: SmsSession,
  userMessage: string
): Promise<StateTransition> {
  const lang = session.language as Language;

  switch (session.state) {
    case 'IDLE':
      return await handleIdleState(session, userMessage, lang);

    case 'SEARCH':
      return await handleSearchState(session, userMessage, lang);

    case 'SELECT_TRIP':
      return await handleSelectTripState(session, userMessage, lang);

    case 'ASK_PASSENGER_COUNT':
      return await handlePassengerCountState(session, userMessage, lang);

    case 'ASK_PASSENGER_NAME':
      return await handlePassengerNameState(session, userMessage, lang);

    case 'ASK_PASSENGER_ID':
      return await handlePassengerIdState(session, userMessage, lang);

    case 'CONFIRM_BOOKING':
      return await handleConfirmBookingState(session, userMessage, lang);

    default:
      return {
        nextState: 'IDLE',
        response: getMessage('invalidCommand', lang, userMessage)
      };
  }
}

/**
 * IDLE state handler - User starts conversation
 */
async function handleIdleState(
  session: SmsSession,
  message: string,
  lang: Language
): Promise<StateTransition> {
  const upperMessage = message.trim().toUpperCase();

  // Check for BOOK command
  if (upperMessage.startsWith('BOOK') || message.startsWith('መጽሐፍ')) {
    const parsed = parseBookCommand(message);

    if (!parsed) {
      return {
        nextState: 'IDLE',
        response: getMessage('invalidCommand', lang, message)
      };
    }

    if (parsed.origin && parsed.destination) {
      // Full command provided, search immediately
      const date = parseDate(parsed.date || 'TODAY');
      const trips = await searchTrips(parsed.origin, parsed.destination, date);

      if (trips.length === 0) {
        return {
          nextState: 'IDLE',
          response: getMessage('noTripsFound', lang, parsed.origin, parsed.destination, parsed.date || 'today')
        };
      }

      // Store search results in session
      await updateSession(session.sessionId, {
        origin: trips[0].origin,
        destination: trips[0].destination,
        date: date.toISOString()
      });

      return {
        nextState: 'SELECT_TRIP',
        response: getMessage('searchResults', lang, trips[0].origin, trips[0].destination, parsed.date || 'today', trips)
      };
    }

    // Incomplete command, provide help
    return {
      nextState: 'IDLE',
      response: getMessage('help', lang)
    };
  }

  // Unknown command
  return {
    nextState: 'IDLE',
    response: getMessage('welcome', lang)
  };
}

/**
 * SEARCH state handler - Not used in MVP (going straight to SELECT_TRIP)
 */
async function handleSearchState(
  session: SmsSession,
  message: string,
  lang: Language
): Promise<StateTransition> {
  return {
    nextState: 'IDLE',
    response: getMessage('invalidInput', lang)
  };
}

/**
 * SELECT_TRIP state handler - User selects a trip from search results
 */
async function handleSelectTripState(
  session: SmsSession,
  message: string,
  lang: Language
): Promise<StateTransition> {
  const selection = parseInt(message.trim());

  if (isNaN(selection) || selection < 1 || selection > 5) {
    return {
      nextState: 'SELECT_TRIP',
      response: getMessage('invalidInput', lang)
    };
  }

  // Re-query trips to get the selected one
  const date = new Date(session.date!);
  const trips = await searchTrips(session.origin!, session.destination!, date);

  const selectedTrip = trips[selection - 1];

  if (!selectedTrip) {
    return {
      nextState: 'SELECT_TRIP',
      response: getMessage('invalidInput', lang)
    };
  }

  if (selectedTrip.availableSlots === 0) {
    return {
      nextState: 'SELECT_TRIP',
      response: getMessage('tripSoldOut', lang)
    };
  }

  if (selectedTrip.bookingHalted) {
    return {
      nextState: 'SELECT_TRIP',
      response: getMessage('bookingHalted', lang)
    };
  }

  // Store selected trip
  await updateSession(session.sessionId, {
    selectedTripId: selectedTrip.id
  });

  // Calculate what one passenger will pay (ticket + commission + VAT)
  const amounts = calculateBookingAmounts(selectedTrip.price, 1);
  const commission = amounts.commission.totalCommission; // Show total (base + VAT)
  const response = getMessage(
    'tripSelected',
    lang,
    selectedTrip.company.name,
    selectedTrip.departureTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    selectedTrip.origin,
    selectedTrip.destination,
    selectedTrip.price,
    commission
  );

  return {
    nextState: 'ASK_PASSENGER_COUNT',
    response
  };
}

/**
 * ASK_PASSENGER_COUNT state handler
 */
async function handlePassengerCountState(
  session: SmsSession,
  message: string,
  lang: Language
): Promise<StateTransition> {
  const count = parseInt(message.trim());

  if (isNaN(count) || count < 1 || count > 5) {
    return {
      nextState: 'ASK_PASSENGER_COUNT',
      response: lang === 'AM' ?
        "ትክክል ያልሆነ ቁጥር። 1 እስከ 5 ያስገቡ።" :
        "Invalid number. Enter 1 to 5."
    };
  }

  await updateSession(session.sessionId, {
    passengerCount: count,
    currentPassengerIndex: 0
  });

  return {
    nextState: 'ASK_PASSENGER_NAME',
    response: getMessage('askPassengerName', lang, 1, count)
  };
}

/**
 * ASK_PASSENGER_NAME state handler
 */
async function handlePassengerNameState(
  session: SmsSession,
  message: string,
  lang: Language
): Promise<StateTransition> {
  const name = message.trim();

  if (name.length < 2) {
    return {
      nextState: 'ASK_PASSENGER_NAME',
      response: lang === 'AM' ?
        "ስም በጣም አጭር ነው። እንደገና ያስገቡ።" :
        "Name too short. Please try again."
    };
  }

  // Store name temporarily in a special field
  // We'll combine it with ID in the next state
  await updateSession(session.sessionId, {
    // Use a temporary field to store the current passenger's name
    origin: session.origin, // Keep existing data
    destination: session.destination
  });

  const currentIndex = session.currentPassengerIndex + 1;

  return {
    nextState: 'ASK_PASSENGER_ID',
    response: getMessage('askPassengerId', lang, currentIndex, session.passengerCount)
  };
}

/**
 * ASK_PASSENGER_ID state handler
 *
 * Note: This is a simplified version for MVP
 * In the current flow, we ask for passenger count, then names, then IDs
 * For simplicity, we'll just use the user's phone as the name for now
 * and the ID they provide
 */
async function handlePassengerIdState(
  session: SmsSession,
  message: string,
  lang: Language
): Promise<StateTransition> {
  const id = message.trim();

  if (id.length < 3) {
    return {
      nextState: 'ASK_PASSENGER_ID',
      response: lang === 'AM' ?
        "መታወቂያ በጣም አጭር ነው። እንደገና ያስገቡ።" :
        "ID too short. Please try again."
    };
  }

  // Get passengers collected so far
  const passengers = getPassengerData(session);
  const currentIndex = session.currentPassengerIndex;

  // For MVP, we'll use a simple name format
  // In a more advanced version, we'd store the name from the previous state
  const passengerName = passengers.length === 0
    ? session.phone.slice(-4) // First passenger gets phone last 4 digits
    : `Passenger ${currentIndex + 1}`;

  // Add new passenger with name and ID
  passengers.push({
    name: passengerName,
    id
  });

  await updateSession(session.sessionId, {
    passengerData: JSON.stringify(passengers),
    currentPassengerIndex: currentIndex + 1
  });

  // Check if we need more passengers
  if (passengers.length < session.passengerCount) {
    return {
      nextState: 'ASK_PASSENGER_NAME',
      response: getMessage('askPassengerName', lang, passengers.length + 1, session.passengerCount)
    };
  }

  // All passengers collected, show booking summary
  const trip = await prisma.trip.findUnique({
    where: { id: session.selectedTripId! },
    include: { company: true }
  });

  if (!trip) {
    return {
      nextState: 'IDLE',
      response: getMessage('systemError', lang)
    };
  }

  // Calculate total price passengers will pay (ticket + commission + VAT)
  const amounts = calculateBookingAmounts(trip.price, passengers.length);
  const totalPrice = amounts.totalAmount;

  return {
    nextState: 'CONFIRM_BOOKING',
    response: getMessage('bookingSummary', lang, trip, passengers, totalPrice)
  };
}

/**
 * CONFIRM_BOOKING state handler
 */
async function handleConfirmBookingState(
  session: SmsSession,
  message: string,
  lang: Language
): Promise<StateTransition> {
  const response = message.trim().toUpperCase();

  if (response !== 'YES' && response !== 'አዎ') {
    if (response === 'NO' || response === 'አይ') {
      return {
        nextState: 'IDLE',
        response: lang === 'AM' ?
          "ቦታ ተሰርዟል። መጽሐፍ በመላክ እንደገና ይጀምሩ።" :
          "Booking cancelled. Send BOOK to start again."
      };
    }

    return {
      nextState: 'CONFIRM_BOOKING',
      response: lang === 'AM' ?
        "አዎ ወይም አይ ይበሉ።" :
        "Reply YES or NO."
    };
  }

  // User confirmed - create booking
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: session.selectedTripId! },
      include: { company: true }
    });

    if (!trip) {
      return {
        nextState: 'IDLE',
        response: getMessage('systemError', lang)
      };
    }

    const passengers = getPassengerData(session);
    // Calculate amounts (passenger pays ticket + commission + VAT)
    const amounts = calculateBookingAmounts(trip.price, passengers.length);

    // Create booking via API (API will calculate totalAmount and commission server-side)
    const bookingResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId: trip.id,
        passengers: passengers.map((p, index) => ({
          name: p.name,
          nationalId: p.id,
          phone: session.phone,
        })),
        smsSessionId: session.sessionId
        // Note: totalAmount and commission are calculated server-side from trip price
      })
    });

    if (!bookingResponse.ok) {
      const error = await bookingResponse.json();
      console.error('[SMS Bot] Booking creation failed:', error);

      return {
        nextState: 'IDLE',
        response: lang === 'AM' ?
          `ስህተት: ${error.error}\n\nእንደገና ይሞክሩ: መጽሐፍ` :
          `Error: ${error.error}\n\nTry again: BOOK`
      };
    }

    const bookingData = await bookingResponse.json();
    const booking = bookingData.booking;

    // Store booking ID in session
    await updateSession(session.sessionId, {
      bookingId: booking.id
    });

    // Get seat numbers
    const seats = booking.passengers.map((p: any) => p.seatNumber);

    // Create payment record and initiate TeleBirr payment
    const { initiateTelebirrPayment } = await import("@/lib/payments/telebirr");

    // totalAmount in DB = ticket + commission + VAT (ALREADY the final amount!)
    const totalAmount = Number(booking.totalAmount);  // Don't add commission again!

    try {
      // Initiate TeleBirr merchant payment
      const { transactionId } = await initiateTelebirrPayment({
        phone: session.phone,
        amount: totalAmount,
        reference: booking.id,
        description: `Bus ticket ${trip.origin}-${trip.destination}`
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: totalAmount,
          method: 'TELEBIRR',
          transactionId,
          status: 'PENDING',
          initiatedVia: 'SMS'
        }
      });

      // Send payment initiated message
      const confirmMessage = getMessage('bookingConfirmed', lang, booking.id, seats);

      return {
        nextState: 'WAIT_PAYMENT',
        response: confirmMessage
      };
    } catch (paymentError) {
      console.error('[SMS Bot] Payment initiation failed:', paymentError);

      // Payment failed, but booking exists - user can try manual payment
      return {
        nextState: 'IDLE',
        response: lang === 'AM' ?
          `ቦታ ተይዟል!\nመታወቂያ: ${booking.id}\nወንበር: ${seats.join(', ')}\n\nክፍያ ስህተት። እባክዎን ድጋፍ ያግኙ: 0911234567` :
          `Booking created!\nID: ${booking.id}\nSeats: ${seats.join(', ')}\n\nPayment error. Contact support: 0911234567`
      };
    }
  } catch (error) {
    console.error('[SMS Bot] Booking error:', error);
    return {
      nextState: 'IDLE',
      response: getMessage('systemError', lang)
    };
  }
}

/**
 * Handle ticket verification
 */
async function handleTicketVerification(code: string, lang: Language): Promise<string> {
  if (!code || code.length !== 6) {
    return getMessage('ticketNotFound', lang, code);
  }

  const ticket = await prisma.ticket.findUnique({
    where: { shortCode: code.toUpperCase() },
    include: {
      trip: {
        include: { company: true }
      },
      booking: true
    }
  });

  if (!ticket) {
    return getMessage('ticketNotFound', lang, code);
  }

  if (ticket.isUsed) {
    return getMessage('ticketAlreadyUsed', lang, ticket);
  }

  if (ticket.booking.status !== 'PAID') {
    return lang === 'AM' ?
      `ትኬት ክፍያ አልተከፈለም\nኮድ: ${code}\n\nእባክዎን መጀመሪያ ይክፈሉ።` :
      `TICKET UNPAID\nCode: ${code}\n\nPlease complete payment first.`;
  }

  return getMessage('ticketValid', lang, ticket, ticket.trip);
}

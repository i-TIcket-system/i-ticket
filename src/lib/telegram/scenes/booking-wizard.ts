/**
 * Telegram Bot Booking Wizard
 * Multi-step booking flow state machine
 */

import { TelegramContext, updateSessionState, resetSession } from "../middleware/auth";
import { getMessage, Language } from "../messages";
import {
  citiesKeyboard,
  dateKeyboard,
  tripsKeyboard,
  passengerCountKeyboard,
  seatPreferenceKeyboard,
  seatMapKeyboard,
  confirmBookingKeyboard,
  searchAgainKeyboard,
} from "../keyboards";
import {
  formatTripCard,
  formatBookingSummary,
  formatSeats,
  formatCurrency,
} from "../utils/formatters";
import { prisma } from "@/lib/db";
import { transactionWithTimeout } from "@/lib/db";
import { calculateBookingAmounts } from "@/lib/commission";
import { getAvailableSeatNumbers } from "@/lib/utils";
import { startOfDay, endOfDay, parseISO, format } from "date-fns";

/**
 * Handle origin city search
 */
export async function handleOriginSearch(ctx: TelegramContext, showAll: boolean = false, editMessage: boolean = false) {
  try {
    const lang = ctx.session?.language || "EN";

    // Count total cities to know if "More" button should show
    const totalCities = await prisma.city.count({ where: { isActive: true } });

    // Fetch popular cities (or all if showAll is true)
    const cities = await prisma.city.findMany({
      where: { isActive: true },
      orderBy: { tripCount: "desc" },
      take: showAll ? 50 : 10,
      select: { id: true, name: true },
    });

    // Show "More" button if there are more cities than currently displayed
    const showMoreButton = !showAll && totalCities > 10;

    if (editMessage && "callbackQuery" in ctx) {
      // Edit existing message keyboard
      await ctx.editMessageReplyMarkup(citiesKeyboard(cities, showMoreButton, lang).reply_markup);
    } else {
      // Send new message
      await ctx.reply(getMessage("searchOrigin", lang), {
        parse_mode: "Markdown",
        ...citiesKeyboard(cities, showMoreButton, lang),
      });
    }
  } catch (error) {
    console.error("[Booking Wizard] Origin search error:", error);
    await ctx.reply(getMessage("errorGeneral", ctx.session?.language || "EN"));
  }
}

/**
 * Handle destination city search
 */
export async function handleDestinationSearch(ctx: TelegramContext, showAll: boolean = false, editMessage: boolean = false) {
  try {
    const lang = ctx.session?.language || "EN";
    const origin = ctx.session?.data?.origin;

    // Count total cities to know if "More" button should show
    const totalCities = await prisma.city.count({
      where: {
        isActive: true,
        ...(origin && { id: { not: origin } }),
      },
    });

    // Fetch popular cities (exclude origin if set, or all if showAll is true)
    const cities = await prisma.city.findMany({
      where: {
        isActive: true,
        ...(origin && { id: { not: origin } }),
      },
      orderBy: { tripCount: "desc" },
      take: showAll ? 50 : 10,
      select: { id: true, name: true },
    });

    // Show "More" button if there are more cities than currently displayed
    const showMoreButton = !showAll && totalCities > 10;

    if (editMessage && "callbackQuery" in ctx) {
      // Edit existing message keyboard
      await ctx.editMessageReplyMarkup(citiesKeyboard(cities, showMoreButton, lang).reply_markup);
    } else {
      // Send new message
      await ctx.reply(getMessage("searchDestination", lang), {
        parse_mode: "Markdown",
        ...citiesKeyboard(cities, showMoreButton, lang),
      });
    }
  } catch (error) {
    console.error("[Booking Wizard] Destination search error:", error);
    await ctx.reply(getMessage("errorGeneral", ctx.session?.language || "EN"));
  }
}

/**
 * Handle date selection
 */
export async function handleDateSelection(ctx: TelegramContext) {
  try {
    const lang = ctx.session?.language || "EN";

    await ctx.reply(getMessage("searchDate", lang), {
      parse_mode: "Markdown",
      ...dateKeyboard(lang),
    });
  } catch (error) {
    console.error("[Booking Wizard] Date selection error:", error);
    await ctx.reply(getMessage("errorGeneral", ctx.session?.language || "EN"));
  }
}

/**
 * Handle trip search and display results
 */
export async function handleTripSearch(ctx: TelegramContext) {
  try {
    const lang = ctx.session?.language || "EN";
    const { origin, destination, date } = ctx.session?.data || {};

    if (!origin || !destination || !date) {
      await ctx.reply(getMessage("errorGeneral", lang));
      return;
    }

    // Fetch origin and destination city names
    const [originCity, destCity] = await Promise.all([
      prisma.city.findUnique({ where: { id: origin } }),
      prisma.city.findUnique({ where: { id: destination } }),
    ]);

    if (!originCity || !destCity) {
      await ctx.reply(getMessage("cityNotFound", lang));
      return;
    }

    // Search trips - MATCHES WEB APP QUERY (api/trips/route.ts)
    const searchDate = new Date(date);
    const now = new Date();
    const isToday = startOfDay(searchDate).toDateString() === now.toDateString();

    const trips = await prisma.trip.findMany({
      where: {
        // Use contains for flexible city matching (same as web app)
        origin: { contains: originCity.name, mode: "insensitive" },
        destination: { contains: destCity.name, mode: "insensitive" },
        departureTime: {
          // If today, only show trips that haven't departed yet (same as web app)
          gte: isToday ? now : startOfDay(searchDate),
          lte: endOfDay(searchDate),
        },
        isActive: true,
        bookingHalted: false,
        availableSlots: { gt: 0 },
        // NO status filter - web app shows all active trips, not just SCHEDULED
      },
      include: {
        company: true,
      },
      orderBy: {
        departureTime: "asc",
      },
    });

    // Log trip search results for debugging
    console.log(
      `[Trip Search] Found ${trips.length} trips for ${originCity.name} → ${destCity.name} on ${format(searchDate, 'yyyy-MM-dd')}`
    );
    if (trips.length > 0) {
      console.log(
        `[Trip Search] Trips:`,
        trips.map((t) => ({
          id: t.id,
          company: t.company.name,
          time: format(t.departureTime, "HH:mm"),
          availableSlots: t.availableSlots,
        }))
      );
    }

    if (trips.length === 0) {
      await ctx.reply(getMessage("noTripsFound", lang), {
        parse_mode: "Markdown",
        ...searchAgainKeyboard(lang),
      });
      return;
    }

    // Format trips for keyboard
    const tripsData = trips.map((trip) => ({
      id: trip.id,
      company: trip.company.name,
      time: format(trip.departureTime, "h:mm a"),
      price: trip.price,
      availableSlots: trip.availableSlots,
    }));

    await ctx.reply(
      getMessage("tripsFound", lang)(trips.length, originCity.name, destCity.name),
      {
        parse_mode: "Markdown",
        ...tripsKeyboard(tripsData, lang),
      }
    );
  } catch (error) {
    console.error("[Booking Wizard] Trip search error:", error);
    await ctx.reply(getMessage("errorGeneral", ctx.session?.language || "EN"));
  }
}

/**
 * Handle passenger count selection
 */
export async function handlePassengerCount(ctx: TelegramContext) {
  try {
    const lang = ctx.session?.language || "EN";

    await ctx.reply(getMessage("askPassengerCount", lang), {
      parse_mode: "Markdown",
      ...passengerCountKeyboard(lang),
    });
  } catch (error) {
    console.error("[Booking Wizard] Passenger count error:", error);
    await ctx.reply(getMessage("errorGeneral", ctx.session?.language || "EN"));
  }
}

/**
 * Handle seat preference selection (auto vs manual)
 */
export async function handleSeatPreference(ctx: TelegramContext) {
  try {
    const lang = ctx.session?.language || "EN";

    await ctx.reply(getMessage("askSeatPreference", lang), {
      parse_mode: "Markdown",
      ...seatPreferenceKeyboard(lang),
    });
  } catch (error) {
    console.error("[Booking Wizard] Seat preference error:", error);
    await ctx.reply(getMessage("errorGeneral", ctx.session?.language || "EN"));
  }
}

/**
 * Handle manual seat selection
 */
export async function handleSeatSelection(ctx: TelegramContext) {
  try {
    const lang = ctx.session?.language || "EN";
    const { selectedTripId, passengerCount, selectedSeats } = ctx.session?.data || {};

    if (!selectedTripId || !passengerCount) {
      console.error("[Booking Wizard] Missing trip ID or passenger count in session");
      await ctx.reply(getMessage("errorGeneral", lang));
      return;
    }

    // Fetch trip and occupied seats
    const trip = await prisma.trip.findUnique({
      where: { id: selectedTripId },
      include: {
        passengers: {
          where: {
            booking: {
              status: { in: ["PENDING", "PAID"] },
            },
          },
          select: { seatNumber: true },
        },
      },
    });

    if (!trip) {
      console.error("[Booking Wizard] Trip not found:", selectedTripId);
      await ctx.reply(
        lang === "EN"
          ? "❌ Trip not found. Please start your search again."
          : "❌ ጉዞ አልተገኘም። እባክዎን ፍለጋዎን እንደገና ይጀምሩ።",
        { ...searchAgainKeyboard(lang) }
      );
      return;
    }

    // Check if trip is still available
    if (trip.availableSlots < passengerCount) {
      await ctx.reply(
        lang === "EN"
          ? `❌ Not enough seats available. Only ${trip.availableSlots} seats left.`
          : `❌ በቂ መቀመጫዎች የሉም። ${trip.availableSlots} መቀመጫዎች ብቻ ቀርተዋል።`,
        { ...searchAgainKeyboard(lang) }
      );
      return;
    }

    const occupiedSeats = trip.passengers
      .map((p) => p.seatNumber)
      .filter((s): s is number => s !== null);

    const currentSelectedSeats = selectedSeats || [];

    await ctx.reply(getMessage("selectSeats", lang)(passengerCount), {
      parse_mode: "Markdown",
      ...seatMapKeyboard(
        trip.totalSlots,
        occupiedSeats,
        currentSelectedSeats,
        lang
      ),
    });
  } catch (error) {
    console.error("[Booking Wizard] Seat selection error:", error);
    await ctx.reply(getMessage("errorGeneral", ctx.session?.language || "EN"));
  }
}

/**
 * Handle passenger name collection
 */
export async function handlePassengerName(ctx: TelegramContext) {
  try {
    const lang = ctx.session?.language || "EN";
    const { passengerCount, currentPassengerIndex } = ctx.session?.data || {};

    if (passengerCount === undefined || currentPassengerIndex === undefined) {
      await ctx.reply(getMessage("errorGeneral", lang));
      return;
    }

    await ctx.reply(
      getMessage("askPassengerName", lang)(currentPassengerIndex, passengerCount),
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("[Booking Wizard] Passenger name error:", error);
    await ctx.reply(getMessage("errorGeneral", ctx.session?.language || "EN"));
  }
}

/**
 * Handle passenger ID collection
 */
export async function handlePassengerID(ctx: TelegramContext) {
  try {
    const lang = ctx.session?.language || "EN";

    await ctx.reply(getMessage("askPassengerID", lang), {
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("[Booking Wizard] Passenger ID error:", error);
    await ctx.reply(getMessage("errorGeneral", ctx.session?.language || "EN"));
  }
}

/**
 * Handle passenger phone collection
 */
export async function handlePassengerPhone(ctx: TelegramContext) {
  try {
    const lang = ctx.session?.language || "EN";

    await ctx.reply(getMessage("askPassengerPhone", lang), {
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("[Booking Wizard] Passenger phone error:", error);
    await ctx.reply(getMessage("errorGeneral", ctx.session?.language || "EN"));
  }
}

/**
 * Handle booking confirmation
 */
export async function handleBookingConfirmation(ctx: TelegramContext) {
  try {
    const lang = ctx.session?.language || "EN";
    const { selectedTripId, passengerCount, passengerData } = ctx.session?.data || {};

    if (!selectedTripId || !passengerCount || !passengerData) {
      await ctx.reply(getMessage("errorGeneral", lang));
      return;
    }

    // Fetch trip details
    const trip = await prisma.trip.findUnique({
      where: { id: selectedTripId },
      include: { company: true },
    });

    if (!trip) {
      await ctx.reply(getMessage("errorGeneral", lang));
      return;
    }

    // Calculate amounts
    const amounts = calculateBookingAmounts(trip.price, passengerCount);

    // Build summary
    const summary = {
      company: trip.company.name,
      origin: trip.origin,
      destination: trip.destination,
      departureTime: trip.departureTime,
      passengerCount,
      passengers: passengerData,
      ticketTotal: amounts.ticketTotal,
      commission: amounts.commission,
      vat: amounts.commissionVAT,
    };

    const summaryText = formatBookingSummary(summary, lang);

    await ctx.reply(
      getMessage("confirmBooking", lang)(summaryText),
      {
        parse_mode: "Markdown",
        ...confirmBookingKeyboard(lang),
      }
    );
  } catch (error) {
    console.error("[Booking Wizard] Booking confirmation error:", error);
    await ctx.reply(getMessage("errorGeneral", ctx.session?.language || "EN"));
  }
}

/**
 * Generic booking flow handler
 */
export async function handleBookingFlow(ctx: TelegramContext, state: string) {
  switch (state) {
    case "SEARCH_ORIGIN":
      await handleOriginSearch(ctx);
      break;

    case "SEARCH_DESTINATION":
      await handleDestinationSearch(ctx);
      break;

    case "SEARCH_DATE":
      await handleDateSelection(ctx);
      break;

    case "SELECT_TRIP":
      await handleTripSearch(ctx);
      break;

    case "ASK_PASSENGER_COUNT":
      await handlePassengerCount(ctx);
      break;

    case "ASK_SEAT_PREFERENCE":
      await handleSeatPreference(ctx);
      break;

    case "SELECT_SEATS":
      await handleSeatSelection(ctx);
      break;

    case "ASK_PASSENGER_NAME":
      await handlePassengerName(ctx);
      break;

    case "ASK_PASSENGER_ID":
      await handlePassengerID(ctx);
      break;

    case "ASK_PASSENGER_PHONE":
      await handlePassengerPhone(ctx);
      break;

    case "CONFIRM_BOOKING":
      await handleBookingConfirmation(ctx);
      break;

    default:
      await ctx.reply(getMessage("errorGeneral", ctx.session?.language || "EN"));
  }
}

/**
 * Handle city selection callback
 */
export async function handleCitySelection(
  ctx: TelegramContext,
  cityId: string,
  isOrigin: boolean
) {
  try {
    const lang = ctx.session?.language || "EN";

    await ctx.answerCbQuery();

    if (!ctx.chat) return;

    if (isOrigin) {
      await updateSessionState(ctx.chat.id, "SEARCH_DESTINATION", { origin: cityId });

      // Update in-memory session to reflect database changes
      if (ctx.session) {
        ctx.session.state = "SEARCH_DESTINATION";
        if (!ctx.session.data) ctx.session.data = {};
        ctx.session.data.origin = cityId;
      }

      await handleDestinationSearch(ctx);
    } else {
      await updateSessionState(ctx.chat.id, "SEARCH_DATE", { destination: cityId });

      // Update in-memory session to reflect database changes
      if (ctx.session) {
        ctx.session.state = "SEARCH_DATE";
        if (!ctx.session.data) ctx.session.data = {};
        ctx.session.data.destination = cityId;
      }

      await handleDateSelection(ctx);
    }
  } catch (error) {
    console.error("[Booking Wizard] City selection error:", error);
    await ctx.answerCbQuery("Error");
  }
}

/**
 * Handle date selection callback
 */
export async function handleDateCallback(ctx: TelegramContext, dateStr: string) {
  try {
    await ctx.answerCbQuery();

    if (!ctx.chat) return;

    const date = new Date(dateStr);
    await updateSessionState(ctx.chat.id, "SELECT_TRIP", { date });

    // Update in-memory session to reflect database changes
    if (ctx.session) {
      ctx.session.state = "SELECT_TRIP";
      if (!ctx.session.data) ctx.session.data = {};
      ctx.session.data.date = date;
    }

    await handleTripSearch(ctx);
  } catch (error) {
    console.error("[Booking Wizard] Date callback error:", error);
    await ctx.answerCbQuery("Error");
  }
}

/**
 * Handle trip selection callback
 */
export async function handleTripSelection(ctx: TelegramContext, tripId: string) {
  try {
    const lang = ctx.session?.language || "EN";

    await ctx.answerCbQuery();

    if (!ctx.chat) return;

    // Fetch trip details
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { company: true },
    });

    if (!trip) {
      await ctx.reply(getMessage("errorGeneral", lang));
      return;
    }

    // Display trip details
    const tripCard = formatTripCard(trip, lang);
    const { tripDetailKeyboard } = await import("../keyboards");

    await ctx.editMessageText(tripCard, {
      parse_mode: "Markdown",
      ...tripDetailKeyboard(tripId, lang),
    });
  } catch (error) {
    console.error("[Booking Wizard] Trip selection error:", error);
    await ctx.answerCbQuery("Error");
  }
}

/**
 * Handle book trip callback
 */
export async function handleBookTrip(ctx: TelegramContext, tripId: string) {
  try {
    await ctx.answerCbQuery();

    if (!ctx.chat) return;

    await updateSessionState(ctx.chat.id, "ASK_PASSENGER_COUNT", {
      selectedTripId: tripId,
    });

    // CRITICAL: Sync in-memory session with selectedTripId
    if (ctx.session) {
      ctx.session.state = "ASK_PASSENGER_COUNT";
      if (!ctx.session.data) ctx.session.data = {};
      ctx.session.data.selectedTripId = tripId;
    }

    await handlePassengerCount(ctx);
  } catch (error) {
    console.error("[Booking Wizard] Book trip error:", error);
    await ctx.answerCbQuery("Error");
  }
}

/**
 * Handle passenger count callback
 */
export async function handlePassengerCountCallback(
  ctx: TelegramContext,
  count: number
) {
  try {
    await ctx.answerCbQuery();

    if (!ctx.chat) return;

    // Initialize passenger data array
    const passengerData = Array.from({ length: count }, () => ({
      name: "",
      nationalId: "",
      phone: "",
      seatNumber: null,
    }));

    await updateSessionState(ctx.chat.id, "ASK_SEAT_PREFERENCE", {
      passengerCount: count,
      passengerData,
      currentPassengerIndex: 0,
    });

    // Update in-memory session to reflect database changes
    if (ctx.session) {
      ctx.session.state = "ASK_SEAT_PREFERENCE";
      if (!ctx.session.data) ctx.session.data = {};
      ctx.session.data.passengerCount = count;
      ctx.session.data.passengerData = passengerData;
      ctx.session.data.currentPassengerIndex = 0;
    }

    await handleSeatPreference(ctx);
  } catch (error) {
    console.error("[Booking Wizard] Passenger count callback error:", error);
    await ctx.answerCbQuery("Error");
  }
}

/**
 * Handle seat preference callback (auto vs manual)
 */
export async function handleSeatPreferenceCallback(
  ctx: TelegramContext,
  preference: "auto" | "manual"
) {
  try {
    const lang = ctx.session?.language || "EN";

    await ctx.answerCbQuery();

    if (!ctx.chat) return;

    console.log(`[Seat Preference] User selected: ${preference}`);

    if (preference === "manual") {
      // Manual seat selection
      await updateSessionState(ctx.chat.id, "SELECT_SEATS", { seatPreference: preference });

      // Update in-memory session
      if (ctx.session) {
        ctx.session.state = "SELECT_SEATS";
        if (!ctx.session.data) ctx.session.data = {};
        ctx.session.data.seatPreference = preference;
      }

      await handleSeatSelection(ctx);
    } else {
      // Auto-assign seats
      const { selectedTripId, passengerCount } = ctx.session?.data || {};

      console.log(`[Auto-assign] Trip: ${selectedTripId}, Passengers: ${passengerCount}`);

      if (!selectedTripId || !passengerCount) {
        console.error("[Auto-assign] Missing trip ID or passenger count");
        await ctx.reply(getMessage("errorGeneral", lang));
        return;
      }

      // Fetch trip details
      const trip = await prisma.trip.findUnique({
        where: { id: selectedTripId },
        select: { totalSlots: true },
      });

      if (!trip) {
        console.error("[Auto-assign] Trip not found");
        await ctx.reply(getMessage("errorGeneral", lang));
        return;
      }

      console.log(`[Auto-assign] Trip has ${trip.totalSlots} total slots`);

      // Get available seats (pass prisma as tx since we're not in a transaction)
      const availableSeats = await getAvailableSeatNumbers(
        selectedTripId,
        passengerCount,
        trip.totalSlots,
        prisma // Pass prisma client as transaction parameter
      );

      console.log(`[Auto-assign] Available seats:`, availableSeats);

      if (availableSeats.length < passengerCount) {
        console.error(`[Auto-assign] Not enough seats. Need ${passengerCount}, got ${availableSeats.length}`);
        await ctx.reply(getMessage("noSeatsAvailable", lang));
        return;
      }

      // Assign seats to session
      const assignedSeats = availableSeats.slice(0, passengerCount);
      await updateSessionState(ctx.chat.id, "ASK_PASSENGER_NAME", {
        selectedSeats: assignedSeats,
        seatPreference: preference,
      });

      // UPDATE IN-MEMORY SESSION (Critical fix for session sync)
      if (ctx.session) {
        ctx.session.state = "ASK_PASSENGER_NAME";
        if (!ctx.session.data) ctx.session.data = {};
        ctx.session.data.selectedSeats = assignedSeats;
        ctx.session.data.seatPreference = preference;
      }

      console.log(`[Auto-assign] Assigned seats:`, assignedSeats);

      // Notify user of assigned seats
      await ctx.reply(
        lang === "EN"
          ? `✅ Auto-assigned seats: ${formatSeats(assignedSeats)}`
          : `✅ በራስ-ሰር የተመደቡ መቀመጫዎች: ${formatSeats(assignedSeats)}`
      );

      await handlePassengerName(ctx);
    }
  } catch (error) {
    console.error("[Booking Wizard] Seat preference callback error:", error);
    console.error(error);
    await ctx.answerCbQuery("Error");
    await ctx.reply(
      ctx.session?.language === "EN"
        ? "❌ An error occurred. Please try again or use /cancel to start over."
        : "❌ ስህተት ተከስቷል። እባክዎን እንደገና ይሞክሩ ወይም /cancel ይጠቀሙ።"
    );
  }
}

/**
 * Handle seat toggle callback (manual selection)
 */
export async function handleSeatToggle(ctx: TelegramContext, seatNum: number) {
  try {
    const lang = ctx.session?.language || "EN";

    if (!ctx.chat) {
      await ctx.answerCbQuery("Error");
      return;
    }

    const { selectedSeats, passengerCount } = ctx.session?.data || {};
    const currentSeats = selectedSeats || [];

    // Toggle seat
    const seatIndex = currentSeats.indexOf(seatNum);
    let newSeats: number[];

    if (seatIndex > -1) {
      // Deselect
      newSeats = currentSeats.filter((s: number) => s !== seatNum);
    } else {
      // Select (if not exceeding passenger count)
      if (currentSeats.length >= passengerCount) {
        await ctx.answerCbQuery(
          lang === "EN"
            ? `Maximum ${passengerCount} seats allowed`
            : `ከፍተኛው ${passengerCount} መቀመጫዎች ተፈቅደዋል`
        );
        return;
      }
      newSeats = [...currentSeats, seatNum];
    }

    // Keep current state (SELECT_SEATS) instead of empty string
    await updateSessionState(ctx.chat.id, "SELECT_SEATS", { selectedSeats: newSeats });

    // Sync in-memory session
    if (ctx.session) {
      if (!ctx.session.data) ctx.session.data = {};
      ctx.session.data.selectedSeats = newSeats;
    }

    // Refresh seat map
    await ctx.answerCbQuery();
    await handleSeatSelection(ctx);
  } catch (error) {
    console.error("[Booking Wizard] Seat toggle error:", error);
    await ctx.answerCbQuery("Error");
  }
}

/**
 * Handle seats confirm callback
 */
export async function handleSeatsConfirm(ctx: TelegramContext) {
  try {
    const lang = ctx.session?.language || "EN";

    await ctx.answerCbQuery();

    if (!ctx.chat) return;

    const { selectedSeats, passengerCount } = ctx.session?.data || {};

    if (!selectedSeats || selectedSeats.length !== passengerCount) {
      await ctx.answerCbQuery(
        lang === "EN"
          ? `Please select ${passengerCount} seats`
          : `እባክዎን ${passengerCount} መቀመጫዎችን ይምረጡ`
      );
      return;
    }

    // Move to passenger details
    await updateSessionState(ctx.chat.id, "ASK_PASSENGER_NAME");

    // Update in-memory session to reflect database changes
    if (ctx.session) {
      ctx.session.state = "ASK_PASSENGER_NAME";
    }

    await ctx.reply(getMessage("seatSelectionComplete", lang)(formatSeats(selectedSeats)));
    await handlePassengerName(ctx);
  } catch (error) {
    console.error("[Booking Wizard] Seats confirm error:", error);
    await ctx.answerCbQuery("Error");
  }
}

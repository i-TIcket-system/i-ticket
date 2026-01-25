/**
 * Telegram Bot Core Instance
 * Main bot configuration and message router
 */

import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { TelegramContext, sessionMiddleware } from "./middleware/auth";
import {
  handleStart,
  handleBook,
  handleMyTickets,
  handleHelp,
  handleCancel,
  handleLanguageSelection,
  handlePhoneContact,
  handleMenuCallback,
  handleActionCallback,
  handleSupportContact,
} from "./handlers/commands";
import {
  handleCitySelection,
  handleDateCallback,
  handleTripSelection,
  handleBookTrip,
  handlePassengerCountCallback,
  handleSeatPreferenceCallback,
  handleSeatToggle,
  handleSeatsConfirm,
  handleBookingFlow,
} from "./scenes/booking-wizard";
import { updateSessionState } from "./middleware/auth";
import { getMessage } from "./messages";

// Bot configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_ENABLED = process.env.TELEGRAM_BOT_ENABLED === "true";

if (!BOT_TOKEN && BOT_ENABLED) {
  throw new Error("TELEGRAM_BOT_TOKEN is required when bot is enabled");
}

// Initialize bot
export const bot = BOT_TOKEN ? new Telegraf<TelegramContext>(BOT_TOKEN) : null;

/**
 * Initialize bot with all handlers
 */
export function initializeBot() {
  if (!bot || !BOT_ENABLED) {
    console.log("[Telegram Bot] Bot disabled or token missing");
    return;
  }

  console.log("[Telegram Bot] Initializing bot...");

  // Apply session middleware
  bot.use(sessionMiddleware);

  // Error handling
  bot.catch((err, ctx) => {
    console.error("[Telegram Bot] Error:", err);
    ctx.reply(getMessage("errorGeneral", ctx.session?.language || "EN")).catch(() => {});
  });

  // ==================== COMMANDS ====================

  bot.command("start", handleStart);
  bot.command("book", handleBook);
  bot.command("mytickets", handleMyTickets);
  bot.command("help", handleHelp);
  bot.command("cancel", handleCancel);

  // ==================== CALLBACK QUERIES ====================

  // Language selection
  bot.action(/^lang_(EN|AM)$/, async (ctx) => {
    const lang = ctx.match[1] as "EN" | "AM";
    await handleLanguageSelection(ctx, lang);
  });

  // Main menu actions
  bot.action(/^menu_(.+)$/, async (ctx) => {
    const action = ctx.match[1];
    await handleMenuCallback(ctx, `menu_${action}`);
  });

  // Generic actions (back, cancel)
  bot.action(/^action_(.+)$/, async (ctx) => {
    const action = ctx.match[1];
    await handleActionCallback(ctx, `action_${action}`);
  });

  // City selection (origin)
  bot.action(/^city_(.+)$/, async (ctx) => {
    const cityId = ctx.match[1];
    const state = ctx.session?.state;

    if (state === "SEARCH_ORIGIN") {
      await handleCitySelection(ctx, cityId, true);
    } else if (state === "SEARCH_DESTINATION") {
      await handleCitySelection(ctx, cityId, false);
    }
  });

  // More cities action
  bot.action("cities_more", async (ctx) => {
    await ctx.answerCbQuery();
    const state = ctx.session?.state;

    if (state === "SEARCH_ORIGIN") {
      const { handleOriginSearch } = await import("./scenes/booking-wizard");
      await handleOriginSearch(ctx, true, true); // showAll=true, editMessage=true
    } else if (state === "SEARCH_DESTINATION") {
      const { handleDestinationSearch } = await import("./scenes/booking-wizard");
      await handleDestinationSearch(ctx, true, true); // showAll=true, editMessage=true
    }
  });

  // Date selection
  bot.action(/^date_(.+)$/, async (ctx) => {
    const dateStr = ctx.match[1];

    if (dateStr === "picker") {
      // Show extended date picker
      await ctx.answerCbQuery();
      const lang = ctx.session?.language || "EN";
      const { dateKeyboard } = await import("./keyboards");
      await ctx.editMessageReplyMarkup(dateKeyboard(lang, true).reply_markup);
      return;
    }

    if (dateStr === "simple") {
      // Show simple date picker
      await ctx.answerCbQuery();
      const lang = ctx.session?.language || "EN";
      const { dateKeyboard } = await import("./keyboards");
      await ctx.editMessageReplyMarkup(dateKeyboard(lang, false).reply_markup);
      return;
    }

    await handleDateCallback(ctx, dateStr);
  });

  // Trip selection
  bot.action(/^trip_(.+)$/, async (ctx) => {
    const tripId = ctx.match[1];
    await handleTripSelection(ctx, tripId);
  });

  // Book trip
  bot.action(/^book_(.+)$/, async (ctx) => {
    const tripId = ctx.match[1];
    await handleBookTrip(ctx, tripId);
  });

  // Passenger count
  bot.action(/^passengers_(\d+)$/, async (ctx) => {
    const count = parseInt(ctx.match[1]);
    await handlePassengerCountCallback(ctx, count);
  });

  // Seat preference
  bot.action(/^seats_(auto|manual)$/, async (ctx) => {
    const preference = ctx.match[1] as "auto" | "manual";
    await handleSeatPreferenceCallback(ctx, preference);
  });

  // Seat selection (toggle)
  bot.action(/^seat_(\d+)$/, async (ctx) => {
    const seatNum = parseInt(ctx.match[1]);
    await handleSeatToggle(ctx, seatNum);
  });

  // Seats confirmation
  bot.action("seats_confirm", handleSeatsConfirm);

  // Booking confirmation
  bot.action("confirm_pay", async (ctx) => {
    await ctx.answerCbQuery();
    // TODO: Implement payment flow
    const lang = ctx.session?.language || "EN";
    await ctx.reply(
      lang === "EN"
        ? "💳 Payment integration coming soon! This will initiate TeleBirr payment."
        : "💳 የክፍያ ውህደት ብቻ ይመጣል! ይህ TeleBirr ክፍያን ይጀምራል።"
    );
  });

  // Booking edit
  bot.action("confirm_edit", async (ctx) => {
    await ctx.answerCbQuery();
    const lang = ctx.session?.language || "EN";

    // Go back to passenger count
    if (ctx.chat) {
      await updateSessionState(ctx.chat.id, "ASK_PASSENGER_COUNT");
      const { handlePassengerCount } = await import("./scenes/booking-wizard");
      await handlePassengerCount(ctx);
    }
  });

  // Support contact
  bot.action("support_contact", handleSupportContact);

  // Search again actions
  bot.action("search_date", async (ctx) => {
    await ctx.answerCbQuery();

    if (ctx.chat) {
      await updateSessionState(ctx.chat.id, "SEARCH_DATE");
      const { handleDateSelection } = await import("./scenes/booking-wizard");
      await handleDateSelection(ctx);
    }
  });

  bot.action("search_new", async (ctx) => {
    await ctx.answerCbQuery();

    if (ctx.chat) {
      await updateSessionState(ctx.chat.id, "SEARCH_ORIGIN");
      const { handleOriginSearch } = await import("./scenes/booking-wizard");
      await handleOriginSearch(ctx);
    }
  });

  // Ticket viewing
  bot.action(/^ticket_(.+)$/, async (ctx) => {
    const bookingId = ctx.match[1];
    // TODO: Implement ticket viewing
    await ctx.answerCbQuery();
    const lang = ctx.session?.language || "EN";
    await ctx.reply(
      lang === "EN"
        ? `📥 Fetching tickets for booking ${bookingId}...`
        : `📥 ትኬቶችን በማውረድ ላይ ${bookingId}...`
    );
  });

  // ==================== TEXT MESSAGES ====================

  // Handle phone number from contact share
  bot.on(message("contact"), handlePhoneContact);

  // Handle text messages based on current state
  bot.on(message("text"), async (ctx) => {
    const state = ctx.session?.state || "IDLE";
    const text = ctx.message.text;
    const lang = ctx.session?.language || "EN";

    if (!ctx.chat) return;

    try {
      switch (state) {
        case "ASK_PASSENGER_NAME": {
          // Validate name
          if (text.trim().length < 2) {
            await ctx.reply(getMessage("invalidName", lang));
            return;
          }

          const { passengerData, currentPassengerIndex } = ctx.session?.data || {};

          if (!passengerData) {
            await ctx.reply(getMessage("errorGeneral", lang));
            return;
          }

          // Update passenger name
          passengerData[currentPassengerIndex].name = text.trim();

          await updateSessionState(ctx.chat.id, "ASK_PASSENGER_ID", {
            passengerData,
          });

          const { handlePassengerID } = await import("./scenes/booking-wizard");
          await handlePassengerID(ctx);
          break;
        }

        case "ASK_PASSENGER_ID": {
          // Validate ID
          if (text.trim().length < 3) {
            await ctx.reply(getMessage("invalidID", lang));
            return;
          }

          const { passengerData, currentPassengerIndex } = ctx.session?.data || {};

          if (!passengerData) {
            await ctx.reply(getMessage("errorGeneral", lang));
            return;
          }

          // Update passenger ID
          passengerData[currentPassengerIndex].nationalId = text.trim();

          await updateSessionState(ctx.chat.id, "ASK_PASSENGER_PHONE", {
            passengerData,
          });

          const { handlePassengerPhone } = await import("./scenes/booking-wizard");
          await handlePassengerPhone(ctx);
          break;
        }

        case "ASK_PASSENGER_PHONE": {
          // Validate phone
          const normalizedPhone = text.replace(/\D/g, "");

          if (!normalizedPhone.startsWith("09") || normalizedPhone.length !== 10) {
            await ctx.reply(getMessage("invalidPhone", lang));
            return;
          }

          const { passengerData, currentPassengerIndex, passengerCount, selectedSeats, seatPreference } =
            ctx.session?.data || {};

          if (!passengerData) {
            await ctx.reply(getMessage("errorGeneral", lang));
            return;
          }

          // Update passenger phone
          passengerData[currentPassengerIndex].phone = normalizedPhone;

          // Assign seat number if available
          if (selectedSeats && selectedSeats.length > currentPassengerIndex) {
            passengerData[currentPassengerIndex].seatNumber = selectedSeats[currentPassengerIndex];
          }

          // Check if more passengers to collect
          if (currentPassengerIndex + 1 < passengerCount) {
            // Move to next passenger
            await updateSessionState(ctx.chat.id, "ASK_PASSENGER_NAME", {
              passengerData,
              currentPassengerIndex: currentPassengerIndex + 1,
            });

            const { handlePassengerName } = await import("./scenes/booking-wizard");
            await handlePassengerName(ctx);
          } else {
            // All passengers collected - show confirmation
            await updateSessionState(ctx.chat.id, "CONFIRM_BOOKING", {
              passengerData,
            });

            const { handleBookingConfirmation } = await import("./scenes/booking-wizard");
            await handleBookingConfirmation(ctx);
          }
          break;
        }

        case "SEARCH_ORIGIN":
        case "SEARCH_DESTINATION": {
          // Handle city text input
          const city = await import("@/lib/db").then((m) =>
            m.prisma.city.findFirst({
              where: {
                name: { contains: text, mode: "insensitive" },
                isActive: true,
              },
            })
          );

          if (!city) {
            await ctx.reply(getMessage("cityNotFound", lang));
            return;
          }

          await handleCitySelection(ctx, city.id, state === "SEARCH_ORIGIN");
          break;
        }

        default:
          // Unknown state or IDLE - show help
          await ctx.reply(
            lang === "EN"
              ? "I didn't understand that. Use /help to see available commands."
              : "ይህን አልገባኝም። የሚገኙ ትዕዛዞችን ለማየት /help ይጠቀሙ።"
          );
      }
    } catch (error) {
      console.error("[Telegram Bot] Text message error:", error);
      await ctx.reply(getMessage("errorGeneral", lang));
    }
  });

  // ==================== STARTUP ====================

  console.log("[Telegram Bot] Bot initialized successfully");
  console.log("[Telegram Bot] Registered command handlers:");
  console.log("  - /start");
  console.log("  - /book");
  console.log("  - /mytickets");
  console.log("  - /help");
  console.log("  - /cancel");
}

/**
 * Process webhook update
 */
export async function processUpdate(update: any) {
  if (!bot) {
    throw new Error("Bot not initialized");
  }

  await bot.handleUpdate(update);
}

/**
 * Get bot info
 */
export async function getBotInfo() {
  if (!bot) {
    return null;
  }

  return await bot.telegram.getMe();
}

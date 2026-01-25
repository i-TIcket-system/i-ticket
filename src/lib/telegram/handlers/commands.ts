/**
 * Telegram Bot Command Handlers
 * Handles all bot commands (/start, /book, /mytickets, /help, etc.)
 */

import { TelegramContext } from "../middleware/auth";
import { getMessage, MESSAGES, Language } from "../messages";
import {
  languageKeyboard,
  mainMenuKeyboard,
  phoneKeyboard,
  removeKeyboard,
} from "../keyboards";
import {
  updateSessionState,
  updateSessionLanguage,
  verifyPhoneNumber,
  resetSession,
  resetSessionPreserveLanguage,
  isAuthenticated,
} from "../middleware/auth";
import { prisma } from "@/lib/db";
import { formatBookingStatus, formatDateTime, formatRoute } from "../utils/formatters";

/**
 * /start command - Welcome message and language selection
 */
export async function handleStart(ctx: TelegramContext) {
  try {
    const lang = ctx.session?.language || "EN";

    // Check if user is already authenticated
    if (isAuthenticated(ctx)) {
      // Existing user - show main menu
      await ctx.reply(getMessage("welcome", lang), {
        parse_mode: "Markdown",
        ...mainMenuKeyboard(lang),
      });
    } else {
      // New user - welcome message + language selection
      await ctx.reply(getMessage("welcome", lang), {
        parse_mode: "Markdown",
        ...languageKeyboard(),
      });
    }
  } catch (error) {
    console.error("[Commands] /start error:", error);
    await ctx.reply(getMessage("errorGeneral", ctx.session?.language || "EN"));
  }
}

/**
 * /book command - Start booking flow
 */
export async function handleBook(ctx: TelegramContext) {
  try {
    const lang = ctx.session?.language || "EN";

    // Check authentication
    if (!isAuthenticated(ctx)) {
      await ctx.reply(getMessage("requestPhone", lang), {
        parse_mode: "Markdown",
        ...phoneKeyboard(lang),
      });
      return;
    }

    // Reset session (preserve language) and start booking flow
    if (ctx.chat) {
      await resetSessionPreserveLanguage(ctx.chat.id);
      await updateSessionState(ctx.chat.id, "SEARCH_ORIGIN");
    }

    // Import dynamically to avoid circular dependency
    const { handleOriginSearch } = await import("../scenes/booking-wizard");
    await handleOriginSearch(ctx);
  } catch (error) {
    console.error("[Commands] /book error:", error);
    await ctx.reply(getMessage("errorGeneral", ctx.session?.language || "EN"));
  }
}

/**
 * /mytickets command - View user's bookings
 */
export async function handleMyTickets(ctx: TelegramContext) {
  try {
    const lang = ctx.session?.language || "EN";

    // Check authentication
    if (!isAuthenticated(ctx) || !ctx.dbUser) {
      await ctx.reply(getMessage("requestPhone", lang), {
        parse_mode: "Markdown",
        ...phoneKeyboard(lang),
      });
      return;
    }

    // Fetch user's bookings
    const bookings = await prisma.booking.findMany({
      where: {
        userId: ctx.dbUser.id,
        status: { in: ["PENDING", "PAID", "COMPLETED"] },
      },
      include: {
        trip: {
          include: {
            company: true,
          },
        },
        passengers: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20, // Limit to 20 most recent bookings
    });

    if (bookings.length === 0) {
      // Access MESSAGES directly for function-type messages
      const myTicketsMsg = MESSAGES.myTickets[lang as Language];
      await ctx.reply(myTicketsMsg(0), {
        parse_mode: "Markdown",
      });
      return;
    }

    // Build bookings keyboard
    const { myTicketsKeyboard } = await import("../keyboards");

    const bookingsData = bookings.map((b) => ({
      id: b.id,
      route: formatRoute(b.trip.origin, b.trip.destination),
      date: formatDateTime(b.trip.departureTime, lang).split(" ")[0], // Just date
      status: formatBookingStatus(b.status, lang),
    }));

    // Access MESSAGES directly for function-type messages
    const myTicketsMsg = MESSAGES.myTickets[lang as Language];
    await ctx.reply(myTicketsMsg(bookings.length), {
      parse_mode: "Markdown",
      ...myTicketsKeyboard(bookingsData, lang),
    });
  } catch (error) {
    console.error("[Commands] /mytickets error:", error);
    await ctx.reply(getMessage("errorGeneral", ctx.session?.language || "EN"));
  }
}

/**
 * /help command - Show help message
 */
export async function handleHelp(ctx: TelegramContext) {
  try {
    const lang = ctx.session?.language || "EN";

    await ctx.reply(getMessage("help", lang), {
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("[Commands] /help error:", error);
    await ctx.reply(getMessage("errorGeneral", ctx.session?.language || "EN"));
  }
}

/**
 * /cancel command - Cancel current action
 */
export async function handleCancel(ctx: TelegramContext) {
  try {
    const lang = ctx.session?.language || "EN";

    if (ctx.chat) {
      await resetSession(ctx.chat.id);
    }

    await ctx.reply(getMessage("cancelled", lang), {
      ...mainMenuKeyboard(lang),
    });
  } catch (error) {
    console.error("[Commands] /cancel error:", error);
    await ctx.reply(getMessage("errorGeneral", ctx.session?.language || "EN"));
  }
}

/**
 * Handle language selection callback
 */
export async function handleLanguageSelection(ctx: TelegramContext, language: "EN" | "AM") {
  try {
    if (ctx.chat) {
      await updateSessionLanguage(ctx.chat.id, language);
    }

    await ctx.answerCbQuery();

    const langUpdatedMsg = getMessage("languageUpdated", language);
    console.log("[DEBUG] Language updated message:", langUpdatedMsg);
    await ctx.editMessageText(langUpdatedMsg, {
      parse_mode: "Markdown",
    });

    // If not authenticated, request phone number
    if (!isAuthenticated(ctx)) {
      const phoneMsg = getMessage("requestPhone", language);
      console.log("[DEBUG] Phone request message:", phoneMsg);
      await ctx.reply(phoneMsg, {
        parse_mode: "Markdown",
        ...phoneKeyboard(language),
      });
    } else {
      // Show main menu
      const welcomeMsg = getMessage("welcome", language);
      console.log("[DEBUG] Welcome message:", welcomeMsg);
      await ctx.reply(welcomeMsg, {
        parse_mode: "Markdown",
        ...mainMenuKeyboard(language),
      });
    }
  } catch (error) {
    console.error("[Commands] Language selection error:", error);
    await ctx.answerCbQuery("Error updating language");
  }
}

/**
 * Handle phone number from contact share
 */
export async function handlePhoneContact(ctx: TelegramContext) {
  try {
    const lang = ctx.session?.language || "EN";

    if (!ctx.message || !("contact" in ctx.message)) {
      return;
    }

    const contact = ctx.message.contact;
    const phoneNumber = contact.phone_number;

    if (!ctx.chat) {
      await ctx.reply(getMessage("errorGeneral", lang));
      return;
    }

    // Verify phone number
    try {
      const { user, isNew } = await verifyPhoneNumber(ctx.chat.id, phoneNumber);

      // Remove phone keyboard
      await ctx.reply(getMessage("phoneVerified", lang), removeKeyboard());

      // Welcome message
      await ctx.reply(getMessage("welcome", lang), {
        parse_mode: "Markdown",
        ...mainMenuKeyboard(lang),
      });

      console.log(
        `[Commands] Phone verified: ${user.phone} (${isNew ? "new" : "existing"} user)`
      );
    } catch (verifyError: any) {
      console.error("[Commands] Phone verification error:", verifyError);
      await ctx.reply(getMessage("invalidPhone", lang));
    }
  } catch (error) {
    console.error("[Commands] Phone contact error:", error);
    await ctx.reply(getMessage("errorGeneral", ctx.session?.language || "EN"));
  }
}

/**
 * Handle main menu callbacks
 */
export async function handleMenuCallback(ctx: TelegramContext, action: string) {
  try {
    const lang = ctx.session?.language || "EN";

    await ctx.answerCbQuery();

    switch (action) {
      case "menu_book":
        await handleBook(ctx);
        break;

      case "menu_mytickets":
        await handleMyTickets(ctx);
        break;

      case "menu_help":
        await handleHelp(ctx);
        break;

      case "menu_language":
        await ctx.editMessageText(getMessage("selectLanguage", lang), {
          parse_mode: "Markdown",
          ...languageKeyboard(),
        });
        break;

      default:
        await ctx.reply(getMessage("errorGeneral", lang));
    }
  } catch (error) {
    console.error("[Commands] Menu callback error:", error);
    await ctx.answerCbQuery("Error");
  }
}

/**
 * Handle action callbacks (back, cancel, etc.)
 */
export async function handleActionCallback(ctx: TelegramContext, action: string) {
  try {
    const lang = ctx.session?.language || "EN";

    await ctx.answerCbQuery();

    switch (action) {
      case "action_cancel":
        if (ctx.chat) {
          await resetSession(ctx.chat.id);
        }
        await ctx.editMessageText(getMessage("cancelled", lang), {
          parse_mode: "Markdown",
        });
        await ctx.reply(getMessage("welcome", lang), {
          parse_mode: "Markdown",
          ...mainMenuKeyboard(lang),
        });
        break;

      case "action_back":
        // Handle back action based on current state
        const state = ctx.session?.state || "IDLE";
        await handleBackAction(ctx, state);
        break;

      default:
        await ctx.reply(getMessage("errorGeneral", lang));
    }
  } catch (error) {
    console.error("[Commands] Action callback error:", error);
    await ctx.answerCbQuery("Error");
  }
}

/**
 * Handle back action based on current state
 */
async function handleBackAction(ctx: TelegramContext, currentState: string) {
  const lang = ctx.session?.language || "EN";

  // State transition map for back action
  const backStateMap: Record<string, string> = {
    SEARCH_DESTINATION: "SEARCH_ORIGIN",
    SEARCH_DATE: "SEARCH_DESTINATION",
    SELECT_TRIP: "SEARCH_DATE",
    ASK_PASSENGER_COUNT: "SELECT_TRIP",
    ASK_SEAT_PREFERENCE: "ASK_PASSENGER_COUNT",
    SELECT_SEATS: "ASK_SEAT_PREFERENCE",
    ASK_PASSENGER_NAME: "ASK_SEAT_PREFERENCE",
    ASK_PASSENGER_ID: "ASK_PASSENGER_NAME",
    ASK_PASSENGER_PHONE: "ASK_PASSENGER_ID",
    CONFIRM_BOOKING: "ASK_PASSENGER_PHONE",
  };

  const previousState = backStateMap[currentState];

  if (!previousState || !ctx.chat) {
    await ctx.reply(getMessage("cancelled", lang), {
      ...mainMenuKeyboard(lang),
    });
    return;
  }

  // Update state
  await updateSessionState(ctx.chat.id, previousState);

  // Update in-memory session to reflect database changes
  if (ctx.session) {
    ctx.session.state = previousState;
  }

  // Trigger appropriate handler for previous state
  const { handleBookingFlow } = await import("../scenes/booking-wizard");
  await handleBookingFlow(ctx, previousState);
}

/**
 * Handle support contact
 */
export async function handleSupportContact(ctx: TelegramContext) {
  try {
    const lang = ctx.session?.language || "EN";

    await ctx.answerCbQuery();

    const supportMessage =
      lang === "EN"
        ? `📞 *Contact Support*

*Email:* support@i-ticket.et
*Phone:* +251 911 223 344
*Website:* https://i-ticket.et

*Business Hours:*
Mon-Sun: 6:00 AM - 10:00 PM EAT

Our support team is ready to help you!`
        : `📞 *ድጋፍ ያግኙ*

*ኢሜይል:* support@i-ticket.et
*ስልክ:* +251 911 223 344
*ድረ-ገጽ:* https://i-ticket.et

*የስራ ሰዓት:*
ሰኞ-እሁድ: ከጥዋት 6:00 - እስከ ምሽት 10:00

የድጋፍ ቡድናችን ለመርዳት ዝግጁ ነው!`;

    await ctx.reply(supportMessage, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("[Commands] Support contact error:", error);
    await ctx.answerCbQuery("Error");
  }
}

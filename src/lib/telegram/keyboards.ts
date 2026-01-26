/**
 * Telegram Bot Inline Keyboards
 * Reusable keyboard layouts for the i-Ticket bot
 */

import { Markup } from "telegraf";
import { getMessage, Language } from "./messages";

/**
 * Language selection keyboard
 */
export function languageKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("🇺🇸 English", "lang_EN"),
      Markup.button.callback("🇪🇹 አማርኛ", "lang_AM"),
    ],
  ]);
}

/**
 * Main menu keyboard
 */
export function mainMenuKeyboard(lang: Language = "EN") {
  return Markup.inlineKeyboard([
    [Markup.button.callback(getMessage("bookNowButton", lang), "menu_book")],
    [Markup.button.callback(getMessage("viewTicketsButton", lang), "menu_mytickets")],
    [Markup.button.callback("❓ " + (lang === "EN" ? "Help" : "እገዛ"), "menu_help")],
    [Markup.button.callback("🌍 " + (lang === "EN" ? "Change Language" : "ቋንቋ ቀይር"), "menu_language")],
  ]);
}

/**
 * Phone number request keyboard
 */
export function phoneKeyboard(lang: Language = "EN") {
  return Markup.keyboard([
    [
      Markup.button.contactRequest(getMessage("sharePhoneButton", lang)),
    ],
  ]).resize();
}

/**
 * City selection keyboard (2-column popular cities + type option)
 */
export function citiesKeyboard(cities: { id: string; name: string }[], showMore: boolean = true, lang: Language = "EN") {
  const buttons = [];

  // Popular cities in 2-column layout (max 10)
  for (let i = 0; i < cities.length && i < 10; i += 2) {
    const row = [
      Markup.button.callback(cities[i].name, `city_${cities[i].id}`),
    ];
    if (i + 1 < cities.length) {
      row.push(Markup.button.callback(cities[i + 1].name, `city_${cities[i + 1].id}`));
    }
    buttons.push(row);
  }

  // Always show "Type city name" option for searching other cities
  buttons.push([
    Markup.button.callback(
      lang === "EN" ? "🔍 Type city name..." : "🔍 የከተማ ስም ይፃፉ...",
      "city_type"
    ),
  ]);

  buttons.push([
    Markup.button.callback(getMessage("cancelButton", lang), "action_cancel"),
  ]);

  return Markup.inlineKeyboard(buttons);
}

/**
 * Date selection keyboard
 */
export function dateKeyboard(lang: Language = "EN", showExtended: boolean = false) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (!showExtended) {
    // Simple view: Today, Tomorrow, More dates
    return Markup.inlineKeyboard([
      [
        Markup.button.callback(getMessage("todayButton", lang), `date_${today.toISOString().split('T')[0]}`),
        Markup.button.callback(getMessage("tomorrowButton", lang), `date_${tomorrow.toISOString().split('T')[0]}`),
      ],
      [
        Markup.button.callback(
          lang === "EN" ? "📅 More dates..." : "📅 ተጨማሪ ቀናት...",
          "date_picker"
        ),
      ],
      [
        Markup.button.callback(getMessage("cancelButton", lang), "action_cancel"),
      ],
    ]);
  }

  // Extended view: Next 7 days in a grid
  const buttons = [];
  const days = lang === "EN"
    ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    : ["እሁድ", "ሰኞ", "ማክሰ", "ረቡዕ", "ሐሙስ", "አርብ", "ቅዳሜ"];
  const months = lang === "EN"
    ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    : ["ጥር", "የካቲ", "መጋቢ", "ሚያዝ", "ግንቦ", "ሰኔ", "ሐምሌ", "ነሐሴ", "መስከ", "ጥቅም", "ኅዳር", "ታኅሳ"];

  // Show next 14 days (2 rows of 7)
  for (let i = 0; i < 14; i += 7) {
    const row = [];
    for (let j = 0; j < 7 && i + j < 14; j++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i + j);

      const dayName = days[date.getDay()];
      const label = i + j === 0
        ? (lang === "EN" ? "Today" : "ዛሬ")
        : i + j === 1
        ? (lang === "EN" ? "Tomorrow" : "ነገ")
        : `${dayName} ${date.getDate()}`;

      row.push(
        Markup.button.callback(label, `date_${date.toISOString().split('T')[0]}`)
      );
    }
    buttons.push(row);
  }

  // Back to simple view button
  buttons.push([
    Markup.button.callback(
      lang === "EN" ? "⬅️ Back" : "⬅️ ተመለስ",
      "date_simple"
    ),
    Markup.button.callback(getMessage("cancelButton", lang), "action_cancel"),
  ]);

  return Markup.inlineKeyboard(buttons);
}

/**
 * Trip results keyboard
 */
export function tripsKeyboard(
  trips: Array<{
    id: string;
    company: string;
    time: string;
    price: number;
    availableSlots: number;
  }>,
  lang: Language = "EN"
) {
  const buttons = trips.map((trip) => [
    Markup.button.callback(
      `🚌 ${trip.company} | ${trip.time} | ${trip.price} ETB | ${trip.availableSlots} ${lang === "EN" ? "seats" : "መቀመጫ"}`,
      `trip_${trip.id}`
    ),
  ]);

  buttons.push([
    Markup.button.callback(getMessage("backButton", lang), "action_back"),
    Markup.button.callback(getMessage("cancelButton", lang), "action_cancel"),
  ]);

  return Markup.inlineKeyboard(buttons);
}

/**
 * Trip detail keyboard
 */
export function tripDetailKeyboard(tripId: string, lang: Language = "EN") {
  return Markup.inlineKeyboard([
    [Markup.button.callback(getMessage("bookNowButton", lang), `book_${tripId}`)],
    [
      Markup.button.callback(getMessage("backButton", lang), "action_back"),
      Markup.button.callback(getMessage("cancelButton", lang), "action_cancel"),
    ],
  ]);
}

/**
 * Passenger count keyboard (1-5)
 */
export function passengerCountKeyboard(lang: Language = "EN") {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("1", "passengers_1"),
      Markup.button.callback("2", "passengers_2"),
      Markup.button.callback("3", "passengers_3"),
      Markup.button.callback("4", "passengers_4"),
      Markup.button.callback("5", "passengers_5"),
    ],
    [
      Markup.button.callback(getMessage("backButton", lang), "action_back"),
      Markup.button.callback(getMessage("cancelButton", lang), "action_cancel"),
    ],
  ]);
}

/**
 * Seat preference keyboard (Auto vs Manual)
 */
export function seatPreferenceKeyboard(lang: Language = "EN") {
  return Markup.inlineKeyboard([
    [Markup.button.callback(getMessage("autoAssignButton", lang), "seats_auto")],
    [Markup.button.callback(getMessage("manualSelectButton", lang), "seats_manual")],
    [
      Markup.button.callback(getMessage("backButton", lang), "action_back"),
      Markup.button.callback(getMessage("cancelButton", lang), "action_cancel"),
    ],
  ]);
}

/**
 * Skip ID keyboard (for optional ID input)
 */
export function skipIdKeyboard(lang: Language = "EN") {
  return Markup.inlineKeyboard([
    [Markup.button.callback(lang === "EN" ? "⏭️ Skip" : "⏭️ ዝለል", "skip_id")],
    [Markup.button.callback(getMessage("cancelButton", lang), "action_cancel")],
  ]);
}

/**
 * Seat map keyboard (4-column layout with aisle spacing)
 * @param totalSeats - Total number of seats in the bus
 * @param occupiedSeats - Array of occupied seat numbers
 * @param selectedSeats - Array of currently selected seat numbers
 */
export function seatMapKeyboard(
  totalSeats: number,
  occupiedSeats: number[],
  selectedSeats: number[] = [],
  lang: Language = "EN"
) {
  const buttons = [];
  const seatsPerRow = 4; // 2 seats | aisle | 2 seats

  for (let i = 1; i <= totalSeats; i += seatsPerRow) {
    const row = [];

    // Left side (seats 1-2)
    for (let j = 0; j < 2 && i + j <= totalSeats; j++) {
      const seatNum = i + j;
      let label: string;

      if (occupiedSeats.includes(seatNum)) {
        label = `❌ ${seatNum}`;
      } else if (selectedSeats.includes(seatNum)) {
        label = `✅ ${seatNum}`;
      } else {
        label = `🪑 ${seatNum}`;
      }

      row.push(
        Markup.button.callback(label, `seat_${seatNum}`, occupiedSeats.includes(seatNum))
      );
    }

    // Aisle spacer (non-clickable)
    row.push(Markup.button.callback("  ", "seat_aisle", true));

    // Right side (seats 3-4)
    for (let j = 2; j < 4 && i + j <= totalSeats; j++) {
      const seatNum = i + j;
      let label: string;

      if (occupiedSeats.includes(seatNum)) {
        label = `❌ ${seatNum}`;
      } else if (selectedSeats.includes(seatNum)) {
        label = `✅ ${seatNum}`;
      } else {
        label = `🪑 ${seatNum}`;
      }

      row.push(
        Markup.button.callback(label, `seat_${seatNum}`, occupiedSeats.includes(seatNum))
      );
    }

    buttons.push(row);
  }

  // Done/Cancel buttons
  if (selectedSeats.length > 0) {
    buttons.push([
      Markup.button.callback(getMessage("confirmButton", lang), "seats_confirm"),
    ]);
  }

  buttons.push([
    Markup.button.callback(getMessage("backButton", lang), "action_back"),
    Markup.button.callback(getMessage("cancelButton", lang), "action_cancel"),
  ]);

  return Markup.inlineKeyboard(buttons);
}

/**
 * Booking confirmation keyboard
 */
export function confirmBookingKeyboard(lang: Language = "EN") {
  return Markup.inlineKeyboard([
    [Markup.button.callback("✅ " + (lang === "EN" ? "Confirm & Pay" : "አረጋግጥ እና ክፈል"), "confirm_pay")],
    [
      Markup.button.callback("✏️ " + (lang === "EN" ? "Edit" : "አርም"), "confirm_edit"),
      Markup.button.callback(getMessage("cancelButton", lang), "action_cancel"),
    ],
  ]);
}

/**
 * Payment keyboard (retry/cancel)
 */
export function paymentKeyboard(bookingId: string, lang: Language = "EN") {
  return Markup.inlineKeyboard([
    [Markup.button.callback(getMessage("retryPaymentButton", lang), `payment_retry_${bookingId}`)],
    [Markup.button.callback(getMessage("cancelButton", lang), "action_cancel")],
    [Markup.button.callback(getMessage("contactSupportButton", lang), "support_contact")],
  ]);
}

/**
 * My Tickets keyboard - list of bookings
 */
export function myTicketsKeyboard(
  bookings: Array<{
    id: string;
    route: string;
    date: string;
    status: string;
  }>,
  lang: Language = "EN"
) {
  const buttons = bookings.map((booking) => [
    Markup.button.callback(
      `${booking.route} | ${booking.date} | ${booking.status}`,
      `ticket_${booking.id}`
    ),
  ]);

  buttons.push([
    Markup.button.callback(getMessage("cancelButton", lang), "action_cancel"),
  ]);

  return Markup.inlineKeyboard(buttons);
}

/**
 * Ticket detail keyboard
 */
export function ticketDetailKeyboard(bookingId: string, lang: Language = "EN") {
  return Markup.inlineKeyboard([
    [Markup.button.callback("📥 " + (lang === "EN" ? "Download Again" : "እንደገና አውርድ"), `download_${bookingId}`)],
    [
      Markup.button.callback(getMessage("backButton", lang), "action_back"),
      Markup.button.callback(getMessage("cancelButton", lang), "action_cancel"),
    ],
  ]);
}

/**
 * Back/Cancel navigation keyboard
 */
export function navigationKeyboard(lang: Language = "EN") {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(getMessage("backButton", lang), "action_back"),
      Markup.button.callback(getMessage("cancelButton", lang), "action_cancel"),
    ],
  ]);
}

/**
 * Search again keyboard (when no trips found)
 */
export function searchAgainKeyboard(lang: Language = "EN") {
  return Markup.inlineKeyboard([
    [Markup.button.callback(lang === "EN" ? "🔍 Try Another Date" : "🔍 ሌላ ቀን ይሞክሩ", "search_date")],
    [Markup.button.callback(lang === "EN" ? "🔄 Search Different Route" : "🔄 የተለየ መስመር ይፈልጉ", "search_new")],
    [Markup.button.callback(getMessage("contactSupportButton", lang), "support_contact")],
  ]);
}

/**
 * Remove keyboard (hide custom keyboard)
 */
export function removeKeyboard() {
  return Markup.removeKeyboard();
}

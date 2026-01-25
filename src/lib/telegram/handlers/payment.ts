/**
 * Telegram Bot Payment Handler
 * Handles booking creation and payment processing
 */

import { TelegramContext, updateSessionState } from "../middleware/auth";
import { getMessage, Language } from "../messages";
import { prisma, transactionWithTimeout } from "@/lib/db";
import type { Passenger } from "@prisma/client";
import { calculateBookingAmounts } from "@/lib/commission";
import { getAvailableSeatNumbers, generateShortCode } from "@/lib/utils";
import { initiateTelebirrPayment, formatPhoneForTelebirr } from "@/lib/payments/telebirr";
import { formatCurrency, formatRoute, formatDateTime } from "../utils/formatters";
import { searchAgainKeyboard, mainMenuKeyboard } from "../keyboards";
import QRCode from "qrcode";

/**
 * Create booking and initiate payment
 */
export async function handleConfirmPayment(ctx: TelegramContext) {
  try {
    const lang = ctx.session?.language || "EN";
    const { selectedTripId, passengerCount, passengerData, selectedSeats } = ctx.session?.data || {};

    if (!selectedTripId || !passengerCount || !passengerData) {
      await ctx.reply(getMessage("errorGeneral", lang));
      return;
    }

    // Get user from session
    if (!ctx.dbUser) {
      await ctx.reply(getMessage("requestPhone", lang));
      return;
    }

    // Show processing message
    await ctx.reply(
      lang === "EN"
        ? "⏳ Creating your booking..."
        : "⏳ ማስያዝዎን በመፍጠር ላይ..."
    );

    // Create booking in transaction
    const result = await transactionWithTimeout(async (tx) => {
      // Lock and get trip
      const trips = await tx.$queryRaw<Array<{
        id: string;
        companyId: string;
        availableSlots: number;
        bookingHalted: boolean;
        totalSlots: number;
        price: number;
        status: string;
        origin: string;
        destination: string;
        departureTime: Date;
      }>>`
        SELECT id, "companyId", "availableSlots", "bookingHalted", "totalSlots", price, status, origin, destination, "departureTime"
        FROM "Trip"
        WHERE id = ${selectedTripId}
        FOR UPDATE NOWAIT
      `;

      if (!trips || trips.length === 0) {
        throw new Error("Trip not found");
      }

      const trip = trips[0];

      // Validate trip is still available
      if (trip.status === "COMPLETED" || trip.status === "CANCELLED" || trip.status === "DEPARTED") {
        throw new Error(`Trip is ${trip.status.toLowerCase()}`);
      }

      if (trip.bookingHalted) {
        throw new Error("Booking is currently halted for this trip");
      }

      if (trip.availableSlots < passengerCount) {
        throw new Error(`Only ${trip.availableSlots} seats available`);
      }

      // Get company info
      const company = await tx.company.findUnique({
        where: { id: trip.companyId },
        select: { name: true, disableAutoHaltGlobally: true },
      });

      // Get or assign seats
      let seatNumbers: number[];

      if (selectedSeats && selectedSeats.length === passengerCount) {
        // Verify selected seats are still available
        const occupiedPassengers = await tx.passenger.findMany({
          where: {
            booking: {
              tripId: selectedTripId,
              status: { not: "CANCELLED" },
            },
            seatNumber: { in: selectedSeats },
          },
          select: { seatNumber: true },
        });

        if (occupiedPassengers.length > 0) {
          const occupiedNumbers = occupiedPassengers.map((p: { seatNumber: number | null }) => p.seatNumber).join(", ");
          throw new Error(`Seats ${occupiedNumbers} are no longer available`);
        }

        seatNumbers = selectedSeats;
      } else {
        // Auto-assign seats
        seatNumbers = await getAvailableSeatNumbers(
          selectedTripId,
          passengerCount,
          trip.totalSlots,
          tx
        );
      }

      // Calculate amounts
      const amounts = calculateBookingAmounts(trip.price, passengerCount);

      // Create booking
      const booking = await tx.booking.create({
        data: {
          tripId: selectedTripId,
          userId: ctx.dbUser.id,
          totalAmount: amounts.totalAmount,
          commission: amounts.commission.baseCommission,
          commissionVAT: amounts.commission.vat,
          status: "PENDING",
          passengers: {
            create: passengerData.map((p: any, index: number) => ({
              name: p.name,
              nationalId: p.nationalId,
              phone: p.phone || ctx.dbUser.phone,
              seatNumber: seatNumbers[index],
            })),
          },
        },
        include: {
          passengers: true,
        },
      });

      // Update trip available slots
      await tx.$executeRaw`
        UPDATE "Trip"
        SET "availableSlots" = "availableSlots" - ${passengerCount},
            "updatedAt" = NOW()
        WHERE id = ${selectedTripId}
      `;

      // Auto-halt check
      const updatedTrip = await tx.trip.findUnique({
        where: { id: selectedTripId },
        select: {
          availableSlots: true,
          bookingHalted: true,
          adminResumedFromAutoHalt: true,
          autoResumeEnabled: true,
        },
      });

      if (
        updatedTrip &&
        updatedTrip.availableSlots <= 10 &&
        !updatedTrip.bookingHalted &&
        !updatedTrip.adminResumedFromAutoHalt &&
        !updatedTrip.autoResumeEnabled &&
        !company?.disableAutoHaltGlobally
      ) {
        await tx.trip.update({
          where: { id: selectedTripId },
          data: {
            lowSlotAlertSent: true,
            bookingHalted: true,
          },
        });
      }

      return {
        booking,
        trip: {
          ...trip,
          company: company?.name || "Unknown",
        },
        amounts,
      };
    });

    // Store booking ID in session
    if (ctx.chat) {
      await updateSessionState(ctx.chat.id, "AWAITING_PAYMENT", {
        bookingId: result.booking.id,
      });
    }

    // Check if demo mode
    const isDemoMode = process.env.DEMO_MODE === "true" || !process.env.TELEBIRR_APP_ID;

    if (isDemoMode) {
      // Process demo payment immediately
      await processDemoPayment(ctx, result.booking.id, result.amounts.totalAmount, lang);
    } else {
      // Initiate TeleBirr payment
      const phone = ctx.dbUser.phone;
      const formattedPhone = formatPhoneForTelebirr(phone);

      try {
        const { transactionId } = await initiateTelebirrPayment({
          phone: formattedPhone,
          amount: result.amounts.totalAmount,
          reference: result.booking.id,
          description: `i-Ticket: ${result.trip.origin} → ${result.trip.destination}`,
        });

        // Store transaction ID
        if (ctx.chat) {
          await updateSessionState(ctx.chat.id, "AWAITING_PAYMENT", {
            paymentTransactionId: transactionId,
          });
        }

        // Notify user
        const paymentMessage = getMessage("paymentInitiated", lang)
          .replace("{amount}", formatCurrency(result.amounts.totalAmount));

        await ctx.reply(paymentMessage, { parse_mode: "Markdown" });
      } catch (paymentError) {
        console.error("[Telegram Payment] TeleBirr initiation failed:", paymentError);

        // Notify user of payment failure
        await ctx.reply(
          lang === "EN"
            ? "❌ Failed to initiate payment. Please try again or contact support."
            : "❌ ክፍያን መጀመር አልተቻለም። እባክዎን እንደገና ይሞክሩ ወይም ድጋፍ ያግኙ።"
        );
      }
    }
  } catch (error: any) {
    console.error("[Telegram Payment] Error:", error);
    const lang = ctx.session?.language || "EN";

    // Handle specific errors
    if (error.message?.includes("NOWAIT") || error.message?.includes("could not obtain lock")) {
      await ctx.reply(
        lang === "EN"
          ? "⚠️ This trip is being booked by another user. Please try again in a moment."
          : "⚠️ ይህ ጉዞ በሌላ ተጠቃሚ እየተያዘ ነው። እባክዎን ትንሽ ቆይተው ይሞክሩ።",
        { ...searchAgainKeyboard(lang) }
      );
    } else if (error.message?.includes("seats available") || error.message?.includes("no longer available")) {
      await ctx.reply(
        lang === "EN"
          ? `❌ ${error.message}. Please search for another trip.`
          : `❌ ${error.message}. እባክዎን ሌላ ጉዞ ይፈልጉ።`,
        { ...searchAgainKeyboard(lang) }
      );
    } else {
      await ctx.reply(getMessage("errorGeneral", lang));
    }
  }
}

/**
 * Process demo payment (for development/testing)
 */
async function processDemoPayment(
  ctx: TelegramContext,
  bookingId: string,
  amount: number,
  lang: Language
) {
  try {
    // Simulate payment processing
    await ctx.reply(
      lang === "EN"
        ? "💳 *DEMO MODE* - Processing payment..."
        : "💳 *ማሳያ ሁነታ* - ክፍያን በማሳደድ ላይ..."
    );

    // Small delay to simulate payment
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Process payment in transaction
    const result = await transactionWithTimeout(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          bookingId,
          amount,
          method: "DEMO",
          transactionId: `DEMO-TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          status: "SUCCESS",
        },
      });

      // Update booking status
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "PAID" },
      });

      // Get booking with passengers
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          passengers: true,
          trip: {
            include: { company: true },
          },
        },
      });

      if (!booking) {
        throw new Error("Booking not found");
      }

      // Generate tickets
      const tickets = await Promise.all(
        booking.passengers.map(async (passenger: Passenger) => {
          const shortCode = generateShortCode();
          const baseUrl = process.env.NEXTAUTH_URL || "https://i-ticket.et";
          const verificationUrl = `${baseUrl}/verify/${shortCode}`;

          const qrCode = await QRCode.toDataURL(verificationUrl, {
            width: 300,
            margin: 2,
          });

          return tx.ticket.create({
            data: {
              bookingId,
              tripId: booking.tripId,
              passengerName: passenger.name,
              seatNumber: passenger.seatNumber,
              qrCode,
              shortCode,
            },
          });
        })
      );

      // Log payment
      await tx.adminLog.create({
        data: {
          userId: booking.userId,
          action: "PAYMENT_SUCCESS",
          tripId: booking.tripId,
          details: `Telegram booking payment: ${amount} ETB. Method: DEMO. ${tickets.length} tickets generated.`,
        },
      });

      return { booking, payment, tickets };
    });

    // Send success message
    await ctx.reply(getMessage("paymentSuccess", lang), { parse_mode: "Markdown" });

    // Send ticket details
    const booking = result.booking;
    const trip = booking.trip;

    const ticketMessage =
      lang === "EN"
        ? `🎫 *Your Tickets*

🚌 ${trip.company.name}
📍 ${formatRoute(trip.origin, trip.destination)}
📅 ${formatDateTime(trip.departureTime, lang)}

*Passengers:*
${result.tickets.map((t, i) => `${i + 1}. ${t.passengerName} - Seat ${t.seatNumber}`).join("\n")}

*Booking ID:* \`${booking.id.slice(0, 8)}\`

📱 Show your QR code when boarding.
Track your ticket: ${process.env.NEXTAUTH_URL || "https://i-ticket.et"}/track/${result.tickets[0]?.shortCode}`
        : `🎫 *ትኬቶችዎ*

🚌 ${trip.company.name}
📍 ${formatRoute(trip.origin, trip.destination)}
📅 ${formatDateTime(trip.departureTime, lang)}

*ተሳፋሪዎች:*
${result.tickets.map((t, i) => `${i + 1}. ${t.passengerName} - መቀመጫ ${t.seatNumber}`).join("\n")}

*የማስያዝ መለያ:* \`${booking.id.slice(0, 8)}\`

📱 ሲጓዙ QR ኮድዎን ያሳዩ።
ትኬትዎን ይከታተሉ: ${process.env.NEXTAUTH_URL || "https://i-ticket.et"}/track/${result.tickets[0]?.shortCode}`;

    await ctx.reply(ticketMessage, {
      parse_mode: "Markdown",
      ...mainMenuKeyboard(lang),
    });

    // Reset session
    if (ctx.chat) {
      const { resetSessionPreserveLanguage } = await import("../middleware/auth");
      await resetSessionPreserveLanguage(ctx.chat.id);
    }
  } catch (error) {
    console.error("[Telegram Payment] Demo payment error:", error);
    await ctx.reply(getMessage("paymentFailed", lang).replace("{reason}", "Processing error"));
  }
}

/**
 * Handle TeleBirr payment callback (called from webhook)
 */
export async function handlePaymentCallback(
  chatId: number,
  bookingId: string,
  status: "SUCCESS" | "FAILED",
  transactionId: string,
  amount: number
) {
  try {
    // Get session for language
    const session = await prisma.telegramSession.findUnique({
      where: { chatId: BigInt(chatId) },
    });

    const lang = (session?.language as Language) || "EN";

    if (status === "SUCCESS") {
      // Process successful payment
      const result = await transactionWithTimeout(async (tx) => {
        // Create payment record
        const payment = await tx.payment.create({
          data: {
            bookingId,
            amount,
            method: "TELEBIRR",
            transactionId,
            status: "SUCCESS",
          },
        });

        // Update booking status
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: "PAID" },
        });

        // Get booking with passengers
        const booking = await tx.booking.findUnique({
          where: { id: bookingId },
          include: {
            passengers: true,
            trip: {
              include: { company: true },
            },
          },
        });

        if (!booking) {
          throw new Error("Booking not found");
        }

        // Generate tickets
        const tickets = await Promise.all(
          booking.passengers.map(async (passenger: Passenger) => {
            const shortCode = generateShortCode();
            const baseUrl = process.env.NEXTAUTH_URL || "https://i-ticket.et";
            const verificationUrl = `${baseUrl}/verify/${shortCode}`;

            const qrCode = await QRCode.toDataURL(verificationUrl, {
              width: 300,
              margin: 2,
            });

            return tx.ticket.create({
              data: {
                bookingId,
                tripId: booking.tripId,
                passengerName: passenger.name,
                seatNumber: passenger.seatNumber,
                qrCode,
                shortCode,
              },
            });
          })
        );

        return { booking, tickets };
      });

      // Send success notification via Telegram
      const { bot } = await import("../bot");
      if (bot) {
        await bot.telegram.sendMessage(
          chatId,
          getMessage("paymentSuccess", lang),
          { parse_mode: "Markdown" }
        );

        // Send ticket info
        const booking = result.booking;
        const ticketMessage =
          lang === "EN"
            ? `🎫 Booking confirmed! Check /mytickets to view your tickets.`
            : `🎫 ማስያዝ ተረጋግጧል! ትኬቶችዎን ለማየት /mytickets ይጫኑ።`;

        await bot.telegram.sendMessage(chatId, ticketMessage);
      }
    } else {
      // Payment failed
      const { bot } = await import("../bot");
      if (bot) {
        await bot.telegram.sendMessage(
          chatId,
          getMessage("paymentFailed", lang).replace("{reason}", "Payment declined"),
          { parse_mode: "Markdown" }
        );
      }
    }
  } catch (error) {
    console.error("[Telegram Payment] Callback processing error:", error);
  }
}

/**
 * Telegram Bot Ticket Handler
 * Handles ticket viewing and display
 */

import { TelegramContext } from "../middleware/auth";
import { getMessage, Language } from "../messages";
import { prisma } from "@/lib/db";
import { formatDateTime, formatRoute, formatBookingStatus, formatCurrency } from "../utils/formatters";
import { mainMenuKeyboard } from "../keyboards";
import { Markup } from "telegraf";

/**
 * Handle viewing tickets for a booking
 */
export async function handleViewTickets(ctx: TelegramContext, bookingId: string) {
  try {
    const lang = ctx.session?.language || "EN";

    // Verify user owns this booking
    if (!ctx.dbUser) {
      await ctx.reply(getMessage("requestPhone", lang));
      return;
    }

    // Fetch booking with tickets
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tickets: true,
        passengers: true,
        trip: {
          include: {
            company: true,
          },
        },
        payment: true,
      },
    });

    if (!booking) {
      await ctx.reply(
        lang === "EN"
          ? "❌ Booking not found."
          : "❌ ማስያዝ አልተገኘም።"
      );
      return;
    }

    // Verify ownership
    if (booking.userId !== ctx.dbUser.id) {
      await ctx.reply(
        lang === "EN"
          ? "❌ You don't have access to this booking."
          : "❌ ለዚህ ማስያዝ ፈቃድ የለዎትም።"
      );
      return;
    }

    // Check booking status
    if (booking.status === "PENDING") {
      await ctx.reply(
        lang === "EN"
          ? `⏳ *Booking Pending Payment*\n\nBooking ID: \`${booking.id.slice(0, 8)}\`\n\nPlease complete payment to receive your tickets.`
          : `⏳ *ማስያዝ ክፍያ ይጠብቃል*\n\nየማስያዝ መለያ: \`${booking.id.slice(0, 8)}\`\n\nትኬቶችዎን ለመቀበል እባክዎን ክፍያውን ያጠናቅቁ።`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    if (booking.status === "CANCELLED") {
      await ctx.reply(
        lang === "EN"
          ? `❌ *Booking Cancelled*\n\nThis booking has been cancelled.`
          : `❌ *ማስያዝ ተሰርዟል*\n\nይህ ማስያዝ ተሰርዟል።`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    const trip = booking.trip;

    // Build ticket details message
    const ticketDetailsMessage =
      lang === "EN"
        ? `🎫 *TICKET DETAILS*

*Booking ID:* \`${booking.id.slice(0, 8)}\`
*Status:* ${formatBookingStatus(booking.status, lang)}

🚌 *${trip.company.name}*
📍 ${formatRoute(trip.origin, trip.destination)}
📅 ${formatDateTime(trip.departureTime, lang)}

👥 *Passengers:*
${booking.passengers.map((p, i) => `${i + 1}. ${p.name} - Seat ${p.seatNumber}`).join("\n")}

💰 *Paid:* ${formatCurrency(Number(booking.totalAmount))}
${booking.payment?.transactionId ? `*Transaction:* \`${booking.payment.transactionId.slice(0, 12)}...\`` : ""}`
        : `🎫 *የትኬት ዝርዝሮች*

*የማስያዝ መለያ:* \`${booking.id.slice(0, 8)}\`
*ሁኔታ:* ${formatBookingStatus(booking.status, lang)}

🚌 *${trip.company.name}*
📍 ${formatRoute(trip.origin, trip.destination)}
📅 ${formatDateTime(trip.departureTime, lang)}

👥 *ተሳፋሪዎች:*
${booking.passengers.map((p, i) => `${i + 1}. ${p.name} - መቀመጫ ${p.seatNumber}`).join("\n")}

💰 *የተከፈለ:* ${formatCurrency(Number(booking.totalAmount))}
${booking.payment?.transactionId ? `*ግብይት:* \`${booking.payment.transactionId.slice(0, 12)}...\`` : ""}`;

    await ctx.reply(ticketDetailsMessage, { parse_mode: "Markdown" });

    // Send individual tickets with QR codes
    if (booking.tickets.length > 0) {
      await ctx.reply(
        lang === "EN"
          ? "📱 *Your QR Code Tickets:*\n\nShow these when boarding:"
          : "📱 *QR ኮድ ትኬቶችዎ:*\n\nሲጓዙ እነዚህን ያሳዩ:"
      );

      for (const ticket of booking.tickets) {
        // Send ticket info with tracking link
        const ticketCaption =
          lang === "EN"
            ? `🎫 *${ticket.passengerName}*\nSeat: ${ticket.seatNumber}\nCode: \`${ticket.shortCode}\`\n\n📱 Track: ${process.env.NEXTAUTH_URL || "https://i-ticket.et"}/track/${ticket.shortCode}`
            : `🎫 *${ticket.passengerName}*\nመቀመጫ: ${ticket.seatNumber}\nኮድ: \`${ticket.shortCode}\`\n\n📱 ተከታተል: ${process.env.NEXTAUTH_URL || "https://i-ticket.et"}/track/${ticket.shortCode}`;

        // Send QR code image if available
        if (ticket.qrCode && ticket.qrCode.startsWith("data:image")) {
          try {
            // Convert data URL to buffer
            const base64Data = ticket.qrCode.split(",")[1];
            const imageBuffer = Buffer.from(base64Data, "base64");

            await ctx.replyWithPhoto(
              { source: imageBuffer },
              {
                caption: ticketCaption,
                parse_mode: "Markdown",
              }
            );
          } catch (imageError) {
            console.error("[Ticket Handler] Failed to send QR image:", imageError);
            // Fallback to text
            await ctx.reply(ticketCaption, { parse_mode: "Markdown" });
          }
        } else {
          // No QR code available, send text only
          await ctx.reply(ticketCaption, { parse_mode: "Markdown" });
        }
      }
    } else {
      await ctx.reply(
        lang === "EN"
          ? "⚠️ No tickets generated yet. Please contact support if payment was completed."
          : "⚠️ ትኬቶች ገና አልተፈጠሩም። ክፍያ ከተጠናቀቀ ድጋፍን ያግኙ።"
      );
    }

    // Show "Track Bus" button if trip is DEPARTED
    if (trip.status === "DEPARTED") {
      const trackUrl = `${process.env.NEXTAUTH_URL || "https://i-ticket.et"}/track/${bookingId}`
      await ctx.reply(
        lang === "EN"
          ? "🚌 Your bus is on the way! Track it live:"
          : "🚌 አውቶቡስዎ በመንገድ ላይ ነው! በቀጥታ ይከታተሉ:",
        Markup.inlineKeyboard([
          [Markup.button.url(
            lang === "EN" ? "🗺 Track Bus on Map" : "🗺 አውቶቡስ በካርታ ይከታተሉ",
            trackUrl
          )],
          [Markup.button.callback(
            lang === "EN" ? "📍 Show Location" : "📍 አካባቢ አሳይ",
            `track_loc_${bookingId}`
          )],
        ])
      )
    }

    // Show main menu
    await ctx.reply(
      lang === "EN"
        ? "What would you like to do next?"
        : "ቀጥሎ ምን ማድረግ ይፈልጋሉ?",
      { ...mainMenuKeyboard(lang) }
    );
  } catch (error) {
    console.error("[Ticket Handler] Error:", error);
    await ctx.reply(getMessage("errorGeneral", ctx.session?.language || "EN"));
  }
}

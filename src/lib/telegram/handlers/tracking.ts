/**
 * Telegram Bot - "Where is my bus?" Tracking Handler
 * Allows passengers to check their bus location via Telegram
 */

import { TelegramContext } from "../middleware/auth"
import { getMessage, Language } from "../messages"
import { prisma } from "@/lib/db"
import { formatRoute, formatDateTime, formatCurrency } from "../utils/formatters"
import { mainMenuKeyboard } from "../keyboards"
import { Markup } from "telegraf"

/**
 * /whereismybus command handler
 * Shows user's DEPARTED bookings with tracking options
 */
export async function handleWhereIsMyBus(ctx: TelegramContext) {
  try {
    const lang = (ctx.session?.language || "EN") as Language

    if (!ctx.dbUser) {
      await ctx.reply(getMessage("requestPhone", lang), { parse_mode: "Markdown" })
      return
    }

    // Find user's bookings for DEPARTED trips
    const bookings = await prisma.booking.findMany({
      where: {
        userId: ctx.dbUser.id,
        status: "PAID",
        trip: {
          status: "DEPARTED",
        },
      },
      include: {
        trip: {
          select: {
            id: true,
            origin: true,
            destination: true,
            departureTime: true,
            trackingActive: true,
            lastLatitude: true,
            lastLongitude: true,
            lastSpeed: true,
            lastPositionAt: true,
            estimatedArrival: true,
            company: { select: { name: true } },
            vehicle: { select: { plateNumber: true, sideNumber: true } },
          },
        },
        passengers: {
          select: { name: true, seatNumber: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    })

    if (bookings.length === 0) {
      await ctx.reply(
        lang === "EN"
          ? "🚌 *Where is my bus?*\n\nYou don't have any active trips right now.\n\nYour bus tracking will appear here when your trip has departed.\n\nBook a trip: /book"
          : "🚌 *አውቶቡሴ የት ነው?*\n\nአሁን ምንም ንቁ ጉዞ የለዎትም።\n\nጉዞዎ ሲነሳ የአውቶቡስ ክትትልዎ እዚህ ይታያል።\n\nጉዞ ያስይዙ: /book",
        { parse_mode: "Markdown" }
      )
      return
    }

    // Show each active trip with tracking info
    for (const booking of bookings) {
      const trip = booking.trip
      const hasGPS = trip.trackingActive && trip.lastLatitude != null && trip.lastLongitude != null

      let statusText: string
      if (!trip.trackingActive) {
        statusText = lang === "EN" ? "📡 GPS not active yet" : "📡 GPS ገና አልተነቃም"
      } else if (trip.lastPositionAt) {
        const ageMs = Date.now() - new Date(trip.lastPositionAt).getTime()
        if (ageMs < 120000) {
          statusText = lang === "EN" ? "🟢 Live tracking" : "🟢 ቀጥታ ክትትል"
        } else {
          const minsAgo = Math.round(ageMs / 60000)
          statusText =
            lang === "EN"
              ? `🟡 Last seen ${minsAgo}m ago`
              : `🟡 ከ${minsAgo} ደቂቃ በፊት ታየ`
        }
      } else {
        statusText = lang === "EN" ? "⚪ Awaiting GPS" : "⚪ GPS በመጠበቅ ላይ"
      }

      let etaText = ""
      if (trip.estimatedArrival) {
        const eta = new Date(trip.estimatedArrival)
        const minsRemaining = Math.round((eta.getTime() - Date.now()) / 60000)
        if (minsRemaining > 0) {
          const hours = Math.floor(minsRemaining / 60)
          const mins = minsRemaining % 60
          const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
          etaText =
            lang === "EN"
              ? `\n⏱ *ETA:* ${timeStr} (${eta.toLocaleTimeString("en-ET", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Addis_Ababa" })})`
              : `\n⏱ *የመድረስ ግምት:* ${timeStr} (${eta.toLocaleTimeString("am-ET", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Addis_Ababa" })})`
        }
      }

      let speedText = ""
      if (trip.lastSpeed != null && trip.lastSpeed > 0) {
        speedText =
          lang === "EN"
            ? `\n🏎 *Speed:* ${Math.round(trip.lastSpeed)} km/h`
            : `\n🏎 *ፍጥነት:* ${Math.round(trip.lastSpeed)} ኪ.ሜ/ሰ`
      }

      const message =
        lang === "EN"
          ? `🚌 *${trip.company.name}*
📍 ${trip.origin} → ${trip.destination}
📅 ${formatDateTime(trip.departureTime, lang)}
${trip.vehicle ? `🚐 ${trip.vehicle.plateNumber}${trip.vehicle.sideNumber ? ` (${trip.vehicle.sideNumber})` : ""}` : ""}

${statusText}${speedText}${etaText}

👥 ${booking.passengers.map((p) => `${p.name} (Seat ${p.seatNumber})`).join(", ")}`
          : `🚌 *${trip.company.name}*
📍 ${trip.origin} → ${trip.destination}
📅 ${formatDateTime(trip.departureTime, lang)}
${trip.vehicle ? `🚐 ${trip.vehicle.plateNumber}${trip.vehicle.sideNumber ? ` (${trip.vehicle.sideNumber})` : ""}` : ""}

${statusText}${speedText}${etaText}

👥 ${booking.passengers.map((p) => `${p.name} (መቀመጫ ${p.seatNumber})`).join(", ")}`

      const buttons = []

      // Add "Track on Map" button (opens web)
      const trackUrl = `${process.env.NEXTAUTH_URL || "https://i-ticket.et"}/track/${booking.id}`
      buttons.push([Markup.button.url(
        lang === "EN" ? "🗺 Track on Map" : "🗺 በካርታ ይከታተሉ",
        trackUrl
      )])

      // Send location if we have GPS coordinates
      if (hasGPS) {
        buttons.push([Markup.button.callback(
          lang === "EN" ? "📍 Show Location" : "📍 አካባቢ አሳይ",
          `track_loc_${booking.id}`
        )])
      }

      await ctx.reply(message, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard(buttons),
      })
    }
  } catch (error) {
    console.error("[Tracking Handler] whereismybus error:", error)
    const lang = (ctx.session?.language || "EN") as Language
    await ctx.reply(getMessage("errorGeneral", lang))
  }
}

/**
 * Handle "Show Location" callback - sends Telegram native location
 */
export async function handleTrackLocationCallback(ctx: TelegramContext, bookingId: string) {
  try {
    await ctx.answerCbQuery()
    const lang = (ctx.session?.language || "EN") as Language

    if (!ctx.dbUser) {
      await ctx.reply(getMessage("requestPhone", lang), { parse_mode: "Markdown" })
      return
    }

    // Find the booking and verify ownership
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        userId: true,
        trip: {
          select: {
            lastLatitude: true,
            lastLongitude: true,
            trackingActive: true,
            origin: true,
            destination: true,
            company: { select: { name: true } },
          },
        },
      },
    })

    if (!booking || booking.userId !== ctx.dbUser.id) {
      await ctx.reply(
        lang === "EN"
          ? "❌ Booking not found or not accessible."
          : "❌ ማስያዝ አልተገኘም ወይም ተደራሽ አይደለም።"
      )
      return
    }

    if (booking.trip.lastLatitude != null && booking.trip.lastLongitude != null) {
      // Send Telegram native location
      await ctx.replyWithLocation(booking.trip.lastLatitude, booking.trip.lastLongitude)

      await ctx.reply(
        lang === "EN"
          ? `📍 Last known position of *${booking.trip.company.name}* bus\n${booking.trip.origin} → ${booking.trip.destination}`
          : `📍 የ *${booking.trip.company.name}* አውቶቡስ የመጨረሻ የታወቀ ቦታ\n${booking.trip.origin} → ${booking.trip.destination}`,
        { parse_mode: "Markdown" }
      )
    } else {
      await ctx.reply(
        lang === "EN"
          ? "📡 Bus location is not available yet. The driver hasn't started GPS tracking."
          : "📡 የአውቶቡስ ቦታ ገና አልተገኘም። ሹፌሩ GPS ክትትል አልጀመረም።"
      )
    }
  } catch (error) {
    console.error("[Tracking Handler] Location callback error:", error)
    const lang = (ctx.session?.language || "EN") as Language
    await ctx.reply(getMessage("errorGeneral", lang))
  }
}

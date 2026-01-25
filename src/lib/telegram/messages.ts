/**
 * Telegram Bot Message Templates (Bilingual: EN/AM)
 * All user-facing messages for the i-Ticket Telegram bot
 */

export type Language = "EN" | "AM";

interface Messages {
  EN: string;
  AM: string;
}

// Helper function to get message in user's language
export function getMessage(key: keyof typeof MESSAGES, lang: Language = "EN"): string {
  return MESSAGES[key][lang] || MESSAGES[key].EN;
}

export const MESSAGES = {
  // Welcome & Start
  welcome: {
    EN: `🚌 *Welcome to i-Ticket!*

Book Ethiopian bus tickets instantly via Telegram.

🎫 *Quick Actions:*
• /book - Search and book tickets
• /mytickets - View your bookings
• /help - Get help

Choose your language to get started! 👇`,
    AM: `🚌 *እንኳን ወደ አይ-ቲኬት በደህና መጡ!*

በቴሌግራም በፍጥነት የአውቶቡስ ትኬት ይምረጡ።

🎫 *ፈጣን እርምጃዎች:*
• /book - ትኬት ፈልግ እና አስይዝ
• /mytickets - የእርስዎን ትኬቶች ይመልከቱ
• /help - እገዛ ያግኙ

ለመጀመር ቋንቋዎን ይምረጡ! 👇`,
  },

  // Language selection
  selectLanguage: {
    EN: "🌍 *Select your preferred language:*",
    AM: "🌍 *የሚመርጡትን ቋንቋ ይምረጡ:*",
  },

  languageUpdated: {
    EN: "✅ Language updated to English!",
    AM: "✅ ቋንቋ ወደ አማርኛ ተቀይሯል!",
  },

  // Phone verification
  requestPhone: {
    EN: `📱 *Phone Verification Required*

To book tickets, please share your phone number.

This will be used for:
• Ticket confirmation
• Payment verification
• Booking notifications

Tap the button below to share your number. 👇`,
    AM: `📱 *የስልክ ማረጋገጫ ያስፈልጋል*

ትኬት ለማስያዝ እባክዎን የስልክ ቁጥርዎን ያጋሩ።

ይህ የሚያገለግለው:
• የትኬት ማረጋገጫ
• የክፍያ ማረጋገጫ
• የማስያዝ ማሳወቂያዎች

ቁጥርዎን ለማጋራት ከታች ያለውን ቁልፍ ይንኩ። 👇`,
  },

  phoneVerified: {
    EN: "✅ Phone verified! You can now book tickets.",
    AM: "✅ ስልክ ተረጋግጧል! አሁን ትኬት ማስያዝ ይችላሉ።",
  },

  invalidPhone: {
    EN: "❌ Invalid phone number format. Please use Ethiopian format (09XXXXXXXX).",
    AM: "❌ ልክ ያልሆነ የስልክ ቁጥር ቅርጸት። እባክዎን የኢትዮጵያ ቅርጸት ይጠቀሙ (09XXXXXXXX)።",
  },

  // Trip Search - Origin
  searchOrigin: {
    EN: `📍 *Where are you traveling FROM?*

Select a city or type the city name:`,
    AM: `📍 *ከየት እየተጓዙ ነው?*

ከተማ ይምረጡ ወይም የከተማውን ስም ይተይቡ:`,
  },

  // Trip Search - Destination
  searchDestination: {
    EN: `📍 *Where are you traveling TO?*

Select a city or type the city name:`,
    AM: `📍 *ወዴት እየሄዱ ነው?*

ከተማ ይምረጡ ወይም የከተማውን ስም ይተይቡ:`,
  },

  // Trip Search - Date
  searchDate: {
    EN: `📅 *When do you want to travel?*

Select a date:`,
    AM: `📅 *መቼ መጓዝ ይፈልጋሉ?*

ቀን ይምረጡ:`,
  },

  // City not found
  cityNotFound: {
    EN: "❌ City not found. Please select from the list or check spelling.",
    AM: "❌ ከተማ አልተገኘም። እባክዎን ከዝርዝሩ ይምረጡ ወይም የፊደል አጻጻፍ ያረጋግጡ።",
  },

  // Trip results
  tripsFound: {
    EN: (count: number, from: string, to: string) =>
      `🔍 *Found ${count} trip${count !== 1 ? 's' : ''}*\n📍 ${from} → ${to}\n\nSelect a trip to continue:`,
    AM: (count: number, from: string, to: string) =>
      `🔍 *${count} ጉዞ${count !== 1 ? 'ዎች' : ''} ተገኝቷል*\n📍 ${from} → ${to}\n\nለመቀጠል ጉዞ ይምረጡ:`,
  },

  noTripsFound: {
    EN: `❌ *No trips found*

No trips available for this route and date.

Would you like to:
• Try another date
• Search different route
• Contact support`,
    AM: `❌ *ምንም ጉዞ አልተገኘም*

ለዚህ መስመር እና ቀን ምንም ጉዞዎች አይገኙም።

ምን ማድረግ ይፈልጋሉ:
• ሌላ ቀን ይሞክሩ
• የተለየ መስመር ይፈልጉ
• ድጋፍ ያግኙ`,
  },

  // Trip details
  tripDetails: {
    EN: (trip: any) => `🚌 *${trip.company}*

📍 ${trip.origin} → ${trip.destination}
🕐 ${trip.time}
💺 ${trip.availableSlots} seats available
🚌 ${trip.busType}
${trip.amenities}

💰 *Price:* ${trip.price} ETB per person

Tap "Book Now" to continue! 👇`,
    AM: (trip: any) => `🚌 *${trip.company}*

📍 ${trip.origin} → ${trip.destination}
🕐 ${trip.time}
💺 ${trip.availableSlots} መቀመጫዎች አሉ
🚌 ${trip.busType}
${trip.amenities}

💰 *ዋጋ:* ${trip.price} ብር በአንድ ሰው

ለመቀጠል "አሁን አስይዝ" ይጫኑ! 👇`,
  },

  // Passenger count
  askPassengerCount: {
    EN: `👥 *How many passengers?*

Select the number of passengers (1-5):`,
    AM: `👥 *ስንት ተሳፋሪዎች?*

የተሳፋሪዎችን ቁጥር ይምረጡ (1-5):`,
  },

  // Seat preference
  askSeatPreference: {
    EN: `💺 *Seat Selection*

How would you like to choose seats?

🎯 *Auto-assign*: We'll pick the best available seats
🪑 *Choose manually*: Select your preferred seats`,
    AM: `💺 *መቀመጫ ምርጫ*

መቀመጫዎችን እንዴት መምረጥ ይፈልጋሉ?

🎯 *ራስ-ሰር መመደብ*: ምርጥ መቀመጫዎችን እንመርጣለን
🪑 *በእጅ ምረጥ*: የሚፈልጉትን መቀመጫ ይምረጡ`,
  },

  // Seat selection (manual)
  selectSeats: {
    EN: (count: number) => `🪑 *Select ${count} seat${count !== 1 ? 's' : ''}*

Tap seats to select. Tap again to deselect.

✅ Selected  🪑 Available  ❌ Occupied

Select your seats:`,
    AM: (count: number) => `🪑 *${count} መቀመጫ${count !== 1 ? 'ዎችን' : ''} ይምረጡ*

መቀመጫዎችን ለመምረጥ ይንኩ። ለማስወገድ እንደገና ይንኩ።

✅ ተመርጧል  🪑 ክፍት  ❌ ተይዞ

መቀመጫዎችዎን ይምረጡ:`,
  },

  seatSelectionComplete: {
    EN: (seats: string) => `✅ Seats selected: ${seats}`,
    AM: (seats: string) => `✅ የተመረጡ መቀመጫዎች: ${seats}`,
  },

  noSeatsAvailable: {
    EN: "❌ Not enough seats available. Please choose a different trip.",
    AM: "❌ በቂ መቀመጫዎች የሉም። እባክዎን የተለየ ጉዞ ይምረጡ።",
  },

  // Passenger details
  askPassengerName: {
    EN: (index: number, total: number) =>
      `👤 *Passenger ${index + 1} of ${total}*\n\nPlease enter passenger's *full name*:`,
    AM: (index: number, total: number) =>
      `👤 *ተሳፋሪ ${index + 1} ከ ${total}*\n\nእባክዎን የተሳፋሪውን *ሙሉ ስም* ያስገቡ:`,
  },

  askPassengerID: {
    EN: `🆔 *National ID*

Please enter passenger's national ID number:`,
    AM: `🆔 *የመታወቂያ ቁጥር*

እባክዎን የተሳፋሪውን የመታወቂያ ቁጥር ያስገቡ:`,
  },

  askPassengerPhone: {
    EN: `📱 *Phone Number*

Please enter passenger's phone number:`,
    AM: `📱 *የስልክ ቁጥር*

እባክዎን የተሳፋሪውን የስልክ ቁጥር ያስገቡ:`,
  },

  invalidName: {
    EN: "❌ Please enter a valid name (at least 2 characters).",
    AM: "❌ እባክዎን ትክክለኛ ስም ያስገቡ (ቢያንስ 2 ፊደላት)።",
  },

  invalidID: {
    EN: "❌ Please enter a valid national ID.",
    AM: "❌ እባክዎን ትክክለኛ የመታወቂያ ቁጥር ያስገቡ።",
  },

  // Booking confirmation
  confirmBooking: {
    EN: (summary: any) => `📋 *BOOKING SUMMARY*

🚌 ${summary.company}
📍 ${summary.route}
📅 ${summary.date}
🕐 ${summary.time}

👥 *Passengers (${summary.passengerCount}):*
${summary.passengers}

💰 *Payment Breakdown:*
Ticket Total: ${summary.ticketTotal} ETB
Service Charge: ${summary.commission} ETB
VAT (15%): ${summary.vat} ETB
━━━━━━━━━━━━━━━━━
*TOTAL: ${summary.total} ETB*

Ready to proceed with payment?`,
    AM: (summary: any) => `📋 *የማስያዝ ማጠቃለያ*

🚌 ${summary.company}
📍 ${summary.route}
📅 ${summary.date}
🕐 ${summary.time}

👥 *ተሳፋሪዎች (${summary.passengerCount}):*
${summary.passengers}

💰 *የክፍያ ዝርዝር:*
የትኬት ድምር: ${summary.ticketTotal} ብር
የአገልግሎት ክፍያ: ${summary.commission} ብር
ተ.እ.ታ (15%): ${summary.vat} ብር
━━━━━━━━━━━━━━━━━
*ድምር: ${summary.total} ብር*

ለመክፈል ዝግጁ ነዎት?`,
  },

  // Payment
  paymentInitiated: {
    EN: `💳 *Payment Processing*

Your TeleBirr payment has been initiated.

*Amount:* {amount} ETB

Please complete the payment on your TeleBirr app.

⏱ Payment expires in 15 minutes.`,
    AM: `💳 *ክፍያ በሂደት ላይ*

የእርስዎ TeleBirr ክፍያ ተጀምሯል።

*መጠን:* {amount} ብር

እባክዎን በእርስዎ TeleBirr መተግበሪያ ላይ ክፍያውን ያጠናቅቁ።

⏱ ክፍያው በ15 ደቂቃዎች ውስጥ ያልቃል።`,
  },

  paymentSuccess: {
    EN: `✅ *PAYMENT SUCCESSFUL!*

Your booking is confirmed!

🎫 Your tickets have been generated.
📧 Confirmation sent to your phone.

Downloading tickets... 📥`,
    AM: `✅ *ክፍያ ተሳክቷል!*

የእርስዎ ማስያዝ ተረጋግጧል!

🎫 ትኬቶችዎ ተፈጥረዋል።
📧 ማረጋገጫ ወደ ስልክዎ ተልኳል።

ትኬቶች በማውረድ ላይ... 📥`,
  },

  paymentFailed: {
    EN: `❌ *Payment Failed*

Your payment could not be processed.

Reason: {reason}

Would you like to:
• Retry payment
• Cancel booking
• Contact support`,
    AM: `❌ *ክፍያ አልተሳካም*

የእርስዎ ክፍያ ሊከናወን አልቻለም።

ምክንያት: {reason}

ምን ማድረግ ይፈልጋሉ:
• ክፍያውን እንደገና ይሞክሩ
• ማስያዝን ይሰርዙ
• ድጋፍ ያግኙ`,
  },

  paymentTimeout: {
    EN: `⏱ *Payment Timeout*

Your payment window has expired.

The booking has been cancelled and seats released.

Start a new booking: /book`,
    AM: `⏱ *የክፍያ ጊዜ አብቋል*

የእርስዎ የክፍያ ጊዜ አልቋል።

ማስያዙ ተሰርዟል እና መቀመጫዎች ተለቀዋል።

አዲስ ማስያዝ ይጀምሩ: /book`,
  },

  // My Tickets
  myTickets: {
    EN: (count: number) =>
      count > 0
        ? `🎫 *Your Tickets (${count})*\n\nSelect a booking to view tickets:`
        : `🎫 *Your Tickets*\n\nYou don't have any bookings yet.\n\nBook your first trip: /book`,
    AM: (count: number) =>
      count > 0
        ? `🎫 *የእርስዎ ትኬቶች (${count})*\n\nትኬቶችን ለማየት ማስያዝ ይምረጡ:`
        : `🎫 *የእርስዎ ትኬቶች*\n\nእስካሁን ምንም ማስያዝ የለዎትም።\n\nመጀመሪያ ጉዞዎን ያስይዙ: /book`,
  },

  ticketDetails: {
    EN: (booking: any) => `🎫 *Ticket Details*

Booking ID: ${booking.id}
Status: ${booking.status}

🚌 ${booking.company}
📍 ${booking.route}
📅 ${booking.date}
🕐 ${booking.time}

👥 Passengers: ${booking.passengerCount}
💺 Seats: ${booking.seats}

💰 Total Paid: ${booking.amount} ETB

Downloading QR codes... 📥`,
    AM: (booking: any) => `🎫 *የትኬት ዝርዝሮች*

የማስያዝ መለያ: ${booking.id}
ሁኔታ: ${booking.status}

🚌 ${booking.company}
📍 ${booking.route}
📅 ${booking.date}
🕐 ${booking.time}

👥 ተሳፋሪዎች: ${booking.passengerCount}
💺 መቀመጫዎች: ${booking.seats}

💰 የተከፈለ ድምር: ${booking.amount} ብር

QR ኮዶች በማውረድ ላይ... 📥`,
  },

  // Help
  help: {
    EN: `❓ *i-Ticket Help*

*Commands:*
/book - Search and book tickets
/mytickets - View your bookings
/cancel - Cancel current action
/help - Show this help message

*Booking Process:*
1️⃣ Select origin and destination cities
2️⃣ Choose travel date
3️⃣ Select a trip
4️⃣ Choose number of passengers
5️⃣ Select seats (auto or manual)
6️⃣ Enter passenger details
7️⃣ Confirm and pay via TeleBirr
8️⃣ Receive QR code tickets

*Need more help?*
📧 Email: support@i-ticket.et
📱 Phone: +251 911 223 344
🌐 Website: https://i-ticket.et

*Business Hours:*
Mon-Sun: 6:00 AM - 10:00 PM EAT`,
    AM: `❓ *አይ-ቲኬት እገዛ*

*ትዕዛዞች:*
/book - ትኬት ፈልግ እና አስይዝ
/mytickets - ማስያዝዎን ይመልከቱ
/cancel - የአሁኑን ድርጊት ይሰርዙ
/help - ይህን የእገዛ መልዕክት አሳይ

*የማስያዝ ሂደት:*
1️⃣ የመነሻ እና መድረሻ ከተሞችን ይምረጡ
2️⃣ የጉዞ ቀን ይምረጡ
3️⃣ ጉዞ ይምረጡ
4️⃣ የተሳፋሪዎችን ቁጥር ይምረጡ
5️⃣ መቀመጫዎችን ይምረጡ (ራስ-ሰር ወይም በእጅ)
6️⃣ የተሳፋሪ ዝርዝሮችን ያስገቡ
7️⃣ ያረጋግጡ እና በ TeleBirr ይክፈሉ
8️⃣ QR ኮድ ትኬቶችን ይቀበሉ

*ተጨማሪ እገዛ ይፈልጋሉ?*
📧 ኢሜይል: support@i-ticket.et
📱 ስልክ: +251 911 223 344
🌐 ድረ-ገጽ: https://i-ticket.et

*የስራ ሰዓት:*
ሰኞ-እሁድ: ከጥዋት 6:00 - እስከ ምሽት 10:00`,
  },

  // Cancel
  cancelled: {
    EN: "✅ Action cancelled. What would you like to do next?",
    AM: "✅ ድርጊት ተሰርዟል። ቀጥሎ ምን ማድረግ ይፈልጋሉ?",
  },

  // Session expired
  sessionExpired: {
    EN: `⏱ *Session Expired*

Your session has expired due to inactivity.

Please start over: /book`,
    AM: `⏱ *ክፍለ ጊዜ አልቋል*

ክፍለ ጊዜዎ በእንቅስቃሴ እጦት ምክንያት አልቋል።

እባክዎን እንደገና ይጀምሩ: /book`,
  },

  // Errors
  errorGeneral: {
    EN: "❌ An error occurred. Please try again or contact support.",
    AM: "❌ ስህተት ተፈጥሯል። እባክዎን እንደገና ይሞክሩ ወይም ድጋፍ ያግኙ።",
  },

  errorRateLimit: {
    EN: "⚠️ Too many requests. Please wait a moment and try again.",
    AM: "⚠️ ብዙ ጥያቄዎች። እባክዎን ትንሽ ይጠብቁ እና እንደገና ይሞክሩ።",
  },

  // Back button
  backButton: {
    EN: "◀️ Back",
    AM: "◀️ ወደ ኋላ",
  },

  cancelButton: {
    EN: "❌ Cancel",
    AM: "❌ ሰርዝ",
  },

  continueButton: {
    EN: "➡️ Continue",
    AM: "➡️ ቀጥል",
  },

  confirmButton: {
    EN: "✅ Confirm",
    AM: "✅ አረጋግጥ",
  },

  // Inline button labels
  bookNowButton: {
    EN: "📝 Book Now",
    AM: "📝 አሁን አስይዝ",
  },

  viewTicketsButton: {
    EN: "🎫 View Tickets",
    AM: "🎫 ትኬቶችን ይመልከቱ",
  },

  retryPaymentButton: {
    EN: "💳 Retry Payment",
    AM: "💳 ክፍያውን እንደገና ይሞክሩ",
  },

  contactSupportButton: {
    EN: "📞 Contact Support",
    AM: "📞 ድጋፍ ያግኙ",
  },

  sharePhoneButton: {
    EN: "📱 Share Phone Number",
    AM: "📱 የስልክ ቁጥር ያጋሩ",
  },

  autoAssignButton: {
    EN: "🎯 Auto-assign",
    AM: "🎯 ራስ-ሰር መመደብ",
  },

  manualSelectButton: {
    EN: "🪑 Choose Seats",
    AM: "🪑 መቀመጫ ምረጥ",
  },

  todayButton: {
    EN: "📅 Today",
    AM: "📅 ዛሬ",
  },

  tomorrowButton: {
    EN: "📅 Tomorrow",
    AM: "📅 ነገ",
  },

  pickDateButton: {
    EN: "📅 Pick Date",
    AM: "📅 ቀን ምረጥ",
  },

  // FAQ & Support
  faq: {
    EN: `❓ *Frequently Asked Questions*

*Q: How do I pay for tickets?*
A: We accept TeleBirr payments. After confirming your booking, you'll receive a payment link.

*Q: Can I cancel my booking?*
A: Cancellations must be made at least 2 hours before departure. Contact support for refunds.

*Q: What if I don't have a national ID?*
A: You can use your passport number or driver's license.

*Q: How do I board the bus?*
A: Show your QR code ticket to the conductor when boarding.

*Q: Can I book for others?*
A: Yes! You can add up to 5 passengers per booking.

More questions? /help`,
    AM: `❓ *በተደጋጋሚ የሚጠየቁ ጥያቄዎች*

*ጥ: ትኬቶችን እንዴት መክፈል እችላለሁ?*
መ: TeleBirr ክፍያዎችን እንቀበላለን። ማስያዝዎን ካረጋገጡ በኋላ የክፍያ አገናኝ ይቀበላሉ።

*ጥ: ማስያዝን መሰረዝ እችላለሁ?*
መ: ስረዛዎች ከመነሳቱ ቢያንስ 2 ሰዓት በፊት መደረግ አለባቸው። ለተመላሽ ገንዘብ ድጋፍን ያግኙ።

*ጥ: የመታወቂያ ካርድ ከሌለኝ?*
መ: የፓስፖርት ቁጥርዎን ወይም የመንጃ ፍቃድዎን መጠቀም ይችላሉ።

*ጥ: አውቶቡሱን እንዴት እወጣለሁ?*
መ: ሲጓዙ QR ኮድ ትኬትዎን ለኮንዳክተሩ ያሳዩ።

*ጥ: ለሌሎች ማስያዝ እችላለሁ?*
መ: አዎ! በአንድ ማስያዝ እስከ 5 ተሳፋሪዎች መጨመር ይችላሉ።

ተጨማሪ ጥያቄዎች? /help`,
  },
} as const;

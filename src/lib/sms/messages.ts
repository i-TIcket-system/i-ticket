/**
 * Bilingual SMS Message Templates
 *
 * Supports English (EN) and Amharic (AM) messages for the SMS bot
 * All messages are designed to fit within SMS character limits
 */

export type Language = 'EN' | 'AM';

/**
 * Message template type - can be a string or a function that returns a string
 */
type MessageTemplate = string | ((...args: any[]) => string);

/**
 * All message templates organized by category
 */
interface MessageTemplates {
  [key: string]: {
    EN: MessageTemplate;
    AM: MessageTemplate;
  };
}

/**
 * Format date for display in SMS
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * Format time (e.g., "9:00 AM")
 */
function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * All message templates
 */
export const MESSAGES: MessageTemplates = {
  // Welcome & Help Messages
  welcome: {
    EN: "Welcome to i-Ticket! 🚌\nBook bus tickets via SMS.\n\nCommands:\nBOOK - Search trips\nCHECK [code] - Verify ticket\nHELP - Show commands\n\nExample:\nBOOK ADDIS HAWASSA JAN15",
    AM: "እንኳን ወደ አይ-ቲኬት በደህና መጡ! 🚌\nበኤስኤምኤስ ትኬት ይያዙ።\n\nትዕዛዞች:\nመጽሐፍ - ጉዞ ማረጋገጥ\nማረጋገጫ [ኮድ] - ትኬት መመርመር\nእርዳታ - ትዕዛዞች\n\nምሳሌ:\nመጽሐፍ አዲስ ሀዋሳ ጃን15"
  },

  help: {
    EN: "i-TICKET SMS HELP\n\nCommands:\nBOOK [from] [to] [date]\n  Example: BOOK ADDIS HAWASSA JAN15\n\nCHECK [code]\n  Example: CHECK ABC123\n\nSTATUS - Your bookings\nCANCEL - Exit session\n\nSupport: 0911550001",
    AM: "የአይ-ቲኬት ኤስኤምኤስ እገዛ\n\nትዕዛዞች:\nመጽሐፍ [ከ] [ወደ] [ቀን]\n  ምሳሌ: መጽሐፍ አዲስ ሀዋሳ ጃን15\n\nማረጋገጫ [ኮድ]\n  ምሳሌ: ማረጋገጫ ABC123\n\nሁኔታ - የእርስዎ ቦታዎች\nሰርዝ - ውጣ\n\nድጋፍ: 0911550001"
  },

  // Search & Trip Selection
  searchResults: {
    EN: (origin: string, dest: string, date: string, trips: any[]) => {
      const header = `Trips ${origin}→${dest} ${date}:\n`;
      const tripList = trips.map((t, i) =>
        `${i+1}.${t.company.name} ${formatTime(t.departureTime)} ${t.price}ETB ${t.availableSlots}seats`
      ).join('\n');
      return header + tripList + '\n\nReply trip number (1-' + trips.length + ')';
    },
    AM: (origin: string, dest: string, date: string, trips: any[]) => {
      const header = `ጉዞዎች ${origin}→${dest} ${date}:\n`;
      const tripList = trips.map((t, i) =>
        `${i+1}.${t.company.name} ${formatTime(t.departureTime)} ${t.price}ብር ${t.availableSlots}ቦታ`
      ).join('\n');
      return header + tripList + '\n\nየጉዞ ቁጥር ይምረጡ (1-' + trips.length + ')';
    }
  },

  noTripsFound: {
    EN: (origin: string, dest: string, date: string) =>
      `No trips found for ${origin}→${dest} on ${date}\n\nTry:\n- Different date (TOMORROW, JAN20)\n- Nearby cities\n\nSearch again: BOOK [from] [to] [date]`,
    AM: (origin: string, dest: string, date: string) =>
      `${origin}→${dest} ${date} ላይ ጉዞ አልተገኘም\n\nይሞክሩ:\n- ሌላ ቀን (ነገ, ጃን20)\n- ቅርብ ከተሞች\n\nእንደገና ይፈልጉ: መጽሐፍ [ከ] [ወደ] [ቀን]`
  },

  tripSelected: {
    EN: (company: string, time: string, origin: string, dest: string, price: number, fee: number) =>
      `${company} ${time}\n${origin}→${dest}\nPrice: ${price}ETB + ${fee.toFixed(2)} fee = ${(price + fee).toFixed(2)}ETB\n\nHow many passengers?\n(Max 5 per booking)`,
    AM: (company: string, time: string, origin: string, dest: string, price: number, fee: number) =>
      `${company} ${time}\n${origin}→${dest}\nዋጋ: ${price}ብር + ${fee.toFixed(2)} ክፍያ = ${(price + fee).toFixed(2)}ብር\n\nስንት ተሳፋሪዎች?\n(ከ 1-5 ድረስ)`
  },

  // Passenger Information Collection
  askPassengerCount: {
    EN: "How many passengers?\nReply: 1, 2, 3, 4, or 5",
    AM: "ስንት ተሳፋሪዎች?\nይመልሱ: 1, 2, 3, 4, ወይም 5"
  },

  askPassengerName: {
    EN: (index: number, total: number) =>
      total > 1 ? `Passenger ${index}/${total} name?` : `Passenger name?`,
    AM: (index: number, total: number) =>
      total > 1 ? `ተሳፋሪ ${index}/${total} ስም?` : `የተሳፋሪ ስም?`
  },

  askPassengerId: {
    EN: (index: number, total: number) =>
      `Passenger ${index}/${total} ID?\n(National ID or Kebele ID)`,
    AM: (index: number, total: number) =>
      `ተሳፋሪ ${index}/${total} መታወቂያ?\n(የመታወቂያ ቁጥር ወይም የቀበሌ መታወቂያ)`
  },

  // Booking Confirmation
  bookingSummary: {
    EN: (trip: any, passengers: any[], totalPrice: number) => {
      const passengerList = passengers.map((p, i) => `${i+1}. ${p.name} (${p.id})`).join('\n');
      return `BOOKING SUMMARY\n${trip.origin}→${trip.destination}\nTime: ${formatTime(trip.departureTime)}\nBus: ${trip.company}\n\nPassengers:\n${passengerList}\n\nTotal: ${totalPrice.toFixed(2)} ETB\n\nReply YES to confirm\nReply NO to cancel`;
    },
    AM: (trip: any, passengers: any[], totalPrice: number) => {
      const passengerList = passengers.map((p, i) => `${i+1}. ${p.name} (${p.id})`).join('\n');
      return `የቦታ ማረጋገጫ\n${trip.origin}→${trip.destination}\nሰዓት: ${formatTime(trip.departureTime)}\nበስ: ${trip.company}\n\nተሳፋሪዎች:\n${passengerList}\n\nጠቅላላ: ${totalPrice.toFixed(2)} ብር\n\nለማረጋገጥ አዎ ይበሉ\nለመሰረዝ አይ ይበሉ`;
    }
  },

  bookingConfirmed: {
    EN: (bookingId: string, seats: number[]) =>
      `Booking confirmed!\nID: ${bookingId}\nSeat${seats.length > 1 ? 's' : ''}: ${seats.join(', ')}\n\nPayment request sent to your phone.\nEnter TeleBirr password to pay.\n\nWaiting for payment...`,
    AM: (bookingId: string, seats: number[]) =>
      `ቦታ ተይዟል!\nመታወቂያ: ${bookingId}\nወንበር: ${seats.join(', ')}\n\nየክፍያ ጥያቄ ወደ ስልክዎ ተልኳል።\nየቴሌብር የይለፍ ቃል ያስገቡ።\n\nክፍያ በመጠበቅ ላይ...`
  },

  // Payment Messages
  paymentSuccess: {
    EN: (amount: number, tickets: any[], trip: any) => {
      const ticketList = tickets.map(t =>
        `Code: ${t.shortCode}\nSeat: ${t.seatNumber}\nName: ${t.passengerName}`
      ).join('\n---\n');

      return `PAYMENT RECEIVED! ${amount.toFixed(2)} ETB\n\nYOUR TICKET${tickets.length > 1 ? 'S' : ''}\n${ticketList}\n\nTrip: ${trip.origin}→${trip.destination}\nDate: ${formatDate(trip.departureTime)}\nBus: ${trip.company}\n\nShow codes to conductor.\ni-Ticket`;
    },
    AM: (amount: number, tickets: any[], trip: any) => {
      const ticketList = tickets.map(t =>
        `ኮድ: ${t.shortCode}\nወንበር: ${t.seatNumber}\nስም: ${t.passengerName}`
      ).join('\n---\n');

      return `ክፍያ ደርሷል! ${amount.toFixed(2)} ብር\n\nየእርስዎ ትኬት${tickets.length > 1 ? 'ቶች' : ''}\n${ticketList}\n\nጉዞ: ${trip.origin}→${trip.destination}\nቀን: ${formatDate(trip.departureTime)}\nበስ: ${trip.company}\n\nኮዶችን ለማስተናገድ ያሳዩ።\nአይ-ቲኬት`;
    }
  },

  paymentTimeout: {
    EN: (bookingId: string) =>
      `Payment timed out.\nBooking ${bookingId} cancelled.\n\nTo rebook:\nBOOK [from] [to] [date]`,
    AM: (bookingId: string) =>
      `የክፍያ ጊዜ አልፏል።\nቦታ ${bookingId} ተሰርዟል።\n\nእንደገና ለማስያዝ:\nመጽሐፍ [ከ] [ወደ] [ቀን]`
  },

  paymentFailed: {
    EN: "Payment failed.\nPlease try again or contact support: 0911550001",
    AM: "ክፍያ አልተሳካም።\nእባክዎን እንደገና ይሞክሩ ወይም ድጋፍ ያግኙ: 0911550001"
  },

  // Ticket Verification
  ticketValid: {
    EN: (ticket: any, trip: any) =>
      `TICKET VALID ✓\nCode: ${ticket.shortCode}\nSeat: ${ticket.seatNumber}\nName: ${ticket.passengerName}\n\nTrip: ${trip.origin}→${trip.destination}\nDate: ${formatDate(trip.departureTime)}\nBus: ${trip.company.name}\n\nStatus: Not Used\n\nSafe travels!`,
    AM: (ticket: any, trip: any) =>
      `ትኬት ትክክል ነው ✓\nኮድ: ${ticket.shortCode}\nወንበር: ${ticket.seatNumber}\nስም: ${ticket.passengerName}\n\nጉዞ: ${trip.origin}→${trip.destination}\nቀን: ${formatDate(trip.departureTime)}\nበስ: ${trip.company.name}\n\nሁኔታ: ጥቅም ላይ አልዋለም\n\nደህና ይሂዱ!`
  },

  ticketAlreadyUsed: {
    EN: (ticket: any) =>
      `TICKET ALREADY USED ✗\nCode: ${ticket.shortCode}\nUsed: ${formatDate(ticket.usedAt)}\n\nContact company if error:\n${ticket.trip.company.phones[0]}`,
    AM: (ticket: any) =>
      `ትኬት ጥቅም ላይ ውሏል ✗\nኮድ: ${ticket.shortCode}\nጥቅም ላይ የዋለው: ${formatDate(ticket.usedAt)}\n\nስህተት ከሆነ ኩባንያውን ያነጋግሩ:\n${ticket.trip.company.phones[0]}`
  },

  ticketNotFound: {
    EN: (code: string) =>
      `TICKET NOT FOUND\nCode: ${code}\n\nCheck code and try again.\nFormat: 6 characters (ABC123)\n\nNeed help? Reply HELP`,
    AM: (code: string) =>
      `ትኬት አልተገኘም\nኮድ: ${code}\n\nኮዱን ያረጋግጡ እና እንደገና ይሞክሩ።\nቅርጸት: 6 ቁምፊዎች (ABC123)\n\nእገዛ ይፈልጋሉ? እርዳታ ይላኩ`
  },

  // Error Messages
  invalidCommand: {
    EN: (command: string) =>
      `Unknown command: ${command}\n\nTry:\nBOOK ADDIS HAWASSA JAN15\nCHECK ABC123\nHELP\n\nFor assistance: 0911550001`,
    AM: (command: string) =>
      `ያልታወቀ ትዕዛዝ: ${command}\n\nይሞክሩ:\nመጽሐፍ አዲስ ሀዋሳ ጃን15\nማረጋገጫ ABC123\nእርዳታ\n\nለእገዛ: 0911550001`
  },

  invalidInput: {
    EN: "Invalid input.\nPlease try again or type HELP for assistance.",
    AM: "ትክክል ያልሆነ ምላሽ።\nእባክዎን እንደገና ይሞክሩ ወይም እርዳታ ይላኩ።"
  },

  sessionExpired: {
    EN: "Session expired.\nSend BOOK to start again.",
    AM: "ጊዜው አልፏል።\nመጽሐፍ በመላክ እንደገና ይጀምሩ።"
  },

  tripSoldOut: {
    EN: "Sorry, this trip is sold out.\nPlease select another trip or search again.",
    AM: "ይቅርታ፣ ይህ ጉዞ ተሽጧል።\nእባክዎን ሌላ ጉዞ ይምረጡ ወይም እንደገና ይፈልጉ።"
  },

  bookingHalted: {
    EN: "Booking is halted for this trip.\nPlease try another trip or contact company.",
    AM: "ለዚህ ጉዞ ቦታ ማስያዝ ቆሟል።\nእባክዎን ሌላ ጉዞ ይሞክሩ ወይም ኩባንያውን ያነጋግሩ።"
  },

  systemError: {
    EN: "System error. Please try again.\nIf problem persists, call: 0911550001",
    AM: "የስርዓት ስህተት። እባክዎን እንደገና ይሞክሩ።\nችግሩ ከቀጠለ፣ ይደውሉ: 0911550001"
  }
};

/**
 * Get translated message
 *
 * @param key - Message key from MESSAGES object
 * @param language - Language code (EN or AM)
 * @param args - Arguments to pass to message template function
 * @returns Translated message string
 */
export function getMessage(key: string, language: Language, ...args: any[]): string {
  const template = MESSAGES[key]?.[language];

  if (!template) {
    console.error(`[SMS Messages] Message not found: ${key}`);
    return `Error: Message not found (${key})`;
  }

  if (typeof template === 'function') {
    return template(...args);
  }

  return template;
}

/**
 * Detect language from user message
 *
 * @param message - User's message
 * @returns Language code (EN or AM)
 */
export function detectLanguage(message: string): Language {
  // Check for Amharic Unicode characters (U+1200-U+137F)
  const amharicRegex = /[\u1200-\u137F]/;
  if (amharicRegex.test(message)) {
    return 'AM';
  }

  // Check for Amharic command keywords
  const amharicCommands = ['መጽሐፍ', 'ማረጋገጫ', 'እርዳታ', 'ሁኔታ', 'ሰርዝ'];
  const firstWord = message.trim().split(/\s+/)[0].toUpperCase();

  if (amharicCommands.some(cmd => firstWord.includes(cmd))) {
    return 'AM';
  }

  // Default to English
  return 'EN';
}

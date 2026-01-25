# i-Ticket Telegram Bot

Complete Telegram bot integration for booking Ethiopian bus tickets directly through Telegram.

## Features

- ✅ **Multi-language Support** (English & Amharic)
- ✅ **Trip Search & Booking** (Full booking flow)
- ✅ **Seat Selection** (Auto-assign or manual seat picking)
- ✅ **Phone Verification** (Guest user creation)
- ✅ **View Bookings** (Access ticket history)
- ✅ **Payment Integration** (TeleBirr - Coming Soon)
- ✅ **QR Code Tickets** (Coming Soon)

## Architecture

**Integration Type**: Webhook-based, integrated into Next.js app

**Session Storage**: Database-backed (TelegramSession model) for persistence across restarts

**Technology Stack**:
- **Framework**: Telegraf.js v4.16+
- **Database**: PostgreSQL (Prisma ORM)
- **Payment**: TeleBirr API (reuses existing implementation)

## File Structure

```
src/lib/telegram/
├── bot.ts                           # Core bot instance & router
├── messages.ts                      # Bilingual message templates
├── keyboards.ts                     # Inline keyboard layouts
├── middleware/
│   └── auth.ts                      # Authentication & session management
├── handlers/
│   └── commands.ts                  # Command handlers (/start, /book, etc.)
├── scenes/
│   └── booking-wizard.ts            # Multi-step booking flow
└── utils/
    └── formatters.ts                # Message formatting utilities

src/app/api/telegram/
└── webhook/
    └── route.ts                     # Webhook endpoint (POST/GET)

scripts/
└── telegram-setup-webhook.ts        # One-time webhook registration
```

## Database Schema

**TelegramSession Model**:
- Stores user session state and booking flow data
- Links to User model for authenticated users
- Auto-expires after 30 minutes of inactivity
- Persists across bot restarts

See `prisma/schema.prisma` for full schema.

## Setup Instructions

### 1. Prerequisites

- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- i-Ticket production environment (EC2 + PostgreSQL)

### 2. Create Telegram Bot

```bash
# Chat with @BotFather on Telegram
/newbot

# Follow prompts:
# - Bot name: i-Ticket Bus Booking
# - Bot username: iticket_et_bot (or similar)

# Copy the bot token (looks like: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz)
```

### 3. Generate Webhook Secret

```bash
openssl rand -hex 32
# Save output as TELEGRAM_WEBHOOK_SECRET
```

### 4. Configure Environment Variables

Add to `.env.production`:

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN="your-bot-token-here"
TELEGRAM_BOT_ENABLED="true"
TELEGRAM_WEBHOOK_SECRET="your-webhook-secret-here"
```

### 5. Install Dependencies

```bash
npm install telegraf@^4.16.3
```

### 6. Run Database Migration

```bash
npx prisma migrate dev --name add_telegram_session
npx prisma generate
```

### 7. Deploy to Production

```bash
# SSH into EC2
ssh -i mela-shared-key.pem ubuntu@54.147.33.168

# Pull latest code
cd /var/www/i-ticket
git pull

# Install dependencies
npm ci

# Build
npm run build

# Restart PM2
pm2 restart i-ticket
```

### 8. Register Webhook

```bash
# Run webhook setup script
tsx scripts/telegram-setup-webhook.ts

# Expected output:
# ✅ Webhook set successfully!
# 🔗 Start chatting: https://t.me/iticket_et_bot
```

### 9. Test Bot

1. Open Telegram
2. Search for your bot (e.g., `@iticket_et_bot`)
3. Send `/start`
4. Follow the booking flow

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message & language selection |
| `/book` | Start booking flow |
| `/mytickets` | View booking history |
| `/help` | Show help message |
| `/cancel` | Cancel current action |

## State Machine

Bot uses a 17-state flow for booking:

```
IDLE
  ↓
SEARCH_ORIGIN (select departure city)
  ↓
SEARCH_DESTINATION (select arrival city)
  ↓
SEARCH_DATE (select travel date)
  ↓
SELECT_TRIP (choose from available trips)
  ↓
ASK_PASSENGER_COUNT (1-5 passengers)
  ↓
ASK_SEAT_PREFERENCE (auto or manual)
  ↓
[If manual] SELECT_SEATS (interactive seat map)
  ↓
ASK_PASSENGER_NAME (for each passenger)
  ↓
ASK_PASSENGER_ID (national ID)
  ↓
ASK_PASSENGER_PHONE (phone number)
  ↓
CONFIRM_BOOKING (show summary)
  ↓
WAIT_PAYMENT (TeleBirr integration)
  ↓
PAYMENT_SUCCESS (generate & send QR tickets)
  ↓
IDLE
```

## User Authentication

**Telegram → i-Ticket Mapping**:

1. **First-time user**: Bot requests phone number via contact sharing
2. **Phone verification**:
   - Exists in DB: Link TelegramSession → User
   - Not exists: Create guest User (`isGuestUser: true`)
3. **Subsequent sessions**: Lookup by Telegram chat ID

**Security**:
- Webhook requests verified with secret token
- Rate limiting: 30 commands/minute per user
- Phone validation: Ethiopian format (`09XXXXXXXX`)

## Rate Limiting

Bot-specific limits (using existing `rate-limit.ts`):

- Search trips: 20/minute
- Create booking: 3/minute
- Commands: 30/minute

## Session Management

**Lifecycle**:
- **Creation**: On first message from user
- **Update**: Every message extends TTL by 30 minutes
- **Expiry**: 30 minutes of inactivity
- **Cleanup**: Cron job removes expired sessions (hourly)

**Data Stored**:
- User state (current step in booking flow)
- Journey data (origin, destination, date, trip)
- Passenger details (collected during flow)
- Selected seats (if manual selection)
- Booking ID (after creation)

## Error Handling

**User Input Errors** (recoverable):
- Invalid city → Show error + retry
- No trips found → Alternative search options
- Invalid name/ID/phone → Friendly error + retry

**API Errors**:
- Trip sold out → Alternative trips
- Payment failed → Retry or contact support

**System Errors**:
- Database/network errors → Contact support ticket

## Monitoring & Logging

**Log Events**:
- Bot startup/shutdown
- Webhook requests received
- User commands executed
- Booking creations
- Payment status changes
- Errors and exceptions

**PM2 Logs**:
```bash
pm2 logs i-ticket | grep "TELEGRAM"
```

**Database Queries**:
```sql
-- Active sessions
SELECT COUNT(*) FROM "TelegramSession" WHERE "expiresAt" > NOW();

-- Bookings via Telegram (add initiatedVia field)
SELECT COUNT(*) FROM "Booking" WHERE "initiatedVia" = 'TELEGRAM';

-- Daily bot users
SELECT COUNT(DISTINCT "chatId") FROM "TelegramSession"
WHERE "createdAt" >= NOW() - INTERVAL '1 day';
```

## Troubleshooting

### Bot not responding

```bash
# Check PM2 status
pm2 status i-ticket

# Check logs
pm2 logs i-ticket --lines 100

# Restart bot
pm2 restart i-ticket
```

### Webhook not receiving updates

```bash
# Check webhook info
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Re-register webhook
tsx scripts/telegram-setup-webhook.ts
```

### Sessions not persisting

```bash
# Check database connection
npx prisma studio

# Verify TelegramSession table exists
psql -U postgres -d iticket -c "\d TelegramSession"
```

## Rollback Plan

If bot causes issues:

```bash
# 1. Disable bot
# Set TELEGRAM_BOT_ENABLED=false in ecosystem.config.js

# 2. Restart PM2
pm2 restart i-ticket

# 3. Remove webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
```

Web app continues working normally - bot is isolated.

## Development Roadmap

### Phase 1: Foundation ✅
- [x] Database schema (TelegramSession)
- [x] Basic bot instance
- [x] Phone verification
- [x] Session management
- [x] Webhook endpoint

### Phase 2: Trip Search ✅
- [x] City search (origin → destination → date)
- [x] Trip listing with inline keyboards
- [x] Trip details view

### Phase 3: Booking Flow ✅
- [x] Seat selection (auto + manual)
- [x] Passenger details collection
- [x] Booking confirmation screen

### Phase 4: Payment Integration 🚧
- [ ] TeleBirr payment link generation
- [ ] Payment status polling
- [ ] Payment webhook callback handling
- [ ] Payment timeout (15 min)

### Phase 5: Ticket Delivery 🚧
- [ ] QR code generation
- [ ] Ticket image download
- [ ] Booking history view
- [ ] Ticket detail view

### Phase 6: Enhancements 🔮
- [ ] FAQ system
- [ ] Support ticket creation
- [ ] Multi-language improvements
- [ ] Date picker (inline calendar)
- [ ] Push notifications (trip reminders)

## Contributing

When modifying bot code:

1. **Test locally** with ngrok webhook tunnel:
   ```bash
   ngrok http 3000
   # Use ngrok URL for webhook: https://abc123.ngrok.io/api/telegram/webhook
   ```

2. **Follow state machine**: Don't skip states or break flow

3. **Maintain bilingual support**: Update both EN and AM messages

4. **Error handling**: Always handle errors gracefully

5. **Log events**: Use console.log with `[Telegram ...]` prefix

## Support

**Issues**: GitHub Issues
**Email**: support@i-ticket.et
**Phone**: +251 911 223 344

---

**Version**: 1.0.0 (Initial Implementation)
**Last Updated**: January 25, 2026
**Author**: i-Ticket Development Team

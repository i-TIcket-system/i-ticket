# i-Ticket Platform

> **Version**: v2.10.11 | **Production**: https://i-ticket.et | **Changelog**: `CHANGELOG.md`
> **Rules**: `RULES.md` | **Full Backup**: `CLAUDE-FULL-BACKUP.md` | **Deploy**: `DEPLOYMENT.md`

---

## PRODUCTION (AWS EC2)

| Component | Details |
|-----------|---------|
| **Server** | AWS EC2 (t2.micro) - 54.147.33.168 |
| **Stack** | Ubuntu 22.04, Node.js 20.20.0, PM2, Nginx, PostgreSQL 16.11 |
| **SSL** | Cloudflare (Full strict) |

```bash
# Access
ssh -i mela-shared-key.pem ubuntu@54.147.33.168

# Commands
pm2 status | pm2 logs i-ticket | pm2 restart i-ticket
```

**Deploy**: `cd /var/www/i-ticket && git pull && npm ci && npm run build && pm2 restart i-ticket`

---

## ULTRA-CRITICAL BUSINESS RULES

### 1. GUEST BOOKING = FEATURE (NOT A BUG)
Phone payment IS verification - NO OTP needed. Guests can book without registration.

### 2. COMPANY SEGREGATION = ULTRA CRITICAL
Complete data isolation between bus companies. Every API MUST filter by `companyId`.
ONLY shared resource: City database.

### 3. AUTO-HALT DUAL BEHAVIOR
- **Manual ticketing**: Can ALWAYS sell to 0 seats (NEVER blocked)
- **Online booking**: Auto-halts at ≤10 seats (unless bypassed)
- Bypass: `Company.disableAutoHaltGlobally` or `Trip.autoResumeEnabled`

### 4. VIEW-ONLY TRIPS
DEPARTED, COMPLETED, CANCELLED, and **SOLD-OUT** trips are READ-ONLY. No edits allowed.
- Sold-out = `availableSlots === 0` (protects existing bookings)

---

## TECH STACK

Next.js 14 (App Router) + React 18 + TypeScript + PostgreSQL + Prisma + NextAuth.js + Tailwind/shadcn/ui

---

## KEY FEATURES

| Feature | Details |
|---------|---------|
| **Auth** | Multi-role (Customer, Company Admin, Super Admin, Staff, Sales), NextAuth.js |
| **Booking** | Real-time slots, seat selection, multi-passenger, TeleBirr (5% + 15% VAT) |
| **Trips** | CRUD, intermediate stops, mandatory staff/vehicle, status lifecycle |
| **Fleet** | AI risk scoring, maintenance schedules, work orders, inspections |
| **Manifests** | Auto-generate on DEPARTED + full capacity |
| **Portals** | Super Admin, Company Admin, Staff, Cashier, Mechanic, Finance, Sales |
| **Telegram Bot** | Bilingual booking via @i_ticket_busBot (see Telegram Bot section below) |

---

## DATABASE MODELS

**Core**: User, Company, Trip, TripTemplate, Booking, Passenger, Ticket, Payment, City
**Fleet**: Vehicle, MaintenanceSchedule, WorkOrder, VehicleInspection
**Comms**: TripMessage, Notification, SupportTicket, CompanyMessage
**Sales**: SalesPerson, SalesReferral, SalesCommission
**Security**: ProcessedCallback, AdminLog
**Telegram**: TelegramSession

---

## KEY API ROUTES

| Category | Routes |
|----------|--------|
| **Public** | `/api/trips`, `/api/track/[code]` |
| **Company** | `/api/company/trips`, `/api/company/trip-templates`, `/api/company/staff`, `/api/company/vehicles` |
| **Admin** | `/api/admin/stats`, `/api/admin/companies`, `/api/admin/trips` |
| **Cron** | `/api/cron/cleanup`, `/api/cron/trip-reminders` |
| **Telegram** | `/api/telegram/webhook` (bot updates) |

---

## FRONTEND ROUTES

- `/(auth)` - Login, Register
- `/(customer)` - Search, Booking, Tickets
- `/(company)` - Dashboard, Trips, Staff, Vehicles
- `/(admin)` - Dashboard, Companies, Trips, Manifests
- `/(staff|cashier|mechanic|finance|sales)` - Role portals

---

## TEST LOGINS

| Role | Phone | Password |
|------|-------|----------|
| Super Admin | 0911223344 | demo123 |
| Selam Bus Admin | 0922345678 | demo123 |
| Customer | 0912345678 | demo123 |

---

## SECURITY

- Zod validation, rate limiting, payment replay protection
- Row-level locking, transaction timeouts (10s)
- parseInt validation (rejects scientific notation)
- bcrypt passwords, 30-day sessions

---

## TELEGRAM BOT (@i_ticket_busBot)

### Overview
Bilingual (English/Amharic) Telegram bot for bus ticket booking. Users can search trips, select seats, and pay via TeleBirr directly through Telegram.

**Bot URL**: https://t.me/i_ticket_busBot
**QR Codes**: `/public/telegram-bot-qr.png`, `/public/telegram-bot-qr.svg`

### Commands
| Command | Description |
|---------|-------------|
| `/start` | Welcome + language selection |
| `/book` | Start booking flow |
| `/mytickets` | View booked tickets |
| `/help` | Show help message |
| `/cancel` | Cancel current operation |

### Key Files
```
src/lib/telegram/
├── bot.ts                    # Main bot instance, handler registration
├── messages.ts               # Bilingual message templates
├── keyboards.ts              # Inline keyboard builders
├── middleware/
│   └── auth.ts               # Session management, phone verification
├── handlers/
│   ├── commands.ts           # Command handlers (/start, /book, etc.)
│   ├── payment.ts            # Payment processing, SMS sending
│   └── tickets.ts            # Ticket viewing with QR codes
├── scenes/
│   └── booking-wizard.ts     # Multi-step booking flow
└── utils/
    └── formatters.ts         # Currency, date, route formatting
```

### Booking Flow
1. **Language Selection** → EN/AM
2. **Phone Verification** → Links to User account
3. **Origin City** → Button selection or text search (fuzzy matching)
4. **Destination City** → Same as origin
5. **Travel Date** → Today, Tomorrow, or date picker
6. **Trip Selection** → Shows available trips with prices
7. **Passenger Count** → 1-5 passengers
8. **Seat Selection** → Auto-assign or manual selection
9. **Passenger Details** → Name, ID, Phone for each passenger
10. **Payment** → Demo mode or TeleBirr
11. **Confirmation** → Tickets via Telegram + SMS

### Features
- **Fuzzy City Search**: Levenshtein distance for typo tolerance
- **Seat Map**: Visual seat selection with availability
- **Multi-passenger**: Up to 5 passengers per booking
- **SMS Confirmation**: Tickets sent via SMS with shortcodes
- **QR Tickets**: Each ticket has QR code for verification
- **Session Persistence**: 30-minute session timeout

### Environment Variables
```bash
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_BOT_ENABLED=true
DEMO_MODE=true  # Set to false for real TeleBirr payments
```

### Webhook Setup
```bash
# Set webhook (production)
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://i-ticket.et/api/telegram/webhook"

# Check webhook status
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

### Database Model
```prisma
model TelegramSession {
  id        String   @id @default(cuid())
  chatId    BigInt   @unique
  phone     String?
  userId    String?
  language  String   @default("EN")
  state     String   @default("IDLE")
  data      Json?
  expiresAt DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### TODO (Next Session)
- [x] ~~Send tickets to passenger's Telegram if they have an account (in addition to SMS)~~ DONE
- [ ] Phase 2: Predictive Maintenance AI features

---

## RECENT UPDATES (v2.10.11)

**Latest**: WO-Vehicle Health Sync & Sold-Out Trip Protection (2 Issues)
- Fixed parallel API calls for work order status filtering
- Sold-out trips (`availableSlots === 0`) are now view-only

**Full changelog**: See `CHANGELOG.md`

---

## CRITICAL BUG FIXES (Reference)

| Bug | Fix |
|-----|-----|
| API multi-value query params (v2.10.11) | Don't send CSV (`status=OPEN,IN_PROGRESS`) - make parallel API calls and combine results instead |
| Date comparison timezone (v2.10.8) | Use `isTodayEthiopia()` and `isSameDayEthiopia()` instead of `toDateString()` - JS dates compare in browser timezone, not Ethiopia |
| Stale closure in polling (v2.10.7) | Use `useRef` to access current state in `setInterval` callbacks - state captured at setup time becomes stale |
| Zod validation null vs undefined (v2.10.5) | Use `.nullish()` not `.optional()` for searchParams - `searchParams.get()` returns `null`, not `undefined` |
| Telegram duration (v2.9.0) | `formatDuration()` now expects minutes (DB stores minutes, not hours) |
| Telegram timezone (v2.8.2) | Use `Intl.DateTimeFormat` with `timeZone: "Africa/Addis_Ababa"` in formatters.ts |
| Staff API role filter | Use `role: "COMPANY_ADMIN"` + `staffRole` filter |
| Auto-halt re-trigger | `adminResumedFromAutoHalt` flag |
| Commission VAT | 106 ETB = 100 ticket + 5 commission + 1 VAT |
| Race conditions | DB-level locking with `SELECT FOR UPDATE NOWAIT` |

---

## BUILD ERROR: useSearchParams() CSR Bailout

**Error**: `useSearchParams() should be wrapped in a suspense boundary`

**Symptom**: Build shows 140/140 pages generated but fails with:
```
> Export encountered errors on following paths:
    /login/page: /login
    /page: /
    /register/page: /register
```
PM2 shows `errored` status with `ENOENT: prerender-manifest.json`

**Root Cause**: Client components (`"use client"`) using `useSearchParams()` without Suspense boundary causes static generation to fail. The `prerender-manifest.json` is not created.

**Solution** (Jan 24, 2026): Add to `next.config.js`:
```javascript
experimental: {
  missingSuspenseWithCSRBailout: false,
},
```

This suppresses the error for client components using useSearchParams without requiring Suspense boundaries.

**Alternative Solutions** (not used):
1. Wrap useSearchParams in Suspense boundary
2. Add `export const dynamic = 'force-dynamic'` to each page (doesn't work in client components)
3. Convert pages to server components with client child components

---

## MANDATORY WORKFLOW

Before ANY code change:
1. Read `RULES.md` appendices (File-to-Rule mapping)
2. Check Bug Registry
3. Implement with compliance
4. Document if needed

---

**Full changelog**: See `CHANGELOG.md` | **Historical details**: See `CLAUDE-FULL-BACKUP.md`

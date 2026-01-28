# i-Ticket Platform

> **Version**: v2.10.3 | **Production**: https://i-ticket.et | **Full Docs**: `CLAUDE-FULL-BACKUP.md`
> **Rules**: `RULES.md` | **Stable Reference**: `CLAUDE-STABLE-REFERENCE.md` | **Deploy**: `DEPLOYMENT.md`

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
DEPARTED, COMPLETED, CANCELLED trips are READ-ONLY. No edits, no ticket sales.

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

## RECENT UPDATES (v2.10.3 - Jan 28, 2026)

### Work Order System Enhancements & UI Polish

1. **CRITICAL: Fixed Mechanic Work Order Query Bug** - Mechanics can now see ALL assigned work orders. Fixed JSON array query bug in `assignedStaffIds` field by implementing client-side filtering instead of broken `.contains()` query. Updated both list and detail API endpoints.

2. **Parts Request Workflow for Mechanics** - New feature allowing mechanics to request parts for work orders:
   - Created `POST /api/mechanic/work-orders/{id}/parts` endpoint
   - New `RequestPartDialog` component with validation
   - Added database fields: `status`, `notes`, `requestedBy`, `requestedAt`, `approvedBy`, `approvedAt` to `WorkOrderPart` model
   - Automatic notifications to company admins when parts are requested
   - Status badges: REQUESTED, APPROVED, ORDERED, REJECTED

3. **Fixed Notification Routing** - Added work order existence check before routing. Prevents 404 errors when clicking notifications for deleted work orders. Shows user-friendly error: "This work order no longer exists"

4. **Homepage Popular Routes Contrast** - Improved text visibility with white text, drop shadows, and semi-transparent backgrounds for better readability on glass backgrounds.

5. **Fixed Bus Type Visibility** - Bus type badges in search results and booking page changed from white-on-white to `bg-primary/10 border-primary/30 text-primary` for clear visibility.

6. **Simplified Seat Selection** - Replaced three-color scheme with two-state design:
   - Vacant seats: Clean white box with seat number
   - Occupied seats: Gray box with red X mark
   - Selected seats show blue border
   - Updated legend to show only "Vacant" and "Occupied"

7. **UI Polish**:
   - Footer now shows ONLY Telegram bot link (@i_ticket_busBot)
   - Company logo upload component handles failed image loads gracefully
   - Audit log action badges now clearly visible with `!text-white` and `border-0`

8. **Documentation** - Created comprehensive `DEPLOYMENT.md` with step-by-step deployment workflow

### Files Modified
- 13 files modified + 4 new files created
- Database migration: `add_work_order_part_status`

### Previous (v2.10.2 - Jan 28, 2026)

### Work Order System Fixes (CRITICAL)

1. **Mechanic API Dual Assignment Support** - Fixed mechanic work order query to support both `assignedToId` (legacy) and `assignedStaffIds` (new multi-staff) using OR conditions. Mechanics can now see ALL work orders assigned to them.
2. **Multi-Staff Notifications** - Work order creation now sends assignment notifications to ALL assigned staff members (loops through array) instead of just first mechanic. Fixes silent assignment failures.
3. **Notification Stakeholders Parser** - Updated `notifyWorkOrderStakeholders()` to parse `assignedStaffIds` JSON array and add all staff to recipient list.
4. **Work Order Routing** - Added notification routing for work order types (CREATED, ASSIGNED, URGENT, COMPLETED, BLOCKED). Routes mechanics to `/mechanic/work-order/{id}`, company admins to `/company/work-orders/{id}`, finance to `/finance/work-orders`.

### UI/UX Fixes

5. **Company Logo Upload Refresh** - Logo now displays immediately after upload without manual page refresh. Added `router.refresh()` call after `updateSession()`.
6. **Conductor Verify Ticket Page** - Created `/staff/verify` page for conductors to verify tickets. Features: Manual 6-character code input, real-time validation via `/api/tickets/verify/public`, large visual feedback (green success/red error), passenger details display, reset button.
7. **Staff Profile Role Display** - Profile page now shows actual staff role (Driver, Conductor, Mechanic, etc.) instead of generic "COMPANY_ADMIN". Uses `staffRole` field with helper formatter.

### Telegram Bot Improvements

8. **Thank You Message** - Added appreciation message after successful booking payment: "Thank you for choosing us!" / "እኛን ስለመረጡ እናመሰግናለን!"
9. **Amharic Translation Corrections**:
   - "Free seats" → "ነጻ መቀመጫዎች አሉ!" (added "ነጻ" + "!" for clarity)
   - "Number of passengers" → "የተሳፋሪዎችን ብዛት" (changed "ቁጥር" to "ብዛት" for natural phrasing)
   - Updated in 4 locations: messages.ts (3x), formatters.ts (1x)

### Favicon & Branding

10. **Professional Favicon Integration** - Added 7 favicon files from RealFaviconGenerator:
    - `favicon.svg` (vector, scalable)
    - `favicon-96x96.png` (high-res PNG)
    - `favicon.ico` (multi-resolution ICO)
    - `apple-touch-icon.png` (180x180, iOS)
    - `web-app-manifest-192x192.png` (maskable PWA icon)
    - `web-app-manifest-512x512.png` (maskable PWA icon)
    - Updated `layout.tsx` metadata and `manifest.json` to reference new icons

### Files Modified
- 13 files modified (10 issues fixed, 1 new file created)
- New file: `src/app/staff/verify/page.tsx`

### Previous (v2.10.1 - Jan 27, 2026)

### Critical Bug Fixes

1. **RULE-003: View-Only Trip Protection** - Fixed bulk price update bypass. DEPARTED, COMPLETED, CANCELLED, and past trips now properly blocked from all modifications (bulk operations, edit page, API). Greyed out rows in dashboard/trips list with disabled Edit button.
2. **RULE-007: Company Revenue Calculation** - Trip details now shows correct company revenue (totalAmount - commission - commissionVAT) instead of customer total. Fixed in trip details page and manifest generator.
3. **Work Orders API** - Added missing fields (assignedToName, totalCost, createdAt, completionNotes, mechanicSignature) to GET response.
4. **Telegram Bot Passenger Prompt** - Fixed wrong passenger number display. Now correctly shows "Passenger 2 of 2" instead of "Passenger 1 of 2" by syncing in-memory session after DB update.
5. **Badge Colors** - Updated 8 files with high-contrast colors (bg-*-600 text-white) for better readability. Affected: staff, vehicles, audit-logs, profile, work-orders, mechanic, finance pages.
6. **Template Search UX** - Search input now integrated inside dropdown for intuitive filtering.

### Previous (v2.10.0 - Jan 26, 2026)

1. **Smart Column Auto-Detect (Excel Import)** - Upload any Excel/CSV file with your own column names. System auto-detects common variations like "From"→origin, "Date"→departureDate. Supports English and Amharic column names. Manual mapper UI for unrecognized columns.
2. **Trip Creation Form Reordering** - New logical field order: Route → Date/Time → Batch → Vehicle → Bus Type/Seats → Staff → Duration/Distance → Price → Amenities. Duration now in hours (not minutes).
3. **Column Mapper Component** - Visual UI for mapping columns with confidence indicators, sample data preview, and required field validation.

### Previous (v2.9.0 - Jan 26, 2026)

1. **Trip Templates** - Save and load route templates for quick trip creation. Templates store origin, destination, duration, distance, price, bus type, and amenities.
2. **CRITICAL: Telegram Duration Bug Fix** - Bot now correctly displays trip duration (was showing "540 ሰዓት" instead of "9h"). Fixed formatDuration to expect minutes.
3. **ID Optional for Booking** - National ID is now optional for both Telegram bot and web booking. Message: "You'll need to show ID matching your name when boarding."
4. **Telegram UX Improvements** - Clearer phone keyboard prompt, /mytickets hint after payment, individual ticket codes shown for each passenger.
5. **Navbar Guest Display** - Customers without names now show phone number in navbar instead of blank.

### Previous (v2.8.2 - Jan 26, 2026)

1. **CRITICAL: Telegram Timezone Fix** - Bot now displays dates/times in Ethiopia Time (EAT = UTC+3) instead of UTC. Trip times now match PWA exactly.
2. **Track Page Validation** - Simplified validation to accept 6-character shortcodes from Telegram tickets
3. **Telegram Welcome Message** - Restored formatting with emojis after cache-related display bug was identified

### Previous (v2.8.1 - Jan 26, 2026)

1. **Passenger Telegram Notifications** - Tickets sent directly to passengers who have Telegram accounts (by phone lookup)
2. **Track API Fix** - Fixed missing fields (commission, commissionVAT, totalAmount, status, createdAt) in track API response

### Previous (v2.8.0 - Jan 25, 2026)

1. **Telegram Bot** - Full booking flow via @i_ticket_busBot with bilingual support
2. **Fuzzy City Search** - Levenshtein distance algorithm for spelling error tolerance
3. **SMS Confirmation** - Tickets sent via SMS after Telegram booking payment
4. **Track Page Fix** - Now accepts 6-character shortcodes from Telegram tickets
5. **Passenger Prompts** - Shows "Passenger 1 of 2" for multi-passenger bookings
6. **Bot QR Codes** - QR codes for easy bot access at `/public/telegram-bot-qr.png`

### Previous (v2.7.0 - Jan 24, 2026)

1. **Silent Auto-Refresh** - Search results refresh every 30s without scroll jump or loading flash
2. **Trip Detail Refresh** - Manual refresh button + 30s auto-refresh for company admin
3. **Service Charge Rename** - "Commission" → "Service Charge" in all customer-facing UI
4. **PWA Mobile Optimization** - Safe area insets, touch targets, notch support
5. **Seat Map Orientation** - Auto-detect portrait for phones + manual toggle button
6. **Admin Passenger Milestone** - Progress bar added to super admin dashboard
7. **Company Messages Redirect** - /admin/company-messages → /admin/company-support

### Previous (v2.5.0 - Jan 23, 2026)
- Dashboard Redesign, CSV Import Enhancement, Supervisor Role, Platform Staff Permissions

---

## CRITICAL BUG FIXES (Reference)

| Bug | Fix |
|-----|-----|
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

**Full changelog & details**: See `CLAUDE-FULL-BACKUP.md`

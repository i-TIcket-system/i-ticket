# i-Ticket Platform

> **Version**: v2.14.0 | **Production**: https://i-ticket.et | **Changelog**: `CHANGELOG.md`
> **Rules**: `RULES.md` | **Full Backup**: `CLAUDE-FULL-BACKUP.md` | **Deploy**: `DEPLOYMENT.md`

---

## PRODUCTION (AWS EC2)

| Component | Details |
|-----------|---------|
| **Server** | AWS EC2 (t2.micro) - 54.147.33.168 |
| **Stack** | Ubuntu 22.04, Node.js 20.20.0, PM2, Nginx, PostgreSQL 16.11 |
| **Disk** | 7.6GB EBS (81% used) — run `rm -rf /var/www/i-ticket/.next/cache` after each build |
| **SSL** | Cloudflare (Full strict) |

```bash
# Access
ssh -i mela-shared-key.pem ubuntu@54.147.33.168

# Commands
pm2 status | pm2 logs i-ticket | pm2 restart i-ticket
```

### Deployment Workflow (ALWAYS FOLLOW)

**Step 1: Build locally first**
```bash
npm run build
```
Fix any errors before proceeding. Never deploy broken code.

**Step 2: Commit and push**
```bash
git add <files>
git commit -m "feat/fix: description"
git push
```

**Step 3: Deploy to production**
```bash
ssh -i mela-shared-key.pem ubuntu@54.147.33.168
cd /var/www/i-ticket
git pull
npm ci
npx prisma db push   # Only if schema changed
npm run build
rm -rf .next/cache            # Free ~550MB (disk is tight on 7.6GB)
pm2 restart i-ticket
pm2 logs i-ticket --lines 20  # Verify no errors
```

**Why this order?**
- Local build catches errors before touching production
- Production stays stable while you debug locally
- Never waste time SSHing only to find build fails

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
- Exception: DEPARTED trips allow no-show marking + replacement ticket sales (does NOT modify `availableSlots`)

### 5. NO-SHOW MANAGEMENT
- No-show marking only after DEPARTED (intermediate stops mean passengers may board later)
- Replacement tickets: same full price, staff/cashier only, CASH payment, commission = 0
- `availableSlots` is NEVER changed by no-show/replacement — prevents online booking confusion
- `releasedSeats = noShowCount - replacementsSold` (enforced in transaction)

---

## TECH STACK

Next.js 14 (App Router) + React 18 + TypeScript + PostgreSQL + Prisma + NextAuth.js + Tailwind/shadcn/ui

---

## KEY FEATURES

| Feature | Details |
|---------|---------|
| **Auth** | Multi-role (Customer, Company Admin, Super Admin, Staff, Sales), NextAuth.js |
| **Booking** | Real-time slots, seat selection, multi-passenger, TeleBirr (5% + 15% VAT), 10-min payment window |
| **Trips** | CRUD, intermediate stops, mandatory staff/vehicle, status lifecycle |
| **Fleet** | AI risk scoring, fleet analytics dashboard, predictive maintenance, work orders, inspections, TCO/downtime reporting |
| **GPS Tracking** | Real-time bus tracking via driver phone GPS + OsmAnd background tracking, OSRM road route overlay, passenger live map, company fleet map, Telegram /whereismybus |
| **Booking UX** | Pickup/dropoff autocomplete with fuzzy matching, interactive map stop selection, Nominatim reverse geocoding |
| **No-Show Mgmt** | Boarding checklist, no-show marking (DEPARTED only), replacement ticket sales for vacant seats (staff/cashier), manifest boarding status |
| **Manifests** | Auto-generate on DEPARTED + full capacity, boarding status column (BOARDED/NO-SHOW/REPLACEMENT) |
| **Portals** | Super Admin, Company Admin, Staff, Cashier, Mechanic, Finance, Sales |
| **Telegram Bot** | Bilingual booking via @i_ticket_busBot (see Telegram Bot section below) |

---

## DATABASE MODELS

**Core**: User, Company, Trip, TripTemplate, Booking, Passenger, Ticket, Payment, City
**Fleet**: Vehicle, MaintenanceSchedule, WorkOrder, VehicleInspection, VehicleRiskHistory, VehicleDowntime
**Tracking**: TripPosition
**Comms**: TripMessage, Notification, SupportTicket, CompanyMessage
**Sales**: SalesPerson, SalesReferral, SalesCommission
**Security**: ProcessedCallback, AdminLog
**Telegram**: TelegramSession

---

## KEY API ROUTES

| Category | Routes |
|----------|--------|
| **Public** | `/api/trips`, `/api/track/[code]` |
| **GPS Tracking** | `/api/tracking/update` (driver GPS), `/api/tracking/osmand` (OsmAnd background GPS), `/api/tracking/generate-token` (OsmAnd token), `/api/tracking/[tripId]` (public position), `/api/tracking/fleet` (company), `/api/tracking/active-trip` (driver) |
| **Company** | `/api/company/trips`, `/api/company/trip-templates`, `/api/company/staff`, `/api/company/vehicles` |
| **No-Show** | `/api/company/trips/[tripId]/boarding-status` (GET), `/api/company/trips/[tripId]/no-show` (POST), `/api/company/trips/[tripId]/replacement-ticket` (POST) |
| **Fleet Analytics** | `/api/company/analytics/fleet-health`, `risk-trends`, `cost-forecast`, `failure-timeline`, `vehicle-comparison`, `maintenance-windows`, `route-wear`, `compliance-calendar` |
| **Fleet Reports** | `/api/company/reports/maintenance`, `maintenance/export`, `vehicle-tco`, `downtime`, `fleet-analytics/export` |
| **Public** | `/api/cities/coordinates` (city lat/lon for map) |
| **Admin** | `/api/admin/stats`, `/api/admin/companies`, `/api/admin/trips`, `/api/admin/bookings` |
| **Cron** | `/api/cron/cleanup`, `/api/cron/trip-reminders` |
| **Security** | `/api/csp-report` (CSP violation reports, logged to PM2) |
| **Telegram** | `/api/telegram/webhook` (bot updates) |

---

## FRONTEND ROUTES

- `/(auth)` - Login, Register
- `/(customer)` - Search, Booking, Tickets
- `/(company)` - Dashboard, Trips, Staff, Vehicles, Fleet Analytics, Fleet Tracking, Reports
- `/(admin)` - Dashboard, Companies, Trips, Manifests
- `/(driver)` - GPS Tracking (`/driver/track`)
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
- CSP via middleware (report violations to `/api/csp-report`)
- Cloudflare: Email Obfuscation OFF (breaks React hydration), TLS 1.2+, HSTS preload

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
| `/whereismybus` | Track bus location (GPS) |
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
│   ├── tickets.ts            # Ticket viewing with QR codes
│   └── tracking.ts           # /whereismybus + location sharing
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
- **Bus Tracking**: `/whereismybus` shows live GPS location + ETA for departed trips

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
- [x] ~~Phase 2: Predictive Maintenance AI features~~ DONE (v2.11.0)
- [x] ~~Real-time GPS bus tracking + Telegram /whereismybus~~ DONE (v2.12.0)
- [x] ~~Pickup/dropoff autocomplete with map selection~~ DONE (v2.13.0)
- [x] ~~OsmAnd background GPS tracking~~ DONE (v2.13.0)
- [x] ~~Fleet map UX overhaul (search, filters, fit-all)~~ DONE (v2.13.0)
- [x] ~~Admin bookings with filters/pagination~~ DONE (v2.13.0)
- [x] ~~No-show management + seat re-sale~~ DONE (v2.14.0)

---

## RECENT UPDATES (v2.14.0)

**Latest**: No-Show Management + Seat Re-sale for Departed Trips

*No-Show Management*
- Boarding checklist on trip detail page for BOARDING/DEPARTED trips
- `BoardingChecklist` component: passenger table with status badges (PENDING/BOARDED/NO_SHOW), bulk select, "Mark No-Show" button
- No-show marking only allowed on DEPARTED trips (intermediate pickup stops mean passengers can't be prematurely flagged)
- Idempotent: re-marking NO_SHOW on already-flagged passenger is a no-op; BOARDED/used-ticket passengers are skipped
- `Passenger.boardingStatus` field: `PENDING` (default), `BOARDED`, `NO_SHOW`
- `Trip.noShowCount`, `Trip.releasedSeats`, `Trip.replacementsSold` counters

*Replacement Ticket Sales*
- `ReplacementTicketCard` component: counter-based sales with seat assignment, QR code generation, short code display
- Staff/cashier only (not online booking), same full price, CASH payment
- Replacement passengers auto-assigned no-show seat numbers, `boardingStatus = "BOARDED"` immediately
- `Booking.isReplacement` flag + `Booking.replacedPassengerId` for audit trail
- `availableSlots` unchanged — seats were already counted as sold, prevents online booking confusion
- Commission = 0 for replacement sales (matches cashier pattern)

*Ticket Verification Integration*
- PATCH `/api/tickets/verify` now auto-sets `boardingStatus = "BOARDED"` on ticket scan
- Warns if passenger was previously marked NO_SHOW (late arrival edge case)

*Manifest Updates*
- Status column shows BOARDED/NO-SHOW/REPLACEMENT with color coding (green/red/blue)
- Boarding summary row: boarded count, no-show count, replacement count

*Trip Detail Page*
- Boarding stats sidebar card (no-shows, released seats, replacements sold)
- Passenger names in bookings table show boarding status icons (green check / red X / strikethrough)
- `ViewOnlyBanner` DEPARTED message updated: "Editing is locked, but you can manage boarding and sell replacement tickets for no-shows"

*New API Routes*
- `GET /api/company/trips/[tripId]/boarding-status` — passengers with boarding status + summary counts
- `POST /api/company/trips/[tripId]/no-show` — mark passengers as NO_SHOW (DEPARTED guard, company segregation, audit log)
- `POST /api/company/trips/[tripId]/replacement-ticket` — sell replacement tickets (transaction-safe, QR generation, CASH payment)

*Safeguards*
- Trip status guard: no-show only on DEPARTED; replacement only on DEPARTED
- Company segregation on all routes (RULE-001)
- Ticket used check: can't mark NO_SHOW if ticket already scanned
- Released seat cap: can't sell more replacements than `releasedSeats`
- All writes in `transactionWithTimeout()` (10s)
- AdminLog entries: `PASSENGER_NO_SHOW`, `REPLACEMENT_TICKET_SALE`

## v2.13.2

**TeleBirr Proposal Updates, Payment Timeout, Contact Info, Disk Cleanup**

*TeleBirr Integration Prep*
- TeleBirr transaction fee set to 0.5% of total amount (absorbed by i-Ticket, invisible to customers)
- `TELEBIRR_FEE_RATE` constant + `calculateNetPlatformRevenue()` in `src/lib/commission.ts`
- `calculateTelebirrFee()` updated in `src/lib/payments/telebirr.ts`

*Payment & Business Updates*
- Payment window reduced from 15min to 10min (payments API, tickets page, cron cleanup, privacy, terms, FAQ)
- Contact phone updated to +251 911 550 001 (footer, contact, FAQ, SMS messages, Telegram bot)
- Partners updated: removed Sky Bus, added Awash Bus (homepage + footer)

*Production Disk Cleanup (7.6GB EBS: 93% → 77%)*
- Removed `.next/cache` (~1.4GB across two builds), added `rm -rf .next/cache` to deploy workflow
- Removed unused LXD snap (313MB) + disabled snap revisions (220MB) + seed snaps (308MB)
- Cleaned APT cache/lists (460MB), rotated logs, old kernel modules/headers, journal logs
- **Warning**: disk fills to ~93% after each build; always clean `.next/cache` post-build

## v2.13.1

**OSRM Road Route on Tracking Maps, Driver ETA Cleanup**

*OSRM Road Route on Tracking Maps*
- `RouteOverlay` fetches actual road geometry from OSRM public routing API (`router.project-osrm.org`)
- Replaces straight dashed line with real highway path (blue `#3b82f6`, weight 4, opacity 0.5)
- GPS trail renders on top (teal `#0e9494`), stop markers on top of both
- Fetched once per mount via `useRef` guard — no refetch on 12s/15s polling
- Falls back to gray dashed straight line if OSRM is unreachable
- OSRM uses `lon,lat` order — coordinates flipped to Leaflet `[lat, lon]` format
- CSP: added `https://router.project-osrm.org` to connect-src

*Driver Tracking ETA Cleanup*
- Removed duplicate ETA from driver bottom action bar (was showing in both top ETABadge overlay and bottom bar)
- ETA now shown exclusively in the top overlay badge (time + distance + speed + absolute arrival)

## v2.13.0

**Pickup/Dropoff Autocomplete, OsmAnd Background GPS, Fleet Map UX, Admin Bookings**

*Pickup/Dropoff Autocomplete + Map Selection*
- `RouteStopCombobox`: autocomplete dropdown with fuzzy matching for route stops and city landmarks (Meskel Square, Bole Airport, etc.)
- `PickupMapModal`: interactive map to select pickup/dropoff by clicking route stops or anywhere along route line (snap-to-route + reverse geocode via Nominatim)
- Shared fuzzy-match utility (`src/lib/fuzzy-match.ts`) extracted from Telegram bot for reuse
- `CityCombobox` upgraded from substring to fuzzy matching
- City coordinates API (`/api/cities/coordinates`) for lazy-loading map data
- CSP: added `nominatim.openstreetmap.org` to connect-src

*OsmAnd Background GPS Tracking*
- OsmAnd endpoint (`/api/tracking/osmand`) accepts GET requests with token-based auth (no session needed)
- Token generation API (`/api/tracking/generate-token`) creates unique `trackingToken` per trip
- `OsmAndSetup` component in driver tracking page — collapsible panel with URL generation, copy button, setup instructions
- Shared position processing logic (`src/lib/tracking/update-position.ts`) used by both web and OsmAnd APIs
- Schema: `Trip.trackingToken` field (unique, nullable)
- Offline GPS queue increased from 200 to 1000 positions (~2h 46min offline at 10s intervals)

*Background GPS Persistence (3-layer defense)*
- Wake Lock API to prevent screen dimming (Chrome Android 84+)
- Silent audio keep-alive (`src/lib/tracking/audio-keep-alive.ts`) to prevent browser JS suspension
- Heartbeat watchdog restarts `watchPosition` if GPS goes silent
- Visibility recovery: re-acquires wake lock, resumes audio, flushes queue
- UI indicators: screen lock status, unsupported device warning, queue count

*Fleet Map UX Overhaul*
- Stop auto-recentering map on every 15s poll
- Search bar: filter by plate, route, driver name
- Status filter: All / Live / Stale / No GPS
- Vehicle list panel with click-to-focus (`flyTo` zoom 14)
- "Fit All" button to zoom out to all tracked vehicles
- BusMarker highlighted prop: larger icon + glow ring when focused
- Leaflet z-index cap: map controls no longer overlap navbar/sidebar

*Admin Dashboard Enhancements*
- Bookings table with search, status filter, company filter, date range, and pagination (10/page)
- New API: `GET /api/admin/bookings` with query params
- `useDebounce` hook for search input
- Removed `bookedByPhone` from ticket verify response (privacy fix)
- Fixed Radix Select crash on empty value (changed default to `"ALL"`)

*Security*
- Resolved 6 of 7 Dependabot vulnerabilities

**v2.12.2**: Mobile UX Overhaul — Fleet Tracking, Driver Tracking, Sidebar, Service Worker
- FleetMap: full-viewport app-like layout on mobile, compact icon-only toolbar, floating vehicle list overlay
- Company sidebar scrollable on mobile, driver tracking navbar/footer hidden
- Service worker v2: skip cross-origin requests (fixes grey map tiles in PWA)
- Passenger tracking: GPS trail deduplication, recenter preserves zoom
- CSP: `Cache-Control: no-store` + `Pragma: no-cache`

**v2.12.1**: Fleet Map Mobile Fix + CSP Fix for Map Tiles
- FleetMap: vertical stack on mobile (was horizontal flex causing 0-width map)
- FleetMap: auto-hides vehicle list when clicking a vehicle on mobile
- FleetMap: show/hide list button visible on all screen sizes (was desktop-only)
- CSP: allow Cloudflare Web Analytics beacon (`static.cloudflareinsights.com`)
- CSP report endpoint deployed (`/api/csp-report`) — logs violations to PM2
- Cloudflare: disabled Email Address Obfuscation (was modifying HTML, breaking React hydration)
- Nginx: fixed API rate limit from 60r/m back to 30r/s (was blocking fleet polling)

**v2.12.0**: Real-Time GPS Bus Tracking — Driver, Passenger, Fleet & Telegram
- Driver tracking page (`/driver/track`) — browser Geolocation API sends GPS every 10s
- Passenger live map on `/track/[code]` — polls bus position every 12s for DEPARTED trips
- Company fleet map (`/company/fleet-tracking`) — all active buses on one map, 15s polling
- Telegram `/whereismybus` command — shows GPS location, ETA, speed; "Track Bus" button on tickets
- New `TripPosition` model for GPS history (lat, lon, altitude, accuracy, heading, speed)
- Trip fields: `trackingActive`, `lastLatitude`, `lastLongitude`, `lastSpeed`, `lastPositionAt`, `estimatedArrival`
- Vehicle fields: `lastLatitude`, `lastLongitude`, `lastPositionAt`
- ETA calculation: Haversine distance / avg speed x 1.3 winding factor for Ethiopian roads
- Offline GPS queue (localStorage) — buffers positions when driver loses connectivity
- Auto-deactivate tracking on COMPLETED/CANCELLED; cron purges positions >7 days
- 8 tracking components under `src/components/tracking/`
- Dependencies: `leaflet`, `react-leaflet@4` (v4 for React 18; v5 requires React 19), `@types/leaflet`
- CSP: added `https://*.tile.openstreetmap.org` to img-src and connect-src
- CSP: added `https://static.cloudflareinsights.com` to script-src (Cloudflare Web Analytics beacon)
- CSP: added `https://cloudflareinsights.com` to connect-src (beacon telemetry)
- CSP report endpoint at `/api/csp-report` logs violations to PM2
- Permissions-Policy: `geolocation=(self)` (was `geolocation=()`)

**v2.11.0**: Phase 2 - Predictive Maintenance AI Dashboard, Trip Integration & Fleet Reports
- Fleet Analytics dashboard at `/company/fleet-analytics` with health gauge, risk distribution, trend charts, cost forecast, failure timeline, vehicle comparison
- 8 analytics APIs: fleet-health, risk-trends, failure-timeline, cost-forecast, vehicle-comparison, maintenance-windows, route-wear, compliance-calendar
- 5 report APIs with Excel exports: maintenance costs, vehicle TCO, downtime, fleet analytics
- Trip-maintenance integration: risk warnings on trip forms (orange >= 70, red >= 85), pre-trip safety check for critical vehicles requiring recent inspection
- 10 new chart components under `src/components/fleet/`
- Reports page enhanced with fleet analytics tabs (Maintenance Costs, TCO, Downtime, Compliance)
- Downtime automation: auto-create/close VehicleDowntime records on vehicle status change
- Daily risk history snapshots via cron job for trend analysis
- Schema: VehicleRiskHistory, VehicleDowntime models + Vehicle purchasePrice/purchaseDate

**v2.10.17**: VM Security Hardening (Vulnerability Assessment Remediation)
- Cloudflare: TLS 1.2 minimum enforced (was TLS 1.0), HSTS enabled with preload
- CSP via middleware: `unsafe-eval` removed, Report-To/Reporting-Endpoints added
- Tightened `img-src` from `https:` to `https://api.qrserver.com` only
- Added `Cache-Control: no-store` + `Pragma: no-cache` for all routes

**v2.10.16**: Manifest Cleanup, Today's Trips Display & Contact Tab Upgrade
- Removed National ID column from manifests (verification now at boarding)
- Show all today's trips including DEPARTED/COMPLETED (smart display for future trips)
- Contact i-Ticket tab upgraded with search, date filters, and filter indicators

**v2.10.15**: Staff Status Auto-Sync & Management Improvements
- Staff status auto-syncs with trip lifecycle (DEPARTED → ON_TRIP, COMPLETED → AVAILABLE)
- Respects ON_LEAVE (never auto-changed), admin can override manually
- Added status filter to staff management page (Available / On Trip / On Leave)
- Cleaned up 205 trips violating 24-hour resource allocation rule (RULE-005)

**v2.10.14**: Trip Log Popup on Completion + Auto-Completion Safety Buffer
- End odometer popup auto-shows when driver completes trip (mirrors start odometer on depart)
- Auto-completion now waits 2 hours after estimated arrival (safety buffer)
- **BUG FIX**: Cron treated `estimatedDuration` as hours when DB stores minutes!

**Full changelog**: See `CHANGELOG.md`

---

## CRITICAL BUG FIXES (Reference)

| Bug | Fix |
|-----|-----|
| **Grey map tiles in PWA (v2.12.2)** | Service worker intercepted cross-origin tile requests (OpenStreetMap CDN). Fix: skip non-same-origin URLs in sw.js fetch handler (`url.origin !== self.location.origin`), bump cache name to `i-ticket-v2` to purge old cache |
| **Show/hide list toggle no-op (v2.12.2)** | Desktop vehicle list panel had `hidden lg:block` which always showed on desktop regardless of `showList` state. Fix: `hidden ${showList ? "lg:block" : "lg:hidden"}` |
| **Company sidebar can't scroll on mobile (v2.12.2)** | 13 sidebar nav items overflow mobile viewport, Sign Out unreachable. Fix: add `overflow-y-auto` to `<nav>` element in company layout |
| **Driver Start button below fold (v2.12.2)** | `/driver` routes still showed 64px navbar, pushing `h-dvh` content below viewport. Fix: add `/driver` to Navbar/Footer `hiddenRoutes` |
| **Cloudflare beacon blocks map tiles (v2.12.1)** | Cloudflare injects `beacon.min.js` from `static.cloudflareinsights.com` into all pages. CSP `script-src` must include this domain, otherwise the blocked script cascades and prevents Leaflet dynamic imports from loading → grey map tiles. Also disable Cloudflare Email Obfuscation (Scrape Shield) as it modifies HTML and breaks React hydration |
| **Fleet map invisible on mobile (v2.12.1)** | FleetMap vehicle list had `w-full shrink-0` in a `flex` row — took 100% width on mobile, map got 0 width. Fix: `flex-col lg:flex-row` + auto-hide list on vehicle click |
| **Nonce CSP breaks Next.js 14 (v2.10.17)** | Next.js 14 does NOT propagate nonces to inline `<script>` tags. Using `'strict-dynamic'` with nonce causes `'self'` to be ignored → ALL JS blocked. Use `'self' 'unsafe-inline'` instead. Nonce CSP requires Next.js 15+ |
| **UTC vs Ethiopia timezone (v2.10.15)** | Use `hasDepartedEthiopia()` from `@/lib/utils` instead of `new Date(departureTime) < new Date()` - AWS EC2 runs in UTC causing trips to be marked DEPARTED 3 hours early |
| Cron estimatedDuration unit (v2.10.14) | DB stores MINUTES, not hours - use `trip.estimatedDuration * 60 * 1000` not `* 60 * 60 * 1000` |
| API multi-value query params (v2.10.11) | Don't send CSV (`status=OPEN,IN_PROGRESS`) - make parallel API calls and combine results instead |
| Date comparison timezone (v2.10.8) | Use `isTodayEthiopia()` and `isSameDayEthiopia()` instead of `toDateString()` - JS dates compare in browser timezone, not Ethiopia |
| Stale closure in polling (v2.10.7) | Use `useRef` to access current state in `setInterval` callbacks - state captured at setup time becomes stale |
| Zod validation null vs undefined (v2.10.5) | Use `.nullish()` not `.optional()` for searchParams - `searchParams.get()` returns `null`, not `undefined` |
| Telegram duration (v2.9.0) | `formatDuration()` now expects minutes (DB stores minutes, not hours) |
| Telegram timezone (v2.8.2) | Use `Intl.DateTimeFormat` with `timeZone: "Africa/Addis_Ababa"` in formatters.ts |
| Staff API role filter | Use `role: "COMPANY_ADMIN"` + `staffRole` filter |
| Auto-halt re-trigger | `adminResumedFromAutoHalt` flag |
| Commission VAT | 106 ETB = 100 ticket + 5 commission + 1 VAT (TeleBirr deducts 0.5% fee internally — NOT shown to customers) |
| Payment timeout | 10 minutes — payment API, tickets page, cron cleanup, privacy/terms all use 10min |
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

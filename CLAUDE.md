# i-Ticket Platform

> **Full History**: See `CLAUDE-FULL-BACKUP.md` for detailed session logs.
> **🚨 CRITICAL**: See `CLAUDE-STABLE-REFERENCE.md` before making any code changes!

---

## 🚨 ULTRA-CRITICAL BUSINESS RULES (NEVER FORGET)

### 1. GUEST BOOKING = FEATURE (NOT A BUG)
- Phone payment IS the verification - no OTP/SMS verification needed
- Guests can book without registration - this is BY DESIGN

### 2. COMPANY SEGREGATION = ULTRA CRITICAL
- **Complete data isolation between bus companies**
- Selam Bus must NEVER see Sky Bus data (and vice versa)
- **ONLY shared resource: Organic City database**
- Every API MUST filter by `companyId`

## Tech Stack
Next.js 14 (App Router) + React 18 + TypeScript + PostgreSQL + Prisma + NextAuth.js + Tailwind/shadcn/ui

---

## COMPLETED TODO LIST ✅ (Jan 12, 2026)

All 9 items from previous session completed:

1. ~~Finance API TypeScript errors~~ → Already fixed (no errors)
2. ~~Mechanic API TypeScript errors~~ → Already fixed (no errors)
3. ~~Add trip status field~~ → Already exists (SCHEDULED, BOARDING, DEPARTED, COMPLETED, CANCELLED)
4. ~~Add "Start Trip" button~~ → Already exists ("Start Boarding" button, no seat restrictions)
5. ~~Record trip logs in AdminLog~~ → Already implemented (status changes logged)
6. ~~Include trip log data in manifest~~ → Already implemented (odometer, fuel, distance in Excel)
7. ~~Allow manifest download anytime~~ → Already unrestricted
8. ✅ **NEW: Trip Reminder Notifications** - Cron job sends reminders day before + hours before
9. ✅ **NEW: Actual Departure/Arrival Times** - Recorded automatically on status changes

### Current Status
- **Phase 2 Predictive Maintenance**: ✅ 100% COMPLETE
- **Staff Login Bug**: ✅ FIXED
- **Cities Database**: ✅ 90 Ethiopian cities (static list + DB)
- **Trip Reminders**: ✅ Hourly cron job
- **City Dropdown**: ✅ Shows all 90 cities + custom city support

---

## Recent Development (Jan 2026)

### January 12, 2026 (Afternoon) - Trip Reminders, Actual Times & Stability Docs
- **Trip Reminder Notifications** - Hourly cron job for passenger reminders
  - Day before (20-28 hours): Trip details, seat numbers, passenger names
  - Hours before (2-4 hours): Vehicle, driver, pickup location, urgent priority
  - Notification types: `TRIP_REMINDER_DAY_BEFORE`, `TRIP_REMINDER_HOURS_BEFORE`
  - File: `src/app/api/cron/trip-reminders/route.ts`
- **Actual Departure/Arrival Times** - Auto-recorded on status changes
  - `actualDepartureTime` set when status → DEPARTED
  - `actualArrivalTime` set when status → COMPLETED
  - UI shows actual vs scheduled times with calculated duration
  - Migration: `20260112045405_add_actual_trip_times`
- **City Dropdown Fix** - Removed 50-city limit, now shows all 90 cities
  - Fixed: Custom city hint now visible even when no matches
  - Added: "No matching cities found - You can still search" message
  - Preserves: Custom city input for cities not in predefined list
- **CLAUDE-STABLE-REFERENCE.md** - Critical reference document created
  - Golden rules for code changes (NEVER remove existing functionality)
  - Stable component registry with required features
  - Past bugs fixed (7 documented - never re-introduce)
  - API contracts, database fields, security features
  - Before-change checklist (10 points)
- **Commits**: 5 commits (cf4f771, 71f99fe, 55fc5b8, 36e31ae + CLAUDE.md update)

### January 12, 2026 (Morning) - Mandatory Trip Fields & Critical Bug Fixes
- **CRITICAL FIX: Staff API Bug** - Changed from `role: "STAFF"` to `role: "COMPANY_ADMIN"` filtering
  - Fixed empty driver/conductor dropdowns in trip creation
  - Staff now load correctly (7 drivers, 6 conductors, 1 ticketer for Selam Bus)
  - Resolves staff login redirect issue
- **Mandatory Trip Fields** - Vehicle, driver, conductor now required for all trips
  - Frontend validation with red border indicators
  - Backend schema validation (vehicleId, driverId, conductorId required)
  - Removed "None assigned" options from dropdowns
- **Vehicle Conflict Override** - 24-hour availability constraint with admin override
  - Orange warning card when vehicle has trip within 24 hours
  - Override checkbox + reason textarea (minimum 10 characters)
  - Logged to AdminLog with `TRIP_CREATED_WITH_OVERRIDE` action
- **90 Ethiopian Cities** - Comprehensive city database seeded
  - All regions covered (Addis Ababa, Amhara, Oromia, Tigray, SNNPR, Somali, Afar, etc.)
  - Static list in `src/lib/ethiopian-cities.ts` (90 cities)
  - DB seeded via `prisma/seed-cities.ts`
- **Navigation Fix** - Only "Add Trip" highlighted on `/company/trips/new` page
  - Fixed both "Trips" and "Add Trip" being active simultaneously
  - Proper sub-route detection with exclusion logic
- **Commits**: 4 commits (88658b9, a4df148, a093fbe, da4f981)

### Week 2
- **Work Order Communication** - Multi-role chat + notifications for mechanic/finance/admin/driver
- **Mechanic Portal** (`/mechanic`) - Dedicated dashboard with assigned work orders
- **Finance Portal** (`/finance`) - Cost tracking with work order oversight
- **Work Order Detail Page** - Full CRUD with parts tracking, status actions
- **Predictive Maintenance** - AI risk scoring (0-100), 6 new models, cron job, VehicleHealthDashboard
- **Fleet Seed Data** - 6 staff, 4 vehicles, 12 maintenance schedules
- **Notification Fixes** - Cross-role routing, desktop bell, sidebar dropdown fix

### Week 1
- **Seat Selection System** - Interactive map with guzo.et-inspired design
- **Cashier Portal** (`/cashier`) - Dedicated ticketing interface with TripChat
- **Trip Messaging** - TripMessage/TripMessageReadReceipt models
- **Ultra-Audit** - 30 findings fixed (P0-P3), A+ security rating
- **Security Hardening** - 16 vulnerabilities fixed, race condition protection
- **Customer UX** - Trip comparison, remember me, field-level errors, dark mode

### December 2025
- SMS bot (English + Amharic), Staff management, Manual ticketing
- Legal docs (Terms, Privacy, FAQ), Support tickets, Super Admin dashboard

---

## Core Features

### Authentication
- Multi-role: Customer, Company Admin, Super Admin, Staff (Driver/Conductor/Ticketer/Mechanic/Finance), Sales Person
- NextAuth.js sessions, guest users (SMS-only), password reset via OTP

### Booking & Payments
- Real-time slot management, seat selection, multi-passenger bookings
- TeleBirr integration (web + SMS), 5% commission, QR + short codes
- Manual ticketing for offline sales

### Trip Management
- CRUD with intermediate stops, staff/vehicle assignment
- Auto-halt at 10% capacity, search filters, distance tracking

### Fleet Management (Phase 2)
- Vehicle CRUD with Ethiopian dual ID (plate + side number)
- AI risk scoring (5-factor weighted), predicted failure dates
- Maintenance schedules (mileage OR time-based), work orders with parts
- Fuel tracking, digital inspections, odometer logs
- VehicleHealthDashboard with real-time gauge

### Admin Portals
- **Super Admin**: Stats, revenue analytics, companies, audit logs, support tickets
- **Company Admin**: Trips, staff, vehicles, work orders, manifests
- **Staff Portal**: My Trips with TripChat
- **Cashier**: Ticketing dashboard with seat map
- **Mechanic**: Work orders assigned to me
- **Finance**: Cost tracking, work order oversight
- **Sales**: Referrals, commissions, QR flyers

### Integrations
- TeleBirr (HMAC-SHA256), ClickUp (one-way sync), Africa's Talking SMS

---

## Database Models

**Core**: User, Company, Trip, Booking, Passenger, Ticket, Payment, City
**Fleet**: Vehicle, MaintenanceSchedule, WorkOrder, WorkOrderPart, VehicleInspection, FuelEntry, OdometerLog
**Communication**: TripMessage, TripMessageReadReceipt, Notification, SupportTicket
**Sales**: SalesPerson, SalesQrScan, SalesReferral, SalesCommission, SalesPayout
**Security**: ProcessedCallback, PasswordReset, AdminLog
**SMS**: SmsSession

---

## Key API Routes

**Public**: `/api/trips`, `/api/track/[code]`, `/api/tickets/verify/public`
**Company**: `/api/company/trips`, `/api/company/staff`, `/api/company/vehicles`, `/api/company/work-orders`
**Staff**: `/api/staff/my-trips`, `/api/trips/[tripId]/messages`
**Cashier**: `/api/cashier/my-trips`, `/api/cashier/trip/[tripId]/sell`
**Mechanic**: `/api/mechanic/work-orders`
**Finance**: `/api/finance/work-orders`
**Admin**: `/api/admin/stats`, `/api/admin/companies`, `/api/admin/sales-persons/*`
**Cron**: `/api/cron/predictive-maintenance` (daily 2 AM), `/api/cron/trip-reminders` (hourly), `/api/cron/cleanup` (hourly)

---

## Frontend Routes

- `/(auth)` - Login, Register, Password Reset
- `/(customer)` - Search, Booking, Tickets, Profile
- `/(company)` - Dashboard, Trips, Staff, Vehicles, Work Orders
- `/(staff)` - My Trips with TripChat
- `/(cashier)` - Ticketing portal
- `/(mechanic)` - Work order management
- `/(finance)` - Cost tracking
- `/(admin)` - Super Admin dashboard
- `/(sales)` - Sales person portal

---

## Security

- Environment validation, bcrypt passwords, 24h sessions
- Zod validation, rate limiting (IP + User + Booking)
- Payment replay protection (SHA-256), row-level locking
- Transaction timeouts (10s), optimistic locking
- CSP headers, XSS prevention, safe error messages

---

## Test Logins

- **Selam Bus Admin**: 0922345678 / demo123
- **Super Admin**: 0911223344 / demo123
- **Drivers**: 0914444444-45 / demo123
- **Customer**: 0912345678 / demo123

---

## Deployment

**Required**: PostgreSQL, NEXTAUTH_SECRET, TeleBirr credentials, SMS gateway
**Optional**: CLICKUP_API_KEY, CRON_SECRET

---

**Built with Claude AI (Anthropic)**

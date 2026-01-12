# i-Ticket Platform

> **Full History**: See `CLAUDE-FULL-BACKUP.md` for detailed session logs.

## Tech Stack
Next.js 14 (App Router) + React 18 + TypeScript + PostgreSQL + Prisma + NextAuth.js + Tailwind/shadcn/ui

---

## NEXT SESSION TODO LIST (9 items)

### Critical Bugs (2 remaining)
1. **Finance API TypeScript errors** (9 errors)
   - Lines 89, 106, 121: `companyId` null checks needed
   - Lines 133-136, 141: `_sum`, `_avg`, `_count` type issues
2. **Mechanic API TypeScript errors** (2 errors)
   - Line 80: `companyId` null check needed
   - Line 87: `_count` type mismatch

### Trip Management (5 items)
3. Add trip status field (SCHEDULED, STARTED, COMPLETED, CANCELLED)
4. Add "Start Trip" button (allow starting even if not all seats sold)
5. Record trip logs in AdminLog (start/end odometer, fuel readings)
6. Include trip log data in passenger manifest Excel
7. Allow manifest download anytime (remove "bus full" restriction)

### Enhancements (2 items)
8. Add passenger trip reminder notifications (day before, hours before)
9. Add trip completion workflow (record actual departure/arrival times)

### Status
- **Phase 2 Predictive Maintenance**: ✅ 100% COMPLETE
- **Staff Login Bug**: ✅ FIXED (Jan 12, 2026)
- **Cities Database**: ✅ 90 Ethiopian cities seeded

---

## Recent Development (Jan 2026)

### January 12, 2026 - Mandatory Trip Fields & Critical Bug Fixes
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
  - Replaced 7-city quick fix with full static list import
  - Cities include major hubs, regional capitals, tourist sites, highway towns
- **Navigation Fix** - Only "Add Trip" highlighted on `/company/trips/new` page
  - Fixed both "Trips" and "Add Trip" being active simultaneously
  - Proper sub-route detection with exclusion logic
- **Files Modified**: `src/app/company/trips/new/page.tsx` (frontend validation), `src/app/api/trips/route.ts` (fixed double body read), `src/app/api/company/staff/route.ts` (role filter), `src/app/company/layout.tsx` (navigation), `prisma/seed-cities.ts` (city import)
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
**Cron**: `/api/cron/predictive-maintenance` (daily 2 AM)

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

# i-Ticket Platform

> **Current Version**: v2.3.0 (January 21, 2026)
> **Full History**: See `docs/business-logic/CLAUDE-BACKUP-v3.md` for complete changelog details.
> **🚨 CRITICAL**: See `CLAUDE-STABLE-REFERENCE.md` before making any code changes!
> **Additional Documentation**: See `/docs` folder for organized documentation (test reports, guides, presentations, etc.)
> **Changelog**: See `CHANGELOG.md` for version history

---

## 🚨 ULTRA-CRITICAL BUSINESS RULES

### 1. GUEST BOOKING = FEATURE (NOT A BUG)
- Phone payment IS the verification - no OTP/SMS verification needed
- Guests can book without registration - this is BY DESIGN

### 2. COMPANY SEGREGATION = ULTRA CRITICAL
- **Complete data isolation between bus companies**
- Selam Bus must NEVER see Sky Bus data (and vice versa)
- **ONLY shared resource: Organic City database**
- Every API MUST filter by `companyId`

### 3. AUTO-HALT DUAL BEHAVIOR = CRITICAL (Jan 20, 2026)
- **Manual ticketing**: Can ALWAYS sell down to 0 seats (NEVER blocked by auto-halt)
- **Online booking**: Auto-halts at ≤10 seats (unless bypassed by company/trip checkboxes)
- When manual sale drops slots to ≤10, online booking halts but manual ticketing continues
- This is BY DESIGN - manual ticketers need unrestricted access for walk-in customers

## Tech Stack
Next.js 14 (App Router) + React 18 + TypeScript + PostgreSQL + Prisma + NextAuth.js + Tailwind/shadcn/ui

---

## Recent Development (Jan 2026)

### Latest Updates (Jan 21, 2026 - v2.3.0 Release) 🎯
- **🚨 CRITICAL: View-Only Trip Mode** (✅ COMPLETE)
  - **Problem**: DEPARTED, COMPLETED, CANCELLED trips could still be edited
  - **Business Rule**: Final-status trips must be READ-ONLY for data integrity and audit compliance
  - **Solution**: Comprehensive protection at API and UI levels
  - **API Protection**:
    - Manual ticket sales: BLOCKED for view-only trips
    - Cashier ticket sales: BLOCKED for view-only trips
    - Trip updates (PUT): BLOCKED for view-only trips
    - Resume booking: BLOCKED for view-only trips
    - Status changes: Only DEPARTED → COMPLETED allowed
  - **UI Protection**:
    - ViewOnlyBanner component shows status-specific messages
    - Edit Trip button disabled on detail page
    - Edit page redirects with error toast notification
    - Resume button disabled with tooltip explanation
    - Booking badge forced "HALTED" display
  - **Database Fix**: 42 trips corrected (bookingHalted sync)
  - **Files**: Created 11 new files, modified 17 files
  - **Documentation**: 3 comprehensive docs (VIEW-ONLY, TRIP-SORTING, OLD-TRIP-CLEANUP)
  - **Commit**: d6cd6f9

- **Trip Sorting - Active First** (✅ COMPLETE)
  - **Problem**: Completed/cancelled trips mixed with active trips in listings
  - **Solution**: Sort by status priority, then departure time
  - **Priority Order**:
    1. SCHEDULED (top - needs attention)
    2. BOARDING (near top - imminent)
    3. DEPARTED (middle - in progress)
    4. COMPLETED (bottom - historical)
    5. CANCELLED (bottom - historical)
  - **Applied To**: 5 trip listing endpoints (company, admin, staff, cashier, public)
  - **Files**: Created `lib/sort-trips.ts`, modified 5 API routes

- **Old Trip Status Cleanup** (✅ COMPLETE)
  - **Problem**: 44 trips with dates before current date had incorrect status
  - **Solution**: Manual script + automated cron job cleanup
  - **Results**: 4 marked COMPLETED (had bookings), 40 marked CANCELLED (no bookings)
  - **Automation**: Cron job runs every 15 minutes
  - **Audit**: Creates `TRIP_STATUS_AUTO_UPDATE` log entries
  - **Files**: Created 2 scripts (`check-old-trips.ts`, `cleanup-old-trips.ts`)

---

## Recent Development (Jan 2026)

### Latest Updates (Jan 20, 2026 - Late Night Session)
- **🚨 CRITICAL AUTO-HALT FIX** (✅ COMPLETE)
  - **Problem**: Manual ticket sales could bring slots to ≤10 without halting online booking
  - **Root Cause**: Auto-halt logic only existed in online booking route, not manual-ticket route
  - **Solution**: Added auto-halt trigger to manual-ticket route
  - **Critical Business Rule** (saved to memory):
    1. **Manual ticketing**: Can ALWAYS sell down to 0 seats (NEVER blocked by auto-halt)
    2. **Online booking**: Auto-halts at ≤10 seats (unless bypassed by checkboxes)
  - **Behavior**: When manual sale drops slots to ≤10:
    - ✅ Manual sale completes successfully (no restriction)
    - ✅ Online booking gets auto-halted (prevents new online bookings)
    - ✅ Manual ticketing can continue selling all remaining seats
  - **Respects Bypass Settings**:
    - Company-wide: `disableAutoHaltGlobally` checkbox
    - Trip-specific: `autoResumeEnabled` checkbox
  - **Files**: `api/company/trips/[tripId]/manual-ticket/route.ts`
  - **Audit**: Creates `AUTO_HALT_LOW_SLOTS` log entry + ClickUp alert
  - **Commit**: de0bcda

### Latest Updates (Jan 20, 2026 - Night Session - Bug Fixes)
- **11 Critical Bug Fixes & UX Improvements** (✅ COMPLETE)
  - **🔴 PRIORITY 1: Manual Ticketing Access (CRITICAL FIX)**:
    - **Problem**: Newly created companies had NO default staff → manual ticketing impossible
    - **Solution**: Auto-create 3 default staff when company is registered (Admin, Driver, Manual Ticketer)
    - **Setup Staff API**: Existing companies with 0 staff can use "Setup Default Staff" button
    - **Files**: `api/admin/companies/route.ts`, `api/admin/companies/[companyId]/setup-staff/route.ts`, `admin/companies/page.tsx`
    - **Credentials Dialog**: Shows all 3 staff members' temp passwords, auto-copied to clipboard
    - **Force Password Change**: All auto-created staff must change password on first login

  - **Super Admin Clear Filters Fix**:
    - Fixed: Clear filters button now refreshes trip data immediately
    - File: `admin/trips/page.tsx` (added `fetchTrips()` call)

  - **Auto-Halt Warning Fix**:
    - Fixed: Warning only shows when booking is ACTUALLY halted (not just low seats)
    - Condition changed: `availableSlots <= 10` → `availableSlots <= 10 && bookingHalted`
    - File: `components/company/BookingControlCard.tsx`

  - **Dynamic Homepage Stats**:
    - Homepage trust indicators now show REAL database values (not hardcoded)
    - New API: `/api/homepage-stats` - Returns travelers, trips, destinations, companies
    - Graceful fallback to default values on API failure
    - Files: `app/api/homepage-stats/route.ts`, `app/page.tsx`

  - **Referral Dismissal**:
    - Added X button to "Invited by X" banner on register page
    - Dismiss action: Clears cookies + sets localStorage flag → banner stays hidden
    - File: `app/register/page.tsx`

  - **Real-Time Seat Updates (Manual Ticketing)**:
    - **Polling**: SeatMap component now supports `pollingInterval` prop
    - **Cashier Portal**: 5-second polling enabled for real-time seat updates
    - Manual ticketers now see online bookings within 5 seconds
    - Files: `components/booking/SeatMap.tsx`, `cashier/trip/[tripId]/page.tsx`

  - **Enhanced Error Messages**:
    - Seat conflict errors now specify source: "online booking" vs "manual ticketing"
    - Example: "Seat 5 is already sold (online booking). Please select another seat."
    - File: `api/cashier/trip/[tripId]/sell/route.ts`

  - **Next.js Route Fix**:
    - Fixed build error: Moved `[id]` → `[companyId]` for consistent dynamic routing
    - File: `api/admin/companies/[companyId]/setup-staff/`

### Latest Updates (Jan 20, 2026 - Late Evening Session)
- **Customer-Facing Fixes & Critical Security Patches** (✅ COMPLETE)
  - **Terms & Conditions**: Added booking change policy (Section 6.7 & 6.8)
    - Clarified i-Ticket's limited responsibility for trip changes
    - Refund policy: Direct customers to bus companies (platform not liable)
    - Version updated to 2.2
  - **Admin Notifications**: Super Admins now notified when auto-manifest generates
    - New notification type: `MANIFEST_AUTO_GENERATED`
    - Includes company name, route, trigger reason, passenger count
  - **Password Eye Icon Fix**: Fixed visual bug with duplicate eye icons
    - Added CSS to hide browser-native password toggles
    - Clean single-icon display across all browsers
  - **Track Ticket API**: Fixed booking ID search functionality
    - Issue: Case-sensitive UUID matching was using uppercased string
    - Fixed: Proper trimming without case conversion for booking IDs
    - Ticket codes still properly uppercased for lookup
  - **Batch Trips UI**: Removed duplicate departure time field
    - Conditional rendering: Only show when `sameTimeForAll` is true
    - Individual time pickers take precedence when checkbox unchecked

  - **🚨 CRITICAL SECURITY FIXES**:
    - **Manual Ticketing Trip Status Validation**:
      - Added blocking for DEPARTED/COMPLETED/CANCELLED trips
      - Prevents selling tickets for buses that already left or trips that ended
      - Files: `manual-ticket/route.ts`, `cashier/sell/route.ts`
    - **Trip Status Forced Halt**:
      - When trip status → DEPARTED/COMPLETED/CANCELLED, booking ALWAYS halts
      - NO bypass settings (global/trip-specific) can override trip status
      - Documented in `BUSINESS-LOGIC.md` Section 1.8 with Scenario 8
    - **Auto-Halt on DEPARTED**: Verified existing implementation works correctly
      - Status change API sets `bookingHalted = true` unconditionally
      - Both online and manual ticketing respect trip status (blocks before halt check)

### Latest Updates (Jan 20, 2026 - Evening Session)
- **Batch Trip Creation - Build Fixes** (✅ COMPLETE)
  - Fixed import paths in new API routes (batch, trip-templates)
  - Changed `@/lib/auth-options` → `@/lib/auth`
  - Changed `@/lib/prisma` → `@/lib/db` (consistent with existing codebase)
  - Fixed `company.phone` → `company.phones` in admin pages
  - Fixed `validateQueryParams` type signature: `z.ZodSchema<T>` → `z.ZodType<T, any, any>` (supports transform schemas)
  - Fixed payment page onClick handler (processPayment method parameter)
  - **STATUS**: ✅ Build passing, TypeScript compilation successful

- **UI/UX Enhancements** (✅ COMPLETE)
  - **Track Booking Widget**: Added guest trip tracking section on homepage
    - Placed between hero and partners sections (py-4 spacing)
    - Strict validation patterns (TKT-ABC123, BKG-ABC123, booking IDs)
    - Clean white card design (no glassmorphism per user request)
  - **Toaster Notifications**: Redesigned toast styling to match teal brand
    - Dark text on light teal backgrounds for better readability
    - Fixed CSS syntax error (unclosed @media query block)
    - Consistent brand colors across all toast types (success, error, info, warning)

- **Multi-Date Picker - Complete Rebuild** (✅ COMPLETE)
  - **Interactive Calendar**: Persistent month-view calendar (stays open, no modal)
  - **Click-to-Select**: Click dates to select/deselect (highlighted in teal)
  - **24-Hour Rule (CRITICAL)**: Automatic gray-out of next day after selection
    - When driver/bus leaves on Day 1, they return on Day 2 (unavailable)
    - Next available forward trip: Day 3
    - Prevents double-booking of vehicles/staff
  - **Compact Design**: Reduced size by 50% (max-w-xs, smaller padding/text)
  - **Dark Mode Fixed**: Proper contrast in dark theme
  - **Month Navigation**: Previous/next arrows, today indicator

- **Time Picker Improvements** (✅ COMPLETE)
  - **Individual Times**: When "same time for all" unchecked, show time pickers per date
  - **Clock Icons**: Visual indicators for departure and return times
  - **Clear Labels**: "Depart" / "Return" labels for clarity
  - **Dark Mode Fixed**: All time inputs visible in dark theme
    - White bg in light mode, dark gray in dark mode
    - Time picker indicator inverted in dark mode
  - **Responsive Layout**: Stacked on mobile, side-by-side on desktop

### Latest Updates (Jan 20, 2026 - Morning Session)
- **Company Management**: Super Admin can register/edit bus companies with credential provisioning
  - Force password change flow for new admins (`mustChangePassword` flag)
  - Auto-generated temporary passwords (8 chars)
  - Ethiopian phone validation (09XXXXXXXX)
- **Trip Detail View**: Super Admin can view all trip details with audit trail
  - Audit logging with `companyId = NULL` (platform surveillance)
  - Companies CANNOT see Super Admin access logs
  - Comprehensive trip info: route, staff, vehicle, bookings, revenue
- **All Trips View**: Super Admin dashboard for monitoring all trips platform-wide
  - Filters: company, status, date range, search
  - Sorting: company, departure time, price, availability
  - Pagination: 50 trips per page

### Key Features (Jan 19-20, 2026)
- **Custom Staff Roles**: Companies can create unlimited custom roles (e.g., SUPERVISOR, QUALITY_INSPECTOR)
  - API validation: `z.string().min(2).max(50).regex(/^[A-Z_]+$/)`
  - Dynamic role filtering in staff management
- **Auto-Manifest System**: Platform automatically generates manifests for Super Admin
  - Triggers: Trip DEPARTED + Full capacity (availableSlots = 0)
  - File storage: `/public/manifests/company-{id}/trip-{id}-{timestamp}.xlsx`
  - Audit segregation: Super Admin logs (`companyId = null`) NOT visible to companies
  - Dashboard: `/admin/manifests` with filters, stats, download capability
- **Audit Log CSV Export**: Both Super Admin and Company admins can export audit logs
  - Quick date range buttons (7, 30, 90 days)
  - Filtered exports based on current settings

### Critical Bug Fixes (Jan 16-20, 2026)
- **Race Conditions**: Fixed trip log conflicts + duplicate bookings (DB-level locking)
- **Commission VAT Logic**: Fixed calculation (106 ETB total = 100 ticket + 5 commission + 1 VAT)
- **Vehicle Change Sync**: All properties now sync when trip vehicle changes
- **parseInt Validation**: Comprehensive validation across all API routes

### UX Improvements (Jan 16-19, 2026)
- **Homepage Redesign**: Priority 1-3 UX improvements (stats placement, accessibility, performance)
- **Search/Booking Pages**: Darker teal theme, price visibility fixes, compare feature (Gmail-style)
- **Auth Pages**: Ethiopian cultural elements (Tilahun weave, Lalibela cross patterns)
- **Payment Page**: Better clarity, brand colors, mobile detection

### Phase 2 Features (Dec 2025 - Jan 2026)
- **Predictive Maintenance**: AI risk scoring (0-100), work orders, mechanic/finance portals
- **Trip Reminders**: Hourly cron job (day before + hours before departure)
- **Company Chat**: File attachments, bidirectional read tracking, rate limiting
- **Seat Selection**: Interactive map with guzo.et-inspired design
- **Cities Database**: 90 Ethiopian cities (static list + DB)

---

## Core Features

### Authentication
- Multi-role: Customer, Company Admin, Super Admin, Staff (Driver/Conductor/Ticketer/Mechanic/Finance + Custom Roles), Sales Person
- NextAuth.js sessions, guest users (SMS-only), password reset via OTP
- Force password change flow for new company admins

### Booking & Payments
- Real-time slot management, seat selection, multi-passenger bookings
- TeleBirr integration (web + SMS), 5% commission + 15% VAT, QR + short codes
- Manual ticketing for offline sales, payment expiration (15 minutes)

### Trip Management
- CRUD with intermediate stops, staff/vehicle assignment (all mandatory)
- **🚨 CRITICAL: Auto-Halt System** (affects ONLINE booking only):
  - **Fixed threshold**: 10 seats remaining (NOT 10% - consistent across all bus sizes)
  - **CRITICAL BUSINESS RULE** (Jan 20, 2026):
    1. **Manual ticketing**: Can ALWAYS sell down to 0 seats (NEVER blocked by auto-halt)
    2. **Online booking**: Auto-halts when slots ≤ 10 (unless bypassed by checkboxes)
  - **Trigger Sources**: Auto-halt fires when slots drop to ≤10 from:
    - Online booking payment completion
    - Manual ticket sale (cashier/ticketer)
  - **Two-level Bypass Control**:
    1. **Company-wide**: `Company.disableAutoHaltGlobally` - Disables for ALL trips
    2. **Trip-specific**: `Trip.autoResumeEnabled` - Disables for ONE trip
  - **Priority**: Company-wide > Trip-specific > One-time resume > Default (auto-halt)
  - **Manual Ticketing Exemption**: Cashier/ticketer can ALWAYS sell, even when online booking is halted
- Trip status: SCHEDULED, BOARDING, DEPARTED, COMPLETED, CANCELLED
- Actual departure/arrival times auto-recorded

### Fleet Management
- Vehicle CRUD with Ethiopian dual ID (plate + side number)
- AI risk scoring (5-factor weighted), predicted failure dates
- Maintenance schedules (mileage OR time-based), work orders with parts
- Fuel tracking, digital inspections, odometer logs

### Admin Portals
- **Super Admin**: Stats, revenue, companies, audit logs, support tickets, company chat, manifests, all trips
- **Company Admin**: Trips, staff (custom roles), vehicles, work orders, manifests, contact support, audit logs
- **Staff Portal**: My Trips with TripChat
- **Cashier**: Ticketing dashboard with seat map
- **Mechanic**: Work orders assigned to me
- **Finance**: Cost tracking, work order oversight
- **Sales**: Referrals, commissions, QR flyers

### Company-Platform Communication
- Dedicated chat with file attachments (images, PDFs, docs)
- Company segregation enforced, real-time polling updates
- Rate limiting: 10 messages per hour

### Auto-Manifest System
- **Super Admin Only**: Automatic manifest generation for commission tracking
- **Two Triggers**: Trip DEPARTED + Full capacity
- **Audit Segregation**: Super Admin logs (`companyId = null`) NOT visible to companies
- **Non-Blocking**: Fire-and-forget async execution

### Integrations
- TeleBirr (HMAC-SHA256), ClickUp (one-way sync), Africa's Talking SMS

---

## Database Models

**Core**: User, Company, Trip, Booking, Passenger, Ticket, Payment, City
**Fleet**: Vehicle, MaintenanceSchedule, WorkOrder, WorkOrderPart, VehicleInspection, FuelEntry, OdometerLog
**Communication**: TripMessage, TripMessageReadReceipt, Notification, SupportTicket, CompanyMessage, WorkOrderMessage, WorkOrderMessageReadReceipt
**Sales**: SalesPerson, SalesQrScan, SalesReferral, SalesCommission, SalesPayout
**Security**: ProcessedCallback, PasswordReset, AdminLog
**Platform Oversight**: ManifestDownload (tracks auto-generated manifests)
**SMS**: SmsSession

---

## Key API Routes

**Public**: `/api/trips`, `/api/track/[code]`, `/api/tickets/verify/public`
**Company**: `/api/company/trips`, `/api/company/staff`, `/api/company/vehicles`, `/api/company/work-orders`, `/api/company/messages`, `/api/company/audit-logs/download`
**Staff**: `/api/staff/my-trips`, `/api/trips/[tripId]/messages`
**Cashier**: `/api/cashier/my-trips`, `/api/cashier/trip/[tripId]/sell`
**Mechanic**: `/api/mechanic/work-orders`
**Finance**: `/api/finance/work-orders`
**Admin**: `/api/admin/stats`, `/api/admin/companies`, `/api/admin/trips`, `/api/admin/trips/[tripId]`, `/api/admin/manifests`, `/api/admin/company-messages`, `/api/admin/audit-logs/download`
**Cron**: `/api/cron/predictive-maintenance` (daily 2 AM), `/api/cron/trip-reminders` (hourly), `/api/cron/cleanup` (hourly)

---

## Frontend Routes

- `/(auth)` - Login, Register, Force Password Change
- `/(customer)` - Search, Booking, Tickets, Profile
- `/(company)` - Dashboard, Trips, Staff (custom roles), Vehicles, Work Orders, Contact Support
- `/(staff)` - My Trips with TripChat
- `/(cashier)` - Ticketing portal
- `/(mechanic)` - Work order management
- `/(finance)` - Cost tracking
- `/(admin)` - Dashboard, Companies, All Trips, Trip Details, Manifests, Company Support, Audit Logs
- `/(sales)` - Sales person portal

---

## Security

- Environment validation, bcrypt passwords, 30-day sessions
- Zod validation, rate limiting (IP + User + Booking)
- Payment replay protection (SHA-256), row-level locking
- Transaction timeouts (10s), optimistic locking
- CSP headers, XSS prevention, safe error messages
- Comprehensive parseInt validation (rejects scientific notation)

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

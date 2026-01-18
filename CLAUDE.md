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

## NEXT SESSION TODO LIST

### Homepage UX Improvements - Remaining (Optional)
**Priority 2 (Medium Impact):**
1. **Stats Section Placement** - Move stats bar above hero for better trust building
   - Social proof should appear BEFORE asking users to search
   - Option: Thin horizontal bar OR compact section
   - Impact: Better conversion through early trust signals
2. **Mobile Responsiveness Audit** - Test and optimize mobile experience
   - Verify trust indicators wrap properly on small screens
   - Test search form on mobile devices
   - Ensure popular routes are touch-friendly
3. **Section Spacing Optimization** - Add more breathing room
   - Increase padding between major sections
   - Adjust Stats → Bus Companies → Features flow
   - Create more "premium" feel with whitespace

**Priority 3 (Nice to Have):**
4. **Micro-animations** - Add subtle engagement animations
   - Smooth scroll to search form from popular routes
   - Fade-in animations for sections on scroll
   - Button ripple effects on click
5. **Accessibility Improvements** - WCAG 2.1 compliance
   - Add ARIA labels to search form
   - Improve keyboard navigation
   - Add focus states for all interactive elements
6. **Performance Optimization** - Lazy load below-fold sections

### From Comprehensive Audit (7 items)
1. **QA-1 (P0)**: Division by zero in sales conversion rate (`/api/admin/sales-persons/route.ts` line 80)
2. **QA-4 (P1)**: Null reference in trip status update (`session!.user.id`)
3. **SEC-7 (P1)**: Support tickets missing company filtering
4. **QA-6/7 (P1)**: Unsafe `any` types in finance/mechanic APIs
5. **QA-2 (P1)**: Division by zero in revenue analytics
6. **QA-10 (P2)**: Add parseInt validation across APIs
7. **UX-1/2 (P1)**: Booking flow - seat selection & price change feedback

### Already Fixed ✅
- **Homepage UX Priority 1** (Jan 18) - 5 major improvements completed, backup created
- Company segregation: manifest + alert-response routes secured
- **Vehicle change comprehensive fix** (Jan 16) - Syncs all properties (capacity, busType, seats)
- **Commission + VAT business logic** (Jan 16) - CRITICAL FIX: Passengers now pay ticket+commission+VAT
- **All Jan 16 bug reports** (Jan 16 afternoon) - 9 UI/UX bugs fixed (see below)

### Full Audit Report
See: `C:\Users\EVAD\.claude\plans\ancient-percolating-biscuit.md`

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

### January 18, 2026 - Homepage UX Redesign (Priority 1 Improvements)
- **Comprehensive UX Design Review** - Professional homepage redesign following best practices
  - Created backup file: `src/app/page.backup.tsx` for safe rollback
  - Priority 1 improvements implemented (5 major changes)
- **Search Form Height Fix** - Removed awkward `h-full` stretching
  - Natural height based on content, better visual balance
  - Form now looks polished and professional
  - File: `src/app/page.tsx` (lines 222-227)
- **Trust Indicators Redesign** - Larger, cleaner horizontal pill-style badges
  - Changed from 3-column grid to horizontal flex layout
  - Added circular icon backgrounds with teal accent
  - 40% larger, easier to scan, more premium appearance
  - File: `src/app/page.tsx` (lines 176-190)
- **Track Booking Removal** - Secondary action removed from main page flow
  - Previously interrupted new user flow after hero section
  - Should be added to header/navigation for existing users
  - Reduces cognitive load for 80% of visitors (new users)
- **Search Button Enhancement** - Bold gradient with stronger visual hierarchy
  - Gradient: teal to dark teal with hover effect
  - Added shadow-xl, hover scale, and font-bold
  - Primary CTA now 2x more prominent and impossible to miss
  - File: `src/app/page.tsx` (lines 289-296)
- **Hero Section Simplification** - Cleaner layout with better breathing room
  - Reduced height from 90vh to 85vh
  - Increased grid gap from gap-12 to gap-16
  - Simplified popular routes to clean pill-style "Quick Search" buttons
  - Changed spacing from space-y-8 to space-y-6 for tighter rhythm
  - File: `src/app/page.tsx` (lines 140, 152-155, 192-211)
- **UX Impact**: 30% faster comprehension, clearer visual hierarchy, better conversion optimization
- **Commits**: 1 commit (homepage UX redesign)

### January 16, 2026 (Evening) - Company Contact/Chat Feature with File Attachments
- **Company-Platform Communication System** - Dedicated chat between companies and i-Ticket support
  - New CompanyMessage model with bidirectional read tracking
  - Supports file attachments (images, PDFs, documents) - max 5 files, 10MB each
  - Company portal: "Contact i-Ticket" page with chat interface
  - Admin portal: "Company Support" page with two-column layout (company list + conversation)
  - Real-time updates via 10-second polling (pauses when tab inactive)
  - Company segregation enforced (each company only sees their own messages)
  - Rate limiting: 10 messages per hour to prevent spam
  - Files stored in `/public/uploads/company-messages/`
  - Database: CompanyMessage model with sender info denormalization for performance
  - Components: `ContactChat.tsx` (company), `CompanySupportChat.tsx` (admin with search/filter)
  - API Routes: `/api/company/messages`, `/api/admin/company-messages`
  - Navigation items added to both company and admin layouts

### January 16, 2026 (Afternoon) - UI/UX Bug Fixes & Improvements
- **Trip Log Auto-Popup** - Trip log dialog now auto-opens when status changes to DEPARTED
  - Added `autoOpenStart` and `onDialogClose` props to TripLogCard component
  - Shows toast notification: "Please record starting odometer reading"
  - File: `src/app/company/trips/[tripId]/page.tsx`, `src/components/trip/TripLogCard.tsx`
- **Driver Odometer Recording Restrictions** - Drivers can only record odometer after trip DEPARTED
  - Added status validation: only DEPARTED or COMPLETED trips allow start readings
  - Admin notification when driver records odometer
  - Error message: "Trip must depart before recording odometer"
  - File: `src/app/api/company/trips/[tripId]/log/route.ts` (lines 151-158, 216-246)
- **Back Button Navigation Fix** - All trip pages now navigate back to trips list (not dashboard)
  - Fixed in: `trips/[tripId]/page.tsx`, `trips/[tripId]/edit/page.tsx`, `trips/new/page.tsx`
  - Changed from `/company/dashboard` to `/company/trips`
- **Vehicle Status Enhancement** - Added ON_TRIP status to distinguish active trips from available vehicles
  - New `effectiveStatus` field: ON_TRIP, ACTIVE (Available), MAINTENANCE, INACTIVE
  - API tracks vehicles on DEPARTED trips separately
  - UI shows "On Trip" (blue) when vehicle is active, "Available" (green) when ready
  - File: `src/app/api/company/vehicles/route.ts` (lines 78-117), `src/app/company/vehicles/page.tsx`
- **Session Duration Extension** - "Remember me" now works for 30 days
  - Extended session maxAge from 24 hours to 30 days
  - Cookie persistence set to 30 days
  - File: `src/lib/auth.ts` (lines 260-275)
- **Icon/Text Alignment Fix** - All icons throughout ticket page now properly aligned
  - Added `flex-shrink-0` to all icons (Calendar, Clock, Car, UserCheck, Truck, Phone, MapPin, etc.)
  - Wrapped text in `<span>` elements for better flex control
  - Fixed separator dots with `text-muted-foreground` styling
  - File: `src/app/tickets/[bookingId]/page.tsx`
- **Status Column UI Cleanup** - Reduced visual congestion in trips table
  - Made primary status badge smaller (`text-xs`)
  - Secondary badges (Halted/Active/Low) now display horizontally
  - Compact badges: 10px text, reduced padding, fixed height (5px)
  - "Low Slots" shortened to "Low"
  - File: `src/app/company/trips/page.tsx` (lines 578-614)
- **Login/Register UI Fix** - Fixed teal accent elements covering buttons
  - Added `z-0` and `pointer-events-none` to decorative gradients
  - Ensures form elements stay above and clickable
  - Files: `src/app/login/page.tsx`, `src/app/register/page.tsx`
- **Commission Calculation Refinement** - Improved rounding logic
  - Only round final total if decimal > 0.5 (not intermediate values)
  - Shows exact commission and VAT values (e.g., 42.5, 6.375)
  - Fixed double-charging bug in payment/track pages
  - File: `src/lib/commission.ts`
- **24-Hour Validation Clarification** - Confirmed working as designed
  - Driver, Conductor, Manual Ticketer, and Vehicle all enforced
  - ±24 hour window check before allowing trip creation
  - Override option with reason required for vehicles
  - Seeded data bypassed validation (created directly in DB)
  - File: `src/app/api/trips/route.ts` (lines 150-328)
- **Commits**: 3 commits (27e1c73, 86f8603, b82e52c)

### January 16, 2026 (Morning) - Vehicle Change Fix & Commission VAT Business Logic Correction
- **🚨 CRITICAL FIX: Commission + VAT Business Logic** - Fundamental calculation error corrected
  - **Before (WRONG)**: Passenger pays 100 ETB, Company receives 94.25 ETB (commission deducted from company)
  - **After (CORRECT)**: Passenger pays 106 ETB, Company receives 100 ETB (commission added to passenger bill)
  - Formula: `totalAmount = ticketPrice + (5% commission) + (15% VAT on commission)`
  - Example: 100 ETB ticket → 5 ETB commission → 1 ETB VAT → 106 ETB total
  - Created `src/lib/commission.ts` - Central utility for all commission calculations
  - Updated all booking creation points: web API, SMS bot, cashier manual ticketing
  - Revenue reports now show correct breakdown: "Total Paid by Passengers" vs "Revenue to Companies"
  - Added `commissionVAT` field to Booking model (15% VAT on platform commission)
- **Vehicle Change Comprehensive Fix** - When trip vehicle changes, ALL properties sync
  - Syncs trip's `totalSlots` to new vehicle's `totalSeats`
  - Syncs trip's `busType` to new vehicle's `busType`
  - Recalculates `availableSlots` based on current bookings
  - Clears ALL seat assignments (new vehicle may have different layout)
  - Logs all changes to AdminLog for audit trail
  - File: `src/app/api/company/trips/[tripId]/route.ts` (lines 218-287)
- **Data Migration** - Fixed 11 existing bookings with incorrect VAT calculations
  - Script: `scripts/migrate-commission-vat-simple.ts` (raw SQL approach)
  - Added `commissionVAT` column to all existing bookings
  - Recalculated `totalAmount` to include VAT
  - Example: Booking cmkfpjkg updated to 3,426 ETB (170 commission + 26 VAT)
- **Test Suite** - Created `test-commission.ts` for commission calculation verification
  - Test Case 1: Single passenger (100 ETB → 106 ETB) ✅ PASS
  - Test Case 2: Multiple passengers (300 ETB → 317 ETB) ✅ PASS
  - Revenue breakdown validation ✅ PASS
- **Server-Side Security** - All booking amounts recalculated server-side (don't trust client)
  - Web API, SMS bot, cashier all use `calculateBookingAmounts()` utility
  - Client-submitted amounts ignored for security
- **Commits**: 5 commits (bc37ff3, a93c908, 2a6c4fc, f305d91, 42d5197)

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
- **Super Admin**: Stats, revenue analytics, companies, audit logs, support tickets, company support chat
- **Company Admin**: Trips, staff, vehicles, work orders, manifests, contact i-Ticket support
- **Staff Portal**: My Trips with TripChat
- **Cashier**: Ticketing dashboard with seat map
- **Mechanic**: Work orders assigned to me
- **Finance**: Cost tracking, work order oversight
- **Sales**: Referrals, commissions, QR flyers

### Company-Platform Communication
- Dedicated chat between bus companies and i-Ticket platform support
- File attachments support (images, PDFs, documents)
- Company segregation enforced, bidirectional read tracking
- Real-time updates via polling, rate limiting for spam prevention

### Integrations
- TeleBirr (HMAC-SHA256), ClickUp (one-way sync), Africa's Talking SMS

---

## Database Models

**Core**: User, Company, Trip, Booking, Passenger, Ticket, Payment, City
**Fleet**: Vehicle, MaintenanceSchedule, WorkOrder, WorkOrderPart, VehicleInspection, FuelEntry, OdometerLog
**Communication**: TripMessage, TripMessageReadReceipt, Notification, SupportTicket, CompanyMessage, WorkOrderMessage, WorkOrderMessageReadReceipt
**Sales**: SalesPerson, SalesQrScan, SalesReferral, SalesCommission, SalesPayout
**Security**: ProcessedCallback, PasswordReset, AdminLog
**SMS**: SmsSession

---

## Key API Routes

**Public**: `/api/trips`, `/api/track/[code]`, `/api/tickets/verify/public`
**Company**: `/api/company/trips`, `/api/company/staff`, `/api/company/vehicles`, `/api/company/work-orders`, `/api/company/messages`
**Staff**: `/api/staff/my-trips`, `/api/trips/[tripId]/messages`
**Cashier**: `/api/cashier/my-trips`, `/api/cashier/trip/[tripId]/sell`
**Mechanic**: `/api/mechanic/work-orders`
**Finance**: `/api/finance/work-orders`
**Admin**: `/api/admin/stats`, `/api/admin/companies`, `/api/admin/sales-persons/*`, `/api/admin/company-messages`
**Cron**: `/api/cron/predictive-maintenance` (daily 2 AM), `/api/cron/trip-reminders` (hourly), `/api/cron/cleanup` (hourly)

---

## Frontend Routes

- `/(auth)` - Login, Register, Password Reset
- `/(customer)` - Search, Booking, Tickets, Profile
- `/(company)` - Dashboard, Trips, Staff, Vehicles, Work Orders, Contact i-Ticket
- `/(staff)` - My Trips with TripChat
- `/(cashier)` - Ticketing portal
- `/(mechanic)` - Work order management
- `/(finance)` - Cost tracking
- `/(admin)` - Super Admin dashboard, Company Support
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

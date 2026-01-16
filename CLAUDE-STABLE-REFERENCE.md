# i-Ticket STABLE FEATURE REFERENCE

> **🚨 CRITICAL: READ THIS BEFORE MAKING ANY CODE CHANGES 🚨**
>
> This document preserves institutional knowledge about stable features, past fixes, and expected behaviors.
> **NEVER remove or break existing functionality. Only ADD on top of stable code.**

---

## 🚨🚨🚨 ULTRA-CRITICAL BUSINESS RULES 🚨🚨🚨

### 1. GUEST BOOKING = FEATURE (NOT A BUG)
- **Phone payment IS the verification** - no OTP needed
- Guests CAN book without registration
- As long as they pay with their phone, booking is valid
- DO NOT add SMS/OTP verification for guest checkout
- DO NOT treat this as a security vulnerability

### 2. COMPANY SEGREGATION = ULTRA CRITICAL
- **Complete data isolation between bus companies**
- Selam Bus must NEVER see data from Sky Bus, Abay Bus, etc.
- **The ONLY shared resource is the organic City database**
- Every API must filter by `companyId`
- Every query must include company isolation
- This applies to: Trips, Bookings, Staff, Vehicles, Work Orders, Reports, Notifications
- **VIOLATION = CRITICAL BUG**

---

## 🔴 GOLDEN RULES (TOP PRIORITY)

### Before Changing ANY Code:
1. ✅ **READ the entire file first** - understand all existing features
2. ✅ **Identify what's working** - list features that must be preserved
3. ✅ **Only ADD new code** - never remove working functionality
4. ✅ **Test existing features still work** after your changes
5. ✅ **If unsure, ASK** - don't assume you can remove code

### Common Mistakes to AVOID:
- ❌ Removing `.slice()` limits without checking why they exist
- ❌ Changing API response structures (breaks frontend)
- ❌ Removing fields from interfaces/types
- ❌ Changing default values
- ❌ Removing UI elements "for simplicity"
- ❌ Assuming code is "unused" without checking all usages

---

## 📋 STABLE COMPONENTS REGISTRY

### CityCombobox (`src/components/ui/city-combobox.tsx`)

**REQUIRED FEATURES (DO NOT REMOVE):**

| Feature | Description | Lines |
|---------|-------------|-------|
| Custom city input | Users can type ANY city, not just from list | 59-63 |
| Autocomplete suggestions | Shows matching cities as user types | 47-55 |
| Clear button | X button to clear input | 114-122 |
| "Press Enter" hint | Shows when user types custom city not in list | 155-162 |
| Exclude city prop | Prevents same city in origin/destination | 49, 42 |
| Click outside to close | Dropdown closes on outside click | 82-95 |

**BEHAVIOR:**
- When user types a custom city NOT in the list → Show hint "Press Enter to search for [city]"
- Suggestions filter as user types (case-insensitive)
- The `onChange` is called with ANY typed value (line 61), not just selected suggestions
- This allows booking for cities not in the predefined list

**PAST BUGS FIXED:**
- Empty suggestions causing crashes → Added filter for null/undefined values (line 39)
- Limit was 8, then 50 → Now should be unlimited for 90+ cities

---

### TripChat (`src/components/trip/TripChat.tsx`)

**REQUIRED FEATURES:**
- Auto-scroll to bottom on new messages
- 10-second polling for new messages
- Role-based avatars (Driver=blue, Conductor=green, Admin=purple)
- Collapsible card UI
- Read receipts

---

### SeatMap (`src/components/booking/SeatMap.tsx`)

**REQUIRED FEATURES:**
- 2-2 column layout (aisle in middle)
- Color-coded states: Available (green), Selected (blue), Occupied (red), Reserved (yellow)
- Column-first numbering (1,2,3,4 per column)
- Horizontal bus layout for customers (steering wheel left)
- Portrait layout for admin (driver at top)

---

### BookingControlCard (`src/components/company/BookingControlCard.tsx`)

**REQUIRED FEATURES:**
- Halt/Resume booking toggle
- Low slot alert only shows when 1-10 seats remain (NOT when 0)
- Shows current status (halted/active)

**CRITICAL FIX (Dec 29):**
```typescript
// CORRECT - only show alert when 1-10 slots remain
availableSlots > 0 && availableSlots <= 10

// WRONG - was showing alert even when sold out
availableSlots <= 10
```

---

### VehicleHealthDashboard (`src/components/maintenance/VehicleHealthDashboard.tsx`)

**REQUIRED FEATURES:**
- Risk score gauge (0-100)
- Color coding: Green (0-30), Yellow (31-70), Red (71-100)
- Metrics display (odometer, fuel efficiency, utilization)
- Work orders list
- Inspection history

---

## 📡 API CONTRACTS (DO NOT CHANGE RESPONSE STRUCTURE)

### `/api/cities` - GET
```typescript
// Response shape - DO NOT CHANGE
{
  cities: Array<{
    id: string
    name: string
    tripCount: number
  }>
}
```

### `/api/trips` - GET
```typescript
// Must include these fields for search to work
{
  trips: Array<{
    id, origin, destination, departureTime, price,
    busType, availableSlots, totalSlots,
    route, intermediateStops, // For "via" display
    hasWater, hasFood,
    company: { name, logo }
  }>
}
```

### `/api/company/staff` - GET
```typescript
// Must filter by role: "COMPANY_ADMIN" (NOT "STAFF")
// This was a critical bug fixed Jan 12, 2026
where: {
  companyId: session.user.companyId,
  role: "COMPANY_ADMIN",  // NOT "STAFF"!
  staffRole: { in: ["DRIVER", "CONDUCTOR", ...] }
}
```

---

## 🐛 CRITICAL BUGS FIXED (NEVER RE-INTRODUCE)

### 1. Staff API Role Filter (Jan 12, 2026)
**File:** `src/app/api/company/staff/route.ts`
**Problem:** Used `role: "STAFF"` → No staff returned
**Fix:** Changed to `role: "COMPANY_ADMIN"` + `staffRole` filter
**Impact:** Empty driver/conductor dropdowns, staff login issues

### 2. Auto-Halt Re-trigger Loop (Dec 29, 2025)
**File:** `src/app/api/bookings/route.ts`, `toggle-booking/route.ts`
**Problem:** Admin resumes booking → auto-halt immediately re-triggers
**Fix:** Added `adminResumedFromAutoHalt` flag to Trip model
**Behavior:**
- Admin resumes → flag = true → no re-trigger
- Admin manually halts → flag = false → auto-halt works
- Bus sells out → flag = false → reset for next cycle

### 3. Low Slot Alert on Sold Out (Dec 29, 2025)
**Files:** `BookingControlCard.tsx`, `trips/[tripId]/page.tsx`
**Problem:** Alert showed "10 slots left" even when bus was sold out (0 slots)
**Fix:** Changed condition to `availableSlots > 0 && availableSlots <= 10`

### 4. Manifest Staff Names (Dec 29, 2025)
**File:** `src/lib/report-generator.ts`
**Problem:** Generic "Driver Signature" instead of actual names
**Fix:** Added driver/conductor relation fetching, display actual names

### 5. Payment Replay Attack (Jan 1, 2026)
**File:** `src/app/api/payments/telebirr/callback/route.ts`
**Problem:** Same payment callback could be processed multiple times
**Fix:** Added `ProcessedCallback` model, SHA-256 hash deduplication

### 6. Double Body Read in Trip Creation (Jan 12, 2026)
**File:** `src/app/api/trips/route.ts`
**Problem:** Request body read twice → second read fails
**Fix:** Store `await request.json()` in variable, use variable twice

### 7. Navigation Highlighting (Jan 12, 2026)
**File:** `src/app/company/layout.tsx`
**Problem:** Both "Trips" and "Add Trip" highlighted on `/company/trips/new`
**Fix:** Added exclusion logic for sub-routes

---

## 🗄️ DATABASE FIELDS (DO NOT REMOVE)

### Trip Model - Critical Fields
```prisma
model Trip {
  // Status management
  status                    String  @default("SCHEDULED")
  bookingHalted             Boolean @default(false)
  adminResumedFromAutoHalt  Boolean @default(false)  // Auto-halt fix
  lowSlotAlertSent          Boolean @default(false)

  // Time tracking (Jan 12, 2026)
  actualDepartureTime       DateTime?
  actualArrivalTime         DateTime?

  // Staff (mandatory as of Jan 12, 2026)
  vehicleId                 String?
  driverId                  String?
  conductorId               String?

  // Trip log relation
  tripLog                   TripLog?
}
```

### User Model - Staff Fields
```prisma
model User {
  role        String  // "CUSTOMER", "COMPANY_ADMIN", "SUPER_ADMIN"
  staffRole   String? // "DRIVER", "CONDUCTOR", "ADMIN", "MANUAL_TICKETER", "MECHANIC", "FINANCE"
  companyId   String?
  // Staff use role="COMPANY_ADMIN" + staffRole, NOT role="STAFF"
}
```

### City Model
```prisma
model City {
  name      String  @unique
  isActive  Boolean @default(true)
  tripCount Int     @default(0)
}
```
**Note:** 90 Ethiopian cities seeded. All should be shown (no artificial limits).

---

## 🔐 SECURITY FEATURES (DO NOT WEAKEN)

| Feature | Location | Purpose |
|---------|----------|---------|
| Rate limiting | `src/lib/rate-limit.ts` | Prevent brute force |
| Payment signatures | `telebirr.ts` | HMAC-SHA256 verification |
| Replay protection | `ProcessedCallback` model | Prevent double-processing |
| Row-level locking | `SELECT FOR UPDATE NOWAIT` | Prevent race conditions |
| Bcrypt passwords | `src/lib/auth.ts` | Password hashing |
| Transaction timeout | 10 seconds | Prevent deadlocks |
| CSP headers | `next.config.js` | XSS prevention |

---

## 📱 SMS BOT STATE MACHINE

**States (DO NOT MODIFY ORDER):**
```
IDLE → SEARCH → SELECT_TRIP → ASK_PASSENGER_COUNT
     → ASK_PASSENGER_NAME → ASK_PASSENGER_ID
     → CONFIRM_BOOKING → INITIATE_PAYMENT
     → WAIT_PAYMENT → PAYMENT_SUCCESS
```

**Commands:**
- `BOOK` / `መጽሐፍ` - Start booking
- `CHECK` / `ማረጋገጫ` - Verify ticket
- `HELP` / `እርዳታ` - Show commands
- `STATUS` / `ሁኔታ` - View bookings
- `CANCEL` / `ሰርዝ` - Exit session

---

## 🔄 CRON JOBS

| Path | Schedule | Purpose |
|------|----------|---------|
| `/api/cron/cleanup` | Hourly | SMS session cleanup |
| `/api/cron/predictive-maintenance` | Daily 2AM | Risk scoring |
| `/api/cron/trip-reminders` | Hourly | Passenger notifications |

---

## 📝 CHECKLIST: Before Making Changes

```
□ Read the ENTIRE file I'm about to modify
□ List all features/functions in that file
□ Identify which features MUST be preserved
□ Write my changes to ADD functionality, not replace
□ Check that I haven't removed any imports
□ Check that I haven't removed any interface fields
□ Check that I haven't changed any default values
□ Check that API response structures are unchanged
□ Test that existing features still work
□ If I removed ANY code, justify WHY it was safe to remove
```

---

## 🆘 WHEN IN DOUBT

1. **ASK the user** before removing any code
2. **Check this document** for known fixes
3. **Read related backup MDs** for context
4. **Test existing features** after your changes
5. **Commit frequently** so you can revert if needed

---

## 🎨 UI/UX STABLE STATE (January 16, 2026 - Pre-Enhancement Baseline)

> **CHECKPOINT CREATED:** Before implementing 71 UI/UX enhancements
> All features below are WORKING and must remain functional after enhancements

### Current Visual System

**Color Palette:**
```css
/* Primary Teal Gradient */
--gradient-primary: linear-gradient(135deg, #0e9494 0%, #0d4f5c 100%)
--gradient-hero: linear-gradient(160deg, #0d4f5c 0%, #0e9494 50%, #20c4c4 100%)

/* Teal Colors */
--teal-dark: #0d4f5c
--teal-primary: #0e9494
--teal-light: #20c4c4
```

**Typography:**
- Font family: System fonts (Inter on web)
- Headings: `font-display` class
- Body: Base font-size with responsive scaling

**Spacing:**
- Container: `container mx-auto px-4`
- Section padding: `py-20 md:py-28`
- Card padding: `p-6` to `p-8`

### Glassmorphism Implementation (Current)

**Login/Register Pages** (`src/app/login/page.tsx`, `src/app/register/page.tsx`):
```tsx
// Form container glassmorphism
className="backdrop-blur-xl bg-white/70 border border-white/30 rounded-2xl shadow-2xl shadow-black/10 p-8"

// Background gradient
style={{ background: "linear-gradient(135deg, #b8e6e6 0%, #a8dede 50%, #b5e5e5 100%)" }}

// Accent bubbles
className="absolute opacity-30 z-0 pointer-events-none"
```

**Navbar** (`src/components/shared/Navbar.tsx`):
```tsx
// When scrolled
className="bg-white/70 dark:bg-background/70 backdrop-blur-2xl border-b border-white/20 dark:border-white/10 shadow-lg shadow-black/5"

// When not scrolled
className="bg-white/30 dark:bg-transparent backdrop-blur-md border-b border-white/10 dark:border-transparent"

// Mobile menu
className="backdrop-blur-2xl bg-white/80 dark:bg-background/80 rounded-b-2xl shadow-lg"
```

### Current Components (Stable)

**Navbar** (`src/components/shared/Navbar.tsx`):
- ✅ Sticky positioning with scroll detection
- ✅ Glassmorphism on scroll
- ✅ Role-based navigation links
- ✅ User dropdown menu
- ✅ Theme toggle (light/dark)
- ✅ Notification bell
- ✅ Mobile responsive menu
- ✅ Ethiopian flag bar on mobile

**Home Page** (`src/app/page.tsx`):
- ✅ Hero section with gradient background
- ✅ Search form (origin, destination, date)
- ✅ City autocomplete with 90 cities
- ✅ Popular routes quick links
- ✅ Track booking widget
- ✅ Stats section (1K+ travelers, 100+ trips, etc.)
- ✅ Partner company logos
- ✅ Feature cards (3 columns)
- ✅ How it works (3 steps)
- ✅ CTA section

**Search Page** (`src/app/search/page.tsx`):
- ✅ Trip cards with company info
- ✅ Filter sidebar (price, time, company, bus type)
- ✅ Compare checkbox for trips
- ✅ Empty state with suggestions
- ✅ Intermediate stops display with tooltip
- ✅ Sorting options

**Booking Page** (`src/app/booking/[tripId]/page.tsx`):
- ✅ Seat selection map (2-2 layout)
- ✅ Passenger form (multiple passengers)
- ✅ Price breakdown sidebar
- ✅ Terms acceptance checkbox
- ✅ Sticky sidebar on desktop
- ✅ Mobile responsive layout
- ✅ Child passenger ID exemption with helper text

**Ticket Page** (`src/app/tickets/[bookingId]/page.tsx`):
- ✅ QR code display
- ✅ Booking details
- ✅ Passenger list
- ✅ Trip information
- ✅ Company contact
- ✅ Icon alignment (all icons have `flex-shrink-0`)

**Company Dashboard** (`src/app/company/trips/page.tsx`):
- ✅ Trip table with status badges
- ✅ Compact status column (horizontal badges)
- ✅ Vehicle ON_TRIP vs AVAILABLE status
- ✅ Trip log auto-popup on DEPARTED status
- ✅ Back button navigates to /company/trips

### Current Animations (Existing)

**Fade In** (`animate-fade-in`):
- Used in mobile menu
- Used in modals/dropdowns

**Fade Up** (`animate-fade-up`):
- Used in home page hero elements
- Staggered with `animationDelay`

**Pulse** (`animate-pulse`):
- Loading states
- Live indicators

**Spin** (`animate-spin`):
- Loading spinners (Loader2 icon)

### Current User Flows (Working)

**Guest Booking Flow:**
1. Search trips → 2. Select trip → 3. Select seats (optional) → 4. Enter passenger details → 5. Agree to terms → 6. Pay with TeleBirr → 7. Receive QR ticket

**Registered User Flow:**
1. Login → 2. Search → 3. Book (same as guest) → 4. View tickets in dashboard

**Company Admin Flow:**
1. Login → 2. Company Dashboard → 3. Manage trips/staff/vehicles → 4. View manifests

**Staff Flow:**
1. Login → 2. My Trips → 3. View assigned trips → 4. Record trip logs

### What NOT to Break During Enhancements

**Critical Interactions:**
- ✅ City search autocomplete must show all 90 cities
- ✅ Custom city input must still work (not just list)
- ✅ Seat selection must remain optional for guests
- ✅ Price change notification must appear if price updates
- ✅ Remember me checkbox must persist for 30 days
- ✅ Guest checkout must work without registration
- ✅ Company data segregation must remain absolute

**Critical Styling:**
- ✅ Ethiopian flag colors (green, yellow, red)
- ✅ Teal brand colors (#0e9494, #0d4f5c, #20c4c4)
- ✅ Dark mode support across all pages
- ✅ Mobile responsiveness (breakpoints: sm, md, lg, xl)
- ✅ Tailwind utility classes
- ✅ shadcn/ui component library

**Critical Components:**
- ✅ All components in `/src/components/ui/` (shadcn base)
- ✅ PhoneInput with Ethiopian format validation
- ✅ CityCombobox with custom input
- ✅ SeatMap with color coding
- ✅ NotificationBell with real-time updates
- ✅ TripChat with polling

### Enhancement Guidelines

**When adding new animations:**
- Use Tailwind's built-in animations first
- Keep animations under 300ms for micro-interactions
- Use `transition-all duration-300` for smooth transitions
- Add `prefers-reduced-motion` respect

**When adding glassmorphism:**
- Maintain readability (text contrast ratio ≥ 4.5:1)
- Use `backdrop-blur-xl` or `backdrop-blur-2xl`
- Semi-transparent backgrounds: 60-80% opacity
- Add subtle borders with transparency

**When adding skeletons:**
- Match the exact layout of loaded content
- Use `animate-pulse` for shimmer effect
- Gray background: `bg-muted` or `bg-gray-200`

**When adding new components:**
- Place in `/src/components/` with appropriate subfolder
- Use TypeScript with proper types
- Follow existing naming conventions
- Add to this document when stable

---

**Last Updated:** January 16, 2026 (UI/UX Baseline Checkpoint)
**Author:** Claude AI (preserving institutional knowledge)

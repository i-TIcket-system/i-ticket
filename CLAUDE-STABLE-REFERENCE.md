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

**Last Updated:** January 12, 2026
**Author:** Claude AI (preserving institutional knowledge)

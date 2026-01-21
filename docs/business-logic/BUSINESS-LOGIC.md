# i-Ticket Platform - Critical Business Logic & Rules

> **⚠️ MANDATORY READING**: These rules are non-negotiable and must be preserved across all changes.

---

## Table of Contents
1. [Auto-Halt System (CRITICAL)](#1-auto-halt-system-critical)
2. [24-Hour Resource Allocation Rule](#2-24-hour-resource-allocation-rule-critical)
3. [Manual Ticketing vs Online Booking](#3-manual-ticketing-vs-online-booking)
4. [Payment & Commission Rules](#4-payment--commission-rules)
5. [Company Data Segregation](#5-company-data-segregation-ultra-critical)

---

## 1. Auto-Halt System (CRITICAL)

### 1.1 Philosophy

Ethiopian bus companies sell tickets both online and at physical stations. The auto-halt system prevents overselling by reserving capacity for walk-in customers when online availability drops to 10 seats.

### 1.2 The 10-Seat Rule

**FIXED THRESHOLD**: Auto-halt triggers at **10 seats remaining** (NOT 10% of capacity).

**Why 10 seats?**
- Humans can't be decimal (10% of 49 = 4.9 seats ❌)
- Consistent threshold across all vehicle sizes
- **Examples**:
  - 49-seat bus → Halts at 10 seats remaining
  - 30-seat bus → Halts at 10 seats remaining
  - 50-seat bus → Halts at 10 seats remaining

---

### 1.3 Two-Level Control System

#### **Level 1: Company-Wide Control** (Global Setting)

**Location**: `/company/trips` page (top right toggle)

**Purpose**: Disable auto-halt for ALL trips at once

**UI Label**: "Disable auto-halt for all trips"

**Behavior**:
- ✅ When ENABLED (checked): No trips auto-halt at 10 seats
- ❌ When DISABLED (unchecked): Trips follow individual settings

**Use Case**:
```
Company Policy: "We never want auto-halt, we trust our online system"
Solution: Enable global disable once, forget about it
Result: No trip will ever auto-halt at 10 seats
```

**Database Field**: `Company.disableAutoHaltGlobally` (Boolean, default: `false`)

---

#### **Level 2: Trip-Specific Override** (Per-Trip Setting)

**Location**: Trip detail page → `BookingControlCard` (when booking is halted)

**Purpose**: Disable auto-halt for ONE specific trip only

**UI Label**: "Don't auto-halt this trip again"

**Behavior**:
- ✅ When CHECKED: This trip won't auto-halt again (even below 10 seats)
- ❌ When UNCHECKED: One-time resume (may auto-halt again if slots drop to 10)
- ⚠️ Other trips NOT affected

**Use Case**:
```
Scenario: Monday night trip auto-halts at 10 seats (9 PM)
Problem: Admin not available until morning, losing overnight bookings
Solution: Resume + check "Don't auto-halt this trip again"
Result: Trip continues accepting bookings overnight (5 AM booking at 7 seats left ✅)
```

**Database Field**: `Trip.autoResumeEnabled` (Boolean, default: `false`)

---

### 1.4 Auto-Halt Trigger Conditions

**Auto-halt ONLY triggers when ALL 6 conditions are met:**

```typescript
if (
  updatedTrip.availableSlots <= 10 &&                    // 1. At or below 10 seats
  !updatedTrip.bookingHalted &&                          // 2. Not already halted
  !updatedTrip.adminResumedFromAutoHalt &&               // 3. Admin hasn't resumed (one-time)
  !updatedTrip.autoResumeEnabled &&                      // 4. Trip-specific override NOT enabled
  !updatedTrip.company.disableAutoHaltGlobally &&        // 5. Company-wide override NOT enabled
  bookingType === "ONLINE"                               // 6. ONLINE booking only
) {
  // Trigger auto-halt
}
```

**Priority Order** (highest to lowest):
1. **Company-wide override** (`disableAutoHaltGlobally`) - Affects ALL trips
2. **Trip-specific override** (`autoResumeEnabled`) - Affects ONE trip
3. **One-time resume** (`adminResumedFromAutoHalt`) - Temporary until next drop to 10 seats
4. **Default behavior** - Auto-halt at 10 seats

---

### 1.5 Online Booking vs Manual Ticketing

| Feature | Online Booking | Manual Ticketing (Cashier) |
|---------|----------------|----------------------------|
| **Auto-halt at 10 seats** | ✅ YES | ❌ NO |
| **Can sell when halted** | ❌ NO | ✅ YES |
| **Can sell to 0 seats** | ❌ NO (if auto-halt active) | ✅ YES (always) |
| **Affected by global toggle** | ✅ YES | ❌ NO |
| **Affected by trip override** | ✅ YES | ❌ NO |

**Key Rule**: Manual ticketing (cashier/ticketer) can ALWAYS sell tickets, regardless of auto-halt status. Auto-halt is ONLY for online booking.

---

### 1.6 Manual Halt (Admin Override)

**Admin can manually halt booking at ANY time**, even with:
- Full capacity (50/50 seats)
- Global auto-halt disabled
- Trip-specific override enabled

**Use Cases**:
- Vehicle breakdown
- Driver unavailable
- Route closure
- Company decision

**Behavior**:
- Online booking: STOPS
- Manual ticketing: CONTINUES (cashier can still sell)

---

### 1.7 Full Capacity Halt (0 Seats)

**When all seats are sold** (`availableSlots === 0`):
- **ALWAYS halt** (both online + manual ticketing)
- No override possible (physically no space)
- Triggers manifest generation if trip status = `DEPARTED`

---

### 1.8 Trip Status Forced Halt (CRITICAL)

**ULTRA CRITICAL**: When trip status changes to `DEPARTED`, `COMPLETED`, or `CANCELLED`:
- **Booking IMMEDIATELY halted** (unconditional, no bypass possible)
- **ALL bypass settings ignored** (company-wide, trip-specific, one-time resume)
- **Blocks BOTH online booking AND manual ticketing**

**Implementation**:
```typescript
// When admin changes status to DEPARTED
await prisma.trip.update({
  data: {
    status: "DEPARTED",
    bookingHalted: true,  // ← FORCED halt (unconditional)
    actualDepartureTime: new Date()
  }
})
```

**Validation at Booking Time**:
```typescript
// Online Booking API (BEFORE checking bypass flags)
if (trip.status === "DEPARTED" || trip.status === "COMPLETED" || trip.status === "CANCELLED") {
  throw new Error(`Cannot book this trip. Trip status: ${trip.status}`)
}

// Manual Ticketing API (same check)
if (trip.status === "DEPARTED" || trip.status === "COMPLETED" || trip.status === "CANCELLED") {
  throw new Error(`Cannot sell tickets for this trip. Trip status: ${trip.status}`)
}
```

**Why This Matters**:
- **DEPARTED**: Bus has physically left - no one can board
- **COMPLETED**: Trip finished - route ended
- **CANCELLED**: Trip won't run - no service

**Auto-Manifest**: When status changes to `DEPARTED`, system automatically generates manifest for Super Admin commission tracking.

---

### 1.9 Complete Auto-Halt Scenarios

#### **Scenario 1: Default Behavior (10 Seats)**
```
Initial State:
- Trip: 50 seats total
- Available: 50 seats
- Global override: OFF
- Trip override: OFF

Customer books 40 seats online
- Available: 10 seats
- System Action: AUTO-HALT triggered
- Online booking: STOPPED
- Manual ticketing: CONTINUES
```

#### **Scenario 2: One-Time Resume**
```
Initial State:
- Available: 10 seats
- Status: HALTED (auto)

Admin Action: Click "Resume" (no checkbox)
- adminResumedFromAutoHalt: true
- Online booking: ACTIVE

Customer books 3 more seats
- Available: 7 seats
- System Action: AUTO-HALT triggered AGAIN (one-time expired)
- Online booking: STOPPED again
```

#### **Scenario 3: Trip-Specific Override**
```
Initial State:
- Available: 10 seats
- Status: HALTED (auto)

Admin Action: Click "Resume" + CHECK "Don't auto-halt this trip again"
- autoResumeEnabled: true
- Online booking: ACTIVE

Customer books 3 seats
- Available: 7 seats
- System Action: NO AUTO-HALT (trip override active)
- Online booking: CONTINUES

Customer books 5 more seats
- Available: 2 seats
- System Action: STILL NO AUTO-HALT
- Online booking: CONTINUES (until 0 seats)
```

#### **Scenario 4: Company-Wide Override**
```
Initial State:
- Company setting: disableAutoHaltGlobally = true

Trip 1: Addis → Dire (45 seats available)
Trip 2: Addis → Bahir (12 seats available)
Trip 3: Addis → Gondar (8 seats available)

Bookings happen on all trips:
- Trip 1: Drops to 10 seats → NO AUTO-HALT
- Trip 2: Drops to 8 seats → NO AUTO-HALT
- Trip 3: Already at 8 seats → NO AUTO-HALT

Result: ALL trips continue accepting online bookings
```

#### **Scenario 5: Manual Halt with Global Override**
```
Initial State:
- Company setting: disableAutoHaltGlobally = true
- Trip: 30 seats available

Admin Action: Manually halt trip (vehicle breakdown)
- bookingHalted: true
- Online booking: STOPPED
- Manual ticketing: CONTINUES

Note: Manual halt works REGARDLESS of auto-halt settings
```

#### **Scenario 6: Midnight Booking Problem (SOLVED)**
```
Initial State:
- Available: 15 seats
- Time: 6 PM (business hours)

Bookings reduce to 10 seats
- System: AUTO-HALT
- Admin: Resumes (one-time, no checkbox)
- Time: 6:05 PM

More bookings come in:
- 8 PM: 9 seats left (still active)
- 10 PM: 8 seats left (still active)
- 11 PM: 7 seats left (still active)

Midnight booking attempt:
- 12 AM: Customer tries to book
- Available: 7 seats
- Problem: This WOULD have auto-halted again at next booking
  (adminResumedFromAutoHalt only prevents IMMEDIATE re-halt)

SOLUTION (with trip override):
- Admin resumes at 6 PM + CHECKS "Don't auto-halt this trip again"
- autoResumeEnabled: true
- Result: Midnight bookings work (no admin needed)
```

#### **Scenario 8: DEPARTED Force-Halt (CRITICAL)**
```
Initial State:
- Trip: 50 seats total
- Available: 30 seats (still plenty available)
- Global override: ON (auto-halt disabled for all trips)
- Trip override: ON (don't auto-halt this trip)
- Status: BOARDING

Admin marks trip as DEPARTED (bus physically leaves)
- Status: DEPARTED
- System Action: bookingHalted = true (FORCED)
- Available: Still 30 seats

Customer tries to book online
- Result: BLOCKED ("Cannot book this trip. Trip status: DEPARTED")
- Reason: Bus has left, impossible to board

Cashier tries to sell ticket manually
- Result: BLOCKED ("Cannot sell tickets for this trip. Trip status: DEPARTED")
- Reason: Manual ticketing also respects trip status

CRITICAL: NO bypass settings (global/trip/one-time) can override DEPARTED status
```

---

### 1.9 Admin Actions & Flag Resets

#### **When Admin Manually HALTS:**
```typescript
bookingHalted = true
lowSlotAlertSent = false                 // Reset alert
adminResumedFromAutoHalt = false         // Reset one-time override
autoResumeEnabled = false                // Reset trip override
```

#### **When Admin RESUMES (one-time):**
```typescript
bookingHalted = false
adminResumedFromAutoHalt = true          // One-time protection
autoResumeEnabled = false                // No trip override
```

#### **When Admin RESUMES + Checks "Don't auto-halt again":**
```typescript
bookingHalted = false
adminResumedFromAutoHalt = true          // One-time protection
autoResumeEnabled = true                 // Trip override enabled
```

#### **When Trip Reaches 0 Seats:**
```typescript
bookingHalted = true
reportGenerated = true
adminResumedFromAutoHalt = false         // Reset override
lowSlotAlertSent = false                 // Reset alert
// autoResumeEnabled NOT reset (persists even at 0 seats)
```

---

### 1.10 Implementation Locations

**Auto-Halt Logic**:
- **Online Booking**: `src/app/api/bookings/route.ts` (lines 448-455)
- **Manual Ticketing**: Auto-halt REMOVED (manual can sell to 0)

**Trip Status Force-Halt**:
- **Status Change**: `src/app/api/company/trips/[tripId]/status/route.ts` (lines 119-122)
  - When status → DEPARTED, sets `bookingHalted = true` (unconditional)
- **Online Booking Validation**: `src/app/api/bookings/route.ts` (lines 211-214)
  - Blocks DEPARTED, COMPLETED, CANCELLED trips (before auto-halt check)
- **Manual Ticketing Validation**: `src/app/api/company/trips/[tripId]/manual-ticket/route.ts` (lines 62-68)
  - Blocks DEPARTED, COMPLETED, CANCELLED trips
- **Cashier Validation**: `src/app/api/cashier/trip/[tripId]/sell/route.ts` (lines 97-100)
  - Blocks DEPARTED, COMPLETED, CANCELLED trips

**Resume/Halt API**:
- `src/app/api/company/trips/[tripId]/toggle-booking/route.ts`

**Company-Wide Setting API**:
- `src/app/api/company/settings/auto-halt/route.ts` (GET + POST)

**UI Components**:
- **Global Toggle**: `src/app/company/trips/page.tsx` (lines 540-568)
- **Trip-Specific Checkbox**: `src/components/company/BookingControlCard.tsx` (lines 128-147)

**Database Fields**:
```prisma
model Company {
  disableAutoHaltGlobally Boolean @default(false)  // Global override
}

model Trip {
  bookingHalted            Boolean @default(false)  // Current halt status
  adminResumedFromAutoHalt Boolean @default(false)  // One-time resume flag
  autoResumeEnabled        Boolean @default(false)  // Trip-specific override
  lowSlotAlertSent         Boolean @default(false)  // Alert tracking
}
```

---

## 2. 24-Hour Resource Allocation Rule (CRITICAL)

### 2.1 Philosophy

Ethiopian bus operations require **return trips**. When a bus departs from Addis Ababa to Dire Dawa on Day 1, it returns on Day 2. During this 24-hour cycle, the vehicle, driver, and conductor are unavailable for new forward trips.

### 2.2 Implementation

**Location**: `src/components/ui/multi-date-picker.tsx` (lines 47-60)

**Rule**: When selecting trip dates for batch creation:
- If **Day 1** is selected (e.g., Jan 15)
- **Day 2** (Jan 16) is automatically **GRAYED OUT** (disabled)
- Next available selection: **Day 3** (Jan 17)

### 2.3 Business Impact

- ✅ Prevents double-booking of vehicles
- ✅ Prevents staff scheduling conflicts
- ✅ Ensures realistic trip planning
- ✅ Maintains operational integrity

### 2.4 Code Logic

```typescript
// Gray out the day after any selected date
for (const selectedDate of selectedDates) {
  const dayAfterSelected = new Date(selectedDate)
  dayAfterSelected.setDate(dayAfterSelected.getDate() + 1)

  if (checkDate matches dayAfterSelected) {
    return true // Disabled - this is the return day
  }
}
```

### 2.5 Exception Handling

- **One-way trips**: Still applies (bus needs to return to origin)
- **Multi-day routes**: 24-hour minimum (can be extended for longer routes)
- **Emergency overrides**: Super Admin can manually create trips (NOT recommended)

---

## 3. Manual Ticketing vs Online Booking

### 3.1 Online Booking Rules

- ✅ Subject to auto-halt at 10 seats
- ✅ Cannot book when `bookingHalted = true`
- ✅ 15-minute payment timeout
- ✅ TeleBirr integration required

### 3.2 Manual Ticketing Rules (Cashier/Ticketer)

- ❌ NOT subject to auto-halt
- ✅ Can sell when online booking is halted
- ✅ Can sell all the way to 0 seats
- ✅ Immediate cash payment (no timeout)
- ✅ Direct ticket generation

### 3.3 Why This Distinction?

**Online Booking Auto-Halt**:
- Reserves capacity for walk-in customers at bus stations
- Prevents complete online monopoly
- Balances digital and physical sales channels

**Manual Ticketing Freedom**:
- Station staff have real-time visibility
- Can assess actual demand
- Can manage last-minute changes
- Face-to-face customer service

---

## 4. Payment & Commission Rules

### 4.1 Commission Structure

**Platform Commission**: 5% of ticket price

**Sales Person Commission**: 5% of platform's 5% = 0.25% of ticket price

**VAT on Commission**: 15% of platform commission

### 4.2 Example Calculation

```
Ticket Price: 100 ETB
Platform Commission: 5 ETB (5%)
Commission VAT: 0.75 ETB (15% of 5 ETB)
Sales Commission: 0.25 ETB (5% of 5 ETB)

Total Customer Pays: 105.75 ETB
Company Receives: 100 ETB
Platform Receives: 4.75 ETB (5 - 0.25)
Sales Person Receives: 0.25 ETB
Government Receives: 0.75 ETB (VAT)
```

### 4.3 Payment Methods

- **TeleBirr**: Online payment gateway
- **Cash**: Manual ticketing only
- **SMS Payment**: Guest bookings via USSD

---

## 5. Company Data Segregation (ULTRA-CRITICAL)

### 5.1 Philosophy

**COMPLETE data isolation** between bus companies. Selam Bus must NEVER see Sky Bus data (and vice versa).

### 5.2 Shared Resources

**ONLY shared resource**: Organic City database (Ethiopian cities list)

**Everything else is segregated**:
- Trips
- Bookings
- Vehicles
- Staff
- Audit logs (company-specific)
- Work orders
- Manifest downloads

### 5.3 Implementation

**Every company-scoped API MUST filter by** `companyId`:

```typescript
// CORRECT ✅
const trips = await prisma.trip.findMany({
  where: { companyId: session.user.companyId },
})

// WRONG ❌ (returns all companies' data)
const trips = await prisma.trip.findMany()
```

### 5.4 Super Admin Exception

**ONLY Super Admin** can see cross-company data:
- All trips (all companies)
- All manifests
- Audit logs with `companyId = null` (platform surveillance)

Companies **CANNOT** see Super Admin audit logs.

---

## Changelog

**Version**: 2.0 (Jan 20, 2026)
- Added two-level auto-halt control system
- Documented 10-seat fixed threshold (NOT 10%)
- Clarified manual ticketing exemption from auto-halt
- Added comprehensive scenarios
- Documented priority order and flag resets

**Version**: 1.0 (Jan 2026)
- Initial business logic documentation
- 24-hour resource allocation rule
- Auto-halt at 10% capacity (DEPRECATED - now 10 seats fixed)

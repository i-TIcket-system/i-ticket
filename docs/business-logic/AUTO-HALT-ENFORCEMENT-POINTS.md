# Auto-Halt Rule Enforcement Points

**Date**: January 22, 2026
**Business Rule**: Online booking auto-halts at ≤10 available seats
**Manual Ticketing**: NEVER blocked by auto-halt (can always sell down to 0)

---

## Critical Auto-Halt Rule (CLAUDE.md)

From `CLAUDE.md` Section "Trip Management":

> **🚨 CRITICAL: Auto-Halt System** (affects ONLINE booking only):
> - **Fixed threshold**: 10 seats remaining (NOT 10% - consistent across all bus sizes)
> - **CRITICAL BUSINESS RULE** (Jan 20, 2026):
>   1. **Manual ticketing**: Can ALWAYS sell down to 0 seats (NEVER blocked by auto-halt)
>   2. **Online booking**: Auto-halts when slots ≤ 10 (unless bypassed by checkboxes)

---

## Enforcement Points

### 1. Trip Creation (Initial State)

All trip creation endpoints now check if `totalSlots <= 10` and set `bookingHalted = true` accordingly.

#### 1.1 Batch Trip Creation
**File**: `src/app/api/company/trips/batch/route.ts`
**Lines**: 236-237, 268-269

```typescript
// Apply auto-halt rule: trips with ≤10 total slots start halted
const shouldAutoHalt = validated.totalSlots <= 10;

const trip = await tx.trip.create({
  data: {
    // ... other fields
    totalSlots: validated.totalSlots,
    availableSlots: validated.totalSlots,
    bookingHalted: shouldAutoHalt, // ✅ Auto-halt enforced
  },
});
```

**Scenarios**:
- Mini bus with 8 seats → `bookingHalted = true` (created halted)
- Standard bus with 50 seats → `bookingHalted = false` (created active)
- Luxury bus with 10 seats → `bookingHalted = true` (created halted)

#### 1.2 CSV/Excel Import
**File**: `src/app/api/company/trips/import/route.ts`
**Lines**: 161-162

```typescript
// Apply auto-halt rule: trips with ≤10 total slots start halted
const shouldAutoHalt = trip.totalSlots <= 10;

const createdTrip = await prisma.trip.create({
  data: {
    // ... other fields
    totalSlots: trip.totalSlots,
    availableSlots: trip.totalSlots,
    bookingHalted: shouldAutoHalt, // ✅ Auto-halt enforced
  },
});
```

**Use Case**: Importing 50 trips via CSV, 5 have mini buses (≤10 seats) → those 5 start halted.

#### 1.3 Database Seed
**File**: `prisma/seed.ts`
**Lines**: 514-526

```typescript
// Determine trip status based on departure time
const now = new Date()
let tripStatus = "SCHEDULED"
let bookingHalted = false

if (departure < now) {
  // Past trips should be COMPLETED or CANCELLED based on bookings
  tripStatus = bookedSlots > 0 ? "COMPLETED" : "CANCELLED"
  bookingHalted = true // ALWAYS halt booking for past trips
} else {
  // Future trips: check auto-halt rule (≤10 seats)
  bookingHalted = availableSlots <= 10 // ✅ Auto-halt enforced
}
```

**Scenarios**:
- Past trip → `bookingHalted = true` (regardless of seats)
- Future trip with 8 available seats → `bookingHalted = true`
- Future trip with 45 available seats → `bookingHalted = false`

---

### 2. Seat Availability Changes (Dynamic Triggers)

When bookings reduce available slots to ≤10, auto-halt is triggered.

#### 2.1 Online Booking Completion
**File**: `src/app/api/book/confirm/route.ts`
**Logic**: After payment confirmation, check if `newAvailableSlots <= 10`

```typescript
// Auto-halt logic after booking
if (newAvailableSlots <= 10 && !trip.bookingHalted) {
  await prisma.trip.update({
    where: { id: tripId },
    data: { bookingHalted: true },
  });
  // Create audit log: AUTO_HALT_LOW_SLOTS
}
```

**Example**: Trip with 50 seats → customer books 42 seats → 8 remaining → auto-halt triggered.

#### 2.2 Manual Ticket Sales
**File**: `src/app/api/company/trips/[tripId]/manual-ticket/route.ts`
**Logic**: After manual sale, check if `newAvailableSlots <= 10`

```typescript
// Auto-halt logic after manual sale (Jan 20, 2026 fix)
if (newAvailableSlots <= 10 && !trip.bookingHalted) {
  await prisma.trip.update({
    where: { id: tripId },
    data: { bookingHalted: true },
  });
  // ⚠️ Manual ticketing can CONTINUE selling (not blocked)
  // ✅ Online booking gets halted (new customers blocked)
}
```

**Critical Behavior**:
- Manual ticketer sells 42 seats on 50-seat bus → 8 remaining
- ✅ Manual sale completes successfully (no restriction)
- ✅ Online booking gets auto-halted (prevents new online bookings)
- ✅ Manual ticketing can continue selling all 8 remaining seats
- ❌ Online customers cannot book (redirected to contact company)

---

### 3. Trip Status Changes (Force Halt)

When trip status changes to DEPARTED, COMPLETED, or CANCELLED, booking ALWAYS halts.

#### 3.1 Status Update API
**File**: `src/app/api/company/trips/[tripId]/status/route.ts`
**Logic**: Status change to final state → force `bookingHalted = true`

```typescript
if (['DEPARTED', 'COMPLETED', 'CANCELLED'].includes(newStatus)) {
  updateData.bookingHalted = true; // ✅ Force halt (no bypass)
}
```

**Bypass Settings IGNORED**: Even if company has `disableAutoHaltGlobally = true`, trip status overrides it.

---

### 4. Bypass Controls (Two-Level System)

Auto-halt can be disabled at two levels (does NOT apply to trip status):

#### 4.1 Company-Wide Bypass
**Database**: `Company.disableAutoHaltGlobally` (boolean)
**Effect**: Disables auto-halt for ALL trips in the company

#### 4.2 Trip-Specific Bypass
**Database**: `Trip.autoResumeEnabled` (boolean)
**Effect**: Disables auto-halt for ONE specific trip

#### 4.3 One-Time Resume
**API**: `POST /api/company/trips/[tripId]/toggle-booking`
**Effect**: Temporarily resumes booking (can be halted again later)

**Priority Order**:
1. Trip status (DEPARTED/COMPLETED/CANCELLED) → ALWAYS halt (highest priority)
2. Company-wide bypass → Affects all trips
3. Trip-specific bypass → Affects one trip
4. One-time resume → Temporary override
5. Default auto-halt → ≤10 seats (lowest priority)

---

## Verification

### Automated Script
**File**: `scripts/verify-auto-halt.ts`

Run: `npx tsx scripts/verify-auto-halt.ts`

Checks:
- ✅ Past trips have `bookingHalted = true`
- ✅ Future trips with ≤10 seats have `bookingHalted = true`
- ✅ Trip status matches departure time (past trips = COMPLETED/CANCELLED)

**Expected Output**:
```
✅ All trips comply with auto-halt rules!

📈 Statistics:
   Future trips with ≤10 seats: X
   Correctly halted: X
   Incorrectly halted: 0
```

### Manual Testing Scenarios

#### Scenario 1: Create Mini Bus Trip
1. Create batch trip with 8 seats (mini bus)
2. Verify: `bookingHalted = true` immediately after creation
3. Verify: Public search doesn't show trip OR shows "Contact company"

#### Scenario 2: Online Booking Triggers Auto-Halt
1. Create trip with 50 seats
2. Verify: `bookingHalted = false`
3. Book 42 seats online (leaving 8)
4. Verify: `bookingHalted = true` after payment
5. Verify: Cannot book more online
6. Verify: Manual ticketing can still sell remaining 8 seats

#### Scenario 3: Manual Ticketing Triggers Auto-Halt
1. Create trip with 50 seats
2. Manual ticketer sells 42 seats (leaving 8)
3. Verify: `bookingHalted = true` after sale
4. Verify: Manual ticketer can continue selling remaining 8 seats
5. Verify: Online booking blocked

#### Scenario 4: CSV Import with Mini Buses
1. Create CSV with mix of bus sizes (50, 30, 8 seats)
2. Import via `/company/trips/import`
3. Verify: Only mini bus (8 seats) has `bookingHalted = true`
4. Verify: Standard (50) and luxury (30) have `bookingHalted = false`

#### Scenario 5: Trip Status Force Halt
1. Create trip with 50 available seats
2. Change status to DEPARTED
3. Verify: `bookingHalted = true` (forced)
4. Verify: Cannot resume booking (bypass settings ignored)

---

## Edge Cases

### Edge Case 1: Exactly 10 Seats
**Rule**: `availableSlots <= 10` includes 10
**Result**: `bookingHalted = true`

### Edge Case 2: Bypass + Low Seats
**Scenario**: Trip has 8 seats, company has `disableAutoHaltGlobally = true`
**Result**: Trip NOT halted (bypass takes precedence)

### Edge Case 3: Status Change + Bypass
**Scenario**: Trip DEPARTED, company has `disableAutoHaltGlobally = true`
**Result**: Trip HALTED (status overrides bypass)

### Edge Case 4: Manual Ticketing + Halted Trip
**Scenario**: Trip has `bookingHalted = true`, manual ticketer tries to sell
**Result**: Sale succeeds (manual ticketing exempt from halt)

---

## Historical Changes

### Jan 22, 2026 - Initial State Enforcement
- **Added**: Auto-halt check in batch trip creation
- **Added**: Auto-halt check in CSV import
- **Added**: Auto-halt check in database seed
- **Result**: Trips with ≤10 total slots start halted

### Jan 20, 2026 - Manual Ticketing Auto-Halt
- **Added**: Auto-halt trigger in manual ticket sale route
- **Preserved**: Manual ticketing exemption (never blocked)
- **Result**: Manual sales can reduce slots to ≤10 and halt online booking while continuing sales

### Jan 20, 2026 - Trip Status Force Halt
- **Added**: Force `bookingHalted = true` for DEPARTED/COMPLETED/CANCELLED trips
- **Result**: Final-status trips always halted, no bypass allowed

---

## Summary Table

| Enforcement Point | File | Trigger | bookingHalted | Bypass Allowed? |
|------------------|------|---------|---------------|-----------------|
| Batch Creation | `batch/route.ts` | totalSlots ≤ 10 | true | No |
| CSV Import | `import/route.ts` | totalSlots ≤ 10 | true | No |
| Database Seed | `seed.ts` | availableSlots ≤ 10 | true | No |
| Online Booking | `book/confirm/route.ts` | availableSlots ≤ 10 | true | Yes (company/trip) |
| Manual Ticketing | `manual-ticket/route.ts` | availableSlots ≤ 10 | true | Yes (company/trip) |
| Trip Status Change | `status/route.ts` | DEPARTED/COMPLETED/CANCELLED | true | **No (forced)** |

---

## Developer Notes

- **ALWAYS** check `totalSlots` or `availableSlots` when creating/updating trips
- **NEVER** hardcode `bookingHalted: false` without checking seat count
- **REMEMBER**: Manual ticketing is exempt from halt (check happens AFTER sale)
- **PRIORITY**: Trip status > Company bypass > Trip bypass > Auto-halt rule
- **TESTING**: Run `verify-auto-halt.ts` after any trip-related changes

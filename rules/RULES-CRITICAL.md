# Critical Rules (RULE-004 to RULE-008)

> **Priority**: 🟠 CRITICAL
> **Violation Impact**: Business logic failure, financial loss
> **Back to**: [RULES.md](../RULES.md)

---

## 4. Auto-Halt System

**Rule ID**: `RULE-004`

### The Rule (DUAL BEHAVIOR)

| Channel | Behavior |
|---------|----------|
| **Manual Ticketing** | Can ALWAYS sell to 0 seats (NEVER blocked) |
| **Online Booking** | Auto-halts at ≤10 seats (unless bypassed) |

### Threshold

**Fixed at 10 seats** (not percentage):
- 15-seater bus: Halts at 10 seats remaining
- 45-seater bus: Halts at 10 seats remaining
- 60-seater bus: Halts at 10 seats remaining

### Bypass Controls

| Level | Field | Effect |
|-------|-------|--------|
| Company-wide | `Company.disableAutoHaltGlobally` | Disables for ALL trips |
| Trip-specific | `Trip.autoResumeEnabled` | Disables for ONE trip |

**Priority**: Company-wide > Trip-specific > Default (auto-halt ON)

### Implementation

```typescript
// ✅ CORRECT: Online booking checks halt
if (trip.bookingHalted) {
  return NextResponse.json(
    { error: "Booking is temporarily halted" },
    { status: 403 }
  );
}

// ✅ CORRECT: Manual ticketing NEVER checks halt
// Just check trip status (view-only protection)
if (["DEPARTED", "COMPLETED", "CANCELLED"].includes(trip.status)) {
  return NextResponse.json({ error: "Trip is view-only" }, { status: 403 });
}
// NO bookingHalted check for manual ticketing!

// ✅ CORRECT: Trigger auto-halt after manual sale
if (updatedTrip.availableSlots <= 10 && !updatedTrip.bookingHalted) {
  if (!company.disableAutoHaltGlobally && !trip.autoResumeEnabled) {
    await prisma.trip.update({
      where: { id: tripId },
      data: { bookingHalted: true }
    });
  }
}
```

### Related Bugs

- Bug #4: Auto-Halt Re-Trigger Loop
- Bug #9: Manual Ticketing Blocked by Auto-Halt

---

## 5. 24-Hour Resource Allocation

**Rule ID**: `RULE-005`

### The Rule

**Same vehicle/driver/conductor cannot be scheduled within 24 hours:**

| Resource | Conflict Window |
|----------|-----------------|
| Vehicle | ±24 hours from departure |
| Driver | ±24 hours from departure |
| Conductor | ±24 hours from departure |

### Exclusions

- `CANCELLED` trips (not counted)
- `COMPLETED` trips (not counted)
- Current trip (when editing)

### Implementation

```typescript
const conflictingTrip = await prisma.trip.findFirst({
  where: {
    vehicleId: selectedVehicle,
    id: { not: currentTripId }, // Exclude self when editing
    status: { notIn: ["CANCELLED", "COMPLETED"] },
    departureDate: {
      gte: addHours(newDepartureDate, -24),
      lte: addHours(newDepartureDate, 24)
    }
  }
});

if (conflictingTrip) {
  return { error: "Vehicle already scheduled within 24 hours" };
}
```

### Why This Matters

- **Physical Reality**: Bus in Addis can't be in Hawassa same day
- **Driver Safety**: Prevents fatigue from back-to-back trips
- **Operational**: Allows maintenance/rest between trips

---

## 6. Manual Ticketing Exemption

**Rule ID**: `RULE-006`

### The Rule

**Manual ticketing (cashier/ticketer) is EXEMPT from auto-halt:**

| Check | Online Booking | Manual Ticketing |
|-------|----------------|------------------|
| `bookingHalted` | ✅ Checked | ❌ NOT checked |
| Trip status (view-only) | ✅ Checked | ✅ Checked |
| Available slots > 0 | ✅ Checked | ✅ Checked |

### Why Manual Is Exempt

- Walk-in customers have higher priority
- Last-minute sales need flexibility
- Company staff can assess situation in-person

### Implementation

```typescript
// Manual ticketing route - NO bookingHalted check
export async function POST(request: Request) {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });

  // ✅ Check trip status (view-only)
  if (["DEPARTED", "COMPLETED", "CANCELLED"].includes(trip.status)) {
    return NextResponse.json({ error: "Cannot sell" }, { status: 403 });
  }

  // ✅ Check available slots
  if (trip.availableSlots < seatCount) {
    return NextResponse.json({ error: "Not enough seats" }, { status: 400 });
  }

  // ❌ NO bookingHalted check! That's the exemption.

  // Proceed with sale...
}
```

---

## 7. Payment & Commission

**Rule ID**: `RULE-007`

### The Rule

**Server MUST calculate all payment amounts:**

| Component | Formula | Example (100 ETB ticket) |
|-----------|---------|--------------------------|
| Ticket Price | Base price | 100.00 ETB |
| Commission | Price × 5% | 5.00 ETB |
| VAT | Commission × 15% | 0.75 ETB |
| **Total** | Price + Commission + VAT | **105.75 ETB** |

### Critical: VAT Calculation

```
❌ WRONG: VAT = ticketPrice × 15% (gives 15.00 ETB)
✅ CORRECT: VAT = commission × 15% (gives 0.75 ETB)
```

### Implementation

```typescript
// ✅ CORRECT: Server-side calculation
const ticketPrice = 100;
const commission = ticketPrice * 0.05; // 5.00
const vat = commission * 0.15; // 0.75
const total = ticketPrice + commission + vat; // 105.75

await prisma.payment.create({
  data: {
    amount: total,
    ticketPrice: ticketPrice,
    commissionAmount: commission,
    vatAmount: vat,
  }
});

// ❌ WRONG: Trusting client amounts
const { amount, commission } = await request.json();
// NEVER trust these values!
```

### Database Storage

Payment model MUST store separately:
- `amount` (total)
- `ticketPrice` (base)
- `commissionAmount` (5%)
- `vatAmount` (15% of commission)

### Related Bugs

- Bug #5: Commission VAT Logic Wrong

---

## 8. CSV/Excel Import

**Rule ID**: `RULE-008`

### The Rule

**Bulk imports MUST be atomic (all-or-nothing):**

1. ✅ Validate ALL rows BEFORE any database writes
2. ✅ Use `prisma.$transaction()` for atomic writes
3. ✅ Include row numbers in all error messages
4. ✅ Check 24-hour resource conflicts
5. ✅ Validate staff roles match assignments

### Limits

| Limit | Value |
|-------|-------|
| Max file size | 5 MB |
| Max trips per import | 50 |
| Supported formats | CSV, XLSX |

### Implementation

```typescript
// ✅ CORRECT: Validate all, then write all
const validationErrors = [];

// Phase 1: Validate ALL rows
for (let i = 0; i < rows.length; i++) {
  const errors = validateRow(rows[i], i + 1);
  if (errors.length) validationErrors.push(...errors);
}

// Stop if ANY validation fails
if (validationErrors.length > 0) {
  return { errors: validationErrors }; // No DB writes!
}

// Phase 2: Atomic write
await prisma.$transaction(async (tx) => {
  for (const row of rows) {
    await tx.trip.create({ data: mapRowToTrip(row) });
  }
});

// ❌ WRONG: Write per row (partial imports)
for (const row of rows) {
  await validateAndCreate(row); // If row 5 fails, 1-4 already created!
}
```

### Error Message Format

```
Row 3: Invalid departure date "2025-01-01". Date must be in the future.
Row 7: Driver phone "0912345678" not found. Please add driver to staff first.
Row 12: Vehicle "3-12345" already scheduled within 24 hours of this trip.
```

### Related Bugs

- Bug #11: Batch Trip Creation Partial Writes
- Bug #15: 24-Hour Conflict Check Missing in CSV Import

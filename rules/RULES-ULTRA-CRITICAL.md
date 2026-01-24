# Ultra-Critical Rules (RULE-001 to RULE-003)

> **Priority**: 🔴 ULTRA-CRITICAL
> **Violation Impact**: Security breach, data integrity failure
> **Back to**: [RULES.md](../RULES.md)

---

## 1. Company Data Segregation

**Rule ID**: `RULE-001`

### The Rule

**MUST enforce complete data isolation between bus companies:**

1. ✅ Filter ALL database queries by `companyId` (except Super Admin)
2. ✅ Validate user's company matches requested resource's company
3. ✅ NEVER trust client-provided `companyId` - always use `session.user.companyId`
4. ✅ **ONLY shared resource**: City database (all companies use same cities)

### What Companies MUST NOT See From Other Companies

- Trips, bookings, passengers, tickets
- Staff, vehicles, work orders, maintenance records
- Revenue data, commission details, manifests
- Audit logs, chat messages, support tickets

### Implementation

```typescript
// ✅ CORRECT: Always filter by session companyId
const session = await getServerSession(authOptions);
const trips = await prisma.trip.findMany({
  where: {
    companyId: session.user.companyId, // MANDATORY
    status: "SCHEDULED"
  }
});

// ❌ WRONG: Missing company filter
const trips = await prisma.trip.findMany({
  where: { status: "SCHEDULED" } // SECURITY BREACH!
});

// ❌ WRONG: Trusting client param
const { companyId } = await request.json();
const trips = await prisma.trip.findMany({
  where: { companyId } // NEVER DO THIS!
});
```

### Enforcement Files

- `src/app/api/company/**/*.ts` - All company-scoped APIs
- `src/app/api/staff/**/*.ts` - Staff portal APIs
- `src/app/api/cashier/**/*.ts` - Cashier portal APIs

### Related Bugs

- Bug #3: Staff API Role Filter Broken
- Bug #14: Company Segregation in Staff Query

---

## 2. Guest Booking = Feature

**Rule ID**: `RULE-002`

### The Rule

**MUST allow guests to book without OTP/SMS verification:**

1. ✅ Allow booking with ONLY phone number (no account required)
2. ✅ TeleBirr payment completion IS sufficient verification
3. ❌ MUST NOT add OTP/SMS verification to guest booking
4. ❌ MUST NOT require email or registration

### Why This Is BY DESIGN

| Factor | Impact |
|--------|--------|
| Conversion | OTP adds 30-40% drop-off |
| Revenue | Guest bookings = 60% of revenue |
| Trust | Payment verification > OTP verification |
| Cost | Skip OTP SMS = lower costs |

### Implementation

```typescript
// ✅ CORRECT: Guest booking (phone only)
const guestBooking = {
  phone: "0912345678",
  passengers: [...],
  // NO email, NO password, NO OTP
};

const booking = await prisma.booking.create({
  data: {
    userId: null, // Guest = null userId
    guestPhone: phone,
    status: "PENDING"
  }
});

// ❌ WRONG: Adding OTP
const { phone, otp } = await request.json();
const isValid = await verifyOTP(phone, otp); // NEVER ADD THIS!
```

### Philosophy

**"Payment IS verification"** - TeleBirr handles fraud detection. No need to verify phone separately.

---

## 3. Trip Status Lifecycle

**Rule ID**: `RULE-003`

### The Rule

**MUST enforce strict status transitions and view-only protection:**

### Valid Transitions

```
SCHEDULED → BOARDING → DEPARTED → COMPLETED
     ↓          ↓
 CANCELLED  CANCELLED
```

### View-Only Statuses

When trip is `DEPARTED`, `COMPLETED`, or `CANCELLED`:

| Action | Status |
|--------|--------|
| Manual ticket sales | ❌ BLOCKED |
| Cashier ticket sales | ❌ BLOCKED |
| Trip updates (PUT) | ❌ BLOCKED |
| Resume booking | ❌ BLOCKED |
| Status change | ❌ BLOCKED (except DEPARTED→COMPLETED) |

### Implementation

```typescript
// ✅ CORRECT: Block view-only trips
const isViewOnly = ["DEPARTED", "COMPLETED", "CANCELLED"].includes(trip.status);

if (isViewOnly) {
  return NextResponse.json(
    { error: `Cannot modify ${trip.status} trip. Trip is view-only.` },
    { status: 403 }
  );
}

// ✅ CORRECT: Force halt on final status
if (["DEPARTED", "COMPLETED", "CANCELLED"].includes(newStatus)) {
  await prisma.trip.update({
    where: { id: tripId },
    data: {
      status: newStatus,
      bookingHalted: true, // ALWAYS true for final status
    }
  });
}
```

### Automatic Cleanup (Cron)

Every 15 minutes:
- `SCHEDULED` + past date + has bookings → `COMPLETED`
- `SCHEDULED` + past date + no bookings → `CANCELLED`

### Enforcement Files

- `src/app/api/company/trips/[tripId]/manual-ticket/route.ts`
- `src/app/api/cashier/trip/[tripId]/sell/route.ts`
- `src/app/api/company/trips/[tripId]/route.ts` (PUT)
- `src/app/api/cron/cleanup-old-trips/route.ts`

### Related Bugs

- Bug #8: View-Only Protection Missing

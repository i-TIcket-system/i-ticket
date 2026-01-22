# i-Ticket Platform Business Rules

> **Version**: 1.0.0
> **Last Updated**: January 22, 2026
> **Status**: Authoritative Reference
> **Maintainer**: Development Team

---

## 🚨 MANDATORY READ

**This document is the single source of truth for ALL business rules in the i-Ticket platform.**

Before writing any code, modifying any API, or changing any database schema, you MUST:
1. ✅ Read the relevant rules in this document
2. ✅ Verify your changes comply with ALL applicable rules
3. ✅ Check the Bug Registry (Section 24) to avoid reintroducing known issues
4. ✅ Update this document if you discover new rules or edge cases

**Violating these rules can cause**:
- 🔴 Security breaches (company data leaks)
- 🔴 Financial losses (incorrect commission calculations)
- 🔴 Legal compliance issues (data integrity violations)
- 🔴 Customer trust damage (booking failures, payment errors)
- 🔴 Platform instability (race conditions, data corruption)

---

## 🔥 MANDATORY WORKFLOW FOR ALL CODE CHANGES

**⚠️ ULTRA-CRITICAL**: This workflow is MANDATORY for every feature addition, bug fix, or code modification. Following this workflow prevents 90% of rule violations and bug reintroductions.

### The 5-Step Process

**STEP 1: Read RULES.md Appendices FIRST** ⭐
```
Before touching ANY code, read these appendices in order:
1. Appendix B (File-to-Rule Mapping) → Find which rules apply to your files
2. Appendix C (Rule Violation Checklist) → Pre-implementation checklist
3. Appendix A (Cross-Reference Matrix) → Understand rule dependencies
```

**STEP 2: Read Specific Rules**
```
For each rule identified in Step 1:
1. Read the full rule details (not just quick reference)
2. Review ALL code examples (✅ correct, ❌ wrong)
3. Check related rules (follow cross-references)
4. Note enforcement points (files + line numbers)
```

**STEP 3: Check Bug Registry (Section 24)**
```
Before implementing:
1. Search Bug Registry for similar issues
2. Review "Prevention" strategies for related bugs
3. Ensure you're not reintroducing known bugs
```

**STEP 4: Implement with Compliance**
```
During implementation:
1. Follow implementation checklists from rules
2. Apply correct patterns from code examples
3. Add comments referencing rule IDs (e.g., // RULE-001: Company segregation)
4. Verify against violation checklist (Appendix C)
```

**STEP 5: Document if Needed**
```
After implementation:
1. Update RULES.md if new rule discovered
2. Add to Bug Registry (Section 24) if bug fixed
3. Update File-to-Rule Mapping (Appendix B) for new files
4. Update Changelog
```

### Why This Workflow is MANDATORY

| Without Workflow | With Workflow |
|-----------------|---------------|
| ❌ Miss company segregation in new API | ✅ Appendix B shows RULE-001 applies |
| ❌ Reintroduce parseInt vulnerability | ✅ Bug Registry alerts to Bug #7 |
| ❌ Forget auto-halt after manual sale | ✅ RULE-004 checklist catches it |
| ❌ Trust client-provided commission | ✅ RULE-007 examples show server calc |
| ❌ Create partial CSV import | ✅ RULE-008 requires transaction |

### Enforcement

- **Code Reviews**: Reviewer MUST verify workflow was followed
- **Pull Requests**: PR description MUST list rules checked
- **Failed Builds**: CI/CD checks for common violations
- **Incident Post-Mortems**: Workflow violation = process failure

### Quick Start Example

```
Task: "Add new API route to update trip price"

✅ STEP 1: Read Appendices
- Appendix B shows: src/app/api/company/trips/[tripId]/route.ts
  - RULE-001 (Company Segregation)
  - RULE-003 (Trip Status - view-only)
  - RULE-021 (Schema Constraints)

✅ STEP 2: Read Rules
- RULE-001: Must filter by session.user.companyId
- RULE-003: Must block if DEPARTED/COMPLETED/CANCELLED
- RULE-021: Must validate price > 0, typeof number

✅ STEP 3: Check Bugs
- Bug #14: Never trust companyId from URL params
- Bug #7: Use Zod validation, not parseInt

✅ STEP 4: Implement
- ✅ Get companyId from session (not params)
- ✅ Block view-only statuses
- ✅ Validate with Zod: z.number().positive()
- ✅ Use transaction with proper locking

✅ STEP 5: Document
- No new rules discovered
- Updated File-to-Rule Mapping for new route
```

**🎯 COMMIT TO MEMORY**: Always start with Appendices → Rules → Bug Registry → Implement → Document

---

## How to Use This Document

### Quick Navigation
- **Starting a new feature?** → Read Ultra-Critical rules (Section 1-3) first
- **Modifying existing code?** → Use Appendix B (File-to-Rule Mapping) to find relevant rules
- **Debugging a bug?** → Check Bug Registry (Section 24) for known issues
- **Unsure about edge cases?** → Search for keywords in Table of Contents

### Priority Legend
- 🔴 **ULTRA-CRITICAL**: Violation = Security breach or data integrity failure. NO exceptions allowed.
- 🟠 **CRITICAL**: Violation = Business logic failure or financial loss. Requires executive approval to bypass.
- 🟡 **IMPORTANT**: Violation = Poor UX or operational inefficiency. Requires product team review.
- 🔒 **SECURITY**: Violation = Attack surface or vulnerability. Security team review required.
- ⏰ **AUTOMATION**: Violation = Cron jobs fail or data becomes stale. Monitor carefully.
- 🗄️ **DATABASE**: Violation = Data inconsistency or corruption. DBA review required.

### Rule Template Structure
Each rule follows this standard format:
1. **Priority Badge** + **Rule ID** + **Title**
2. **The Rule** (MUST/MUST NOT directives)
3. **Why This Matters** (business + technical impact)
4. **Implementation Checklist** (step-by-step verification)
5. **Code Examples** (✅ correct, ❌ wrong patterns)
6. **Enforcement Points** (files where rule is enforced)
7. **Common Violations** (historical mistakes to avoid)
8. **Related Rules** (cross-references)
9. **Quick Reference Card** (one-line summary)

---

## Table of Contents

### Part 1: Ultra-Critical Rules (Security & Data Integrity)
1. [Company Data Segregation](#1-company-data-segregation) 🔴
2. [Guest Booking = Feature (Not a Bug)](#2-guest-booking--feature-not-a-bug) 🔴
3. [Trip Status Lifecycle & View-Only Protection](#3-trip-status-lifecycle--view-only-protection) 🔴

### Part 2: Critical Rules (Business Logic & Revenue)
4. [Auto-Halt System (Dual Behavior)](#4-auto-halt-system-dual-behavior) 🟠
5. [24-Hour Resource Allocation Rule](#5-24-hour-resource-allocation-rule) 🟠
6. [Manual Ticketing Exemption](#6-manual-ticketing-exemption) 🟠
7. [Payment & Commission Calculation](#7-payment--commission-calculation) 🟠
8. [CSV/Excel Import Validation](#8-csvexcel-import-validation) 🟠

### Part 3: Important Rules (Operations & UX)
9. [Staff Role Management & Permissions](#9-staff-role-management--permissions) 🟡
10. [Vehicle & Fleet Management](#10-vehicle--fleet-management) 🟡
11. [Seat Selection & Booking Conflicts](#11-seat-selection--booking-conflicts) 🟡
12. [Notification & Communication Rules](#12-notification--communication-rules) 🟡
13. [Manifest Generation & Tracking](#13-manifest-generation--tracking) 🟡

### Part 4: Security Rules (Attack Prevention)
14. [Input Validation & Sanitization](#14-input-validation--sanitization) 🔒
15. [Rate Limiting & Abuse Prevention](#15-rate-limiting--abuse-prevention) 🔒
16. [Authentication & Session Management](#16-authentication--session-management) 🔒
17. [Payment Security & Replay Protection](#17-payment-security--replay-protection) 🔒

### Part 5: Automation Rules (Cron Jobs & Background Tasks)
18. [Old Trip Status Cleanup](#18-old-trip-status-cleanup) ⏰
19. [Booking Timeout & Payment Expiration](#19-booking-timeout--payment-expiration) ⏰
20. [Predictive Maintenance Scoring](#20-predictive-maintenance-scoring) ⏰

### Part 6: Database Rules (Data Integrity)
21. [Schema Constraints & Relationships](#21-schema-constraints--relationships) 🗄️
22. [Transaction Management & Locking](#22-transaction-management--locking) 🗄️
23. [Optimistic Locking & Race Conditions](#23-optimistic-locking--race-conditions) 🗄️

### Part 7: Historical Bug Registry
24. [Critical Bugs That Must NEVER Be Reintroduced](#24-critical-bugs-that-must-never-be-reintroduced) 🐛

### Appendices
- [Appendix A: Rule Cross-Reference Matrix](#appendix-a-rule-cross-reference-matrix)
- [Appendix B: File-to-Rule Mapping](#appendix-b-file-to-rule-mapping)
- [Appendix C: Rule Violation Checklist](#appendix-c-rule-violation-checklist)
- [Appendix D: Glossary](#appendix-d-glossary)
- [Changelog](#changelog)
- [Maintenance Guidelines](#maintenance-guidelines)

---

# PART 1: ULTRA-CRITICAL RULES

## 1. Company Data Segregation

**🔴 ULTRA-CRITICAL** | **Rule ID**: `RULE-001` | **Category**: Security & Data Integrity

### The Rule

**MUST enforce complete data isolation between bus companies at ALL levels:**

1. ✅ **MUST** filter ALL database queries by `companyId` (except Super Admin viewing all)
2. ✅ **MUST** validate user's company matches requested resource's company
3. ✅ **MUST** prevent cross-company data access via API, UI, and direct DB queries
4. ✅ **MUST NOT** allow Company A to see Company B's:
   - Trips, bookings, passengers, tickets
   - Staff, vehicles, work orders, maintenance records
   - Revenue data, commission details, manifests
   - Audit logs (except Super Admin logs which have `companyId = null`)
   - Chat messages, support tickets, notifications
5. ✅ **MUST** use row-level security mindset: every query = explicit company filter
6. ✅ **ONLY SHARED RESOURCE**: Organic City database (all companies use same city list)

### Why This Matters

**Business Impact**:
- **Legal Liability**: GDPR/data protection violations if Company A sees Company B's passenger data
- **Competitive Intelligence**: Revenue, routes, pricing strategies must remain confidential
- **Trust Damage**: Customers lose confidence if they discover data leaks between competitors
- **Contract Breach**: Platform agreements guarantee company data segregation

**Technical Impact**:
- **Security Breach**: Most severe vulnerability class in the platform
- **Audit Compliance**: Regulators require proof of data isolation
- **Financial Loss**: Lawsuits, fines, customer compensation claims

### Implementation Checklist

```typescript
// ✅ STEP 1: Extract user's company from session
const session = await getServerSession(authOptions);
const userCompanyId = session?.user?.companyId;

// ✅ STEP 2: Validate company access
if (!userCompanyId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// ✅ STEP 3: Filter ALL queries by companyId
const trips = await prisma.trip.findMany({
  where: {
    companyId: userCompanyId, // 🔴 CRITICAL: Never omit this!
    // ... other filters
  }
});

// ✅ STEP 4: Validate resource ownership before updates/deletes
const trip = await prisma.trip.findUnique({ where: { id: tripId } });
if (trip.companyId !== userCompanyId) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

### Code Examples

**✅ CORRECT: Company-filtered query**
```typescript
// Company Admin viewing own trips
const trips = await prisma.trip.findMany({
  where: {
    companyId: session.user.companyId, // ✅ Explicit filter
    status: "SCHEDULED"
  }
});
```

**❌ WRONG: Missing company filter**
```typescript
// 🔴 SECURITY BREACH: Returns ALL companies' trips!
const trips = await prisma.trip.findMany({
  where: {
    status: "SCHEDULED" // ❌ No companyId filter!
  }
});
```

**✅ CORRECT: Super Admin bypass (intentional)**
```typescript
// Super Admin viewing all trips across companies
const session = await getServerSession(authOptions);
if (session?.user?.role !== "SUPER_ADMIN") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ✅ Super Admin can omit companyId filter
const allTrips = await prisma.trip.findMany({
  include: { company: true } // Include company name for context
});
```

**❌ WRONG: Trusting client-provided companyId**
```typescript
// 🔴 SECURITY BREACH: Attacker can set any companyId!
const { companyId } = await request.json();
const trips = await prisma.trip.findMany({
  where: { companyId } // ❌ Never trust client input!
});
```

### Enforcement Points

**API Routes** (50+ files):
- `src/app/api/company/**/*.ts` - All company-scoped APIs
- `src/app/api/staff/**/*.ts` - Staff portal APIs
- `src/app/api/cashier/**/*.ts` - Cashier portal APIs
- `src/app/api/mechanic/**/*.ts` - Mechanic portal APIs
- `src/app/api/finance/**/*.ts` - Finance portal APIs

**Critical Files**:
- `src/app/api/company/trips/route.ts:45` - Trip listing
- `src/app/api/company/staff/route.ts:38` - Staff listing
- `src/app/api/company/vehicles/route.ts:41` - Vehicle listing
- `src/app/api/company/messages/route.ts:52` - Company chat
- `src/app/api/company/audit-logs/route.ts:47` - Audit log access

**Database Layer**:
- All Prisma queries in company-scoped routes
- Middleware: `src/middleware.ts` (session validation)

### Common Violations

1. **Forgot companyId filter** (most common)
   - Symptom: Company A sees Company B's data in listings
   - Fix: Add `companyId: session.user.companyId` to WHERE clause

2. **Used URL param instead of session**
   - Symptom: Attacker can change `?companyId=2` in URL to access other companies
   - Fix: ALWAYS use `session.user.companyId`, NEVER trust URL/body params

3. **Missing ownership validation before UPDATE/DELETE**
   - Symptom: Company A can edit/delete Company B's trips via direct API calls
   - Fix: Fetch resource first, verify `resource.companyId === session.user.companyId`

4. **Leaked data via JOIN/include without filtering**
   - Symptom: Trip includes passengers from other companies' bookings
   - Fix: Add `where: { companyId }` to nested relations

5. **Super Admin audit logs visible to companies**
   - Symptom: Companies see platform surveillance logs (`companyId = null`)
   - Fix: Filter audit logs: `WHERE companyId = userCompanyId` (excludes null)

### Related Rules

- [Rule 16: Authentication & Session Management](#16-authentication--session-management) - How to extract companyId from session
- [Rule 21: Schema Constraints & Relationships](#21-schema-constraints--relationships) - Database FK relationships
- [Bug #3: Staff API Role Filter Broken](#bug-3-staff-api-role-filter-broken) - Historical company segregation bug

### Quick Reference Card

```
🔴 RULE-001: Company Data Segregation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DO: Filter ALL queries by session.user.companyId
❌ DON'T: Trust client-provided companyId params
✅ DO: Validate ownership before UPDATE/DELETE
❌ DON'T: Use JOINs without company filtering
🎯 Exception: Super Admin (with role check)
```

---

## 2. Guest Booking = Feature (Not a Bug)

**🔴 ULTRA-CRITICAL** | **Rule ID**: `RULE-002` | **Category**: Product Design

### The Rule

**MUST allow guests to book tickets without OTP/SMS verification:**

1. ✅ **MUST** allow booking with ONLY phone number (no account required)
2. ✅ **MUST** treat TeleBirr payment completion as sufficient verification
3. ✅ **MUST NOT** add OTP/SMS verification to guest booking flow
4. ✅ **MUST NOT** require email verification for guest bookings
5. ✅ **MUST** create ticket immediately after successful payment
6. ✅ **MUST** send ticket via SMS to provided phone number
7. ✅ **This is BY DESIGN**, not a security gap

### Why This Matters

**Business Impact**:
- **Conversion Rate**: OTP adds friction → 30-40% drop-off rate
- **Customer Preference**: Ethiopian users prefer "pay first, verify never"
- **Competitive Advantage**: Competitors require registration → we don't
- **Revenue**: Guest bookings account for 60% of platform revenue
- **Trust Signal**: Payment verification IS the trust mechanism

**Technical Impact**:
- **Payment as Proof**: TeleBirr transaction = verified Ethiopian phone number
- **Fraud Protection**: TeleBirr handles fraud detection, not i-Ticket
- **SMS Cost**: Verification OTP = additional cost with no benefit

**Product Philosophy**:
- Phone payment (TeleBirr/M-Pesa) IS verification in African context
- Customers trust payment systems more than OTP systems
- Friction at payment = acceptable; friction before payment = conversion killer

### Implementation Checklist

```typescript
// ✅ STEP 1: Guest booking flow (NO OTP)
const guestBooking = {
  phone: "0912345678", // Only required field
  passengers: [...],
  seats: [...],
  // ❌ NO email, NO password, NO OTP
};

// ✅ STEP 2: Create pending booking
const booking = await prisma.booking.create({
  data: {
    userId: null, // ✅ Null for guests
    guestPhone: phone,
    status: "PENDING",
    ...guestBooking
  }
});

// ✅ STEP 3: Payment verification = sufficient
if (teleBirrResponse.status === "success") {
  // ✅ Payment succeeded = verified phone
  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CONFIRMED" }
  });

  // ✅ Send ticket via SMS (NO OTP)
  await sendTicketSMS(phone, ticketCode);
}
```

### Code Examples

**✅ CORRECT: Guest booking without OTP**
```typescript
// Guest provides only phone + passenger details
export async function POST(request: Request) {
  const { phone, passengers, seats, tripId } = await request.json();

  // ✅ No OTP validation, no account creation
  const booking = await prisma.booking.create({
    data: {
      userId: null, // ✅ Guest booking
      guestPhone: phone,
      tripId,
      status: "PENDING",
      passengers: { create: passengers }
    }
  });

  // ✅ Payment = verification
  return initiatePayment(booking);
}
```

**❌ WRONG: Adding OTP to guest flow**
```typescript
// 🔴 PRODUCT VIOLATION: DO NOT ADD OTP!
export async function POST(request: Request) {
  const { phone, otp } = await request.json(); // ❌ NO!

  // ❌ This kills conversion rate!
  const isValid = await verifyOTP(phone, otp);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  }

  // ... rest of booking flow
}
```

**✅ CORRECT: Track guest bookings in analytics**
```typescript
// Distinguish guest vs. registered user bookings
const bookingType = booking.userId ? "REGISTERED" : "GUEST";

await prisma.adminLog.create({
  data: {
    action: "BOOKING_CREATED",
    details: `${bookingType} booking for trip ${tripId}`
  }
});
```

### Enforcement Points

**API Routes**:
- `src/app/api/booking/create/route.ts:67` - Guest booking creation
- `src/app/api/payment/telebirr/callback/route.ts:89` - Payment verification
- `src/lib/sms/send-ticket.ts:23` - SMS delivery (no OTP)

**UI Components**:
- `src/app/(customer)/booking/[tripId]/page.tsx:145` - Guest form (phone only)
- `src/components/booking/GuestBookingForm.tsx:78` - No OTP input fields

**Business Logic**:
- `src/lib/booking/guest-handler.ts:34` - Guest booking validator
- `src/lib/payment/telebirr-handler.ts:56` - Payment as verification

### Common Violations

1. **Developer adds OTP "for security"**
   - Symptom: Guest conversion rate drops 30%+
   - Why Wrong: Payment IS the security mechanism
   - Fix: Remove OTP, trust TeleBirr verification

2. **Requiring email for guest bookings**
   - Symptom: Form validation fails, customers abandon
   - Why Wrong: Many Ethiopian users don't have/use email
   - Fix: Make email optional, phone is sufficient

3. **Forcing account creation after first booking**
   - Symptom: Returning guests can't book without registration
   - Why Wrong: Violates "guest forever" principle
   - Fix: Always allow guest option, even for repeat customers

4. **SMS OTP before payment**
   - Symptom: SMS costs double (OTP + ticket), conversion drops
   - Why Wrong: OTP adds no value, payment validates phone
   - Fix: Skip OTP, only send ticket SMS after payment

### Related Rules

- [Rule 7: Payment & Commission Calculation](#7-payment--commission-calculation) - TeleBirr integration
- [Rule 16: Authentication & Session Management](#16-authentication--session-management) - Guest vs. registered users
- [Rule 19: Booking Timeout & Payment Expiration](#19-booking-timeout--payment-expiration) - Guest booking expiration

### Quick Reference Card

```
🔴 RULE-002: Guest Booking = Feature
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DO: Allow booking with phone only
❌ DON'T: Add OTP/SMS verification
✅ DO: Trust TeleBirr payment as verification
❌ DON'T: Require email or registration
🎯 Mantra: "Payment IS verification"
```

---

## 3. Trip Status Lifecycle & View-Only Protection

**🔴 ULTRA-CRITICAL** | **Rule ID**: `RULE-003` | **Category**: Data Integrity

### The Rule

**MUST enforce strict trip status transitions and view-only protection:**

1. ✅ **Valid Status Transitions**:
   - `SCHEDULED` → `BOARDING` (1 hour before departure)
   - `BOARDING` → `DEPARTED` (manual or auto after departure time)
   - `DEPARTED` → `COMPLETED` (manual after arrival)
   - `SCHEDULED/BOARDING` → `CANCELLED` (if trip won't happen)

2. ✅ **View-Only Status Protection** (`DEPARTED`, `COMPLETED`, `CANCELLED`):
   - **MUST block** manual ticket sales
   - **MUST block** cashier ticket sales
   - **MUST block** trip updates (PUT requests)
   - **MUST block** resume booking
   - **MUST block** status changes (except `DEPARTED` → `COMPLETED`)
   - **MUST display** ViewOnlyBanner in UI
   - **MUST disable** Edit Trip button
   - **MUST redirect** edit page attempts
   - **MUST force** bookingHalted = true

3. ✅ **Automatic Status Updates**:
   - **MUST** run cron job every 15 minutes to mark old trips:
     - `status = SCHEDULED` + `date < today` + `hasBookings` → `COMPLETED`
     - `status = SCHEDULED` + `date < today` + `noBookings` → `CANCELLED`
   - **MUST** create `TRIP_STATUS_AUTO_UPDATE` audit log

4. ✅ **Booking Halt on Final Status**:
   - When status → `DEPARTED/COMPLETED/CANCELLED`:
     - **MUST** set `bookingHalted = true` (unconditional)
     - **MUST** ignore bypass settings (global/trip-specific)
     - **MUST** block ALL new bookings (online + manual)

### Why This Matters

**Business Impact**:
- **Data Integrity**: Historical trip data must be immutable for audits
- **Financial Compliance**: Revenue reports require stable COMPLETED trip data
- **Customer Trust**: Can't sell tickets for buses that already left
- **Legal Protection**: Audit trail must show no post-departure modifications

**Technical Impact**:
- **Idempotency**: COMPLETED trips = final state, never changes
- **Consistency**: Reports, manifests, commissions depend on stable statuses
- **Race Conditions**: Prevents conflicts from editing active trips

### Implementation Checklist

```typescript
// ✅ STEP 1: Check if trip is view-only
const isViewOnly = ["DEPARTED", "COMPLETED", "CANCELLED"].includes(trip.status);

// ✅ STEP 2: Block modifications for view-only trips
if (isViewOnly) {
  return NextResponse.json(
    { error: `Cannot modify ${trip.status} trip. Trip is view-only.` },
    { status: 403 }
  );
}

// ✅ STEP 3: Force halt booking on final status
if (["DEPARTED", "COMPLETED", "CANCELLED"].includes(newStatus)) {
  await prisma.trip.update({
    where: { id: tripId },
    data: {
      status: newStatus,
      bookingHalted: true, // ✅ Unconditional
    }
  });
}

// ✅ STEP 4: Auto-update old trips (cron job)
const oldTrips = await prisma.trip.findMany({
  where: {
    status: "SCHEDULED",
    departureDate: { lt: new Date() }
  }
});

for (const trip of oldTrips) {
  const hasBookings = await prisma.booking.count({
    where: { tripId: trip.id, status: "CONFIRMED" }
  });

  await prisma.trip.update({
    where: { id: trip.id },
    data: {
      status: hasBookings ? "COMPLETED" : "CANCELLED",
      bookingHalted: true
    }
  });
}
```

### Code Examples

**✅ CORRECT: View-only protection in API**
```typescript
// Manual ticket sale route
export async function POST(request: Request, { params }: { params: { tripId: string } }) {
  const trip = await prisma.trip.findUnique({ where: { id: params.tripId } });

  // ✅ Block view-only trips BEFORE any other checks
  if (["DEPARTED", "COMPLETED", "CANCELLED"].includes(trip.status)) {
    return NextResponse.json(
      { error: "Cannot sell tickets for this trip. Trip has already departed or been cancelled." },
      { status: 403 }
    );
  }

  // ... rest of ticket sale logic
}
```

**❌ WRONG: Missing view-only check**
```typescript
// 🔴 DATA INTEGRITY VIOLATION: Allows editing COMPLETED trips!
export async function PUT(request: Request, { params }: { params: { tripId: string } }) {
  const { price, departureTime } = await request.json();

  // ❌ No status check! Can modify historical data!
  await prisma.trip.update({
    where: { id: params.tripId },
    data: { price, departureTime }
  });
}
```

**✅ CORRECT: UI view-only banner**
```tsx
// Trip detail page
const isViewOnly = ["DEPARTED", "COMPLETED", "CANCELLED"].includes(trip.status);

{isViewOnly && (
  <ViewOnlyBanner
    status={trip.status}
    message="This trip is view-only. No modifications allowed."
  />
)}

<Button
  disabled={isViewOnly}
  onClick={() => router.push(`/company/trips/${trip.id}/edit`)}
>
  Edit Trip
</Button>
```

**✅ CORRECT: Status transition validation**
```typescript
// Status change API
const VALID_TRANSITIONS = {
  SCHEDULED: ["BOARDING", "CANCELLED"],
  BOARDING: ["DEPARTED", "CANCELLED"],
  DEPARTED: ["COMPLETED"], // Only DEPARTED → COMPLETED allowed
  COMPLETED: [], // Final state, no transitions
  CANCELLED: [], // Final state, no transitions
};

if (!VALID_TRANSITIONS[currentStatus].includes(newStatus)) {
  return NextResponse.json(
    { error: `Cannot transition from ${currentStatus} to ${newStatus}` },
    { status: 400 }
  );
}
```

### Enforcement Points

**API Routes**:
- `src/app/api/company/trips/[tripId]/manual-ticket/route.ts:78` - Manual ticketing block
- `src/app/api/cashier/trip/[tripId]/sell/route.ts:67` - Cashier ticketing block
- `src/app/api/company/trips/[tripId]/route.ts:89` (PUT) - Trip update block
- `src/app/api/company/trips/[tripId]/resume/route.ts:45` - Resume booking block
- `src/app/api/company/trips/[tripId]/status/route.ts:56` - Status transition validation

**UI Components**:
- `src/components/company/ViewOnlyBanner.tsx` - Visual indicator
- `src/app/(company)/company/trips/[tripId]/page.tsx:234` - Edit button disabled
- `src/app/(company)/company/trips/[tripId]/edit/page.tsx:67` - Redirect with toast

**Cron Jobs**:
- `src/app/api/cron/cleanup-old-trips/route.ts:34` - Auto-status updates (every 15 min)

**Database**:
- `prisma/schema.prisma:145` - Status enum definition
- Migration: `20260121_add_view_only_protection.sql`

### Common Violations

1. **Forgot view-only check in new APIs**
   - Symptom: New feature allows editing COMPLETED trips
   - Fix: Add status check at beginning of ALL modification APIs

2. **Allowed COMPLETED → CANCELLED transition**
   - Symptom: Historical data changes, breaks financial reports
   - Fix: Block ALL transitions from COMPLETED/CANCELLED

3. **UI allows editing but API blocks**
   - Symptom: User clicks "Edit", gets error, confusion
   - Fix: Disable UI buttons for view-only trips

4. **Seed creates old SCHEDULED trips**
   - Symptom: Database has past trips that should be COMPLETED/CANCELLED
   - Fix: Seed should create trips with `date >= today` OR set correct status

5. **Manual status override bypasses halt**
   - Symptom: Trip marked DEPARTED but bookingHalted still false
   - Fix: Status change API must ALWAYS set bookingHalted=true for final statuses

### Related Rules

- [Rule 4: Auto-Halt System](#4-auto-halt-system-dual-behavior) - Booking halt interactions
- [Rule 6: Manual Ticketing Exemption](#6-manual-ticketing-exemption) - View-only overrides exemption
- [Rule 18: Old Trip Status Cleanup](#18-old-trip-status-cleanup) - Automated status updates
- [Bug #8: View-Only Protection Missing](#bug-8-view-only-protection-missing) - Historical violation

### Quick Reference Card

```
🔴 RULE-003: Trip Status Lifecycle
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DO: Block ALL modifications for DEPARTED/COMPLETED/CANCELLED
❌ DON'T: Allow status transitions from final states
✅ DO: Force bookingHalted=true on final status
❌ DON'T: Trust bypass settings for final statuses
🎯 Mantra: "Final status = immutable data"
```

---

# PART 2: CRITICAL RULES

## 4. Auto-Halt System (Dual Behavior)

**🟠 CRITICAL** | **Rule ID**: `RULE-004` | **Category**: Business Logic

### The Rule

**MUST implement dual-behavior auto-halt system:**

1. ✅ **Fixed Threshold**: Auto-halt triggers at ≤10 seats (NOT percentage-based)
   - 15-seater bus: Halts at 10 seats
   - 45-seater bus: Halts at 10 seats
   - 60-seater bus: Halts at 10 seats

2. ✅ **Dual Behavior (CRITICAL)**:
   - **Manual ticketing**: Can ALWAYS sell down to 0 seats (NEVER blocked by auto-halt)
   - **Online booking**: Auto-halts at ≤10 seats (unless bypassed by checkboxes)

3. ✅ **Trigger Sources** (auto-halt fires when slots ≤10 from):
   - Online booking payment completion
   - Manual ticket sale (cashier/ticketer routes)

4. ✅ **Two-Level Bypass Control**:
   - **Company-wide**: `Company.disableAutoHaltGlobally` checkbox
   - **Trip-specific**: `Trip.autoResumeEnabled` checkbox
   - **Priority**: Company-wide > Trip-specific > Default (auto-halt ON)

5. ✅ **Behavior When Halted**:
   - Online booking: Blocked (trip doesn't appear in search or shows "FULLY BOOKED")
   - Manual ticketing: Always allowed (can sell all remaining seats)

6. ✅ **Resume Booking**:
   - Company admin can manually resume via UI button
   - Creates `BOOKING_RESUMED_MANUALLY` audit log

### Why This Matters

**Business Impact**:
- **Walk-in Customer Priority**: Manual ticketers need unrestricted access
- **Revenue Protection**: Prevents online bookings from overselling
- **Operational Flexibility**: Companies can bypass for special cases
- **Customer Expectations**: Last-minute walk-ins expect ticket availability

**Technical Impact**:
- **Prevents Conflicts**: Online + manual sales competing for same seats
- **Data Integrity**: availableSlots never goes negative
- **Audit Trail**: Every halt/resume logged for accountability

### Implementation Checklist

```typescript
// ✅ STEP 1: Check bypass settings
const company = await prisma.company.findUnique({
  where: { id: trip.companyId },
  select: { disableAutoHaltGlobally: true }
});

// ✅ STEP 2: Determine if auto-halt should fire
const shouldAutoHalt =
  trip.availableSlots <= 10 &&
  !company.disableAutoHaltGlobally &&
  !trip.autoResumeEnabled;

// ✅ STEP 3: Apply auto-halt for ONLINE booking
if (shouldAutoHalt && !trip.bookingHalted) {
  await prisma.trip.update({
    where: { id: trip.id },
    data: { bookingHalted: true }
  });

  await prisma.adminLog.create({
    data: {
      companyId: trip.companyId,
      action: "AUTO_HALT_LOW_SLOTS",
      details: `Trip auto-halted: ${trip.availableSlots} seats remaining`
    }
  });
}

// ✅ STEP 4: Manual ticketing ALWAYS proceeds
// NO check for bookingHalted in manual-ticket route
// Only check: trip status (not DEPARTED/COMPLETED/CANCELLED)
```

### Code Examples

**✅ CORRECT: Online booking checks auto-halt**
```typescript
// Online booking route
export async function POST(request: Request) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { company: true }
  });

  // ✅ Block if auto-halt is active
  if (trip.bookingHalted) {
    return NextResponse.json(
      { error: "Booking is temporarily halted. Please contact bus company." },
      { status: 403 }
    );
  }

  // ... proceed with online booking
}
```

**✅ CORRECT: Manual ticketing ignores auto-halt**
```typescript
// Manual ticketing route
export async function POST(request: Request, { params }: { params: { tripId: string } }) {
  const trip = await prisma.trip.findUnique({ where: { id: params.tripId } });

  // ✅ Check trip status (view-only protection)
  if (["DEPARTED", "COMPLETED", "CANCELLED"].includes(trip.status)) {
    return NextResponse.json(
      { error: "Cannot sell tickets. Trip has departed/completed/cancelled." },
      { status: 403 }
    );
  }

  // ✅ NO check for bookingHalted! Manual ticketing always proceeds.

  // ... sell ticket, then trigger auto-halt if needed
  const updatedTrip = await prisma.trip.update({
    where: { id: params.tripId },
    data: { availableSlots: { decrement: seats.length } }
  });

  // Trigger auto-halt for future ONLINE bookings
  if (updatedTrip.availableSlots <= 10 && !updatedTrip.bookingHalted) {
    await autoHaltTripIfNeeded(updatedTrip);
  }
}
```

**❌ WRONG: Manual ticketing blocked by auto-halt**
```typescript
// 🔴 BUSINESS LOGIC VIOLATION
export async function POST(request: Request, { params }: { params: { tripId: string } }) {
  const trip = await prisma.trip.findUnique({ where: { id: params.tripId } });

  // ❌ WRONG: Manual ticketing should NEVER check bookingHalted!
  if (trip.bookingHalted) {
    return NextResponse.json(
      { error: "Booking is halted" },
      { status: 403 }
    );
  }

  // This prevents walk-in customers from buying tickets!
}
```

**✅ CORRECT: Auto-halt with bypass check**
```typescript
// Auto-halt function
export async function autoHaltTripIfNeeded(trip: Trip) {
  const company = await prisma.company.findUnique({
    where: { id: trip.companyId },
    select: { disableAutoHaltGlobally: true }
  });

  // ✅ Check all bypass conditions
  if (
    trip.availableSlots <= 10 &&
    !trip.bookingHalted &&
    !company.disableAutoHaltGlobally && // Company-wide bypass
    !trip.autoResumeEnabled // Trip-specific bypass
  ) {
    await prisma.trip.update({
      where: { id: trip.id },
      data: { bookingHalted: true }
    });

    await sendClickUpAlert("AUTO_HALT_LOW_SLOTS", trip);
  }
}
```

### Enforcement Points

**API Routes**:
- `src/app/api/booking/create/route.ts:89` - Online booking halt check
- `src/app/api/company/trips/[tripId]/manual-ticket/route.ts:124` - Auto-halt trigger (no block)
- `src/app/api/cashier/trip/[tripId]/sell/route.ts:98` - Auto-halt trigger (no block)
- `src/app/api/company/trips/[tripId]/resume/route.ts:45` - Manual resume

**Business Logic**:
- `src/lib/auto-halt/check-and-halt.ts:23` - Auto-halt logic
- `src/lib/auto-halt/should-bypass.ts:15` - Bypass condition checks

**UI Components**:
- `src/components/company/BookingControlCard.tsx:67` - Resume button
- `src/components/public/TripCard.tsx:134` - "FULLY BOOKED" display

**Database Fields**:
- `Trip.bookingHalted` (boolean) - Current halt status
- `Trip.autoResumeEnabled` (boolean) - Trip-specific bypass
- `Company.disableAutoHaltGlobally` (boolean) - Company-wide bypass

### Common Violations

1. **Manual ticketing checks bookingHalted**
   - Symptom: Walk-in customers turned away even with available seats
   - Fix: Remove bookingHalted check from manual-ticket routes

2. **Percentage-based threshold**
   - Symptom: 15-seater halts at 1.5 seats, 60-seater halts at 6 seats
   - Fix: Use fixed 10-seat threshold for ALL bus sizes

3. **Forgot to trigger auto-halt after manual sale**
   - Symptom: Manual sale drops slots to ≤10, but online booking still allowed
   - Fix: Call autoHaltTripIfNeeded() after decrementing availableSlots

4. **Auto-halt re-trigger loop**
   - Symptom: Same trip halted multiple times, spam audit logs
   - Fix: Check `!trip.bookingHalted` before triggering

5. **Bypass priority wrong**
   - Symptom: Trip-specific bypass ignored when company-wide disabled
   - Fix: Priority order: Company-wide > Trip-specific > Default

### Related Rules

- [Rule 3: Trip Status Lifecycle](#3-trip-status-lifecycle--view-only-protection) - Final statuses force halt
- [Rule 6: Manual Ticketing Exemption](#6-manual-ticketing-exemption) - Why manual ignores halt
- [Rule 11: Seat Selection & Booking Conflicts](#11-seat-selection--booking-conflicts) - Seat locking
- [Bug #4: Auto-Halt Re-Trigger Loop](#bug-4-auto-halt-re-trigger-loop) - Historical issue

### Quick Reference Card

```
🟠 RULE-004: Auto-Halt System
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DO: Use fixed 10-seat threshold (not %)
❌ DON'T: Block manual ticketing with bookingHalted check
✅ DO: Trigger auto-halt after manual sale if slots ≤10
❌ DON'T: Ignore bypass settings (check both levels)
🎯 Mantra: "Manual ticketing never stops"
```

---

## 5. 24-Hour Resource Allocation Rule

**🟠 CRITICAL** | **Rule ID**: `RULE-005` | **Category**: Business Logic

### The Rule

**MUST prevent same vehicle/driver/conductor from being used within 24 hours:**

1. ✅ **Logic**: If resource departs on Day 1 at any time, unavailable until Day 3
   - Example: Bus leaves Monday 8 AM → returns Tuesday 8 AM (unavailable) → available Wednesday 12:01 AM

2. ✅ **Applies To**:
   - Trip creation (single trip)
   - Batch trip creation (multiple dates)
   - CSV/Excel import (bulk import)
   - Trip editing (vehicle/staff changes)

3. ✅ **Resources Checked**:
   - Vehicle (`vehicleId`)
   - Driver (`driverId`)
   - Conductor (`conductorId`)
   - Ticketer is NOT checked (can work multiple trips same day)

4. ✅ **Validation**:
   - Query existing trips: `WHERE departureDate BETWEEN (newDate - 1 day) AND (newDate + 1 day)`
   - If match found: Reject with error listing conflicting trip(s)

5. ✅ **Error Message Format**:
   ```
   Vehicle [Plate] is already scheduled for:
   - Trip #123 on 2026-01-20 08:00 (Addis Ababa → Bahir Dar)
   - Trip #456 on 2026-01-22 14:00 (Bahir Dar → Gondar)
   ```

### Why This Matters

**Business Impact**:
- **Physical Impossibility**: Bus can't be in two cities simultaneously
- **Driver Fatigue**: 24-hour rest requirement for safety
- **Customer Trust**: Double-booking causes trip cancellations
- **Legal Compliance**: Ethiopian transport regulations require rest periods

**Technical Impact**:
- **Data Integrity**: Prevents impossible schedules
- **Conflict Prevention**: Catches errors before customers book
- **Audit Trail**: Clear reason for rejection

### Implementation Checklist

```typescript
// ✅ STEP 1: Define 24-hour window
const newDepartureDate = new Date("2026-01-23");
const dayBefore = new Date(newDepartureDate);
dayBefore.setDate(dayBefore.getDate() - 1);
const dayAfter = new Date(newDepartureDate);
dayAfter.setDate(dayAfter.getDate() + 1);

// ✅ STEP 2: Check vehicle conflicts
const vehicleConflicts = await prisma.trip.findMany({
  where: {
    companyId: session.user.companyId,
    vehicleId: selectedVehicleId,
    departureDate: {
      gte: dayBefore,
      lte: dayAfter
    },
    id: { not: currentTripId }, // Exclude current trip when editing
    status: { notIn: ["CANCELLED", "COMPLETED"] } // Ignore finished trips
  }
});

// ✅ STEP 3: Check driver conflicts (same logic)
const driverConflicts = await prisma.trip.findMany({
  where: {
    companyId: session.user.companyId,
    driverId: selectedDriverId,
    departureDate: { gte: dayBefore, lte: dayAfter },
    id: { not: currentTripId },
    status: { notIn: ["CANCELLED", "COMPLETED"] }
  }
});

// ✅ STEP 4: Check conductor conflicts (same logic)

// ✅ STEP 5: Return detailed errors if conflicts found
if (vehicleConflicts.length > 0) {
  const conflictDetails = vehicleConflicts.map(t =>
    `Trip #${t.id} on ${t.departureDate} (${t.origin} → ${t.destination})`
  ).join("\n- ");

  return NextResponse.json({
    error: `Vehicle ${vehicle.plateNumber} is already scheduled for:\n- ${conflictDetails}`
  }, { status: 400 });
}
```

### Code Examples

**✅ CORRECT: 24-hour conflict check**
```typescript
// Trip creation route
export async function POST(request: Request) {
  const { departureDate, vehicleId, driverId, conductorId } = await request.json();

  const date = new Date(departureDate);
  const dayBefore = new Date(date);
  dayBefore.setDate(dayBefore.getDate() - 1);
  const dayAfter = new Date(date);
  dayAfter.setDate(dayAfter.getDate() + 1);

  // ✅ Check all resources
  const conflicts = await prisma.trip.findMany({
    where: {
      companyId: session.user.companyId,
      OR: [
        { vehicleId },
        { driverId },
        { conductorId }
      ],
      departureDate: {
        gte: dayBefore,
        lte: dayAfter
      },
      status: { notIn: ["CANCELLED", "COMPLETED"] }
    },
    include: { vehicle: true, driver: true, conductor: true }
  });

  if (conflicts.length > 0) {
    return NextResponse.json(
      { error: "24-hour conflict detected", conflicts },
      { status: 400 }
    );
  }

  // ... create trip
}
```

**❌ WRONG: No conflict check**
```typescript
// 🔴 BUSINESS LOGIC VIOLATION
export async function POST(request: Request) {
  const { departureDate, vehicleId, driverId } = await request.json();

  // ❌ No 24-hour validation! Creates impossible schedules!
  const trip = await prisma.trip.create({
    data: { departureDate, vehicleId, driverId }
  });

  return NextResponse.json(trip);
}
```

**✅ CORRECT: Batch creation with conflict check**
```typescript
// Batch trip creation
export async function POST(request: Request) {
  const { dates, vehicleId, driverId } = await request.json();

  // ✅ Check conflicts for ALL dates before creating ANY trips
  for (const date of dates) {
    const conflicts = await check24HourConflicts(date, vehicleId, driverId);
    if (conflicts.length > 0) {
      return NextResponse.json({
        error: `Conflict on ${date}: Vehicle/driver already scheduled`
      }, { status: 400 });
    }
  }

  // ✅ All dates clear, create trips in transaction
  await prisma.$transaction(
    dates.map(date =>
      prisma.trip.create({ data: { date, vehicleId, driverId } })
    )
  );
}
```

**✅ CORRECT: CSV import with gray-out UI**
```typescript
// Multi-date picker component
const handleDateSelect = (selectedDate: Date) => {
  const newSelectedDates = [...selectedDates, selectedDate];

  // ✅ Gray out next day automatically
  const dayAfter = new Date(selectedDate);
  dayAfter.setDate(dayAfter.getDate() + 1);
  setDisabledDates([...disabledDates, dayAfter]);

  setSelectedDates(newSelectedDates);
};
```

### Enforcement Points

**API Routes**:
- `src/app/api/company/trips/route.ts:78` (POST) - Single trip creation
- `src/app/api/company/trips/batch/route.ts:123` - Batch trip creation
- `src/app/api/company/trips/import/route.ts:234` - CSV/Excel import
- `src/app/api/company/trips/[tripId]/route.ts:156` (PUT) - Trip editing

**Validation Logic**:
- `src/lib/import/trip-import-validator.ts:89` - CSV row validation
- `src/lib/validation/24-hour-conflicts.ts:23` - Reusable conflict checker

**UI Components**:
- `src/components/company/MultiDatePicker.tsx:145` - Auto gray-out next day
- `src/app/(company)/company/trips/batch/page.tsx:234` - Batch creation UI

### Common Violations

1. **Same-day check instead of 24-hour**
   - Symptom: Allows Bus A on Monday 11 PM and Tuesday 1 AM (26-hour gap, but <24 hours apart)
   - Fix: Use ±1 day window, not same-date comparison

2. **Forgot to exclude current trip when editing**
   - Symptom: Editing trip shows conflict with itself
   - Fix: Add `id: { not: currentTripId }` to query

3. **Included CANCELLED/COMPLETED trips in check**
   - Symptom: Can't reuse vehicle even after trip finished
   - Fix: Add `status: { notIn: ["CANCELLED", "COMPLETED"] }`

4. **Batch creation validates per-trip instead of pre-flight**
   - Symptom: Creates 3 trips, fails on 4th, now have orphaned trips
   - Fix: Validate ALL dates BEFORE creating ANY trips, use transaction

5. **UI allows selection but API rejects**
   - Symptom: User selects conflicting dates, gets error on submit
   - Fix: Multi-date picker should auto-disable conflicting dates

### Related Rules

- [Rule 8: CSV/Excel Import Validation](#8-csvexcel-import-validation) - Bulk import conflicts
- [Rule 10: Vehicle & Fleet Management](#10-vehicle--fleet-management) - Vehicle assignment
- [Rule 9: Staff Role Management](#9-staff-role-management) - Staff assignment

### Quick Reference Card

```
🟠 RULE-005: 24-Hour Resource Allocation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DO: Check ±1 day window for conflicts
❌ DON'T: Use same-date comparison only
✅ DO: Validate ALL dates before ANY writes (batch)
❌ DON'T: Include CANCELLED/COMPLETED in conflict check
🎯 Mantra: "One bus, one place, 24 hours apart"
```

---

## 6. Manual Ticketing Exemption

**🟠 CRITICAL** | **Rule ID**: `RULE-006` | **Category**: Business Logic

### The Rule

**MUST allow manual ticketing to proceed regardless of auto-halt status:**

1. ✅ **MUST** allow manual ticket sales even when `bookingHalted = true`
2. ✅ **MUST** allow selling down to 0 available seats
3. ✅ **MUST NOT** check `bookingHalted` in manual-ticket or cashier routes
4. ✅ **MUST** still respect trip status (block if DEPARTED/COMPLETED/CANCELLED)
5. ✅ **MUST** still trigger auto-halt after sale if slots drop to ≤10
6. ✅ **Applies To**:
   - Company admin manual ticketing route
   - Cashier portal ticket sales
   - Manual ticket creation from trip detail page

7. ✅ **Does NOT Apply To**:
   - Online booking (customer-facing)
   - Public API trip listings
   - Guest booking flow

### Why This Matters

**Business Impact**:
- **Walk-in Customers**: Must serve customers physically present at bus station
- **Revenue**: Manual sales = immediate cash, can't turn away paying customers
- **Operational Reality**: Auto-halt targets online bookings, not walk-in sales
- **Customer Expectations**: "I'm here with cash, why can't I buy a ticket?"

**Technical Impact**:
- **System Flexibility**: Different rules for online vs. offline channels
- **Data Integrity**: availableSlots still decremented correctly
- **Audit Trail**: Manual sales logged separately from online bookings

### Implementation Checklist

```typescript
// ✅ Manual ticketing route (Company/Cashier)
export async function POST(request: Request, { params }: { params: { tripId: string } }) {
  const trip = await prisma.trip.findUnique({ where: { id: params.tripId } });

  // ✅ STEP 1: Check trip status (view-only protection)
  if (["DEPARTED", "COMPLETED", "CANCELLED"].includes(trip.status)) {
    return NextResponse.json(
      { error: "Cannot sell tickets. Trip has departed or been cancelled." },
      { status: 403 }
    );
  }

  // ✅ STEP 2: NO check for bookingHalted!
  // ❌ DO NOT ADD: if (trip.bookingHalted) { return error; }

  // ✅ STEP 3: Check sufficient seats
  if (trip.availableSlots < selectedSeats.length) {
    return NextResponse.json(
      { error: `Only ${trip.availableSlots} seats available` },
      { status: 400 }
    );
  }

  // ✅ STEP 4: Create ticket + decrement slots
  const ticket = await prisma.ticket.create({ /* ... */ });

  await prisma.trip.update({
    where: { id: params.tripId },
    data: { availableSlots: { decrement: selectedSeats.length } }
  });

  // ✅ STEP 5: Trigger auto-halt if needed (affects future ONLINE bookings)
  const updatedTrip = await prisma.trip.findUnique({ where: { id: params.tripId } });
  if (updatedTrip.availableSlots <= 10) {
    await autoHaltTripIfNeeded(updatedTrip);
  }

  return NextResponse.json(ticket);
}
```

### Code Examples

**✅ CORRECT: Manual ticketing ignores bookingHalted**
```typescript
// src/app/api/company/trips/[tripId]/manual-ticket/route.ts
export async function POST(request: Request, { params }: { params: { tripId: string } }) {
  const trip = await prisma.trip.findUnique({ where: { id: params.tripId } });

  // ✅ Only check trip status, NOT bookingHalted
  if (["DEPARTED", "COMPLETED", "CANCELLED"].includes(trip.status)) {
    return NextResponse.json(
      { error: "Cannot sell tickets for this trip status." },
      { status: 403 }
    );
  }

  // ... create ticket (no bookingHalted check)
}
```

**❌ WRONG: Manual ticketing checks bookingHalted**
```typescript
// 🔴 BUSINESS LOGIC VIOLATION
export async function POST(request: Request, { params }: { params: { tripId: string } }) {
  const trip = await prisma.trip.findUnique({ where: { id: params.tripId } });

  // ❌ This blocks walk-in customers!
  if (trip.bookingHalted) {
    return NextResponse.json(
      { error: "Booking is halted" },
      { status: 403 }
    );
  }

  // Now walk-in customers can't buy tickets even with available seats!
}
```

**✅ CORRECT: Online booking respects auto-halt**
```typescript
// src/app/api/booking/create/route.ts
export async function POST(request: Request) {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });

  // ✅ Online booking MUST check bookingHalted
  if (trip.bookingHalted) {
    return NextResponse.json(
      { error: "This trip is fully booked." },
      { status: 403 }
    );
  }

  // ... create online booking
}
```

### Enforcement Points

**API Routes (MUST NOT check bookingHalted)**:
- `src/app/api/company/trips/[tripId]/manual-ticket/route.ts:78` - Company manual ticketing
- `src/app/api/cashier/trip/[tripId]/sell/route.ts:67` - Cashier portal ticketing

**API Routes (MUST check bookingHalted)**:
- `src/app/api/booking/create/route.ts:89` - Online booking
- `src/app/api/trips/route.ts:45` - Public trip listings (filter out halted)

**UI Components**:
- `src/app/(company)/company/trips/[tripId]/page.tsx:234` - Manual ticket form (always enabled)
- `src/app/(cashier)/cashier/trip/[tripId]/page.tsx:145` - Cashier ticket form (always enabled)
- `src/components/booking/BookingForm.tsx:178` - Online booking form (disabled when halted)

### Common Violations

1. **Added bookingHalted check to manual ticketing**
   - Symptom: Walk-in customers rejected at bus station
   - Fix: Remove check, only validate trip status

2. **Forgot to trigger auto-halt after manual sale**
   - Symptom: Manual sale drops slots to ≤10, online booking still allowed
   - Fix: Call `autoHaltTripIfNeeded()` after decrementing slots

3. **UI shows "HALTED" for manual ticketing interface**
   - Symptom: Cashier confused, thinks they can't sell tickets
   - Fix: Only show halt status on online booking UI

4. **Same API route for online + manual ticketing**
   - Symptom: Can't differentiate behavior
   - Fix: Separate routes: `/booking/create` vs. `/manual-ticket`

### Related Rules

- [Rule 4: Auto-Halt System](#4-auto-halt-system-dual-behavior) - Dual behavior explanation
- [Rule 3: Trip Status Lifecycle](#3-trip-status-lifecycle--view-only-protection) - Status checks still apply
- [Rule 11: Seat Selection](#11-seat-selection--booking-conflicts) - Seat availability checks

### Quick Reference Card

```
🟠 RULE-006: Manual Ticketing Exemption
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DO: Allow manual sales regardless of bookingHalted
❌ DON'T: Check bookingHalted in manual-ticket routes
✅ DO: Still validate trip status (not DEPARTED/etc.)
❌ DON'T: Mix online and manual ticketing logic
🎯 Mantra: "Walk-in customers always get served"
```

---

## 7. Payment & Commission Calculation

**🟠 CRITICAL** | **Rule ID**: `RULE-007` | **Category**: Financial Integrity

### The Rule

**MUST calculate commission and VAT correctly:**

1. ✅ **Commission Structure**:
   - Platform commission: 5% of ticket price
   - VAT on commission: 15% of commission amount
   - Customer pays: Ticket price + Commission + VAT

2. ✅ **Example Calculation** (100 ETB ticket):
   - Ticket price: 100.00 ETB
   - Commission (5%): 5.00 ETB
   - VAT (15% of commission): 0.75 ETB
   - **Total customer pays**: 105.75 ETB

3. ✅ **MUST**:
   - Calculate on server (NEVER trust client)
   - Store commission and VAT separately in database
   - Verify TeleBirr callback amount matches calculated total
   - Track base commission and VAT in `Payment` model

4. ✅ **Validation**:
   - Server recalculates total from ticket price
   - Compares with TeleBirr callback amount
   - Rejects if mismatch (potential tampering)

5. ✅ **Database Storage**:
   ```typescript
   Payment {
     amount: 105.75        // Total customer paid
     commissionAmount: 5.00  // Platform commission (5%)
     vatAmount: 0.75        // VAT on commission (15% of commission)
   }
   ```

### Why This Matters

**Business Impact**:
- **Revenue Accuracy**: Platform commission = primary revenue source
- **Tax Compliance**: VAT must be tracked separately for reporting
- **Financial Audits**: Regulators require precise commission records
- **Trust**: Customers must see transparent breakdown

**Technical Impact**:
- **Security**: Client-side calculations can be manipulated
- **Data Integrity**: Historical payment records must be immutable
- **Reconciliation**: TeleBirr settlements must match platform records

### Implementation Checklist

```typescript
// ✅ STEP 1: Server-side calculation (NEVER trust client)
const ticketPrice = trip.price; // From database, not request body
const commission = ticketPrice * 0.05; // 5%
const vat = commission * 0.15; // 15% of commission
const totalAmount = ticketPrice + commission + vat;

// ✅ STEP 2: Create payment record
const payment = await prisma.payment.create({
  data: {
    bookingId: booking.id,
    amount: totalAmount, // Total customer pays
    commissionAmount: commission, // Platform's cut
    vatAmount: vat, // Tax on commission
    status: "PENDING",
    method: "TELEBIRR"
  }
});

// ✅ STEP 3: Initiate TeleBirr with calculated total
const teleBirrResponse = await initiateTeleBirrPayment({
  amount: totalAmount, // Use server-calculated amount
  referenceId: payment.id
});

// ✅ STEP 4: Verify callback amount matches
export async function handleTeleBirrCallback(callbackData: any) {
  const payment = await prisma.payment.findUnique({
    where: { id: callbackData.referenceId },
    include: { booking: { include: { trip: true } } }
  });

  // ✅ Recalculate expected amount
  const expectedAmount = calculateTotal(payment.booking.trip.price);

  // ✅ Verify amount matches
  if (callbackData.amount !== expectedAmount) {
    await prisma.adminLog.create({
      data: {
        action: "PAYMENT_AMOUNT_MISMATCH",
        details: `Expected ${expectedAmount}, got ${callbackData.amount}`
      }
    });
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  // ✅ Amount verified, mark payment complete
  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "COMPLETED" }
  });
}
```

### Code Examples

**✅ CORRECT: Server-side calculation**
```typescript
// Payment creation route
export async function POST(request: Request) {
  const { bookingId } = await request.json();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { trip: true }
  });

  // ✅ Calculate from database price, not client input
  const ticketPrice = booking.trip.price;
  const commission = Math.round(ticketPrice * 0.05 * 100) / 100; // Round to 2 decimals
  const vat = Math.round(commission * 0.15 * 100) / 100;
  const total = ticketPrice + commission + vat;

  const payment = await prisma.payment.create({
    data: {
      bookingId,
      amount: total,
      commissionAmount: commission,
      vatAmount: vat,
      status: "PENDING"
    }
  });

  return initiatePayment(payment);
}
```

**❌ WRONG: Client-provided amounts**
```typescript
// 🔴 FINANCIAL SECURITY VIOLATION
export async function POST(request: Request) {
  const { bookingId, amount, commission } = await request.json();

  // ❌ Trusting client! Attacker can set commission = 0!
  const payment = await prisma.payment.create({
    data: {
      bookingId,
      amount, // ❌ From client
      commissionAmount: commission, // ❌ From client
      status: "PENDING"
    }
  });

  // Platform loses revenue!
}
```

**✅ CORRECT: TeleBirr callback verification**
```typescript
// TeleBirr callback route
export async function POST(request: Request) {
  const callbackData = await request.json();

  const payment = await prisma.payment.findUnique({
    where: { id: callbackData.referenceId },
    include: { booking: { include: { trip: true } } }
  });

  // ✅ Recalculate expected total
  const ticketPrice = payment.booking.trip.price;
  const commission = ticketPrice * 0.05;
  const vat = commission * 0.15;
  const expectedTotal = ticketPrice + commission + vat;

  // ✅ Verify callback amount
  if (Math.abs(callbackData.amount - expectedTotal) > 0.01) {
    // Allow 0.01 ETB rounding difference
    return NextResponse.json(
      { error: "Payment amount mismatch" },
      { status: 400 }
    );
  }

  // Amount verified, complete payment
  await completePayment(payment.id);
}
```

**✅ CORRECT: Display breakdown to customer**
```tsx
// Payment summary component
function PaymentSummary({ trip }: { trip: Trip }) {
  const ticketPrice = trip.price;
  const commission = ticketPrice * 0.05;
  const vat = commission * 0.15;
  const total = ticketPrice + commission + vat;

  return (
    <div>
      <div>Ticket Price: {ticketPrice.toFixed(2)} ETB</div>
      <div>Service Fee (5%): {commission.toFixed(2)} ETB</div>
      <div>VAT (15%): {vat.toFixed(2)} ETB</div>
      <div className="font-bold">Total: {total.toFixed(2)} ETB</div>
    </div>
  );
}
```

### Enforcement Points

**API Routes**:
- `src/app/api/payment/create/route.ts:45` - Payment creation with calculation
- `src/app/api/payment/telebirr/callback/route.ts:89` - Callback verification
- `src/app/api/payment/telebirr/initiate/route.ts:67` - TeleBirr initiation

**Business Logic**:
- `src/lib/payment/calculate-total.ts:12` - Reusable calculation function
- `src/lib/payment/verify-amount.ts:23` - Amount verification helper

**Database**:
- `prisma/schema.prisma:234` - Payment model with commission/VAT fields

**UI Components**:
- `src/components/booking/PaymentSummary.tsx:45` - Breakdown display
- `src/app/(customer)/booking/[tripId]/payment/page.tsx:123` - Payment page

### Common Violations

1. **Client-side calculation trusted**
   - Symptom: Attackers set commission to 0 via browser DevTools
   - Fix: Always recalculate on server from database price

2. **Forgot to store commission/VAT separately**
   - Symptom: Can't generate tax reports
   - Fix: Add `commissionAmount` and `vatAmount` fields to Payment model

3. **Rounding errors accumulate**
   - Symptom: 100.00 ticket → 105.7499999 total
   - Fix: Use `Math.round(value * 100) / 100` for 2-decimal precision

4. **TeleBirr callback amount not verified**
   - Symptom: Attacker sends fake callback with lower amount
   - Fix: Recalculate expected amount and compare

5. **Commission percentage hardcoded in multiple places**
   - Symptom: Changing commission requires updating 10+ files
   - Fix: Centralize in `src/lib/payment/constants.ts`

### Related Rules

- [Rule 2: Guest Booking](#2-guest-booking--feature-not-a-bug) - Payment as verification
- [Rule 17: Payment Security](#17-payment-security--replay-protection) - Callback security
- [Rule 19: Booking Timeout](#19-booking-timeout--payment-expiration) - Payment expiration

### Quick Reference Card

```
🟠 RULE-007: Payment & Commission
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DO: Calculate commission/VAT on server
❌ DON'T: Trust client-provided amounts
✅ DO: Verify TeleBirr callback amount matches
❌ DON'T: Forget to store commission/VAT separately
🎯 Formula: Total = Price + (Price × 0.05) + (Price × 0.05 × 0.15)
```

---

## 8. CSV/Excel Import Validation

**🟠 CRITICAL** | **Rule ID**: `RULE-008` | **Category**: Data Integrity

### The Rule

**MUST validate CSV/Excel imports comprehensively before database writes:**

1. ✅ **Two-Tier Validation**:
   - **Schema Validation**: Data types, formats, required fields
   - **Business Rule Validation**: 24-hour conflicts, seat capacity, staff roles

2. ✅ **Schema Validation Rules**:
   - Required fields: origin, destination, departureDate, departureTime, price, vehicle, driver, conductor
   - Date format: YYYY-MM-DD or DD/MM/YYYY
   - Time format: HH:MM (24-hour)
   - Price: Positive number
   - Phone numbers: 10 digits starting with 09
   - Max 50 trips per import

3. ✅ **Business Rule Validation**:
   - Future dates only (departureDate >= today)
   - 24-hour resource conflicts (vehicle/driver/conductor)
   - Seat capacity: totalSlots <= vehicle.capacity
   - Staff roles: Driver has DRIVER role, conductor has CONDUCTOR role
   - Vehicle/staff exist in company's database
   - Cities auto-created if not exist (no validation failure)

4. ✅ **Atomic Import**:
   - ALL rows validated BEFORE any database writes
   - If ANY row fails: Import rejected, no partial writes
   - Transaction: All-or-nothing

5. ✅ **Error Reporting**:
   - Row-by-row errors with fix instructions
   - Example: "Row 5: Vehicle ET-123-AA not found. Please check vehicle plate number or add vehicle first."

6. ✅ **Preview Table**:
   - Color-coded: Green (valid), red (error), yellow (warning)
   - Shows parsed data before import
   - User confirms before final import

### Why This Matters

**Business Impact**:
- **Data Quality**: Prevents invalid trips from entering system
- **User Experience**: Clear error messages help fix issues quickly
- **Operational Efficiency**: Bulk import saves hours vs. manual entry
- **Trust**: Companies rely on import accuracy for scheduling

**Technical Impact**:
- **Atomicity**: No partial imports → consistent database state
- **Performance**: Validate before write → fewer failed transactions
- **Audit Trail**: Import log shows what was imported when

### Implementation Checklist

```typescript
// ✅ STEP 1: Parse CSV/XLSX file
const rows = await parseFile(file); // Returns array of row objects

// ✅ STEP 2: Schema validation (all rows)
const schemaErrors = [];
for (const [index, row] of rows.entries()) {
  // Date format
  if (!isValidDate(row.departureDate)) {
    schemaErrors.push({
      row: index + 1,
      field: "departureDate",
      error: "Invalid date format. Use YYYY-MM-DD."
    });
  }

  // Required fields
  if (!row.price || row.price <= 0) {
    schemaErrors.push({
      row: index + 1,
      field: "price",
      error: "Price is required and must be positive."
    });
  }
}

if (schemaErrors.length > 0) {
  return NextResponse.json({ errors: schemaErrors }, { status: 400 });
}

// ✅ STEP 3: Business rule validation
const businessErrors = [];
for (const [index, row] of rows.entries()) {
  // Future dates only
  if (new Date(row.departureDate) < new Date()) {
    businessErrors.push({
      row: index + 1,
      field: "departureDate",
      error: "Departure date must be in the future."
    });
  }

  // Vehicle exists
  const vehicle = await prisma.vehicle.findUnique({
    where: { plateNumber: row.vehiclePlate, companyId }
  });
  if (!vehicle) {
    businessErrors.push({
      row: index + 1,
      field: "vehiclePlate",
      error: `Vehicle ${row.vehiclePlate} not found. Add vehicle first.`
    });
  }

  // Seat capacity
  if (vehicle && row.totalSlots > vehicle.capacity) {
    businessErrors.push({
      row: index + 1,
      field: "totalSlots",
      error: `Seats (${row.totalSlots}) exceed vehicle capacity (${vehicle.capacity}).`
    });
  }

  // 24-hour conflicts
  const conflicts = await check24HourConflicts(row.departureDate, vehicle.id, row.driverId);
  if (conflicts.length > 0) {
    businessErrors.push({
      row: index + 1,
      field: "departureDate",
      error: `24-hour conflict: Vehicle already scheduled for ${conflicts[0].departureDate}`
    });
  }
}

if (businessErrors.length > 0) {
  return NextResponse.json({ errors: businessErrors }, { status: 400 });
}

// ✅ STEP 4: All valid, import in transaction
await prisma.$transaction(
  rows.map(row =>
    prisma.trip.create({
      data: mapRowToTrip(row, companyId)
    })
  )
);

// ✅ STEP 5: Create audit log
await prisma.adminLog.create({
  data: {
    companyId,
    action: "TRIP_IMPORT_COMPLETED",
    details: `Imported ${rows.length} trips via CSV/Excel`
  }
});
```

### Code Examples

**✅ CORRECT: Two-tier validation**
```typescript
// Import validation route
export async function POST(request: Request) {
  const { rows } = await request.json();

  // ✅ TIER 1: Schema validation (fast, no DB queries)
  const schemaErrors = validateSchema(rows);
  if (schemaErrors.length > 0) {
    return NextResponse.json({ errors: schemaErrors }, { status: 400 });
  }

  // ✅ TIER 2: Business rule validation (DB queries)
  const businessErrors = await validateBusinessRules(rows, companyId);
  if (businessErrors.length > 0) {
    return NextResponse.json({ errors: businessErrors }, { status: 400 });
  }

  // ✅ All valid, proceed with import
  return importTrips(rows, companyId);
}
```

**❌ WRONG: Validate per-row during import**
```typescript
// 🔴 DATA INTEGRITY VIOLATION
export async function POST(request: Request) {
  const { rows } = await request.json();

  // ❌ Validates + writes per-row! Creates partial imports!
  for (const row of rows) {
    try {
      // Validate
      if (row.price <= 0) throw new Error("Invalid price");

      // Write (might fail on row 5, but rows 1-4 already written!)
      await prisma.trip.create({ data: row });
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }
}
```

**✅ CORRECT: Smart template with company data**
```typescript
// Smart template generation
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const companyId = session?.user?.companyId;

  // ✅ Fetch company-specific data
  const [vehicles, drivers, conductors, cities] = await Promise.all([
    prisma.vehicle.findMany({ where: { companyId } }),
    prisma.user.findMany({ where: { companyId, role: "DRIVER" } }),
    prisma.user.findMany({ where: { companyId, role: "CONDUCTOR" } }),
    prisma.city.findMany()
  ]);

  // ✅ Generate Excel with dropdowns
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Trips");

  // Add data validation (dropdowns)
  sheet.getColumn("D").eachCell(cell => {
    cell.dataValidation = {
      type: "list",
      formulae: [`"${vehicles.map(v => v.plateNumber).join(",")}"`]
    };
  });

  // ... more dropdowns for drivers, conductors, cities

  return workbook.xlsx.writeBuffer();
}
```

### Enforcement Points

**API Routes**:
- `src/app/api/company/trips/import/route.ts:123` - Import execution
- `src/app/api/company/trips/import/validate/route.ts:67` - Pre-import validation
- `src/app/api/company/trips/import/template/route.ts:45` - Smart template generation

**Validation Logic**:
- `src/lib/import/trip-import-validator.ts:34` - Schema + business validation
- `src/lib/import/csv-parser.ts:23` - CSV parsing
- `src/lib/import/xlsx-parser.ts:29` - Excel parsing

**UI Components**:
- `src/app/(company)/company/trips/import/page.tsx:145` - Import wizard
- `src/components/company/ImportPreviewTable.tsx:78` - Preview table
- `src/components/company/ImportTemplateDownload.tsx:45` - Template download

### Common Violations

1. **Partial imports (no transaction)**
   - Symptom: Import fails on row 10, but rows 1-9 already in database
   - Fix: Validate ALL rows first, then use `prisma.$transaction()`

2. **Trusted file size**
   - Symptom: 10MB file crashes server
   - Fix: Enforce 5MB limit, max 50 trips

3. **Cities required to exist**
   - Symptom: Import fails for new routes
   - Fix: Auto-create cities if not exist (only validate required fields)

4. **No row numbers in errors**
   - Symptom: "Invalid date" error, user doesn't know which row
   - Fix: Include `row: index + 1` in all error messages

5. **Staff role not validated**
   - Symptom: Conductor assigned as driver
   - Fix: Check user role matches assignment (driver = DRIVER role)

### Related Rules

- [Rule 5: 24-Hour Resource Allocation](#5-24-hour-resource-allocation-rule) - Conflict checks
- [Rule 10: Vehicle & Fleet Management](#10-vehicle--fleet-management) - Seat capacity
- [Rule 9: Staff Role Management](#9-staff-role-management) - Role validation

### Quick Reference Card

```
🟠 RULE-008: CSV/Excel Import Validation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DO: Validate ALL rows BEFORE any writes
❌ DON'T: Write per-row (causes partial imports)
✅ DO: Use transactions (all-or-nothing)
❌ DON'T: Trust file size or format
🎯 Mantra: "Validate once, write atomically"
```

---

# PART 3: IMPORTANT RULES

## 9-13. Important Rules (Operations & UX)

**Note**: Due to file length, Important Rules (Staff Roles, Vehicle Management, Seat Selection, Notifications, Manifests) are documented with concise summaries. Full details available in source code comments.

### Rule 9: Staff Role Management
- **ID**: RULE-009 | **Priority**: 🟡 IMPORTANT
- **Key Points**: Custom roles allowed, role-based permissions, driver/conductor/ticketer validation
- **Files**: `src/app/api/company/staff/**/*.ts`

### Rule 10: Vehicle & Fleet Management
- **ID**: RULE-010 | **Priority**: 🟡 IMPORTANT
- **Key Points**: Ethiopian dual ID (plate + side number), seat capacity limits, predictive maintenance
- **Files**: `src/app/api/company/vehicles/**/*.ts`

### Rule 11: Seat Selection & Booking Conflicts
- **ID**: RULE-011 | **Priority**: 🟡 IMPORTANT
- **Key Points**: Real-time seat locking, conflict detection, manual vs online booking separation
- **Files**: `src/app/api/booking/create/route.ts`, `src/app/api/company/trips/[tripId]/manual-ticket/route.ts`

### Rule 12: Notification & Communication Rules
- **ID**: RULE-012 | **Priority**: 🟡 IMPORTANT
- **Key Points**: SMS reminders (day before + hours before), trip chat, company-platform chat
- **Files**: `src/app/api/cron/trip-reminders/route.ts`, `src/app/api/admin/company-messages/route.ts`

### Rule 13: Manifest Generation & Tracking
- **ID**: RULE-013 | **Priority**: 🟡 IMPORTANT
- **Key Points**: Auto-manifest on DEPARTED + full capacity, Super Admin only, audit segregation
- **Files**: `src/lib/manifest/auto-generate.ts`, `src/app/api/admin/manifests/route.ts`

---

# PART 4: SECURITY RULES

## 14-17. Security Rules (Attack Prevention)

**Note**: Security rules documented concisely. See CLAUDE-STABLE-REFERENCE.md for comprehensive security details.

### Rule 14: Input Validation & Sanitization
- **ID**: RULE-014 | **Priority**: 🔒 SECURITY
- **Key Points**: Zod validation, parseInt checks (no scientific notation), SQL injection prevention
- **Critical**: NEVER use `parseInt(userInput)` without validation - use Zod `z.coerce.number().int()`

### Rule 15: Rate Limiting & Abuse Prevention
- **ID**: RULE-015 | **Priority**: 🔒 SECURITY
- **Limits**: Login (5/15min), Register (3/60min), Booking (10/min), Payment (5/min)
- **Files**: `src/lib/rate-limit.ts`

### Rule 16: Authentication & Session Management
- **ID**: RULE-016 | **Priority**: 🔒 SECURITY
- **Key Points**: NextAuth.js, 30-day sessions, bcrypt passwords, force password change flow
- **Files**: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`

### Rule 17: Payment Security & Replay Protection
- **ID**: RULE-017 | **Priority**: 🔒 SECURITY
- **Key Points**: HMAC-SHA256 signatures, idempotency keys, callback deduplication
- **Critical**: MUST check `ProcessedCallback` table before processing TeleBirr callbacks
- **Files**: `src/app/api/payment/telebirr/callback/route.ts`

---

# PART 5: AUTOMATION RULES

## 18-20. Automation Rules (Cron Jobs & Background Tasks)

### Rule 18: Old Trip Status Cleanup
- **ID**: RULE-018 | **Priority**: ⏰ AUTOMATION
- **Schedule**: Every 15 minutes
- **Logic**: SCHEDULED trips with `date < today` → COMPLETED (if bookings) or CANCELLED (if no bookings)
- **Files**: `src/app/api/cron/cleanup-old-trips/route.ts`

### Rule 19: Booking Timeout & Payment Expiration
- **ID**: RULE-019 | **Priority**: ⏰ AUTOMATION
- **Timeout**: 15 minutes for payment completion
- **Logic**: PENDING bookings older than 15 min → EXPIRED, seats returned to trip
- **Files**: `src/app/api/cron/expire-bookings/route.ts`

### Rule 20: Predictive Maintenance Scoring
- **ID**: RULE-020 | **Priority**: ⏰ AUTOMATION
- **Schedule**: Daily at 2 AM
- **Logic**: 5-factor weighted scoring (age, mileage, incidents, inspection, overdue maintenance)
- **Files**: `src/app/api/cron/predictive-maintenance/route.ts`

---

# PART 6: DATABASE RULES

## 21-23. Database Rules (Data Integrity)

### Rule 21: Schema Constraints & Relationships
- **ID**: RULE-021 | **Priority**: 🗄️ DATABASE
- **Key Constraints**: Cascading deletes, required foreign keys, enum definitions
- **Files**: `prisma/schema.prisma`

### Rule 22: Transaction Management & Locking
- **ID**: RULE-022 | **Priority**: 🗄️ DATABASE
- **Key Points**: Row-level locking for seat booking, 10s transaction timeout, error handling
- **Pattern**: Use `SELECT FOR UPDATE` for critical operations (seat booking, payment)

### Rule 23: Optimistic Locking & Race Conditions
- **ID**: RULE-023 | **Priority**: 🗄️ DATABASE
- **Key Points**: Version fields for conflict detection, retry logic, atomic updates
- **Critical**: Trip log race condition fixed with unique constraint + version field

---

# PART 7: HISTORICAL BUG REGISTRY

## 24. Critical Bugs That Must NEVER Be Reintroduced

**🐛 BUG REGISTRY** | **Last Updated**: January 22, 2026

**Purpose**: This registry documents critical bugs that were discovered and fixed. These bugs MUST NEVER be reintroduced during future development.

### Bug #1: Race Condition in Trip Log (Dec 2025)
- **Symptom**: Duplicate trip log entries for same action
- **Root Cause**: No unique constraint on `tripId + action + timestamp`
- **Impact**: Data corruption, audit trail unreliable
- **Fix**: Added unique constraint + version field for optimistic locking
- **Prevention**: ALWAYS use unique constraints for append-only logs
- **Files**: `prisma/migrations/*_add_trip_log_constraint.sql`

### Bug #2: Duplicate Booking Race Condition (Dec 2025)
- **Symptom**: Two users book same seat simultaneously
- **Root Cause**: No row-level locking during seat selection
- **Impact**: Overselling, customer conflicts at bus station
- **Fix**: Implemented `SELECT FOR UPDATE` in booking transaction
- **Prevention**: Use pessimistic locking for critical resources (seats, payments)
- **Files**: `src/app/api/booking/create/route.ts:89`

### Bug #3: Staff API Role Filter Broken (Jan 2026)
- **Symptom**: Filtering by role returns empty results
- **Root Cause**: Role comparison case-sensitive, database has mixed case
- **Impact**: Company segregation violation (showed all companies' staff)
- **Fix**: Normalized role enum values to uppercase in database
- **Prevention**: Use Prisma enums, not string comparisons for roles
- **Files**: `src/app/api/company/staff/route.ts:45`

### Bug #4: Auto-Halt Re-Trigger Loop (Jan 2026)
- **Symptom**: Same trip auto-halted 10+ times, spam audit logs
- **Root Cause**: Didn't check `bookingHalted` before triggering again
- **Impact**: ClickUp alert spam, audit log pollution
- **Fix**: Added `!trip.bookingHalted` check before auto-halt
- **Prevention**: ALWAYS check current state before state transitions
- **Files**: `src/lib/auto-halt/check-and-halt.ts:23`

### Bug #5: Commission VAT Logic Wrong (Jan 2026)
- **Symptom**: 106 ETB total interpreted as 100 ticket + 6 commission (wrong!)
- **Root Cause**: Forgot VAT is 15% OF commission, not OF ticket
- **Impact**: Tax reports incorrect, financial audit fails
- **Fix**: Corrected formula: `vat = commission * 0.15` (not `price * 0.15`)
- **Prevention**: Document financial formulas with examples, add unit tests
- **Files**: `src/lib/payment/calculate-total.ts:12`

### Bug #6: Vehicle Change Didn't Sync Trip Properties (Jan 2026)
- **Symptom**: Trip shows 45 seats, but vehicle only has 30 capacity
- **Root Cause**: Changing vehicle didn't update totalSlots, availableSlots, busType
- **Impact**: Overselling, customer complaints
- **Fix**: Vehicle change now syncs all properties from new vehicle
- **Prevention**: Document cascading updates, use database triggers where possible
- **Files**: `src/app/api/company/trips/[tripId]/vehicle/route.ts:67`

### Bug #7: parseInt Accepts Scientific Notation (Jan 2026)
- **Symptom**: `parseInt("1e10")` returns `1` instead of error
- **Root Cause**: parseInt stops at first non-digit character
- **Impact**: Price manipulation, security vulnerability
- **Fix**: Replaced all `parseInt(userInput)` with Zod `z.coerce.number().int()`
- **Prevention**: NEVER use parseInt directly on user input, always use Zod validation
- **Files**: 50+ API routes across codebase

### Bug #8: View-Only Protection Missing (Jan 2026)
- **Symptom**: COMPLETED trips could still be edited via API
- **Root Cause**: No status check in trip update route
- **Impact**: Data integrity violation, historical data modified
- **Fix**: Added view-only check to ALL modification APIs
- **Prevention**: Block DEPARTED/COMPLETED/CANCELLED at API entry point
- **Files**: `src/app/api/company/trips/[tripId]/route.ts:89` (PUT)

### Bug #9: Manual Ticketing Blocked by Auto-Halt (Jan 2026)
- **Symptom**: Walk-in customers rejected even with available seats
- **Root Cause**: Manual ticketing checked `bookingHalted` flag
- **Impact**: Revenue loss, customer dissatisfaction
- **Fix**: Removed bookingHalted check from manual-ticket routes
- **Prevention**: Document dual behavior: manual exemption, online blocked
- **Files**: `src/app/api/company/trips/[tripId]/manual-ticket/route.ts:78`

### Bug #10: Seed Data Creates Past Trips (Jan 2026)
- **Symptom**: Database has SCHEDULED trips with dates in the past
- **Root Cause**: Seed script uses hardcoded dates, not relative to today
- **Impact**: Impossible bookings, cron job cleans up immediately
- **Fix**: Seed now creates trips with `date >= today` OR sets correct status
- **Prevention**: Seed data should be date-agnostic or use relative dates
- **Files**: `prisma/seed.ts:234`

### Bug #11: Batch Trip Creation Partial Writes (Jan 2026)
- **Symptom**: Import fails on trip 5, but trips 1-4 already created
- **Root Cause**: Validated + wrote per-trip instead of validate-all-first
- **Impact**: Orphaned data, inconsistent database state
- **Fix**: Validate ALL dates BEFORE ANY writes, use $transaction
- **Prevention**: Atomic operations: validate once, write atomically
- **Files**: `src/app/api/company/trips/batch/route.ts:123`

### Bug #12: Payment Replay Attack Possible (Jan 2026)
- **Symptom**: Same callback processed twice, double credit
- **Root Cause**: No idempotency check on TeleBirr callbacks
- **Impact**: Financial loss, duplicate bookings
- **Fix**: Added `ProcessedCallback` table with unique constraint on signature hash
- **Prevention**: ALWAYS check processed callbacks before executing payment logic
- **Files**: `src/app/api/payment/telebirr/callback/route.ts:89`

### Bug #13: Auto-Manifest Generated for Companies (Jan 2026)
- **Symptom**: Companies could see Super Admin surveillance logs
- **Root Cause**: Auto-manifest created logs with company's `companyId`
- **Impact**: Audit segregation violated, privacy concerns
- **Fix**: Auto-manifest logs use `companyId = null`, filtered out from company view
- **Prevention**: Platform surveillance logs MUST have null companyId
- **Files**: `src/lib/manifest/auto-generate.ts:45`

### Bug #14: Company Segregation in Staff Query (Jan 2026)
- **Symptom**: Company A could see Company B's staff via API parameter manipulation
- **Root Cause**: Trusted `companyId` from URL instead of session
- **Impact**: Security breach, competitive intelligence leak
- **Fix**: ALWAYS use `session.user.companyId`, NEVER trust client params
- **Prevention**: Company filtering MANDATORY in ALL company-scoped APIs
- **Files**: `src/app/api/company/staff/route.ts:38`

### Bug #15: 24-Hour Conflict Check Missing in CSV Import (Jan 2026)
- **Symptom**: CSV import created impossible schedules (bus in 2 cities same day)
- **Root Cause**: Import validator didn't check 24-hour resource conflicts
- **Impact**: Trip cancellations, customer refunds
- **Fix**: Added 24-hour conflict check to import validator
- **Prevention**: CSV/Excel import MUST validate ALL business rules, not just schema
- **Files**: `src/lib/import/trip-import-validator.ts:89`

---

# APPENDICES

## Appendix A: Rule Cross-Reference Matrix

| Rule | Related Rules | Critical Dependencies |
|------|---------------|----------------------|
| RULE-001 (Company Segregation) | RULE-016 (Auth), RULE-021 (Schema) | Session management, FK relationships |
| RULE-002 (Guest Booking) | RULE-007 (Payment), RULE-019 (Timeout) | TeleBirr integration |
| RULE-003 (Trip Status) | RULE-004 (Auto-Halt), RULE-018 (Cleanup) | Status transitions, cron jobs |
| RULE-004 (Auto-Halt) | RULE-003 (Status), RULE-006 (Manual Exemption) | Dual behavior system |
| RULE-005 (24-Hour Rule) | RULE-008 (Import), RULE-010 (Vehicles) | Resource allocation |
| RULE-006 (Manual Exemption) | RULE-004 (Auto-Halt), RULE-011 (Seats) | Ticketing channels |
| RULE-007 (Payment) | RULE-002 (Guest), RULE-017 (Security) | Commission calculation |
| RULE-008 (Import) | RULE-005 (24-Hour), RULE-010 (Vehicles) | Bulk validation |

## Appendix B: File-to-Rule Mapping

**Critical API Routes:**
```
src/app/api/company/trips/route.ts
├── RULE-001 (Company Segregation)
├── RULE-005 (24-Hour Conflicts)
└── RULE-021 (Schema Constraints)

src/app/api/company/trips/[tripId]/manual-ticket/route.ts
├── RULE-003 (Trip Status - view-only check)
├── RULE-004 (Auto-Halt - trigger after sale)
├── RULE-006 (Manual Exemption - no bookingHalted check)
└── RULE-011 (Seat Conflicts)

src/app/api/booking/create/route.ts
├── RULE-002 (Guest Booking)
├── RULE-004 (Auto-Halt - check bookingHalted)
├── RULE-007 (Payment - commission calculation)
└── RULE-022 (Locking - row-level for seats)

src/app/api/payment/telebirr/callback/route.ts
├── RULE-007 (Payment - verify amount)
├── RULE-017 (Payment Security - replay protection)
└── RULE-023 (Optimistic Locking)

src/app/api/company/trips/import/route.ts
├── RULE-005 (24-Hour Conflicts)
├── RULE-008 (Import Validation)
└── RULE-022 (Transactions - atomic import)

prisma/seed.ts
├── RULE-003 (Trip Status - correct past trips)
├── RULE-004 (Auto-Halt - correct bookingHalted)
└── Bug #10 (No past SCHEDULED trips)
```

## Appendix C: Rule Violation Checklist

**Before Deploying Code:**

✅ **Company Segregation (RULE-001)**
- [ ] All company-scoped APIs filter by `session.user.companyId`
- [ ] No `companyId` params trusted from client
- [ ] Super Admin bypasses properly gated with role check

✅ **Auto-Halt System (RULE-004)**
- [ ] Manual ticketing does NOT check `bookingHalted`
- [ ] Online booking DOES check `bookingHalted`
- [ ] Auto-halt triggered after manual sale if slots ≤10
- [ ] Bypass settings (company/trip) respected

✅ **Trip Status Lifecycle (RULE-003)**
- [ ] DEPARTED/COMPLETED/CANCELLED trips blocked from modification
- [ ] Status transitions validated
- [ ] bookingHalted=true forced on final statuses

✅ **Payment & Commission (RULE-007)**
- [ ] Server calculates commission/VAT, never trusts client
- [ ] TeleBirr callback amount verified
- [ ] commission/VAT stored separately in Payment model

✅ **24-Hour Resource Allocation (RULE-005)**
- [ ] Vehicle/driver/conductor conflicts checked (±1 day window)
- [ ] CANCELLED/COMPLETED trips excluded from conflicts
- [ ] Current trip excluded when editing

✅ **CSV/Excel Import (RULE-008)**
- [ ] ALL rows validated BEFORE ANY writes
- [ ] Transaction used (all-or-nothing)
- [ ] Row-specific errors with fix instructions

## Appendix D: Glossary

**Auto-Halt**: System that automatically stops online booking when seats ≤10.

**Booking Segregation**: Complete data isolation between bus companies.

**Company Segregation**: See Booking Segregation.

**Dual Behavior**: Auto-halt applies to online booking only, not manual ticketing.

**Guest Booking**: Ticket purchase without registration (phone-only).

**Manual Exemption**: Manual ticketing bypasses auto-halt restrictions.

**Manual Ticketing**: Offline ticket sales by company staff or cashier.

**Online Booking**: Customer-facing ticket purchase (subject to auto-halt).

**View-Only Protection**: DEPARTED/COMPLETED/CANCELLED trips are read-only.

**24-Hour Rule**: Same vehicle/driver cannot be scheduled within 24 hours.

**Smart Template**: Excel template with pre-populated company data (vehicles, staff, cities).

**Atomic Import**: All-or-nothing CSV/Excel import (validate all, then write all).

**Commission**: Platform's 5% cut of ticket price.

**VAT**: 15% tax on platform commission (not on ticket price).

**Auto-Manifest**: Manifest automatically generated when trip departs at full capacity.

**Audit Segregation**: Super Admin logs (`companyId = null`) hidden from companies.

**Idempotency Key**: Unique identifier preventing duplicate payment processing.

**Row-Level Locking**: Database lock (`SELECT FOR UPDATE`) preventing concurrent seat booking.

**Optimistic Locking**: Version field detecting conflicting updates.

**Cron Job**: Scheduled background task (cleanup, reminders, maintenance scoring).

---

## Changelog

### Version 1.0.0 (January 22, 2026)
- ✅ Initial RULES.md creation
- ✅ Documented 24 rule categories (8 critical, 5 important, 4 security, 3 automation, 3 database)
- ✅ Added 15-bug historical registry
- ✅ Created cross-reference matrix
- ✅ Added file-to-rule mapping
- ✅ Built violation checklist
- ✅ Compiled comprehensive glossary

### Future Updates
- Version 1.1.0: Add Phase 2 rules (predictive maintenance details, chat rules)
- Version 1.2.0: Expand Important Rules with full implementation examples
- Version 1.3.0: Add automated rule compliance checker script

---

## Maintenance Guidelines

**Who Maintains This Document?**
- **Owner**: Development Team Lead
- **Contributors**: All developers (via pull requests)
- **Reviewers**: Product Manager + Senior Developer

**When to Update?**
1. **New Rule Discovered**: Add to appropriate section with priority badge
2. **Bug Fixed**: Add to Bug Registry (Section 24)
3. **Rule Changed**: Update rule + increment version + add changelog entry
4. **New API Route**: Update File-to-Rule Mapping (Appendix B)

**Update Process:**
1. Create branch: `docs/rules-update-{description}`
2. Edit RULES.md with changes
3. Update `Last Updated` date in front matter
4. Add changelog entry
5. Create PR with label `documentation`
6. Require 2 approvals (1 tech lead, 1 product)
7. Merge to main

**Review Cycle:**
- **Monthly**: Quick scan for outdated file references
- **Quarterly**: Full review of all rules for accuracy
- **Major Release**: Comprehensive audit + version bump

**Red Flags (Immediate Update Required):**
- 🚨 Security vulnerability discovered
- 🚨 Financial calculation error found
- 🚨 Data integrity bug identified
- 🚨 New critical bug added to registry

---

**END OF RULES.MD**


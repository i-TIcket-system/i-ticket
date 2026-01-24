# Bug Registry

> **Purpose**: Critical bugs that MUST NEVER be reintroduced
> **Last Updated**: January 24, 2026
> **Back to**: [RULES.md](../RULES.md)

---

## Bug #1: Race Condition in Trip Log

**Date**: December 2025

| Field | Value |
|-------|-------|
| Symptom | Duplicate trip log entries for same action |
| Root Cause | No unique constraint on `tripId + action + timestamp` |
| Impact | Data corruption, unreliable audit trail |
| Fix | Added unique constraint + version field |
| Prevention | ALWAYS use unique constraints for append-only logs |
| Files | `prisma/migrations/*_add_trip_log_constraint.sql` |

---

## Bug #2: Duplicate Booking Race Condition

**Date**: December 2025

| Field | Value |
|-------|-------|
| Symptom | Two users book same seat simultaneously |
| Root Cause | No row-level locking during seat selection |
| Impact | Overselling, customer conflicts |
| Fix | Implemented `SELECT FOR UPDATE` in booking transaction |
| Prevention | Use pessimistic locking for critical resources |
| Files | `src/app/api/booking/create/route.ts:89` |

---

## Bug #3: Staff API Role Filter Broken

**Date**: January 2026

| Field | Value |
|-------|-------|
| Symptom | Filtering by role returns empty results |
| Root Cause | Role comparison case-sensitive, database mixed case |
| Impact | Company segregation violation |
| Fix | Normalized role enum values to uppercase |
| Prevention | Use Prisma enums, not string comparisons |
| Files | `src/app/api/company/staff/route.ts:45` |

---

## Bug #4: Auto-Halt Re-Trigger Loop

**Date**: January 2026

| Field | Value |
|-------|-------|
| Symptom | Same trip auto-halted 10+ times, spam logs |
| Root Cause | Didn't check `bookingHalted` before triggering |
| Impact | ClickUp alert spam, audit log pollution |
| Fix | Added `!trip.bookingHalted` check |
| Prevention | ALWAYS check current state before transitions |
| Files | `src/lib/auto-halt/check-and-halt.ts:23` |

---

## Bug #5: Commission VAT Logic Wrong

**Date**: January 2026

| Field | Value |
|-------|-------|
| Symptom | 106 ETB = 100 ticket + 6 commission (wrong!) |
| Root Cause | VAT calculated as 15% of ticket, not commission |
| Impact | Tax reports incorrect, audit fails |
| Fix | `vat = commission * 0.15` (not `price * 0.15`) |
| Prevention | Document formulas with examples, add unit tests |
| Files | `src/lib/payment/calculate-total.ts:12` |

**Correct Formula**:
```
Ticket: 100 ETB
Commission: 100 × 5% = 5 ETB
VAT: 5 × 15% = 0.75 ETB
Total: 105.75 ETB
```

---

## Bug #6: Vehicle Change Didn't Sync Properties

**Date**: January 2026

| Field | Value |
|-------|-------|
| Symptom | Trip shows 45 seats, vehicle only has 30 |
| Root Cause | Changing vehicle didn't sync totalSlots |
| Impact | Overselling |
| Fix | Vehicle change syncs all properties |
| Prevention | Document cascading updates |
| Files | `src/app/api/company/trips/[tripId]/vehicle/route.ts:67` |

---

## Bug #7: parseInt Accepts Scientific Notation

**Date**: January 2026

| Field | Value |
|-------|-------|
| Symptom | `parseInt("1e10")` returns 1 |
| Root Cause | parseInt stops at first non-digit |
| Impact | Price manipulation, security vulnerability |
| Fix | Replace with Zod `z.coerce.number().int()` |
| Prevention | NEVER use parseInt on user input |
| Files | 50+ API routes |

**Example**:
```typescript
// ❌ WRONG
parseInt("1e10") // Returns 1, not 10000000000!

// ✅ CORRECT
z.coerce.number().int().parse("1e10") // Throws error
```

---

## Bug #8: View-Only Protection Missing

**Date**: January 2026

| Field | Value |
|-------|-------|
| Symptom | COMPLETED trips could be edited via API |
| Root Cause | No status check in trip update route |
| Impact | Data integrity violation |
| Fix | Added view-only check to ALL modification APIs |
| Prevention | Block DEPARTED/COMPLETED/CANCELLED at entry |
| Files | `src/app/api/company/trips/[tripId]/route.ts:89` |

---

## Bug #9: Manual Ticketing Blocked by Auto-Halt

**Date**: January 2026

| Field | Value |
|-------|-------|
| Symptom | Walk-in customers rejected with available seats |
| Root Cause | Manual ticketing checked `bookingHalted` flag |
| Impact | Revenue loss |
| Fix | Removed bookingHalted check from manual-ticket |
| Prevention | Document dual behavior clearly |
| Files | `src/app/api/company/trips/[tripId]/manual-ticket/route.ts:78` |

---

## Bug #10: Seed Data Creates Past Trips

**Date**: January 2026

| Field | Value |
|-------|-------|
| Symptom | Database has SCHEDULED trips with past dates |
| Root Cause | Seed uses hardcoded dates |
| Impact | Impossible bookings |
| Fix | Seed creates trips with `date >= today` |
| Prevention | Use relative dates in seed |
| Files | `prisma/seed.ts:234` |

---

## Bug #11: Batch Trip Creation Partial Writes

**Date**: January 2026

| Field | Value |
|-------|-------|
| Symptom | Import fails on trip 5, trips 1-4 created |
| Root Cause | Validated + wrote per-trip |
| Impact | Orphaned data |
| Fix | Validate ALL then $transaction write |
| Prevention | Atomic: validate once, write atomically |
| Files | `src/app/api/company/trips/batch/route.ts:123` |

---

## Bug #12: Payment Replay Attack

**Date**: January 2026

| Field | Value |
|-------|-------|
| Symptom | Same callback processed twice, double credit |
| Root Cause | No idempotency check |
| Impact | Financial loss |
| Fix | Added `ProcessedCallback` table |
| Prevention | ALWAYS check before processing payments |
| Files | `src/app/api/payment/telebirr/callback/route.ts:89` |

---

## Bug #13: Auto-Manifest Visible to Companies

**Date**: January 2026

| Field | Value |
|-------|-------|
| Symptom | Companies see Super Admin surveillance logs |
| Root Cause | Auto-manifest used company's companyId |
| Impact | Audit segregation violated |
| Fix | Auto-manifest logs use `companyId = null` |
| Prevention | Platform logs MUST have null companyId |
| Files | `src/lib/manifest/auto-generate.ts:45` |

---

## Bug #14: Company Segregation in Staff Query

**Date**: January 2026

| Field | Value |
|-------|-------|
| Symptom | Company A sees Company B's staff |
| Root Cause | Trusted companyId from URL param |
| Impact | Security breach |
| Fix | ALWAYS use `session.user.companyId` |
| Prevention | Never trust client params for companyId |
| Files | `src/app/api/company/staff/route.ts:38` |

---

## Bug #15: 24-Hour Conflict Missing in CSV Import

**Date**: January 2026

| Field | Value |
|-------|-------|
| Symptom | CSV import created impossible schedules |
| Root Cause | Import didn't check 24-hour conflicts |
| Impact | Trip cancellations, refunds |
| Fix | Added 24-hour conflict check to validator |
| Prevention | Import validates ALL business rules |
| Files | `src/lib/import/trip-import-validator.ts:89` |

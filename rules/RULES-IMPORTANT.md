# Important Rules (RULE-009 to RULE-013)

> **Priority**: 🟡 IMPORTANT
> **Violation Impact**: Poor UX, operational inefficiency
> **Back to**: [RULES.md](../RULES.md)

---

## 9. Staff Roles

**Rule ID**: `RULE-009`

### Standard Roles

| Role | Portal | Capabilities |
|------|--------|--------------|
| ADMIN | Company | Full company management |
| SUPERVISOR | Company | Operations (no settings/audit) |
| DRIVER | Staff | View assigned trips |
| CONDUCTOR | Staff | View assigned trips, trip chat |
| MANUAL_TICKETER | Cashier | Sell tickets offline |
| MECHANIC | Mechanic | Work orders |
| FINANCE | Finance | Cost tracking |

### Custom Roles

Companies can create custom roles:
- Pattern: `^[A-Z_]+$` (uppercase + underscore)
- Length: 2-50 characters
- Examples: `QUALITY_INSPECTOR`, `DISPATCHER`

### Role Validation

```typescript
// When assigning staff to trip
if (role === "DRIVER" && assignment === "conductor") {
  return { error: "Driver cannot be assigned as conductor" };
}

// When creating staff
const roleRegex = /^[A-Z_]+$/;
if (!roleRegex.test(staffRole)) {
  return { error: "Invalid role format" };
}
```

### Files

- `src/app/api/company/staff/**/*.ts`

---

## 10. Vehicles

**Rule ID**: `RULE-010`

### Ethiopian Dual ID System

| Field | Format | Example |
|-------|--------|---------|
| Plate Number | Regional format | 3-12345 |
| Side Number | Company internal | SB-001 |

Both are required and must be unique within company.

### Seat Capacity

- Stored in `Vehicle.seatCapacity`
- Trip `totalSlots` cannot exceed vehicle capacity
- Vehicle change syncs: `totalSlots`, `availableSlots`, `busType`

### Predictive Maintenance

5-factor risk scoring (0-100):
1. Age (years)
2. Mileage (km)
3. Incident history
4. Inspection results
5. Overdue maintenance

### Files

- `src/app/api/company/vehicles/**/*.ts`
- `src/app/api/cron/predictive-maintenance/route.ts`

---

## 11. Seats

**Rule ID**: `RULE-011`

### Seat Selection Rules

1. **Real-time locking**: Use `SELECT FOR UPDATE` during booking
2. **Conflict detection**: Check seat availability before confirming
3. **Error messages**: Specify if conflict from online vs manual

### Conflict Handling

```typescript
// Check seat availability with locking
const trip = await tx.trip.findUnique({
  where: { id: tripId },
  select: { availableSlots: true, bookedSeats: true }
});

const conflictingSeats = selectedSeats.filter(
  seat => trip.bookedSeats.includes(seat)
);

if (conflictingSeats.length > 0) {
  return {
    error: `Seat ${conflictingSeats[0]} is already taken`,
    conflictingSeats
  };
}
```

### Manual vs Online Separation

- Online booking subject to auto-halt
- Manual ticketing always proceeds (if seats available)
- Error messages distinguish source of conflict

### Files

- `src/app/api/booking/create/route.ts`
- `src/app/api/company/trips/[tripId]/manual-ticket/route.ts`
- `src/components/booking/SeatMap.tsx`

---

## 12. Notifications

**Rule ID**: `RULE-012`

### Trip Reminders (Cron)

| Timing | Message |
|--------|---------|
| Day before | "Reminder: Your trip tomorrow..." |
| 3 hours before | "Your bus departs in 3 hours..." |

### Notification Types

| Type | Recipient |
|------|-----------|
| `BOOKING_CONFIRMED` | Customer |
| `TRIP_REMINDER` | Customer |
| `MANIFEST_AUTO_GENERATED` | Super Admin |
| `LOW_SEATS_WARNING` | Company Admin |

### Company Chat

- Company ↔ Platform messaging
- Rate limit: 10 messages/hour
- File attachments: images, PDFs, docs

### Trip Chat

- Staff communication during trip
- Driver, conductor, admin can participate

### Files

- `src/app/api/cron/trip-reminders/route.ts`
- `src/app/api/admin/company-messages/route.ts`
- `src/app/api/trips/[tripId]/messages/route.ts`

---

## 13. Manifests

**Rule ID**: `RULE-013`

### Auto-Manifest Generation

**Triggers** (both required):
1. Trip status → `DEPARTED`
2. Trip at full capacity (`availableSlots = 0`)

### Audit Segregation

| Log Type | `companyId` | Visible To |
|----------|-------------|------------|
| Company actions | Company ID | Company + Super Admin |
| Platform surveillance | `null` | Super Admin only |

```typescript
// Auto-manifest creates platform log (not visible to company)
await prisma.adminLog.create({
  data: {
    companyId: null, // Platform surveillance
    action: "MANIFEST_AUTO_GENERATED",
    details: `Manifest generated for trip ${tripId}`
  }
});
```

### Manifest Content

- Passenger list (name, phone, seat)
- Trip details (route, time, vehicle)
- Revenue breakdown (tickets, commission, VAT)
- Staff assignments

### Files

- `src/lib/manifest/auto-generate.ts`
- `src/app/api/admin/manifests/route.ts`
- `src/app/api/company/manifests/route.ts`

### Related Bugs

- Bug #13: Auto-Manifest Generated for Companies

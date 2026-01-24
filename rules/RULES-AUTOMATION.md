# Automation Rules (RULE-018 to RULE-020)

> **Priority**: ⏰ AUTOMATION
> **Violation Impact**: Cron job failure, stale data
> **Back to**: [RULES.md](../RULES.md)

---

## 18. Old Trip Cleanup

**Rule ID**: `RULE-018`

### Schedule

Every 15 minutes via cron job.

### Logic

```
IF trip.status = "SCHEDULED" AND trip.departureDate < today:
  IF trip has confirmed bookings:
    → Set status = "COMPLETED"
  ELSE:
    → Set status = "CANCELLED"

  → Set bookingHalted = true
  → Create TRIP_STATUS_AUTO_UPDATE audit log
```

### Implementation

```typescript
// Cron job: /api/cron/cleanup-old-trips
const oldTrips = await prisma.trip.findMany({
  where: {
    status: "SCHEDULED",
    departureDate: { lt: startOfToday() }
  }
});

for (const trip of oldTrips) {
  const hasBookings = await prisma.booking.count({
    where: { tripId: trip.id, status: "CONFIRMED" }
  }) > 0;

  await prisma.trip.update({
    where: { id: trip.id },
    data: {
      status: hasBookings ? "COMPLETED" : "CANCELLED",
      bookingHalted: true
    }
  });

  await prisma.adminLog.create({
    data: {
      companyId: trip.companyId,
      action: "TRIP_STATUS_AUTO_UPDATE",
      details: `Trip auto-updated to ${hasBookings ? "COMPLETED" : "CANCELLED"}`
    }
  });
}
```

### Files

- `src/app/api/cron/cleanup-old-trips/route.ts`

### Related Bugs

- Bug #10: Seed Data Creates Past Trips

---

## 19. Booking Timeout

**Rule ID**: `RULE-019`

### Timeout

**15 minutes** from booking creation to payment completion.

### Logic

```
IF booking.status = "PENDING" AND booking.createdAt < (now - 15 minutes):
  → Set status = "EXPIRED"
  → Return seats to trip (availableSlots += booking.seatCount)
  → Create BOOKING_EXPIRED audit log
```

### Implementation

```typescript
// Cron job: /api/cron/expire-bookings
const expiredBookings = await prisma.booking.findMany({
  where: {
    status: "PENDING",
    createdAt: { lt: subMinutes(new Date(), 15) }
  }
});

for (const booking of expiredBookings) {
  await prisma.$transaction([
    prisma.booking.update({
      where: { id: booking.id },
      data: { status: "EXPIRED" }
    }),
    prisma.trip.update({
      where: { id: booking.tripId },
      data: { availableSlots: { increment: booking.seatCount } }
    })
  ]);
}
```

### Guest vs Registered

- Both guest and registered bookings expire after 15 minutes
- No email/SMS sent for expired bookings (they never paid)

### Files

- `src/app/api/cron/expire-bookings/route.ts`

---

## 20. Predictive Maintenance

**Rule ID**: `RULE-020`

### Schedule

Daily at 2 AM UTC.

### Risk Score Calculation (0-100)

| Factor | Weight | Calculation |
|--------|--------|-------------|
| Age | 20% | Years since manufacture |
| Mileage | 25% | Total km driven |
| Incidents | 20% | Accident/breakdown count |
| Inspection | 15% | Last inspection result |
| Overdue | 20% | Days past maintenance due |

### Implementation

```typescript
function calculateRiskScore(vehicle: Vehicle): number {
  const ageScore = Math.min(vehicle.ageYears * 5, 100) * 0.20;
  const mileageScore = Math.min(vehicle.mileage / 5000, 100) * 0.25;
  const incidentScore = Math.min(vehicle.incidents * 20, 100) * 0.20;
  const inspectionScore = (100 - vehicle.lastInspectionScore) * 0.15;
  const overdueScore = Math.min(vehicle.daysOverdue * 5, 100) * 0.20;

  return ageScore + mileageScore + incidentScore + inspectionScore + overdueScore;
}
```

### Risk Levels

| Score | Level | Action |
|-------|-------|--------|
| 0-30 | Low | Normal operation |
| 31-60 | Medium | Schedule maintenance |
| 61-80 | High | Urgent maintenance |
| 81-100 | Critical | Remove from service |

### Work Order Generation

When risk score > 60:
1. Auto-create work order
2. Notify mechanic
3. Alert company admin

### Files

- `src/app/api/cron/predictive-maintenance/route.ts`
- `src/lib/maintenance/risk-calculator.ts`

# Database Rules (RULE-021 to RULE-023)

> **Priority**: 🗄️ DATABASE
> **Violation Impact**: Data inconsistency, corruption
> **Back to**: [RULES.md](../RULES.md)

---

## 21. Schema

**Rule ID**: `RULE-021`

### Critical Constraints

| Table | Constraint | Purpose |
|-------|------------|---------|
| User | Unique phone | One account per phone |
| Company | Unique name | No duplicate companies |
| Vehicle | Unique (companyId, plateNumber) | Unique within company |
| Vehicle | Unique (companyId, sideNumber) | Unique within company |
| Trip | FK to Company | Company segregation |
| Booking | FK to Trip | Referential integrity |

### Cascading Deletes

```prisma
model Company {
  trips    Trip[]    @relation(onDelete: Cascade)
  staff    User[]    @relation(onDelete: Cascade)
  vehicles Vehicle[] @relation(onDelete: Cascade)
}

model Trip {
  bookings Booking[] @relation(onDelete: Cascade)
  messages TripMessage[] @relation(onDelete: Cascade)
}
```

### Required Foreign Keys

Every company-scoped entity MUST have `companyId`:
- Trip, Booking, Vehicle, Staff assignment
- Work orders, Maintenance schedules
- Audit logs (except platform logs which are null)

### Files

- `prisma/schema.prisma`

---

## 22. Transactions

**Rule ID**: `RULE-022`

### When to Use Transactions

| Operation | Transaction Required |
|-----------|---------------------|
| Seat booking | ✅ Yes (row-level lock) |
| Payment processing | ✅ Yes (idempotency) |
| Bulk trip import | ✅ Yes (atomic) |
| Status change + halt | ✅ Yes (consistency) |
| Simple read | ❌ No |
| Single create | ❌ Usually no |

### Row-Level Locking

```typescript
// Use SELECT FOR UPDATE for critical resources
await prisma.$transaction(async (tx) => {
  // Lock the trip row
  const trip = await tx.$queryRaw`
    SELECT * FROM "Trip" WHERE id = ${tripId} FOR UPDATE
  `;

  // Now safe to check and update
  if (trip.availableSlots < seatCount) {
    throw new Error("Not enough seats");
  }

  await tx.trip.update({
    where: { id: tripId },
    data: { availableSlots: { decrement: seatCount } }
  });
});
```

### Transaction Timeout

```typescript
await prisma.$transaction(
  async (tx) => {
    // ... operations
  },
  {
    maxWait: 5000, // Wait max 5s for lock
    timeout: 10000, // Transaction timeout 10s
  }
);
```

### Related Bugs

- Bug #2: Duplicate Booking Race Condition

---

## 23. Locking

**Rule ID**: `RULE-023`

### Optimistic Locking

Use version fields for conflict detection:

```typescript
// Add version to model
model Trip {
  id      String @id
  version Int    @default(0)
  // ...
}

// Update with version check
const updated = await prisma.trip.updateMany({
  where: {
    id: tripId,
    version: currentVersion // Must match
  },
  data: {
    price: newPrice,
    version: { increment: 1 }
  }
});

if (updated.count === 0) {
  throw new Error("Conflict: Trip was modified by another user");
}
```

### Pessimistic Locking

Use `FOR UPDATE` for critical sections:

```typescript
// Lock row during read
await tx.$queryRaw`
  SELECT * FROM "Trip" WHERE id = ${tripId} FOR UPDATE
`;

// Other transactions wait until this one completes
```

### When to Use Each

| Scenario | Locking Type |
|----------|-------------|
| Seat booking (high contention) | Pessimistic |
| Trip editing (low contention) | Optimistic |
| Payment callback | Pessimistic |
| Admin updates | Optimistic |

### Unique Constraints for Logs

```prisma
model TripLog {
  tripId    String
  action    String
  timestamp DateTime
  @@unique([tripId, action, timestamp])
}
```

### Related Bugs

- Bug #1: Race Condition in Trip Log
- Bug #2: Duplicate Booking Race Condition

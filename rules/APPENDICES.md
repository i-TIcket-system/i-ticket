# Appendices

> **Back to**: [RULES.md](../RULES.md)

---

## Appendix A: Rule Cross-Reference Matrix

| Rule | Related Rules | Key Dependencies |
|------|---------------|------------------|
| RULE-001 (Company Segregation) | RULE-016, RULE-021 | Session, FK relationships |
| RULE-002 (Guest Booking) | RULE-007, RULE-019 | TeleBirr integration |
| RULE-003 (Trip Status) | RULE-004, RULE-018 | Status transitions, cron |
| RULE-004 (Auto-Halt) | RULE-003, RULE-006 | Dual behavior |
| RULE-005 (24-Hour) | RULE-008, RULE-010 | Resource allocation |
| RULE-006 (Manual Exemption) | RULE-004, RULE-011 | Ticketing channels |
| RULE-007 (Payment) | RULE-002, RULE-017 | Commission calculation |
| RULE-008 (Import) | RULE-005, RULE-010 | Bulk validation |

---

## Appendix B: File-to-Rule Mapping

### Company Trip Routes

```
src/app/api/company/trips/route.ts
├── RULE-001 (Company Segregation)
├── RULE-005 (24-Hour Conflicts)
└── RULE-021 (Schema Constraints)

src/app/api/company/trips/[tripId]/route.ts
├── RULE-001 (Company Segregation)
├── RULE-003 (View-Only Protection)
└── RULE-021 (Schema Constraints)

src/app/api/company/trips/[tripId]/manual-ticket/route.ts
├── RULE-003 (Trip Status - view-only check)
├── RULE-004 (Auto-Halt - trigger after sale)
├── RULE-006 (Manual Exemption - no halt check)
└── RULE-011 (Seat Conflicts)
```

### Booking Routes

```
src/app/api/booking/create/route.ts
├── RULE-002 (Guest Booking)
├── RULE-004 (Auto-Halt - check bookingHalted)
├── RULE-007 (Payment - commission)
└── RULE-022 (Locking - row-level)
```

### Payment Routes

```
src/app/api/payment/telebirr/callback/route.ts
├── RULE-007 (Payment - verify amount)
├── RULE-017 (Payment Security - replay)
└── RULE-023 (Optimistic Locking)
```

### Import Routes

```
src/app/api/company/trips/import/route.ts
├── RULE-005 (24-Hour Conflicts)
├── RULE-008 (Import Validation)
└── RULE-022 (Transactions)
```

### Seed File

```
prisma/seed.ts
├── RULE-003 (Trip Status - correct past trips)
├── RULE-004 (Auto-Halt - bookingHalted)
└── Bug #10 (No past SCHEDULED trips)
```

---

## Appendix C: Rule Violation Checklist

### Before Deploying Code

**Company Segregation (RULE-001)**
- [ ] All company APIs filter by `session.user.companyId`
- [ ] No `companyId` params trusted from client
- [ ] Super Admin bypasses gated with role check

**Auto-Halt System (RULE-004)**
- [ ] Manual ticketing does NOT check `bookingHalted`
- [ ] Online booking DOES check `bookingHalted`
- [ ] Auto-halt triggered after manual sale if slots ≤10
- [ ] Bypass settings respected

**Trip Status (RULE-003)**
- [ ] DEPARTED/COMPLETED/CANCELLED blocked from modification
- [ ] Status transitions validated
- [ ] bookingHalted=true forced on final statuses

**Payment (RULE-007)**
- [ ] Server calculates commission/VAT
- [ ] TeleBirr callback amount verified
- [ ] Commission/VAT stored separately

**24-Hour Allocation (RULE-005)**
- [ ] Vehicle/driver/conductor conflicts checked
- [ ] CANCELLED/COMPLETED trips excluded
- [ ] Current trip excluded when editing

**CSV Import (RULE-008)**
- [ ] ALL rows validated BEFORE writes
- [ ] Transaction used (all-or-nothing)
- [ ] Row-specific errors included

---

## Appendix D: Glossary

| Term | Definition |
|------|------------|
| **Auto-Halt** | System that stops online booking when seats ≤10 |
| **Company Segregation** | Complete data isolation between bus companies |
| **Dual Behavior** | Auto-halt applies to online only, not manual |
| **Guest Booking** | Ticket purchase without registration (phone-only) |
| **Manual Exemption** | Manual ticketing bypasses auto-halt |
| **Manual Ticketing** | Offline sales by company staff/cashier |
| **Online Booking** | Customer-facing purchase (subject to auto-halt) |
| **View-Only** | DEPARTED/COMPLETED/CANCELLED trips are read-only |
| **24-Hour Rule** | Same vehicle/driver can't be scheduled within 24h |
| **Smart Template** | Excel template with pre-populated company data |
| **Atomic Import** | All-or-nothing CSV/Excel import |
| **Commission** | Platform's 5% cut of ticket price |
| **VAT** | 15% tax on commission (not ticket price) |
| **Auto-Manifest** | Manifest generated when trip departs at full capacity |
| **Audit Segregation** | Super Admin logs hidden from companies |
| **Idempotency Key** | Prevents duplicate payment processing |
| **Row-Level Locking** | `SELECT FOR UPDATE` prevents concurrent booking |
| **Optimistic Locking** | Version field detects conflicting updates |

---

## Appendix E: Maintenance Guidelines

### Who Maintains

| Role | Responsibility |
|------|----------------|
| Dev Team Lead | Owner, approvals |
| All Developers | Contributors (via PR) |
| Product Manager | Review business rules |

### When to Update

1. **New Rule Discovered** → Add to appropriate file
2. **Bug Fixed** → Add to BUGS-REGISTRY.md
3. **Rule Changed** → Update rule + RULES.md changelog
4. **New API Route** → Update File-to-Rule Mapping

### Update Process

1. Create branch: `docs/rules-update-{description}`
2. Edit relevant rules file
3. Update RULES.md changelog if needed
4. Create PR with label `documentation`
5. Require 2 approvals
6. Merge to main

### Review Cycle

| Frequency | Scope |
|-----------|-------|
| Monthly | File references accuracy |
| Quarterly | Full rules review |
| Major Release | Comprehensive audit |

### Red Flags (Immediate Update)

- Security vulnerability discovered
- Financial calculation error found
- Data integrity bug identified
- New critical bug added to registry

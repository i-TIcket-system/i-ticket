# i-Ticket Platform Business Rules

> **Version**: 2.0.0 (Modular)
> **Last Updated**: January 24, 2026
> **Status**: Authoritative Reference

---

## MANDATORY 5-STEP WORKFLOW

**Before writing ANY code, follow this process:**

### Step 1: Check File-to-Rule Mapping
```
→ See: rules/APPENDICES.md (Section B)
→ Find which rules apply to files you're modifying
```

### Step 2: Read Specific Rules
```
→ rules/RULES-ULTRA-CRITICAL.md (RULE-001 to 003)
→ rules/RULES-CRITICAL.md (RULE-004 to 008)
→ rules/RULES-IMPORTANT.md (RULE-009 to 013)
→ rules/RULES-SECURITY.md (RULE-014 to 017)
→ rules/RULES-AUTOMATION.md (RULE-018 to 020)
→ rules/RULES-DATABASE.md (RULE-021 to 023)
```

### Step 3: Check Bug Registry
```
→ See: rules/BUGS-REGISTRY.md
→ Ensure you're not reintroducing known bugs
```

### Step 4: Implement with Compliance
```
→ Follow implementation checklists from rules
→ Add comments: // RULE-XXX: description
```

### Step 5: Document if Needed
```
→ Update relevant rules file if new rule discovered
→ Add to BUGS-REGISTRY.md if bug fixed
```

---

## PRIORITY LEGEND

| Badge | Level | Violation Impact |
|-------|-------|------------------|
| 🔴 | ULTRA-CRITICAL | Security breach, data integrity failure |
| 🟠 | CRITICAL | Business logic failure, financial loss |
| 🟡 | IMPORTANT | Poor UX, operational inefficiency |
| 🔒 | SECURITY | Attack surface, vulnerability |
| ⏰ | AUTOMATION | Cron job failure, stale data |
| 🗄️ | DATABASE | Data inconsistency, corruption |

---

## RULE INDEX

### Ultra-Critical Rules (🔴)
| ID | Rule | File |
|----|------|------|
| RULE-001 | Company Data Segregation | [RULES-ULTRA-CRITICAL.md](rules/RULES-ULTRA-CRITICAL.md#1-company-data-segregation) |
| RULE-002 | Guest Booking = Feature | [RULES-ULTRA-CRITICAL.md](rules/RULES-ULTRA-CRITICAL.md#2-guest-booking--feature) |
| RULE-003 | Trip Status Lifecycle | [RULES-ULTRA-CRITICAL.md](rules/RULES-ULTRA-CRITICAL.md#3-trip-status-lifecycle) |

### Critical Rules (🟠)
| ID | Rule | File |
|----|------|------|
| RULE-004 | Auto-Halt System (Dual Behavior) | [RULES-CRITICAL.md](rules/RULES-CRITICAL.md#4-auto-halt-system) |
| RULE-005 | 24-Hour Resource Allocation | [RULES-CRITICAL.md](rules/RULES-CRITICAL.md#5-24-hour-resource-allocation) |
| RULE-006 | Manual Ticketing Exemption | [RULES-CRITICAL.md](rules/RULES-CRITICAL.md#6-manual-ticketing-exemption) |
| RULE-007 | Payment & Commission | [RULES-CRITICAL.md](rules/RULES-CRITICAL.md#7-payment--commission) |
| RULE-008 | CSV/Excel Import Validation | [RULES-CRITICAL.md](rules/RULES-CRITICAL.md#8-csvexcel-import) |

### Important Rules (🟡)
| ID | Rule | File |
|----|------|------|
| RULE-009 | Staff Role Management | [RULES-IMPORTANT.md](rules/RULES-IMPORTANT.md#9-staff-roles) |
| RULE-010 | Vehicle & Fleet Management | [RULES-IMPORTANT.md](rules/RULES-IMPORTANT.md#10-vehicles) |
| RULE-011 | Seat Selection & Conflicts | [RULES-IMPORTANT.md](rules/RULES-IMPORTANT.md#11-seats) |
| RULE-012 | Notifications | [RULES-IMPORTANT.md](rules/RULES-IMPORTANT.md#12-notifications) |
| RULE-013 | Manifest Generation | [RULES-IMPORTANT.md](rules/RULES-IMPORTANT.md#13-manifests) |

### Security Rules (🔒)
| ID | Rule | File |
|----|------|------|
| RULE-014 | Input Validation | [RULES-SECURITY.md](rules/RULES-SECURITY.md#14-input-validation) |
| RULE-015 | Rate Limiting | [RULES-SECURITY.md](rules/RULES-SECURITY.md#15-rate-limiting) |
| RULE-016 | Authentication | [RULES-SECURITY.md](rules/RULES-SECURITY.md#16-authentication) |
| RULE-017 | Payment Security | [RULES-SECURITY.md](rules/RULES-SECURITY.md#17-payment-security) |

### Automation Rules (⏰)
| ID | Rule | File |
|----|------|------|
| RULE-018 | Old Trip Cleanup | [RULES-AUTOMATION.md](rules/RULES-AUTOMATION.md#18-old-trip-cleanup) |
| RULE-019 | Booking Timeout | [RULES-AUTOMATION.md](rules/RULES-AUTOMATION.md#19-booking-timeout) |
| RULE-020 | Predictive Maintenance | [RULES-AUTOMATION.md](rules/RULES-AUTOMATION.md#20-predictive-maintenance) |

### Database Rules (🗄️)
| ID | Rule | File |
|----|------|------|
| RULE-021 | Schema Constraints | [RULES-DATABASE.md](rules/RULES-DATABASE.md#21-schema) |
| RULE-022 | Transaction Management | [RULES-DATABASE.md](rules/RULES-DATABASE.md#22-transactions) |
| RULE-023 | Optimistic Locking | [RULES-DATABASE.md](rules/RULES-DATABASE.md#23-locking) |

---

## QUICK REFERENCE CARDS

### Company Segregation (RULE-001)
```
✅ Filter ALL queries by session.user.companyId
❌ Never trust client-provided companyId
```

### Guest Booking (RULE-002)
```
✅ Allow booking with phone only
❌ Never add OTP/SMS verification
🎯 Payment IS verification
```

### Trip Status (RULE-003)
```
✅ Block modifications for DEPARTED/COMPLETED/CANCELLED
✅ Force bookingHalted=true on final status
```

### Auto-Halt (RULE-004)
```
✅ Manual ticketing: ALWAYS allowed (no halt check)
✅ Online booking: Blocked when bookingHalted=true
🎯 Threshold: ≤10 seats
```

### Payment (RULE-007)
```
✅ Server calculates: commission = price × 5%
✅ VAT = commission × 15% (NOT price × 15%)
❌ Never trust client-provided amounts
```

### CSV Import (RULE-008)
```
✅ Validate ALL rows BEFORE any writes
✅ Use transaction (all-or-nothing)
```

---

## SUPPORTING DOCUMENTS

| Document | Purpose |
|----------|---------|
| [rules/BUGS-REGISTRY.md](rules/BUGS-REGISTRY.md) | 15 historical bugs that must never be reintroduced |
| [rules/APPENDICES.md](rules/APPENDICES.md) | File-to-Rule mapping, violation checklist, glossary |
| [RULES-FULL-BACKUP.md](RULES-FULL-BACKUP.md) | Complete original document (for reference) |

---

## CHANGELOG

### v2.0.0 (January 24, 2026)
- Modularized rules into separate files
- Created quick reference cards
- Improved navigation with index tables

### v1.0.0 (January 22, 2026)
- Initial RULES.md creation (2,467 lines)
- 24 rule categories, 15 bugs documented

# i-Ticket Platform

> **Version**: v2.7.0 | **Production**: https://i-ticket.et | **Full Docs**: `CLAUDE-FULL-BACKUP.md`
> **Rules**: `RULES.md` | **Stable Reference**: `CLAUDE-STABLE-REFERENCE.md`

---

## PRODUCTION (AWS EC2)

| Component | Details |
|-----------|---------|
| **Server** | AWS EC2 (t2.micro) - 54.147.33.168 |
| **Stack** | Ubuntu 22.04, Node.js 20.20.0, PM2, Nginx, PostgreSQL 16.11 |
| **SSL** | Cloudflare (Full strict) |

```bash
# Access
ssh -i mela-shared-key.pem ubuntu@54.147.33.168

# Commands
pm2 status | pm2 logs i-ticket | pm2 restart i-ticket
```

**Deploy**: `cd /var/www/i-ticket && git pull && npm ci && npm run build && pm2 restart i-ticket`

---

## ULTRA-CRITICAL BUSINESS RULES

### 1. GUEST BOOKING = FEATURE (NOT A BUG)
Phone payment IS verification - NO OTP needed. Guests can book without registration.

### 2. COMPANY SEGREGATION = ULTRA CRITICAL
Complete data isolation between bus companies. Every API MUST filter by `companyId`.
ONLY shared resource: City database.

### 3. AUTO-HALT DUAL BEHAVIOR
- **Manual ticketing**: Can ALWAYS sell to 0 seats (NEVER blocked)
- **Online booking**: Auto-halts at ≤10 seats (unless bypassed)
- Bypass: `Company.disableAutoHaltGlobally` or `Trip.autoResumeEnabled`

### 4. VIEW-ONLY TRIPS
DEPARTED, COMPLETED, CANCELLED trips are READ-ONLY. No edits, no ticket sales.

---

## TECH STACK

Next.js 14 (App Router) + React 18 + TypeScript + PostgreSQL + Prisma + NextAuth.js + Tailwind/shadcn/ui

---

## KEY FEATURES

| Feature | Details |
|---------|---------|
| **Auth** | Multi-role (Customer, Company Admin, Super Admin, Staff, Sales), NextAuth.js |
| **Booking** | Real-time slots, seat selection, multi-passenger, TeleBirr (5% + 15% VAT) |
| **Trips** | CRUD, intermediate stops, mandatory staff/vehicle, status lifecycle |
| **Fleet** | AI risk scoring, maintenance schedules, work orders, inspections |
| **Manifests** | Auto-generate on DEPARTED + full capacity |
| **Portals** | Super Admin, Company Admin, Staff, Cashier, Mechanic, Finance, Sales |

---

## DATABASE MODELS

**Core**: User, Company, Trip, Booking, Passenger, Ticket, Payment, City
**Fleet**: Vehicle, MaintenanceSchedule, WorkOrder, VehicleInspection
**Comms**: TripMessage, Notification, SupportTicket, CompanyMessage
**Sales**: SalesPerson, SalesReferral, SalesCommission
**Security**: ProcessedCallback, AdminLog

---

## KEY API ROUTES

| Category | Routes |
|----------|--------|
| **Public** | `/api/trips`, `/api/track/[code]` |
| **Company** | `/api/company/trips`, `/api/company/staff`, `/api/company/vehicles` |
| **Admin** | `/api/admin/stats`, `/api/admin/companies`, `/api/admin/trips` |
| **Cron** | `/api/cron/cleanup`, `/api/cron/trip-reminders` |

---

## FRONTEND ROUTES

- `/(auth)` - Login, Register
- `/(customer)` - Search, Booking, Tickets
- `/(company)` - Dashboard, Trips, Staff, Vehicles
- `/(admin)` - Dashboard, Companies, Trips, Manifests
- `/(staff|cashier|mechanic|finance|sales)` - Role portals

---

## TEST LOGINS

| Role | Phone | Password |
|------|-------|----------|
| Super Admin | 0911223344 | demo123 |
| Selam Bus Admin | 0922345678 | demo123 |
| Customer | 0912345678 | demo123 |

---

## SECURITY

- Zod validation, rate limiting, payment replay protection
- Row-level locking, transaction timeouts (10s)
- parseInt validation (rejects scientific notation)
- bcrypt passwords, 30-day sessions

---

## RECENT UPDATES (v2.7.0 - Jan 24, 2026)

1. **Silent Auto-Refresh** - Search results refresh every 30s without scroll jump or loading flash
2. **Trip Detail Refresh** - Manual refresh button + 30s auto-refresh for company admin
3. **Service Charge Rename** - "Commission" → "Service Charge" in all customer-facing UI
4. **PWA Mobile Optimization** - Safe area insets, touch targets, notch support
5. **Seat Map Orientation** - Auto-detect portrait for phones + manual toggle button
6. **Admin Passenger Milestone** - Progress bar added to super admin dashboard
7. **Company Messages Redirect** - /admin/company-messages → /admin/company-support

### Previous (v2.5.0 - Jan 23, 2026)
- Dashboard Redesign, CSV Import Enhancement, Supervisor Role, Platform Staff Permissions

---

## CRITICAL BUG FIXES (Reference)

| Bug | Fix |
|-----|-----|
| Staff API role filter | Use `role: "COMPANY_ADMIN"` + `staffRole` filter |
| Auto-halt re-trigger | `adminResumedFromAutoHalt` flag |
| Commission VAT | 106 ETB = 100 ticket + 5 commission + 1 VAT |
| Race conditions | DB-level locking with `SELECT FOR UPDATE NOWAIT` |

---

## BUILD ERROR: useSearchParams() CSR Bailout

**Error**: `useSearchParams() should be wrapped in a suspense boundary`

**Symptom**: Build shows 140/140 pages generated but fails with:
```
> Export encountered errors on following paths:
    /login/page: /login
    /page: /
    /register/page: /register
```
PM2 shows `errored` status with `ENOENT: prerender-manifest.json`

**Root Cause**: Client components (`"use client"`) using `useSearchParams()` without Suspense boundary causes static generation to fail. The `prerender-manifest.json` is not created.

**Solution** (Jan 24, 2026): Add to `next.config.js`:
```javascript
experimental: {
  missingSuspenseWithCSRBailout: false,
},
```

This suppresses the error for client components using useSearchParams without requiring Suspense boundaries.

**Alternative Solutions** (not used):
1. Wrap useSearchParams in Suspense boundary
2. Add `export const dynamic = 'force-dynamic'` to each page (doesn't work in client components)
3. Convert pages to server components with client child components

---

## MANDATORY WORKFLOW

Before ANY code change:
1. Read `RULES.md` appendices (File-to-Rule mapping)
2. Check Bug Registry
3. Implement with compliance
4. Document if needed

---

**Full changelog & details**: See `CLAUDE-FULL-BACKUP.md`

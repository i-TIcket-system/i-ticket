# i-Ticket Platform

> **Full History**: See `CLAUDE-BACKUP-v3.md` for complete changelog details.
> **🚨 CRITICAL**: See `CLAUDE-STABLE-REFERENCE.md` before making any code changes!

---

## 🚨 ULTRA-CRITICAL BUSINESS RULES

### 1. GUEST BOOKING = FEATURE (NOT A BUG)
- Phone payment IS the verification - no OTP/SMS verification needed
- Guests can book without registration - this is BY DESIGN

### 2. COMPANY SEGREGATION = ULTRA CRITICAL
- **Complete data isolation between bus companies**
- Selam Bus must NEVER see Sky Bus data (and vice versa)
- **ONLY shared resource: Organic City database**
- Every API MUST filter by `companyId`

## Tech Stack
Next.js 14 (App Router) + React 18 + TypeScript + PostgreSQL + Prisma + NextAuth.js + Tailwind/shadcn/ui

---

## Recent Development (Jan 2026)

### Latest Updates (Jan 20, 2026 - Evening Session)
- **Batch Trip Creation - Import Path Fixes** (IN PROGRESS)
  - Fixed import paths in new API routes (batch, trip-templates)
  - Changed `@/lib/auth-options` → `@/lib/auth`
  - Changed `@/lib/prisma` → `@/lib/db` (consistent with existing codebase)
  - Fixed `company.phone` → `company.phones` in admin pages
  - **PENDING**: TypeScript validation error in validateQueryParams (pagination schema transform types)
  - **STATUS**: Build failing, will resume in next session

### Latest Updates (Jan 20, 2026 - Morning Session)
- **Company Management**: Super Admin can register/edit bus companies with credential provisioning
  - Force password change flow for new admins (`mustChangePassword` flag)
  - Auto-generated temporary passwords (8 chars)
  - Ethiopian phone validation (09XXXXXXXX)
- **Trip Detail View**: Super Admin can view all trip details with audit trail
  - Audit logging with `companyId = NULL` (platform surveillance)
  - Companies CANNOT see Super Admin access logs
  - Comprehensive trip info: route, staff, vehicle, bookings, revenue
- **All Trips View**: Super Admin dashboard for monitoring all trips platform-wide
  - Filters: company, status, date range, search
  - Sorting: company, departure time, price, availability
  - Pagination: 50 trips per page

### Key Features (Jan 19-20, 2026)
- **Custom Staff Roles**: Companies can create unlimited custom roles (e.g., SUPERVISOR, QUALITY_INSPECTOR)
  - API validation: `z.string().min(2).max(50).regex(/^[A-Z_]+$/)`
  - Dynamic role filtering in staff management
- **Auto-Manifest System**: Platform automatically generates manifests for Super Admin
  - Triggers: Trip DEPARTED + Full capacity (availableSlots = 0)
  - File storage: `/public/manifests/company-{id}/trip-{id}-{timestamp}.xlsx`
  - Audit segregation: Super Admin logs (`companyId = null`) NOT visible to companies
  - Dashboard: `/admin/manifests` with filters, stats, download capability
- **Audit Log CSV Export**: Both Super Admin and Company admins can export audit logs
  - Quick date range buttons (7, 30, 90 days)
  - Filtered exports based on current settings

### Critical Bug Fixes (Jan 16-20, 2026)
- **Race Conditions**: Fixed trip log conflicts + duplicate bookings (DB-level locking)
- **Commission VAT Logic**: Fixed calculation (106 ETB total = 100 ticket + 5 commission + 1 VAT)
- **Vehicle Change Sync**: All properties now sync when trip vehicle changes
- **parseInt Validation**: Comprehensive validation across all API routes

### UX Improvements (Jan 16-19, 2026)
- **Homepage Redesign**: Priority 1-3 UX improvements (stats placement, accessibility, performance)
- **Search/Booking Pages**: Darker teal theme, price visibility fixes, compare feature (Gmail-style)
- **Auth Pages**: Ethiopian cultural elements (Tilahun weave, Lalibela cross patterns)
- **Payment Page**: Better clarity, brand colors, mobile detection

### Phase 2 Features (Dec 2025 - Jan 2026)
- **Predictive Maintenance**: AI risk scoring (0-100), work orders, mechanic/finance portals
- **Trip Reminders**: Hourly cron job (day before + hours before departure)
- **Company Chat**: File attachments, bidirectional read tracking, rate limiting
- **Seat Selection**: Interactive map with guzo.et-inspired design
- **Cities Database**: 90 Ethiopian cities (static list + DB)

---

## Core Features

### Authentication
- Multi-role: Customer, Company Admin, Super Admin, Staff (Driver/Conductor/Ticketer/Mechanic/Finance + Custom Roles), Sales Person
- NextAuth.js sessions, guest users (SMS-only), password reset via OTP
- Force password change flow for new company admins

### Booking & Payments
- Real-time slot management, seat selection, multi-passenger bookings
- TeleBirr integration (web + SMS), 5% commission + 15% VAT, QR + short codes
- Manual ticketing for offline sales, payment expiration (15 minutes)

### Trip Management
- CRUD with intermediate stops, staff/vehicle assignment (all mandatory)
- Auto-halt at 10% capacity, search filters, distance tracking
- Trip status: SCHEDULED, BOARDING, DEPARTED, COMPLETED, CANCELLED
- Actual departure/arrival times auto-recorded

### Fleet Management
- Vehicle CRUD with Ethiopian dual ID (plate + side number)
- AI risk scoring (5-factor weighted), predicted failure dates
- Maintenance schedules (mileage OR time-based), work orders with parts
- Fuel tracking, digital inspections, odometer logs

### Admin Portals
- **Super Admin**: Stats, revenue, companies, audit logs, support tickets, company chat, manifests, all trips
- **Company Admin**: Trips, staff (custom roles), vehicles, work orders, manifests, contact support, audit logs
- **Staff Portal**: My Trips with TripChat
- **Cashier**: Ticketing dashboard with seat map
- **Mechanic**: Work orders assigned to me
- **Finance**: Cost tracking, work order oversight
- **Sales**: Referrals, commissions, QR flyers

### Company-Platform Communication
- Dedicated chat with file attachments (images, PDFs, docs)
- Company segregation enforced, real-time polling updates
- Rate limiting: 10 messages per hour

### Auto-Manifest System
- **Super Admin Only**: Automatic manifest generation for commission tracking
- **Two Triggers**: Trip DEPARTED + Full capacity
- **Audit Segregation**: Super Admin logs (`companyId = null`) NOT visible to companies
- **Non-Blocking**: Fire-and-forget async execution

### Integrations
- TeleBirr (HMAC-SHA256), ClickUp (one-way sync), Africa's Talking SMS

---

## Database Models

**Core**: User, Company, Trip, Booking, Passenger, Ticket, Payment, City
**Fleet**: Vehicle, MaintenanceSchedule, WorkOrder, WorkOrderPart, VehicleInspection, FuelEntry, OdometerLog
**Communication**: TripMessage, TripMessageReadReceipt, Notification, SupportTicket, CompanyMessage, WorkOrderMessage, WorkOrderMessageReadReceipt
**Sales**: SalesPerson, SalesQrScan, SalesReferral, SalesCommission, SalesPayout
**Security**: ProcessedCallback, PasswordReset, AdminLog
**Platform Oversight**: ManifestDownload (tracks auto-generated manifests)
**SMS**: SmsSession

---

## Key API Routes

**Public**: `/api/trips`, `/api/track/[code]`, `/api/tickets/verify/public`
**Company**: `/api/company/trips`, `/api/company/staff`, `/api/company/vehicles`, `/api/company/work-orders`, `/api/company/messages`, `/api/company/audit-logs/download`
**Staff**: `/api/staff/my-trips`, `/api/trips/[tripId]/messages`
**Cashier**: `/api/cashier/my-trips`, `/api/cashier/trip/[tripId]/sell`
**Mechanic**: `/api/mechanic/work-orders`
**Finance**: `/api/finance/work-orders`
**Admin**: `/api/admin/stats`, `/api/admin/companies`, `/api/admin/trips`, `/api/admin/trips/[tripId]`, `/api/admin/manifests`, `/api/admin/company-messages`, `/api/admin/audit-logs/download`
**Cron**: `/api/cron/predictive-maintenance` (daily 2 AM), `/api/cron/trip-reminders` (hourly), `/api/cron/cleanup` (hourly)

---

## Frontend Routes

- `/(auth)` - Login, Register, Force Password Change
- `/(customer)` - Search, Booking, Tickets, Profile
- `/(company)` - Dashboard, Trips, Staff (custom roles), Vehicles, Work Orders, Contact Support
- `/(staff)` - My Trips with TripChat
- `/(cashier)` - Ticketing portal
- `/(mechanic)` - Work order management
- `/(finance)` - Cost tracking
- `/(admin)` - Dashboard, Companies, All Trips, Trip Details, Manifests, Company Support, Audit Logs
- `/(sales)` - Sales person portal

---

## Security

- Environment validation, bcrypt passwords, 30-day sessions
- Zod validation, rate limiting (IP + User + Booking)
- Payment replay protection (SHA-256), row-level locking
- Transaction timeouts (10s), optimistic locking
- CSP headers, XSS prevention, safe error messages
- Comprehensive parseInt validation (rejects scientific notation)

---

## Test Logins

- **Selam Bus Admin**: 0922345678 / demo123
- **Super Admin**: 0911223344 / demo123
- **Drivers**: 0914444444-45 / demo123
- **Customer**: 0912345678 / demo123

---

## Deployment

**Required**: PostgreSQL, NEXTAUTH_SECRET, TeleBirr credentials, SMS gateway
**Optional**: CLICKUP_API_KEY, CRON_SECRET

---

**Built with Claude AI (Anthropic)**

# Development Progress - i-Ticket Platform

This document tracks major features and technical architecture for the i-Ticket platform.

> **Full Development History**: See `CLAUDE-FULL-BACKUP.md` for complete session logs and detailed implementation notes.

---

## Project Overview

**i-Ticket** is an AI-driven ticketing platform for Ethiopian long-distance bus companies with real-time slot management, TeleBirr payments, and QR ticket verification.

**Tech Stack:**
- Next.js 14 (App Router) + React 18 + TypeScript
- PostgreSQL + Prisma ORM
- NextAuth.js for authentication
- Tailwind CSS + shadcn/ui
- Docker for containerization

---

## Recent Development Summary

### January 2026
- **CUSTOMER EXPERIENCE BUNDLE (PHASE 2)** - Completed 3 high-impact UX enhancements for smoother booking experience:
  - **Trip Comparison Feature** - Side-by-side comparison dialog for up to 4 trips. Checkboxes on search results, comparison table shows company, price (highlights cheapest), departure time, duration, distance, amenities, available seats. Helps customers make informed decisions
  - **Remember Me Checkbox** - Optional 30-day session on login with phone number persistence via localStorage. Auto-fills returning users' phone numbers
  - **Form Field-Level Errors** - Inline validation messages below each invalid field with red border highlighting, auto-clears on typing, aria-live announcements for screen readers
  - **Impact**: Reduced decision fatigue, faster logins for frequent users, clearer form validation feedback
- **ACCESSIBILITY IMPROVEMENTS (WCAG 2.1)** - Enhanced platform accessibility to Level A partial compliance:
  - **Skip to Main Content** - Hidden keyboard navigation link (visible on Tab focus) to bypass navbar, teal-styled button matching brand
  - **Form Error Announcements** - aria-live="polite" on all error messages for screen reader support
  - **Language Attribute** - html lang="en" for SEO and accessibility (already existed)
  - **Dark Mode Toggle** - Moon/sun icon in navbar (desktop + mobile menu), localStorage persistence, complete dark theme using existing CSS variables
  - **Impact**: Screen reader support improved, keyboard navigation streamlined, user preference for theme
- **SEAT SELECTION SYSTEM (HIGHEST IMPACT)** - Visual seat selection interface for online bookings with manual ticketing compatibility:
  - **Interactive Seat Map** - 2-2 layout (window-aisle-aisle-window) with color-coded states (green=available, blue=selected, gray=occupied), click to select/deselect with FIFO auto-deselect, row labels (A, B, C...), seat position indicators, legend, mobile responsive
  - **Real-Time API** - GET /api/trips/[tripId]/seats returns occupied/available seats, filters cancelled bookings, updates dynamically
  - **Smart Validation** - Validates selectedSeats.length matches passengerCount, verifies seats available in transaction, prevents occupied seat selection, validates seat range (1-totalSlots)
  - **Manual Ticketing Reference** - View-only seat map with toggle button for staff reference, shows assigned seats in success message (10-second duration), auto-assignment only (no selection complexity)
  - **Parallel System Safety** - Online seat selection works alongside manual ticketing auto-assignment with zero conflicts, transaction locking prevents double-booking, optional fallback to auto-assignment if no seats selected
  - **Files**: SeatMap.tsx (200+ lines), seats API endpoint (74 lines), booking API enhanced, manual ticketing card updated
  - **Impact**: Industry-standard feature, customer satisfaction (window/aisle preference), staff can write seat numbers on paper tickets
- **QA & UX AUDIT + PHASE 1 IMPROVEMENTS** - Comprehensive 479-line audit report (QA-UX-AUDIT-REPORT.md) identified 27 findings across 17 categories. Overall rating: A- (Excellent). Implemented Phase 1 critical UX improvements:
  - **Password Visibility Toggle** - Eye icon on all password fields (login, register, forgot-password) for better UX and reduced login failures
  - **ARIA Labels for Accessibility** - Added aria-label and aria-expanded attributes to 9 icon-only buttons (password toggles, sidebar collapses, mobile menus, trip action buttons) for screen reader support (WCAG 2.1 Level A compliance)
  - **Payment Phone Clarity Banner** - Persistent blue banner on booking page showing which phone receives TeleBirr payment request, especially critical for multi-passenger bookings. Replaced time-limited toast with always-visible banner
  - **International Phone Format** - Full support for +251 format (critical for iPhone autofill). Updated PhoneInput component, Zod schemas, and all form validations. Accepts 09XXXXXXXX, 07XXXXXXXX, +2519XXXXXXXX formats with auto-normalization
  - **Files Modified**: 12 files (3 auth pages, 4 layouts, 1 component, 1 validation library, 3 forms)
  - **Impact**: Improved accessibility for screen reader users, eliminated iPhone autofill friction, clarified payment flow for guest users
- **CRITICAL SECURITY HARDENING** - Comprehensive security audit identified and fixed 16 vulnerabilities (6 P0 critical, 5 P1 high, 3 P2, 2 P3). Production-ready security achieved (C- → A- rating)
  - **P0 Fixes**: Environment validation, credential rotation, trip update IDOR protection, booking race condition fix (row-level locking), payment callback replay protection (SHA-256 hashing), SQL injection prevention
  - **P1 Fixes**: Secure password reset system (bcrypt hashed tokens), reduced session duration (7 days → 24 hours), payment amount server-side verification, enhanced SMS sanitization (5-layer XSS prevention), enhanced rate limiting (IP + User + Booking)
  - **P2/P3 Fixes**: Cryptographically secure short codes (crypto.randomBytes), safe error messages, passenger data validation, transaction timeouts, performance indexes, CSP security headers, optimistic locking (version field)
  - **New Models**: ProcessedCallback (replay protection), PasswordReset (secure tokens)
  - **New Utilities**: trip-update-validator.ts, callback-hash.ts, password-reset.ts, error-handler.ts
  - **Documentation**: SECURITY.md (479 lines), .env.example (77 lines)
- **Payment Architecture Clarification** - Platform-as-Merchant model with bank account settlements confirmed as optimal approach. TeleBirr multi-merchant routing not supported; WeBirr aggregator research recommended for multi-payment method support (TeleBirr + CBE Birr + Awash Birr)
- **Comprehensive UI Overhaul** - Complete design system with teal gradient theme, custom animations (fade-up, slide-in, scale-in, float, shimmer), Ethiopian patterns (SVG backgrounds, flag-colored accents), responsive components, modern auth pages, enhanced home page
- **Collapsible Sidebars** - Responsive navigation across all admin interfaces (Super Admin, Company Admin, Sales Person, Staff) with tooltips, smooth animations, and mobile hamburger menus
- **ClickUp Integration** - One-way task management automation for support tickets (priority-mapped), audit logs (company activation/deactivation, trip operations), and low slot alerts (urgent 2-hour deadlines). Fire-and-forget async calls with exponential backoff retry logic
- **About Page** - Public-facing company information page with mission, story, key features (Wide Network, Secure & Trusted, Instant Booking, Customer First), and company values
- **Distance Tracking** - Trip distance field (kilometers) throughout booking flow, search results, ticket pages, and public API responses
- **Vehicle Display Enhancement** - Vehicle information (plate number, side number) shown on tickets and receipts for passenger transparency
- **Presentation Package** - Complete business presentation materials: slide deck, detailed speaker notes, PDF/PowerPoint versions, comprehensive brand guide (color palette, typography, layouts), 30-minute quick-start setup guide
- **Sales Person Referral System** - Platform-level sales team with QR-coded flyers, lifetime commission tracking (5% of platform's 5%), fraud prevention, first-come attribution
- **Custom Staff Roles Expansion** - Enhanced role management beyond three defaults with role-specific permissions

### December 2025
- **Auto-Halt Logic Fix** - Added `adminResumedFromAutoHalt` flag to prevent re-triggering after manual resume
- **Manifest Improvements** - Enhanced Excel reports with actual driver/conductor names and proper alignment
- **Legal Documentation** - Comprehensive Terms (690 lines, 19 sections including Section 20 for sales), Privacy Policy (700 lines, 18 sections), FAQ (1,100 lines, 45+ questions, 7 categories)
- **UX Fixes** - Customer login redirect to search page, functional admin Quick Actions, low slot alert fix (prevents alerts for sold-out trips)
- **Super Admin Dashboard** - Revenue analytics with Recharts visualization, Excel invoices, 30-day charts, top routes/companies
- **SMS Bot Integration** - Complete SMS booking system (English + Amharic) for feature phone users
- **Staff Management** - CRUD operations, role assignments, "My Trips" portal, performance reports
- **Manual Ticketing** - Offline sales tracking for terminal/office sales with enhanced validation
- **Support Tickets** - Auto-categorized customer support system with admin dashboard
- **Intermediate Stops** - Display route stops across all views
- **Sales Audit Filters** - Enhanced filtering and audit trail for sales person activities

---

## Core Features

### Authentication & Users
- Multi-role system (Customer, Company Admin, Super Admin, Staff: Driver/Conductor/Ticketer, Sales Person)
- NextAuth.js session management, role-based access control
- Guest users (SMS-only, no password required)
- Password reset via OTP

### Sales Person System
- Platform-level sales team (managed by Super Admin)
- QR-coded flyers with permanent referral codes (e.g., ABEL23)
- Lifetime user attribution - sales person earns on all future bookings by referred users
- Commission model: 5% of platform's 5% = 0.25% of ticket price
- Fraud prevention: visitor deduplication, first-come attribution (first referral wins)
- Sales portal: dashboard, referrals list, commission history, profile management
- Admin management: CRUD, performance metrics, payout processing (Cash/TeleBirr)

### Trip Management
- Trip CRUD with intermediate stops, dynamic city database
- Staff assignment (driver, conductor, ticketer)
- Auto-halt at 10% capacity with admin override system
- Manual halt/resume with flag management
- Search with filters (origin, destination, date, bus type)

### Booking System
- Real-time slot management, auto seat assignment
- Multi-passenger bookings with pickup/dropoff locations
- Manual ticket sales tracking (offline terminal sales)
- Public booking tracking (no auth required)

### Payment & Ticketing
- TeleBirr integration (web + SMS merchant-initiated payments)
- 5% commission model, demo mode for testing
- QR codes + 6-character short codes
- Public ticket verification API for conductors

### SMS Bot (Feature Phone Users)
- Bilingual conversational bot (English + Amharic)
- 8-state machine, 15-min session expiry
- Commands: BOOK, CHECK, STATUS, HELP, CANCEL
- Auto guest user creation, TeleBirr MMI popup payments
- Ticket delivery via SMS

### Admin & Reports
- **Super Admin**: System stats, revenue analytics, company management, audit logs, support tickets
- **Company Admin**: Trip management, staff CRUD, vehicle fleet management, booking controls, passenger manifests (Excel)
- **Staff Portal**: "My Trips" view, performance reports
- **Vehicle Management**: Fleet CRUD with Ethiopian dual identification (plate + side number), status tracking, compliance monitoring
- **Excel Reports**: Platform revenue invoices, passenger manifests with signatures

### Legal & Support
- Comprehensive Terms & Conditions (19 sections + Section 20 for sales persons)
- Privacy Policy (18 sections, GDPR-style)
- FAQ (45+ questions, 7 categories)
- Support ticket system (6 categories, 4 priority levels)

### ClickUp Integration
- **One-way sync** from i-Ticket to ClickUp for task management
- **Automated task creation** for:
  - Support tickets (priority-mapped: Urgent → Priority 1, High → Priority 2, etc.)
  - Critical audit logs (company activation/deactivation, trip operations)
  - Low slot alerts (urgent tasks with 2-hour deadline)
- **Fire-and-forget pattern** - Non-blocking async calls to avoid slowing API responses
- **Retry logic** - Exponential backoff (1s, 2s, 4s) for failed requests
- **Demo mode** - Works without API key for testing
- **Environment variables**: `CLICKUP_API_KEY`, `CLICKUP_LIST_SUPPORT`, `CLICKUP_LIST_ALERTS`, `CLICKUP_LIST_AUDIT`, `CLICKUP_ENABLED`

### Design System
- **Teal Gradient Theme** - Custom color palette with primary/secondary/accent shades (50-900)
- **Ethiopian Patterns** - SVG background patterns, Ethiopian flag accents (green-yellow-red)
- **Custom Animations** - fade-up, slide-in, scale-in, float, shimmer keyframes
- **Collapsible Navigation** - Responsive sidebars (288px expanded → 80px collapsed) with tooltips
- **Typography** - Extended font families (display, body) with Tailwind config
- **Custom Scrollbar** - Styled scrollbar matching teal theme
- **Dark Mode Support** - HSL variable system for theme switching

---

## Technical Architecture

### Database Models
- **User** - Auth, profile, roles (`staffRole`, `licenseNumber`, `employeeId`, `isGuestUser`)
- **Company** - Details, status, report signatures (`preparedBy`, `reviewedBy`, `approvedBy`)
- **Trip** - Route, schedule, pricing, distance (km), staff assignments, vehicle assignment, control flags (`bookingHalted`, `lowSlotAlertSent`, `adminResumedFromAutoHalt`, `vehicleId`, `distance`)
- **Vehicle** - Fleet management with Ethiopian dual identification (`plateNumber`, `sideNumber`), specs (`make`, `model`, `year`, `busType`, `totalSeats`), status tracking (`ACTIVE`, `MAINTENANCE`, `INACTIVE`), compliance (`registrationExpiry`, `insuranceExpiry`)
- **Booking** - Status, payment tracking (`isQuickTicket`)
- **Passenger** - Details, seat, pickup/dropoff
- **Ticket** - QR codes, short codes, verification status, vehicle information display
- **Payment** - Transactions, commission (`initiatedVia`)
- **City** - Auto-populated from trips
- **AdminLog** - Audit trail, ClickUp integration
- **SupportTicket** - Customer support, ClickUp integration
- **SmsSession** - SMS bot state tracking
- **SalesPerson** - Sales team accounts with referral codes, status tracking
- **SalesQrScan** - QR scan tracking with visitor deduplication
- **SalesReferral** - Lifetime user attribution (userId unique)
- **SalesCommission** - Commission per booking (5% of platform's 5%)
- **SalesPayout** - Payout records (Cash/TeleBirr)
- **ProcessedCallback** - Payment callback idempotency tracking (`transactionId`, `callbackHash`, replay protection)
- **PasswordReset** - Secure password reset tokens (`tokenHash` bcrypt, `isUsed`, one-time use enforcement)

### External Integrations
- **TeleBirr** - Payment gateway (web + SMS merchant-initiated payments, HMAC-SHA256 signature verification)
- **ClickUp** - Task management (one-way sync for tickets, alerts, audit logs)
- **Africa's Talking** - SMS gateway (bilingual bot, session management, MMI popup payments)

### Key API Endpoints

**Public**: `/api/trips`, `/api/track/[code]`, `/api/track/scan`, `/api/tickets/verify/public`, `/api/support/tickets`

**Customer**: `/api/bookings`, `/api/payments`, `/api/user/*`

**Company**: `/api/company/trips`, `/api/company/staff`, `/api/company/vehicles`, `/api/company/vehicles/[vehicleId]`, `/api/company/trips/[id]/toggle-booking`, `/api/company/trips/[id]/manual-ticket`, `/api/company/trips/[id]/manifest`

**Staff**: `/api/staff/my-trips`

**Admin**: `/api/admin/stats`, `/api/admin/companies`, `/api/admin/audit-logs`, `/api/admin/analytics/*`, `/api/admin/reports/platform-revenue`, `/api/admin/support/tickets`, `/api/admin/sales-persons/*`

**Sales**: `/api/sales/dashboard`, `/api/sales/referrals`, `/api/sales/commissions`, `/api/sales/qr-code`, `/api/sales/profile`, `/api/sales/password`

**SMS**: `/api/sms/incoming`, `/api/sms/outgoing`, `/api/payments/telebirr/callback`

**Cron**: `/api/cron/cleanup` (SMS session cleanup)

### Frontend Routes
- `/(auth)` - Login, Register, Password Reset (modern UI with teal gradients)
- `/(customer)` - Search, Booking, Tickets, Profile, Track
- `/(company)` - Dashboard, Trips, Staff, Vehicles, Reports, Profile, Verification (collapsible sidebar)
- `/(staff)` - My Trips (collapsible sidebar)
- `/(admin)` - Dashboard, Companies, Audit Logs, Support Tickets, Sales Persons (collapsible sidebar)
- `/(sales)` - Dashboard, Referrals, Commissions, Profile (collapsible sidebar)
- `/about` - Company information, mission, values, features
- `/contact`, `/track/[code]`, `/terms`, `/privacy`, `/faq`

### Key Libraries
- **Reports**: `src/lib/report-generator.ts`, `src/lib/platform-revenue-report.ts`
- **SMS**: `src/lib/sms/bot.ts`, `src/lib/sms/gateway.ts`, `src/lib/sms/messages.ts`
- **Payments**: `src/lib/payments/telebirr.ts`, `src/lib/payments/callback-hash.ts` (replay protection)
- **Sales**: `src/lib/sales/referral-utils.ts` (QR generation, code generation, visitor hashing)
- **ClickUp**: `src/lib/clickup/client.ts`, `src/lib/clickup/task-templates.ts`, `src/lib/clickup/index.ts`
- **Charts**: `recharts` (analytics visualization for revenue charts)
- **Security**: `src/lib/trip-update-validator.ts` (business rule enforcement), `src/lib/password-reset.ts` (secure token management), `src/lib/error-handler.ts` (safe error responses)
- **Hooks**: `src/hooks/use-referral-tracking.ts` (client-side referral tracking)
- **Utils**: `src/lib/rate-limit.ts` (enhanced multi-layer limiting), `src/lib/validations.ts`, `src/lib/auth-helpers.ts`, `src/lib/city-utils.ts`

### Security Features
- **Environment Security**: NEXTAUTH_SECRET validation on startup (32+ byte requirement), strong credential enforcement, .gitignore protection
- **Authentication**: Password hashing (bcrypt), secure password reset (hashed tokens, one-time use), session duration 24 hours (reduced from 7 days)
- **Authorization**: Role-based access control, field-level permissions (trip updates), ownership verification
- **Input Validation**: Zod schemas on all endpoints, passenger data validation (name length, national ID format, child limits), SQL injection prevention (parameterized queries)
- **Rate Limiting**: Enhanced multi-layer (IP + User + Booking), SMS per-phone limiting, payment spam protection (3 attempts per booking per hour)
- **Payment Security**: Callback replay protection (SHA-256 hash + transaction ID), signature verification (HMAC-SHA256), amount recalculation server-side, idempotency enforcement
- **Race Condition Protection**: PostgreSQL row-level locking (SELECT FOR UPDATE NOWAIT), atomic slot updates, transaction isolation (Serializable)
- **Business Logic Protection**: Trip price/slot immutability after paid bookings, audit trail for all blocked attempts
- **Data Security**: Cryptographically secure random generation (crypto.randomBytes), XSS prevention (HTML encoding), safe error messages (no technical details leaked)
- **Performance**: Transaction timeouts (10s), composite database indexes, optimized queries
- **Browser Security**: Content Security Policy headers (XSS/injection prevention), X-Frame-Options (clickjacking prevention), strict referrer policy
- **Concurrency**: Optimistic locking with version field (prevents concurrent update conflicts)

---

## Development Workflow

1. Feature planning and architecture design
2. Implementation with code reviews
3. Testing and validation
4. Documentation updates
5. Deployment preparation

### Best Practices
- Strict TypeScript, Zod schemas for validation
- Error boundaries, clear separation of concerns
- DRY principle, security-first approach
- Database indexes, pagination, optimistic UI updates

---

## Deployment Checklist

### Environment
- PostgreSQL database, NEXTAUTH_SECRET, TeleBirr credentials, SMS gateway config
- ClickUp integration: `CLICKUP_API_KEY`, `CLICKUP_LIST_SUPPORT`, `CLICKUP_LIST_ALERTS`, `CLICKUP_LIST_AUDIT`, `CLICKUP_ENABLED` (optional)

### Production
- Database migrations, environment variables, SSL certificates
- CORS policies, rate limiting, error monitoring (Sentry)
- Backup strategy, load balancing

### Monitoring
- Application performance, database queries, error tracking
- User analytics, payment transaction monitoring

---

## Future Enhancements

### High Priority
- Real-time seat selection visualization
- Multiple payment gateways (currently TeleBirr only)
- WhatsApp Business integration
- GPS tracking for real-time bus location

### Medium Priority
- Dynamic pricing based on demand
- Loyalty programs and discounts
- Trip recommendations based on history
- Push notifications for trip updates

### Technical
- GraphQL API, Redis caching, WebSocket for real-time updates
- Automated testing suite, advanced analytics dashboard
- Accounting integration (QuickBooks, etc.)

---

## Additional Documentation

### Business & Analysis Documents
- **CHANNEL-COMPARISON-ANALYSIS.md** (44KB, 1,363 lines) - Comprehensive comparison of SMS vs WhatsApp vs Telegram vs AI-IVR booking channels, cost analysis, implementation roadmap
- **Presentation-Brand-Guide.md** (16KB) - Complete brand guidelines with color palette, typography, layouts
- **PRESENTATION-QUICK-START.md** (14KB) - 30-minute presentation setup guide
- **i-Ticket-Bus-Company-Presentation.md** (42KB) - Detailed speaker notes for business presentation
- **i-Ticket-Presentation-Slides.md** - Full slide deck in Markdown format
- **i-Ticket-Presentation.pdf** (2.7MB) - Final PDF presentation
- **i-Ticket-Presentation.pptx** (12MB) - PowerPoint version

### Technical Documentation
- **SUPER-ADMIN-UX-AUDIT.md** (34KB) - UX audit findings and recommendations
- **SMS-SCALABILITY-ANALYSIS.md** (23KB) - SMS system scalability analysis
- **SMS-DEPLOYMENT-GUIDE.md** (29KB) - SMS bot deployment instructions
- **SMS-BOT-TEST-RESULTS.md** (9KB) - Test results for SMS bot
- **SMS-USER-GUIDE.md** (7.5KB) - User guide for SMS booking
- **UX_TESTING_AUDIT.md** (2.8KB) - UX testing findings
- **LOGGING_AUDIT.md** (6.6KB) - Logging audit results
- **TESTING.md** (11KB) - Testing documentation
- **IMPROVEMENTS.md** (21KB) - Planned improvements list
- **README.md** (11KB) - Project README

### Configuration Examples
- **.env.clickup.example** (20 lines) - ClickUp integration environment variables template

### Agent Configuration
- **.claude/agents/skills-agent.md** (88 lines) - Custom Claude agent for MCP/skills framework guidance

---

**Built with assistance from Claude AI (Anthropic)**
**Full session history available in CLAUDE-FULL-BACKUP.md**

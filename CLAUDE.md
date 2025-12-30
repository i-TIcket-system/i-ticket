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

### December 2025
- **Auto-Halt Logic Fix** - Added `adminResumedFromAutoHalt` flag to prevent re-triggering after manual resume
- **Manifest Improvements** - Enhanced Excel reports with actual driver/conductor names and proper alignment
- **Legal Documentation** - Comprehensive Terms (690 lines), Privacy Policy (700 lines), FAQ (1,100 lines, 45+ questions)
- **UX Fixes** - Customer login redirect to search page, functional admin Quick Actions
- **Super Admin Dashboard** - Revenue analytics, Excel invoices, 30-day charts, top routes/companies
- **SMS Bot Integration** - Complete SMS booking system (English + Amharic) for feature phone users
- **Staff Management** - CRUD operations, role assignments, "My Trips" portal, performance reports
- **Manual Ticketing** - Offline sales tracking for terminal/office sales
- **Support Tickets** - Auto-categorized customer support system with admin dashboard
- **Intermediate Stops** - Display route stops across all views

---

## Core Features

### Authentication & Users
- Multi-role system (Customer, Company Admin, Super Admin, Staff: Driver/Conductor/Ticketer)
- NextAuth.js session management, role-based access control
- Guest users (SMS-only, no password required)
- Password reset via OTP

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
- Comprehensive Terms & Conditions (19 sections)
- Privacy Policy (18 sections, GDPR-style)
- FAQ (45+ questions, 7 categories)
- Support ticket system (6 categories, 4 priority levels)

---

## Technical Architecture

### Database Models
- **User** - Auth, profile, roles (`staffRole`, `licenseNumber`, `employeeId`, `isGuestUser`)
- **Company** - Details, status, report signatures (`preparedBy`, `reviewedBy`, `approvedBy`)
- **Trip** - Route, schedule, pricing, staff assignments, vehicle assignment, control flags (`bookingHalted`, `lowSlotAlertSent`, `adminResumedFromAutoHalt`, `vehicleId`)
- **Vehicle** - Fleet management with Ethiopian dual identification (`plateNumber`, `sideNumber`), specs (`make`, `model`, `year`, `busType`, `totalSeats`), status tracking (`ACTIVE`, `MAINTENANCE`, `INACTIVE`), compliance (`registrationExpiry`, `insuranceExpiry`)
- **Booking** - Status, payment tracking (`isQuickTicket`)
- **Passenger** - Details, seat, pickup/dropoff
- **Ticket** - QR codes, short codes, verification status
- **Payment** - Transactions, commission (`initiatedVia`)
- **City** - Auto-populated from trips
- **AdminLog** - Audit trail
- **SupportTicket** - Customer support
- **SmsSession** - SMS bot state tracking

### Key API Endpoints

**Public**: `/api/trips`, `/api/track/[code]`, `/api/tickets/verify/public`, `/api/support/tickets`

**Customer**: `/api/bookings`, `/api/payments`, `/api/user/*`

**Company**: `/api/company/trips`, `/api/company/staff`, `/api/company/vehicles`, `/api/company/vehicles/[vehicleId]`, `/api/company/trips/[id]/toggle-booking`, `/api/company/trips/[id]/manual-ticket`, `/api/company/trips/[id]/manifest`

**Staff**: `/api/staff/my-trips`

**Admin**: `/api/admin/stats`, `/api/admin/companies`, `/api/admin/audit-logs`, `/api/admin/analytics/*`, `/api/admin/reports/platform-revenue`, `/api/admin/support/tickets`

**SMS**: `/api/sms/incoming`, `/api/sms/outgoing`, `/api/payments/telebirr/callback`

**Cron**: `/api/cron/cleanup` (SMS session cleanup)

### Frontend Routes
- `/(auth)` - Login, Register, Password Reset
- `/(customer)` - Search, Booking, Tickets, Profile, Track
- `/(company)` - Dashboard, Trips, Staff, Vehicles, Reports, Profile, Verification
- `/(staff)` - My Trips
- `/(admin)` - Dashboard, Companies, Audit Logs, Support Tickets
- `/contact`, `/track/[code]`, `/terms`, `/privacy`, `/faq`

### Key Libraries
- **Reports**: `src/lib/report-generator.ts`, `src/lib/platform-revenue-report.ts`
- **SMS**: `src/lib/sms/bot.ts`, `src/lib/sms/gateway.ts`, `src/lib/sms/messages.ts`
- **Payments**: `src/lib/payments/telebirr.ts`
- **Utils**: `src/lib/rate-limit.ts`, `src/lib/validations.ts`, `src/lib/auth-helpers.ts`

### Security Features
- Zod validation on all inputs
- Rate limiting (staff: 10/hr, tickets: 5/hr, SMS: per-phone)
- Password hashing (bcrypt)
- Role-based authorization
- Input sanitization (SQL injection, XSS prevention)
- Payment signature verification (HMAC-SHA256)

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

**Built with assistance from Claude AI (Anthropic)**
**Full session history available in CLAUDE-FULL-BACKUP.md**

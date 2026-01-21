# i-Ticket

AI-driven ticketing platform for Ethiopian long-distance bus companies with real-time slot management, TeleBirr payment integration, and QR code tickets.

## Features

### Core Features
- **Multi-role Support**: Customer, Company Admin, and Super Admin roles with role-based access control
- **Real-time Slot Management**: Auto-halt bookings at 10% capacity with admin notifications
- **Automatic Seat Assignment**: Smart seat allocation algorithm assigns seats automatically during booking
- **QR Code Tickets**: Secure tickets with fallback short codes for verification
- **Ticket Verification API**: Bus conductors can scan/verify tickets before boarding
- **TeleBirr Integration**: Ethiopian payment gateway (demo mode included)
- **PWA Support**: Works offline with installable mobile experience
- **5% Commission**: Automatic commission calculation on each booking (paid by customers)

### Security Features
- **Role-based Authentication**: Secure authentication with NextAuth.js
- **Authorization Middleware**: Protected API routes with ownership verification
- **Input Validation**: Comprehensive Zod schema validation on all API endpoints
- **Password Reset Flow**: Secure password reset with OTP via SMS
- **Error Boundaries**: Graceful error handling throughout the application

### User Features
- **Profile Management**: Users can update personal info, next of kin, and change passwords
- **Pagination**: All list views support pagination for better performance
- **Search Filters**: Advanced trip search with multiple filters

### Admin Features
- **Super Admin Dashboard**: System-wide statistics, revenue tracking, and company management
- **Company Management**: Activate/deactivate companies, view statistics
- **Audit Logs**: Track all system actions and changes

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL + Prisma ORM (with optimized indexes)
- **Auth**: NextAuth.js (credentials-based with role management)
- **Validation**: Zod for schema validation
- **QR Generation**: qrcode library
- **Password Hashing**: bcryptjs

## Quick Start

### Prerequisites

- Node.js 18+
- Docker Desktop (for PostgreSQL)

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Start PostgreSQL with Docker**:
   ```bash
   docker-compose up -d
   ```

3. **Setup database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Seed demo data**:
   ```bash
   npm run seed
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

6. **Open** http://localhost:3000

## Demo Accounts

| Role | Phone | Password |
|------|-------|----------|
| Customer | 0911234567 | demo123 |
| Company Admin (Selam Bus) | 0922345678 | demo123 |
| Super Admin | 0933456789 | admin123 |

## Environment Variables

Create a `.env.local` file:

```env
# Database
DATABASE_URL="postgresql://iticket:iticket123@localhost:5432/iticket"

# Auth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Demo Mode
NEXT_PUBLIC_DEMO_MODE="true"
```

## Project Structure

```
i-ticket/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (auth)/          # Login, Register pages
│   │   ├── (customer)/      # Search, Booking, Tickets
│   │   ├── (company)/       # Company dashboard
│   │   ├── (admin)/         # Admin dashboard
│   │   └── api/             # API routes
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── search/          # Trip search components
│   │   ├── booking/         # Booking flow components
│   │   └── shared/          # Navbar, Footer
│   └── lib/                 # Utilities (auth, db, etc.)
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Demo data seeder
├── docs/                    # Additional documentation
│   ├── business-logic/      # Technical specifications
│   ├── test-reports/        # Testing documentation
│   ├── guides/              # Implementation guides
│   ├── audits/              # Code audit reports
│   ├── presentations/       # Project presentations
│   └── design-assets/       # UI/UX mockups and assets
├── scripts/                 # Utility and test scripts
└── public/                  # Static assets, PWA manifest
```

## Key Routes

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Landing page with search | No |
| `/search` | Trip search results with pagination | No |
| `/booking/[tripId]` | Book a trip | Yes (Customer) |
| `/tickets` | My tickets | Yes (Customer) |
| `/profile` | User profile and password management | Yes (All roles) |
| `/payment/[bookingId]` | Payment page | Yes (Customer) |
| `/company/dashboard` | Company admin dashboard | Yes (Company Admin) |
| `/company/trips/new` | Create new trip | Yes (Company Admin) |
| `/admin/dashboard` | Super admin dashboard with system stats | Yes (Super Admin) |

## API Endpoints

### Public Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/trips` | GET | Search trips (with pagination & filters) |
| `/api/trips/[id]` | GET | Get trip details |
| `/api/auth/register` | POST | Register new user |
| `/api/auth/forgot-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Reset password with token |

### Protected Endpoints (Authentication Required)
| Endpoint | Method | Auth Level | Description |
|----------|--------|------------|-------------|
| `/api/trips` | POST | Company Admin | Create trip (validated & authorized) |
| `/api/trips/[id]` | PATCH | Company Admin | Update own company's trip |
| `/api/bookings` | POST | Customer | Create booking (with auto seat assignment) |
| `/api/bookings` | GET | Customer | Get user's bookings |
| `/api/bookings/[id]` | GET | Owner/Admin | Get booking details |
| `/api/bookings/[id]` | PATCH | Owner/Admin | Cancel booking |
| `/api/payments` | POST | Customer | Process payment |
| `/api/tickets/verify` | POST | Company Admin | Verify ticket by code |
| `/api/tickets/verify` | PATCH | Company Admin | Mark ticket as used |
| `/api/user/profile` | GET | All | Get user profile |
| `/api/user/profile` | PATCH | All | Update profile |
| `/api/user/change-password` | POST | All | Change password |
| `/api/admin/stats` | GET | Super Admin | Get system statistics |
| `/api/admin/companies` | GET | Super Admin | Get all companies |
| `/api/admin/companies` | PATCH | Super Admin | Toggle company status |
| `/api/company/stats` | GET | Company Admin | Get company statistics |

## Business Logic

### Commission Model
- 5% commission on each ticket sale (paid by customers)
- Customer pays: `ticketPrice + (ticketPrice * 0.05)`
- Commission tracked separately for platform revenue calculation

### Seat Assignment
- Automatic seat assignment during booking creation
- Seats assigned sequentially from 1 to totalSlots
- Algorithm prevents duplicate seat assignments
- Seats released when booking is cancelled

### Slot Management
- When available slots reach 10% of total capacity:
  - System sends alert to Company Admin (logged in AdminLog)
  - Online booking automatically halts (`bookingHalted = true`)
  - Admin can choose to continue or stop booking via company dashboard
- Alert sent only once per trip (tracked via `lowSlotAlertSent` flag)

### QR Tickets
- Generated after successful payment
- Contains: ticketId, tripId, passengerName, seatNumber
- 6-character alphanumeric fallback code (uppercase, no ambiguous chars)
- Bus conductor verifies via `/api/tickets/verify` POST endpoint
- Verification checks:
  - Ticket exists and belongs to conductor's company
  - Booking is paid
  - Ticket not already used
  - Trip date is today or in future
- Mark as used via `/api/tickets/verify` PATCH endpoint

### Password Reset
- User requests reset with phone number
- System generates 6-digit OTP (15-minute expiry)
- OTP sent via SMS (console log in demo mode)
- User submits OTP + new password to reset

### Validation & Security
- All API inputs validated with Zod schemas
- Phone numbers must match Ethiopian format: `09XXXXXXXX`
- Passwords: 6-72 characters (bcrypt limit)
- Future departure dates only
- Price/amount range validation
- Ownership verification on all update operations

## Database Optimizations

### Indexes Added for Performance
- **Trip**: Composite index on `(origin, destination, departureTime)`
- **Trip**: Index on `departureTime` for date-based queries
- **Trip**: Index on `companyId` for company-specific queries
- **Booking**: Composite index on `(userId, status)` for user bookings
- **Booking**: Index on `tripId` for trip bookings
- **Passenger**: Index on `bookingId` for booking passengers
- **Ticket**: Index on `tripId` for trip tickets
- **Ticket**: Index on `shortCode` for fast verification lookups

### Database Schema Notes
- PostgreSQL database with full ACID compliance
- Cascade deletes configured for dependent records (Passenger, Ticket, Payment)
- Unique constraint on `Ticket.shortCode` prevents duplicates
- All timestamps use `@default(now())` and `@updatedAt`

## Error Handling

- Global error boundary (`global-error.tsx`) catches all unhandled errors
- Route-level error boundaries (`error.tsx`) for graceful degradation
- API errors return consistent JSON format with appropriate HTTP status codes
- Client-side validation before API calls
- Toast notifications for user feedback (success/error messages)

## Color Theme

Custom Ethiopian-inspired teal palette:
- Primary: `#018790` (Teal)
- Dark: `#005461`
- Light: `#00B7B5`
- Background: `#F4F4F4`

## Recent Updates

### v1.2.0 - Intermediate Stops & Route Display

**New Features:**
- **Intermediate Stops Display**: Trips with intermediate stops now show the full route information
  - Visible in search results (e.g., "via Gohatsion, Dejen")
  - Displayed below duration in trip timeline for easy visibility
  - Shows in booking page and company trip details
- **Smart Route Parsing**: Supports both JSON intermediate stops and route string formats
- **Enhanced Trip Creation**: Companies can add multiple intermediate stops when creating trips
- **Dynamic City Database**: Cities automatically added to database when used in trip routes

### v1.1.0 - Security & Feature Enhancements

**Security Fixes:**
- Added authentication to trip creation/update APIs
- Fixed booking PATCH security flaw (ownership verification)
- Implemented comprehensive input validation with Zod
- Added authorization middleware helpers

**New Features:**
- Automatic seat assignment algorithm
- Ticket verification API for bus conductors
- Super admin dashboard with system statistics
- User profile management page
- Password reset flow with OTP
- Pagination on trip search results

**Performance Improvements:**
- Database indexes for frequently queried fields
- Optimized queries with proper relations
- Pagination reduces data transfer

**Developer Experience:**
- Reusable auth helper functions
- Centralized validation schemas
- Error boundaries for better UX
- TypeScript strict mode enabled

## License

MIT

---

Built with love by Ethiopian entrepreneurs

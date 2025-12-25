# i-Ticket

AI-driven ticketing platform for Ethiopian long-distance bus companies with real-time slot management, TeleBirr payment integration, and QR code tickets.

## Features

- **Multi-role Support**: Customer, Company Admin, and Super Admin roles
- **Real-time Slot Management**: Auto-halt bookings at 10% capacity with admin notifications
- **QR Code Tickets**: Secure tickets with fallback short codes for verification
- **TeleBirr Integration**: Ethiopian payment gateway (demo mode included)
- **PWA Support**: Works offline with installable mobile experience
- **5% Commission**: Automatic commission calculation on each booking

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React 18
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (credentials-based)
- **QR Generation**: qrcode library

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
└── public/                  # Static assets, PWA manifest
```

## Key Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with search |
| `/search` | Trip search results |
| `/booking/[tripId]` | Book a trip |
| `/tickets` | My tickets |
| `/company/dashboard` | Company admin dashboard |
| `/admin/dashboard` | Super admin dashboard |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/trips` | GET | Search trips |
| `/api/trips` | POST | Create trip (Company Admin) |
| `/api/bookings` | POST | Create booking |
| `/api/bookings/[id]` | GET | Get booking details |
| `/api/auth/register` | POST | Register new user |

## Business Logic

### Commission Model
- 5% commission on each ticket sale
- Commission calculated: `ticketPrice * 0.05`

### Slot Management
- When available slots reach 10% of total capacity:
  - System sends alert to Company Admin
  - Online booking automatically halts
  - Admin can choose to continue or stop booking

### QR Tickets
- Contains: ticketId, tripId, passengerName, seatNumber
- 6-character fallback code for manual verification
- Bus conductor verifies via `/api/tickets/verify`

## Color Theme

Custom Ethiopian-inspired teal palette:
- Primary: `#018790` (Teal)
- Dark: `#005461`
- Light: `#00B7B5`
- Background: `#F4F4F4`

## License

MIT

---

Built with love by Ethiopian entrepreneurs

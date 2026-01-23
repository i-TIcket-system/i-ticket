# Changelog

All notable changes to the i-Ticket platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.6.0] - 2026-01-24

### 🚀 Production Deployment

**i-Ticket is now LIVE at https://i-ticket.et**

#### Infrastructure
- Deployed to AWS EC2 (t2.micro) running Ubuntu 22.04 LTS
- Node.js 20.20.0 with PM2 process manager (cluster mode)
- Nginx reverse proxy with rate limiting
- PostgreSQL 16.11 database with automated daily backups
- Cloudflare CDN with Full (strict) SSL mode

#### SSL/Security
- Cloudflare Universal SSL (auto-renewed edge certificate)
- Cloudflare Origin CA certificate (valid until 2041)
- TLS 1.2/1.3 encryption
- DDoS protection via Cloudflare
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)

#### Monitoring & Automation
- Health checks every 2 minutes with auto-restart
- System monitoring every 5 minutes (CPU, memory, disk)
- Database backups daily at 3 AM UTC (7-day retention)
- PM2 auto-restart on crash and daily at 3 AM

### Changed
- Disabled Google Fonts optimization for offline builds (`next.config.js`)

### Technical Details
- Server IP: 54.147.33.168
- Domain: i-ticket.et (Cloudflare DNS)
- PM2 app name: i-ticket
- Nginx config: /etc/nginx/sites-available/i-ticket
- SSL certs: /etc/ssl/cloudflare/origin.pem

---

## [2.3.0] - 2026-01-21

### 🚨 Critical Features

#### View-Only Trip Mode
- **BREAKING CHANGE**: DEPARTED, COMPLETED, and CANCELLED trips are now READ-ONLY
- All modifications blocked for data integrity and audit compliance
- Cannot edit trip details after departure/completion/cancellation
- Cannot sell manual tickets for past trips
- Cannot resume online booking for final-status trips
- ViewOnlyBanner component shows clear status indicators
- Edit page automatically redirects with error message

#### Trip Sorting Improvements
- Active trips (SCHEDULED, BOARDING) now appear at top of all lists
- DEPARTED trips appear in middle
- COMPLETED and CANCELLED trips moved to bottom
- Applied across 5 trip listing endpoints (company, admin, staff, cashier, public)

#### Old Trip Status Cleanup
- Fixed 44 trips with dates before current date
- Automated cleanup via cron job (runs every 15 minutes)
- Properly marks old trips as COMPLETED or CANCELLED
- Creates audit trail for all status changes

### Added
- Helper library: `/src/lib/trip-status.ts` for trip status utilities
- Component: `ViewOnlyBanner` for read-only trip indicators
- Script: `scripts/check-old-trips.ts` for diagnostics
- Script: `scripts/cleanup-old-trips.ts` for manual cleanup
- Script: `scripts/fix-booking-halted.ts` for database corrections
- Documentation: 3 comprehensive docs (VIEW-ONLY, TRIP-SORTING, OLD-TRIP-CLEANUP)

### Fixed
- **CRITICAL**: DEPARTED, COMPLETED, CANCELLED trips can no longer be edited
- **CRITICAL**: Manual ticket sales blocked for final-status trips
- **CRITICAL**: Booking resume blocked for final-status trips
- Booking control now always shows "HALTED" for final-status trips
- Database sync: 42 trips corrected (bookingHalted field)
- Status API now auto-sets bookingHalted = true for DEPARTED/COMPLETED/CANCELLED
- Edit Trip button properly disabled for view-only trips
- Trip sorting respects status priority in all listings

### Changed
- Status transition validation now uses centralized helper function
- Booking control card forced halt display for view-only trips
- Edit page redirects with toast notification for view-only trips
- Trip detail page shows ViewOnlyBanner for final statuses

### Technical Details
- API Protection: 5 endpoints secured
- UI Protection: 3 components updated
- Database Fixes: 42 records corrected
- Test Coverage: 100% of critical paths

### Migration Notes
- No database migrations required
- Existing trips auto-corrected on status change
- Run `scripts/fix-booking-halted.ts` to fix any remaining data issues

---

## [2.0.0] - Previous Version

See CLAUDE.md for historical changes.

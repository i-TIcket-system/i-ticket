# i-Ticket — The Complete Bus Operations Platform
## Sales Presentation for Bus Companies

> **Platform**: https://i-ticket.et | **Telegram**: https://t.me/i_ticket_busBot
> **Version**: v2.14.0 | **Date**: February 2026
> **Contact**: +251 911 550 001 / +251 911 178 577

---

## What Is i-Ticket?

i-Ticket is Ethiopia's only **all-in-one** bus operations platform. It's not just a ticketing system — it covers everything from the moment a passenger searches for a trip to the moment the bus returns to the station.

**One platform. Every operation. Zero gaps.**

| Traditional Approach | With i-Ticket |
|---------------------|---------------|
| One tool for ticketing | Everything in one platform |
| Paper manifests | Digital manifests with QR verification |
| Call drivers to ask location | Live GPS map for everyone |
| React to breakdowns | AI predicts breakdowns before they happen |
| Lengthy manual file compilation | Real-time dashboards and one-click Excel reports |
| Manual record keeping | Automated audit trail |

---

## Feature Groups at a Glance

| # | Group | For Whom | One-Line Value |
|---|-------|----------|----------------|
| 1 | **Sell More Tickets** | Passengers & Revenue | Reach customers where they are — web, Telegram, phone |
| 2 | **Run Smoother Operations** | Operations Team | Create trips in seconds, not minutes |
| 3 | **Track Every Bus Live** | Passengers, Dispatch & Management | Know where every bus is, in real time |
| 4 | **Board & Account for Every Passenger** | Station Staff & Compliance | No-shows, replacements, manifests — all digital |
| 5 | **Protect Your Fleet** | Fleet & Maintenance Team | Predict breakdowns before they happen |
| 6 | **Protect Your Revenue** | Finance & Management | Automated safeguards against lost revenue |
| 7 | **Works Your Way** | Decision Makers | Use standalone or alongside your current system |

---

---

## GROUP 1: SELL MORE TICKETS
### *"Reach passengers where they are — and make buying effortless"*

---

### 1.1 Guest Booking — No Registration, No Barrier

The biggest reason Ethiopian passengers don't book online: **"I don't want to create an account."**

i-Ticket removes that barrier completely:
1. Search for a trip on the website
2. Select your seats
3. Pay with TeleBirr
4. Receive your ticket via SMS

**No account. No email. No OTP. No password.** The phone payment itself is the verification.

> Every bus company that enables guest booking immediately reaches the large segment of travelers who would never create an account.

---

### 1.2 Telegram Bot — Booking in Amharic

A full booking experience through **Telegram** — the messaging app used by 60+ million Ethiopians.

Passengers chat with **@i_ticket_busBot** in English or Amharic:
- Search trips by city name (handles typos and misspellings)
- See available seats and prices
- Select seats and enter passenger details
- Pay via TeleBirr
- Receive tickets with QR codes directly in the chat
- Track their bus with `/whereismybus`

**No app download required. No website visit needed.** Just open Telegram and type `/book`.

---

### 1.3 TeleBirr Payment — Trusted & Familiar

| Feature | Detail |
|---------|--------|
| **Users** | 50M+ TeleBirr users in Ethiopia |
| **Payment window** | 10 minutes — unpaid bookings auto-cancel, seats release |
| **Customer fee** | None — TeleBirr transaction fee is absorbed by i-Ticket |
| **Security** | Server-side amount calculation, replay protection |
| **Confirmation** | Instant SMS with ticket details and short code |

Passengers pay the way they already trust. No new payment method to learn.

---

### 1.4 Visual Seat Selection

Passengers see a **map of the bus** with color-coded seats:
- **Green** = Available
- **Red** = Already booked
- **Blue** = Your selection

Pick a window seat, a front seat, or auto-assign — the choice is theirs.

**Seat preference matters** in Ethiopian bus travel. This feature alone drives higher booking conversion.

---

### 1.5 Multi-Passenger Booking

Book up to **5 passengers** in one transaction:
- Family groups with adults and children
- Each passenger gets their own seat, ticket, and QR code
- Children don't need phone numbers or IDs
- **One payment covers everyone**

Perfect for Ethiopian family travel patterns.

---

### 1.6 Three Booking Channels, One Seat Pool

| Channel | How It Works |
|---------|-------------|
| **Website** | Passengers book at i-ticket.et |
| **Telegram** | Passengers book via @i_ticket_busBot |
| **Counter/Manual** | Staff sells tickets from the cashier portal |

All three channels draw from the **same seat pool in real time**. No double-booking, no confusion, no manual reconciliation.

---

---

## GROUP 2: RUN SMOOTHER OPERATIONS
### *"Your operations team will save hours every single day"*

---

### 2.1 Trip Templates — Create a Trip in 10 Seconds

Save your most common routes as **reusable templates** with:
- Prices and durations pre-set
- Bus type and amenities pre-configured
- Intermediate stops pre-defined
- Default pickup/dropoff terminals

To create a trip: **select template → pick date and time → done**. Templates are sorted by most-used, so the top route is always one click away.

---

### 2.2 Batch Trip Creation

Create up to **10 trips at once** across multiple dates:
- **"Same time every day"** — select 5 dates, one departure time, 5 trips created
- **"Custom time per date"** — different times for different days
- **Return trips** — automatically swaps origin/destination and reverses stops

**Example**: Monday to Friday, Addis→Hawassa + Hawassa→Addis = **10 trips, one action**.

---

### 2.3 CSV/Excel Schedule Import

Have existing schedules in spreadsheets? Import up to **50 trips** at once:
- Smart column auto-detection (fuzzy-matches your headers)
- Row-by-row validation before import
- Conflict checking for staff and vehicle overlaps
- Downloadable template to get started

**Zero manual re-entry** when switching to i-Ticket.

---

### 2.4 Trip Status Lifecycle — Nothing Falls Through the Cracks

Every trip moves through clear stages with **automatic transitions**:

```
SCHEDULED → DELAYED → BOARDING → DEPARTED → COMPLETED
                                            ↘ CANCELLED
```

| What Happens | Automatic Response |
|--------------|-------------------|
| Trip is 30 min past departure | Auto-marks as DELAYED |
| 1+ hour past departure | Auto-marks as DEPARTED |
| Past arrival + 2 hour buffer | Auto-marks as COMPLETED |
| Trip departs | Halts online booking, generates manifest, staff set to ON_TRIP |
| Trip completes | GPS deactivates, staff reset to AVAILABLE |

**No trip is ever left in limbo. No manual status updates forgotten.**

---

### 2.5 Intermediate Stops — How Ethiopian Buses Actually Work

Every trip can define stops along the way:

```
Addis Ababa → Mojo → Ziway → Shashemene → Hawassa
```

- Displayed in search results and booking pages
- Used for GPS ETA calculation between stops
- Passengers select pickup/dropoff per stop
- Return trips auto-reverse the stop order

This models the **actual Ethiopian bus experience** — passengers board and alight at intermediate towns.

---

### 2.6 Complete Staff Management

Manage your entire workforce from one dashboard:

| Staff Role | What They Can Do |
|------------|-----------------|
| **Drivers** | Assigned to trips, GPS tracking, trip logs |
| **Conductors** | Assigned to trips, boarding management |
| **Cashiers** | Sell tickets, record manual sales, process replacements |
| **Mechanics** | Vehicle inspections, work order completion |
| **Finance** | Revenue reports, commission tracking |

Each role sees **only what they need** — no clutter, no confusion, no unauthorized access.

---

---

## GROUP 3: TRACK EVERY BUS LIVE
### *"Know where every bus is — and let your passengers know too"*

---

### 3.1 Driver GPS Tracking — No Installation Needed

The driver opens a page on their phone. That's it. GPS starts sending the bus location every **10 seconds**.

- Works on **any smartphone** with a browser
- No app download, no special hardware
- Three-layer reliability: Wake Lock + Audio Keep-Alive + Heartbeat Watchdog
- Works even when the screen is locked

For phones with aggressive battery optimization, **OsmAnd backup tracking** is available — a free GPS app that works with the screen completely off.

---

### 3.2 Passenger Live Map — "Where Is My Bus?"

Every passenger with a ticket can **watch their bus move on a map** in real time:

| Feature | Detail |
|---------|--------|
| **Updates** | Every 12 seconds |
| **Map** | Interactive with road route overlay |
| **GPS trail** | Shows where the bus has been |
| **Speed** | Current speed displayed |
| **ETA** | Estimated arrival with countdown |
| **Access** | No login needed — just enter ticket code |

Public tracking page: **i-ticket.et/track/TICKET-CODE**

> No other Ethiopian bus platform offers real-time passenger tracking.

---

### 3.3 Company Fleet Map — Your Dispatch Center

Operations managers see **all active buses on one map**:

- **15-second refresh** — positions stay current
- **Search** by plate number, route, or driver name
- **Filter** by status: Live / Stale / No GPS
- **Click any bus** to zoom in and see route details
- **"Fit All"** button zooms out to show your entire fleet

This is a **live dispatch center** — see your entire operation at a glance.

---

### 3.4 Telegram Bus Tracking

Passengers type `/whereismybus` in Telegram and instantly see:
- Bus location and status
- Current speed
- Estimated arrival time
- **"Track on Map"** button — opens the live map
- **"Show Location"** — sends a Telegram location pin (opens in Google Maps)

Every time a passenger shares the bus location, it's **free marketing** for your company.

---

### 3.5 Offline GPS — Zero Data Loss

When the bus enters an area with no cellular signal (tunnels, rural zones):
- Up to **1,000 GPS positions** are stored on the driver's phone
- Covers approximately **2 hours 46 minutes** of travel
- When signal returns, all positions **flush automatically**
- The GPS trail on the map fills in retroactively

**No data is ever lost**, even in Ethiopia's connectivity gaps.

---

---

## GROUP 4: BOARD & ACCOUNT FOR EVERY PASSENGER
### *"From boarding to no-shows — every passenger is tracked"*

---

### 4.1 Digital Manifests — Auto-Generated

When a trip departs, the system automatically generates a **passenger manifest** listing:
- Every passenger name, phone, and seat number
- Booking source (online, Telegram, manual, walk-in)
- Boarding status (Pending, Boarded, No-Show, Replacement)
- Summary counts at the bottom

Exportable to **Excel** with one click. No more handwritten lists.

---

### 4.2 QR Code Ticket Verification

Every ticket has a unique **QR code**. At the station:
1. Staff scans the QR code with any phone camera
2. System instantly shows: passenger name, seat, trip, payment status
3. Passenger is marked as **BOARDED**
4. Duplicate scans are caught — prevents ticket re-use

**Fast, secure, and impossible to forge.**

---

### 4.3 No-Show Management

After a trip departs, staff can mark passengers who didn't board as **NO-SHOW**:

| Rule | Why |
|------|-----|
| Only allowed after DEPARTED status | Intermediate stops mean passengers may board later |
| Already-scanned tickets can't be marked | Prevents marking boarded passengers |
| Idempotent — re-marking is a no-op | Staff can't accidentally double-count |
| Full audit trail | Every no-show action is logged |

No-show data builds a historical record that helps predict future no-show patterns.

---

### 4.4 Replacement Ticket Sales — Recover Lost Revenue

When passengers don't show up, those seats can be **resold at the station**:

| Feature | Detail |
|---------|--------|
| **Who can sell** | Staff and cashiers only (not online) |
| **Payment** | Cash only |
| **Price** | Same full ticket price |
| **Seat** | Auto-assigned from no-show seats |
| **QR code** | Generated instantly |
| **Boarding status** | Replacement passengers marked as BOARDED immediately |

**Revenue that would have been lost is recovered.** Every replacement sale is tracked with a full audit trail linking it to the original no-show.

---

### 4.5 Boarding Summary Dashboard

The trip detail page shows a real-time boarding summary:

| Metric | Example |
|--------|---------|
| Total Passengers | 47 |
| Boarded | 42 |
| No-Shows | 5 |
| Replacements Sold | 3 |
| Released Seats | 2 (available for replacement) |

Color-coded in the manifest: **Green** = Boarded, **Red** = No-Show, **Blue** = Replacement.

---

---

## GROUP 5: PROTECT YOUR FLEET
### *"Know which bus will break down — before it does"*

---

### 5.1 AI-Powered Risk Scoring (0-100)

Every vehicle in your fleet gets a **real-time risk score** calculated from:

| Factor | What It Measures |
|--------|------------------|
| **Odometer vs service interval** | How far past or close to scheduled service |
| **Time since last service** | Days since last maintenance |
| **Defect trend** | Are inspections finding more defects over time? |
| **Fuel efficiency** | Is fuel economy getting worse? |
| **Compliance expiry** | Registration/insurance expiry dates |

| Score | Meaning | What Happens |
|-------|---------|-------------|
| 0-39 | Low risk | Normal operation |
| 40-59 | Medium | Schedule maintenance soon |
| 60-79 | High | Maintenance required |
| 80-100 | Critical | **Trip departure blocked** until inspected |

> Predictive maintenance delivers **300-500% ROI** across the transport industry.

---

### 5.2 Pre-Trip Safety Gate

Before a bus departs, the system checks its risk score:

- **Below 70**: Green light — no warnings
- **70-84**: Orange warning — admin sees alert, can proceed
- **85 or above**: **Departure blocked** unless a PRE_TRIP inspection was completed within 24 hours

This prevents the worst scenario: **a bus breaking down mid-trip with a full load of passengers**.

---

### 5.3 Vehicle Inspections & Work Orders

**Inspections** (PRE_TRIP, POST_TRIP, PERIODIC):
- Tracked with defect counts and severity
- Inspection history feeds into the risk scoring algorithm
- PASS / PASS_WITH_DEFECTS / FAIL status

**Work Orders** (auto-generated when maintenance is due):
- Labor cost, parts cost, and total tracked
- Assigned to specific mechanics
- Status flow: OPEN → IN_PROGRESS → COMPLETED
- Daily check at 2 AM catches upcoming maintenance

---

### 5.4 Fleet Health Dashboard

One screen shows the health of your **entire fleet**:
- Overall fleet health gauge (0-100)
- Risk distribution chart — how many buses at each level
- High-risk vehicle list with specific warnings
- Trend chart — is your fleet getting healthier or worse?
- Vehicle-by-vehicle comparison

---

### 5.5 Reports with Excel Export

| Report | What It Shows |
|--------|--------------|
| **Maintenance Costs** | Spending by vehicle, task type, time period |
| **Vehicle TCO** | Purchase price + all maintenance + fuel = true cost per bus |
| **Downtime** | Time each vehicle was out of service and why |
| **Fleet Analytics** | Comprehensive fleet-wide performance metrics |
| **Route Wear** | Which routes cause the most vehicle wear |

All exportable to **Excel** with one click.

---

---

## GROUP 6: PROTECT YOUR REVENUE
### *"Automated safeguards that prevent lost money"*

---

### 6.1 Auto-Halt — Reserve Seats for Walk-Ins

When online seats drop to a threshold (default: **10 remaining**), online booking **automatically pauses** — reserving the remaining seats for walk-in and counter sales.

| Control Level | What It Does |
|---------------|-------------|
| **Automatic** | Pauses online at threshold |
| **One-time resume** | Admin opens online for a specific trip |
| **Per-trip bypass** | Disable auto-halt for specific trips |
| **Company-wide** | Turn off auto-halt entirely |

**Manual/counter sales are NEVER blocked** — even at zero seats, your cashier can always sell.

---

### 6.2 24-Hour Staff & Vehicle Validation

Before any trip is created, the system checks all trips within **24 hours** for conflicts:
- Same **driver** assigned to overlapping trips
- Same **conductor** double-booked
- Same **vehicle** without adequate turnaround time

Returns **specific conflict details**: which person, which trip, when. Admin can override with a documented reason.

**No more accidental double-assignments that lead to last-minute scrambles.**

---

### 6.3 Zero Overselling — Guaranteed

When two people try to book the last seat at the exact same moment:

| Protection | How It Works |
|-----------|-------------|
| **Database locking** | Only one booking wins the last seat |
| **10-second timeout** | Prevents transactions from hanging |
| **Duplicate detection** | Back-button resubmission blocked |
| **Rate limiting** | Prevents automated booking abuse |

At scale, race conditions **will** happen. i-Ticket prevents every single one.

---

### 6.4 Price Change Alerts

If your team changes a trip's price while a customer is mid-booking:
- Customer is **immediately notified**
- Must accept the new price before continuing
- Prevents disputes: "I thought it was 850 ETB!"

Checks every **30 seconds** during the booking process.

---

### 6.5 10-Minute Payment Window

After selecting seats, the passenger has **10 minutes** to complete payment. If they don't pay:
- Booking auto-cancels
- Seats release back to the pool
- No manual intervention needed

**No seats are held hostage** by abandoned bookings.

---

---

## GROUP 7: WORKS YOUR WAY
### *"Use it standalone, or alongside your current system — your choice"*

---

### 7.1 Three Deployment Options

i-Ticket adapts to **your situation**, not the other way around:

| Option | How It Works | Best For |
|--------|-------------|----------|
| **Standalone** | i-Ticket handles everything — online sales, counter sales, GPS, fleet, manifests | Companies starting fresh or replacing an old system |
| **Parallel** | i-Ticket runs alongside your current system — adds online/Telegram booking as a new channel | Companies with an existing ticketing process |
| **Complementary** | Use i-Ticket only for GPS tracking and fleet management — keep your current ticketing | Companies that only want tracking and maintenance |

In parallel mode, sales from your existing system are recorded as **manual tickets** in i-Ticket. The seat count stays accurate across both systems.

---

### 7.2 Complete Company Isolation

Every bus company on i-Ticket operates in a **completely separate environment**:

- Own dashboard, own data, own reports
- Own staff accounts and role permissions
- Own trip schedules and pricing
- Own financial records and commissions
- **No company can see another company's data**

The only shared resource is the city database — everything else is yours alone.

---

### 7.3 Security & Compliance

| Area | Protection |
|------|-----------|
| **Data isolation** | Every API call is filtered by company — no cross-company data leaks |
| **Encryption** | TLS 1.2+ with Cloudflare Full Strict SSL, HSTS preload |
| **Authentication** | bcrypt password hashing, 30-day sessions, brute force protection |
| **Payment** | Server-side calculation only — never trusts client values |
| **Audit trail** | Every action logged with timestamp, user, and details |
| **Compliance** | INSA security audit documentation prepared and submitted |
| **Infrastructure** | AWS cloud, PostgreSQL 16, 99.9% uptime, daily backups |

---

### 7.4 Bilingual — English & Amharic

The entire platform works in both languages:
- Website interface
- Telegram bot conversations
- SMS ticket confirmations
- Error messages and notifications

Your passengers interact in **the language they're comfortable with**.

---

### 7.5 Role-Based Portals — Everyone Sees What They Need

| Portal | Who Uses It | What They See |
|--------|------------|---------------|
| **Company Admin** | Management | Full dashboard, all operations, reports, analytics |
| **Staff** | Drivers, Conductors | Their assigned trips, GPS tracking, boarding |
| **Cashier** | Station ticket sellers | Ticket sales, manifest lookup, replacement tickets |
| **Mechanic** | Maintenance team | Work orders, inspections, vehicle status |
| **Finance** | Accounting | Revenue reports, commission tracking, tax reports |
| **Sales** | External agents | Their referrals, commission dashboard |

No training needed for each role — they only see what's relevant to them.

---

---

## WHY i-TICKET — THE SUMMARY

| # | Value | Impact |
|---|-------|--------|
| 1 | **More passengers** | Guest booking + Telegram reaches customers no other platform can |
| 2 | **Faster operations** | Trip templates and batch creation save hours every day |
| 3 | **Real-time visibility** | GPS tracking for passengers, dispatch, and management |
| 4 | **Full accountability** | Digital manifests, QR verification, no-show tracking |
| 5 | **Fewer breakdowns** | AI predicts maintenance needs — 25-40% cost reduction |
| 6 | **Revenue protection** | Auto-halt, payment windows, zero overselling |
| 7 | **Zero risk to adopt** | Works alongside existing systems — no disruption |

---

## PRICING — SIMPLE & TRANSPARENT

| Item | Cost |
|------|------|
| **Setup** | Free |
| **Monthly fee** | Free |
| **GPS tracking** | Free |
| **Fleet management** | Free |
| **Telegram bot** | Free |
| **Reports & analytics** | Free |
| **Commission** | 5% on online/Telegram bookings only |
| **Manual/counter sales** | 0% — no commission |
| **TeleBirr fee** | Absorbed by i-Ticket — invisible to you and passengers |

**You only pay when i-Ticket brings you new revenue.** Everything else is included.

---

## READY TO SEE IT LIVE?

We'd love to give you a **personalized demo** with your own routes, vehicles, and schedules.

| | |
|---|---|
| **Website** | https://i-ticket.et |
| **Telegram Bot** | https://t.me/i_ticket_busBot |
| **Phone** | +251 911 550 001 / +251 911 178 577 |
| **Email** | info@i-ticket.et |

---

*i-Ticket Platform v2.14.0 | https://i-ticket.et | February 2026*

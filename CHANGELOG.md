# i-Ticket Changelog

> Complete version history for the i-Ticket platform.

---

## v2.10.15 - Feb 3, 2026

### Staff Status Auto-Sync & Management Improvements

**Feature 1: Staff Status Auto-Sync with Trip Status**
- Staff (driver/conductor) status now automatically syncs with trip lifecycle:
  - **DEPARTED trip** → Staff set to `ON_TRIP`
  - **COMPLETED trip** → Staff set to `AVAILABLE` (only if no other active trips)
- Respects `ON_LEAVE` status (never auto-changed)
- Admin can still manually override status at any time
- **File**: `src/app/api/cron/cleanup/route.ts`

**Feature 2: Status Filter on Staff Management Page**
- Added status filter dropdown (Available / On Trip / On Leave)
- Works alongside existing search and role filters
- Filter grid now 4-column layout on desktop
- "Clear filters" resets all three filters
- **File**: `src/app/company/staff/page.tsx`

**Maintenance: 24-Hour Conflict Cleanup (RULE-005)**
- Created one-time script to remove trips violating 24-hour resource rule
- Same driver/conductor/vehicle cannot be scheduled within 24 hours
- Cleaned up 205 conflicting trips from production
- **Script**: `scripts/cleanup-24hr-conflicts.ts`

**Maintenance: Staff Status Fix Script**
- Created one-time script to fix existing staff on DEPARTED trips
- Updated staff to `ON_TRIP` for 9 active trips
- **Script**: `scripts/fix-current-staff-status.ts`

### Files Modified
- `src/app/api/cron/cleanup/route.ts` - Added staff status sync to auto-departure and auto-completion
- `src/app/company/staff/page.tsx` - Added status filter dropdown
- `scripts/cleanup-24hr-conflicts.ts` - New cleanup script
- `scripts/fix-current-staff-status.ts` - New fix script

---

## v2.10.14 - Jan 31, 2026

### Trip Log Popup on Completion + Auto-Completion Safety Buffer

**Feature 1: End Odometer Popup on Trip Completion**
- When driver clicks "Complete Trip", auto-popup asks for end odometer/fuel readings
- Added `onCompleted` callback to `TripStatusControl` component
- Added `autoOpenEnd` prop to `TripLogCard` for auto-opening end readings dialog
- UI hints now show "You'll be asked to record end odometer after completing"
- **Files**: `TripStatusControl.tsx`, `TripLogCard.tsx`, `my-trips/page.tsx`

**Feature 2: Auto-Completion 2-Hour Safety Buffer**
- Trips now auto-complete 2 hours AFTER estimated arrival (not immediately)
- Accounts for traffic, delays, rest stops, etc.

**BUG FIX (CRITICAL): estimatedDuration Unit Error**
- **Bug**: Cron job treated `estimatedDuration` as HOURS when DB stores MINUTES
- **Impact**: A 360-minute (6hr) trip was being treated as 360 hours!
- **Fix**: Changed `trip.estimatedDuration * 60 * 60 * 1000` to `trip.estimatedDuration * 60 * 1000`
- Fixed in both auto-completion and very-old-trips cleanup logic
- **File**: `src/app/api/cron/cleanup/route.ts`

### Files Modified
- `src/components/trip/TripStatusControl.tsx` - Added `onCompleted` callback + UI hints
- `src/components/trip/TripLogCard.tsx` - Added `autoOpenEnd` prop + useEffect
- `src/app/staff/my-trips/page.tsx` - Wired up state and callbacks
- `src/app/api/cron/cleanup/route.ts` - Fixed duration bug + 2hr buffer

---

## v2.10.13 - Jan 30, 2026

### CSV Import Validation Fix

**ISSUE: CSV Import Shows "Valid" But Fails with 400 on Import**
- Validation preview showed "3 valid" trips but clicking Import failed with 400 Bad Request
- **Root Cause**: Validation API only checked data formats, not database entities (staff/vehicles) or 24-hour conflicts
- **Fix**: Added full database validation to the validate step:
  - Staff phone numbers checked against company's staff list
  - Vehicle plate numbers checked against company's fleet
  - 24-hour scheduling conflicts now checked during preview
  - Improved error display to handle ValidationError objects properly
- **Files**:
  - `src/app/api/company/trips/import/validate/route.ts` - Added conflict checking
  - `src/app/(company)/company/trips/import/page.tsx` - Fixed error message display

### Files Modified
- 2 files modified

---

## v2.10.12 - Jan 29, 2026

### Logo Refresh, Pagination & Docs Restructure (3 Issues)

**ISSUE 1: Company Logo Not Refreshing After Upload**
- Dashboard showed old logo after uploading new one (required manual refresh)
- **Root Cause**: `router.refresh()` didn't trigger full session reload
- **Fix**: Changed to `window.location.reload()` for immediate refresh
- **File**: `src/components/company/CompanyLogoUpload.tsx`

**ISSUE 2: Pagination for Long Lists**
- Company Trips and Vehicles pages loaded all items without pagination
- **Fix**: Added pagination with 20 items per page
- Server-side pagination support in trips API (`page`, `limit`, `skip` params)
- Client-side pagination UI with Previous/Next buttons
- **Files**: `src/app/api/company/trips/route.ts`, `src/app/company/trips/page.tsx`, `src/app/company/vehicles/page.tsx`

**ISSUE 3: Documentation Restructuring**
- CLAUDE.md was 804 lines (too long for quick reference)
- **Fix**: Moved full changelog to `CHANGELOG.md`, slimmed CLAUDE.md to ~285 lines
- **Files**: `CLAUDE.md`, `CHANGELOG.md` (new)

### Files Modified
- 6 files modified, 1 new file created

---

## v2.10.11 - Jan 29, 2026

### WO-Vehicle Health Sync & Sold-Out Trip Protection (2 Issues)

**ISSUE 1 (P0): Vehicle Health Dashboard WO Sync**
- Vehicle Health Dashboard showed "No active work orders" despite IN_PROGRESS WOs existing
- **Root Cause**: Frontend sent CSV format (`status=OPEN,IN_PROGRESS`) but API only accepts single enum values (Zod validation)
- **Fix**: Make two parallel API calls (OPEN + IN_PROGRESS) and combine results
- **File**: `src/components/maintenance/VehicleHealthDashboard.tsx`

**ISSUE 2 (P1): Sold-Out Trip Edit Protection**
- Users could edit trips with `availableSlots === 0`, risking booking integrity
- **Fix**: Trips with `availableSlots === 0` are now view-only
- Added `isTripSoldOut()` helper to `trip-status.ts`
- Updated `isTripViewOnly()` to accept optional `availableSlots` parameter
- API PUT returns 403 with "Cannot modify sold-out trips" message
- Edit buttons show "(Sold Out)" label instead of "(View-Only)"
- ViewOnlyBanner supports new "SOLD_OUT" status with orange styling
- Keyboard shortcuts (Ctrl+A) exclude sold-out trips from selection
- **Files**: 6 files modified

### Files Modified
- `src/components/maintenance/VehicleHealthDashboard.tsx` - Parallel API calls for WO status
- `src/lib/trip-status.ts` - Added `isTripSoldOut()`, updated `isTripViewOnly()`
- `src/app/api/company/trips/[tripId]/route.ts` - Sold-out check in PUT
- `src/app/company/trips/[tripId]/edit/page.tsx` - Redirect with sold-out message
- `src/app/company/trips/[tripId]/page.tsx` - Edit button disabled for sold-out
- `src/app/company/trips/page.tsx` - List edit button + keyboard shortcuts
- `src/components/company/ViewOnlyBanner.tsx` - SOLD_OUT status support

---

## v2.10.10 - Jan 29, 2026

### DELAYED Status, Cron Fix & Multi-Bug Fixes (8 Issues)

**ISSUE 1 (P0): Trip Status Cron Gap Fix**
- Trips >1 hour past departure were skipping DEPARTED status (jumping SCHEDULED → COMPLETED)
- **Root Cause**: `markTripsAsDeparted()` only caught trips within 1-hour window
- **Fix**: Removed time window restriction - now processes ALL past SCHEDULED/BOARDING trips
- **File**: `src/app/api/cron/cleanup/route.ts`

**ISSUE 2 (P1): DELAYED Trip Status**
- New trip status between SCHEDULED and BOARDING
- **Auto-trigger**: Cron marks trips as DELAYED after 30 minutes past departure time
- **Manual trigger**: "Mark as Delayed" button with reason selection in trip detail page
- **Delay Reasons**: Traffic, Breakdown, Weather, Waiting for passengers, Other
- **Bookings**: Still allowed while trip is DELAYED (not halted)
- **Schema**: Added `delayReason` and `delayedAt` fields to Trip model
- **Files**: `prisma/schema.prisma`, `src/app/api/cron/cleanup/route.ts`, `src/app/company/trips/[tripId]/page.tsx`, `src/app/api/company/trips/[tripId]/status/route.ts`, `src/lib/trip-status.ts`

**ISSUE 3 (P1): Audit Trail Badge Visibility**
- Badges were faded/invisible (default variant overriding colors)
- **Fix**: Added `variant="outline"` to Badge components
- **Files**: `src/app/company/audit-logs/page.tsx`, `src/app/admin/audit-logs/page.tsx`

**ISSUE 5 (P2): Mechanic/Finance Profile Pictures**
- Profile pics not visible when sidebar collapsed
- **Fix**: Added collapsed-state avatar display section
- **Files**: `src/app/mechanic/layout.tsx`, `src/app/finance/layout.tsx`

**ISSUE 6 (P2): Ticket Download Image Cleanup**
- Share/Download/Calendar buttons appeared in downloaded PNG (useless in static image)
- **Fix**: Added `data-download-hide` attribute and `ignoreElements` option to html2canvas
- **File**: `src/app/tickets/[bookingId]/page.tsx`

**ISSUE 7 (P2): Vehicle Health ↔ Work Orders Connection**
- Completing work orders didn't improve vehicle health
- **Fix**: On WO completion:
  - Updates `Vehicle.lastServiceDate`
  - Decrements `defectCount` for CORRECTIVE work orders
  - Decrements `criticalDefectCount` for high-priority CORRECTIVE WOs
  - Updates `MaintenanceSchedule.lastCompletedAt`, `nextDueDate`, `nextDueKm` if scheduleId exists
- **File**: `src/app/api/company/work-orders/[workOrderId]/route.ts`

**ISSUE 8 (P2): Excel Import Reload (Preserve Mappings)**
- Users couldn't reload edited Excel file without losing column mappings
- **Fix**: Added "Reload File" button that preserves mappings and re-validates
- **File**: `src/app/(company)/company/trips/import/page.tsx`

### Trip Status Lifecycle (Updated)
```
SCHEDULED → DELAYED → BOARDING → DEPARTED → COMPLETED
                 ↘ ↘        ↘        ↘
                  CANCELLED (from any active status)
```

### Files Modified
- 12 files modified
- Schema: 2 new fields on Trip model (`delayReason`, `delayedAt`)

---

## v2.10.9 - Jan 29, 2026

### Past Trips Filter, Company Logo & Import Retry (5 Fixes)

**ISSUE 1: EC2 Cron Jobs Not Running (P0 CRITICAL)**
- `vercel.json` cron config only works on Vercel, not AWS EC2
- **Root Cause**: Nothing was calling `/api/cron/cleanup` on EC2
- **Immediate Fix**: Manual cleanup - 18 trips COMPLETED, 106 trips CANCELLED
- **Permanent Fix**: Created system cron at `/etc/cron.d/i-ticket`:
  - Cleanup runs hourly (trip status, payment timeouts)
  - Trip reminders run hourly
  - Predictive maintenance runs daily at 2 AM EAT
- **Authentication**: Uses `CRON_SECRET` Bearer token

**ISSUE 2: Hide Past Trips by Default**
- Company trips list was showing old trips from days ago
- **Fix**: Added `hidePastTrips` state defaulting to `true`
- Added "Hide past trips" checkbox in filter bar
- Past trips filtered out when `departureTime < now`
- **File**: `src/app/company/trips/page.tsx`

**ISSUE 3: Company Logo Not Displayed**
- Logos uploaded but never shown in company admin sidebar
- **Fix (Session)**: Added `companyLogo` to:
  - `src/types/next-auth.d.ts` (Session, User, JWT interfaces)
  - `src/lib/auth.ts` (authorize, jwt, session callbacks)
- **Fix (Company Layout)**: Sidebar shows company logo when available
  - Falls back to i-Ticket branding if no logo
  - Works in both desktop sidebar and mobile header
- **Fix (Search Results)**: Customer search shows company logos
  - Added `logo` to company select in `/api/trips/route.ts`
  - Updated Trip interface in search page
- **Files**: 4 files modified
- **Note**: Staff layouts unchanged - they correctly show user profile pictures

**ISSUE 4: Excel Import Retry Button**
- After validation errors, users had to start completely over
- **Fix**: Added "Retry with New File" button in preview step
- Resets validation state but preserves column mappings
- **File**: `src/app/(company)/company/trips/import/page.tsx`

### Files Modified
- 7 source files modified
- 1 cron file created on EC2 (`/etc/cron.d/i-ticket`)

### EC2 Cron Setup Reference
```bash
# Cron file location
/etc/cron.d/i-ticket

# Manual trigger (with auth)
curl -H "Authorization: Bearer $CRON_SECRET" https://i-ticket.et/api/cron/cleanup

# Check cron status
sudo systemctl status cron
```

---

## v2.10.8 - Jan 28, 2026

### Notification Routing, Timezone & UI Fixes (5 Issues)

**P0 CRITICAL BUGS:**

**ISSUE 1: Notification Routing Fixes**
- Driver/Conductor WO notifications were routing to `/company/work-orders/{id}` - **WRONG**
- **Fix**: Now routes to `/staff/work-orders/{id}` for drivers/conductors
- Company Admin with `staffRole === "ADMIN"` now properly routes to company pages
- Finance WO notifications now route to detail page `/finance/work-orders/{id}` (was list page)
- Added missing WO types: `WORK_ORDER_PARTS_REQUESTED`, `WORK_ORDER_BLOCKED`, `WORK_ORDER_STATUS_CHANGED`, `WORK_ORDER_MESSAGE`
- **Files**: `src/components/notifications/NotificationBell.tsx`, `src/app/notifications/page.tsx`

**ISSUE 2: Trip Date Display Bug (Timezone)**
- `toDateString()` is NOT timezone-aware - caused Jan 29 trips to show as Jan 28
- **Root Cause**: JavaScript dates stored in UTC but compared using browser timezone
- **Fix**: Created timezone-aware utility functions in `src/lib/utils.ts`:
  - `ETHIOPIA_TIMEZONE = "Africa/Addis_Ababa"`
  - `getEthiopiaDateString(date)` - Returns YYYY-MM-DD in Ethiopia timezone
  - `isSameDayEthiopia(date1, date2)` - Compares dates in Ethiopia timezone
  - `isTodayEthiopia(date)` - Checks if date is today in Ethiopia timezone
- Applied to: staff my-trips, cashier, TripChat, trips API, PriceCalendar, Telegram bot
- **Files**: 7 files modified

**P1 IMPORTANT FIXES:**

**ISSUE 3: Profile Picture Upload Fix**
- Profile picture didn't display immediately after upload (required page refresh)
- **Fix**: Added `router.refresh()` after `updateSession()` for upload and remove
- **File**: `src/components/profile/ProfilePictureUpload.tsx`

**ISSUE 4: Remove Kebele/Passport ID Field**
- Removed ID input field from booking page and profile page
- Replaced with static note: "You'll need to show ID matching your name when boarding"
- Made `nationalId` truly optional in booking validation schema
- **Files**: `src/app/booking/[tripId]/page.tsx`, `src/app/profile/page.tsx`, `src/lib/validations.ts`

**ISSUE 5: WO Notifications for Driver/Conductor**
- Same as Issue 1 - now routes to `/staff/work-orders/{id}`

### Files Modified
- 13 files modified
- New utility functions: `getEthiopiaDateString`, `isSameDayEthiopia`, `isTodayEthiopia`

---

## v2.10.7 - Jan 28, 2026

### Work Order System & Trip Fixes (8 Issues)

**P0 CRITICAL BUGS:**

**ISSUE 1: Seat Selection Stale Closure Bug (Cashier/Admin)**
- Seat selection showed blue → green → lost selection during polling refresh
- **Root Cause**: Stale closure in polling interval captured `selectedSeats` at setup time
- **Fix**: Added `useRef` to always access current `selectedSeats` value
- **File**: `src/components/booking/SeatMap.tsx`

**ISSUE 2: Resume Button When 100% Full**
- Resume Online Booking button was active even when all seats sold out
- **Fix**: Disabled Resume button when `availableSlots === 0`, added "Sold Out" message
- **File**: `src/components/company/BookingControlCard.tsx`

**P1 IMPORTANT FIXES:**

**ISSUE 3: Real-time Work Order Status Updates**
- Detail pages now auto-refresh every 5 seconds (was 30s or none)
- List pages now auto-refresh every 30 seconds (was none)
- Only refreshes when page is visible and WO not completed/cancelled
- **Files**: 8 work order page files (company, staff, finance, mechanic - list & detail)

**ISSUE 4: Trip Auto-Depart Cron Transition**
- Trips now properly transition: SCHEDULED → DEPARTED → COMPLETED
- Added `markTripsAsDeparted()` function for trips within 1 hour of departure
- New audit log action: `TRIP_STATUS_AUTO_DEPARTED`
- **File**: `src/app/api/cron/cleanup/route.ts`

**P2 ENHANCEMENTS:**

**ISSUE 5: Excel Export - Parts in Separate Rows**
- Each part now gets its own row instead of combining in single cell
- First row shows WO details, subsequent rows show only part columns
- Added columns: Part Name, Part Qty, Part Unit Price, Part Total, Part Status
- **File**: `src/app/api/company/work-orders/export/route.ts`

**ISSUE 6: Status Filter in Export Dialog**
- Added explicit status dropdown to export dialog (All/Open/In Progress/Blocked/Completed/Cancelled)
- Export now uses dialog status instead of page filter
- **Files**: `src/app/company/work-orders/page.tsx`, `src/app/finance/work-orders/page.tsx`

### Files Modified
- 12 files modified
- Key patterns: `useRef` for stale closure, `setInterval` with visibility check

---

## v2.10.6 - Jan 28, 2026

### Work Order System - Bug Fixes & Enhancements (6 Issues + 1 Feature)

**ISSUE 1: Simplified Staff (Driver/Conductor) WO Detail View**
- REMOVED Cost Summary and Parts sections (not relevant for drivers/conductors)
- ADDED Team Communication section with ability to send messages
- Created new staff messages API endpoint
- **Files**: `src/app/staff/work-orders/[workOrderId]/page.tsx`, `src/app/api/staff/work-orders/[workOrderId]/messages/route.ts` (NEW)

**ISSUE 2: Parts Status Visibility for Finance + Notifications**
- Finance detail page now shows parts status badges (REQUESTED, APPROVED, REJECTED, ORDERED)
- Added finance notification when parts are marked as ORDERED
- **Files**: `src/app/finance/work-orders/[workOrderId]/page.tsx`, `src/app/api/company/work-orders/[workOrderId]/parts/[partId]/route.ts`

**ISSUE 3: View-Only Protection for COMPLETED Work Orders**
- Admin Edit button disabled for COMPLETED work orders (shows message)
- Mechanic status dropdown disabled for COMPLETED/CANCELLED work orders
- **Files**: `src/app/company/work-orders/[workOrderId]/page.tsx`, `src/app/mechanic/work-order/[workOrderId]/page.tsx`

**ISSUE 4: COMPLETED/CANCELLED Sort to Bottom**
- All work order list APIs now sort by status priority:
  - OPEN, IN_PROGRESS, BLOCKED → Top (sorted by priority then date)
  - COMPLETED, CANCELLED → Bottom
- **Files**: `src/app/api/company/work-orders/route.ts`, `src/app/api/mechanic/work-orders/route.ts`, `src/app/api/staff/work-orders/route.ts`, `src/app/api/finance/work-orders/route.ts`

**ISSUE 5: Auto-Refresh for Parts Status Updates**
- Mechanic and Finance work order detail pages auto-refresh every 30 seconds
- Only refreshes when page is visible and work order is not completed
- **Files**: `src/app/mechanic/work-order/[workOrderId]/page.tsx`, `src/app/finance/work-orders/[workOrderId]/page.tsx`

**FEATURE: Excel Export for Work Orders**
- New export API endpoint with date range filtering
- Export button added to Company Admin and Finance work orders pages
- Exports: WO#, Vehicle, Title, Type, Priority, Status, Assigned Staff, Costs, Parts, Dates
- Uses `xlsx` package for Excel generation
- **Files**: `src/app/api/company/work-orders/export/route.ts` (NEW), `src/app/company/work-orders/page.tsx`, `src/app/finance/work-orders/page.tsx`

### Files Modified
- 12 files modified, 2 new files created
- New dependency: `xlsx` package

---

## v2.10.5 - Jan 28, 2026

### Work Order System - Post-Deployment Bug Fixes (5 Issues)

Live testing after v2.10.4 deployment revealed 5 critical bugs preventing the work order system from functioning properly.

**BUG 1 (P0): Work Orders Not Showing in Admin Dashboard**
- Company admin dashboard showed "0 work orders" despite work orders existing
- **Root Cause**: Zod validation used `.optional()` for `status` and `workType` fields, but `searchParams.get()` returns `null` (not `undefined`). Zod's `.optional()` only handles `undefined`.
- **Fix**: Changed to `.nullish()` which handles both `null` and `undefined`
- **File**: `src/app/api/company/work-orders/route.ts`

**BUG 2 (P1): Finance Work Orders Tab Shows 0**
- Same root cause as BUG 1 - Zod validation failing on null values
- **Fix**: Added `.nullish()` to status, startDate, endDate validation
- **File**: `src/app/api/finance/work-orders/route.ts`

**BUG 3 (P2): Driver/Conductor Need Work Orders Tab**
- Drivers and conductors had no way to view work orders for vehicles they operate
- Clicking work order notifications routed them to wrong page (`/staff/my-trips`)
- **Fix**:
  - Added "Work Orders" link to staff sidebar for DRIVER/CONDUCTOR roles
  - Updated notification routing to `/staff/work-orders/{id}`
  - Created new staff work orders API (list + detail, read-only view)
  - Created new staff work orders pages
- **Files**: `src/app/staff/layout.tsx`, `src/app/notifications/page.tsx`
- **New Files**:
  - `src/app/api/staff/work-orders/route.ts`
  - `src/app/api/staff/work-orders/[workOrderId]/route.ts`
  - `src/app/staff/work-orders/page.tsx`
  - `src/app/staff/work-orders/[workOrderId]/page.tsx`

**BUG 4 (P1): Mechanic "Work Order Not Found" in Team Communication**
- Mechanic messages API only checked `assignedToId` but ignored `assignedStaffIds` (multi-staff assignments)
- **Fix**: Updated GET and POST handlers to check both legacy single assignment and new JSON array
- **File**: `src/app/api/mechanic/work-orders/[workOrderId]/messages/route.ts`

**BUG 5 (P1): Conductor Ticket Verification Shows Error After Success**
- Conductor verified ticket, saw success toast, then saw "Something went wrong!" error
- **Root Cause**: API returns `{ valid, ticket }` but UI expected `{ success, data: { ticket, passenger, trip, booking } }`
- **Fix**: Transform API response to match UI expected structure
- **File**: `src/app/staff/verify/page.tsx`

### Files Modified
- 7 files modified, 4 new files created

---

## v2.10.4 - Jan 28, 2026

### Work Order System - Comprehensive Remediation (21 Issues Fixed)

**ITERATION 1: Critical Bugs (7 Issues)**

1. **P0: Parts Approval Endpoint** - Created `PATCH /api/company/work-orders/[id]/parts/[partId]` for company admins to approve/reject mechanic part requests. Supports status transitions: REQUESTED → APPROVED/REJECTED/ORDERED. Auto-recalculates work order costs on approval.

2. **Parts Status Fields in All Endpoints** - Added status, notes, requestedBy, requestedAt, approvedBy, approvedAt fields to partsUsed select in:
   - `company/work-orders/route.ts` (list)
   - `company/work-orders/[id]/route.ts` (detail)
   - `finance/work-orders/route.ts` (finance view)

3. **Multi-Staff Update Support** - PATCH endpoint now accepts `assignedStaffIds` array for multi-staff assignments (backward compatible with `assignedMechanicId`)

4. **Auto-Set startedAt** - When status changes to IN_PROGRESS, `startedAt` is automatically set if not already set

5. **Status Transition Validation** - COMPLETED work orders cannot be cancelled (returns 400 error)

6. **AdminLog companyId** - Added companyId to AdminLog for:
   - UPDATE_WORK_ORDER
   - DELETE_WORK_ORDER
   - ADD_WORK_ORDER_PART
   - REMOVE_WORK_ORDER_PART
   - UPDATE_WORK_ORDER_PART (new)

**ITERATION 2: Security & Data Integrity (4 Issues)**

7. **Notification Stakeholders Filter** - Fixed `notifyWorkOrderStakeholders()` to include `staffRole: "ADMIN"` using OR condition (consistent with `notifyCompanyAdmins`)

8. **Finance Date Validation** - Added Zod validation for startDate/endDate query parameters (format: YYYY-MM-DD)

9. **Explicit APPROVED Status** - Admin-added parts now explicitly set `status: "APPROVED"` with approvedBy/approvedAt instead of relying on schema default

10. **Parts Cost Calculation** - Only APPROVED parts contribute to work order costs

**ITERATION 3: UX & Completeness (4 Issues)**

11. **Parts Approval UI** - Company admin detail page now shows:
    - Status badges for all parts (Pending Approval, Approved, Rejected, Ordered)
    - Approve/Reject buttons for REQUESTED parts
    - "Mark as Ordered" button for APPROVED parts
    - Yellow highlight border for pending parts

12. **Multi-Staff Display (List)** - Work orders list shows "Name (+1)" for multi-staff assignments and count of pending part requests

13. **Multi-Staff Display (Detail)** - Detail page shows full staff count "Name (+N more)"

14. **Mechanic Notifications** - When admin approves/rejects/deletes a part request, the requesting mechanic receives a notification

### Files Modified
- 10 files modified, 1 new file created
- New file: `src/app/api/company/work-orders/[workOrderId]/parts/[partId]/route.ts`

---

## v2.10.3 - Jan 28, 2026

### Work Order System Enhancements & UI Polish

1. **CRITICAL: Fixed Mechanic Work Order Query Bug** - Mechanics can now see ALL assigned work orders. Fixed JSON array query bug in `assignedStaffIds` field by implementing client-side filtering instead of broken `.contains()` query. Updated both list and detail API endpoints.

2. **Parts Request Workflow for Mechanics** - New feature allowing mechanics to request parts for work orders:
   - Created `POST /api/mechanic/work-orders/{id}/parts` endpoint
   - New `RequestPartDialog` component with validation
   - Added database fields: `status`, `notes`, `requestedBy`, `requestedAt`, `approvedBy`, `approvedAt` to `WorkOrderPart` model
   - Automatic notifications to company admins when parts are requested
   - Status badges: REQUESTED, APPROVED, ORDERED, REJECTED

3. **Fixed Notification Routing** - Added work order existence check before routing. Prevents 404 errors when clicking notifications for deleted work orders. Shows user-friendly error: "This work order no longer exists"

4. **Homepage Popular Routes Contrast** - Improved text visibility with white text, drop shadows, and semi-transparent backgrounds for better readability on glass backgrounds.

5. **Fixed Bus Type Visibility** - Bus type badges in search results and booking page changed from white-on-white to `bg-primary/10 border-primary/30 text-primary` for clear visibility.

6. **Simplified Seat Selection** - Replaced three-color scheme with two-state design:
   - Vacant seats: Clean white box with seat number
   - Occupied seats: Gray box with red X mark
   - Selected seats show blue border
   - Updated legend to show only "Vacant" and "Occupied"

7. **UI Polish**:
   - Footer now shows ONLY Telegram bot link (@i_ticket_busBot)
   - Company logo upload component handles failed image loads gracefully
   - Audit log action badges now clearly visible with `!text-white` and `border-0`

8. **Documentation** - Created comprehensive `DEPLOYMENT.md` with step-by-step deployment workflow

### Files Modified
- 13 files modified + 4 new files created
- Database migration: `add_work_order_part_status`

---

## v2.10.2 - Jan 28, 2026

### Work Order System Fixes (CRITICAL)

1. **Mechanic API Dual Assignment Support** - Fixed mechanic work order query to support both `assignedToId` (legacy) and `assignedStaffIds` (new multi-staff) using OR conditions. Mechanics can now see ALL work orders assigned to them.
2. **Multi-Staff Notifications** - Work order creation now sends assignment notifications to ALL assigned staff members (loops through array) instead of just first mechanic. Fixes silent assignment failures.
3. **Notification Stakeholders Parser** - Updated `notifyWorkOrderStakeholders()` to parse `assignedStaffIds` JSON array and add all staff to recipient list.
4. **Work Order Routing** - Added notification routing for work order types (CREATED, ASSIGNED, URGENT, COMPLETED, BLOCKED). Routes mechanics to `/mechanic/work-order/{id}`, company admins to `/company/work-orders/{id}`, finance to `/finance/work-orders`.

### UI/UX Fixes

5. **Company Logo Upload Refresh** - Logo now displays immediately after upload without manual page refresh. Added `router.refresh()` call after `updateSession()`.
6. **Conductor Verify Ticket Page** - Created `/staff/verify` page for conductors to verify tickets. Features: Manual 6-character code input, real-time validation via `/api/tickets/verify/public`, large visual feedback (green success/red error), passenger details display, reset button.
7. **Staff Profile Role Display** - Profile page now shows actual staff role (Driver, Conductor, Mechanic, etc.) instead of generic "COMPANY_ADMIN". Uses `staffRole` field with helper formatter.

### Telegram Bot Improvements

8. **Thank You Message** - Added appreciation message after successful booking payment: "Thank you for choosing us!" / "እኛን ስለመረጡ እናመሰግናለን!"
9. **Amharic Translation Corrections**:
   - "Free seats" → "ነጻ መቀመጫዎች አሉ!" (added "ነጻ" + "!" for clarity)
   - "Number of passengers" → "የተሳፋሪዎችን ብዛት" (changed "ቁጥር" to "ብዛት" for natural phrasing)
   - Updated in 4 locations: messages.ts (3x), formatters.ts (1x)

### Favicon & Branding

10. **Professional Favicon Integration** - Added 7 favicon files from RealFaviconGenerator:
    - `favicon.svg` (vector, scalable)
    - `favicon-96x96.png` (high-res PNG)
    - `favicon.ico` (multi-resolution ICO)
    - `apple-touch-icon.png` (180x180, iOS)
    - `web-app-manifest-192x192.png` (maskable PWA icon)
    - `web-app-manifest-512x512.png` (maskable PWA icon)
    - Updated `layout.tsx` metadata and `manifest.json` to reference new icons

### Files Modified
- 13 files modified (10 issues fixed, 1 new file created)
- New file: `src/app/staff/verify/page.tsx`

---

## v2.10.1 - Jan 27, 2026

### Critical Bug Fixes

1. **RULE-003: View-Only Trip Protection** - Fixed bulk price update bypass. DEPARTED, COMPLETED, CANCELLED, and past trips now properly blocked from all modifications (bulk operations, edit page, API). Greyed out rows in dashboard/trips list with disabled Edit button.
2. **RULE-007: Company Revenue Calculation** - Trip details now shows correct company revenue (totalAmount - commission - commissionVAT) instead of customer total. Fixed in trip details page and manifest generator.
3. **Work Orders API** - Added missing fields (assignedToName, totalCost, createdAt, completionNotes, mechanicSignature) to GET response.
4. **Telegram Bot Passenger Prompt** - Fixed wrong passenger number display. Now correctly shows "Passenger 2 of 2" instead of "Passenger 1 of 2" by syncing in-memory session after DB update.
5. **Badge Colors** - Updated 8 files with high-contrast colors (bg-*-600 text-white) for better readability. Affected: staff, vehicles, audit-logs, profile, work-orders, mechanic, finance pages.
6. **Template Search UX** - Search input now integrated inside dropdown for intuitive filtering.

---

## v2.10.0 - Jan 26, 2026

1. **Smart Column Auto-Detect (Excel Import)** - Upload any Excel/CSV file with your own column names. System auto-detects common variations like "From"→origin, "Date"→departureDate. Supports English and Amharic column names. Manual mapper UI for unrecognized columns.
2. **Trip Creation Form Reordering** - New logical field order: Route → Date/Time → Batch → Vehicle → Bus Type/Seats → Staff → Duration/Distance → Price → Amenities. Duration now in hours (not minutes).
3. **Column Mapper Component** - Visual UI for mapping columns with confidence indicators, sample data preview, and required field validation.

---

## v2.9.0 - Jan 26, 2026

1. **Trip Templates** - Save and load route templates for quick trip creation. Templates store origin, destination, duration, distance, price, bus type, and amenities.
2. **CRITICAL: Telegram Duration Bug Fix** - Bot now correctly displays trip duration (was showing "540 ሰዓት" instead of "9h"). Fixed formatDuration to expect minutes.
3. **ID Optional for Booking** - National ID is now optional for both Telegram bot and web booking. Message: "You'll need to show ID matching your name when boarding."
4. **Telegram UX Improvements** - Clearer phone keyboard prompt, /mytickets hint after payment, individual ticket codes shown for each passenger.
5. **Navbar Guest Display** - Customers without names now show phone number in navbar instead of blank.

---

## v2.8.2 - Jan 26, 2026

1. **CRITICAL: Telegram Timezone Fix** - Bot now displays dates/times in Ethiopia Time (EAT = UTC+3) instead of UTC. Trip times now match PWA exactly.
2. **Track Page Validation** - Simplified validation to accept 6-character shortcodes from Telegram tickets
3. **Telegram Welcome Message** - Restored formatting with emojis after cache-related display bug was identified

---

## v2.8.1 - Jan 26, 2026

1. **Passenger Telegram Notifications** - Tickets sent directly to passengers who have Telegram accounts (by phone lookup)
2. **Track API Fix** - Fixed missing fields (commission, commissionVAT, totalAmount, status, createdAt) in track API response

---

## v2.8.0 - Jan 25, 2026

1. **Telegram Bot** - Full booking flow via @i_ticket_busBot with bilingual support
2. **Fuzzy City Search** - Levenshtein distance algorithm for spelling error tolerance
3. **SMS Confirmation** - Tickets sent via SMS after Telegram booking payment
4. **Track Page Fix** - Now accepts 6-character shortcodes from Telegram tickets
5. **Passenger Prompts** - Shows "Passenger 1 of 2" for multi-passenger bookings
6. **Bot QR Codes** - QR codes for easy bot access at `/public/telegram-bot-qr.png`

---

## v2.7.0 - Jan 24, 2026

1. **Silent Auto-Refresh** - Search results refresh every 30s without scroll jump or loading flash
2. **Trip Detail Refresh** - Manual refresh button + 30s auto-refresh for company admin
3. **Service Charge Rename** - "Commission" → "Service Charge" in all customer-facing UI
4. **PWA Mobile Optimization** - Safe area insets, touch targets, notch support
5. **Seat Map Orientation** - Auto-detect portrait for phones + manual toggle button
6. **Admin Passenger Milestone** - Progress bar added to super admin dashboard
7. **Company Messages Redirect** - /admin/company-messages → /admin/company-support

---

## v2.5.0 - Jan 23, 2026

- Dashboard Redesign, CSV Import Enhancement, Supervisor Role, Platform Staff Permissions

---

## Earlier Versions

For changelog entries prior to v2.5.0, see `CLAUDE-FULL-BACKUP.md`.

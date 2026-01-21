# 🚨 ULTRA-CRITICAL: Manual Ticketing Business Logic

**Date:** January 21, 2026
**Status:** CRITICAL - Must be preserved across all changes

---

## Manual Ticketing System Architecture

### ✅ CORRECT Understanding (January 21, 2026)

#### 1. Company Admin Role (NEVER Sells Tickets)

**Company Admin responsibilities:**
- ✅ Supervise operations
- ✅ Register staff (create manual ticketer accounts with credentials)
- ✅ Assign manual ticketers to specific trips
- ✅ Communicate with staff
- ✅ View reports and analytics
- ✅ Manage company settings

**Company Admin does NOT:**
- ❌ Sell tickets directly
- ❌ Use the `/api/company/trips/[tripId]/manual-ticket` route (DEPRECATED - DO NOT USE)

---

#### 2. Manual Ticketer/Cashier Role (The ONLY Staff Who Sell Tickets)

**Manual Ticketer = Cashier = SAME ROLE**

**Responsibilities:**
- ✅ Physically sell tickets to walk-in customers at bus stations
- ✅ Handle cash payments
- ✅ Issue tickets with seat assignments
- ✅ Update ticket inventory in real-time

**Technical Implementation:**
- **Route:** `/api/cashier/trip/[tripId]/sell`
- **Authentication:** Manual ticketer credentials (created by company admin)
- **Location:** Can log in from ANYWHERE (SaaS power - no location limitation)
- **UI:** Cashier portal with seat map and ticket selling interface

---

#### 3. Multi-Location Setup

Companies typically have manual ticketers in multiple locations:

**Example 1: Addis Ababa ↔ Bahir Dar Route**
- **Ticketer 1:** Stationed in Addis Ababa (sells tickets for departures from Addis)
- **Ticketer 2:** Stationed in Bahir Dar (sells tickets for return trips to Addis)

**Example 2: With Intermediate Waypoints**
- **Ticketer 1:** Addis Ababa (origin)
- **Ticketer 2:** Bahir Dar (destination)
- **Ticketer 3:** Intermediate station (e.g., Debre Markos)

**Company Admin Workflow:**
1. Company admin registers 2-3 staff as "Manual Ticketer" role
2. Company admin provides credentials to each ticketer
3. Company admin assigns ticketers to specific trips
4. Ticketers log in from their locations (office, station, etc.)
5. Ticketers sell tickets using the cashier interface

---

#### 4. If Company Admin Needs to Sell Tickets

**Scenario:** Company admin wants to sell tickets from the main office in Addis Ababa

**Solution:**
1. ✅ Company admin creates a manual ticketer staff account for "Addis Office"
2. ✅ Company admin assigns this ticketer to the trip
3. ✅ Admin or delegated staff logs in as the manual ticketer
4. ✅ Sells tickets using the cashier interface (`/api/cashier/trip/[tripId]/sell`)

**DO NOT:**
- ❌ Use the `/api/company/trips/[tripId]/manual-ticket` route
- ❌ Create a separate "admin manual ticketing" flow
- ❌ Bypass the cashier interface

---

## 🚨 CRITICAL Bug Fixed (January 21, 2026)

### The Problem

**Before Fix:**
- ❌ Auto-halt logic existed ONLY in `/api/company/trips/[tripId]/manual-ticket` route (unused in production)
- ❌ Cashier route (`/api/cashier/trip/[tripId]/sell`) did NOT have auto-halt logic
- ❌ ALL production manual ticket sales bypassed auto-halt
- ❌ Online booking never auto-halted when manual sales dropped slots to ≤10

**After Fix:**
- ✅ Auto-halt logic added to `/api/cashier/trip/[tripId]/sell` route (the ACTUAL production route)
- ✅ Manual ticket sales now trigger online booking auto-halt at ≤10 seats
- ✅ Manual ticketing itself is NEVER blocked (can sell down to 0 seats)

---

## Auto-Halt Behavior (Manual Ticketing)

### When Manual Ticketer Sells Tickets

**Scenario:** Manual ticketer sells 2 tickets, dropping available seats from 12 to 10

**Expected Behavior:**
1. ✅ Manual sale completes successfully (manual ticketing NEVER blocked)
2. ✅ Available slots decremented: 12 → 10
3. ✅ Auto-halt check runs:
   ```typescript
   if (
     updatedTrip.availableSlots <= 10 &&           // TRUE (10 <= 10)
     !updatedTrip.bookingHalted &&                  // TRUE (not yet halted)
     !trip.adminResumedFromAutoHalt &&              // TRUE (no one-time resume)
     !trip.autoResumeEnabled &&                     // TRUE (no trip-specific bypass)
     !trip.company.disableAutoHaltGlobally          // TRUE (no company-wide bypass)
   ) {
     // Trigger auto-halt for ONLINE booking only
   }
   ```
4. ✅ Online booking gets auto-halted (new online bookings blocked)
5. ✅ Manual ticketing continues working (can sell remaining 10 seats down to 0)
6. ✅ Audit log created: `AUTO_HALT_LOW_SLOTS`
7. ✅ ClickUp alert sent (non-blocking)

---

## Routes Summary

### ✅ ACTIVE Production Routes

1. **Cashier Ticket Sale**
   - Route: `/api/cashier/trip/[tripId]/sell`
   - Used by: Manual ticketers/cashiers (the ONLY staff who sell tickets)
   - Features:
     - Seat selection
     - Cash payment processing
     - Ticket generation with QR codes
     - **Auto-halt trigger for online booking** (added Jan 21, 2026)
     - Audit logging

### ❌ DEPRECATED Routes (DO NOT USE)

1. **Company Admin Manual Ticket**
   - Route: `/api/company/trips/[tripId]/manual-ticket`
   - Status: **DEPRECATED - CAUSES CONFUSION**
   - Reason: Company admins do NOT sell tickets directly
   - Recommendation: **REMOVE THIS ROUTE** to prevent confusion
   - If admins need to sell: Create ticketer staff account and use cashier interface

---

## Database Schema

### Staff Assignment

```typescript
Trip {
  id: string
  manualTicketerId: string?  // Assigned manual ticketer (cashier)
  // ... other fields
}

User {
  id: string
  role: "COMPANY_ADMIN"
  staffRole: "MANUAL_TICKETER" | "DRIVER" | "CONDUCTOR" | ...
  companyId: string
}
```

**Assignment Flow:**
1. Company admin creates staff with `staffRole = "MANUAL_TICKETER"`
2. Company admin assigns ticketer to trip: `trip.manualTicketerId = ticketer.id`
3. Ticketer logs in and sees assigned trips in cashier portal
4. Ticketer sells tickets using `/api/cashier/trip/[tripId]/sell`

---

## Testing Requirements

### Manual Ticketing Auto-Halt Test

**Test Case:** Manual sale drops seats to ≤10, online booking should halt

```typescript
// Setup
const trip = createTrip({ availableSlots: 12, totalSlots: 50 })
const ticketer = createManualTicketer({ companyId: trip.companyId })
assignTicketerToTrip(trip.id, ticketer.id)

// Act: Sell 2 tickets (12 → 10 seats)
const response = await fetch('/api/cashier/trip/[tripId]/sell', {
  method: 'POST',
  body: { passengerCount: 2 }
})

// Assert
expect(response.status).toBe(200) // Sale succeeds
expect(trip.availableSlots).toBe(10) // Slots decremented
expect(trip.bookingHalted).toBe(true) // Online booking auto-halted
expect(auditLog.action).toBe('AUTO_HALT_LOW_SLOTS') // Audit log created
```

---

## Key Takeaways

1. ✅ **Manual Ticketer = Cashier** (same role, different name)
2. ✅ **Company Admin NEVER sells tickets** (only supervises and assigns staff)
3. ✅ **Only route used in production:** `/api/cashier/trip/[tripId]/sell`
4. ✅ **Multi-location setup:** 1 ticketer per location (Addis, destination, waypoints)
5. ✅ **Auto-halt:** Manual sales trigger online halt at ≤10 seats, but manual ticketing continues
6. ❌ **DEPRECATED:** `/api/company/trips/[tripId]/manual-ticket` route (remove to prevent confusion)

---

**Last Updated:** January 21, 2026
**Critical Bug Fixed:** Auto-halt now works for cashier route (production route)
**Status:** ✅ PRODUCTION READY (after fix is deployed)

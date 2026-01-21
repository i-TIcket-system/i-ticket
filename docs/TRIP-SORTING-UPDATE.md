# Trip Sorting Update - Departed Trips to Bottom

**Date**: January 21, 2026
**Status**: ✅ COMPLETE

---

## Overview

Updated all trip listing endpoints to prioritize active trips and move completed/departed trips to the bottom of the list.

---

## Status Priority Order

Trips are now sorted by status priority first, then by departure time:

| Priority | Status    | Description                | User Impact                        |
|----------|-----------|----------------------------|------------------------------------|
| 1        | SCHEDULED | Active upcoming trips      | Appears at top - needs attention   |
| 2        | BOARDING  | Active boarding trips      | Appears near top - imminent        |
| 3        | DEPARTED  | In progress                | Appears middle - ongoing           |
| 4        | COMPLETED | Finished trips             | Appears at bottom - historical     |
| 5        | CANCELLED | Cancelled trips            | Appears at bottom - historical     |

---

## Files Created

### 1. `/src/lib/sort-trips.ts`
**Purpose**: Reusable helper function for consistent trip sorting across all endpoints.

**Key Features**:
- `sortTripsByStatusAndTime()` function
- Configurable time order (asc/desc)
- Status priority mapping

**Usage Example**:
```typescript
import { sortTripsByStatusAndTime } from "@/lib/sort-trips"

const sortedTrips = sortTripsByStatusAndTime(trips, "desc")
```

---

## Endpoints Updated

### 1. Company Trips - `/api/company/trips`
**Before**: `orderBy: { departureTime: "desc" }`
**After**: Status priority + departure time desc
**Impact**: Company admins see active trips first

### 2. Admin All Trips - `/api/admin/trips`
**Before**: Custom sorting via query params
**After**: Status priority applied when sorting by departureTime (default)
**Impact**: Super admins see active trips first, custom sorting still works

### 3. Staff My Trips - `/api/staff/my-trips`
**Before**: `orderBy: { departureTime: "asc" }`
**After**: Status priority + departure time asc
**Impact**: Staff see upcoming assignments first

### 4. Cashier Trips - `/api/cashier/my-trips`
**Before**: `orderBy: { departureTime: "asc" }`
**After**: Status priority + departure time asc
**Impact**: Ticketers see active trips first

### 5. Public Trip Search - `/api/trips`
**Before**: `orderBy: { departureTime: "asc" }`
**After**: Status priority + departure time asc (when sortBy = "departureTime")
**Impact**: Customers see scheduled trips before boarding trips

---

## Behavior Details

### Default Sorting (Departure Time)
When no custom sorting is applied or when sorting by departure time:
1. **Active trips** (SCHEDULED, BOARDING) appear first
2. **In-progress trips** (DEPARTED) appear next
3. **Historical trips** (COMPLETED, CANCELLED) appear last
4. Within each status group, trips are sorted by departure time

### Custom Sorting (Admin Panel)
When Super Admin sorts by other fields (price, availableSlots, company):
- Custom sorting takes precedence
- Status priority sorting is NOT applied
- User's explicit sort preference is respected

### Example Order
```
✅ SCHEDULED - Jan 22, 08:00 AM (Addis → Bahir Dar)
✅ SCHEDULED - Jan 22, 10:00 AM (Addis → Gondar)
🚌 BOARDING  - Jan 21, 11:30 PM (Addis → Jimma)
🚗 DEPARTED  - Jan 21, 09:00 AM (Bahir Dar → Addis)
✔️ COMPLETED - Jan 20, 08:00 AM (Addis → Hawassa)
✔️ COMPLETED - Jan 19, 10:00 AM (Gondar → Addis)
❌ CANCELLED - Jan 18, 07:00 AM (Addis → Dire Dawa)
```

---

## Technical Implementation

### Type Safety
The sorting function is generic and type-safe:
```typescript
function sortTripsByStatusAndTime<T extends { status: string; departureTime: Date | string }>(
  trips: T[],
  timeOrder: 'asc' | 'desc' = 'asc'
): T[]
```

### Performance
- Sorting happens in-memory after database fetch
- O(n log n) complexity - negligible for typical trip counts
- No additional database queries required

### Backwards Compatibility
- All existing filters and pagination work unchanged
- Custom sorting parameters still honored
- No breaking changes to API contracts

---

## Testing

### TypeScript Compilation
```bash
npx tsc --noEmit
```
**Result**: ✅ No errors

### Endpoints to Test
1. **Company Admin**:
   - Navigate to `/company/trips`
   - Verify SCHEDULED trips appear before COMPLETED/CANCELLED

2. **Super Admin**:
   - Navigate to `/admin/trips`
   - Verify default view shows active trips first
   - Test custom sorting (by price, company) still works

3. **Staff Portal**:
   - Navigate to `/staff/trips`
   - Verify upcoming assignments appear first

4. **Cashier Portal**:
   - Navigate to `/cashier`
   - Verify active trips appear first

5. **Customer Search**:
   - Search for trips on `/search`
   - Verify SCHEDULED trips appear before BOARDING trips

---

## Related Changes

This update complements the **Old Trip Cleanup Fix** (see `OLD-TRIP-CLEANUP-FIX.md`):
- Old trip cleanup: Automatically updates past trip statuses
- Trip sorting: Ensures active trips are always visible first

Together, these ensure:
- No stale data accumulates
- Users always see relevant, actionable trips first
- Historical data is accessible but not prominent

---

## Rollback Instructions

If sorting causes issues, revert these changes:

1. Remove import from each endpoint:
   ```typescript
   import { sortTripsByStatusAndTime } from "@/lib/sort-trips"
   ```

2. Remove sorting call:
   ```typescript
   // Remove this line
   const sortedTrips = sortTripsByStatusAndTime(trips, "asc")

   // Restore original return
   return NextResponse.json({ trips }) // instead of sortedTrips
   ```

3. Delete `/src/lib/sort-trips.ts`

---

## Future Enhancements

Potential improvements for consideration:
1. Add database index on `(status, departureTime)` for faster queries
2. Consider computed column in database for status priority
3. Add status priority to frontend trip cards (visual indicators)
4. Allow users to toggle "hide completed trips" filter

---

## Documentation Updated

- [x] This file (`TRIP-SORTING-UPDATE.md`)
- [x] Code comments in all updated endpoints
- [ ] User-facing help documentation (if needed)
- [ ] API documentation (if maintained separately)

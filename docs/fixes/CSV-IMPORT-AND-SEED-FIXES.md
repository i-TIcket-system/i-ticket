# CSV Import and Seed Data Fixes

**Date**: January 22, 2026
**Issues Fixed**: 2 critical bugs
**Files Modified**: 3
**Files Created**: 1 (verification script)

---

## Issue 1: CSV/Excel Time Format Errors ❌ → ✅

### Problem
When users uploaded Excel files, times appeared as dates (`1899-12-30 08:00`) causing validation errors:
- `departureTime: Time must be in HH:MM format (24-hour)`
- Users entering `8:00` instead of `08:00` also failed validation

### Root Cause
1. **Excel Time Storage**: Excel stores times as serial numbers with base date 1899-12-30
2. **XLSX Parser**: Wasn't detecting time-only cells and converting them to HH:MM format
3. **Strict Validation**: Time regex required double-digit hours (`08:00`), rejecting single-digit hours (`8:00`)

### Solution
**File**: `src/lib/import/xlsx-parser.ts`
- Added time-only cell detection (checks if year ≤ 1900)
- Converts time cells to HH:MM format before validation
- Preserves date cells as YYYY-MM-DD

```typescript
if (cell.type === ExcelJS.ValueType.Date) {
  const date = cell.value as Date;
  const isTimeOnly = date.getFullYear() <= 1900;

  if (isTimeOnly) {
    // Format as HH:MM
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    value = `${hours}:${minutes}`;
  } else {
    // Format as YYYY-MM-DD
    value = date.toISOString().split('T')[0];
  }
}
```

**File**: `src/lib/import/trip-import-validator.ts`
- Added `normalizeTime()` function to add leading zeros
- Handles both `8:00` → `08:00` and `08:00` → `08:00`
- Applied to both `departureTime` and `returnTripTime` fields

```typescript
function normalizeTime(time: string): string {
  const trimmed = time.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return trimmed;

  const hours = match[1].padStart(2, '0');
  const minutes = match[2];
  return `${hours}:${minutes}`;
}
```

### Result
✅ Excel time cells now properly converted to HH:MM format
✅ Users can enter `8:00` or `08:00` (both accepted)
✅ No more `1899-12-30` date errors

---

## Issue 2: Seed Data Auto-Halt Non-Compliance ❌ → ✅

### Problem
Seeded database trips violated auto-halt business rules:
1. **Low seats**: Trips with ≤10 available slots had `bookingHalted = false`
2. **Past trips**: Trips with past dates had `status = SCHEDULED` and `bookingHalted = false`
3. **Inconsistent state**: Could book online for trips that should be halted

### Auto-Halt Business Rules (CRITICAL)
From `CLAUDE.md`:
1. **Manual ticketing**: Can ALWAYS sell down to 0 seats (NEVER blocked by auto-halt)
2. **Online booking**: Auto-halts at ≤10 seats (unless bypassed by checkboxes)
3. **Trip status**: DEPARTED/COMPLETED/CANCELLED trips ALWAYS halt (no bypass)

### Solution
**File**: `prisma/seed.ts`

Added status and halt logic based on departure time:
```typescript
// Determine trip status based on departure time
const now = new Date()
let tripStatus = "SCHEDULED"
let bookingHalted = false

if (departure < now) {
  // Past trips should be COMPLETED or CANCELLED based on bookings
  tripStatus = bookedSlots > 0 ? "COMPLETED" : "CANCELLED"
  bookingHalted = true // ALWAYS halt booking for past trips
} else {
  // Future trips: check auto-halt rule (≤10 seats)
  bookingHalted = availableSlots <= 10
}

trips.push({
  // ... other fields
  status: tripStatus,
  bookingHalted,
})
```

### Verification
**Created**: `scripts/verify-auto-halt.ts`

Checks all trips for:
- Past trips have `status = COMPLETED` or `CANCELLED`
- Past trips have `bookingHalted = true`
- Future trips with ≤10 seats have `bookingHalted = true`
- Trip status breakdown and statistics

**Verification Results** (161 trips):
```
✅ All trips comply with auto-halt rules!

📈 Statistics:
   Past trips: 0
   Future trips: 161
   Future trips with ≤10 seats: 4
   Correctly halted: 4
   Incorrectly halted: 0

📊 Trip Status Breakdown:
   SCHEDULED: 161
   BOARDING: 0
   DEPARTED: 0
   COMPLETED: 0
   CANCELLED: 0

✅ Sample of correctly halted trips:
   Addis Ababa → Mekelle | SCHEDULED | 10/30 seats | Halted: LOW SEATS
   Addis Ababa → Gondar | SCHEDULED | 10/30 seats | Halted: LOW SEATS
   Addis Ababa → Dire Dawa | SCHEDULED | 10/30 seats | Halted: LOW SEATS
   Hawassa → Addis Ababa | SCHEDULED | 10/30 seats | Halted: LOW SEATS
```

---

## Testing Instructions

### Test CSV Import Time Format
1. Create Excel file with time column formatted as TIME (not TEXT or DATE)
2. Enter times like: `8:00`, `08:00`, `14:30`, `23:45`
3. Upload via `/company/trips/import`
4. Verify: All times accepted and converted to HH:MM format

### Test Seed Data Compliance
1. Run: `npx tsx prisma/seed.ts`
2. Run: `npx tsx scripts/verify-auto-halt.ts`
3. Verify: "✅ All trips comply with auto-halt rules!"

---

## Impact

### Before Fixes
- ❌ CSV import failed with date/time format errors
- ❌ Users frustrated with `1899-12-30` errors
- ❌ Seeded trips had inconsistent halt state
- ❌ Could book online for trips with ≤10 seats

### After Fixes
- ✅ CSV import accepts Excel time cells
- ✅ Flexible time input (single or double-digit hours)
- ✅ Seed data 100% compliant with auto-halt rules
- ✅ Consistent booking halt behavior

---

## Files Changed

1. **src/lib/import/xlsx-parser.ts** (+14 lines)
   - Added time-only cell detection
   - Converts Excel time values to HH:MM format

2. **src/lib/import/trip-import-validator.ts** (+25 lines)
   - Added `normalizeTime()` function
   - Applied normalization to time fields

3. **prisma/seed.ts** (+18 lines, -2 lines)
   - Added status determination logic
   - Added auto-halt rule enforcement

4. **scripts/verify-auto-halt.ts** (NEW, 120 lines)
   - Comprehensive compliance verification
   - Statistics and issue reporting

---

## Next Steps

### Recommended
1. Add Excel template with pre-formatted TIME columns
2. Update user documentation with time format examples
3. Run verification script after each seed

### Optional
4. Add frontend validation preview for time formatting
5. Create admin dashboard widget showing halt compliance stats

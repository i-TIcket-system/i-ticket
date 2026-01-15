# Work Order Creation Form - Test Guide

## ✅ Backend Test Results

**Test Status**: PASSING ✅

The automated test script (`scripts/test-work-order-creation.ts`) successfully verified:
- ✅ Work order creation with all fields
- ✅ Vehicle assignment (Mercedes-Benz Sprinter 3-12345)
- ✅ Mechanic assignment (Girma Kebede)
- ✅ Database persistence
- ✅ Work order messaging system

### Test Output:
```
Work Order Number: WO-TEST-MK9CHSOG
Title: Test Oil Change
Vehicle: 3-12345 - Mercedes-Benz Sprinter
Task Type: PREVENTIVE
Priority: 2 (Normal)
Status: OPEN
Assigned To: Girma Kebede
Scheduled: 13/1/2026
```

## 🧪 Manual UI Testing Steps

### Prerequisites:
1. Dev server must be running: `npm run dev`
2. Database seeded with test data
3. Login as **Selam Bus Admin**: `0922345678 / demo123`

### Test Procedure:

#### Step 1: Navigate to Work Orders
1. Login as Selam Bus admin
2. Click **"Work Orders"** in the sidebar
3. Verify you see the work orders page with stats cards

#### Step 2: Open Create Dialog
1. Click the **"Create Work Order"** button (top right)
2. Verify the dialog opens with all fields

#### Step 3: Fill Out Form
Fill in the following test data:

**Required Fields:**
- **Vehicle**: Select "3-12345 (101) - Mercedes-Benz Sprinter"
- **Title**: "Brake System Inspection"
- **Work Type**: "Inspection"
- **Priority**: "High" (3)
- **Description**: "Complete brake system inspection including pads, rotors, calipers, and brake fluid level check."

**Optional Fields:**
- **Assigned Mechanic**: Select "Tariku Worku" or "Girma Kebede"
- **Scheduled Date**: Select tomorrow's date
- **Estimated Cost**: "2500"
- **Notes**: "Customer reported squeaking noise when braking"

#### Step 4: Submit Form
1. Click **"Create Work Order"** button
2. Wait for success toast message
3. Verify dialog closes
4. Verify new work order appears in the table

#### Step 5: Verify Created Work Order
1. Find the newly created work order in the list
2. Click on it to open details page
3. Verify all fields match what you entered:
   - ✅ Work order number (WO-XXXXXXXX)
   - ✅ Title: "Brake System Inspection"
   - ✅ Vehicle: Mercedes Sprinter
   - ✅ Task type: Inspection
   - ✅ Priority: High (badge color = orange)
   - ✅ Status: Open
   - ✅ Assigned mechanic name
   - ✅ Description text
   - ✅ Scheduled date
   - ✅ Estimated cost in sidebar

#### Step 6: Test WorkOrderChat
1. On the work order detail page, scroll to **"Work Order Chat"** section
2. Type a test message: "Starting inspection tomorrow morning"
3. Click send
4. Verify message appears with your name and role (ADMIN)

## 🎯 Available Test Data

### Vehicles (Selam Bus):
- `3-12345` (101) - Mercedes-Benz Sprinter - Risk: 35
- `3-67890` (102) - Isuzu NPR - Risk: 55

### Mechanics (Selam Bus):
- **Tariku Worku** - Phone: 0914444448
- **Girma Kebede** - Phone: 0914444449

### Task Types:
- PREVENTIVE - Regular scheduled maintenance
- CORRECTIVE - Fixing identified issues
- INSPECTION - Safety/compliance checks
- EMERGENCY - Urgent repairs

### Priority Levels:
- 1 = Low (Gray badge)
- 2 = Normal (Blue badge)
- 3 = High (Orange badge)
- 4 = Urgent (Red badge)

## 🔍 Things to Test

### Form Validation:
- ✅ Try submitting without selecting vehicle (should show error)
- ✅ Try submitting without title (should show error)
- ✅ Try submitting with title < 3 characters (should show error)
- ✅ Try submitting without description (should show error)
- ✅ Try description < 5 characters (should show error)

### Optional Fields:
- ✅ Submit without mechanic (should allow - unassigned)
- ✅ Submit without external shop details (should allow)
- ✅ Submit without scheduled date (should allow)
- ✅ Submit without cost estimate (should allow)

### External Shop:
- ✅ Fill in external shop name: "ABC Auto Repair"
- ✅ Fill in contact: "0911234567"
- ✅ Submit and verify it's saved

### Edge Cases:
- ✅ Very long description (up to 2000 characters)
- ✅ Very long title (up to 200 characters)
- ✅ Future date for scheduling
- ✅ Large cost estimate (e.g., 50000 Birr)

## 📊 Expected Behavior

### Success Path:
1. Form validates all required fields
2. Success toast appears: "Work order created successfully"
3. Dialog closes
4. Work orders list refreshes with new entry
5. New work order has unique WO number (e.g., WO-MK9CHSOG)

### Error Path:
1. Invalid data shows inline validation errors
2. Form stays open for corrections
3. User can fix and resubmit

## 🐛 Known Limitations

1. **No edit functionality yet** - Work orders cannot be edited after creation (future feature)
2. **No parts tracking in form** - Parts must be added separately (future feature)
3. **No file attachments** - Cannot attach photos/documents yet (future feature)
4. **No recurrence** - Cannot create recurring maintenance schedules from this form (use Maintenance Schedules instead)

## 🎉 Success Criteria

The form works correctly if:
- ✅ All required fields are validated
- ✅ Form submits successfully with valid data
- ✅ Work order appears in list with correct data
- ✅ Work order detail page shows all fields
- ✅ Mechanic assignment works
- ✅ External shop fields work
- ✅ WorkOrderChat is accessible
- ✅ No TypeScript/console errors

## 📝 Notes

- Work orders are scoped to the company (you can only create/view work orders for your company's vehicles)
- Mechanics list only shows staff with MECHANIC role from your company
- Vehicles list only shows vehicles from your company
- Work order numbers are auto-generated and unique
- All datetimes are stored in ISO format and displayed in local timezone

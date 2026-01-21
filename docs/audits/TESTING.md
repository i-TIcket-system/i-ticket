# Testing Guide for i-Ticket v1.1.0

This guide covers testing all new features and security fixes.

## Prerequisites
- Dev server running at http://localhost:3001
- Database seeded with demo data
- Demo accounts ready (see README)

## Test Accounts
```
Customer: 0911234567 / demo123
Company Admin: 0922345678 / demo123
Super Admin: 0933456789 / admin123
```

---

## 1. Authentication & Authorization Tests

### Test 1.1: Trip Creation Security
**Goal**: Verify only company admins can create trips

**Steps**:
1. Logout if logged in
2. Try to POST to `/api/trips` without auth:
```bash
curl -X POST http://localhost:3001/api/trips \
  -H "Content-Type: application/json" \
  -d '{"origin": "Test", "destination": "Test2"}'
```
**Expected**: 401 Unauthorized

3. Login as customer (0911234567 / demo123)
4. Try to create trip
**Expected**: 403 Forbidden (customers can't create trips)

5. Login as company admin (0922345678 / demo123)
6. Navigate to `/company/trips/new`
7. Fill form with valid data:
   - Origin: Addis Ababa
   - Destination: Bahir Dar
   - Departure: Tomorrow's date + time
   - Price: 500
   - Bus Type: Standard
   - Total Slots: 45
**Expected**: Trip created successfully, only for YOUR company

### Test 1.2: Booking Security
**Goal**: Verify users can only cancel their own bookings

**Steps**:
1. Login as customer A (0911234567)
2. Create a test booking
3. Note the booking ID from URL
4. Try to PATCH another user's booking via API
**Expected**: 403 Forbidden

---

## 2. Seat Assignment Tests

### Test 2.1: Automatic Seat Assignment
**Goal**: Verify seats are assigned automatically

**Steps**:
1. Login as customer (0911234567)
2. Search for a trip with available seats
3. Book 2 passengers
4. Complete booking (don't pay yet)
5. Check booking details at `/tickets`
**Expected**: Each passenger has a unique seat number (e.g., Seat 1, Seat 2)

### Test 2.2: No Duplicate Seats
**Goal**: Verify no two passengers get the same seat

**Steps**:
1. Create multiple bookings for the same trip
2. Check all passenger seat numbers
**Expected**: All seat numbers are unique per trip

### Test 2.3: Seat Release on Cancellation
**Goal**: Verify seats are released when booking is cancelled

**Steps**:
1. Create a booking with 2 passengers (note seat numbers)
2. Cancel the booking
3. Create a new booking for the same trip
**Expected**: Previously occupied seats are now available

---

## 3. Ticket Verification API Tests

### Test 3.1: Verify Valid Ticket
**Goal**: Test ticket verification by company admin

**Steps**:
1. Login as customer and create + pay for a booking
2. Note the ticket short code (6 characters)
3. Login as company admin (0922345678)
4. POST to `/api/tickets/verify`:
```bash
curl -X POST http://localhost:3001/api/tickets/verify \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{"code": "ABC123"}'
```
**Expected**:
- `valid: true`
- Full ticket details returned
- Passenger info, trip details, booking info

### Test 3.2: Verify Already Used Ticket
**Steps**:
1. Mark ticket as used (PATCH `/api/tickets/verify` with ticketId)
2. Try to verify same ticket again
**Expected**: `valid: false`, error: "Ticket already used"

### Test 3.3: Verify Unpaid Ticket
**Steps**:
1. Create booking but don't pay
2. Try to verify ticket
**Expected**: `valid: false`, status shows PENDING

### Test 3.4: Cross-Company Verification
**Steps**:
1. Login as Company Admin from Company A
2. Try to verify ticket from Company B's trip
**Expected**: 403 Forbidden

---

## 4. Password Reset Flow Tests

### Test 4.1: Request Password Reset
**Goal**: Test OTP generation

**Steps**:
1. Logout
2. Go to login page
3. Click "Forgot Password" (if link exists, or navigate to `/forgot-password`)
4. OR POST to `/api/auth/forgot-password`:
```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"phone": "0911234567"}'
```
**Expected**:
- Success message
- In demo mode, resetToken returned in response
- Check console logs for OTP (6 digits)

### Test 4.2: Reset Password with Token
**Steps**:
1. Get reset token from previous step
2. POST to `/api/auth/reset-password`:
```bash
curl -X POST http://localhost:3001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "123456", "newPassword": "newpass123"}'
```
**Expected**: Password changed successfully

3. Try to login with old password
**Expected**: Fails

4. Login with new password
**Expected**: Success

### Test 4.3: Expired Token
**Steps**:
1. Wait 16 minutes (token expires in 15 min)
2. Try to reset password
**Expected**: "Invalid or expired reset token"

---

## 5. Profile Management Tests

### Test 5.1: View Profile
**Steps**:
1. Login as any user
2. Navigate to `/profile`
**Expected**: Profile page loads with user data

### Test 5.2: Update Profile Information
**Steps**:
1. On `/profile`, update:
   - Name
   - Email
   - National ID
   - Next of Kin info
2. Click "Update Profile"
**Expected**:
- Success message
- Data persisted (refresh page to verify)

### Test 5.3: Change Password
**Steps**:
1. Scroll to "Change Password" section
2. Enter:
   - Current password: demo123
   - New password: testpass123
   - Confirm password: testpass123
3. Submit
**Expected**: Password changed successfully

4. Logout and login with new password
**Expected**: Login works

### Test 5.4: Validation Errors
**Steps**:
1. Try to change password with:
   - Wrong current password
   **Expected**: "Current password is incorrect"

   - Mismatched new passwords
   **Expected**: "New passwords do not match"

   - Password too short (< 6 chars)
   **Expected**: "Password must be at least 6 characters"

---

## 6. Super Admin Dashboard Tests

### Test 6.1: Access Control
**Steps**:
1. Login as customer
2. Navigate to `/admin/dashboard`
**Expected**: Redirected to home page (403)

3. Login as company admin
4. Try to access `/admin/dashboard`
**Expected**: Redirected (403)

5. Login as super admin (0933456789 / admin123)
6. Navigate to `/admin/dashboard`
**Expected**: Dashboard loads successfully

### Test 6.2: System Statistics
**Steps**:
1. On admin dashboard, verify stats cards show:
   - Total Users
   - Total Companies
   - Active Trips
   - Total Revenue (with commission breakdown)
**Expected**: All stats display correct numbers

### Test 6.3: Recent Bookings Table
**Steps**:
1. Scroll to "Recent Bookings" section
**Expected**:
- Table shows last 10 bookings
- Displays: Date, Customer, Route, Company, Amount, Status
- Status badges color-coded (green=PAID, yellow=PENDING, red=CANCELLED)

### Test 6.4: Company Management API
**Steps**:
1. Open browser DevTools
2. Run in console:
```javascript
fetch('/api/admin/companies')
  .then(r => r.json())
  .then(console.log)
```
**Expected**: List of all companies with user/trip counts

---

## 7. Pagination Tests

### Test 7.1: Search with Pagination
**Steps**:
1. Go to search page (`/search`)
2. Search for trips (e.g., origin: Addis Ababa)
3. Check API request in DevTools Network tab
**Expected**:
- Request includes `?page=1&limit=20`
- Response includes pagination metadata:
  ```json
  {
    "trips": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 159,
      "pages": 8
    }
  }
  ```

### Test 7.2: Page Navigation
**Steps**:
1. Manually test pagination:
```bash
# Page 1
curl http://localhost:3001/api/trips?page=1&limit=10

# Page 2
curl http://localhost:3001/api/trips?page=2&limit=10
```
**Expected**: Different trips on each page

---

## 8. Input Validation Tests

### Test 8.1: Trip Creation Validation
**Steps**:
1. Login as company admin
2. Try to create trip with invalid data:

**Invalid phone format**:
```json
{"origin": "A", "destination": "B", ...}
```
**Expected**: "Origin must be at least 2 characters"

**Past departure date**:
```json
{"departureTime": "2020-01-01T10:00:00Z", ...}
```
**Expected**: "Departure time must be in the future"

**Negative price**:
```json
{"price": -100, ...}
```
**Expected**: "Price must be positive"

### Test 8.2: Booking Validation
**Steps**:
1. Try to create booking with > 5 passengers
**Expected**: "Maximum 5 passengers per booking"

2. Try with invalid phone number:
```json
{"passengers": [{"phone": "1234567890", ...}]}
```
**Expected**: "Invalid Ethiopian phone number"

---

## 9. Error Handling Tests

### Test 9.1: Global Error Boundary
**Steps**:
1. Trigger a runtime error (e.g., access undefined property)
**Expected**: Error page appears with "Try again" button

### Test 9.2: API Error Responses
**Steps**:
1. Test various API error scenarios:
   - 401: No auth token
   - 403: Insufficient permissions
   - 404: Resource not found
   - 400: Validation errors
**Expected**: Consistent JSON error format

---

## 10. Performance Tests

### Test 10.1: Database Query Performance
**Steps**:
1. Check database for indexes:
```sql
\d+ "Trip"
\d+ "Booking"
\d+ "Ticket"
```
**Expected**: Indexes present on:
- Trip: (origin, destination, departureTime)
- Booking: (userId, status)
- Ticket: (shortCode)

### Test 10.2: Search Response Time
**Steps**:
1. Measure search API response time:
```bash
time curl http://localhost:3001/api/trips?origin=Addis
```
**Expected**: Response < 500ms

---

## Automated Test Commands

### Quick Health Check
```bash
# Check all new API endpoints
curl http://localhost:3001/api/trips | jq
curl http://localhost:3001/api/auth/forgot-password -X POST -H "Content-Type: application/json" -d '{"phone":"0911234567"}' | jq
```

### Database Verification
```bash
# Check seat assignments
npx prisma studio
# Navigate to Passenger table, verify seatNumber is populated
```

---

## Regression Tests

Ensure existing features still work:
- [ ] Login/Register flow
- [ ] Trip search and filtering
- [ ] Booking creation
- [ ] Payment processing
- [ ] Company dashboard
- [ ] Ticket display with QR code

---

## Test Results Log

| Feature | Status | Notes |
|---------|--------|-------|
| Trip Auth | ⏳ | Not tested yet |
| Seat Assignment | ⏳ | Not tested yet |
| Ticket Verification | ⏳ | Not tested yet |
| Password Reset | ⏳ | Not tested yet |
| Profile Page | ⏳ | Not tested yet |
| Admin Dashboard | ⏳ | Not tested yet |
| Pagination | ⏳ | Not tested yet |
| Validation | ⏳ | Not tested yet |
| Error Handling | ⏳ | Not tested yet |

Update this table as you test each feature!

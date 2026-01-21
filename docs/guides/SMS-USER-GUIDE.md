# i-Ticket SMS Booking - User Guide
## Book Bus Tickets via SMS - No Smartphone Needed!

---

## 🚌 How to Book via SMS

### Quick Start (3 Minutes)

**Send this message to 9999:**
```
BOOK ADDIS HAWASSA JAN15
```

**You'll receive:**
1. Available trips
2. Select trip number
3. Enter passenger details
4. Confirm booking
5. Pay via TeleBirr
6. Get ticket code via SMS

---

## 📱 Step-by-Step Guide

### Step 1: Search for Trips

**Send to: 9999**
```
BOOK [FROM CITY] [TO CITY] [DATE]
```

**Examples:**
```
BOOK ADDIS HAWASSA TODAY
BOOK BAHIRDAR GONDAR TOMORROW
BOOK JIMMA ADDIS JAN15
BOOK DESSIE MEKELE 25
```

**Date Formats:**
- `TODAY` or `0` = Today
- `TOMORROW` or `1` = Tomorrow
- `JAN15` = January 15
- `25` = 25th of current month

### Step 2: Select Trip

**You'll receive:**
```
Trips ADDIS→HAWASSA Jan15:
1. Selam Bus 6AM 320ETB 15seats
2. Sky Bus 9AM 350ETB 8seats
3. Abay Bus 2PM 300ETB 22seats

Reply trip number (1-3)
```

**Reply with number:**
```
2
```

### Step 3: Enter Passenger Count

**You'll receive:**
```
Sky Bus 9AM ADDIS→HAWASSA
Price: 350ETB + 17.50 fee = 367.50ETB

How many passengers?
(Max 5 per booking)
```

**Reply with number:**
```
1
```
or
```
2
```

### Step 4: Enter Passenger Details

**For each passenger, you'll be asked:**

**Name:**
```
Passenger 1/2 name?
```
Reply:
```
Abebe Kebede
```

**National ID or Kebele ID:**
```
Passenger 1/2 ID?
(National ID or Kebele ID)
```
Reply:
```
A123456
```

Repeat for all passengers.

### Step 5: Confirm Booking

**You'll receive summary:**
```
BOOKING SUMMARY
Trip: ADDIS→HAWASSA Jan15
Time: 9:00 AM
Passenger: Abebe Kebede
Price: 367.50 ETB

Reply YES to confirm
Reply NO to cancel
```

**Reply:**
```
YES
```

### Step 6: Pay via TeleBirr

**You'll receive:**
```
Booking confirmed! ID: BK123456
Seat: 12

Payment request sent to 0912******
Amount: 367.50 ETB

Check your phone for payment popup
Enter your TeleBirr password to confirm
```

**On your phone:**
1. TeleBirr popup appears automatically
2. Enter your TeleBirr password
3. Confirm payment

### Step 7: Receive Ticket

**You'll receive:**
```
PAYMENT RECEIVED! 367.50 ETB

YOUR TICKET
Code: ABC123
Trip: ADDIS→HAWASSA
Date: Jan 15, 2025 9:00 AM
Seat: 12
Passenger: Abebe Kebede

Show code ABC123 to conductor
```

**Save this SMS!** You'll need the code at the bus station.

---

## 🎫 At the Bus Station

### Boarding Process

1. Arrive 30 minutes before departure
2. Find your bus company counter
3. Show ticket code to conductor:
   ```
   "My ticket code is ABC123"
   ```
4. Conductor verifies code
5. Board the bus - your seat is assigned!

### If You Lost the SMS

**Check ticket via SMS:**
```
Send to 9999: CHECK ABC123
```

You'll receive full ticket details.

---

## 📋 Other Commands

### Check Ticket Status
```
CHECK ABC123
```

**Response:**
```
TICKET VALID ✓
Code: ABC123
Seat: 12
Name: Abebe Kebede
Trip: ADDIS→HAWASSA
Date: Jan 15, 9AM
Status: Not Used
```

### Get Help
```
HELP
```

**Response:**
```
i-TICKET SMS HELP

Commands:
BOOK [from] [to] [date]
CHECK [code]
STATUS - Your bookings

Support: 0911234567
```

### View Your Bookings
```
STATUS
```

**Response:**
```
YOUR BOOKINGS
1. PAID - ABC123
   ADDIS→HAWASSA Jan15
   Seat 12

Reply 1 for details
```

### Cancel Session
```
CANCEL
```

Exits current booking session.

---

## 💰 Pricing

**Ticket Price + 5% Platform Fee**

Examples:
- 300 ETB ticket → Pay 315 ETB
- 500 ETB ticket → Pay 525 ETB
- 800 ETB ticket → Pay 840 ETB

**SMS Charges:**
- Receiving SMS: FREE
- Sending SMS: Standard operator rates apply

**Payment:**
- TeleBirr transaction fee: ~1% (minimum 5 ETB)
- Total example: 315 ETB ticket + ~5 ETB TeleBirr fee = ~320 ETB

---

## ❓ Frequently Asked Questions

### Q: Do I need a smartphone?
**A:** No! Any phone with SMS capability works. Feature phones are fine.

### Q: Do I need internet?
**A:** No! SMS works without internet.

### Q: Do I need a TeleBirr account?
**A:** Yes, you need TeleBirr to pay. If you don't have it:
- Dial *127# to register
- Or visit Ethio Telecom office

### Q: Can I book for multiple people?
**A:** Yes! Up to 5 passengers per booking.

### Q: What if I make a mistake?
**A:** Reply `CANCEL` to exit and start over with `BOOK`.

### Q: How do I get a refund?
**A:** Contact company directly using the phone number on your ticket SMS.

### Q: What languages are supported?
**A:** English and Amharic. The bot auto-detects your language.

### Q: Is my payment secure?
**A:** Yes! TeleBirr is Ethiopia's official mobile money platform. All transactions are secure.

### Q: What if my phone has no TeleBirr?
**A:** You must have TeleBirr to pay. Register by dialing *127# or visiting Ethio Telecom.

### Q: Can I change my booking?
**A:** Currently not via SMS. Contact support: 0911234567

### Q: What if I lose my ticket SMS?
**A:** Send `CHECK [your code]` to 9999 to retrieve ticket details.

---

## 🆘 Support

### For Booking Issues
**Phone:** 0911234567
**Hours:** Mon-Sun, 6 AM - 10 PM
**SMS:** Send HELP to 9999

### For Payment Issues
**TeleBirr:** Dial 127
**i-Ticket Support:** 0911234567

### For Technical Issues
**Email:** support@iticket.et
**Website:** https://iticket.et

---

## 🌟 Tips for Best Experience

### 1. Save Ticket SMS
Don't delete the ticket SMS until after your trip.

### 2. Arrive Early
Arrive 30 minutes before departure to avoid rush.

### 3. Check Ticket Before Trip
Send `CHECK [code]` a day before to verify.

### 4. Keep Phone Charged
Ensure phone has battery to receive SMS.

### 5. Use Clear Commands
Follow examples exactly for best results.

---

## 📝 Example: Complete Booking

```
YOU: BOOK ADDIS HAWASSA JAN15

BOT: Trips ADDIS→HAWASSA Jan15:
     1. Selam Bus 6AM 320ETB 15seats
     2. Sky Bus 9AM 350ETB 8seats
     Reply trip number (1-2)

YOU: 1

BOT: Selam Bus 6AM ADDIS→HAWASSA
     Price: 320ETB + 16 fee = 336ETB
     How many passengers?

YOU: 1

BOT: Passenger 1 name?

YOU: Abebe Kebede

BOT: Passenger 1 ID?

YOU: A123456

BOT: BOOKING SUMMARY
     Trip: ADDIS→HAWASSA Jan15
     Time: 6:00 AM
     Passenger: Abebe Kebede
     Price: 336 ETB
     Reply YES to confirm

YOU: YES

BOT: Booking confirmed! ID: BK123456
     Seat: 5

     Payment request sent
     Check phone for TeleBirr popup

[TeleBirr popup appears]
[You enter password]

BOT: PAYMENT RECEIVED! 336 ETB

     YOUR TICKET
     Code: XYZ789
     Seat: 5
     Name: Abebe Kebede
     Trip: ADDIS→HAWASSA
     Date: Jan 15, 6:00 AM
     Bus: Selam Bus

     Show code XYZ789 to conductor
```

---

## 🎯 Quick Reference Card

**Print this and keep with you:**

```
┌───────────────────────────────────┐
│  i-TICKET SMS QUICK REFERENCE     │
├───────────────────────────────────┤
│ Shortcode: 9999                   │
│                                    │
│ COMMANDS:                          │
│ BOOK [FROM] [TO] [DATE]           │
│ CHECK [CODE]                       │
│ STATUS                             │
│ HELP                               │
│                                    │
│ EXAMPLE:                           │
│ BOOK ADDIS HAWASSA JAN15          │
│                                    │
│ SUPPORT: 0911234567               │
│ WEB: iticket.et                    │
└───────────────────────────────────┘
```

---

**Happy travels! 🚌**
**i-Ticket - Making Ethiopian bus travel accessible to everyone**

# Customer-Facing Text for Amharic Translation

This document contains all UI text from customer-facing pages that need Amharic translation.

---

## Homepage (src/app/page.tsx)

### Hero Section
| English | Amharic |
|---------|---------|
| Travel Ethiopia | |
| with ease | |
| Book bus tickets from Ethiopia's top companies. Fast, secure, and hassle-free booking at your fingertips. | |

### Trust Indicators
| English | Amharic |
|---------|---------|
| Instant QR Tickets | |
| TeleBirr Payment | |
| 24/7 Support | |

### Popular Routes Section
| English | Amharic |
|---------|---------|
| Popular Routes: | |

### Search Form
| English | Amharic |
|---------|---------|
| Find Your Trip | |
| Search from 100+ daily departures | |
| From | |
| To | |
| Date | |
| Where are you departing from? | |
| Where are you going? | |
| Search Available Trips | |

### Track Your Trip Section
| English | Amharic |
|---------|---------|
| Already have a booking? | |
| Enter your booking ID or ticket code to track your trip | |
| Enter your 6-character ticket code | |
| Track | |
| Tracking... | |

### Bus Companies Section
| English | Amharic |
|---------|---------|
| Our Trusted Partners | |
| We partner with Ethiopia's leading bus companies to bring you the best travel experience. | |

### Features Section
| English | Amharic |
|---------|---------|
| Why Choose i-Ticket? | |
| We've built the most convenient way to book bus tickets in Ethiopia. | |
| Secure Booking | |
| Your payment and personal information are protected with industry-standard encryption. | |
| Real-time Updates | |
| Get instant notifications about your trip status and any schedule changes. | |
| QR Code Tickets | |
| No paper tickets needed. Just show your QR code at boarding. | |
| Learn more | |

### How It Works Section
| English | Amharic |
|---------|---------|
| How It Works | |
| Book your bus ticket in 3 simple steps | |
| Search | |
| Enter your destination, date, and find available trips from multiple companies. | |
| Book | |
| Select your preferred trip, enter passenger details, and proceed to payment. | |
| Travel | |
| Receive your QR code ticket instantly and show it when boarding. | |

### CTA Section
| English | Amharic |
|---------|---------|
| Ready to Start Your Journey? | |
| Join thousands of travelers who trust i-Ticket for their bus bookings across Ethiopia. | |
| Find Trips | |
| Create Account | |

### Stats Bar
| English | Amharic |
|---------|---------|
| Happy Travelers | |
| Daily Trips | |
| Destinations | |
| Partner Companies | |

---

## Search Page (src/app/search/page.tsx)

### Search Form
| English | Amharic |
|---------|---------|
| From | |
| To | |
| Bus Type | |
| All Types | |
| Search | |

### Results Header
| English | Amharic |
|---------|---------|
| Search Results | |
| trip found | |
| trips found | |
| Live updates | |
| Auto-refresh paused | |
| of 4 selected | |
| Refresh | |
| Compare Results | |
| Cancel Compare | |
| Sort by | |
| Departure Time | |
| Price: Low to High | |
| Price: High to Low | |
| Available Seats | |

### Trip Card
| English | Amharic |
|---------|---------|
| km journey | |
| Departed | |
| Completed | |
| via | |
| Stops: | |
| Water | |
| Snacks | |
| per person | |
| seats left | |
| View Only | |
| Trip Completed | |
| Cancelled | |
| Sold Out | |
| Select | |

### No Results
| English | Amharic |
|---------|---------|
| No trips found | |
| Try adjusting your search criteria or check back later. | |
| Suggestions: | |
| Try different dates (tomorrow or next week) | |
| Check for nearby cities or alternative routes | |
| Some routes may not operate daily | |
| Try Tomorrow | |
| Try Next Week | |
| All Bus Types | |
| Clear All Filters | |

### Compare Mode
| English | Amharic |
|---------|---------|
| trips selected | |
| Compare Now | |
| Cancel | |

### Pagination
| English | Amharic |
|---------|---------|
| Load More | |
| remaining | |
| Loading more trips... | |

---

## Booking Page (src/app/booking/[tripId]/page.tsx)

### Navigation
| English | Amharic |
|---------|---------|
| Back to search results | |
| Complete Your Booking | |

### Trip Summary Card
| English | Amharic |
|---------|---------|
| Route: | |
| Amenities: | |
| Water | |
| Snacks | |

### Passenger Details Card
| English | Amharic |
|---------|---------|
| Passenger Details | |
| of | |
| passengers (max 5 per booking) | |
| Add Passenger | |
| Passenger 1 | |
| Primary Contact (Adult/Guardian) | |
| Passenger | |
| Child | |
| Remove | |
| Adult/Guardian required for booking contact & payment | |
| Child passenger - ID and phone not required | |
| Full Name * | |
| As shown on ID | |
| Child's name | |
| You'll need to show ID matching your name when boarding | |
| Phone Number | |
| Phone Number * | |
| (Optional) | |
| Pickup Location (Optional) | |
| e.g., Meskel Square, Bole Airport | |
| Where should the bus pick you up along the route? | |
| Dropoff Location (Optional) | |
| e.g., City Center, Bus Station | |
| Where should the bus drop you off? | |
| Special Needs | |
| None | |
| Wheelchair | |
| Visual Assistance | |
| Hearing Assistance | |
| Other | |

### Price Summary Card
| English | Amharic |
|---------|---------|
| Price Summary | |
| per person | |
| passenger | |
| passengers | |
| i-Ticket service charge (5%) | |
| VAT on service charge (15%) | |
| Total | |
| incl. taxes & fees | |
| Selected Seats: | |
| Price includes all taxes and fees. Payment via TeleBirr. | |
| No account needed - book as guest! | |
| TeleBirr Payment Request | |
| Will be sent to: | |
| (Passenger 1 - Primary Contact) | |
| Make sure this number has TeleBirr enabled | |
| Price has changed | |
| The trip price was updated while you were booking. Please review the new total above. | |
| Accept New Price | |
| Processing... | |
| Accept Price Change First | |
| Continue to Payment | |
| Instant confirmation | |
| Have an account? | |
| Login here | |

### Seat Auto-assign Notice
| English | Amharic |
|---------|---------|
| No seats selected | |
| Seats will be automatically assigned for your | |
| Click seats above to choose specific ones. | |

### Error States
| English | Amharic |
|---------|---------|
| Trip Not Found | |
| The trip you're looking for doesn't exist or has been removed. | |
| Back to Search | |

### Confirmation Dialog
| English | Amharic |
|---------|---------|
| Remove Passenger? | |
| Are you sure you want to remove Passenger | |
| This will also remove any information you've entered for this passenger. | |
| Cancel | |
| Remove | |

---

## Payment Page (src/app/payment/[bookingId]/page.tsx)

### Navigation
| English | Amharic |
|---------|---------|
| Back to booking | |

### Success State
| English | Amharic |
|---------|---------|
| Payment Successful! | |
| Your tickets have been generated. Redirecting to your tickets... | |

### Booking Summary Card
| English | Amharic |
|---------|---------|
| Booking Summary | |
| Bus Company | |
| Departure | |
| Passengers | |
| passenger | |
| passengers | |
| Seat | |
| Auto-assign | |
| Ticket Price | |
| i-Ticket Service Charge (5%) | |
| VAT on Service Charge (15%) | |
| Total | |
| incl. taxes & fees | |

### Payment Method Card
| English | Amharic |
|---------|---------|
| Payment Method | |
| Complete your payment to receive your tickets | |
| TeleBirr | |
| Pay with your mobile wallet | |
| Demo Mode: Payment will be simulated | |
| Pay | |
| Processing Payment... | |
| CBE Birr | |
| Pay with Commercial Bank of Ethiopia | |
| Scan with CBE Birr App | |
| QR Code | |
| Scan this code with your phone's CBE Birr app | |
| Payment Details: | |
| Or enter manually: | |
| i-Ticket Account | |
| Reference Code | |
| Amount | |
| Steps to pay: | |
| Open your CBE Birr app | |
| Select "Send Money" or "Pay Bill" | |
| Copy & paste | |
| Scan QR or enter | |
| the account number | |
| Enter the reference code above | |
| Confirm the amount: | |
| Complete payment & enter transaction ID below | |
| CBE Transaction ID | |
| Enter transaction ID from CBE | |
| After completing payment in CBE Birr, enter the transaction ID you received | |
| Verifying Payment... | |
| Verify Payment | |
| Secure Payment | |
| Your payment information is encrypted and secure. We never store your payment details. | |
| Booking held for 15 minutes. Complete payment to confirm your seats. | |

### Error States
| English | Amharic |
|---------|---------|
| Booking Not Found | |
| The booking you're looking for doesn't exist or has been cancelled. | |
| Back to Search | |

---

## Tickets Page (src/app/tickets/[bookingId]/page.tsx)

### Success Banner
| English | Amharic |
|---------|---------|
| Booking Confirmed! | |
| Show the QR code when boarding. Have a safe trip! | |

### Ticket Card Header
| English | Amharic |
|---------|---------|
| Backup Code | |

### i-Ticket Branding
| English | Amharic |
|---------|---------|
| Thank you for using i-Ticket! | |
| Visit | |
| Ethiopia's #1 Bus Booking Platform | |

### Ticket Details
| English | Amharic |
|---------|---------|
| Seat | |
| Distance: | |
| km | |
| Ticket Price | |
| Service Fee (5%) | |
| VAT on Service Fee (15%) | |
| Total Paid | |
| Booking ID: | |
| Booked: | |
| Staff & Vehicle: | |
| Staff: | |

### Action Buttons
| English | Amharic |
|---------|---------|
| Add to Calendar | |
| Download | |
| Preparing... | |
| Share | |

### All Passengers Card
| English | Amharic |
|---------|---------|
| All Passengers | |
| Code: | |
| Used | |

### Trip Information Card
| English | Amharic |
|---------|---------|
| Trip Information | |
| From | |
| To | |
| Departure | |

### Trip Staff Contact Card
| English | Amharic |
|---------|---------|
| Trip Staff Contact | |
| Contact staff for pickup location and boarding details | |
| Driver | |
| License: | |
| Conductor | |
| Assigned Vehicle | |
| Call ahead if boarding from a different location | |

### Company Support Card
| English | Amharic |
|---------|---------|
| Company Support | |
| Contact | |
| for general inquiries. | |

### Important Notes Card
| English | Amharic |
|---------|---------|
| Important | |
| Arrive 30 minutes before departure | |
| Bring valid ID matching ticket name | |
| Screenshot or save your QR code offline | |
| Use backup code if QR scan fails | |

### Error States
| English | Amharic |
|---------|---------|
| Tickets Not Found | |
| View All Tickets | |

---

## Track Booking Page (src/app/track/[code]/page.tsx)

### Navigation
| English | Amharic |
|---------|---------|
| Back to home | |

### Status Headers
| English | Amharic |
|---------|---------|
| Booking Confirmed! | |
| Your tickets are ready. Show this at the bus terminal. | |
| Payment Pending | |
| Complete payment to confirm your booking | |
| Status: | |

### Trip Information Card
| English | Amharic |
|---------|---------|
| Trip Information | |
| Company | |
| Bus Type | |
| From | |
| To | |
| Departure | |
| Time | |

### Passengers Card
| English | Amharic |
|---------|---------|
| Passengers | |
| Seat | |

### Payment Summary Card
| English | Amharic |
|---------|---------|
| Payment Summary | |
| Ticket Price | |
| passenger | |
| passengers | |
| i-Ticket Service Charge (5%) | |
| VAT on Service Charge (15%) | |
| Total Paid | |
| Booked on | |

### Action Buttons
| English | Amharic |
|---------|---------|
| View Tickets | |
| Book Another Trip | |
| Complete Payment | |

### Error States
| English | Amharic |
|---------|---------|
| Booking Not Found | |
| We couldn't find a booking with that ID or ticket code. | |
| Please check: | |
| Booking ID is correct (check your confirmation SMS) | |
| Ticket code is entered correctly (6 characters) | |
| Booking exists and payment was completed | |
| Back to Home | |

### Loading State
| English | Amharic |
|---------|---------|
| Searching for your booking... | |

---

## Shared Components

### SeatMap Component (src/components/booking/SeatMap.tsx)
| English | Amharic |
|---------|---------|
| Loading seat map... | |
| Seat Overview | |
| Select Your Seats | |
| seat selected | |
| seats selected | |
| available | |
| Complete | |
| Landscape | |
| Portrait | |
| Vacant | |
| Occupied | |
| DRIVER | |
| BACK | |
| AISLE | |
| Selected Seats: | |
| Seat | |
| Please select | |
| more seat | |
| more seats | |
| Optional: If you don't select seats, we'll automatically assign the best available seats for you. | |

### TripComparison Component (src/components/search/TripComparison.tsx)
| English | Amharic |
|---------|---------|
| Compare Trips | |
| Feature | |
| Company | |
| Bus Type | |
| Departure | |
| at | |
| Duration | |
| Distance | |
| N/A | |
| Price | |
| Available Seats | |
| Water | |
| Yes | |
| No | |
| Snacks | |
| Cheapest | |
| Sold Out | |
| Select This Trip | |

### TripCountdown Component (src/components/ui/trip-countdown.tsx)
| English | Amharic |
|---------|---------|
| This trip has departed | |
| Your Trip Departs In | |
| Day | |
| Days | |
| Hours | |
| Mins | |
| Secs | |
| Prepare to leave soon! Arrive 20 minutes early | |

### CityCombobox Component (src/components/ui/city-combobox.tsx)
| English | Amharic |
|---------|---------|
| Type or select a city | |
| Press Enter to search for | |
| No matching cities found | |
| You can still search for | |

---

## Bus Types (src/lib/utils.ts)
| English | Amharic |
|---------|---------|
| Mini Bus | |
| Standard Bus | |
| Luxury Bus | |
| VIP Bus | |

---

## Status Badges
| English | Amharic |
|---------|---------|
| SCHEDULED | |
| BOARDING | |
| DEPARTED | |
| COMPLETED | |
| CANCELLED | |
| PAID | |
| PENDING | |

---

## Common UI Elements
| English | Amharic |
|---------|---------|
| Loading... | |
| Error | |
| Success | |
| Warning | |
| Info | |
| Close | |
| Open | |
| Save | |
| Cancel | |
| Confirm | |
| Delete | |
| Edit | |
| View | |
| Copy | |
| Copied! | |
| Share | |
| Download | |
| Upload | |
| Search | |
| Filter | |
| Sort | |
| Clear | |
| Reset | |
| Submit | |
| Continue | |
| Back | |
| Next | |
| Previous | |
| Yes | |
| No | |

---

## Error Messages
| English | Amharic |
|---------|---------|
| Please enter a booking ID or ticket code | |
| Invalid code. Booking IDs and ticket codes are at least 4 characters | |
| Please enter your ticket or booking code | |
| Ticket code must be at least 6 characters | |
| Trip not found | |
| Booking not found | |
| Failed to load trip details | |
| Failed to load booking details | |
| Payment failed | |
| An unexpected error occurred | |
| Please fill in all required passenger details | |
| Name is required | |
| Phone is required | |
| First passenger must be an adult (payment contact) | |
| Company admins cannot book trips | |
| Please use a customer account to make bookings | |

---

## Success Messages
| English | Amharic |
|---------|---------|
| Booking created! Redirecting to payment... | |
| Payment successful! Generating your tickets... | |
| Copied to clipboard! | |
| Your passenger information has been restored | |
| Passenger removed | |
| Calendar event downloaded! | |
| Open the .ics file to add to your calendar | |
| New price confirmed | |

---

## Toast Notifications
| English | Amharic |
|---------|---------|
| Price Changed! | |
| Trip price updated from | |
| to | |
| Please review your booking. | |

---

*Last updated: 2026-01-30*
*Total strings: ~350*

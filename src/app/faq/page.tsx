import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, HelpCircle, Search, CreditCard, Ticket, RefreshCw, MessageSquare, Shield, Bus, AlertCircle } from "lucide-react"

export const metadata = {
  title: "Frequently Asked Questions - i-Ticket",
  description: "Comprehensive FAQ covering booking, payments, SMS service, tickets, cancellations, and all features of i-Ticket platform",
}

export default function FAQPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to home
        </Link>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-3 mb-2">
              <HelpCircle className="h-8 w-8 text-primary" />
              <CardTitle className="text-4xl font-bold">Frequently Asked Questions</CardTitle>
            </div>
            <p className="text-muted-foreground mt-2">
              Everything you need to know about using i-Ticket - Ethiopia's leading bus booking platform
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
              <a href="#getting-started" className="flex flex-col items-center p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors">
                <Search className="h-5 w-5 text-primary mb-1" />
                <span className="text-xs text-center">Getting Started</span>
              </a>
              <a href="#booking" className="flex flex-col items-center p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors">
                <Bus className="h-5 w-5 text-primary mb-1" />
                <span className="text-xs text-center">Booking</span>
              </a>
              <a href="#payment" className="flex flex-col items-center p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors">
                <CreditCard className="h-5 w-5 text-primary mb-1" />
                <span className="text-xs text-center">Payment</span>
              </a>
              <a href="#tickets" className="flex flex-col items-center p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors">
                <Ticket className="h-5 w-5 text-primary mb-1" />
                <span className="text-xs text-center">Tickets</span>
              </a>
              <a href="#sms" className="flex flex-col items-center p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors">
                <MessageSquare className="h-5 w-5 text-primary mb-1" />
                <span className="text-xs text-center">SMS Booking</span>
              </a>
            </div>

            {/* Getting Started */}
            <div id="getting-started" className="mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Search className="h-6 w-6 text-primary" />
                Getting Started
              </h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="start-1">
                  <AccordionTrigger>What is i-Ticket?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      i-Ticket is Ethiopia's leading online bus ticket booking platform. We connect passengers with licensed bus companies, making it easy to search, book, and pay for bus tickets from your phone or computer.
                    </p>
                    <p>
                      Our platform offers real-time seat availability, secure payments via TeleBirr, digital tickets with QR codes, and even SMS booking for feature phone users. We work with trusted bus companies across Ethiopia to provide safe, reliable, and affordable transportation.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="start-2">
                  <AccordionTrigger>How do I create an account?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">Creating an account is easy and free:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Click "Sign Up" or "Create Account" on the homepage</li>
                      <li>Enter your full name (as it appears on your ID)</li>
                      <li>Provide your Ethiopian phone number (09XX or 07XX format)</li>
                      <li>Add your email address (optional but recommended)</li>
                      <li>Create a secure password (minimum 6 characters)</li>
                      <li>Click "Create Account" and you're done!</li>
                    </ol>
                    <p className="mt-2 text-sm text-muted-foreground">
                      <strong>Note:</strong> If you book via SMS, an account is created automatically using just your phone number. You can upgrade to a full account later by visiting our website.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="start-3">
                  <AccordionTrigger>Do I need an account to book tickets?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      <strong>For web booking:</strong> Yes, you need an account to book tickets through our website or app. This ensures security, allows you to manage bookings, and stores your tickets for easy access.
                    </p>
                    <p>
                      <strong>For SMS booking:</strong> No registration is needed! Just send an SMS command, and we'll automatically create a guest account using your phone number. You can book, pay, and receive tickets without ever visiting the website.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="start-4">
                  <AccordionTrigger>Is i-Ticket available on mobile?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      Yes! i-Ticket works seamlessly on all devices:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Smartphones:</strong> Access via any web browser or install as a Progressive Web App (PWA)</li>
                      <li><strong>Feature Phones:</strong> Use our SMS booking service - no internet required!</li>
                      <li><strong>Tablets:</strong> Full web experience optimized for larger screens</li>
                      <li><strong>Desktop Computers:</strong> Complete booking experience with all features</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="start-5">
                  <AccordionTrigger>Which bus companies are available on i-Ticket?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      We partner with multiple licensed bus companies across Ethiopia, offering routes to major cities including Addis Ababa, Hawassa, Bahir Dar, Gondar, Jimma, Dire Dawa, and many more.
                    </p>
                    <p>
                      Each bus company has been vetted for safety, reliability, and customer service. You can see which companies operate on your desired route during the search process, along with their amenities, prices, and departure times.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Booking & Search */}
            <div id="booking" className="mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Bus className="h-6 w-6 text-primary" />
                Booking & Search
              </h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="book-1">
                  <AccordionTrigger>How do I search for trips?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">Searching for trips is simple:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Go to the homepage or search page</li>
                      <li>Enter your <strong>origin city</strong> (where you're traveling from)</li>
                      <li>Enter your <strong>destination city</strong> (where you're going)</li>
                      <li>Select your <strong>travel date</strong></li>
                      <li>Optionally filter by bus type or amenities</li>
                      <li>Click "Search" to see available trips</li>
                    </ol>
                    <p className="mt-2">
                      Results show real-time seat availability, prices, departure times, bus amenities, and route information including intermediate stops.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="book-2">
                  <AccordionTrigger>Can I book multiple seats at once?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      Yes! You can book multiple seats in a single transaction. During the booking process, you'll be asked how many passengers you're booking for.
                    </p>
                    <p className="mb-2">
                      For each passenger, you'll need to provide:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Full name (as shown on ID)</li>
                      <li>ID number (Kebele ID, Passport, or Driver's License)</li>
                      <li>Phone number</li>
                      <li>Pickup and drop-off locations (optional)</li>
                      <li>Special needs (if any)</li>
                    </ul>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Each passenger receives their own ticket with a unique QR code or short code.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="book-3">
                  <AccordionTrigger>Can I book for someone else?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      Absolutely! You can book tickets for family, friends, or colleagues. Simply enter their information during the booking process.
                    </p>
                    <p className="mb-2">
                      <strong>Important:</strong> The passenger must present a government-issued ID matching the name on the ticket when boarding. Make sure to enter their details exactly as they appear on their ID.
                    </p>
                    <p>
                      The ticket will be sent to your account, but you can forward it to the passenger via email or SMS.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="book-4">
                  <AccordionTrigger>Are seats assigned automatically?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      Yes, seats are assigned <strong>automatically</strong> when you complete your booking. Seats are assigned sequentially (A1, A2, A3, etc.) based on availability at the time of payment.
                    </p>
                    <p className="mb-2">
                      Your assigned seat number is shown on your ticket. Currently, manual seat selection is not available, but we try to assign seats together when you book multiple passengers.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Seat assignments are <strong>final</strong> and cannot be changed after booking.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="book-5">
                  <AccordionTrigger>What if there are no available trips on my date?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">If no trips are available on your selected date, try:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Searching for adjacent dates (day before or after)</li>
                      <li>Checking if you've selected the correct origin and destination</li>
                      <li>Trying alternative routes with connections</li>
                      <li>Contacting customer support to check upcoming schedules</li>
                    </ul>
                    <p className="mt-2">
                      New trips are added regularly as bus companies update their schedules. You can also sign up for notifications when routes become available.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="book-6">
                  <AccordionTrigger>Can I choose my pickup and dropoff locations?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      Yes! During booking, you can specify custom <strong>pickup</strong> and <strong>drop-off</strong> locations for each passenger.
                    </p>
                    <p className="mb-2">
                      This is especially useful if:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>You live far from the main departure station</li>
                      <li>You need to be picked up at a specific landmark</li>
                      <li>You want to be dropped at a location closer to your final destination</li>
                    </ul>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Bus companies use this information to plan efficient routes and ensure all passengers are picked up conveniently.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="book-7">
                  <AccordionTrigger>How long do I have to complete payment after booking?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      You have <strong>15 minutes</strong> to complete payment after creating a booking. During this time, your seats are temporarily reserved.
                    </p>
                    <p className="mb-2">
                      If payment is not completed within 15 minutes:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>The booking will be <strong>automatically cancelled</strong></li>
                      <li>Seats will be released to other customers</li>
                      <li>You'll need to create a new booking if you still want to travel</li>
                    </ul>
                    <p className="mt-2 text-sm text-green-600">
                      <strong>Tip:</strong> Have your TeleBirr wallet ready before booking to ensure smooth, quick payment.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Payment & Pricing */}
            <div id="payment" className="mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-primary" />
                Payment & Pricing
              </h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="pay-1">
                  <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      Currently, we accept payments through <strong>TeleBirr</strong>, Ethiopia's leading mobile payment platform operated by Ethio Telecom.
                    </p>
                    <p className="mb-2">
                      <strong>Two payment methods:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>User-Initiated (Web):</strong> Dial *127# on your phone, select "Pay Bill", and enter the payment code shown on screen</li>
                      <li><strong>Merchant-Initiated (SMS):</strong> Receive an automatic payment prompt (MMI popup) on your phone - just enter your TeleBirr PIN</li>
                    </ul>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Support for additional payment methods including bank transfers and credit cards is coming soon.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pay-2">
                  <AccordionTrigger>What is the service fee?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      i-Ticket charges a <strong>5% service fee</strong> on all bookings. This fee covers:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Platform maintenance and development</li>
                      <li>Secure payment processing</li>
                      <li>Customer support (phone, email, SMS)</li>
                      <li>Technology infrastructure (servers, security)</li>
                      <li>QR code and ticket generation</li>
                    </ul>
                    <p className="mt-2">
                      <strong>Example:</strong> If the ticket price is 500 ETB, the total charge will be 525 ETB (500 + 5% = 525 ETB).
                    </p>
                    <p className="mt-2 text-sm text-red-600">
                      <strong>Note:</strong> The service fee is <strong>non-refundable</strong> under all circumstances, including cancellations.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pay-3">
                  <AccordionTrigger>How do I pay with TeleBirr?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2"><strong>For Web Bookings:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2 mb-3">
                      <li>Complete your booking and proceed to payment</li>
                      <li>You'll receive a payment code and instructions</li>
                      <li>On your phone, dial <strong>*127#</strong></li>
                      <li>Select "Pay Bill" or "Merchant Payment"</li>
                      <li>Enter the payment code provided</li>
                      <li>Enter your TeleBirr PIN to confirm</li>
                      <li>Wait for confirmation SMS</li>
                    </ol>
                    <p className="mb-2"><strong>For SMS Bookings:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Complete your booking via SMS</li>
                      <li>You'll receive an automatic payment prompt (MMI popup) on your phone</li>
                      <li>Enter your TeleBirr PIN when prompted</li>
                      <li>Wait for confirmation - your ticket will arrive automatically</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pay-4">
                  <AccordionTrigger>What if my payment fails?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">Payment may fail due to several reasons:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Insufficient TeleBirr wallet balance</li>
                      <li>Incorrect PIN entered</li>
                      <li>Network connectivity issues</li>
                      <li>TeleBirr service temporarily unavailable</li>
                    </ul>
                    <p className="mt-2 mb-2"><strong>What to do:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Check your TeleBirr wallet balance</li>
                      <li>Ensure you have network connectivity</li>
                      <li>Try the payment again within the 15-minute window</li>
                      <li>If it still fails, create a new booking and try again</li>
                    </ol>
                    <p className="mt-2 text-sm text-muted-foreground">
                      If you continue experiencing issues, contact our support team with your booking ID.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pay-5">
                  <AccordionTrigger>Is my payment information secure?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      <strong>Absolutely.</strong> We take payment security very seriously:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>All data is encrypted using <strong>HTTPS/TLS 1.3</strong> (bank-level encryption)</li>
                      <li>Payments are processed through <strong>TeleBirr's certified gateway</strong></li>
                      <li>We <strong>never store</strong> your TeleBirr PIN or complete financial details</li>
                      <li>Payment data is handled according to international security standards</li>
                      <li>Our platform undergoes regular security audits</li>
                    </ul>
                    <p className="mt-2">
                      TeleBirr is operated by Ethio Telecom and follows strict financial regulations and security protocols.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pay-6">
                  <AccordionTrigger>Do prices include all fees and taxes?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      The price displayed during search shows the <strong>base ticket price</strong> set by the bus company. During checkout, we add:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>5% service fee</strong> (i-Ticket platform fee)</li>
                      <li>Any applicable taxes (included in base price)</li>
                    </ul>
                    <p className="mt-2">
                      The <strong>total amount</strong> you see at checkout is the <strong>final price</strong> - no hidden charges.
                    </p>
                    <p className="mt-2 text-sm text-green-600">
                      <strong>Example Breakdown:</strong><br />
                      Base Fare: 500 ETB<br />
                      Service Fee (5%): 25 ETB<br />
                      <strong>Total: 525 ETB</strong>
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pay-7">
                  <AccordionTrigger>Can I get a receipt for my payment?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      Yes! You'll receive a payment receipt automatically:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>SMS:</strong> Payment confirmation message with transaction ID</li>
                      <li><strong>Email:</strong> Detailed receipt with booking and payment information (if email provided)</li>
                      <li><strong>Your Account:</strong> View payment history and download receipts anytime from your dashboard</li>
                    </ul>
                    <p className="mt-2">
                      Receipts include: Transaction ID, booking reference, date/time, amount paid, payment method, and breakdown of charges.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Tickets & Travel */}
            <div id="tickets" className="mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Ticket className="h-6 w-6 text-primary" />
                Tickets & Travel
              </h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="tick-1">
                  <AccordionTrigger>How do I get my ticket after booking?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      After successful payment, your digital ticket is delivered <strong>immediately</strong> via:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>SMS:</strong> Short code (6 alphanumeric characters) sent to your phone - works on any phone, no smartphone needed</li>
                      <li><strong>Web/App:</strong> QR code available in your account dashboard - downloadable and printable</li>
                      <li><strong>Email:</strong> PDF ticket attachment (if you provided email)</li>
                    </ul>
                    <p className="mt-2">
                      You can access your tickets anytime by logging into your account and visiting the "My Tickets" page.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="tick-2">
                  <AccordionTrigger>Do I need to print my ticket?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      <strong>No, printing is NOT required!</strong> i-Ticket provides fully digital tickets.
                    </p>
                    <p className="mb-2">
                      You can show your ticket in two ways:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li><strong>QR Code:</strong> Display the QR code on your phone screen - the conductor will scan it</li>
                      <li><strong>Short Code:</strong> Show or verbally provide the 6-character code - conductor enters it for verification</li>
                    </ol>
                    <p className="mt-2 text-sm text-green-600">
                      <strong>Tip:</strong> Take a screenshot of your ticket or save it offline in case you have connectivity issues at boarding.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="tick-3">
                  <AccordionTrigger>What if I lose my ticket?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      Don't worry! Your tickets are <strong>securely saved</strong> and can be retrieved easily:
                    </p>
                    <p className="mb-2"><strong>For Web Users:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2 mb-3">
                      <li>Log in to your i-Ticket account</li>
                      <li>Go to "My Tickets" page</li>
                      <li>Find your booking and view/download the ticket again</li>
                    </ol>
                    <p className="mb-2"><strong>For SMS Users:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2 mb-3">
                      <li>Send "STATUS" via SMS to check your bookings</li>
                      <li>Contact support with your phone number and booking reference</li>
                      <li>We'll resend your ticket via SMS</li>
                    </ol>
                    <p className="text-sm text-muted-foreground">
                      Each ticket has a unique code that cannot be duplicated, so your ticket remains secure even if you request it multiple times.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="tick-4">
                  <AccordionTrigger>What information is on my ticket?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">Your digital ticket includes all essential travel information:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Passenger Name</strong> (must match ID)</li>
                      <li><strong>Booking Reference</strong> (unique ID)</li>
                      <li><strong>Ticket Code</strong> (QR code or 6-character short code)</li>
                      <li><strong>Route:</strong> Origin → Destination (with intermediate stops if any)</li>
                      <li><strong>Departure Date & Time</strong></li>
                      <li><strong>Seat Number</strong> (assigned automatically)</li>
                      <li><strong>Bus Company Name</strong></li>
                      <li><strong>Pickup Location</strong> (if specified)</li>
                      <li><strong>Ticket Price & Payment Status</strong></li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="tick-5">
                  <AccordionTrigger>How early should I arrive at the departure point?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      We recommend arriving at least <strong>15-20 minutes before</strong> the scheduled departure time.
                    </p>
                    <p className="mb-2">This gives you time to:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Present and verify your ticket</li>
                      <li>Show your ID to the conductor</li>
                      <li>Find your assigned seat</li>
                      <li>Store your luggage securely</li>
                      <li>Settle in before departure</li>
                    </ul>
                    <p className="mt-2 text-sm text-red-600">
                      <strong>Important:</strong> Buses may depart on time. Late arrivals may not be accommodated and are <strong>not eligible for refunds</strong>.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="tick-6">
                  <AccordionTrigger>What ID do I need to bring for boarding?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      You <strong>must</strong> present a valid government-issued photo ID that matches the name on your ticket.
                    </p>
                    <p className="mb-2">Accepted IDs include:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Ethiopian National ID (Kebele ID)</li>
                      <li>Valid Passport</li>
                      <li>Driver's License</li>
                      <li>Other government-issued photo identification</li>
                    </ul>
                    <p className="mt-2 text-sm text-red-600">
                      <strong>Warning:</strong> Passengers without valid ID matching their ticket will be <strong>denied boarding</strong> without refund.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="tick-7">
                  <AccordionTrigger>Can someone else use my ticket?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      <strong>No.</strong> Tickets are <strong>non-transferable</strong> and can only be used by the passenger named on the ticket.
                    </p>
                    <p className="mb-2">
                      Tickets are valid ONLY for:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>The specific passenger name</li>
                      <li>The specific trip date and time</li>
                      <li>The specific route booked</li>
                    </ul>
                    <p className="mt-2">
                      If someone else needs to travel, you must cancel your booking (subject to cancellation fees) and book a new ticket in their name.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="tick-8">
                  <AccordionTrigger>What items are allowed/not allowed on the bus?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2"><strong>Generally Prohibited Items:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
                      <li>Weapons (guns, knives, sharp objects)</li>
                      <li>Explosives and flammable materials</li>
                      <li>Illegal drugs or controlled substances</li>
                      <li>Hazardous or toxic materials</li>
                      <li>Live animals (except service animals with documentation)</li>
                    </ul>
                    <p className="mb-2"><strong>Luggage Policies:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
                      <li>Each passenger typically allowed 1-2 bags (specific limits vary by company)</li>
                      <li>Oversized or overweight luggage may incur extra fees</li>
                      <li>Valuable items should be kept with you, not in checked luggage</li>
                    </ul>
                    <p className="text-sm text-muted-foreground">
                      Specific policies vary by bus company. Check with the company for detailed luggage allowances and restrictions.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Cancellations & Refunds */}
            <div id="cancellations" className="mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <RefreshCw className="h-6 w-6 text-primary" />
                Cancellations & Refunds
              </h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="cancel-1">
                  <AccordionTrigger>Can I cancel my booking?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      Yes, you can cancel bookings, but refund amounts depend on <strong>when</strong> you cancel relative to the departure time.
                    </p>
                    <div className="border rounded-md p-3 my-3">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Cancellation Timing</th>
                            <th className="text-right py-2">Refund</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="py-2">More than 24 hours before departure</td>
                            <td className="text-right text-green-600 font-semibold">90% of base fare</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">12-24 hours before departure</td>
                            <td className="text-right text-yellow-600 font-semibold">50% of base fare</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">Less than 12 hours before departure</td>
                            <td className="text-right text-red-600 font-semibold">No refund</td>
                          </tr>
                          <tr>
                            <td className="py-2">No-show (didn't board)</td>
                            <td className="text-right text-red-600 font-semibold">No refund</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-sm text-red-600">
                      <strong>Note:</strong> The 5% platform service fee is <strong>non-refundable</strong> under all circumstances.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="cancel-2">
                  <AccordionTrigger>How do I cancel my booking?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">To cancel a booking:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2 mb-3">
                      <li>Log in to your i-Ticket account</li>
                      <li>Go to "My Bookings" or "My Tickets"</li>
                      <li>Find the booking you want to cancel</li>
                      <li>Click "Cancel Booking"</li>
                      <li>Review the refund amount (based on cancellation policy)</li>
                      <li>Confirm cancellation</li>
                    </ol>
                    <p className="mb-2"><strong>For SMS Users:</strong></p>
                    <p className="mb-2">Contact customer support at +251-91-123-4567 or email support@i-ticket.et with your booking reference.</p>
                    <p className="text-sm text-muted-foreground">
                      Refunds are processed within 5-7 business days back to your original TeleBirr account.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="cancel-3">
                  <AccordionTrigger>Can I modify my booking instead of cancelling?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      Currently, booking modifications (date changes, passenger name changes, route changes) are <strong>not directly supported</strong>.
                    </p>
                    <p className="mb-2">To change booking details:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Cancel your existing booking (cancellation fees apply)</li>
                      <li>Create a new booking with the correct details</li>
                      <li>Complete payment for the new booking</li>
                    </ol>
                    <p className="mt-2 text-sm text-muted-foreground">
                      We're working on adding direct modification features in the future to make changes easier.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="cancel-4">
                  <AccordionTrigger>What if the bus company cancels my trip?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      If a bus company cancels a trip due to mechanical issues, insufficient bookings, or other operational reasons:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>You'll be notified immediately via SMS and email</li>
                      <li>You're entitled to a <strong>full refund including the service fee</strong></li>
                      <li>Refunds are processed automatically within 24 hours</li>
                      <li>You can also choose to reschedule to another available trip at no extra cost</li>
                    </ul>
                    <p className="mt-2">
                      We work closely with bus companies to minimize cancellations and ensure reliable service.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="cancel-5">
                  <AccordionTrigger>How long does it take to receive my refund?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      Approved refunds are processed back to your original TeleBirr account within <strong>5-7 business days</strong>.
                    </p>
                    <p className="mb-2">Processing time depends on:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>TeleBirr's internal processing time</li>
                      <li>Banking holidays and weekends</li>
                      <li>Technical factors beyond our control</li>
                    </ul>
                    <p className="mt-2">
                      You'll receive an SMS confirmation when the refund is initiated, and another when it's successfully credited to your wallet.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="cancel-6">
                  <AccordionTrigger>What if the bus is delayed?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      For bus delays caused by the bus company:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>You'll be notified of the delay via SMS/email</li>
                      <li>For significant delays (2+ hours), contact the bus company or our support team</li>
                      <li>Depending on the delay reason and duration, you may be eligible for compensation or rescheduling</li>
                    </ul>
                    <p className="mt-2 text-sm text-muted-foreground">
                      <strong>Note:</strong> i-Ticket is a booking platform, not a transport provider. Compensation for delays is determined by the bus company's policies.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* SMS Booking */}
            <div id="sms" className="mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                SMS Booking (Feature Phone Users)
              </h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="sms-1">
                  <AccordionTrigger>What is SMS booking?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      SMS booking allows you to <strong>search, book, pay, and receive tickets entirely via text messages</strong> - no smartphone or internet required!
                    </p>
                    <p className="mb-2">
                      This service is perfect for:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Feature phone users (basic phones without internet)</li>
                      <li>Users in rural areas with limited internet connectivity</li>
                      <li>Anyone who prefers simple SMS-based booking</li>
                      <li>Elderly users who aren't comfortable with smartphones</li>
                    </ul>
                    <p className="mt-2">
                      SMS booking works on <strong>any phone with SMS capability</strong>, and supports both English and Amharic languages.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sms-2">
                  <AccordionTrigger>How do I book via SMS?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">Booking via SMS is simple:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2 mb-3">
                      <li>Send "BOOK [ORIGIN] [DESTINATION] [DATE]" to our shortcode</li>
                      <li>Example: <code className="bg-gray-100 px-1">BOOK ADDIS HAWASSA JAN15</code></li>
                      <li>We'll reply with available trips</li>
                      <li>Reply with the trip number you want</li>
                      <li>Enter number of passengers</li>
                      <li>Provide passenger name(s) and ID number(s)</li>
                      <li>Confirm your booking</li>
                      <li>You'll receive a payment prompt (MMI popup) on your phone</li>
                      <li>Enter your TeleBirr PIN to pay</li>
                      <li>Receive your ticket via SMS immediately!</li>
                    </ol>
                    <p className="text-sm text-green-600">
                      The entire process takes just a few minutes and works on any phone.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sms-3">
                  <AccordionTrigger>What SMS commands are available?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2"><strong>Available Commands (English):</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
                      <li><strong>BOOK</strong> - Search and book trips</li>
                      <li><strong>CHECK [CODE]</strong> - Verify ticket status (e.g., CHECK ABC123)</li>
                      <li><strong>STATUS</strong> - View your bookings</li>
                      <li><strong>HELP</strong> - Get command list and help</li>
                      <li><strong>CANCEL</strong> - Exit current booking session</li>
                    </ul>
                    <p className="mb-2"><strong>Amharic Commands:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
                      <li><strong>መጽሐፍ</strong> (BOOK)</li>
                      <li><strong>ማረጋገጫ</strong> (CHECK)</li>
                      <li><strong>ሁኔታ</strong> (STATUS)</li>
                      <li><strong>እርዳታ</strong> (HELP)</li>
                      <li><strong>ሰርዝ</strong> (CANCEL)</li>
                    </ul>
                    <p className="text-sm text-muted-foreground">
                      Send "HELP" anytime to receive the full command list in both languages.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sms-4">
                  <AccordionTrigger>Do I need to create an account for SMS booking?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      <strong>No registration needed!</strong> When you book via SMS for the first time, we automatically create a "Guest User" account using just your phone number.
                    </p>
                    <p className="mb-2">
                      Your Guest Account:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Stores all your bookings and tickets</li>
                      <li>Allows you to check booking status via SMS</li>
                      <li>Keeps your travel history</li>
                      <li>Can be upgraded to a full account anytime by visiting our website</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sms-5">
                  <AccordionTrigger>How much do SMS messages cost?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      <strong>SMS charges apply based on your mobile operator's rates.</strong> i-Ticket does not charge for the SMS service itself - you only pay for the bus ticket (+ 5% service fee) and standard SMS rates.
                    </p>
                    <p className="mb-2">
                      Typical booking requires about 6-10 SMS messages (both sent and received). To minimize costs:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Use SMS bundles or unlimited SMS plans</li>
                      <li>Have all passenger information ready before starting</li>
                      <li>Complete booking in one session (sessions expire after 15 minutes of inactivity)</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sms-6">
                  <AccordionTrigger>How do I pay when booking via SMS?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      After confirming your booking, you'll receive an <strong>automatic payment prompt (MMI popup)</strong> directly on your phone.
                    </p>
                    <p className="mb-2">
                      Simply:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Wait for the payment prompt to appear on your screen</li>
                      <li>Review the amount</li>
                      <li>Enter your TeleBirr PIN when asked</li>
                      <li>Wait for confirmation SMS</li>
                    </ol>
                    <p className="mt-2">
                      <strong>No need to dial *127# or enter payment codes</strong> - the payment is initiated automatically for SMS bookings!
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sms-7">
                  <AccordionTrigger>What if my SMS session expires?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      SMS sessions expire after <strong>15 minutes of inactivity</strong> for security reasons.
                    </p>
                    <p className="mb-2">
                      If your session expires:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>You'll receive an SMS notification</li>
                      <li>Any incomplete booking will be cancelled automatically</li>
                      <li>Simply start a new session by sending a new command (e.g., BOOK, STATUS, HELP)</li>
                      <li>Your previous bookings and tickets are still saved and accessible</li>
                    </ul>
                    <p className="mt-2 text-sm text-green-600">
                      <strong>Tip:</strong> Have all passenger information ready before starting to complete booking within the 15-minute window.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Account & Security */}
            <div id="security" className="mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Account & Security
              </h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="sec-1">
                  <AccordionTrigger>How do I reset my password?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">To reset your password:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Go to the login page</li>
                      <li>Click "Forgot Password?"</li>
                      <li>Enter your registered phone number</li>
                      <li>You'll receive an OTP (One-Time Password) via SMS</li>
                      <li>Enter the OTP on the verification page</li>
                      <li>Create a new password (minimum 6 characters)</li>
                      <li>Confirm your new password</li>
                      <li>Log in with your new password</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sec-2">
                  <AccordionTrigger>Can I change my phone number?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      Phone number changes require manual verification for security. To change your phone number:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Contact customer support at support@i-ticket.et</li>
                      <li>Provide your current phone number and account details</li>
                      <li>Provide your new phone number</li>
                      <li>Complete identity verification</li>
                      <li>We'll update your account within 24-48 hours</li>
                    </ol>
                    <p className="mt-2 text-sm text-muted-foreground">
                      This process ensures account security and prevents unauthorized changes.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sec-3">
                  <AccordionTrigger>Is my personal information safe?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      <strong>Absolutely.</strong> We take data security very seriously:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>All data is encrypted using HTTPS/TLS 1.3</li>
                      <li>Passwords are hashed using bcrypt (we cannot see your actual password)</li>
                      <li>Strict access controls limit who can view your data</li>
                      <li>Regular security audits and monitoring</li>
                      <li>Compliance with international data protection standards</li>
                      <li>We never sell your personal information to third parties</li>
                    </ul>
                    <p className="mt-2">
                      Read our full <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> for details on how we protect your data.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sec-4">
                  <AccordionTrigger>Can I delete my account?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      Yes, you can request account deletion. Contact customer support at privacy@i-ticket.et with:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Your full name and phone number</li>
                      <li>Account email (if provided)</li>
                      <li>Reason for deletion (optional)</li>
                    </ul>
                    <p className="mt-2 mb-2"><strong>Important Notes:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Account deletion is permanent and cannot be undone</li>
                      <li>Active bookings must be completed or cancelled first</li>
                      <li>We may retain certain data for legal/regulatory compliance (tax records, etc.)</li>
                      <li>Processing takes 30 days to allow for recovery in case of accidental deletion</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sec-5">
                  <AccordionTrigger>What if I suspect unauthorized access to my account?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      If you notice suspicious activity or suspect unauthorized access:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li><strong>Immediately change your password</strong> using the "Forgot Password" feature</li>
                      <li>Review your recent bookings and transactions</li>
                      <li>Contact our security team at support@i-ticket.et with subject "Security Alert"</li>
                      <li>Provide details of the suspicious activity</li>
                    </ol>
                    <p className="mt-2">
                      We'll investigate immediately and take necessary actions to secure your account.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Support & Help */}
            <div id="support" className="mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-primary" />
                Support & Help
              </h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="sup-1">
                  <AccordionTrigger>How do I contact customer support?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">We're here to help! Contact us through:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li>
                        <strong>Email:</strong> support@i-ticket.et (Response within 24-48 hours)
                      </li>
                      <li>
                        <strong>Phone:</strong> +251-91-123-4567 (Mon-Sat, 8am-6pm EAT)
                      </li>
                      <li>
                        <strong>Contact Form:</strong> <Link href="/contact" className="text-primary hover:underline">Visit our contact page</Link>
                      </li>
                      <li>
                        <strong>Legal/Privacy:</strong> legal@i-ticket.et, privacy@i-ticket.et
                      </li>
                    </ul>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Urgent matters (payment issues, trip cancellations) receive priority handling.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sup-2">
                  <AccordionTrigger>What if I have a complaint about a bus company?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      For complaints about bus companies (service quality, driver behavior, bus condition, etc.):
                    </p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Contact us with your booking reference and details</li>
                      <li>We'll forward your complaint to the bus company</li>
                      <li>The bus company is required to respond within 72 hours</li>
                      <li>We'll follow up to ensure resolution</li>
                    </ol>
                    <p className="mt-2 text-sm text-muted-foreground">
                      While i-Ticket is a booking platform (not a transport provider), we work with bus companies to maintain service quality and resolve passenger issues.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sup-3">
                  <AccordionTrigger>Where can I report technical issues or bugs?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      If you encounter technical problems (website errors, payment failures, app crashes, etc.):
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Email: support@i-ticket.et with subject "Technical Issue"</li>
                      <li>Include: Description of the problem, device/browser, screenshots if possible</li>
                      <li>Our technical team will investigate and respond within 24 hours</li>
                    </ul>
                    <p className="mt-2">
                      Your feedback helps us improve the platform for all users!
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sup-4">
                  <AccordionTrigger>Do you offer customer support in Amharic?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      Yes! Our customer support team provides assistance in both <strong>English</strong> and <strong>Amharic</strong>.
                    </p>
                    <p>
                      When contacting us via phone or email, feel free to communicate in whichever language you're most comfortable with.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Contact CTA */}
            <div className="mt-10 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border-2 border-primary/20">
              <div className="text-center">
                <HelpCircle className="h-12 w-12 text-primary mx-auto mb-3" />
                <h3 className="text-xl font-bold mb-2">Still Have Questions?</h3>
                <p className="text-muted-foreground mb-4">
                  Our friendly support team is ready to help you with any questions or concerns.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button className="w-full sm:w-auto" asChild>
                    <Link href="/contact">
                      Contact Support
                    </Link>
                  </Button>
                  <a href="tel:+251911234567">
                    <Button variant="outline" className="w-full sm:w-auto">
                      Call +251-91-123-4567
                    </Button>
                  </a>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Monday - Saturday: 8:00 AM - 6:00 PM EAT
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Terms & Conditions - i-Ticket",
  description: "Comprehensive terms and conditions for using the i-Ticket bus booking platform",
}

export default function TermsPage() {
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
            <CardTitle className="text-4xl font-bold">Terms & Conditions</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Last updated: December 29, 2025 | Effective Date: January 1, 2024
            </p>
            <p className="text-xs text-muted-foreground mt-1 italic">
              Please read these Terms and Conditions carefully before using our service
            </p>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none pt-6">
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
              <p className="text-sm font-semibold text-amber-900 mb-2">Important Notice</p>
              <p className="text-sm text-amber-800">
                These Terms and Conditions constitute a legally binding agreement between you and i-Ticket.
                By accessing, browsing, or using our platform (whether via web, SMS, or any other channel),
                you acknowledge that you have read, understood, and agree to be bound by these terms.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4">1. Definitions and Interpretation</h2>
            <p>In these Terms and Conditions, unless the context otherwise requires:</p>
            <div className="bg-gray-50 p-4 rounded-md my-4">
              <ul className="space-y-2">
                <li><strong>"Platform"</strong> means the i-Ticket website, mobile applications, SMS booking service, and any other digital channels operated by i-Ticket.</li>
                <li><strong>"Service"</strong> means the bus ticket booking, payment processing, and related services provided by i-Ticket.</li>
                <li><strong>"User"</strong>, <strong>"You"</strong>, or <strong>"Your"</strong> means any person accessing or using the Platform, including Customers, Company Admins, and SMS Users.</li>
                <li><strong>"We"</strong>, <strong>"Us"</strong>, or <strong>"Our"</strong> means i-Ticket, a ticketing platform operator registered in Ethiopia.</li>
                <li><strong>"Bus Company"</strong> or <strong>"Transport Provider"</strong> means the licensed bus operators offering transportation services through our Platform.</li>
                <li><strong>"Booking"</strong> means a reservation for one or more seats on a specific trip.</li>
                <li><strong>"Ticket"</strong> means the electronic or SMS-delivered confirmation of a paid booking, including QR code or short code.</li>
                <li><strong>"TeleBirr"</strong> means the mobile payment service operated by Ethio Telecom used for payment processing.</li>
                <li><strong>"SMS Channel"</strong> means the text message-based booking service accessible via feature phones.</li>
                <li><strong>"Guest User"</strong> means a user created automatically via SMS booking without formal account registration.</li>
                <li><strong>"Service Fee"</strong> means the platform commission charge of 5% added to all bookings.</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4">2. Scope of Service</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Platform Role</h3>
            <p>
              i-Ticket operates as an <strong>intermediary technology platform</strong> that connects passengers with licensed bus companies.
              We facilitate bookings, process payments, and deliver tickets, but we are NOT a transportation provider. The actual
              transportation services are provided by independent Bus Companies.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Service Channels</h3>
            <p>Our Platform provides booking services through multiple channels:</p>
            <ul>
              <li><strong>Web Platform:</strong> Full-featured booking via our website with account management</li>
              <li><strong>SMS Channel:</strong> Text message-based booking for feature phone users (bilingual: English/Amharic)</li>
              <li><strong>Mobile Application:</strong> Progressive Web App (PWA) for smartphone users</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.3 No Guarantee of Availability</h3>
            <p>
              While we strive to maintain continuous service, we do not guarantee uninterrupted access to the Platform.
              Service may be temporarily unavailable due to maintenance, technical issues, or circumstances beyond our control.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">3. User Accounts and Registration</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Account Creation</h3>
            <p>To use certain features of the Platform, you must create an account by providing:</p>
            <ul>
              <li>Full legal name</li>
              <li>Valid Ethiopian phone number (09XX or 07XX format)</li>
              <li>Email address (optional but recommended)</li>
              <li>Secure password (minimum 6 characters)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Guest Users (SMS Channel)</h3>
            <p>
              Users booking via SMS are automatically registered as <strong>Guest Users</strong> using only their phone number.
              Guest Users can upgrade to full accounts by setting a password via the web platform.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Account Security</h3>
            <p>You are solely responsible for:</p>
            <ul>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access</li>
              <li>Ensuring your contact information is current and accurate</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.4 Eligibility</h3>
            <p>
              You must be at least <strong>18 years of age</strong> to create an account and make bookings.
              By registering, you represent and warrant that you meet this requirement.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.5 One Account Per User</h3>
            <p>
              Each user may maintain only one active account. Creating multiple accounts for fraudulent purposes is strictly prohibited.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">4. Booking Process and Policies</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Trip Search and Selection</h3>
            <p>
              Users may search for trips by specifying origin, destination, departure date, and optionally bus type or amenities.
              Search results display available trips based on real-time seat availability.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Booking Creation</h3>
            <p>When creating a booking, you must provide:</p>
            <ul>
              <li>Passenger full name(s) as shown on government-issued ID</li>
              <li>Passenger ID number (Kebele ID, Passport, or Driver's License)</li>
              <li>Valid phone number for each passenger</li>
              <li>Pickup and drop-off locations (may differ from origin/destination)</li>
              <li>Special needs or requirements (optional)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Multi-Passenger Bookings</h3>
            <p>
              You may book multiple seats in a single transaction. Each passenger will receive a separate ticket
              with a unique QR code or short code.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.4 Seat Assignment</h3>
            <p>
              Seats are assigned <strong>automatically</strong> in sequential order (A1, A2, A3, etc.) based on availability.
              Manual seat selection is not currently supported. Seat assignments are final and cannot be changed after booking.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.5 Booking Hold Period</h3>
            <p>
              Upon booking creation, seats are temporarily reserved for <strong>15 minutes</strong>. Payment must be completed
              within this window, or the booking will be <strong>automatically cancelled</strong> and seats released to other users.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.6 Booking Confirmation</h3>
            <p>
              A booking is confirmed ONLY upon successful payment. You will receive confirmation via:
            </p>
            <ul>
              <li>SMS to the registered phone number (immediate)</li>
              <li>Email (if provided)</li>
              <li>In-platform notification (web users)</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">5. Pricing and Payments</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Price Display</h3>
            <p>
              All prices are displayed in <strong>Ethiopian Birr (ETB)</strong> and are inclusive of applicable taxes.
              Prices are set by individual Bus Companies and may vary by route, departure time, and bus type.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Service Fee</h3>
            <p>
              A <strong>5% platform service fee</strong> is added to the base ticket price. This fee covers platform
              maintenance, payment processing, customer support, and technology infrastructure. The service fee is
              <strong>non-refundable</strong> under all circumstances.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
              <p className="text-sm text-blue-900">
                <strong>Example:</strong> If the base ticket price is 500 ETB, the total charge will be 525 ETB (500 + 5% service fee).
              </p>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.3 Payment Methods</h3>
            <p>Payments are processed through <strong>TeleBirr</strong> mobile money service. We support:</p>
            <ul>
              <li><strong>User-Initiated Payments:</strong> Web users dial *127# and enter payment code</li>
              <li><strong>Merchant-Initiated Payments:</strong> SMS users receive automatic payment prompts (MMI popup)</li>
              <li><strong>Demo Mode:</strong> Test payments for development and demonstration purposes (clearly marked)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.4 Payment Processing Time</h3>
            <p>
              Payments are processed in real-time. However, delays may occur due to network connectivity or TeleBirr service issues.
              If payment is not confirmed within <strong>5 minutes</strong>, the booking may be automatically cancelled.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.5 Payment Failure</h3>
            <p>
              If payment fails due to insufficient balance, incorrect PIN, or other errors, you may retry payment
              within the 15-minute booking hold period. After this period, you must create a new booking.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.6 Currency and Exchange Rates</h3>
            <p>
              All transactions are conducted in Ethiopian Birr (ETB). We do not accept foreign currencies or
              provide currency conversion services.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">6. Cancellations, Refunds, and Modifications</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Cancellation Policies</h3>
            <p>
              Cancellation policies are determined by <strong>individual Bus Companies</strong>. Generally, the following refund
              structure applies (subject to company-specific variations):
            </p>
            <div className="bg-gray-50 p-4 rounded-md my-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Cancellation Timing</th>
                    <th className="text-right py-2">Refund Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">More than 24 hours before departure</td>
                    <td className="text-right py-2 text-green-600 font-semibold">90% of base fare</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">12-24 hours before departure</td>
                    <td className="text-right py-2 text-yellow-600 font-semibold">50% of base fare</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Less than 12 hours before departure</td>
                    <td className="text-right py-2 text-red-600 font-semibold">No refund</td>
                  </tr>
                  <tr>
                    <td className="py-2">No-show (passenger doesn't board)</td>
                    <td className="text-right py-2 text-red-600 font-semibold">No refund</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Non-Refundable Service Fee</h3>
            <p>
              The 5% platform service fee is <strong>non-refundable</strong> under all circumstances, including cancellations,
              no-shows, trip delays, or any other reason.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.3 Refund Processing</h3>
            <p>
              Approved refunds are processed back to the original TeleBirr account within <strong>5-7 business days</strong>.
              Processing times may vary depending on TeleBirr's policies and technical factors.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.4 Booking Modifications</h3>
            <p>
              Booking modifications (date changes, passenger name changes, route changes) are <strong>not currently supported</strong>.
              To change booking details, you must cancel the existing booking (subject to cancellation fees) and create a new booking.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.5 Bus Company Cancellations</h3>
            <p>
              If a Bus Company cancels a trip due to mechanical issues, insufficient bookings, or other operational reasons,
              you are entitled to a <strong>full refund</strong> including the service fee. Refunds are processed automatically
              within 24 hours of cancellation.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.6 Weather and Force Majeure</h3>
            <p>
              Trips cancelled due to extreme weather, natural disasters, government restrictions, or other force majeure events
              qualify for full refunds. However, neither i-Ticket nor Bus Companies are liable for consequential damages.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">7. Tickets and Travel</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">7.1 Ticket Delivery</h3>
            <p>
              Upon successful payment, tickets are delivered immediately via:
            </p>
            <ul>
              <li><strong>SMS:</strong> Short code (6 alphanumeric characters) for feature phone users</li>
              <li><strong>Web/App:</strong> QR code downloadable from your account dashboard</li>
              <li><strong>Email:</strong> PDF attachment (if email provided)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.2 Ticket Validity</h3>
            <p>
              Each ticket is valid ONLY for the specific trip, date, time, and passenger for which it was issued.
              Tickets are <strong>non-transferable</strong> and cannot be used by anyone other than the named passenger.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.3 Boarding Requirements</h3>
            <p>
              To board the bus, passengers must present:
            </p>
            <ul>
              <li>Valid ticket (QR code or short code)</li>
              <li>Government-issued photo ID matching the name on the ticket</li>
            </ul>
            <p>
              Passengers who cannot provide valid identification matching their ticket will be <strong>denied boarding</strong>
              without refund.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.4 Arrival Time</h3>
            <p>
              Passengers must arrive at the departure point at least <strong>15 minutes before</strong> the scheduled departure time.
              Buses may depart on time, and late passengers will not receive refunds.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.5 Ticket Verification</h3>
            <p>
              Bus conductors will scan QR codes or verify short codes using our verification system. Each ticket can be
              verified only <strong>once</strong>. Attempting to use the same ticket multiple times is prohibited and may
              result in account suspension.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.6 Lost Tickets</h3>
            <p>
              If you lose your ticket, you can retrieve it from your account dashboard (web users) or request resending via
              SMS (SMS users). Contact customer support for assistance.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">8. SMS Channel Specific Terms</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">8.1 SMS Booking Service</h3>
            <p>
              Our SMS channel enables feature phone users to search, book, pay, and receive tickets entirely via text messages
              in English or Amharic.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.2 Supported Commands</h3>
            <p>
              Users can send SMS commands to our shortcode to perform various actions:
            </p>
            <ul>
              <li><strong>BOOK</strong> - Search and book trips</li>
              <li><strong>CHECK</strong> - Verify ticket status</li>
              <li><strong>STATUS</strong> - View your bookings</li>
              <li><strong>HELP</strong> - Get help and command list</li>
              <li><strong>CANCEL</strong> - Exit current session</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.3 SMS Session Management</h3>
            <p>
              SMS conversations are managed through sessions that expire after <strong>15 minutes of inactivity</strong>.
              You can restart a session at any time by sending a new command.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.4 SMS Charges</h3>
            <p>
              Standard SMS rates from your mobile operator apply to all messages sent to and from the i-Ticket SMS service.
              We recommend using SMS bundles or unlimited SMS plans to minimize costs.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.5 Automatic Account Creation</h3>
            <p>
              When you book via SMS for the first time, a Guest User account is automatically created using your phone number.
              You can upgrade to a full account by visiting our website.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">9. User Obligations and Prohibited Conduct</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">9.1 Accurate Information</h3>
            <p>
              You agree to provide truthful, accurate, and complete information when creating bookings. Providing false
              information may result in booking cancellation and account termination.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">9.2 Prohibited Activities</h3>
            <p>
              You agree NOT to:
            </p>
            <ul>
              <li>Use the Platform for any unlawful purpose</li>
              <li>Resell tickets at inflated prices (ticket scalping)</li>
              <li>Create fraudulent bookings or reservations</li>
              <li>Attempt to access other users' accounts</li>
              <li>Reverse engineer, decompile, or hack the Platform</li>
              <li>Use automated bots or scripts to make bulk bookings</li>
              <li>Share your account credentials with others</li>
              <li>Circumvent payment processing or booking systems</li>
              <li>Submit false reviews or complaints</li>
              <li>Harass, threaten, or abuse Bus Company staff or other passengers</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">9.3 Compliance with Laws</h3>
            <p>
              You agree to comply with all applicable Ethiopian laws and regulations when using the Platform and traveling
              with Bus Companies.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">9.4 Luggage and Prohibited Items</h3>
            <p>
              You must comply with Bus Company policies regarding luggage allowances and prohibited items. Common restrictions include:
            </p>
            <ul>
              <li>Weapons, explosives, or flammable materials</li>
              <li>Illegal drugs or controlled substances</li>
              <li>Live animals (except service animals with documentation)</li>
              <li>Excessive or oversized luggage</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">10. Intellectual Property Rights</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">10.1 Platform Ownership</h3>
            <p>
              All intellectual property rights in the Platform, including but not limited to trademarks, logos, source code,
              design, content, and algorithms, are owned by i-Ticket or our licensors.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">10.2 Limited License</h3>
            <p>
              We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Platform
              for personal, non-commercial purposes. This license does not include any rights to:
            </p>
            <ul>
              <li>Modify, copy, or distribute Platform content</li>
              <li>Create derivative works based on the Platform</li>
              <li>Use the Platform for commercial purposes without written permission</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">10.3 User-Generated Content</h3>
            <p>
              By submitting reviews, feedback, or other content to the Platform, you grant i-Ticket a perpetual, worldwide,
              royalty-free license to use, display, and distribute such content.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">11. Disclaimers and Limitation of Liability</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">11.1 Platform "As Is"</h3>
            <p>
              The Platform is provided <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> without warranties of any kind,
              whether express or implied, including but not limited to warranties of merchantability, fitness for a particular
              purpose, or non-infringement.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">11.2 No Responsibility for Transportation</h3>
            <p>
              <strong>IMPORTANT:</strong> i-Ticket is NOT a transportation provider. We are an intermediary platform. We are
              <strong>NOT responsible or liable</strong> for:
            </p>
            <ul>
              <li>Trip delays, cancellations, or schedule changes by Bus Companies</li>
              <li>Quality, safety, or condition of buses</li>
              <li>Behavior or conduct of drivers, conductors, or other passengers</li>
              <li>Accidents, injuries, or death during travel</li>
              <li>Loss, damage, or theft of luggage or personal belongings</li>
              <li>Route changes or detours made by Bus Companies</li>
              <li>Failure of Bus Companies to comply with regulations</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">11.3 Third-Party Services</h3>
            <p>
              We are not responsible for failures or issues with third-party services including TeleBirr, SMS gateways,
              or internet service providers.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">11.4 Maximum Liability Cap</h3>
            <p>
              To the maximum extent permitted by Ethiopian law, our total liability to you for any claims arising from or
              related to the Platform shall not exceed the amount of <strong>service fees</strong> paid by you in the
              12 months preceding the claim.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">11.5 Consequential Damages</h3>
            <p>
              We shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including
              but not limited to loss of profits, data, goodwill, or other intangible losses.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">12. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless i-Ticket, its officers, directors, employees, agents, and
              affiliates from and against any and all claims, liabilities, damages, losses, costs, expenses, or fees
              (including reasonable attorneys' fees) arising from:
            </p>
            <ul>
              <li>Your violation of these Terms and Conditions</li>
              <li>Your violation of any rights of third parties</li>
              <li>Your use or misuse of the Platform</li>
              <li>Your breach of applicable laws or regulations</li>
              <li>Your negligent or willful misconduct</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">13. Privacy and Data Protection</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">13.1 Privacy Policy</h3>
            <p>
              Your use of the Platform is also governed by our{" "}
              <Link href="/privacy" className="text-primary hover:underline font-semibold">Privacy Policy</Link>,
              which describes how we collect, use, store, and protect your personal information.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">13.2 Data Collection</h3>
            <p>
              We collect personal information including name, phone number, email, ID numbers, and payment information
              to provide booking services. By using the Platform, you consent to this data collection.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">13.3 Data Sharing</h3>
            <p>
              We share necessary booking information with Bus Companies to facilitate your travel. We do not sell your
              personal data to third parties.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">14. Account Termination</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">14.1 Termination by User</h3>
            <p>
              You may terminate your account at any time by contacting customer support. Termination does not affect
              existing bookings or refund obligations.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">14.2 Termination by i-Ticket</h3>
            <p>
              We reserve the right to suspend or terminate your account immediately, without prior notice, if you:
            </p>
            <ul>
              <li>Violate these Terms and Conditions</li>
              <li>Engage in fraudulent or illegal activities</li>
              <li>Abuse the Platform or harass other users</li>
              <li>Fail to pay for confirmed bookings</li>
              <li>Create multiple accounts to circumvent restrictions</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">14.3 Effects of Termination</h3>
            <p>
              Upon termination, your access to the Platform will cease. Outstanding payment obligations survive termination.
              We may retain your data as required by law or for legitimate business purposes.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">15. Force Majeure</h2>
            <p>
              Neither party shall be liable for any failure or delay in performance due to circumstances beyond their
              reasonable control, including but not limited to:
            </p>
            <ul>
              <li>Natural disasters (earthquakes, floods, fires)</li>
              <li>War, terrorism, or civil unrest</li>
              <li>Government actions or regulations</li>
              <li>Telecommunications or internet failures</li>
              <li>Pandemics or epidemics</li>
              <li>Power outages or utility failures</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">16. Dispute Resolution and Governing Law</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">16.1 Governing Law</h3>
            <p>
              These Terms and Conditions shall be governed by and construed in accordance with the laws of the
              <strong> Federal Democratic Republic of Ethiopia</strong>, without regard to conflict of law principles.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">16.2 Informal Resolution</h3>
            <p>
              In the event of any dispute, claim, or controversy arising from these Terms, the parties agree to first
              attempt to resolve the matter informally through good faith negotiations.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">16.3 Mediation</h3>
            <p>
              If informal resolution fails, the parties agree to submit the dispute to mediation before pursuing litigation.
              Mediation shall be conducted in Addis Ababa, Ethiopia.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">16.4 Jurisdiction</h3>
            <p>
              Any legal action or proceeding arising from these Terms shall be brought exclusively in the courts of
              Addis Ababa, Ethiopia, and you consent to the personal jurisdiction of such courts.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">17. Modification of Terms</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">17.1 Right to Modify</h3>
            <p>
              We reserve the right to modify, amend, or update these Terms and Conditions at any time at our sole discretion.
              Changes may be made to reflect new features, legal requirements, or business needs.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">17.2 Notice of Changes</h3>
            <p>
              Material changes to these Terms will be communicated via:
            </p>
            <ul>
              <li>Email notification to registered users</li>
              <li>SMS notification (for SMS channel users)</li>
              <li>Prominent notice on the Platform homepage</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">17.3 Acceptance of Changes</h3>
            <p>
              Your continued use of the Platform after the effective date of modified Terms constitutes your acceptance
              of the changes. If you do not agree to the modifications, you must discontinue use of the Platform.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">18. General Provisions</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">18.1 Entire Agreement</h3>
            <p>
              These Terms and Conditions, together with our Privacy Policy, constitute the entire agreement between you
              and i-Ticket regarding use of the Platform and supersede all prior agreements.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">18.2 Severability</h3>
            <p>
              If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions
              shall continue in full force and effect.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">18.3 Waiver</h3>
            <p>
              Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right
              or provision.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">18.4 Assignment</h3>
            <p>
              You may not assign or transfer your rights or obligations under these Terms without our prior written consent.
              We may assign our rights and obligations without restriction.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">18.5 Language</h3>
            <p>
              These Terms are provided in English. In the event of any conflict between English and translated versions,
              the English version shall prevail.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">18.6 Headings</h3>
            <p>
              Section headings are for convenience only and do not affect the interpretation of these Terms.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">19. Customer Support and Contact Information</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">19.1 Support Channels</h3>
            <p>
              For questions, concerns, or disputes regarding these Terms or the Platform, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg my-4">
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-gray-700">Email:</p>
                  <p className="text-primary">legal@i-ticket.et</p>
                  <p className="text-primary">support@i-ticket.et</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Phone:</p>
                  <p>+251-91-123-4567 (Customer Support)</p>
                  <p>+251-91-123-4568 (Legal Department)</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Office Address:</p>
                  <p>i-Ticket Platform Services</p>
                  <p>Bole Road, Addis Ababa</p>
                  <p>Ethiopia</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Business Hours:</p>
                  <p>Monday - Friday: 8:00 AM - 6:00 PM EAT</p>
                  <p>Saturday: 9:00 AM - 1:00 PM EAT</p>
                  <p>Sunday: Closed</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Online:</p>
                  <p>
                    <Link href="/contact" className="text-primary hover:underline">Contact Form</Link>
                  </p>
                  <p>
                    <Link href="/faq" className="text-primary hover:underline">Frequently Asked Questions</Link>
                  </p>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">19.2 Response Time</h3>
            <p>
              We strive to respond to all inquiries within <strong>24-48 hours</strong> during business days.
              Urgent matters (payment issues, trip cancellations) receive priority handling.
            </p>

            <div className="bg-primary/5 border-2 border-primary/20 p-6 rounded-lg mt-8">
              <p className="font-semibold text-lg mb-3">Acknowledgment</p>
              <p className="text-sm">
                BY CLICKING "I ACCEPT" OR BY ACCESSING OR USING THE PLATFORM, YOU ACKNOWLEDGE THAT YOU HAVE READ,
                UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS AND CONDITIONS. IF YOU DO NOT AGREE TO THESE TERMS,
                YOU MUST NOT USE THE PLATFORM.
              </p>
            </div>

            <div className="text-center text-xs text-muted-foreground mt-8 pt-6 border-t">
              <p>© 2024-2025 i-Ticket Platform Services. All rights reserved.</p>
              <p className="mt-2">Document Version 2.0 | Effective Date: January 1, 2024 | Last Updated: December 29, 2025</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Privacy Policy - i-Ticket",
  description: "Comprehensive privacy policy explaining how i-Ticket collects, uses, protects, and manages your personal information",
}

export default function PrivacyPage() {
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
            <CardTitle className="text-4xl font-bold">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Last updated: December 29, 2025 | Effective Date: January 1, 2024
            </p>
            <p className="text-xs text-muted-foreground mt-1 italic">
              Your privacy is important to us. This policy explains how we handle your personal information.
            </p>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none pt-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-sm font-semibold text-blue-900 mb-2">Privacy Commitment</p>
              <p className="text-sm text-blue-800">
                i-Ticket is committed to protecting your privacy and ensuring the security of your personal information.
                This Privacy Policy explains what data we collect, why we collect it, how we use it, and your rights
                regarding your personal data. By using our Platform, you consent to the practices described in this policy.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4">1. Introduction and Scope</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">1.1 About This Policy</h3>
            <p>
              This Privacy Policy applies to all personal information collected through the i-Ticket platform, including:
            </p>
            <ul>
              <li>Website (www.i-ticket.et)</li>
              <li>Mobile applications and Progressive Web App (PWA)</li>
              <li>SMS booking service</li>
              <li>Customer support channels (email, phone, chat)</li>
              <li>Any other digital channels operated by i-Ticket</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">1.2 Policy Updates</h3>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology,
              legal requirements, or business operations. The "Last Updated" date at the top indicates when this
              policy was last revised.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">2. Data Controller Information</h2>
            <div className="bg-gray-50 p-4 rounded-md my-4">
              <p className="font-semibold mb-2">Data Controller:</p>
              <p>i-Ticket Platform Services</p>
              <p>Bole Road, Addis Ababa, Ethiopia</p>
              <p className="mt-3"><strong>Data Protection Officer:</strong></p>
              <p>Email: privacy@i-ticket.et</p>
              <p>Phone: +251-91-123-4568</p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4">3. Information We Collect</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Personal Identification Information</h3>
            <p>We collect the following personal information when you create an account or make a booking:</p>
            <div className="bg-gray-50 p-4 rounded-md my-4">
              <ul className="space-y-2">
                <li><strong>Full Name:</strong> Your legal name as it appears on government-issued identification</li>
                <li><strong>Phone Number:</strong> Ethiopian mobile number (09XX or 07XX format) used for authentication and communication</li>
                <li><strong>Email Address:</strong> Optional but recommended for booking confirmations and account recovery</li>
                <li><strong>ID Number:</strong> Government-issued identification number (Kebele ID, Passport, or Driver's License) for ticket verification</li>
                <li><strong>Date of Birth:</strong> To verify eligibility (18+ years) and for age-specific services</li>
                <li><strong>Gender:</strong> For service personalization and statistical analysis</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Emergency Contact Information</h3>
            <p>We collect next of kin information for safety and emergency purposes:</p>
            <ul>
              <li>Emergency contact name</li>
              <li>Relationship to passenger</li>
              <li>Emergency contact phone number</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Booking and Travel Information</h3>
            <p>When you make a booking, we collect:</p>
            <ul>
              <li>Origin and destination cities</li>
              <li>Departure date and time preferences</li>
              <li>Pickup and drop-off locations (may differ from origin/destination)</li>
              <li>Number of passengers and their details (for multi-passenger bookings)</li>
              <li>Seat assignments (automatically generated)</li>
              <li>Special needs or requirements (wheelchair access, dietary restrictions, etc.)</li>
              <li>Booking preferences (bus type, amenities)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.4 Payment Information</h3>
            <p>
              Payment transactions are processed through <strong>TeleBirr</strong>, a third-party payment processor.
              We collect limited payment information:
            </p>
            <ul>
              <li>TeleBirr phone number (wallet ID)</li>
              <li>Transaction reference numbers</li>
              <li>Payment amount and timestamp (including base fare, 5% service charge, and 15% VAT on service charge)</li>
              <li>Payment status (successful, failed, pending)</li>
            </ul>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-4">
              <p className="text-sm text-amber-900 mb-2">
                <strong>Important:</strong> We do NOT store your TeleBirr PIN, credit card numbers, or full financial
                account details. Payment processing is handled securely by TeleBirr with industry-standard encryption.
              </p>
              <p className="text-sm text-amber-800">
                <strong>Payment Structure:</strong> All payments include the base ticket price + 5% service charge + 15% VAT
                (calculated on the service charge). For example, a 500 ETB ticket costs 528.75 ETB total (500 + 25 + 3.75).
              </p>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.5 Account Credentials</h3>
            <ul>
              <li><strong>Password:</strong> Stored as a cryptographic hash (bcrypt) - we cannot see your actual password</li>
              <li><strong>Account role:</strong> Customer, Company Admin, or Super Admin</li>
              <li><strong>Account status:</strong> Active, suspended, or deleted</li>
              <li><strong>Guest user flag:</strong> Indicates if account was created via SMS booking</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.6 Technical and Usage Data</h3>
            <p>We automatically collect certain technical information when you use our Platform:</p>
            <ul>
              <li><strong>Device Information:</strong> Device type, operating system, browser type and version, screen resolution</li>
              <li><strong>Connection Information:</strong> IP address, internet service provider, mobile network operator</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent on platform, search queries, booking patterns</li>
              <li><strong>Session Data:</strong> Login/logout times, session duration, authentication tokens</li>
              <li><strong>Error Logs:</strong> Technical errors, crashes, or bugs encountered</li>
              <li><strong>Performance Metrics:</strong> Page load times, API response times, platform performance</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.7 SMS Channel Data</h3>
            <p>When you use our SMS booking service, we collect:</p>
            <ul>
              <li>SMS messages sent to and from our platform</li>
              <li>SMS session states and conversation history</li>
              <li>Language preference (English or Amharic)</li>
              <li>SMS delivery status and timestamps</li>
              <li>Command usage patterns</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.8 Communications Data</h3>
            <ul>
              <li>Customer support inquiries and responses</li>
              <li>Feedback, reviews, and ratings</li>
              <li>Survey responses and preferences</li>
              <li>Email correspondence</li>
              <li>SMS notifications and confirmations</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.9 Location Data</h3>
            <p>
              We collect location data ONLY in the form of city names (origin/destination) that you manually enter
              when searching for trips. We do NOT track your real-time GPS location unless you explicitly enable
              location services in your device for address autocomplete.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">4. How We Collect Your Information</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Information You Provide Directly</h3>
            <ul>
              <li>Account registration forms (web and SMS)</li>
              <li>Booking forms and passenger information</li>
              <li>Profile updates and settings changes</li>
              <li>Customer support requests</li>
              <li>Survey and feedback forms</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Information Collected Automatically</h3>
            <ul>
              <li>Cookies and similar tracking technologies</li>
              <li>Server logs and analytics</li>
              <li>Session management systems</li>
              <li>Error monitoring and debugging tools</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Information from Third Parties</h3>
            <ul>
              <li><strong>TeleBirr:</strong> Payment confirmation and transaction status</li>
              <li><strong>SMS Gateways:</strong> Message delivery status and metadata</li>
              <li><strong>Bus Companies:</strong> Trip updates, cancellations, or schedule changes</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">5. Legal Basis for Processing Your Data</h2>
            <p>We process your personal information based on the following legal grounds:</p>
            <div className="bg-gray-50 p-4 rounded-md my-4">
              <ul className="space-y-3">
                <li>
                  <strong>Contractual Necessity:</strong> Processing required to fulfill our booking service contract with you
                  (e.g., creating bookings, processing payments, delivering tickets)
                </li>
                <li>
                  <strong>Legal Obligation:</strong> Processing required to comply with Ethiopian laws, tax regulations,
                  anti-fraud measures, and court orders
                </li>
                <li>
                  <strong>Legitimate Interests:</strong> Processing necessary for our business operations, including fraud
                  prevention, security, platform improvement, and customer support
                </li>
                <li>
                  <strong>Consent:</strong> For optional features like marketing communications, you provide explicit consent
                  which can be withdrawn at any time
                </li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4">6. How We Use Your Information</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Primary Service Delivery</h3>
            <ul>
              <li><strong>Booking Management:</strong> Create, process, confirm, and manage bus ticket bookings</li>
              <li><strong>Ticket Generation:</strong> Generate QR codes and short codes for ticket verification</li>
              <li><strong>Payment Processing:</strong> Facilitate secure payments through TeleBirr</li>
              <li><strong>Trip Coordination:</strong> Share passenger details with Bus Companies for trip management</li>
              <li><strong>Seat Assignment:</strong> Automatically assign seats based on availability</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Communication and Notifications</h3>
            <ul>
              <li>Send booking confirmations via SMS and email</li>
              <li>Deliver tickets immediately after payment</li>
              <li>Notify about trip updates, delays, or cancellations</li>
              <li>Send payment receipts and invoices</li>
              <li>Provide customer support responses</li>
              <li>Send account security alerts</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.3 Platform Improvement and Analytics</h3>
            <ul>
              <li>Analyze usage patterns to improve user experience</li>
              <li>Identify and fix technical issues and bugs</li>
              <li>Optimize platform performance and speed</li>
              <li>Understand popular routes and travel trends</li>
              <li>Develop new features based on user behavior</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.4 Security and Fraud Prevention</h3>
            <ul>
              <li>Detect and prevent fraudulent bookings</li>
              <li>Monitor for suspicious account activity</li>
              <li>Prevent ticket scalping and reselling</li>
              <li>Verify user identity during high-risk transactions</li>
              <li>Protect against unauthorized access and hacking</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.5 Legal and Regulatory Compliance</h3>
            <ul>
              <li>Comply with Ethiopian transportation and tax laws</li>
              <li>Respond to law enforcement requests</li>
              <li>Enforce our Terms and Conditions</li>
              <li>Maintain financial records for accounting and audits</li>
              <li>Resolve disputes and legal claims</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.6 Marketing and Promotional Activities (With Consent)</h3>
            <ul>
              <li>Send promotional offers and discounts (opt-in only)</li>
              <li>Notify about new routes or bus companies</li>
              <li>Conduct customer satisfaction surveys</li>
              <li>Invite participation in loyalty programs</li>
            </ul>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 my-4">
              <p className="text-sm text-green-900">
                <strong>Marketing Opt-Out:</strong> You can opt out of marketing communications at any time by clicking
                "Unsubscribe" in emails or replying "STOP" to SMS messages. This will not affect essential service
                communications (booking confirmations, trip updates, etc.).
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4">7. Information Sharing and Disclosure</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">7.1 Bus Companies (Transport Providers)</h3>
            <p>
              We share necessary passenger information with Bus Companies to facilitate your travel:
            </p>
            <ul>
              <li>Passenger names and ID numbers</li>
              <li>Seat assignments</li>
              <li>Pickup and drop-off locations</li>
              <li>Special needs or requirements</li>
              <li>Contact information for trip coordination</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.2 Payment Processors</h3>
            <p>
              Payment information is shared with <strong>TeleBirr</strong> to process transactions securely.
              TeleBirr has its own privacy policy governing how they handle payment data.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.3 SMS Gateway Providers</h3>
            <p>
              For SMS booking services, we share phone numbers and message content with SMS gateway providers
              (Negarit SMS, GeezSMS) for message delivery.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.4 Law Enforcement and Legal Authorities</h3>
            <p>We may disclose your information to law enforcement or government authorities when:</p>
            <ul>
              <li>Required by law, court order, or legal process</li>
              <li>Necessary to protect our rights, property, or safety</li>
              <li>Needed to prevent fraud, abuse, or illegal activities</li>
              <li>Required for national security or public safety</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.5 Business Transfers</h3>
            <p>
              In the event of a merger, acquisition, or sale of assets, your personal information may be transferred
              to the acquiring entity. We will notify you before your data is transferred and becomes subject to a
              different privacy policy.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.6 Service Providers and Vendors</h3>
            <p>
              We may share data with trusted service providers who assist in operating our platform:
            </p>
            <ul>
              <li>Cloud hosting providers (database and server infrastructure)</li>
              <li>Analytics and monitoring services</li>
              <li>Customer support tools</li>
              <li>Email delivery services</li>
            </ul>
            <p>
              These service providers are contractually obligated to protect your data and can only use it for
              providing services to i-Ticket.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.7 What We Never Do</h3>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
              <p className="text-sm font-semibold text-red-900 mb-2">We NEVER:</p>
              <ul className="text-sm text-red-800 space-y-1">
                <li>✗ Sell your personal information to third parties</li>
                <li>✗ Share your data with advertisers or marketers</li>
                <li>✗ Use your data for purposes unrelated to our services</li>
                <li>✗ Share your information publicly without your consent</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4">8. Data Security Measures</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">8.1 Technical Security</h3>
            <ul>
              <li><strong>Encryption in Transit:</strong> All data transmitted between your device and our servers is encrypted using HTTPS/TLS 1.3</li>
              <li><strong>Encryption at Rest:</strong> Sensitive data stored in databases is encrypted</li>
              <li><strong>Password Security:</strong> Passwords are hashed using bcrypt with industry-standard salt rounds</li>
              <li><strong>API Security:</strong> Authentication tokens, rate limiting, and input validation on all API endpoints</li>
              <li><strong>Database Security:</strong> Firewall protection, access controls, and regular security patches</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.2 Organizational Security</h3>
            <ul>
              <li><strong>Access Control:</strong> Role-based access control (RBAC) limiting employee access to data</li>
              <li><strong>Background Checks:</strong> Security screening for employees with access to sensitive data</li>
              <li><strong>Training:</strong> Regular security and privacy training for all staff</li>
              <li><strong>Data Minimization:</strong> We collect only the data necessary for our services</li>
              <li><strong>Monitoring:</strong> 24/7 security monitoring and intrusion detection</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.3 Physical Security</h3>
            <ul>
              <li>Secure data centers with physical access controls</li>
              <li>Redundant backup systems and disaster recovery plans</li>
              <li>Environmental controls (fire suppression, climate control)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.4 Security Incidents</h3>
            <p>
              In the event of a data breach or security incident that affects your personal information, we will:
            </p>
            <ul>
              <li>Notify affected users within 72 hours of discovery</li>
              <li>Describe the nature and extent of the breach</li>
              <li>Provide guidance on protective measures you can take</li>
              <li>Report the incident to relevant authorities as required by law</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">9. Data Retention Periods</h2>
            <div className="bg-gray-50 p-4 rounded-md my-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Data Type</th>
                    <th className="text-left py-2">Retention Period</th>
                    <th className="text-left py-2">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Account Information</td>
                    <td className="py-2">Active account + 3 years</td>
                    <td className="py-2">Legal compliance, dispute resolution</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Booking Records</td>
                    <td className="py-2">5 years</td>
                    <td className="py-2">Tax, accounting, legal requirements</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Payment Transactions</td>
                    <td className="py-2">7 years</td>
                    <td className="py-2">Financial regulations, audits</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">SMS Session Data</td>
                    <td className="py-2">30 days</td>
                    <td className="py-2">Service improvement, debugging</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Support Communications</td>
                    <td className="py-2">2 years</td>
                    <td className="py-2">Quality assurance, dispute resolution</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Usage Analytics</td>
                    <td className="py-2">1 year</td>
                    <td className="py-2">Platform improvement, trend analysis</td>
                  </tr>
                  <tr>
                    <td className="py-2">Deleted Account Data</td>
                    <td className="py-2">30 days backup retention</td>
                    <td className="py-2">Account recovery, accidental deletion</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              After retention periods expire, we securely delete or anonymize your data so it can no longer identify you.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">10. Your Privacy Rights</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">10.1 Right to Access</h3>
            <p>
              You have the right to request a copy of all personal information we hold about you. We will provide this
              information in a structured, commonly used, machine-readable format (e.g., JSON, CSV, PDF).
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">10.2 Right to Rectification</h3>
            <p>
              You can update or correct inaccurate personal information at any time through your account settings.
              If you encounter issues, contact our support team.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">10.3 Right to Erasure (Right to be Forgotten)</h3>
            <p>
              You can request deletion of your personal data, subject to certain exceptions:
            </p>
            <ul>
              <li>We may retain data required by law (tax, financial records)</li>
              <li>We may retain data needed to resolve disputes or enforce agreements</li>
              <li>Anonymized data used for analytics may be retained</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">10.4 Right to Data Portability</h3>
            <p>
              You can request an export of your personal data in a portable format to transfer to another service provider.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">10.5 Right to Object</h3>
            <p>
              You can object to processing of your data for:
            </p>
            <ul>
              <li>Marketing purposes (opt-out anytime)</li>
              <li>Automated decision-making or profiling</li>
              <li>Processing based on legitimate interests (subject to legal override)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">10.6 Right to Restriction</h3>
            <p>
              You can request temporary restriction of data processing while we verify accuracy or assess legitimate grounds.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">10.7 Right to Withdraw Consent</h3>
            <p>
              For processing based on consent (e.g., marketing), you can withdraw consent at any time without affecting
              the lawfulness of processing before withdrawal.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">10.8 How to Exercise Your Rights</h3>
            <p>To exercise any of these rights:</p>
            <ul>
              <li>Email: <strong>privacy@i-ticket.et</strong> with subject "Privacy Rights Request"</li>
              <li>Include your full name, phone number, and account email</li>
              <li>Specify which right you wish to exercise</li>
              <li>Provide any necessary details or documentation</li>
            </ul>
            <p>
              We will respond to your request within <strong>30 days</strong>. If we need additional time, we will
              notify you and explain the reason for the delay.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">11. Cookies and Tracking Technologies</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">11.1 Types of Cookies We Use</h3>
            <div className="bg-gray-50 p-4 rounded-md my-4">
              <ul className="space-y-3">
                <li>
                  <strong>Essential Cookies (Required):</strong> Necessary for platform functionality including
                  authentication, session management, and security. You cannot disable these cookies.
                </li>
                <li>
                  <strong>Performance Cookies (Optional):</strong> Help us understand how users interact with the
                  platform to improve performance and user experience.
                </li>
                <li>
                  <strong>Functional Cookies (Optional):</strong> Remember your preferences (language, recent searches)
                  to provide enhanced features.
                </li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> We do NOT use advertising cookies, third-party tracking cookies, or cross-site cookies.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">11.2 Cookie Management</h3>
            <p>
              You can control cookies through your browser settings. Most browsers allow you to:
            </p>
            <ul>
              <li>View and delete cookies</li>
              <li>Block third-party cookies</li>
              <li>Block all cookies (may affect platform functionality)</li>
              <li>Receive notifications when cookies are set</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">12. SMS Channel Privacy</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">12.1 SMS Data Collection</h3>
            <p>
              When you use our SMS booking service, we collect:
            </p>
            <ul>
              <li>Phone number (your unique identifier)</li>
              <li>SMS message content (commands and responses)</li>
              <li>Conversation state and session history</li>
              <li>Language preference (English or Amharic)</li>
              <li>Timestamp of each message</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">12.2 Guest User Accounts</h3>
            <p>
              First-time SMS users are automatically registered as "Guest Users" with minimal data (phone number only).
              Guest Users can upgrade to full accounts by visiting our website and setting a password.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">12.3 SMS Privacy Best Practices</h3>
            <ul>
              <li>SMS sessions expire after 15 minutes of inactivity for security</li>
              <li>Sensitive information (tickets, booking details) are sent only to verified numbers</li>
              <li>You can delete SMS session history by contacting support</li>
              <li>Standard SMS rates apply (charged by your mobile operator, not i-Ticket)</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">13. Third-Party Services</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">13.1 TeleBirr Payment Service</h3>
            <p>
              Payment processing is handled by TeleBirr (operated by Ethio Telecom). TeleBirr has its own privacy
              policy governing payment data. We recommend reviewing their privacy policy at their official website.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">13.2 SMS Gateway Providers</h3>
            <p>
              We use Ethiopian SMS gateway providers (Negarit SMS, GeezSMS) for message delivery. These providers
              have access to phone numbers and message content but are contractually prohibited from using this data
              for other purposes.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">13.3 Third-Party Links</h3>
            <p>
              Our platform may contain links to Bus Company websites or other third-party sites. We are not responsible
              for the privacy practices of these external sites. Please review their privacy policies before sharing
              personal information.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">14. Children's Privacy</h2>
            <p>
              Our service is not directed to individuals under <strong>18 years of age</strong>. We do not knowingly
              collect personal information from minors. If you are a parent or guardian and believe your child has
              provided us with personal information, please contact us immediately at privacy@i-ticket.et, and we will
              delete the information promptly.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">15. Automated Decision-Making and Profiling</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">15.1 Automated Processes</h3>
            <p>
              We use automated systems for:
            </p>
            <ul>
              <li><strong>Seat Assignment:</strong> Automatically assigns seats sequentially (A1, A2, A3, etc.)</li>
              <li><strong>Fraud Detection:</strong> Flags suspicious booking patterns for manual review</li>
              <li><strong>Payment Verification:</strong> Automatically confirms payments via TeleBirr callbacks</li>
              <li><strong>Booking Cancellation:</strong> Automatically cancels unpaid bookings after 10 minutes</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">15.2 No Profiling for Discriminatory Purposes</h3>
            <p>
              We do NOT use automated profiling to:
            </p>
            <ul>
              <li>Discriminate based on race, gender, religion, or other protected characteristics</li>
              <li>Charge different prices to different users for the same service</li>
              <li>Deny service based on automated scoring or profiling</li>
            </ul>
            <p>
              You have the right to request human review of any automated decision that significantly affects you.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">16. International Data Transfers</h2>
            <p>
              Your personal data is primarily stored and processed in <strong>Ethiopia</strong>. We use cloud hosting
              providers that may store backup data in secure data centers outside Ethiopia. These providers are
              contractually obligated to maintain equivalent data protection standards.
            </p>
            <p>
              If we transfer data internationally, we ensure appropriate safeguards are in place (standard contractual
              clauses, adequacy decisions, or consent).
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">17. Changes to This Privacy Policy</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">17.1 Notification of Changes</h3>
            <p>
              We may update this Privacy Policy to reflect changes in our practices, technology, or legal requirements.
              Material changes will be communicated via:
            </p>
            <ul>
              <li>Email notification to registered users</li>
              <li>SMS notification for SMS channel users</li>
              <li>Prominent banner on the platform homepage</li>
              <li>Updated "Last Updated" date at the top of this policy</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">17.2 Review and Acceptance</h3>
            <p>
              We encourage you to review this Privacy Policy periodically. Your continued use of the platform after
              changes indicates acceptance of the updated policy. If you do not agree to changes, you must discontinue
              use and may request account deletion.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">18. Contact Us and Complaints</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">18.1 Privacy Inquiries</h3>
            <p>
              For questions, concerns, or requests regarding this Privacy Policy or your personal data:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg my-4">
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-gray-700">Data Protection Officer:</p>
                  <p className="text-primary">privacy@i-ticket.et</p>
                  <p>+251-91-123-4568</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Mailing Address:</p>
                  <p>i-Ticket Platform Services</p>
                  <p>Data Protection Department</p>
                  <p>Bole Road, Addis Ababa</p>
                  <p>Ethiopia</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Response Time:</p>
                  <p>We aim to respond to all privacy inquiries within <strong>30 days</strong>.</p>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">18.2 Filing a Complaint</h3>
            <p>
              If you believe we have mishandled your personal data, you have the right to file a complaint with:
            </p>
            <ul>
              <li><strong>Internal Complaint:</strong> Contact our Data Protection Officer first (privacy@i-ticket.et)</li>
              <li><strong>Regulatory Authority:</strong> File a complaint with the Ethiopian Data Protection Authority (when established)</li>
              <li><strong>Legal Action:</strong> Pursue legal remedies through Ethiopian courts</li>
            </ul>

            <div className="bg-primary/5 border-2 border-primary/20 p-6 rounded-lg mt-8">
              <p className="font-semibold text-lg mb-3">Your Privacy Matters</p>
              <p className="text-sm">
                At i-Ticket, we are committed to protecting your privacy and handling your personal information
                responsibly. If you have any questions or concerns, please don't hesitate to contact us. We're here
                to help and ensure your data is safe.
              </p>
            </div>

            <div className="text-center text-xs text-muted-foreground mt-8 pt-6 border-t">
              <p>© 2024-2025 i-Ticket Platform Services. All rights reserved.</p>
              <p className="mt-2">Privacy Policy Version 2.0 | Effective Date: January 1, 2024 | Last Updated: December 29, 2025</p>
              <p className="mt-2">
                This policy complies with Ethiopian data protection best practices and international standards.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

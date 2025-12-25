import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Privacy Policy - i-Ticket",
  description: "How i-Ticket collects, uses, and protects your personal information",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to home
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: December 25, 2025</p>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <h2>1. Information We Collect</h2>

            <h3>Personal Information</h3>
            <p>When you use i-Ticket, we collect:</p>
            <ul>
              <li>Name and phone number (for account creation)</li>
              <li>Email address (optional, for notifications)</li>
              <li>National ID number (for ticket verification)</li>
              <li>Next of kin information (for emergency contact)</li>
              <li>Payment information (processed securely through TeleBirr)</li>
            </ul>

            <h3>Booking Information</h3>
            <ul>
              <li>Travel routes and dates</li>
              <li>Pickup and dropoff locations</li>
              <li>Passenger details for group bookings</li>
              <li>Special needs or requirements</li>
            </ul>

            <h3>Technical Information</h3>
            <ul>
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Usage data and analytics</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Process and manage your bookings</li>
              <li>Send booking confirmations and tickets</li>
              <li>Communicate important updates about your trips</li>
              <li>Provide customer support</li>
              <li>Improve our services and user experience</li>
              <li>Prevent fraud and ensure security</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2>3. Information Sharing</h2>
            <p>We share your information only with:</p>
            <ul>
              <li><strong>Bus Companies:</strong> Passenger details necessary for trip management</li>
              <li><strong>Payment Processors:</strong> TeleBirr for processing payments</li>
              <li><strong>Law Enforcement:</strong> When required by law or to protect rights and safety</li>
            </ul>
            <p>We <strong>never sell</strong> your personal information to third parties.</p>

            <h2>4. Data Security</h2>
            <p>We implement industry-standard security measures:</p>
            <ul>
              <li>Encrypted data transmission (HTTPS/TLS)</li>
              <li>Secure password hashing (bcrypt)</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
              <li>Secure database with backup systems</li>
            </ul>

            <h2>5. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active and for up to 3 years after account closure
              for legal and regulatory compliance. Booking records are kept for 5 years for accounting purposes.
            </p>

            <h2>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a portable format</li>
              <li>Opt-out of marketing communications</li>
              <li>Lodge a complaint with data protection authorities</li>
            </ul>

            <h2>7. Cookies and Tracking</h2>
            <p>
              We use essential cookies for authentication and session management. We do not use advertising or tracking cookies.
              You can control cookie settings in your browser.
            </p>

            <h2>8. Children's Privacy</h2>
            <p>
              Our service is not directed to children under 13. We do not knowingly collect information from children.
              If you believe we have collected information from a child, please contact us immediately.
            </p>

            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant changes via email or
              prominent notice on our website.
            </p>

            <h2>10. Contact Us</h2>
            <p>
              For questions about privacy or to exercise your rights:
            </p>
            <ul>
              <li>Email: privacy@i-ticket.et</li>
              <li>Phone: +251-91-123-4567</li>
              <li>Visit our <Link href="/contact" className="text-primary hover:underline">Contact Page</Link></li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Terms of Service - i-Ticket",
  description: "Terms and conditions for using the i-Ticket bus booking platform",
}

export default function TermsPage() {
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
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: December 25, 2025</p>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using i-Ticket, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2>2. Booking and Payment</h2>
            <p>
              All bookings made through i-Ticket are subject to availability. Payment must be completed within 15 minutes of booking creation,
              after which the booking will be automatically cancelled and seats released.
            </p>
            <ul>
              <li>All prices are displayed in Ethiopian Birr (ETB)</li>
              <li>A 5% service fee is added to all bookings</li>
              <li>Payment is processed securely through TeleBirr</li>
              <li>Confirmation and tickets are sent immediately upon successful payment</li>
            </ul>

            <h2>3. Cancellation and Refunds</h2>
            <p>
              Cancellation policies are set by individual bus companies. Generally:
            </p>
            <ul>
              <li>Cancellations more than 24 hours before departure: 90% refund</li>
              <li>Cancellations 12-24 hours before departure: 50% refund</li>
              <li>Cancellations less than 12 hours before departure: No refund</li>
              <li>Service fees are non-refundable</li>
            </ul>

            <h2>4. User Responsibilities</h2>
            <p>
              You agree to:
            </p>
            <ul>
              <li>Provide accurate personal information</li>
              <li>Keep your account credentials secure</li>
              <li>Arrive at the departure point at least 15 minutes early</li>
              <li>Present valid ID matching the booking details</li>
              <li>Comply with bus company rules and regulations</li>
            </ul>

            <h2>5. Limitation of Liability</h2>
            <p>
              i-Ticket acts as an intermediary platform connecting passengers with bus companies. We are not responsible for:
            </p>
            <ul>
              <li>Delays, cancellations, or changes made by bus companies</li>
              <li>Loss or damage to luggage</li>
              <li>Accidents or incidents during travel</li>
              <li>Quality of service provided by bus companies</li>
            </ul>

            <h2>6. Privacy and Data Protection</h2>
            <p>
              Your privacy is important to us. Please review our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> to understand how we collect, use, and protect your personal information.
            </p>

            <h2>7. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the website.
              Continued use of the service constitutes acceptance of modified terms.
            </p>

            <h2>8. Contact Us</h2>
            <p>
              For questions about these Terms of Service, please contact us at:
            </p>
            <ul>
              <li>Email: legal@i-ticket.et</li>
              <li>Phone: +251-91-123-4567</li>
              <li>Visit our <Link href="/contact" className="text-primary hover:underline">Contact Page</Link></li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

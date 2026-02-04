import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, AlertTriangle, Building2, Phone, Mail, Clock, XCircle, CheckCircle, HelpCircle } from "lucide-react"

export const metadata = {
  title: "Refund Policy - i-Ticket",
  description: "Understand how refunds work when booking bus tickets through i-Ticket platform",
}

export default function RefundPolicyPage() {
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
            <CardTitle className="text-4xl font-bold">Refund Policy</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Last updated: February 4, 2026 | Effective Date: January 1, 2024
            </p>
            <p className="text-xs text-muted-foreground mt-1 italic">
              Important information about cancellations and refunds for bus ticket bookings.
            </p>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none pt-6">
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900 mb-2">Important: i-Ticket is a Booking Platform</p>
                  <p className="text-sm text-amber-800">
                    i-Ticket is a <strong>technology platform</strong> that connects passengers with licensed bus companies.
                    We facilitate bookings and process payments, but <strong>we do NOT operate buses</strong>. All refund
                    requests must be directed to the <strong>Bus Company</strong> that operates your trip, as they set
                    their own cancellation and refund policies.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4">1. Understanding i-Ticket's Role</h2>
            <div className="bg-gray-50 p-4 rounded-md my-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded border border-gray-200">
                  <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    What i-Ticket Does
                  </h4>
                  <ul className="text-sm space-y-1 m-0 list-none p-0">
                    <li>• Provides the booking platform</li>
                    <li>• Processes payments via TeleBirr</li>
                    <li>• Generates and delivers tickets</li>
                    <li>• Shares booking info with bus companies</li>
                    <li>• Provides customer support for platform issues</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded border border-gray-200">
                  <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    What i-Ticket Does NOT Do
                  </h4>
                  <ul className="text-sm space-y-1 m-0 list-none p-0">
                    <li>• Operate buses or transportation</li>
                    <li>• Set ticket prices or refund policies</li>
                    <li>• Process refunds for trip cancellations</li>
                    <li>• Handle trip changes or rescheduling</li>
                    <li>• Compensate for delays or service issues</li>
                  </ul>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4">2. Refunds Are Handled by Bus Companies</h2>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-blue-900 mb-2">Contact the Bus Company Directly</p>
                  <p className="text-sm text-blue-800">
                    Each bus company on our platform sets their own cancellation and refund policies. To request a refund,
                    you must <strong>contact the bus company directly</strong> using the contact information provided on
                    your ticket or in your booking details.
                  </p>
                </div>
              </div>
            </div>

            <p>
              When you book a ticket through i-Ticket, you enter into a transportation agreement with the bus company,
              not with i-Ticket. The bus company is responsible for:
            </p>
            <ul>
              <li>Providing the transportation service</li>
              <li>Setting cancellation deadlines and refund amounts</li>
              <li>Processing refund requests</li>
              <li>Issuing refunds to passengers</li>
              <li>Handling trip changes, delays, and cancellations</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">3. How to Request a Refund</h2>
            <div className="bg-gray-50 p-6 rounded-lg my-4">
              <h3 className="text-lg font-semibold mb-4">Step-by-Step Guide:</h3>
              <ol className="space-y-4 m-0 p-0 list-none">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">1</span>
                  <div>
                    <p className="font-semibold">Find Your Booking Details</p>
                    <p className="text-sm text-muted-foreground">Log in to your i-Ticket account and go to "My Tickets" to find your booking information, including the bus company name and contact details.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">2</span>
                  <div>
                    <p className="font-semibold">Contact the Bus Company</p>
                    <p className="text-sm text-muted-foreground">Call or email the bus company directly. Their contact information is displayed on your ticket and booking confirmation.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">3</span>
                  <div>
                    <p className="font-semibold">Provide Booking Information</p>
                    <p className="text-sm text-muted-foreground">Share your ticket code, passenger name, trip date, and route with the bus company when requesting a refund.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">4</span>
                  <div>
                    <p className="font-semibold">Follow Their Refund Process</p>
                    <p className="text-sm text-muted-foreground">Each bus company has their own process for handling refunds. Follow their instructions and keep records of all communications.</p>
                  </div>
                </li>
              </ol>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4">4. Typical Refund Policies (Bus Company Dependent)</h2>
            <p>
              While each bus company sets their own policies, here are <strong>typical</strong> industry standards
              in Ethiopia. <strong>Always confirm with your specific bus company</strong> before assuming these apply:
            </p>
            <div className="bg-gray-50 p-4 rounded-md my-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Cancellation Timing</th>
                    <th className="text-right py-2">Typical Refund</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-600" />
                        <span>More than 24 hours before departure</span>
                      </div>
                    </td>
                    <td className="text-right py-3 text-green-600 font-semibold">80-100% of base fare</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span>12-24 hours before departure</span>
                      </div>
                    </td>
                    <td className="text-right py-3 text-yellow-600 font-semibold">50% of base fare</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-red-600" />
                        <span>Less than 12 hours before departure</span>
                      </div>
                    </td>
                    <td className="text-right py-3 text-red-600 font-semibold">Usually no refund</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span>No-show (missed the bus)</span>
                      </div>
                    </td>
                    <td className="text-right py-3 text-red-600 font-semibold">No refund</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground italic">
              * These are general guidelines only. Actual policies vary by bus company. Some companies may offer
              more generous policies, while others may be stricter.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">5. i-Ticket Service Fee (Non-Refundable)</h2>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
              <p className="text-sm font-bold text-red-900 mb-2">Service Fee is Non-Refundable</p>
              <p className="text-sm text-red-800">
                The <strong>5% platform service fee</strong> and its associated <strong>15% VAT</strong> charged by
                i-Ticket are <strong>non-refundable</strong> under any circumstances. This fee covers platform
                maintenance, payment processing, and technology infrastructure.
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md my-4">
              <p className="text-sm font-semibold mb-2">Refund Example:</p>
              <p className="text-sm">
                If you paid <strong>528.75 ETB</strong> total for a ticket:
              </p>
              <ul className="text-sm mt-2 space-y-1">
                <li>• Base Fare: 500.00 ETB (refundable according to bus company policy)</li>
                <li>• Service Fee (5%): 25.00 ETB (non-refundable)</li>
                <li>• VAT on Service Fee (15%): 3.75 ETB (non-refundable)</li>
              </ul>
              <p className="text-sm mt-3">
                If the bus company approves a 100% refund, you would receive <strong>500.00 ETB</strong>
                (the base fare only).
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4">6. When i-Ticket May Process Refunds</h2>
            <p>
              There are limited situations where i-Ticket may directly process refunds:
            </p>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 my-4">
              <h4 className="text-sm font-bold text-green-900 mb-2">Technical/Platform Errors</h4>
              <ul className="text-sm text-green-800 space-y-1 m-0">
                <li>• Double charging due to payment system errors</li>
                <li>• Booking confirmed but payment failed (rare edge case)</li>
                <li>• System errors that prevented ticket delivery</li>
              </ul>
            </div>
            <p>
              In these cases, contact i-Ticket support at <strong>support@i-ticket.et</strong> with your booking
              details and evidence of the issue.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">7. Trip Cancelled by Bus Company</h2>
            <p>
              If a bus company cancels a trip due to:
            </p>
            <ul>
              <li>Insufficient bookings</li>
              <li>Mechanical issues</li>
              <li>Operational problems</li>
              <li>Weather conditions</li>
              <li>Government restrictions</li>
            </ul>
            <p className="mt-3">
              You are typically entitled to a <strong>full refund of the base fare</strong> from the bus company.
              Contact the bus company directly to arrange your refund. In some cases, they may offer an alternative
              trip or reschedule instead of a cash refund.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">8. Disputes and Complaints</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">8.1 Disputes with Bus Companies</h3>
            <p>
              If you have a dispute with a bus company regarding your refund:
            </p>
            <ol>
              <li>First, try to resolve it directly with the bus company</li>
              <li>If unresolved, you can file a complaint with the Ethiopian Transport Authority</li>
              <li>You may also pursue legal remedies through Ethiopian courts</li>
            </ol>
            <p>
              i-Ticket can provide booking records and transaction history to support your dispute, but we cannot
              force a bus company to issue a refund.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.2 Complaints About i-Ticket Platform</h3>
            <p>
              If you have issues with the i-Ticket platform itself (not the bus company), contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg my-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">Email Support</p>
                    <p className="text-sm text-primary">support@i-ticket.et</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">Phone Support</p>
                    <p className="text-sm">+251-91-123-4567</p>
                    <p className="text-xs text-muted-foreground">Mon-Sat: 8AM-6PM EAT</p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4">9. Bus Company Contact Information</h2>
            <p>
              Contact information for each bus company is available:
            </p>
            <ul>
              <li>On your ticket (SMS or QR code)</li>
              <li>In your booking confirmation email</li>
              <li>In the "My Tickets" section of your i-Ticket account</li>
              <li>On the trip details page before booking</li>
            </ul>
            <p className="mt-3">
              If you cannot find the bus company's contact information, please contact i-Ticket support and we will
              provide it to you.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">10. Frequently Asked Questions</h2>
            <div className="space-y-4 my-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Can i-Ticket force the bus company to give me a refund?</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      No. i-Ticket is a booking platform only. We do not have authority over bus companies' refund
                      decisions. You must work directly with the bus company.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Why isn't the service fee refundable?</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      The service fee covers our platform costs (servers, payment processing, SMS delivery, support staff)
                      which are incurred at the time of booking, regardless of whether you travel or cancel.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">How long does a refund take?</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      This depends on the bus company's policies. Typically, approved refunds are processed within
                      5-7 business days to your TeleBirr account. Contact the bus company for their specific timeline.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Can I change my booking instead of cancelling?</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Booking modifications are handled by bus companies. Contact them directly to ask about rescheduling
                      options. Some may allow free changes; others may charge a fee.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">What if the bus company doesn't respond?</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try multiple contact methods (phone, email). If they still don't respond, you can file a complaint
                      with the Ethiopian Transport Authority or seek legal advice.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 border-2 border-primary/20 p-6 rounded-lg mt-8">
              <p className="font-semibold text-lg mb-3">Summary</p>
              <ul className="text-sm space-y-2">
                <li>✓ <strong>Refunds are handled by bus companies</strong>, not i-Ticket</li>
                <li>✓ <strong>Contact the bus company directly</strong> using information on your ticket</li>
                <li>✓ <strong>i-Ticket's 5% service fee is non-refundable</strong></li>
                <li>✓ <strong>Each bus company has their own refund policy</strong> - check before booking</li>
                <li>✓ <strong>i-Ticket can provide booking records</strong> to support your refund request</li>
              </ul>
            </div>

            <div className="text-center text-xs text-muted-foreground mt-8 pt-6 border-t">
              <p>© 2024-2026 i-Ticket Platform Services. All rights reserved.</p>
              <p className="mt-2">Refund Policy Version 1.0 | Effective Date: January 1, 2024 | Last Updated: February 4, 2026</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

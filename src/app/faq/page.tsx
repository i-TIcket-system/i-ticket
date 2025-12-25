import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "FAQ - i-Ticket",
  description: "Frequently asked questions about booking bus tickets on i-Ticket",
}

export default function FAQPage() {
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
            <CardTitle className="text-3xl">Frequently Asked Questions</CardTitle>
            <p className="text-muted-foreground mt-2">
              Find answers to common questions about using i-Ticket
            </p>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How do I book a bus ticket?</AccordionTrigger>
                <AccordionContent>
                  Booking is simple: (1) Search for trips by entering your origin, destination, and travel date. (2) Browse available trips and select one that fits your schedule. (3) Enter passenger details and customize pickup/dropoff locations if needed. (4) Complete payment through TeleBirr. (5) Receive your digital ticket instantly via SMS and email.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
                <AccordionContent>
                  Currently, we accept payments through TeleBirr, Ethiopia's leading mobile payment platform. Support for additional payment methods including bank transfers and credit cards is coming soon.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>Can I cancel or modify my booking?</AccordionTrigger>
                <AccordionContent>
                  Yes, but cancellation policies vary by bus company. Generally, cancellations made 24+ hours before departure receive a 90% refund, 12-24 hours get 50%, and less than 12 hours are non-refundable. Service fees are non-refundable. Contact customer support to process cancellations.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>How do I get my ticket after booking?</AccordionTrigger>
                <AccordionContent>
                  After successful payment, you'll receive your digital ticket via SMS and email. You can also view and download your tickets anytime by logging into your account and visiting the "My Tickets" page. Each ticket includes a QR code and 6-digit short code for verification.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>Do I need to print my ticket?</AccordionTrigger>
                <AccordionContent>
                  No, printing is not required. You can show your digital ticket on your phone at boarding. The bus conductor will scan your QR code or verify using the 6-digit short code. However, we recommend downloading or taking a screenshot in case you have connectivity issues.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>What if I lose my ticket?</AccordionTrigger>
                <AccordionContent>
                  Don't worry! Your tickets are saved in your account. Log in to i-Ticket, go to "My Tickets", and you can view or download them again. You can also contact our support team with your booking ID for assistance.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7">
                <AccordionTrigger>Can I book for someone else?</AccordionTrigger>
                <AccordionContent>
                  Yes! During booking, you can enter any passenger's name and details. You don't have to travel yourself. The passenger will need to present valid ID matching the booking details at boarding.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8">
                <AccordionTrigger>How early should I arrive at the departure point?</AccordionTrigger>
                <AccordionContent>
                  We recommend arriving at least 15-20 minutes before departure time. This gives you time to verify your ticket, find your seat, and store luggage. Buses may depart on time, and late arrivals may not be accommodated.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9">
                <AccordionTrigger>Are seats assigned automatically?</AccordionTrigger>
                <AccordionContent>
                  Yes, seats are assigned automatically when you complete your booking. Your seat number is shown on your ticket. If you're booking multiple passengers, we try to assign seats together when possible.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-10">
                <AccordionTrigger>What is the service fee?</AccordionTrigger>
                <AccordionContent>
                  i-Ticket charges a 5% service fee on all bookings to cover platform maintenance, payment processing, and customer support. This fee is added to the ticket price and shown clearly during checkout. Service fees are non-refundable.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-11">
                <AccordionTrigger>Is my payment information secure?</AccordionTrigger>
                <AccordionContent>
                  Absolutely. We use bank-level encryption (HTTPS/TLS) for all transactions. Payments are processed securely through TeleBirr's certified payment gateway. We never store your complete payment details on our servers.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-12">
                <AccordionTrigger>What if the bus is delayed or cancelled?</AccordionTrigger>
                <AccordionContent>
                  If a bus company delays or cancels a trip, you'll be notified immediately via SMS and email. You can choose a full refund or reschedule to another available trip at no extra cost. i-Ticket works with bus companies to minimize disruptions.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-13">
                <AccordionTrigger>Can I choose my pickup and dropoff locations?</AccordionTrigger>
                <AccordionContent>
                  Yes! During booking, you can specify custom pickup and dropoff locations for each passenger. This helps bus companies plan routes and ensures you're picked up at a convenient spot.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-14">
                <AccordionTrigger>What items are not allowed on the bus?</AccordionTrigger>
                <AccordionContent>
                  Generally prohibited items include weapons, flammable materials, illegal substances, and hazardous goods. Specific policies vary by bus company. Large luggage may incur extra fees. Check with the bus company for their detailed luggage policy.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-15">
                <AccordionTrigger>How do I contact customer support?</AccordionTrigger>
                <AccordionContent>
                  You can reach us via email at support@i-ticket.et, call +251-91-123-4567 (Mon-Sat, 8am-6pm EAT), or use the <Link href="/contact" className="text-primary hover:underline">contact form</Link> on our website. We typically respond within 24 hours.
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="mt-8 p-4 bg-muted rounded-lg">
              <p className="text-sm text-center">
                Can't find your answer? <Link href="/contact" className="text-primary hover:underline font-medium">Contact our support team</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

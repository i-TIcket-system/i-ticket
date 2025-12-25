import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Bus, Shield, Zap, Heart } from "lucide-react"

export const metadata = {
  title: "About Us - i-Ticket",
  description: "Learn about i-Ticket's mission to transform bus travel in Ethiopia",
}

export default function AboutPage() {
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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl">About i-Ticket</CardTitle>
            <p className="text-lg text-muted-foreground mt-2">
              Transforming bus travel across Ethiopia with AI-driven technology
            </p>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <p className="text-lg">
              i-Ticket is Ethiopia's first AI-driven bus ticketing platform, making long-distance travel
              seamless, secure, and accessible to everyone.
            </p>

            <h2>Our Mission</h2>
            <p>
              To revolutionize public transportation in Ethiopia by providing a modern, reliable, and user-friendly
              platform that connects passengers with trusted bus companies, making travel planning effortless and transparent.
            </p>

            <h2>Our Story</h2>
            <p>
              Founded in 2025, i-Ticket emerged from a simple observation: booking bus tickets in Ethiopia was
              still largely manual, time-consuming, and uncertain. Travelers had to visit bus stations in person,
              call multiple companies, or rely on word-of-mouth—often resulting in fully booked buses or wasted trips.
            </p>
            <p>
              We built i-Ticket to solve this problem. By partnering with leading bus companies like Selam Bus, Sky Bus,
              and others, we've created a centralized platform where you can search, compare, and book tickets instantly—all
              from your phone or computer.
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <Bus className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Wide Network</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Partnered with Ethiopia's top bus companies covering major routes across the country—from Addis Ababa
                to Bahir Dar, Gondar, Hawassa, and beyond.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Secure & Trusted</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Bank-level security with encrypted payments through TeleBirr, QR-coded tickets, and verified bookings.
                Your data and money are always protected.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Instant Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Book tickets in under 2 minutes. Real-time seat availability, instant confirmation, and digital tickets
                delivered immediately to your phone.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Heart className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Customer First</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                24/7 customer support, transparent pricing, flexible cancellations, and continuous improvements based
                on your feedback. Your satisfaction is our priority.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Our Values</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <ul>
              <li><strong>Innovation:</strong> Leveraging AI and modern technology to solve real problems</li>
              <li><strong>Reliability:</strong> Building trust through consistent, high-quality service</li>
              <li><strong>Accessibility:</strong> Making bus travel convenient for everyone, everywhere</li>
              <li><strong>Transparency:</strong> Clear pricing, honest communication, no hidden fees</li>
              <li><strong>Partnership:</strong> Growing together with bus companies and communities</li>
            </ul>

            <h3>Join Our Journey</h3>
            <p>
              Whether you're a frequent traveler, occasional visitor, or bus company looking to reach more customers,
              i-Ticket is here to make your journey better.
            </p>
            <p>
              Have questions or want to partner with us? <Link href="/contact" className="text-primary hover:underline">Get in touch</Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Bus,
  MapPin,
  Calendar,
  Search,
  Shield,
  Clock,
  Smartphone,
  ChevronRight,
  Star,
  Users,
  Ticket
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ETHIOPIAN_CITIES } from "@/lib/utils"

const busCompanies = [
  { name: "Selam Bus", logo: "S", color: "bg-blue-500" },
  { name: "Sky Bus", logo: "SK", color: "bg-purple-500" },
  { name: "Abay Bus", logo: "A", color: "bg-green-500" },
  { name: "Ghion Bus", logo: "G", color: "bg-orange-500" },
  { name: "Awash Bus", logo: "AW", color: "bg-red-500" },
]

const features = [
  {
    icon: Shield,
    title: "Secure Booking",
    description: "Your payment and personal information are protected with industry-standard encryption.",
  },
  {
    icon: Clock,
    title: "Real-time Updates",
    description: "Get instant notifications about your trip status and any schedule changes.",
  },
  {
    icon: Smartphone,
    title: "QR Code Tickets",
    description: "No paper tickets needed. Just show your QR code at boarding.",
  },
]

const stats = [
  { value: "50K+", label: "Happy Travelers" },
  { value: "100+", label: "Daily Trips" },
  { value: "20+", label: "Destinations" },
  { value: "5+", label: "Partner Companies" },
]

export default function HomePage() {
  const router = useRouter()
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [date, setDate] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (origin) params.set("from", origin)
    if (destination) params.set("to", destination)
    if (date) params.set("date", date)
    router.push(`/search?${params.toString()}`)
  }

  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center mb-12">
            {/* Ethiopian Flag Colors Bar */}
            <div className="flex justify-center gap-1 mb-6">
              <div className="h-1 w-12 bg-green-500 rounded" />
              <div className="h-1 w-12 bg-yellow-500 rounded" />
              <div className="h-1 w-12 bg-red-500 rounded" />
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Travel Ethiopia with{" "}
              <span className="text-primary">Ease</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8">
              Book bus tickets from Ethiopia&apos;s top companies.
              Fast, secure, and hassle-free booking at your fingertips.
            </p>
          </div>

          {/* Search Form */}
          <Card className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <form onSubmit={handleSearch}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">From</label>
                    <Select value={origin} onValueChange={setOrigin}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <MapPin className="h-4 w-4 mr-2 text-primary" />
                        <SelectValue placeholder="Origin city" />
                      </SelectTrigger>
                      <SelectContent>
                        {ETHIOPIAN_CITIES.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">To</label>
                    <Select value={destination} onValueChange={setDestination}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <MapPin className="h-4 w-4 mr-2 text-accent" />
                        <SelectValue placeholder="Destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {ETHIOPIAN_CITIES.filter((city) => city !== origin).map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" />
                      <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        min={today}
                        className="pl-10 bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80 invisible md:visible">Search</label>
                    <Button type="submit" className="w-full h-10" size="lg">
                      <Search className="h-4 w-4 mr-2" />
                      Search Trips
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Popular Routes */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400 mb-3">Popular routes:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { from: "Addis Ababa", to: "Bahir Dar" },
                { from: "Addis Ababa", to: "Hawassa" },
                { from: "Addis Ababa", to: "Gondar" },
              ].map((route) => (
                <Link
                  key={`${route.from}-${route.to}`}
                  href={`/search?from=${route.from}&to=${route.to}`}
                  className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm"
                >
                  {route.from} <ChevronRight className="h-4 w-4 mx-1" /> {route.to}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-primary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center text-white">
                <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bus Companies */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Trusted Partners</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We partner with Ethiopia&apos;s leading bus companies to bring you the best travel experience.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            {busCompanies.map((company) => (
              <div
                key={company.name}
                className="flex flex-col items-center gap-3 p-6 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className={`h-16 w-16 rounded-full ${company.color} flex items-center justify-center text-white text-xl font-bold`}>
                  {company.logo}
                </div>
                <span className="font-medium">{company.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose i-Ticket?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We&apos;ve built the most convenient way to book bus tickets in Ethiopia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="card-hover">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Book your bus ticket in 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                icon: Search,
                title: "Search",
                description: "Enter your destination, date, and find available trips from multiple companies.",
              },
              {
                step: "2",
                icon: Users,
                title: "Book",
                description: "Select your preferred trip, enter passenger details, and proceed to payment.",
              },
              {
                step: "3",
                icon: Ticket,
                title: "Travel",
                description: "Receive your QR code ticket instantly and show it when boarding.",
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white text-2xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of travelers who trust i-Ticket for their bus bookings across Ethiopia.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search">
              <Button size="lg" variant="secondary" className="text-primary">
                <Search className="h-5 w-5 mr-2" />
                Find Trips
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

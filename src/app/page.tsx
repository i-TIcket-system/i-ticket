"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useReferralTracking } from "@/hooks/use-referral-tracking"
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
  Users,
  Ticket,
  UserPlus,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CityCombobox } from "@/components/ui/city-combobox"
import { getAllCities } from "@/lib/ethiopian-cities"
import { toast } from "sonner"

const busCompanies = [
  { name: "Selam Bus", logo: "S", color: "from-blue-500 to-blue-600" },
  { name: "Sky Bus", logo: "SK", color: "from-purple-500 to-purple-600" },
  { name: "Abay Bus", logo: "A", color: "from-emerald-500 to-emerald-600" },
  { name: "Ghion Bus", logo: "G", color: "from-orange-500 to-orange-600" },
  { name: "Awash Bus", logo: "AW", color: "from-rose-500 to-rose-600" },
]

const features = [
  {
    icon: Shield,
    title: "Secure Booking",
    description: "Your payment and personal information are protected with industry-standard encryption.",
    accent: "from-[#0e9494] to-[#0d4f5c]",
  },
  {
    icon: Clock,
    title: "Real-time Updates",
    description: "Get instant notifications about your trip status and any schedule changes.",
    accent: "from-[#20c4c4] to-[#0e9494]",
  },
  {
    icon: Smartphone,
    title: "QR Code Tickets",
    description: "No paper tickets needed. Just show your QR code at boarding.",
    accent: "from-[#0d4f5c] to-[#0e9494]",
  },
]

const stats = [
  { value: "1K+", label: "Happy Travelers", icon: Users },
  { value: "100+", label: "Daily Trips", icon: Bus },
  { value: "20+", label: "Destinations", icon: MapPin },
  { value: "5+", label: "Partner Companies", icon: Sparkles },
]

export default function HomePage() {
  const router = useRouter()

  // Track referral codes from QR scans (first-come attribution)
  useReferralTracking()

  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [date, setDate] = useState("")
  const [cities, setCities] = useState<string[]>([])
  const [citiesLoading, setCitiesLoading] = useState(true)
  const [trackingCode, setTrackingCode] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch cities from API on mount
  useEffect(() => {
    async function fetchCities() {
      try {
        const response = await fetch("/api/cities")
        const data = await response.json()
        if (data.cities) {
          const dbCities = data.cities.map((c: any) => c.name)
          const allCities = getAllCities(dbCities)
          setCities(allCities)
        } else {
          const allCities = getAllCities([])
          setCities(allCities)
        }
      } catch (error) {
        console.error("Failed to fetch cities:", error)
        const allCities = getAllCities([])
        setCities(allCities)
      } finally {
        setCitiesLoading(false)
      }
    }
    fetchCities()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (origin) params.set("from", origin)
    if (destination) params.set("to", destination)
    if (date) params.set("date", date)
    router.push(`/search?${params.toString()}`)
  }

  const handleTrackBooking = () => {
    const code = trackingCode.trim()

    if (!code) {
      toast.error("Please enter a booking ID or ticket code")
      return
    }

    if (code.length < 4) {
      toast.error("Invalid code. Booking IDs and ticket codes are at least 4 characters")
      return
    }

    router.push(`/track/${code}`)
  }

  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Hero Section - Simien Sky Design */}
      <section className="relative min-h-[90vh] flex items-center gradient-hero-simien text-white overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Ethiopian pattern overlay - Tilahun Weave */}
          <div className="absolute inset-0 pattern-overlay tilahun-weave" />
          {/* Simien Ridge silhouette at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-32 pattern-simien-ridge opacity-10" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-12 gap-8 items-end">
            {/* Left content - 7 columns, bottom aligned */}
            <div className={`lg:col-span-7 pb-12 lg:pb-24 space-y-8 ${mounted ? 'animate-fade-up' : 'opacity-0'}`}>
              {/* Ethiopian Flag Accent - Vertical Strip */}
              <div className="flag-accent" />

              <h1 className="text-5xl lg:text-7xl font-display font-bold leading-[1.1]">
                <span className="block text-white">Your Journey</span>
                <span className="block bg-gradient-to-r from-teal-light to-secondary bg-clip-text text-transparent mt-2">
                  Across Ethiopia
                </span>
              </h1>

              <p className="text-xl lg:text-2xl text-white/80 max-w-2xl leading-relaxed">
                Book premium bus tickets with Ethiopia&apos;s most trusted platform.
                <span className="block mt-2 text-lg font-amharic text-teal-light/90">
                  ወደ ሁሉም ቦታ በአስተማማኝ መንገድ
                </span>
              </p>

              {/* Trust indicators with Ethiopian context */}
              <div className="flex flex-wrap gap-6 text-sm">
                {[
                  { text: "10,000+ Happy Travelers", icon: CheckCircle2 },
                  { text: "TeleBirr Secure Payment", icon: Shield },
                  { text: "24/7 Support", icon: Smartphone }
                ].map((item, i) => (
                  <div key={item.text} className="flex items-center gap-2">
                    <item.icon className="h-5 w-5 text-teal-light" />
                    <span className="text-white/90">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Popular Routes - Enhanced Design */}
              <div className="pt-4">
                <p className="text-sm text-white/50 mb-3 uppercase tracking-wider font-amharic">
                  Popular Routes • ተወዳጅ መንገዶች
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { from: "Addis Ababa", to: "Bahir Dar" },
                    { from: "Addis Ababa", to: "Hawassa" },
                    { from: "Addis Ababa", to: "Gondar" },
                  ].map((route) => (
                    <Link
                      key={`${route.from}-${route.to}`}
                      href={`/search?from=${route.from}&to=${route.to}`}
                      className="group inline-flex items-center px-4 py-2.5 rounded-full bg-white/5 hover:bg-teal-light/20 border border-white/10 hover:border-teal-light/40 transition-all duration-300 text-sm backdrop-blur-sm"
                    >
                      <span className="text-white/80 group-hover:text-white">{route.from}</span>
                      <ArrowRight className="h-3.5 w-3.5 mx-2 text-teal-light group-hover:translate-x-0.5 transition-transform" />
                      <span className="text-white group-hover:text-teal-light">{route.to}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Right - Search Form - 5 columns, overlapping bottom */}
            <div className={`lg:col-span-5 lg:-mb-16 ${mounted ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
              <Card className="glass-enhanced shadow-2xl transform lg:rotate-2 hover:rotate-0 transition-transform duration-500 border-white/20 relative overflow-hidden">
                {/* Decorative Lalibela window corner accent */}
                <div className="absolute -top-4 -right-4 w-16 h-16 pattern-lalibela-window opacity-20 pointer-events-none" />

                <CardContent className="p-8 relative z-10">
                  <div className="mb-6">
                    <h3 className="text-xl font-display text-foreground mb-1">Find Your Trip</h3>
                    <p className="text-sm text-muted-foreground">Search from 100+ daily departures</p>
                  </div>

                  <form onSubmit={handleSearch} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground/70">From</label>
                      <CityCombobox
                        value={origin}
                        onChange={setOrigin}
                        suggestions={cities}
                        placeholder={citiesLoading ? "Loading cities..." : "Where are you departing from?"}
                        disabled={citiesLoading}
                        className="h-12"
                        icon={<MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none z-10" />}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground/70">To</label>
                      <CityCombobox
                        value={destination}
                        onChange={setDestination}
                        suggestions={cities}
                        excludeCity={origin}
                        placeholder={citiesLoading ? "Loading cities..." : "Where are you going?"}
                        disabled={citiesLoading}
                        className="h-12"
                        icon={<MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary pointer-events-none z-10" />}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground/70">Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                        <Input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          min={today}
                          className="pl-11 h-12"
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-14 text-lg coffee-ripple hover:shadow-lg hover:shadow-primary/30 transition-all duration-300" size="lg">
                      <Search className="h-5 w-5 mr-2" />
                      Search Trips
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

      </section>

      {/* Track Booking Section */}
      <section className="py-8 relative z-20 bg-background">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto border-primary/10 shadow-lg shadow-primary/5">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-display text-foreground mb-1 flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-primary" />
                    Already have a booking?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Enter your booking ID or ticket code to track your trip
                  </p>
                </div>
                <div className="flex gap-2 md:w-auto w-full">
                  <Input
                    placeholder="Enter code..."
                    className="md:w-56 h-11"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleTrackBooking()
                      }
                    }}
                  />
                  <Button onClick={handleTrackBooking} className="shrink-0 h-11 px-6">
                    <Search className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Track</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0e9494 0%, #0d4f5c 100%)" }}>
        {/* Pattern overlay */}
        <div className="absolute inset-0 eth-pattern opacity-10" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="text-center text-white group"
              >
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-white/10 backdrop-blur mb-4 group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="h-7 w-7" />
                </div>
                <div className="text-4xl md:text-5xl font-display mb-2">{stat.value}</div>
                <div className="text-sm text-white/70 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bus Companies */}
      <section className="py-20 md:py-28 eth-pattern">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <div className="ethiopian-bar justify-center mb-6">
              <div />
              <div />
              <div />
            </div>
            <h2 className="mb-4">Our Trusted Partners</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              We partner with Ethiopia&apos;s leading bus companies to bring you the best travel experience.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {busCompanies.map((company, i) => (
              <div
                key={company.name}
                className="group flex flex-col items-center gap-4 p-6 rounded-2xl bg-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1 border border-transparent hover:border-primary/10"
              >
                <div className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${company.color} flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {company.logo}
                </div>
                <span className="font-medium text-foreground">{company.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="mb-4">Why Choose i-Ticket?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              We&apos;ve built the most convenient way to book bus tickets in Ethiopia.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, i) => (
              <EnhancedCard key={feature.title} glass interactive glow={2} className="overflow-hidden group">
                <CardContent className="p-8 relative">
                  {/* Gradient accent line */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${feature.accent} flex items-center justify-center mb-6 shadow-lg`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="mb-3 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </EnhancedCard>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Book your bus ticket in 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
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
            ].map((item, i) => (
              <div key={item.step} className="relative text-center group">
                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
                )}

                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full text-white shadow-xl shadow-[#0e9494]/30 mb-6 group-hover:scale-110 transition-transform duration-300" style={{ background: "linear-gradient(135deg, #0e9494 0%, #0d4f5c 100%)" }}>
                  <span className="text-3xl font-display">{item.step}</span>
                </div>
                <h3 className="mb-3 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 gradient-hero text-white relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 eth-pattern opacity-20" />

        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="ethiopian-bar justify-center mb-8">
            <div />
            <div />
            <div />
          </div>

          <h2 className="text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of travelers who trust i-Ticket for their bus bookings across Ethiopia.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search">
              <Button size="lg" variant="secondary" className="h-14 px-8 text-base font-medium shadow-xl">
                <Search className="h-5 w-5 mr-2" />
                Find Trips
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="h-14 px-8 text-base font-medium border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-sm">
                <UserPlus className="h-5 w-5 mr-2" />
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

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
      {/* Hero Section - GLASSMORPHISM TRANSFORMATION */}
      <section className="relative min-h-[90vh] flex items-center gradient-hero-simien text-white overflow-hidden">
        {/* Background elements - Enhanced with animated patterns */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Base: Tilahun Weave pattern at 20% opacity */}
          <div className="absolute inset-0 bg-pattern-tilahun-glass opacity-20" />

          {/* Middle: Floating teal gradients */}
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-radial from-teal-light/30 to-transparent rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-radial from-teal-medium/25 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-radial from-teal-dark/20 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left content - Enhanced typography */}
            <div className={`space-y-8 ${mounted ? 'animate-fade-up' : 'opacity-0'}`}>
              {/* Ethiopian Flag Bar with glow */}
              <div className="ethiopian-bar">
                <div className="shadow-lg shadow-[hsl(var(--eth-green))]/50" />
                <div className="shadow-lg shadow-[hsl(var(--eth-yellow))]/50" />
                <div className="shadow-lg shadow-[hsl(var(--eth-red))]/50" />
              </div>

              {/* Larger, more dramatic heading */}
              <h1 className="text-white leading-[1.1] text-5xl md:text-6xl lg:text-7xl">
                Travel Ethiopia
                <br />
                <span className="text-[#20c4c4] font-bold">
                  with ease
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-white/90 max-w-xl leading-relaxed drop-shadow-md">
                Book bus tickets from Ethiopia&apos;s top companies. Fast, secure, and hassle-free booking at your fingertips.
              </p>

              {/* Trust indicators - redesigned grid layout */}
              <div className="grid grid-cols-3 gap-4 max-w-2xl pt-4">
                {[
                  { icon: Ticket, text: "Instant QR Tickets" },
                  { icon: Smartphone, text: "TeleBirr Payment" },
                  { icon: Clock, text: "24/7 Support" }
                ].map((item, i) => (
                  <div key={item.text} className="glass-moderate rounded-xl px-4 py-4 flex flex-col items-center gap-2 border border-white/30 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <item.icon className="h-5 w-5 text-[#20c4c4] flex-shrink-0" />
                    <span className="text-xs font-semibold text-center text-gray-900 dark:text-white leading-tight">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Popular Routes - redesigned with better spacing */}
              <div className="pt-10 pb-4">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  <p className="text-sm text-white/70 uppercase tracking-widest font-semibold">Popular Routes</p>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { from: "Addis Ababa", to: "Bahir Dar" },
                    { from: "Addis Ababa", to: "Hawassa" },
                    { from: "Addis Ababa", to: "Gondar" },
                  ].map((route) => (
                    <Link
                      key={`${route.from}-${route.to}`}
                      href={`/search?from=${route.from}&to=${route.to}`}
                      className="group glass-dark hover:glass-moderate border border-white/20 hover:border-white/40 rounded-xl px-4 py-4 transition-all duration-300 hover:shadow-xl hover:shadow-[#20c4c4]/30 hover:scale-105"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white/80 text-xs font-medium">{route.from}</span>
                          <ArrowRight className="h-4 w-4 text-[#20c4c4] group-hover:translate-x-1 transition-transform flex-shrink-0" />
                        </div>
                        <span className="text-white font-semibold text-sm">{route.to}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Right - Search Form - Enhanced glass with micro-interactions */}
            <div className={`h-full ${mounted ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
              <EnhancedCard
                glass="dramatic"
                className="h-full flex flex-col border-white/10 shadow-glass-lg group hover:shadow-glass-glow transition-all duration-500"
              >
                <CardContent className="p-8 relative z-10 flex-1 flex flex-col justify-center">
                  <div className="mb-6">
                    <h3 className="text-2xl font-display text-foreground mb-2 flex items-center gap-2">
                      <Bus className="h-6 w-6 text-primary flex-shrink-0" />
                      Find Your Trip
                    </h3>
                    <p className="text-sm text-muted-foreground">Search from 100+ daily departures</p>
                  </div>

                  <form onSubmit={handleSearch} className="space-y-5">
                    <div className="space-y-2 group/field">
                      <label className="text-sm font-medium text-foreground/70 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        From
                      </label>
                      <CityCombobox
                        value={origin}
                        onChange={setOrigin}
                        suggestions={cities}
                        placeholder={citiesLoading ? "Loading cities..." : "Where are you departing from?"}
                        disabled={citiesLoading}
                        className="h-12 transition-all duration-300 focus-within:shadow-md focus-within:shadow-primary/20 placeholder:text-gray-600 dark:placeholder:text-gray-400"
                        icon={<MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none z-10 flex-shrink-0" />}
                      />
                    </div>

                    <div className="space-y-2 group/field">
                      <label className="text-sm font-medium text-foreground/70 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-secondary flex-shrink-0" />
                        To
                      </label>
                      <CityCombobox
                        value={destination}
                        onChange={setDestination}
                        suggestions={cities}
                        excludeCity={origin}
                        placeholder={citiesLoading ? "Loading cities..." : "Where are you going?"}
                        disabled={citiesLoading}
                        className="h-12 transition-all duration-300 focus-within:shadow-md focus-within:shadow-secondary/20 placeholder:text-gray-600 dark:placeholder:text-gray-400"
                        icon={<MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary pointer-events-none z-10 flex-shrink-0" />}
                      />
                    </div>

                    <div className="space-y-2 group/field">
                      <label className="text-sm font-medium text-foreground/70 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none flex-shrink-0" />
                        <Input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          min={today}
                          className="pl-11 h-12 transition-all duration-300 focus:shadow-md focus:shadow-primary/10 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-16 text-lg glass-button border-0 shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 mt-6 font-semibold"
                      size="lg"
                    >
                      <Search className="h-6 w-6 mr-2 flex-shrink-0" />
                      Search Available Trips
                    </Button>
                  </form>
                </CardContent>
              </EnhancedCard>
            </div>
          </div>
        </div>

      </section>

      {/* Track Booking Section */}
      <section className="py-8 relative z-20 bg-gradient-to-b from-teal-pale/30 to-background">
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

      {/* Stats Section - Transparent Glass Effect */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-br from-[#0e9494] via-[#0d7a7a] to-[#0d4f5c]">
        {/* Pattern overlay - Tilahun Weave */}
        <div className="absolute inset-0 pattern-overlay tilahun-weave opacity-10" />

        {/* Animated gradient orbs for depth */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-[#20c4c4]/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-radial from-[#0e9494]/30 to-transparent rounded-full blur-3xl" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`text-center group ${mounted ? 'animate-fade-up' : 'opacity-0'}`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Very transparent glass card */}
                <div className="relative rounded-2xl p-8 bg-white/10 backdrop-blur-md border border-white/20 group-hover:bg-white/15 group-hover:border-white/30 transition-all duration-500 group-hover:-translate-y-2 shadow-lg">
                  {/* Icon with subtle glass background */}
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 mb-5 group-hover:scale-110 transition-transform duration-300">
                    <stat.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-5xl md:text-6xl font-display font-bold mb-3 text-white">{stat.value}</div>
                  <div className="text-sm text-white/90 uppercase tracking-wider font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bus Companies - Enhanced */}
      <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-teal-pale/20 via-background to-teal-pale/15">
        {/* Subtle pattern background */}
        <div className="absolute inset-0 pattern-overlay tilahun-weave opacity-[0.05]" />

        {/* Subtle gradient orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-teal-pale/30 to-transparent rounded-full blur-3xl" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center mb-14">
            <div className="ethiopian-bar justify-center mb-6">
              <div />
              <div />
              <div />
            </div>
            <h2 className="mb-4 font-display">Our Trusted Partners</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              We partner with Ethiopia&apos;s leading bus companies to bring you the best travel experience.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {busCompanies.map((company, i) => (
              <div
                key={company.name}
                className={`group flex flex-col items-center gap-4 p-6 rounded-2xl bg-card/80 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 border border-border/50 hover:border-primary/20 ${mounted ? 'animate-fade-up' : 'opacity-0'}`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${company.color} flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                  {company.logo}
                </div>
                <span className="font-medium text-foreground">{company.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - GLASSMORPHISM TRANSFORMATION */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-teal-light/60 via-teal-pale/40 to-teal-pale/20 relative overflow-hidden">
        {/* Enhanced Ethiopian pattern background */}
        <div className="absolute inset-0 bg-pattern-lalibela-glass opacity-25" />

        {/* Floating teal gradients for depth */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-radial from-teal-medium/40 to-transparent rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-radial from-teal-light/35 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-radial from-teal-dark/30 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />

        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center mb-14">
            {/* Ethiopian Flag Bar */}
            <div className="ethiopian-bar justify-center mb-6">
              <div />
              <div />
              <div />
            </div>
            <h2 className="mb-4 font-display gradient-text-simien">Why Choose i-Ticket?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              We&apos;ve built the most convenient way to book bus tickets in Ethiopia.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, i) => (
              <EnhancedCard
                key={feature.title}
                glass="dramatic"
                lift
                interactive
                ethiopianPattern={i === 0 ? 'tilahun' : i === 1 ? 'lalibela' : 'coffee'}
                className={`overflow-hidden ${mounted ? 'animate-fade-up' : 'opacity-0'} hover:scale-[1.02] transition-all duration-500`}
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <CardContent className="p-8 relative z-10">
                  {/* Gradient accent line - enhanced with glow */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${feature.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg shadow-primary/50`} />

                  {/* Icon with enhanced glass background */}
                  <div className="relative mb-6">
                    <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${feature.accent} flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300 relative z-10`}>
                      <feature.icon className="h-8 w-8 text-white flex-shrink-0" />
                    </div>
                    {/* Glow effect behind icon */}
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.accent} blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300`} />
                  </div>

                  <h3 className="mb-3 text-foreground font-display text-xl group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>

                  {/* Hover indicator */}
                  <div className="mt-6 flex items-center gap-2 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="font-medium">Learn more</span>
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </div>
                </CardContent>
              </EnhancedCard>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works - Enhanced */}
      <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-br from-teal-pale/25 via-teal-light/15 to-teal-pale/20">
        {/* Very subtle pattern */}
        <div className="absolute inset-0 pattern-overlay tilahun-weave opacity-[0.08]" />

        {/* Gradient orbs for visual interest */}
        <div className="absolute top-10 right-10 w-80 h-80 bg-gradient-radial from-teal-medium/25 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-gradient-radial from-teal-light/20 to-transparent rounded-full blur-3xl" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="mb-4 font-display">How It Works</h2>
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
              <div
                key={item.step}
                className={`relative text-center group ${mounted ? 'animate-fade-up' : 'opacity-0'}`}
                style={{ animationDelay: `${i * 150}ms` }}
              >
                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
                )}

                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full text-white bg-gradient-to-br from-teal-medium to-teal-dark shadow-xl shadow-primary/30 mb-6 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-primary/40 transition-all duration-300 border-2 border-teal-light/20">
                  <span className="text-3xl font-display font-bold">{item.step}</span>
                </div>
                <h3 className="mb-3 text-foreground font-display text-xl">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-20 md:py-28 gradient-hero-simien text-white relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 pattern-overlay tilahun-weave" />

        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="ethiopian-bar justify-center mb-8">
            <div />
            <div />
            <div />
          </div>

          <h2 className="text-white mb-6 font-display">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of travelers who trust i-Ticket for their bus bookings across Ethiopia.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search">
              <Button size="lg" variant="secondary" className="h-14 px-8 text-base font-medium shadow-xl hover:shadow-2xl coffee-ripple">
                <Search className="h-5 w-5 mr-2" />
                Find Trips
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="h-14 px-8 text-base font-medium border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-md hover:backdrop-blur-lg transition-all duration-300">
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

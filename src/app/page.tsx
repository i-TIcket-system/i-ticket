"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref')
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Redirect to register if ref code is present
  useEffect(() => {
    if (refCode && !isRedirecting) {
      setIsRedirecting(true)
      // Redirect to register with ref code for better conversion
      router.push(`/register?ref=${refCode}`)
    }
  }, [refCode, router, isRedirecting])

  // Track referral codes (only called on register page now via redirect)
  // This hook does nothing on homepage when ref is present since we redirect
  useReferralTracking()

  // Don't render page content if redirecting
  if (isRedirecting) {
    return null
  }

  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [date, setDate] = useState("")
  const [cities, setCities] = useState<string[]>([])
  const [citiesLoading, setCitiesLoading] = useState(true)
  const [trackingCode, setTrackingCode] = useState("")
  const [mounted, setMounted] = useState(false)
  const [belowFoldVisible, setBelowFoldVisible] = useState(false)
  const [popularRoutes, setPopularRoutes] = useState<{ from: string; to: string }[]>([
    { from: "Addis Ababa", to: "Bahir Dar" },
    { from: "Addis Ababa", to: "Hawassa" },
    { from: "Addis Ababa", to: "Gondar" },
  ])

  useEffect(() => {
    setMounted(true)

    // Defer below-fold content rendering for better initial load performance
    const timer = setTimeout(() => {
      setBelowFoldVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Fetch popular routes based on customer searches and trip creations
  useEffect(() => {
    async function fetchPopularRoutes() {
      try {
        const response = await fetch("/api/popular-routes")
        const data = await response.json()
        if (data.routes && data.routes.length > 0) {
          setPopularRoutes(data.routes)
        }
      } catch (error) {
        console.error("Failed to fetch popular routes:", error)
        // Keep default routes if fetch fails
      }
    }
    fetchPopularRoutes()
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

  // Helper function to shorten city names for display
  const shortenCityName = (city: string) => {
    if (city === "Addis Ababa") return "Addis"
    return city
  }

  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Skip to main content - Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-primary focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary/50"
      >
        Skip to main content
      </a>

      {/* Stats Bar - Compact horizontal trust indicators (moved above hero for better conversion) */}
      <section aria-label="Platform statistics" className="relative py-3 md:py-6 bg-gradient-to-r from-[#0e9494] via-[#0d7a7a] to-[#0d4f5c] border-b border-white/10">
        <div className="container mx-auto px-4">
          {/* Mobile: 2x2 grid, Tablet+: horizontal row */}
          <div className="grid grid-cols-2 md:flex md:flex-wrap md:items-center md:justify-center gap-4 md:gap-8 lg:gap-12">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`flex items-center gap-2 md:gap-3 ${mounted ? 'animate-fade-up' : 'opacity-0'}`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Icon - smaller on mobile */}
                <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10 rounded-lg bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center">
                  <stat.icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                {/* Value and Label - responsive sizing */}
                <div className="text-left min-w-0">
                  <div className="text-xl md:text-2xl lg:text-3xl font-display font-bold text-white leading-none">{stat.value}</div>
                  <div className="text-[10px] md:text-xs text-white/80 font-medium mt-0.5 truncate">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hero Section - GLASSMORPHISM TRANSFORMATION */}
      <section id="main-content" className="relative min-h-[85vh] flex items-center gradient-hero-simien text-white overflow-hidden">
        {/* Background elements - Enhanced with animated patterns */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Base: Tilahun Weave pattern at 20% opacity */}
          <div className="absolute inset-0 bg-pattern-tilahun-glass opacity-20" />

          {/* Middle: Floating teal gradients */}
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-radial from-teal-light/30 to-transparent rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-radial from-teal-medium/25 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-radial from-teal-dark/20 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left content - Enhanced typography */}
            <div className={`space-y-6 ${mounted ? 'animate-fade-up' : 'opacity-0'}`}>
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

              {/* Trust indicators - Clean checkmark style */}
              <div className="flex flex-wrap gap-6 pt-6">
                {[
                  { icon: Ticket, text: "Instant QR Tickets" },
                  { icon: Smartphone, text: "TeleBirr Payment" },
                  { icon: Clock, text: "24/7 Support" }
                ].map((item, i) => (
                  <div key={item.text} className="flex items-center gap-2.5">
                    <div className="h-6 w-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                      <CheckCircle2 className="h-4 w-4 text-white flex-shrink-0" />
                    </div>
                    <span className="text-sm font-medium text-white/95 whitespace-nowrap">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Popular Routes - Dynamic based on customer searches */}
              <div className="pt-4">
                <p className="text-sm text-white/80 font-medium mb-4" id="popular-routes-label">Popular Routes:</p>
                <nav aria-labelledby="popular-routes-label" className="flex flex-wrap gap-3">
                  {popularRoutes.map((route) => (
                    <Link
                      key={`${route.from}-${route.to}`}
                      href={`/search?from=${route.from}&to=${route.to}`}
                      className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-moderate border border-white/30 hover:border-[#20c4c4]/50 focus:border-[#20c4c4] focus:ring-4 focus:ring-[#20c4c4]/50 focus:outline-none transition-all duration-300 hover:shadow-lg hover:shadow-[#20c4c4]/20 hover:scale-105 focus:scale-105"
                      aria-label={`Search trips from ${route.from} to ${route.to}`}
                    >
                      <span className="text-white text-sm font-medium whitespace-nowrap">{shortenCityName(route.from)}</span>
                      <ArrowRight className="h-4 w-4 text-[#20c4c4] flex-shrink-0" aria-hidden="true" />
                      <span className="text-white text-sm font-medium whitespace-nowrap">{route.to}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            </div>

            {/* Right - Search Form - Enhanced glass with micro-interactions */}
            <div className={`${mounted ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
              <EnhancedCard
                glass="dramatic"
                className="border-white/10 shadow-glass-lg group hover:shadow-glass-glow transition-all duration-500"
              >
                <CardContent className="p-8 relative z-10">
                  <div className="mb-6">
                    <h3 className="text-2xl font-display text-foreground mb-2 flex items-center gap-2">
                      <Bus className="h-6 w-6 text-primary flex-shrink-0" />
                      Find Your Trip
                    </h3>
                    <p className="text-sm text-muted-foreground">Search from 100+ daily departures</p>
                  </div>

                  <form onSubmit={handleSearch} className="space-y-5" role="search" aria-label="Trip search form">
                    <div className="space-y-2 group/field">
                      <label htmlFor="origin-city" className="text-sm font-medium text-foreground/70 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" aria-hidden="true" />
                        From
                      </label>
                      <CityCombobox
                        value={origin}
                        onChange={setOrigin}
                        suggestions={cities}
                        placeholder={citiesLoading ? "Loading cities..." : "Where are you departing from?"}
                        disabled={citiesLoading}
                        className="h-12 transition-all duration-300 focus-within:shadow-md focus-within:shadow-primary/20 focus-within:ring-2 focus-within:ring-primary/50 placeholder:text-gray-600 dark:placeholder:text-gray-400"
                        icon={<MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none z-10 flex-shrink-0" aria-hidden="true" />}
                      />
                    </div>

                    <div className="space-y-2 group/field">
                      <label htmlFor="destination-city" className="text-sm font-medium text-foreground/70 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-secondary flex-shrink-0" aria-hidden="true" />
                        To
                      </label>
                      <CityCombobox
                        value={destination}
                        onChange={setDestination}
                        suggestions={cities}
                        excludeCity={origin}
                        placeholder={citiesLoading ? "Loading cities..." : "Where are you going?"}
                        disabled={citiesLoading}
                        className="h-12 transition-all duration-300 focus-within:shadow-md focus-within:shadow-secondary/20 focus-within:ring-2 focus-within:ring-secondary/50 placeholder:text-gray-600 dark:placeholder:text-gray-400"
                        icon={<MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary pointer-events-none z-10 flex-shrink-0" aria-hidden="true" />}
                      />
                    </div>

                    <div className="space-y-2 group/field">
                      <label htmlFor="travel-date" className="text-sm font-medium text-foreground/70 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                        Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none flex-shrink-0" aria-hidden="true" />
                        <Input
                          id="travel-date"
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          min={today}
                          className="pl-11 h-12 transition-all duration-300 focus:shadow-md focus:shadow-primary/10 focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-gray-100"
                          aria-label="Select travel date"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="ripple-effect w-full h-16 text-lg bg-gradient-to-r from-[#0e9494] to-[#0d4f5c] hover:from-[#20c4c4] hover:to-[#0e9494] text-white border-0 shadow-xl hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 mt-6 font-bold hover:scale-[1.02] active:scale-[0.98] focus:ring-4 focus:ring-primary/50 focus:outline-none relative overflow-hidden group/btn"
                      size="lg"
                      aria-label="Search for available bus trips"
                    >
                      <Search className="h-6 w-6 mr-2 flex-shrink-0" aria-hidden="true" />
                      Search Available Trips
                    </Button>
                  </form>
                </CardContent>
              </EnhancedCard>
            </div>
          </div>
        </div>

      </section>

      {/* Below-fold sections - Lazy loaded for better performance */}
      {belowFoldVisible && (
        <>
          {/* Track Your Trip - Clean & Simple */}
          <section className="py-4 bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                {/* Simple Card */}
                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    {/* Left: Icon + Text */}
                    <div className="flex items-start md:items-center gap-4 flex-1">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#0e9494] to-[#0d4f5c] flex items-center justify-center">
                        <Ticket className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-1">
                          Already have a booking?
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Enter your booking ID or ticket code to track your trip
                        </p>
                      </div>
                    </div>

                    {/* Right: Input + Button */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (!trackingCode.trim()) {
                          toast.error("Please enter your ticket or booking code")
                          return
                        }
                        router.push(`/track/${trackingCode.trim().toUpperCase()}`)
                      }}
                      className="flex gap-3 w-full md:w-auto"
                    >
                      <Input
                        type="text"
                        placeholder="Enter code..."
                        value={trackingCode}
                        onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                        className="flex-1 md:w-64 h-12"
                      />
                      <Button
                        type="submit"
                        className="h-12 px-6 bg-gradient-to-r from-[#0e9494] to-[#0d4f5c] hover:from-[#20c4c4] hover:to-[#0e9494] text-white font-medium"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Track
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Bus Companies - Enhanced with cooler blue-teal tones */}
          <section className="py-24 md:py-32 lg:py-36 relative overflow-hidden bg-gradient-to-br from-blue-100/80 via-cyan-100/70 to-teal-100/80 dark:from-blue-950/35 dark:via-cyan-950/30 dark:to-teal-950/35">
        {/* Ethiopian pattern background - more visible */}
        <div className="absolute inset-0 pattern-overlay coffee-beans opacity-15" />

        {/* Multiple gradient orbs for depth */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-radial from-blue-200/30 to-transparent rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-radial from-cyan-200/25 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-radial from-teal-200/20 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

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

      {/* Features - Solid teal like hero section */}
      <section className="py-24 md:py-32 lg:py-36 bg-gradient-to-br from-[#0e9494] via-[#0d7a7a] to-[#0d4f5c] relative overflow-hidden">
        {/* Enhanced Ethiopian pattern background - visible on solid color */}
        <div className="absolute inset-0 bg-pattern-lalibela-glass opacity-20" />

        {/* Floating teal gradients for depth */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-radial from-[#20c4c4]/30 to-transparent rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-radial from-[#0e9494]/25 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-radial from-[#0d4f5c]/20 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />

        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center mb-14">
            {/* Ethiopian Flag Bar */}
            <div className="ethiopian-bar justify-center mb-6">
              <div />
              <div />
              <div />
            </div>
            <h2 className="mb-4 font-display text-white">Why Choose i-Ticket?</h2>
            <p className="text-white/90 max-w-2xl mx-auto text-lg">
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

                  {/* Icon - clean without glow */}
                  <div className="mb-6">
                    <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${feature.accent} flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300`}>
                      <feature.icon className="h-8 w-8 text-white flex-shrink-0" />
                    </div>
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

      {/* How it Works - Enhanced with cooler blue-teal tones */}
      <section className="py-24 md:py-32 lg:py-36 relative overflow-hidden bg-gradient-to-br from-blue-100/80 via-cyan-100/70 to-teal-100/80 dark:from-blue-950/35 dark:via-cyan-950/30 dark:to-teal-950/35">
        {/* Ethiopian Lalibela pattern - more visible */}
        <div className="absolute inset-0 pattern-overlay lalibela-cross opacity-15" />

        {/* Gradient orbs for visual interest - cooler tones */}
        <div className="absolute top-10 right-10 w-80 h-80 bg-gradient-radial from-blue-200/30 to-transparent rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-gradient-radial from-cyan-200/25 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2.5s' }} />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-radial from-teal-200/20 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />

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

                <div className="flex h-20 w-20 items-center justify-center rounded-full text-white bg-gradient-to-br from-[#0e9494] to-[#0d4f5c] shadow-xl shadow-cyan-500/30 mb-6 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-cyan-500/40 transition-all duration-300 border-2 border-cyan-300/20 mx-auto">
                  <span className="text-3xl font-display font-bold leading-none block" style={{ transform: 'translateY(1px)' }}>{item.step}</span>
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
            <Button size="lg" variant="secondary" className="h-14 px-8 text-base font-medium shadow-xl hover:shadow-2xl coffee-ripple" asChild>
              <Link href="/search">
                <Search className="h-5 w-5 mr-2" />
                Find Trips
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base font-medium border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-md hover:backdrop-blur-lg transition-all duration-300" asChild>
              <Link href="/register">
                <UserPlus className="h-5 w-5 mr-2" />
                Create Account
              </Link>
            </Button>
          </div>
        </div>
      </section>
        </>
      )}
    </div>
  )
}

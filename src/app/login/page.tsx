"use client"

// Force dynamic rendering to avoid static generation errors with useSearchParams
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn, getSession } from "next-auth/react"
import Image from "next/image"
import { Lock, Loader2, AlertCircle, ArrowRight, Bus, Shield, Clock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)

  // Load saved phone and failed attempts on mount
  useEffect(() => {
    const savedPhone = localStorage.getItem("savedPhone")
    const wasRemembered = localStorage.getItem("rememberMe") === "true"
    if (savedPhone && wasRemembered) {
      setPhone(savedPhone)
      setRememberMe(true)
    }

    // P2: Track failed login attempts (resets on browser close)
    const attempts = sessionStorage.getItem("failedLoginAttempts")
    if (attempts) {
      setFailedAttempts(parseInt(attempts))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        phone,
        password,
        redirect: false,
      })

      if (result?.error) {
        // P1-QA-002: Use functional state update to prevent race condition
        setFailedAttempts((prev) => {
          const newAttempts = prev + 1
          sessionStorage.setItem("failedLoginAttempts", newAttempts.toString())

          // Show progressive warnings
          if (newAttempts >= 3 && newAttempts < 5) {
            const remaining = 5 - newAttempts
            toast.error("Invalid credentials", {
              description: `${remaining} more attempt${remaining !== 1 ? 's' : ''} before temporary lockout`
            })
          } else if (newAttempts >= 5) {
            toast.error("Account locked", {
              description: "Too many failed attempts. Please try again in 15 minutes or reset your password."
            })
          }

          return newAttempts
        })

        setError(result.error)
        toast.error("Login failed", { description: result.error })
      } else {
        // P2: Clear failed attempts on successful login
        sessionStorage.removeItem("failedLoginAttempts")
        setFailedAttempts(0)

        // Save phone to localStorage if Remember Me is checked
        if (rememberMe) {
          localStorage.setItem("savedPhone", phone)
          localStorage.setItem("rememberMe", "true")
        } else {
          localStorage.removeItem("savedPhone")
          localStorage.removeItem("rememberMe")
        }

        toast.success("Login successful!", { description: "Redirecting..." })
        await new Promise(resolve => setTimeout(resolve, 300))
        const session = await getSession()

        // Check if user must change password (new company admins with temp passwords)
        if (session?.user?.mustChangePassword) {
          router.replace("/force-change-password")
          return
        }

        if (callbackUrl !== "/") {
          router.replace(callbackUrl)
        } else if (session?.user?.role === "COMPANY_ADMIN") {
          // Manual ticketers go to dedicated cashier portal
          if (session.user.staffRole === "MANUAL_TICKETER") {
            router.replace("/cashier")
          } else if (session.user.staffRole && session.user.staffRole !== "ADMIN") {
            router.replace("/staff/my-trips")
          } else {
            router.replace("/company/dashboard")
          }
        } else if (session?.user?.role === "SUPER_ADMIN") {
          router.replace("/admin/dashboard")
        } else if (session?.user?.role === "SALES_PERSON") {
          router.replace("/sales/dashboard")
        } else {
          router.replace("/search")
        }
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Match homepage hero gradient */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden gradient-hero-simien">
        {/* Background elements - Enhanced with animated patterns like homepage */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Base: Tilahun Weave pattern at 20% opacity */}
          <div className="absolute inset-0 bg-pattern-tilahun-glass opacity-20" />

          {/* Middle: Floating teal gradients */}
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-radial from-teal-light/30 to-transparent rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-radial from-teal-medium/25 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
          <div className="ethiopian-bar mb-8">
            <div />
            <div />
            <div />
          </div>
          <h1 className="text-4xl xl:text-5xl font-display mb-4 leading-tight">
            Travel Ethiopia<br />
            <span className="text-white/80">with confidence</span>
          </h1>
          <p className="text-base text-white/70 max-w-md leading-relaxed">
            Book bus tickets from trusted operators across the country.
          </p>

          {/* Features */}
          <div className="flex flex-col gap-4 mt-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <Bus className="h-5 w-5" />
              </div>
              <span className="text-sm text-white/80">50+ Bus Companies</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
              <span className="text-sm text-white/80">Secure TeleBirr Payments</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <span className="text-sm text-white/80">24/7 Customer Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Ultra Glassmorphism inspired by reference */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 relative overflow-hidden bg-gradient-to-br from-[#0d7a7a] via-[#0e9494] to-[#20c4c4]">
        {/* Ethiopian Lalibela pattern - subtle */}
        <div className="absolute inset-0 pattern-overlay lalibela-cross opacity-10 z-0 pointer-events-none" />

        {/* Large gradient orbs for depth */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-[#20c4c4]/40 to-transparent rounded-full blur-3xl animate-float z-0 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-radial from-[#0d4f5c]/30 to-transparent rounded-full blur-3xl animate-float z-0 pointer-events-none" style={{ animationDelay: '3s' }} />

        {/* Decorative Ethiopian crosses floating around (like snowflakes in reference) */}
        <div className="absolute top-[15%] left-[10%] text-4xl text-white/25 z-0 pointer-events-none animate-float">✚</div>
        <div className="absolute top-[25%] right-[15%] text-3xl text-white/20 z-0 pointer-events-none animate-float" style={{ animationDelay: '1s' }}>✜</div>
        <div className="absolute top-[60%] left-[8%] text-3xl text-white/15 z-0 pointer-events-none animate-float" style={{ animationDelay: '2s' }}>✚</div>
        <div className="absolute bottom-[20%] right-[12%] text-2xl text-white/25 z-0 pointer-events-none animate-float" style={{ animationDelay: '1.5s' }}>✜</div>
        <div className="absolute top-[45%] right-[8%] text-2xl text-white/20 z-0 pointer-events-none animate-float" style={{ animationDelay: '2.5s' }}>✚</div>
        <div className="absolute bottom-[35%] left-[15%] text-3xl text-white/15 z-0 pointer-events-none animate-float" style={{ animationDelay: '0.5s' }}>✜</div>

        {/* Additional scattered crosses */}
        <div className="absolute top-[35%] left-[18%] text-2xl text-white/18 z-0 pointer-events-none animate-float" style={{ animationDelay: '3s' }}>✚</div>
        <div className="absolute bottom-[50%] right-[22%] text-xl text-white/15 z-0 pointer-events-none animate-float" style={{ animationDelay: '1.8s' }}>✜</div>

        {/* Small dots scattered (like in reference) */}
        <div className="absolute top-[20%] left-[20%] w-2 h-2 bg-white/40 rounded-full z-0 pointer-events-none"></div>
        <div className="absolute top-[70%] right-[20%] w-2 h-2 bg-white/30 rounded-full z-0 pointer-events-none"></div>
        <div className="absolute bottom-[40%] left-[25%] w-1.5 h-1.5 bg-white/35 rounded-full z-0 pointer-events-none"></div>
        <div className="absolute top-[55%] right-[25%] w-2 h-2 bg-white/40 rounded-full z-0 pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Header */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div
              className="p-3 rounded-xl mb-4"
              style={{ background: "linear-gradient(135deg, #0e9494 0%, #20c4c4 100%)" }}
            >
              <Image src="/logo.svg" alt="i-Ticket" width={32} height={32} className="h-8 w-8" />
            </div>
            <div className="ethiopian-bar">
              <div />
              <div />
              <div />
            </div>
          </div>

          {/* Glassmorphism Container */}
          <div className="backdrop-blur-xl bg-white/70 border border-white/30 rounded-2xl shadow-2xl shadow-black/10 p-8">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-display mb-2" style={{ color: "#0d4f5c" }}>Welcome back</h2>
              <p className="text-sm" style={{ color: "#0e9494" }}>Sign in to continue to i-Ticket</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
              <PhoneInput id="phone" value={phone} onChange={setPhone} required disabled={isLoading} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label
                htmlFor="remember-me"
                className="text-sm font-normal cursor-pointer text-muted-foreground"
              >
                Remember me for 30 days
              </Label>
            </div>

            <Button type="submit" className="w-full h-11 font-medium group" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
            </form>

            {/* Bus Company Registration Notice */}
            <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground text-center">
                <strong className="text-foreground">Bus Companies:</strong> Contact i-Ticket support to register your company.
              </p>
              <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground text-center">
                <span>📧 Email: support@i-ticket.et</span>
                <span>📱 Phone: 0911223344</span>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary font-medium hover:text-primary/80 transition-colors">
                Create account
              </Link>
            </p>
          </div>
          {/* End Glassmorphism Container */}
        </div>
      </div>
    </div>
  )
}

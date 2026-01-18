"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { User, Lock, Mail, Loader2, Check, ArrowRight, Ticket, MapPin, Smartphone, Eye, EyeOff, Users, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { getReferralCode } from "@/hooks/use-referral-tracking"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registerAsSales, setRegisterAsSales] = useState(false)
  const [recruiterInfo, setRecruiterInfo] = useState<{ name: string; referralCode: string } | null>(null)

  // Check for recruiter info on mount
  useEffect(() => {
    const refCode = searchParams.get('ref') || getReferralCode()
    if (refCode) {
      // Fetch recruiter info to show recruitment banner
      fetch(`/api/sales/recruiter-info?code=${refCode}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.recruiter) {
            setRecruiterInfo(data.recruiter)
          }
        })
        .catch(() => {
          // Silently fail - not critical
        })
    }
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    // Normalize and validate phone number (accepts 09XXXXXXXX, 07XXXXXXXX, or +2519XXXXXXXX)
    const normalizedPhone = formData.phone.replace(/[^\d+]/g, "");
    const isValidFormat = /^0[79]\d{8}$/.test(normalizedPhone) ||
                          /^\+251[79]\d{8}$/.test(normalizedPhone) ||
                          /^251[79]\d{8}$/.test(normalizedPhone);

    if (!isValidFormat) {
      toast.error("Please enter a valid Ethiopian phone number", {
        description: "Use 09XXXXXXXX, 07XXXXXXXX, or +2519XXXXXXXX format"
      })
      return
    }

    setIsLoading(true)

    try {
      const referralCode = getReferralCode()

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
          password: formData.password,
          referralCode: referralCode || undefined,
          registerAsSalesPerson: registerAsSales, // Flag for sales person registration
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      if (registerAsSales) {
        toast.success("Sales account created! Signing you in...")
        // Auto-login for sales person
        await signIn("credentials", {
          phone: formData.phone,
          password: formData.password,
          redirect: false,
        })
        router.push("/sales")
      } else {
        toast.success("Account created successfully! Signing you in...")
        // Auto-login for regular customer
        await signIn("credentials", {
          phone: formData.phone,
          password: formData.password,
          redirect: false,
        })
        router.push("/tickets")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const passwordRequirements = [
    { met: formData.password.length >= 6, text: "At least 6 characters" },
    { met: formData.password === formData.confirmPassword && formData.confirmPassword !== "", text: "Passwords match" },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Match homepage Features section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0e9494] via-[#0d7a7a] to-[#0d4f5c]">
        {/* Enhanced Ethiopian Lalibela pattern background */}
        <div className="absolute inset-0 bg-pattern-lalibela-glass opacity-20" />

        {/* Floating teal gradients for depth */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-radial from-[#20c4c4]/30 to-transparent rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-radial from-[#0e9494]/25 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-radial from-[#0d4f5c]/20 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
          <div className="ethiopian-bar mb-8">
            <div />
            <div />
            <div />
          </div>
          <h1 className="text-4xl xl:text-5xl font-display mb-4 leading-tight">
            Start your<br />
            <span className="text-white/80">journey today</span>
          </h1>
          <p className="text-base text-white/70 max-w-md leading-relaxed">
            Join thousands of travelers booking bus tickets across Ethiopia.
          </p>

          {/* Benefits */}
          <div className="flex flex-col gap-4 mt-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <Ticket className="h-5 w-5" />
              </div>
              <span className="text-sm text-white/80">Instant E-Ticket Delivery</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <MapPin className="h-5 w-5" />
              </div>
              <span className="text-sm text-white/80">200+ Routes Nationwide</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <Smartphone className="h-5 w-5" />
              </div>
              <span className="text-sm text-white/80">Easy TeleBirr Payments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Registration Form - Match login page */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 relative overflow-hidden overflow-y-auto bg-gradient-to-br from-[#0d7a7a] via-[#0e9494] to-[#20c4c4]">
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

        <div className="w-full max-w-md py-4 relative z-10">
          {/* Mobile Header */}
          <div className="lg:hidden flex flex-col items-center mb-6">
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
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-display mb-2" style={{ color: "#0d4f5c" }}>Create account</h2>
              <p className="text-sm" style={{ color: "#0e9494" }}>Join i-Ticket to start booking trips</p>
            </div>

          {/* Recruitment Banner */}
          {recruiterInfo && (
            <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    You were invited by {recruiterInfo.name}
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                    Register to start earning commissions on ticket sales
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
              <PhoneInput
                id="phone"
                value={formData.phone}
                onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">This will be your login username</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email <span className="text-muted-foreground font-normal">(Optional)</span></Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create password"
                    value={formData.password}
                    onChange={handleChange}
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

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 pr-10 h-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Requirements */}
            {formData.password && (
              <div className="flex gap-4">
                {passwordRequirements.map((req, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-1.5 text-xs ${
                      req.met ? "text-green-600" : "text-muted-foreground"
                    }`}
                  >
                    <Check className={`h-3 w-3 ${req.met ? "opacity-100" : "opacity-30"}`} />
                    {req.text}
                  </div>
                ))}
              </div>
            )}

            {/* Sales Person Registration Option */}
            {recruiterInfo && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Checkbox
                  id="registerAsSales"
                  checked={registerAsSales}
                  onCheckedChange={(checked) => setRegisterAsSales(checked as boolean)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="registerAsSales"
                    className="text-sm font-medium cursor-pointer text-blue-900 dark:text-blue-100"
                  >
                    Register as Sales Person
                  </Label>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Earn 5% commission on every ticket sold through your referral link
                  </p>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-11 font-medium group" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-primary hover:text-primary/80">Terms</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-primary hover:text-primary/80">Privacy Policy</Link>
            </p>
          </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:text-primary/80 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
          {/* End Glassmorphism Container */}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { User, Lock, Mail, Loader2, Check, ArrowRight, Ticket, MapPin, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
import { toast } from "sonner"
import { getReferralCode } from "@/hooks/use-referral-tracking"

export default function RegisterPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)

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

    if (!/^09\d{8}$/.test(formData.phone)) {
      toast.error("Please enter a valid Ethiopian phone number (09XXXXXXXX)")
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
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      toast.success("Account created successfully! Redirecting to login...")
      setTimeout(() => {
        router.push("/login?registered=true")
      }, 1000)
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
      {/* Left Panel - Teal Gradient */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(160deg, #0d4f5c 0%, #0e9494 50%, #20c4c4 100%)" }}
        />
        <div className="absolute inset-0 eth-pattern opacity-10" />

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

      {/* Right Panel - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 relative overflow-hidden overflow-y-auto" style={{ background: "linear-gradient(180deg, #f0fafa 0%, #e6f7f7 50%, #f5f5f5 100%)" }}>
        {/* Subtle teal accent elements */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #20c4c4 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #0e9494 0%, transparent 70%)" }} />

        {/* Teal accent line on left edge */}
        <div className="hidden lg:block absolute left-0 top-1/4 bottom-1/4 w-1" style={{ background: "linear-gradient(180deg, #20c4c4 0%, #0e9494 50%, #0d4f5c 100%)" }} />

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

          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-display mb-2" style={{ color: "#0d4f5c" }}>Create account</h2>
            <p className="text-sm" style={{ color: "#0e9494" }}>Join i-Ticket to start booking trips</p>
          </div>

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
                    type="password"
                    placeholder="Create password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 h-11"
                    required
                  />
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
      </div>
    </div>
  )
}

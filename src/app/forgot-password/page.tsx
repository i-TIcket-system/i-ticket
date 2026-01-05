"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Loader2, Key, Lock, ArrowRight, ShieldCheck, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { PhoneInput } from "@/components/ui/phone-input"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phone.match(/^09\d{8}$/)) {
      toast.error("Please enter a valid Ethiopian phone number (09XXXXXXXX)")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("OTP sent to your phone!", {
          description: data.otp ? `Your OTP is: ${data.otp}` : undefined,
        })
        setStep("otp")
      } else {
        toast.error(data.error || "Failed to send OTP")
      }
    } catch (error) {
      toast.error("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (!otp || otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          otp,
          newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Password reset successful!", {
          description: "You can now login with your new password",
        })
        router.push("/login")
      } else {
        toast.error(data.error || "Failed to reset password")
      }
    } catch (error) {
      toast.error("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

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
            Reset your<br />
            <span className="text-white/80">password</span>
          </h1>
          <p className="text-base text-white/70 max-w-md leading-relaxed">
            We&apos;ll send a verification code to your phone number.
          </p>

          {/* Security Info */}
          <div className="flex flex-col gap-4 mt-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5" />
              </div>
              <span className="text-sm text-white/80">OTP via SMS</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-sm text-white/80">Secure Verification</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #f0fafa 0%, #e6f7f7 50%, #f5f5f5 100%)" }}>
        {/* Subtle teal accent elements */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #20c4c4 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #0e9494 0%, transparent 70%)" }} />

        {/* Teal accent line on left edge */}
        <div className="hidden lg:block absolute left-0 top-1/4 bottom-1/4 w-1" style={{ background: "linear-gradient(180deg, #20c4c4 0%, #0e9494 50%, #0d4f5c 100%)" }} />

        <div className="w-full max-w-md relative z-10">
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

          <Link
            href="/login"
            className="inline-flex items-center text-sm hover:text-foreground mb-6 transition-colors"
            style={{ color: "#0e9494" }}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to login
          </Link>

          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-display mb-2" style={{ color: "#0d4f5c" }}>Reset Password</h2>
            <p className="text-sm" style={{ color: "#0e9494" }}>
              {step === "phone"
                ? "Enter your phone number to receive an OTP"
                : "Enter the OTP and your new password"}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`h-1.5 flex-1 rounded-full ${step === "phone" ? "bg-primary" : "bg-primary"}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step === "otp" ? "bg-primary" : "bg-muted"}`} />
          </div>

          {step === "phone" ? (
            <form onSubmit={handleRequestOTP} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                <PhoneInput
                  id="phone"
                  value={phone}
                  onChange={setPhone}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full h-11 font-medium group" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="otp" className="text-sm font-medium">OTP Code</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="pl-10 h-11 text-center tracking-widest font-mono text-lg"
                    required
                    disabled={isLoading}
                    maxLength={6}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code sent to {phone}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 h-11"
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-11"
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => setStep("phone")}
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button type="submit" className="flex-1 h-11 font-medium" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </div>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="text-primary font-medium hover:text-primary/80 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

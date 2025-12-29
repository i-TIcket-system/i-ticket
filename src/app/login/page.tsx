"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn, getSession } from "next-auth/react"
import Image from "next/image"
import { Phone, Lock, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PhoneInput } from "@/components/ui/phone-input"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

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
        setError(result.error)
        toast.error("Login failed", {
          description: result.error
        })
      } else {
        toast.success("Login successful!", {
          description: "Redirecting..."
        })
        // Small delay to ensure session is fully propagated
        await new Promise(resolve => setTimeout(resolve, 300))

        // Get the session to check user role
        const session = await getSession()

        // Redirect based on role using replace (prevents back button issues)
        if (callbackUrl !== "/") {
          router.replace(callbackUrl)
        } else if (session?.user?.role === "COMPANY_ADMIN") {
          router.replace("/company/dashboard")
        } else if (session?.user?.role === "SUPER_ADMIN") {
          router.replace("/admin/dashboard")
        } else {
          // Redirect customers to search page to start booking
          router.replace("/search")
        }
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Demo account quick fill
  const fillDemoAccount = (type: "customer" | "company" | "admin") => {
    const accounts = {
      customer: { phone: "0911234567", password: "demo123" },
      company: { phone: "0922345678", password: "demo123" },
      admin: { phone: "0933456789", password: "admin123" },
    }
    setPhone(accounts[type].phone)
    setPassword(accounts[type].password)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.svg"
              alt="i-Ticket"
              width={48}
              height={48}
              className="h-12 w-12"
            />
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your i-Ticket account
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <PhoneInput
                id="phone"
                value={phone}
                onChange={setPhone}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>

            {/* Demo Mode Quick Access */}
            {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground text-center mb-3">
                  Demo Mode - Quick Access
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fillDemoAccount("customer")}
                  >
                    Customer
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fillDemoAccount("company")}
                  >
                    Company
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fillDemoAccount("admin")}
                  >
                    Admin
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </form>

        <CardFooter className="flex flex-col gap-4">
          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

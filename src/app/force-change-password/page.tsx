"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export default function ForceChangePasswordPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Password validation
  const hasMinLength = newPassword.length >= 8
  const hasUppercase = /[A-Z]/.test(newPassword)
  const hasLowercase = /[a-z]/.test(newPassword)
  const hasNumber = /[0-9]/.test(newPassword)
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0

  const isValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValid) {
      toast.error("Please meet all password requirements")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/force-change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, confirmPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to change password")
        return
      }

      toast.success("Password changed successfully!")

      // Update session to clear mustChangePassword flag
      await update()

      // Redirect based on role
      if (session?.user?.role === "SUPER_ADMIN") {
        router.replace("/admin/dashboard")
      } else if (session?.user?.role === "COMPANY_ADMIN") {
        router.replace("/company/dashboard")
      } else {
        router.replace("/")
      }
    } catch (error) {
      console.error("Password change error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d7a7a] via-[#0e9494] to-[#20c4c4] p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Lock className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Change Your Password</CardTitle>
          </div>
          <CardDescription>
            For security reasons, you must change your temporary password before continuing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                disabled={isLoading}
                required
              />
            </div>

            {/* Password Requirements */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="font-semibold mb-2 text-sm">Password must contain:</p>
              <ul className="space-y-1 text-sm">
                <li className={`flex items-center gap-2 ${hasMinLength ? "text-green-600" : "text-gray-500"}`}>
                  <CheckCircle2 className={`h-4 w-4 ${hasMinLength ? "text-green-600" : "text-gray-300"}`} />
                  At least 8 characters
                </li>
                <li className={`flex items-center gap-2 ${hasUppercase ? "text-green-600" : "text-gray-500"}`}>
                  <CheckCircle2 className={`h-4 w-4 ${hasUppercase ? "text-green-600" : "text-gray-300"}`} />
                  One uppercase letter (A-Z)
                </li>
                <li className={`flex items-center gap-2 ${hasLowercase ? "text-green-600" : "text-gray-500"}`}>
                  <CheckCircle2 className={`h-4 w-4 ${hasLowercase ? "text-green-600" : "text-gray-300"}`} />
                  One lowercase letter (a-z)
                </li>
                <li className={`flex items-center gap-2 ${hasNumber ? "text-green-600" : "text-gray-500"}`}>
                  <CheckCircle2 className={`h-4 w-4 ${hasNumber ? "text-green-600" : "text-gray-300"}`} />
                  One number (0-9)
                </li>
                <li className={`flex items-center gap-2 ${passwordsMatch ? "text-green-600" : "text-gray-500"}`}>
                  <CheckCircle2 className={`h-4 w-4 ${passwordsMatch ? "text-green-600" : "text-gray-300"}`} />
                  Passwords match
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={!isValid || isLoading}
            >
              {isLoading ? "Changing Password..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

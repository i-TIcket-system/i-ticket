"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Loader2,
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Save,
  Lock,
  CreditCard,
  Camera,
  X,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"

interface ProfileData {
  id: string
  name: string
  phone: string
  email: string | null
  referralCode: string
  createdAt: string
  lastLoginAt: string | null
  bankAccountName: string | null
  bankAccountNumber: string | null
  bankName: string | null
  alternativePhone: string | null
  profilePicture: string | null
}

export default function SalesProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPayment, setSavingPayment] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form states
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  // Payment settings
  const [bankAccountName, setBankAccountName] = useState("")
  const [bankAccountNumber, setBankAccountNumber] = useState("")
  const [bankName, setBankName] = useState("")
  const [alternativePhone, setAlternativePhone] = useState("")

  // Password form
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/sales/profile")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to load profile")
      }

      setProfile(result)
      setName(result.name)
      setEmail(result.email || "")
      setBankAccountName(result.bankAccountName || "")
      setBankAccountNumber(result.bankAccountNumber || "")
      setBankName(result.bankName || "")
      setAlternativePhone(result.alternativePhone || "")
    } catch (error) {
      console.error("Failed to fetch profile:", error)
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPayment(true)

    try {
      const response = await fetch("/api/sales/profile/payment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankAccountName: bankAccountName || null,
          bankAccountNumber: bankAccountNumber || null,
          bankName: bankName || null,
          alternativePhone: alternativePhone || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update payment settings")
      }

      toast.success("Payment settings updated successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to update payment settings")
    } finally {
      setSavingPayment(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/sales/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: email || null }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile")
      }

      setProfile(result)
      toast.success("Profile updated successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setChangingPassword(true)

    try {
      const response = await fetch("/api/sales/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to change password")
      }

      toast.success("Password changed successfully")
      setShowPasswordForm(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast.error(error.message || "Failed to change password")
    } finally {
      setChangingPassword(false)
    }
  }

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5MB")
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    setUploadingProfilePicture(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/profile-picture", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload profile picture")
      }

      // Update local profile state
      setProfile((prev) => prev ? { ...prev, profilePicture: result.profilePicture } : null)
      toast.success("Profile picture updated successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to upload profile picture")
    } finally {
      setUploadingProfilePicture(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveProfilePicture = async () => {
    if (!profile?.profilePicture) return

    setUploadingProfilePicture(true)

    try {
      const response = await fetch("/api/profile-picture", {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to remove profile picture")
      }

      // Update local profile state
      setProfile((prev) => prev ? { ...prev, profilePicture: null } : null)
      toast.success("Profile picture removed successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to remove profile picture")
    } finally {
      setUploadingProfilePicture(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-8">
        <Link href="/sales/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings
        </p>
      </div>

      {/* Profile Picture Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Profile Picture
          </CardTitle>
          <CardDescription>
            Upload a profile picture to personalize your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              {profile.profilePicture ? (
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
                  <Image
                    src={profile.profilePicture}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                  {!uploadingProfilePicture && (
                    <button
                      onClick={handleRemoveProfilePicture}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                      title="Remove profile picture"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-4 border-gray-200">
                  <User className="h-16 w-16 text-primary/40" />
                </div>
              )}
              {uploadingProfilePicture && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingProfilePicture}
              >
                <Camera className="h-4 w-4 mr-2" />
                {profile.profilePicture ? "Change Picture" : "Upload Picture"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                JPEG, PNG, WebP, or GIF. Maximum size: 5MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={profile.phone}
                  disabled
                  className="bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Phone number cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Member since {formatDate(profile.createdAt)}</span>
              </div>
              {profile.lastLoginAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Last login: {formatDate(profile.lastLoginAt)}</span>
                </div>
              )}
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Payment Settings Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Settings
          </CardTitle>
          <CardDescription>
            Add your bank account details for commission payouts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePaymentSettings} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankAccountName">Account Holder Name</Label>
              <Input
                id="bankAccountName"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                placeholder="Full name as on bank account"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankAccountNumber">Account Number</Label>
              <Input
                id="bankAccountNumber"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="Bank account number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g., CBE, Abyssinia Bank, Awash Bank"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alternativePhone">Alternative Phone (Optional)</Label>
              <Input
                id="alternativePhone"
                value={alternativePhone}
                onChange={(e) => setAlternativePhone(e.target.value)}
                placeholder="09XXXXXXXX"
              />
              <p className="text-xs text-muted-foreground">
                Backup contact number for payout notifications
              </p>
            </div>

            <Button type="submit" disabled={savingPayment}>
              {savingPayment ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Payment Settings
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>
            Change your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showPasswordForm ? (
            <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
              Change Password
            </Button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={changingPassword}>
                  {changingPassword ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  Update Password
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false)
                    setCurrentPassword("")
                    setNewPassword("")
                    setConfirmPassword("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

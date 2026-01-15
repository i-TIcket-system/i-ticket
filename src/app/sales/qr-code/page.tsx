"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Copy, Download, Share2, Users, QrCode as QrIcon, Link as LinkIcon, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

export default function QRCodePage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [referralCode, setReferralCode] = useState<string>("")
  const [recruitsCount, setRecruitsCount] = useState(0)
  const [tier, setTier] = useState(1)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchSalesPersonData()
  }, [])

  async function fetchSalesPersonData() {
    try {
      const response = await fetch("/api/sales/my-qr-code")
      if (response.ok) {
        const data = await response.json()
        setQrCodeUrl(data.qrCodeUrl)
        setReferralCode(data.referralCode)
        setRecruitsCount(data.recruitsCount || 0)
        setTier(data.tier || 1)
      } else {
        toast.error("Failed to load QR code")
      }
    } catch (error) {
      toast.error("Failed to load QR code")
    } finally {
      setLoading(false)
    }
  }

  const referralUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/register?ref=${referralCode}`
    : ""

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      toast.success("Referral link copied!")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy link")
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeUrl) return

    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `i-Ticket-Sales-QR-${referralCode}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("QR code downloaded!")
  }

  const shareReferralLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join i-Ticket Sales Team',
          text: `Join me as a sales person on i-Ticket and start earning commissions! Use my referral code: ${referralCode}`,
          url: referralUrl,
        })
      } catch (error) {
        // User cancelled or error
      }
    } else {
      copyReferralLink()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#0e9494" }} />
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" style={{ color: "#0d4f5c" }}>
          Recruit Sales Team
        </h1>
        <p className="text-muted-foreground">
          Share your QR code or referral link to recruit new sales persons and earn 30% of their commissions
        </p>
      </div>

      {/* Stats Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-purple-200 dark:border-purple-800">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                Tier {tier}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">
                Your Level
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {recruitsCount}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">
                Team Members
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                30%
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">
                Team Commission
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* QR Code Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <QrIcon className="h-5 w-5" style={{ color: "#0e9494" }} />
              <CardTitle>Your Recruitment QR Code</CardTitle>
            </div>
            <CardDescription>
              Let recruits scan this QR code to register under you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {qrCodeUrl ? (
              <div className="flex flex-col items-center">
                <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                  <Image
                    src={qrCodeUrl}
                    alt="Recruitment QR Code"
                    width={200}
                    height={200}
                    className="w-48 h-48"
                  />
                </div>
                <div className="mt-3 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <code className="text-sm font-mono font-semibold">{referralCode}</code>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                QR code not available
              </div>
            )}
            <Button
              onClick={downloadQRCode}
              className="w-full"
              variant="outline"
              disabled={!qrCodeUrl}
            >
              <Download className="mr-2 h-4 w-4" />
              Download QR Code
            </Button>
          </CardContent>
        </Card>

        {/* Referral Link Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" style={{ color: "#0e9494" }} />
              <CardTitle>Your Referral Link</CardTitle>
            </div>
            <CardDescription>
              Share this link to recruit new sales persons
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
              <p className="text-sm font-mono break-all text-gray-700 dark:text-gray-300">
                {referralUrl}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={copyReferralLink}
                variant="outline"
                className="w-full"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
              <Button
                onClick={shareReferralLink}
                variant="outline"
                className="w-full"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Recruitment Works</CardTitle>
          <CardDescription>
            Earn 30% of commissions from your recruited team members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ background: "#0e9494" }}>
                1
              </div>
              <h3 className="font-semibold">Share Your Link</h3>
              <p className="text-sm text-muted-foreground">
                Share your QR code or referral link with people interested in earning commissions
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ background: "#0e9494" }}>
                2
              </div>
              <h3 className="font-semibold">They Register</h3>
              <p className="text-sm text-muted-foreground">
                When they register using your link and check "Register as Sales Person", they join your team
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ background: "#0e9494" }}>
                3
              </div>
              <h3 className="font-semibold">Earn Together</h3>
              <p className="text-sm text-muted-foreground">
                You earn 30% of every commission they make. They keep 70%. Everyone wins!
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Commission Split Example
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  When your recruit earns 100 Birr commission: They get 70 Birr, you get 30 Birr. This is a one-level split only - if they recruit others, you don't earn from those recruits.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

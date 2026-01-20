"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Loader2,
  QrCode,
  Download,
  Copy,
  MousePointerClick,
  Users,
  UserCheck,
  TrendingUp,
  DollarSign,
  Wallet,
  Bus,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate, formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

interface DashboardData {
  salesPerson: {
    id: string
    name: string
    referralCode: string
    referralUrl: string
    qrCodeUrl: string
    createdAt: string
  }
  stats: {
    totalScans: number
    uniqueVisitors: number
    totalConversions: number
    conversionRate: number
    commission: {
      total: number
      pending: number
      paid: number
      thisMonth: number
      lastMonth: number
      direct: number
      team: number
    }
    team: {
      recruitsCount: number
      teamEarnings: number
    }
    recentActivity: {
      scansToday: number
      scansThisWeek: number
      scansThisMonth: number
      conversionsThisWeek: number
      bookingsGenerated: number
    }
  }
  recentReferrals: Array<{
    userId: string
    userName: string
    userPhone: string
    attributedAt: string
  }>
  recentCommissions: Array<{
    id: string
    trip: string
    tripDate: string
    ticketAmount: number
    salesCommission: number
    status: string
    createdAt: string
  }>
}

export default function SalesDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await fetch("/api/sales/dashboard")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to load dashboard")
      }

      setData(result)
    } catch (error) {
      console.error("Failed to fetch dashboard:", error)
      toast.error("Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = () => {
    if (data) {
      navigator.clipboard.writeText(data.salesPerson.referralCode)
      toast.success("Referral code copied!")
    }
  }

  const handleCopyUrl = () => {
    if (data) {
      navigator.clipboard.writeText(data.salesPerson.referralUrl)
      toast.success("Referral URL copied!")
    }
  }

  const handleDownloadQR = () => {
    if (data) {
      const link = document.createElement("a")
      link.href = data.salesPerson.qrCodeUrl
      link.download = `qr-${data.salesPerson.referralCode}.png`
      link.click()
      toast.success("QR code downloaded!")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome, {data.salesPerson.name}!</h1>
        <p className="text-muted-foreground mt-1">
          Track your referrals and commissions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - QR Code */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Your QR Code
              </CardTitle>
              <CardDescription>
                Print this for your flyers and posters
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="bg-white p-4 rounded-lg inline-block mb-4 border">
                <Image
                  src={data.salesPerson.qrCodeUrl}
                  alt="QR Code"
                  width={200}
                  height={200}
                  className="mx-auto"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="outline" className="font-mono text-lg px-4 py-1">
                    {data.salesPerson.referralCode}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={handleCopyCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={handleDownloadQR} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download QR Code
                </Button>
                <Button variant="outline" className="w-full" onClick={handleCopyUrl}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Referral URL
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Earnings Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Earnings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Earned</span>
                <span className="font-bold text-lg">{formatCurrency(data.stats.commission.total)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Paid Out</span>
                <span className="text-green-600">{formatCurrency(data.stats.commission.paid)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-4">
                <span className="font-medium">Pending</span>
                <span className="font-bold text-lg text-orange-600">
                  {formatCurrency(data.stats.commission.pending)}
                </span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">This Month</span>
                  <span>{formatCurrency(data.stats.commission.thisMonth)}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-muted-foreground">Last Month</span>
                  <span>{formatCurrency(data.stats.commission.lastMonth)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commission Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Commission Breakdown
              </CardTitle>
              <CardDescription>
                Direct vs Team earnings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Direct Sales</span>
                  <span className="font-semibold">{formatCurrency(data.stats.commission.direct)}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${data.stats.commission.total > 0 ? (data.stats.commission.direct / data.stats.commission.total) * 100 : 0}%`,
                      background: "#0e9494"
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">
                    Team Earnings (30%)
                  </span>
                  <span className="font-semibold">{formatCurrency(data.stats.commission.team)}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-purple-500"
                    style={{
                      width: `${data.stats.commission.total > 0 ? (data.stats.commission.team / data.stats.commission.total) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
              {data.stats.team.recruitsCount > 0 && (
                <div className="pt-3 border-t">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/sales/team">
                      <Users className="h-4 w-4 mr-2" />
                      View My Team ({data.stats.team.recruitsCount})
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <MousePointerClick className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Scans</p>
                    <p className="text-2xl font-bold">{data.stats.totalScans}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Unique Visitors</p>
                    <p className="text-2xl font-bold">{data.stats.uniqueVisitors}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Conversions</p>
                    <p className="text-2xl font-bold">{data.stats.totalConversions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Conv. Rate</p>
                    <p className="text-2xl font-bold">{data.stats.conversionRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{data.stats.recentActivity.scansToday}</p>
                  <p className="text-sm text-muted-foreground">Today</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{data.stats.recentActivity.scansThisWeek}</p>
                  <p className="text-sm text-muted-foreground">This Week</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{data.stats.recentActivity.scansThisMonth}</p>
                  <p className="text-sm text-muted-foreground">This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Referrals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentReferrals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No referrals yet. Start distributing your QR code!
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentReferrals.map((r) => (
                      <TableRow key={r.userId}>
                        <TableCell className="font-medium">{r.userName}</TableCell>
                        <TableCell>{r.userPhone}</TableCell>
                        <TableCell>{formatDate(r.attributedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Recent Commissions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Commissions</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sales/commissions">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data.recentCommissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No commissions yet. You earn when your referred users book!
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip</TableHead>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentCommissions.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Bus className="h-4 w-4 text-muted-foreground" />
                            {c.trip}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(c.ticketAmount)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(c.salesCommission)}</TableCell>
                        <TableCell>
                          <Badge variant={c.status === "PAID" ? "default" : "secondary"}>
                            {c.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

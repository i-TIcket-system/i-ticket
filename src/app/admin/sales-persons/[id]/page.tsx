"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import {
  Loader2,
  ArrowLeft,
  Phone,
  Mail,
  QrCode,
  Download,
  Copy,
  CheckCircle2,
  XCircle,
  DollarSign,
  MousePointerClick,
  UserCheck,
  TrendingUp,
  Calendar,
  Users,
  Wallet,
  Bus,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate, formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

interface SalesPersonDetail {
  id: string
  name: string
  phone: string
  email: string | null
  referralCode: string
  referralUrl: string
  qrCodeUrl: string
  status: string
  createdAt: string
  lastLoginAt: string | null
  stats: {
    totalScans: number
    uniqueVisitors: number
    conversions: number
    conversionRate: number
    totalCommission: number
    pendingCommission: number
    paidCommission: number
    bookingsGenerated: number
    scansToday: number
    scansThisWeek: number
    scansThisMonth: number
  }
  referrals: Array<{
    userId: string
    userName: string
    userPhone: string
    attributedAt: string
  }>
  recentCommissions: Array<{
    id: string
    bookingId: string
    trip: string
    tripDate: string
    ticketAmount: number
    salesCommission: number
    status: string
    createdAt: string
  }>
}

export default function SalesPersonDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [salesPerson, setSalesPerson] = useState<SalesPersonDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false)
  const [payoutMethod, setPayoutMethod] = useState<string>("CASH")
  const [payoutRef, setPayoutRef] = useState("")
  const [payoutNotes, setPayoutNotes] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role !== "SUPER_ADMIN") {
      router.push("/")
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === "SUPER_ADMIN" && params.id) {
      fetchSalesPerson()
    }
  }, [session, params.id])

  const fetchSalesPerson = async () => {
    try {
      const response = await fetch(`/api/admin/sales-persons/${params.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch sales person")
      }

      setSalesPerson(data.salesPerson)
    } catch (error) {
      console.error("Failed to fetch sales person:", error)
      toast.error("Failed to load sales person")
      router.push("/admin/sales-persons")
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = () => {
    if (salesPerson) {
      navigator.clipboard.writeText(salesPerson.referralCode)
      toast.success("Referral code copied!")
    }
  }

  const handleCopyUrl = () => {
    if (salesPerson) {
      navigator.clipboard.writeText(salesPerson.referralUrl)
      toast.success("Referral URL copied!")
    }
  }

  const handleDownloadQR = () => {
    if (salesPerson) {
      const link = document.createElement("a")
      link.href = salesPerson.qrCodeUrl
      link.download = `qr-${salesPerson.referralCode}.png`
      link.click()
      toast.success("QR code downloaded!")
    }
  }

  const handleToggleStatus = async () => {
    if (!salesPerson) return

    try {
      const newStatus = salesPerson.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
      const response = await fetch(`/api/admin/sales-persons/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update status")
      }

      toast.success(`Sales person ${newStatus === "ACTIVE" ? "activated" : "deactivated"}`)
      fetchSalesPerson()
    } catch (error) {
      toast.error("Failed to update status")
    }
  }

  const handlePayout = async () => {
    if (!salesPerson || salesPerson.stats.pendingCommission <= 0) return

    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/sales-persons/${params.id}/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: payoutMethod,
          paymentRef: payoutRef || undefined,
          notes: payoutNotes || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process payout")
      }

      toast.success(`Payout of ${formatCurrency(data.payout.amount)} processed!`)
      setPayoutDialogOpen(false)
      setPayoutMethod("CASH")
      setPayoutRef("")
      setPayoutNotes("")
      fetchSalesPerson()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to process payout")
    } finally {
      setProcessing(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!salesPerson) return null

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/sales-persons")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{salesPerson.name}</h1>
            <Badge variant={salesPerson.status === "ACTIVE" ? "default" : "secondary"}>
              {salesPerson.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-1 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              {salesPerson.phone}
            </span>
            {salesPerson.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {salesPerson.email}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Joined {formatDate(salesPerson.createdAt)}
            </span>
          </div>
        </div>
        <Button variant="outline" onClick={handleToggleStatus}>
          {salesPerson.status === "ACTIVE" ? "Deactivate" : "Activate"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - QR Code & Stats */}
        <div className="space-y-6">
          {/* QR Code Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code
              </CardTitle>
              <CardDescription>
                Print this for flyers and posters
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="bg-white p-4 rounded-lg inline-block mb-4 border">
                <Image
                  src={salesPerson.qrCodeUrl}
                  alt="QR Code"
                  width={200}
                  height={200}
                  className="mx-auto"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="outline" className="font-mono text-lg px-4 py-1">
                    {salesPerson.referralCode}
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

          {/* Commission Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Commission
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Earned</span>
                <span className="font-bold text-lg">{formatCurrency(salesPerson.stats.totalCommission)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Paid Out</span>
                <span className="text-green-600">{formatCurrency(salesPerson.stats.paidCommission)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-4">
                <span className="font-medium">Pending</span>
                <span className="font-bold text-lg text-orange-600">
                  {formatCurrency(salesPerson.stats.pendingCommission)}
                </span>
              </div>

              <Button
                className="w-full"
                disabled={salesPerson.stats.pendingCommission <= 0}
                onClick={() => setPayoutDialogOpen(true)}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Process Payout
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats & Tables */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <MousePointerClick className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Scans</p>
                    <p className="text-2xl font-bold">{salesPerson.stats.totalScans}</p>
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
                    <p className="text-2xl font-bold">{salesPerson.stats.uniqueVisitors}</p>
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
                    <p className="text-2xl font-bold">{salesPerson.stats.conversions}</p>
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
                    <p className="text-2xl font-bold">{salesPerson.stats.conversionRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scan Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Scan Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{salesPerson.stats.scansToday}</p>
                  <p className="text-sm text-muted-foreground">Today</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{salesPerson.stats.scansThisWeek}</p>
                  <p className="text-sm text-muted-foreground">This Week</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{salesPerson.stats.scansThisMonth}</p>
                  <p className="text-sm text-muted-foreground">This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Referrals and Commissions */}
          <Tabs defaultValue="referrals">
            <TabsList>
              <TabsTrigger value="referrals">Referred Users ({salesPerson.referrals.length})</TabsTrigger>
              <TabsTrigger value="commissions">Commissions ({salesPerson.recentCommissions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="referrals">
              <Card>
                <CardContent className="pt-6">
                  {salesPerson.referrals.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No referrals yet</p>
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
                        {salesPerson.referrals.map((r) => (
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
            </TabsContent>

            <TabsContent value="commissions">
              <Card>
                <CardContent className="pt-6">
                  {salesPerson.recentCommissions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No commissions yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Trip</TableHead>
                          <TableHead>Ticket Amount</TableHead>
                          <TableHead>Commission</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesPerson.recentCommissions.map((c) => (
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
                            <TableCell>{formatDate(c.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Payout Dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payout</DialogTitle>
            <DialogDescription>
              Pay out {formatCurrency(salesPerson.stats.pendingCommission)} to {salesPerson.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="TELEBIRR">TeleBirr</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment Reference (Optional)</Label>
              <Input
                placeholder="Transaction ID or receipt number"
                value={payoutRef}
                onChange={(e) => setPayoutRef(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Any additional notes..."
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayout} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    />
  )
}

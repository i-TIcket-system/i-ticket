"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Loader2,
  Users,
  Phone,
  Mail,
  QrCode,
  TrendingUp,
  Eye,
  UserPlus,
  CheckCircle2,
  XCircle,
  DollarSign,
  MousePointerClick,
  UserCheck,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { formatDate, formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

interface SalesPerson {
  id: string
  name: string
  phone: string
  email: string | null
  referralCode: string
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
    bookingsGenerated: number
  }
}

export default function SalesPersonsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role !== "SUPER_ADMIN") {
      router.push("/")
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === "SUPER_ADMIN") {
      fetchSalesPersons()
    }
  }, [session])

  const fetchSalesPersons = async () => {
    try {
      const response = await fetch("/api/admin/sales-persons")
      const data = await response.json()
      setSalesPersons(data.salesPersons || [])
    } catch (error) {
      console.error("Failed to fetch sales persons:", error)
      toast.error("Failed to load sales persons")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    setErrors({})

    // Validation
    const newErrors: Record<string, string> = {}
    if (!formData.name || formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    }
    if (!formData.phone || !/^09\d{8}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone format (09XXXXXXXX)"
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    } else if (!/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and number"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setCreating(true)
    try {
      const response = await fetch("/api/admin/sales-persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create sales person")
      }

      toast.success(`Sales person created! Referral code: ${data.salesPerson.referralCode}`)
      setDialogOpen(false)
      setFormData({ name: "", phone: "", email: "", password: "" })
      fetchSalesPersons()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create sales person")
    } finally {
      setCreating(false)
    }
  }

  // Calculate totals
  const totals = salesPersons.reduce(
    (acc, sp) => ({
      scans: acc.scans + sp.stats.totalScans,
      conversions: acc.conversions + sp.stats.conversions,
      commission: acc.commission + sp.stats.totalCommission,
      pending: acc.pending + sp.stats.pendingCommission,
    }),
    { scans: 0, conversions: 0, commission: 0, pending: 0 }
  )

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Sales Team</h1>
          <p className="text-muted-foreground mt-1">
            Manage sales persons and track their performance
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Sales Person
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Sales Person</DialogTitle>
              <DialogDescription>
                Create a new sales person account. They will receive a unique referral code for their QR flyers.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Abel Tadesse"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="09XXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 8 chars, uppercase, lowercase, number"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Sales Person
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sales Persons</p>
                <p className="text-2xl font-bold">{salesPersons.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <MousePointerClick className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Scans</p>
                <p className="text-2xl font-bold">{totals.scans.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversions</p>
                <p className="text-2xl font-bold">{totals.conversions.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-100">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Payouts</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.pending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Persons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Persons</CardTitle>
          <CardDescription>
            Click on a sales person to view details and process payouts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {salesPersons.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No sales persons yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first sales person to start tracking referrals
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Sales Person
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Referral Code</TableHead>
                  <TableHead className="text-center">Scans</TableHead>
                  <TableHead className="text-center">Conversions</TableHead>
                  <TableHead className="text-center">Rate</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesPersons.map((sp) => (
                  <TableRow key={sp.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{sp.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {sp.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        <QrCode className="h-3 w-3 mr-1" />
                        {sp.referralCode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{sp.stats.totalScans}</TableCell>
                    <TableCell className="text-center">{sp.stats.conversions}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={sp.stats.conversionRate >= 10 ? "default" : "secondary"}>
                        {sp.stats.conversionRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(sp.stats.pendingCommission)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={sp.status === "ACTIVE" ? "default" : "secondary"}>
                        {sp.status === "ACTIVE" ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {sp.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/sales-persons/${sp.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

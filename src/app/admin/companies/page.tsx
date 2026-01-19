"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Loader2,
  Building2,
  Users,
  Bus,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Plus,
  Pencil,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"

interface Company {
  id: string
  name: string
  phones: string
  email: string | null
  address: string | null
  bankName: string | null
  bankAccount: string | null
  bankBranch: string | null
  adminName: string | null
  adminPhone: string | null
  adminEmail: string | null
  isActive: boolean
  createdAt: string
  _count: {
    users: number
    trips: number
  }
}

export default function CompaniesManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deactivationReason, setDeactivationReason] = useState("")
  const [dialogOpen, setDialogOpen] = useState<string | null>(null)
  const [reasonError, setReasonError] = useState("")

  // Add Company Dialog State
  const [addCompanyOpen, setAddCompanyOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newCompany, setNewCompany] = useState({
    companyName: "",
    companyPhone: "",
    companyEmail: "",
    address: "",
    bankName: "",
    bankAccount: "",
    bankBranch: "",
    adminName: "",
    adminPhone: "",
    adminEmail: "",
  })

  // Edit Company Dialog State
  const [editCompanyOpen, setEditCompanyOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [editCompanyData, setEditCompanyData] = useState({
    companyName: "",
    companyPhone: "",
    companyEmail: "",
    address: "",
    bankName: "",
    bankAccount: "",
    bankBranch: "",
    adminName: "",
    adminPhone: "",
    adminEmail: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role !== "SUPER_ADMIN") {
      router.push("/")
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === "SUPER_ADMIN") {
      fetchCompanies()
    }
  }, [session])

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/admin/companies")
      const data = await response.json()
      setCompanies(data.companies || [])
    } catch (error) {
      console.error("Failed to fetch companies:", error)
      toast.error("Failed to load companies")
    } finally {
      setLoading(false)
    }
  }

  const toggleCompanyStatus = async (companyId: string, currentStatus: boolean, companyName: string) => {
    // Client-side validation
    const trimmedReason = deactivationReason.trim()

    if (trimmedReason.length < 10) {
      setReasonError("Reason must be at least 10 characters")
      return
    }

    if (trimmedReason.length > 500) {
      setReasonError("Reason must not exceed 500 characters")
      return
    }

    setToggling(companyId)
    setReasonError("")

    try {
      const response = await fetch("/api/admin/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          isActive: !currentStatus,
          reason: trimmedReason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update company status")
      }

      toast.success(data.message)

      // Update local state
      setCompanies((prev) =>
        prev.map((company) =>
          company.id === companyId
            ? { ...company, isActive: !currentStatus }
            : company
        )
      )

      // Close dialog and reset reason
      setDialogOpen(null)
      setDeactivationReason("")
    } catch (error) {
      console.error("Toggle error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update company status")
    } finally {
      setToggling(null)
    }
  }

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCompany),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create company")
      }

      toast.success(data.message)

      // Show temporary password in development mode
      if (process.env.NODE_ENV === "development" && data.credentials?.tempPassword) {
        toast.info(`Temp Password: ${data.credentials.tempPassword}`, {
          duration: 10000,
          description: "Save this password - it will only be shown once!",
        })
      }

      // Copy credentials to clipboard
      const credentials = `Company: ${newCompany.companyName}\nAdmin Phone: ${data.credentials.phone}\nTemporary Password: ${data.credentials.tempPassword}\n\nPlease change your password on first login.`
      navigator.clipboard.writeText(credentials)
      toast.success("Credentials copied to clipboard!")

      // Close dialog and reset form
      setAddCompanyOpen(false)
      setNewCompany({
        companyName: "",
        companyPhone: "",
        companyEmail: "",
        address: "",
        bankName: "",
        bankAccount: "",
        bankBranch: "",
        adminName: "",
        adminPhone: "",
        adminEmail: "",
      })

      // Refresh companies list
      fetchCompanies()
    } catch (error) {
      console.error("Create company error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create company")
    } finally {
      setCreating(false)
    }
  }

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company)
    const phones = JSON.parse(company.phones || "[]")
    setEditCompanyData({
      companyName: company.name || "",
      companyPhone: phones[0] || "",
      companyEmail: company.email || "",
      address: company.address || "",
      bankName: company.bankName || "",
      bankAccount: company.bankAccount || "",
      bankBranch: company.bankBranch || "",
      adminName: company.adminName || "",
      adminPhone: company.adminPhone || "",
      adminEmail: company.adminEmail || "",
    })
    setEditCompanyOpen(true)
  }

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCompany) return

    setUpdating(true)

    try {
      const response = await fetch(`/api/admin/companies/${editingCompany.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editCompanyData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update company")
      }

      toast.success(data.message)

      // Close dialog and reset form
      setEditCompanyOpen(false)
      setEditingCompany(null)
      setEditCompanyData({
        companyName: "",
        companyPhone: "",
        companyEmail: "",
        address: "",
        bankName: "",
        bankAccount: "",
        bankBranch: "",
        adminName: "",
        adminPhone: "",
        adminEmail: "",
      })

      // Refresh companies list
      fetchCompanies()
    } catch (error) {
      console.error("Update company error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update company")
    } finally {
      setUpdating(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 animate-ping">
              <div className="h-16 w-16 rounded-full bg-amber-500/20" />
            </div>
            <Loader2 className="h-16 w-16 animate-spin text-amber-600" />
          </div>
          <p className="mt-4 text-stone-600 font-medium">Loading companies...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return null
  }

  const activeCompanies = companies.filter((c) => c.isActive).length
  const inactiveCompanies = companies.filter((c) => !c.isActive).length
  const totalUsers = companies.reduce((sum, c) => sum + c._count.users, 0)
  const totalTrips = companies.reduce((sum, c) => sum + c._count.trips, 0)

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-primary/5 via-purple-50/50 to-blue-50/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent"></div>
      </div>

      <div className="container mx-auto py-12 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Companies Management</h1>
                <p className="text-muted-foreground">Manage all bus companies on the platform</p>
              </div>
            </div>
            <Dialog open={addCompanyOpen} onOpenChange={setAddCompanyOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Company
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Register New Bus Company</DialogTitle>
                  <DialogDescription>
                    Create a new company account with admin credentials. The admin will receive a temporary password.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateCompany} className="space-y-6">
                  {/* Company Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase">Company Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="companyName">Company Name *</Label>
                        <Input
                          id="companyName"
                          value={newCompany.companyName}
                          onChange={(e) => setNewCompany({ ...newCompany, companyName: e.target.value })}
                          placeholder="e.g., Selam Bus"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="companyPhone">Company Phone *</Label>
                        <Input
                          id="companyPhone"
                          value={newCompany.companyPhone}
                          onChange={(e) => setNewCompany({ ...newCompany, companyPhone: e.target.value })}
                          placeholder="09XXXXXXXX"
                          pattern="09\d{8}"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="companyEmail">Company Email *</Label>
                        <Input
                          id="companyEmail"
                          type="email"
                          value={newCompany.companyEmail}
                          onChange={(e) => setNewCompany({ ...newCompany, companyEmail: e.target.value })}
                          placeholder="info@company.com"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="address">Address (Optional)</Label>
                        <Input
                          id="address"
                          value={newCompany.address}
                          onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                          placeholder="Physical address"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bank Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase">Bank Information (Optional)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                          id="bankName"
                          value={newCompany.bankName}
                          onChange={(e) => setNewCompany({ ...newCompany, bankName: e.target.value })}
                          placeholder="e.g., CBE"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bankAccount">Account Number</Label>
                        <Input
                          id="bankAccount"
                          value={newCompany.bankAccount}
                          onChange={(e) => setNewCompany({ ...newCompany, bankAccount: e.target.value })}
                          placeholder="Account number"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="bankBranch">Bank Branch</Label>
                        <Input
                          id="bankBranch"
                          value={newCompany.bankBranch}
                          onChange={(e) => setNewCompany({ ...newCompany, bankBranch: e.target.value })}
                          placeholder="Branch name"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Admin Account */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase">Admin Account</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="adminName">Admin Name *</Label>
                        <Input
                          id="adminName"
                          value={newCompany.adminName}
                          onChange={(e) => setNewCompany({ ...newCompany, adminName: e.target.value })}
                          placeholder="Full name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="adminPhone">Admin Phone *</Label>
                        <Input
                          id="adminPhone"
                          value={newCompany.adminPhone}
                          onChange={(e) => setNewCompany({ ...newCompany, adminPhone: e.target.value })}
                          placeholder="09XXXXXXXX"
                          pattern="09\d{8}"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="adminEmail">Admin Email *</Label>
                        <Input
                          id="adminEmail"
                          type="email"
                          value={newCompany.adminEmail}
                          onChange={(e) => setNewCompany({ ...newCompany, adminEmail: e.target.value })}
                          placeholder="admin@company.com"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setAddCompanyOpen(false)} disabled={creating}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={creating}>
                      {creating ? "Creating..." : "Create Company"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="backdrop-blur-lg bg-gradient-to-br from-teal-50 to-teal-100/70 border-teal-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
              <div className="p-2 rounded-lg bg-teal-500/20">
                <Building2 className="h-4 w-4 text-teal-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-900">{companies.length}</div>
              <p className="text-xs text-teal-800 mt-1">
                Registered on platform
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-lg bg-gradient-to-br from-green-50 to-green-100/70 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Companies</CardTitle>
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle2 className="h-4 w-4 text-green-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{activeCompanies}</div>
              <p className="text-xs text-green-800 mt-1">
                Currently operational
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-lg bg-gradient-to-br from-blue-50 to-blue-100/70 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Users className="h-4 w-4 text-blue-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{totalUsers}</div>
              <p className="text-xs text-blue-800 mt-1">
                Company admin users
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-lg bg-gradient-to-br from-purple-50 to-purple-100/70 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Bus className="h-4 w-4 text-purple-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{totalTrips}</div>
              <p className="text-xs text-purple-800 mt-1">
                Scheduled trips
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Companies Table */}
        <Card className="backdrop-blur-lg bg-white/50 border-white/40 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              All Companies
            </CardTitle>
            <CardDescription>
              {companies.length} companies registered on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {companies.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No companies found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-center">Staff</TableHead>
                      <TableHead className="text-center">Trips</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Building2 className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{company.name}</div>
                              <div className="text-xs text-muted-foreground">
                                ID: {company.id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span>{company.phone}</span>
                            </div>
                            {company.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs">{company.email}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {company.address ? (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{company.address}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-mono">
                            {company._count.users}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-mono">
                            {company._count.trips}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {company.isActive ? (
                            <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/10 text-red-700 hover:bg-red-500/20">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(company.createdAt)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditCompany(company)}
                              className="gap-2"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </Button>
                            <AlertDialog
                              open={dialogOpen === company.id}
                              onOpenChange={(open) => {
                                if (!open) {
                                  setDialogOpen(null)
                                  setDeactivationReason("")
                                  setReasonError("")
                                }
                              }}
                            >
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant={company.isActive ? "destructive" : "default"}
                                  size="sm"
                                  onClick={() => setDialogOpen(company.id)}
                                  disabled={toggling === company.id}
                                  className="gap-2"
                                >
                                  {company.isActive ? (
                                    <>
                                      <ToggleLeft className="h-4 w-4" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <ToggleRight className="h-4 w-4" />
                                      Activate
                                    </>
                                  )}
                                </Button>
                              </AlertDialogTrigger>

                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {company.isActive ? "Deactivate" : "Activate"} Company
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  You are about to {company.isActive ? "deactivate" : "activate"}{" "}
                                  <span className="font-semibold text-foreground">{company.name}</span>.
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              {/* Warning box for deactivation */}
                              {company.isActive && (
                                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-yellow-800">
                                      <p className="font-medium mb-1">Impact of Deactivation:</p>
                                      <ul className="list-disc list-inside space-y-1 text-xs">
                                        <li>Company cannot create new trips</li>
                                        <li>Existing trips become unavailable for booking</li>
                                        <li>Company admins retain read-only access</li>
                                        <li>This action will be logged in the audit trail</li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Reason textarea */}
                              <div className="space-y-2">
                                <Label htmlFor="reason">
                                  Reason for {company.isActive ? "Deactivation" : "Activation"} *
                                </Label>
                                <Textarea
                                  id="reason"
                                  placeholder={`Explain why you are ${company.isActive ? "deactivating" : "activating"} this company (10-500 characters)...`}
                                  value={deactivationReason}
                                  onChange={(e) => {
                                    setDeactivationReason(e.target.value)
                                    setReasonError("")
                                  }}
                                  className={reasonError ? "border-red-500" : ""}
                                  rows={4}
                                />
                                {reasonError && (
                                  <p className="text-sm text-red-500">{reasonError}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {deactivationReason.trim().length}/500 characters
                                </p>
                              </div>

                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={toggling === company.id}>
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={(e) => {
                                    e.preventDefault()
                                    toggleCompanyStatus(company.id, company.isActive, company.name)
                                  }}
                                  disabled={toggling === company.id}
                                  className={company.isActive
                                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    : "bg-green-600 text-white hover:bg-green-700"
                                  }
                                >
                                  {toggling === company.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Processing...
                                    </>
                                  ) : company.isActive ? (
                                    "Deactivate Company"
                                  ) : (
                                    "Activate Company"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inactive Companies Warning */}
        {inactiveCompanies > 0 && (
          <Card className="mt-6 border-yellow-200 bg-yellow-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900">
                    {inactiveCompanies} Inactive {inactiveCompanies === 1 ? "Company" : "Companies"}
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Inactive companies cannot create new trips or accept bookings. Their existing trips remain visible but are marked as unavailable.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Company Dialog */}
      <Dialog open={editCompanyOpen} onOpenChange={setEditCompanyOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Company Details</DialogTitle>
            <DialogDescription>
              Update company information, bank details, and admin contact information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCompany} className="space-y-6">
            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase">Company Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="edit-companyName">Company Name *</Label>
                  <Input
                    id="edit-companyName"
                    value={editCompanyData.companyName}
                    onChange={(e) => setEditCompanyData({ ...editCompanyData, companyName: e.target.value })}
                    placeholder="e.g., Selam Bus"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-companyPhone">Company Phone *</Label>
                  <Input
                    id="edit-companyPhone"
                    value={editCompanyData.companyPhone}
                    onChange={(e) => setEditCompanyData({ ...editCompanyData, companyPhone: e.target.value })}
                    placeholder="09XXXXXXXX"
                    pattern="09\d{8}"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-companyEmail">Company Email *</Label>
                  <Input
                    id="edit-companyEmail"
                    type="email"
                    value={editCompanyData.companyEmail}
                    onChange={(e) => setEditCompanyData({ ...editCompanyData, companyEmail: e.target.value })}
                    placeholder="info@company.com"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-address">Address (Optional)</Label>
                  <Input
                    id="edit-address"
                    value={editCompanyData.address}
                    onChange={(e) => setEditCompanyData({ ...editCompanyData, address: e.target.value })}
                    placeholder="Physical address"
                  />
                </div>
              </div>
            </div>

            {/* Bank Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase">Bank Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-bankName">Bank Name</Label>
                  <Input
                    id="edit-bankName"
                    value={editCompanyData.bankName}
                    onChange={(e) => setEditCompanyData({ ...editCompanyData, bankName: e.target.value })}
                    placeholder="e.g., CBE"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-bankAccount">Account Number</Label>
                  <Input
                    id="edit-bankAccount"
                    value={editCompanyData.bankAccount}
                    onChange={(e) => setEditCompanyData({ ...editCompanyData, bankAccount: e.target.value })}
                    placeholder="Account number"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-bankBranch">Bank Branch</Label>
                  <Input
                    id="edit-bankBranch"
                    value={editCompanyData.bankBranch}
                    onChange={(e) => setEditCompanyData({ ...editCompanyData, bankBranch: e.target.value })}
                    placeholder="Branch name"
                  />
                </div>
              </div>
            </div>

            {/* Admin Contact Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase">Admin Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="edit-adminName">Admin Name</Label>
                  <Input
                    id="edit-adminName"
                    value={editCompanyData.adminName}
                    onChange={(e) => setEditCompanyData({ ...editCompanyData, adminName: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-adminPhone">Admin Phone</Label>
                  <Input
                    id="edit-adminPhone"
                    value={editCompanyData.adminPhone}
                    onChange={(e) => setEditCompanyData({ ...editCompanyData, adminPhone: e.target.value })}
                    placeholder="09XXXXXXXX"
                    pattern="09\d{8}"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-adminEmail">Admin Email</Label>
                  <Input
                    id="edit-adminEmail"
                    type="email"
                    value={editCompanyData.adminEmail}
                    onChange={(e) => setEditCompanyData({ ...editCompanyData, adminEmail: e.target.value })}
                    placeholder="admin@company.com"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditCompanyOpen(false)} disabled={updating}>
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? "Updating..." : "Update Company"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

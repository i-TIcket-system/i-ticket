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
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"

interface Company {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
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

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading companies...</p>
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
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Companies Management</h1>
              <p className="text-muted-foreground">Manage all bus companies on the platform</p>
            </div>
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
    </div>
  )
}

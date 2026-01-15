"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Building2,
  Mail,
  Phone,
  Users,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Save,
  Shield,
  Car,
  Ticket,
  UserCheck,
  Globe,
  MapPin,
  Printer,
  FileText,
  Hash,
  Landmark,
  CreditCard,
  UserCog,
  HeadphonesIcon,
  Mailbox,
  Wrench,
  DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PhoneInput } from "@/components/ui/phone-input"
import { toast } from "sonner"

interface Company {
  id: string
  name: string
  email: string
  phones: string[]
  fax: string | null
  website: string | null
  address: string | null
  poBox: string | null
  tinNumber: string | null
  bankName: string | null
  bankAccount: string | null
  bankBranch: string | null
  adminName: string | null
  adminPhone: string | null
  adminEmail: string | null
  supportName: string | null
  supportPhone: string | null
  preparedBy: string | null
  reviewedBy: string | null
  approvedBy: string | null
}

interface StaffMember {
  id: string
  name: string
  phone: string
  email: string | null
  staffRole: string
  licenseNumber: string | null
  employeeId: string | null
}

const STAFF_ROLES: Record<string, { label: string; icon: any; color: string }> = {
  ADMIN: { label: "Admin", icon: Shield, color: "bg-purple-100 text-purple-800" },
  DRIVER: { label: "Driver", icon: Car, color: "bg-blue-100 text-blue-800" },
  CONDUCTOR: { label: "Conductor", icon: UserCheck, color: "bg-green-100 text-green-800" },
  MANUAL_TICKETER: { label: "Manual Ticketer", icon: Ticket, color: "bg-orange-100 text-orange-800" },
  MECHANIC: { label: "Mechanic", icon: Wrench, color: "bg-amber-100 text-amber-800" },
  FINANCE: { label: "Finance", icon: DollarSign, color: "bg-emerald-100 text-emerald-800" },
}

// Helper to get role display info (handles custom roles)
const getRoleInfo = (role: string) => {
  if (STAFF_ROLES[role]) {
    return STAFF_ROLES[role]
  }
  // Custom role fallback
  return {
    label: role.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    icon: Users,
    color: "bg-gray-100 text-gray-800"
  }
}

export default function CompanyProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [company, setCompany] = useState<Company | null>(null)
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false)

  // Company info form
  const [companyForm, setCompanyForm] = useState({
    name: "",
    email: "",
    phones: [] as string[],
    fax: "",
    website: "",
    address: "",
    poBox: "",
    tinNumber: "",
    bankName: "",
    bankAccount: "",
    bankBranch: "",
    adminName: "",
    adminPhone: "",
    adminEmail: "",
    supportName: "",
    supportPhone: "",
    preparedBy: "",
    reviewedBy: "",
    approvedBy: "",
  })

  // Add staff form
  const [newStaff, setNewStaff] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    staffRole: "DRIVER",
    licenseNumber: "",
    employeeId: "",
  })

  useEffect(() => {
    if (status === "authenticated") {
      if (session.user.role !== "COMPANY_ADMIN") {
        router.push("/")
        return
      }
      fetchCompanyProfile()
      fetchStaff()
    }
  }, [status, session])

  const fetchCompanyProfile = async () => {
    try {
      const response = await fetch("/api/company/profile")
      const data = await response.json()

      if (response.ok) {
        setCompany(data.company)
        setCompanyForm({
          name: data.company.name,
          email: data.company.email,
          phones: typeof data.company.phones === 'string'
            ? JSON.parse(data.company.phones)
            : data.company.phones,
          fax: data.company.fax || "",
          website: data.company.website || "",
          address: data.company.address || "",
          poBox: data.company.poBox || "",
          tinNumber: data.company.tinNumber || "",
          bankName: data.company.bankName || "",
          bankAccount: data.company.bankAccount || "",
          bankBranch: data.company.bankBranch || "",
          adminName: data.company.adminName || "",
          adminPhone: data.company.adminPhone || "",
          adminEmail: data.company.adminEmail || "",
          supportName: data.company.supportName || "",
          supportPhone: data.company.supportPhone || "",
          preparedBy: data.company.preparedBy || "",
          reviewedBy: data.company.reviewedBy || "",
          approvedBy: data.company.approvedBy || "",
        })
      }
    } catch (error) {
      console.error("Failed to fetch company:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStaff = async () => {
    try {
      const response = await fetch("/api/company/staff")
      const data = await response.json()

      if (response.ok) {
        setStaff(data.staff)
      }
    } catch (error) {
      console.error("Failed to fetch staff:", error)
    }
  }

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch("/api/company/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyForm),
      })

      if (response.ok) {
        toast.success("Company profile updated successfully")
        fetchCompanyProfile()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to update profile")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddStaff = async () => {
    setIsSaving(true)

    try {
      const response = await fetch("/api/company/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStaff),
      })

      if (response.ok) {
        toast.success(`${STAFF_ROLES[newStaff.staffRole as keyof typeof STAFF_ROLES].label} added successfully`)
        setIsAddStaffOpen(false)
        setNewStaff({
          name: "",
          phone: "",
          email: "",
          password: "",
          staffRole: "DRIVER",
          licenseNumber: "",
          employeeId: "",
        })
        fetchStaff()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to add staff member")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return

    try {
      const response = await fetch(`/api/company/staff/${staffId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Staff member removed")
        fetchStaff()
      } else {
        toast.error("Failed to remove staff member")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading company profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Company Profile</h1>
        <p className="text-muted-foreground">Manage your company information and staff members</p>
      </div>

      {/* Company Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Information
          </CardTitle>
          <CardDescription>Update your company details and contact information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateCompany} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Basic Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      value={companyForm.email}
                      onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tinNumber">TIN Number</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="tinNumber"
                      className="pl-10"
                      placeholder="Tax Identification Number"
                      value={companyForm.tinNumber}
                      onChange={(e) => setCompanyForm({ ...companyForm, tinNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      className="pl-10"
                      placeholder="https://www.example.com"
                      value={companyForm.website}
                      onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Information
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fax">Fax Number</Label>
                  <div className="relative">
                    <Printer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fax"
                      className="pl-10"
                      placeholder="+251-XX-XXX-XXXX"
                      value={companyForm.fax}
                      onChange={(e) => setCompanyForm({ ...companyForm, fax: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="poBox">P.O. Box</Label>
                  <div className="relative">
                    <Mailbox className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="poBox"
                      className="pl-10"
                      placeholder="P.O. Box 12345"
                      value={companyForm.poBox}
                      onChange={(e) => setCompanyForm({ ...companyForm, poBox: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2 lg:col-span-1">
                  <Label htmlFor="address">Physical Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      className="pl-10"
                      placeholder="Bole, Addis Ababa"
                      value={companyForm.address}
                      onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Bank Information */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                Bank Information
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    placeholder="Commercial Bank of Ethiopia"
                    value={companyForm.bankName}
                    onChange={(e) => setCompanyForm({ ...companyForm, bankName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Account Number</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="bankAccount"
                      className="pl-10"
                      placeholder="1000XXXXXXXXXX"
                      value={companyForm.bankAccount}
                      onChange={(e) => setCompanyForm({ ...companyForm, bankAccount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankBranch">Branch</Label>
                  <Input
                    id="bankBranch"
                    placeholder="Main Branch"
                    value={companyForm.bankBranch}
                    onChange={(e) => setCompanyForm({ ...companyForm, bankBranch: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Key Contacts */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                Key Contacts
              </h3>

              {/* Company Admin/Manager */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Company Administrator</p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminName">Name</Label>
                    <Input
                      id="adminName"
                      placeholder="John Doe"
                      value={companyForm.adminName}
                      onChange={(e) => setCompanyForm({ ...companyForm, adminName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminPhone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="adminPhone"
                        className="pl-10"
                        placeholder="+251-9XX-XXX-XXX"
                        value={companyForm.adminPhone}
                        onChange={(e) => setCompanyForm({ ...companyForm, adminPhone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="adminEmail"
                        type="email"
                        className="pl-10"
                        placeholder="admin@company.com"
                        value={companyForm.adminEmail}
                        onChange={(e) => setCompanyForm({ ...companyForm, adminEmail: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Contact */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <HeadphonesIcon className="h-3 w-3" />
                  Support Contact
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supportName">Name</Label>
                    <Input
                      id="supportName"
                      placeholder="Support Team"
                      value={companyForm.supportName}
                      onChange={(e) => setCompanyForm({ ...companyForm, supportName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supportPhone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="supportPhone"
                        className="pl-10"
                        placeholder="+251-9XX-XXX-XXX"
                        value={companyForm.supportPhone}
                        onChange={(e) => setCompanyForm({ ...companyForm, supportPhone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Report Signatories */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Report Authorized Signatories
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                These names will appear on financial reports and invoices
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preparedBy">Prepared By</Label>
                  <Input
                    id="preparedBy"
                    placeholder="Finance Officer"
                    value={companyForm.preparedBy}
                    onChange={(e) => setCompanyForm({ ...companyForm, preparedBy: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reviewedBy">Reviewed By</Label>
                  <Input
                    id="reviewedBy"
                    placeholder="Finance Manager"
                    value={companyForm.reviewedBy}
                    onChange={(e) => setCompanyForm({ ...companyForm, reviewedBy: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="approvedBy">Approved By</Label>
                  <Input
                    id="approvedBy"
                    placeholder="CEO / Director"
                    value={companyForm.approvedBy}
                    onChange={(e) => setCompanyForm({ ...companyForm, approvedBy: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isSaving} className="w-full md:w-auto">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Staff Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Staff Management
              </CardTitle>
              <CardDescription>Manage drivers, conductors, and ticketing staff</CardDescription>
            </div>
            <Button onClick={() => setIsAddStaffOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Staff Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No staff members yet. Add your first staff member to get started.
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((member) => {
                  const roleInfo = getRoleInfo(member.staffRole)
                  const RoleIcon = roleInfo.icon

                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>
                        <Badge className={roleInfo.color}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {roleInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>{member.email || "-"}</TableCell>
                      <TableCell>{member.employeeId || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteStaff(member.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>
              Create a new staff account for your company
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staffName">Full Name *</Label>
                <Input
                  id="staffName"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staffRole">Role *</Label>
                <Select
                  value={newStaff.staffRole}
                  onValueChange={(value) => setNewStaff({ ...newStaff, staffRole: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="DRIVER">Driver</SelectItem>
                    <SelectItem value="CONDUCTOR">Conductor</SelectItem>
                    <SelectItem value="MANUAL_TICKETER">Manual Ticketer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staffPhone">Phone Number *</Label>
                <PhoneInput
                  id="staffPhone"
                  value={newStaff.phone}
                  onChange={(value) => setNewStaff({ ...newStaff, phone: value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staffEmail">Email (Optional)</Label>
                <Input
                  id="staffEmail"
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID (Optional)</Label>
                <Input
                  id="employeeId"
                  value={newStaff.employeeId}
                  onChange={(e) => setNewStaff({ ...newStaff, employeeId: e.target.value })}
                />
              </div>

              {newStaff.staffRole === "DRIVER" && (
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number (Optional)</Label>
                  <Input
                    id="licenseNumber"
                    value={newStaff.licenseNumber}
                    onChange={(e) => setNewStaff({ ...newStaff, licenseNumber: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="staffPassword">Initial Password *</Label>
              <Input
                id="staffPassword"
                type="password"
                value={newStaff.password}
                onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters, must include uppercase, lowercase, and number
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddStaffOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStaff} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Staff Member"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

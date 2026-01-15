"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Shield,
  Car,
  Ticket,
  UserCheck,
  Phone as PhoneIcon,
  Mail,
  BadgeCheck,
  CreditCard,
  Wrench,
  DollarSign,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PhoneInput } from "@/components/ui/phone-input"
import { toast } from "sonner"

interface StaffMember {
  id: string
  name: string
  phone: string
  email: string | null
  staffRole: string
  licenseNumber: string | null
  employeeId: string | null
  createdAt: string
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

export default function StaffManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [staff, setStaff] = useState<StaffMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null)
  const [staffToEdit, setStaffToEdit] = useState<StaffMember | null>(null)

  // Filter & Pagination state
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  // Add staff form
  const [newStaff, setNewStaff] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    staffRole: "DRIVER",
    customRole: "",
    licenseNumber: "",
    employeeId: "",
  })

  // Edit staff form
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    licenseNumber: "",
    employeeId: "",
  })

  useEffect(() => {
    if (status === "authenticated") {
      if (session.user.role !== "COMPANY_ADMIN") {
        router.push("/")
        return
      }
      fetchStaff()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session])

  const fetchStaff = async () => {
    try {
      const response = await fetch("/api/company/staff")
      const data = await response.json()

      if (response.ok) {
        setStaff(data.staff)
      } else {
        toast.error("Failed to load staff")
      }
    } catch (error) {
      console.error("Failed to fetch staff:", error)
      toast.error("An error occurred while loading staff")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddStaff = async () => {
    setIsSaving(true)

    // Determine the actual role to send
    const actualRole = newStaff.staffRole === "CUSTOM"
      ? newStaff.customRole.toUpperCase().replace(/\s+/g, "_")
      : newStaff.staffRole

    try {
      const response = await fetch("/api/company/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newStaff,
          staffRole: actualRole,
        }),
      })

      if (response.ok) {
        const roleInfo = getRoleInfo(actualRole)
        toast.success(`${roleInfo.label} added successfully`)
        setIsAddDialogOpen(false)
        setNewStaff({
          name: "",
          phone: "",
          email: "",
          password: "",
          staffRole: "DRIVER",
          customRole: "",
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

  const openEditDialog = (member: StaffMember) => {
    setStaffToEdit(member)
    setEditForm({
      name: member.name,
      phone: member.phone,
      email: member.email || "",
      licenseNumber: member.licenseNumber || "",
      employeeId: member.employeeId || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleEditStaff = async () => {
    if (!staffToEdit) return

    setIsSaving(true)

    try {
      const response = await fetch(`/api/company/staff/${staffToEdit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })

      if (response.ok) {
        toast.success("Staff member updated successfully")
        setIsEditDialogOpen(false)
        setStaffToEdit(null)
        fetchStaff()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to update staff member")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteStaff = async () => {
    if (!staffToDelete) return

    try {
      const response = await fetch(`/api/company/staff/${staffToDelete}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Staff member removed")
        setStaffToDelete(null)
        fetchStaff()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to remove staff member")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  // Reset to page 1 when filters change (must be before early return)
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter])

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading staff...</p>
        </div>
      </div>
    )
  }

  // Group staff by role for stats
  const knownRoles = ["ADMIN", "DRIVER", "CONDUCTOR", "MANUAL_TICKETER", "MECHANIC", "FINANCE"]
  const stats = {
    total: staff.length,
    admins: staff.filter(s => s.staffRole === "ADMIN").length,
    drivers: staff.filter(s => s.staffRole === "DRIVER").length,
    conductors: staff.filter(s => s.staffRole === "CONDUCTOR").length,
    ticketers: staff.filter(s => s.staffRole === "MANUAL_TICKETER").length,
    mechanics: staff.filter(s => s.staffRole === "MECHANIC").length,
    finance: staff.filter(s => s.staffRole === "FINANCE").length,
    others: staff.filter(s => !knownRoles.includes(s.staffRole)).length,
  }

  // Filter staff by search term and role
  const filteredStaff = staff.filter((member) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm ||
      member.name.toLowerCase().includes(searchLower) ||
      member.phone.includes(searchTerm) ||
      (member.email && member.email.toLowerCase().includes(searchLower)) ||
      (member.employeeId && member.employeeId.toLowerCase().includes(searchLower))

    const matchesRole = roleFilter === "all" || member.staffRole === roleFilter

    return matchesSearch && matchesRole
  })

  // Pagination
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage)
  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              Staff Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage drivers, conductors, ticketing staff, and admins
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Staff</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">{stats.admins}</p>
              <p className="text-xs text-muted-foreground">Admins</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Car className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{stats.drivers}</p>
              <p className="text-xs text-muted-foreground">Drivers</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <UserCheck className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{stats.conductors}</p>
              <p className="text-xs text-muted-foreground">Conductors</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Ticket className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold">{stats.ticketers}</p>
              <p className="text-xs text-muted-foreground">Ticketers</p>
            </div>
          </CardContent>
        </Card>

        {stats.mechanics > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Wrench className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                <p className="text-2xl font-bold">{stats.mechanics}</p>
                <p className="text-xs text-muted-foreground">Mechanics</p>
              </div>
            </CardContent>
          </Card>
        )}

        {stats.finance > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                <p className="text-2xl font-bold">{stats.finance}</p>
                <p className="text-xs text-muted-foreground">Finance</p>
              </div>
            </CardContent>
          </Card>
        )}

        {stats.others > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <p className="text-2xl font-bold">{stats.others}</p>
                <p className="text-xs text-muted-foreground">Other Roles</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Search & Filter */}
      {staff.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filter Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, email, or employee ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="DRIVER">Driver</SelectItem>
                  <SelectItem value="CONDUCTOR">Conductor</SelectItem>
                  <SelectItem value="MANUAL_TICKETER">Manual Ticketer</SelectItem>
                  <SelectItem value="MECHANIC">Mechanic</SelectItem>
                  <SelectItem value="FINANCE">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchTerm || roleFilter !== "all") && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Showing {filteredStaff.length} of {staff.length} staff members
                </span>
                {(searchTerm || roleFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("")
                      setRoleFilter("all")
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Staff Members</CardTitle>
          <CardDescription>
            {filteredStaff.length} staff member{filteredStaff.length !== 1 ? "s" : ""}
            {filteredStaff.length !== staff.length && ` (filtered from ${staff.length})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No staff members yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first staff member to get started
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Staff Member
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="text-muted-foreground">
                          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No staff members match your search</p>
                          <Button
                            variant="link"
                            onClick={() => {
                              setSearchTerm("")
                              setRoleFilter("all")
                            }}
                          >
                            Clear filters
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStaff.map((member) => {
                      const roleInfo = getRoleInfo(member.staffRole)
                      const RoleIcon = roleInfo.icon

                      return (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Joined {new Date(member.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={roleInfo.color}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {roleInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <PhoneIcon className="h-3 w-3 text-muted-foreground" />
                                {member.phone}
                              </div>
                              {member.email && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs">{member.email}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {member.employeeId ? (
                              <div className="flex items-center gap-2">
                                <BadgeCheck className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm font-mono">{member.employeeId}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {member.licenseNumber ? (
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm font-mono">{member.licenseNumber}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(member)}
                              >
                                <Edit className="h-4 w-4 text-primary" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setStaffToDelete(member.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} ({filteredStaff.length} total)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  placeholder="Ahmed Hassan"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staffRole">Role *</Label>
                <Select
                  value={newStaff.staffRole}
                  onValueChange={(value) => setNewStaff({ ...newStaff, staffRole: value, customRole: "" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="DRIVER">Driver</SelectItem>
                    <SelectItem value="CONDUCTOR">Conductor</SelectItem>
                    <SelectItem value="MANUAL_TICKETER">Manual Ticketer</SelectItem>
                    <SelectItem value="MECHANIC">Mechanic</SelectItem>
                    <SelectItem value="FINANCE">Finance</SelectItem>
                    <SelectItem value="CUSTOM">Custom Role...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newStaff.staffRole === "CUSTOM" && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="customRole">Custom Role Name *</Label>
                  <Input
                    id="customRole"
                    value={newStaff.customRole}
                    onChange={(e) => setNewStaff({ ...newStaff, customRole: e.target.value })}
                    placeholder="e.g., Supervisor, Cashier, Mechanic"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a custom role name for this staff member
                  </p>
                </div>
              )}
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
                  placeholder="ahmed@example.com"
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
                  placeholder="EMP-001"
                />
              </div>

              {(newStaff.staffRole === "DRIVER" || newStaff.staffRole === "MECHANIC") && (
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">
                    {newStaff.staffRole === "DRIVER" ? "License Number" : "Certification ID"} (Optional)
                  </Label>
                  <Input
                    id="licenseNumber"
                    value={newStaff.licenseNumber}
                    onChange={(e) => setNewStaff({ ...newStaff, licenseNumber: e.target.value })}
                    placeholder={newStaff.staffRole === "DRIVER" ? "DL-123456" : "CERT-123456"}
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
                placeholder="••••••••"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters, must include uppercase, lowercase, and number
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStaff} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update {staffToEdit?.name}'s information
            </DialogDescription>
          </DialogHeader>

          {staffToEdit && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={getRoleInfo(staffToEdit.staffRole).color}>
                    {getRoleInfo(staffToEdit.staffRole).label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Role cannot be changed
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editName">Full Name *</Label>
                  <Input
                    id="editName"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editPhone">Phone Number *</Label>
                  <PhoneInput
                    id="editPhone"
                    value={editForm.phone}
                    onChange={(value) => setEditForm({ ...editForm, phone: value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editEmail">Email (Optional)</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editEmployeeId">Employee ID (Optional)</Label>
                  <Input
                    id="editEmployeeId"
                    value={editForm.employeeId}
                    onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
                  />
                </div>

                {(staffToEdit.staffRole === "DRIVER" || staffToEdit.staffRole === "MECHANIC") && (
                  <div className="space-y-2">
                    <Label htmlFor="editLicenseNumber">
                      {staffToEdit.staffRole === "DRIVER" ? "License Number" : "Certification ID"} (Optional)
                    </Label>
                    <Input
                      id="editLicenseNumber"
                      value={editForm.licenseNumber}
                      onChange={(e) => setEditForm({ ...editForm, licenseNumber: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> Password cannot be changed here. Staff members can reset their password using the "Forgot Password" link on the login page.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditStaff} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!staffToDelete} onOpenChange={() => setStaffToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This staff member will no longer be able to access the system.
              {staff.find(s => s.id === staffToDelete) && (
                <div className="mt-2 p-2 rounded bg-muted">
                  <p className="text-sm font-medium text-foreground">
                    {staff.find(s => s.id === staffToDelete)?.name}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStaff}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remove Staff Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

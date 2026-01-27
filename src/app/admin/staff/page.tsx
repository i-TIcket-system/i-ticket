"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Users, Plus, Search, Filter, Building2, UserPlus,
  Mail, Phone, Briefcase, Calendar, CheckCircle, XCircle,
  Clock, Ban, Edit, Trash2, Eye, Copy
} from "lucide-react"
import { toast } from "sonner"
import { PLATFORM_STAFF_ROLES, DEPARTMENTS, getDepartmentLabel, getRoleDefinition, Department } from "@/lib/platform-staff-roles"

interface StaffMember {
  id: string
  employeeId: string
  role: string
  department: string
  position: string
  email: string
  phone: string
  status: string
  hireDate: string
  user: {
    id: string
    name: string
    email: string
    phone: string
    profilePicture: string | null
  }
}

export default function PlatformStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    role: "",
    department: "",
    position: "",
    employeeId: "",
    hireDate: new Date().toISOString().split('T')[0],
    notes: ""
  })

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/platform-staff')
      if (!res.ok) throw new Error('Failed to fetch staff')
      const data = await res.json()
      setStaff(data.staff)
      setFilteredStaff(data.staff)
      setStats(data.stats)
    } catch (error: any) {
      toast.error("Error", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  useEffect(() => {
    let filtered = staff

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s =>
        s.user.name?.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        s.employeeId.toLowerCase().includes(query) ||
        s.position.toLowerCase().includes(query)
      )
    }

    // Apply department filter
    if (departmentFilter !== "ALL") {
      filtered = filtered.filter(s => s.department === departmentFilter)
    }

    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(s => s.status === statusFilter)
    }

    setFilteredStaff(filtered)
  }, [searchQuery, departmentFilter, statusFilter, staff])

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/admin/platform-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create staff')
      }

      const data = await res.json()
      setTempPassword(data.tempPassword)

      toast.success("Staff Member Created", {
        description: `${formData.name} has been added successfully`
      })

      // Reset form
      setFormData({
        name: "",
        phone: "",
        email: "",
        role: "",
        department: "",
        position: "",
        employeeId: "",
        hireDate: new Date().toISOString().split('T')[0],
        notes: ""
      })

      fetchStaff()
    } catch (error: any) {
      toast.error("Error", { description: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      ACTIVE: <Badge className="bg-green-600 text-white"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>,
      ON_LEAVE: <Badge className="bg-yellow-500 text-gray-900"><Clock className="h-3 w-3 mr-1" />On Leave</Badge>,
      SUSPENDED: <Badge className="bg-orange-500 text-white"><Ban className="h-3 w-3 mr-1" />Suspended</Badge>,
      TERMINATED: <Badge className="bg-red-600 text-white"><XCircle className="h-3 w-3 mr-1" />Terminated</Badge>,
    }
    return variants[status] || <Badge>{status}</Badge>
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Platform Staff
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage i-Ticket platform employees and their roles
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} size="lg">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.onLeave}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Object.keys(stats.byDepartment || {}).length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Staff</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, employee ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Departments</SelectItem>
                {Object.values(DEPARTMENTS).map(dept => (
                  <SelectItem key={dept} value={dept}>
                    {getDepartmentLabel(dept)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members ({filteredStaff.length})</CardTitle>
          <CardDescription>
            {departmentFilter !== "ALL" ? `${getDepartmentLabel(departmentFilter as Department)} Department` : "All Departments"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">Loading staff...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No staff members found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStaff.map(member => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{member.user.name}</h3>
                        {getStatusBadge(member.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.position}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {member.employeeId}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {getDepartmentLabel(member.department as Department)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedStaff(member)
                      setShowDetailsDialog(true)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Platform Staff Member</DialogTitle>
            <DialogDescription>
              Create a new i-Ticket platform employee account
            </DialogDescription>
          </DialogHeader>

          {tempPassword && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900 mb-1">Staff Member Created!</h3>
                    <p className="text-sm text-green-800 mb-2">
                      Temporary password has been generated. Please share this with the staff member:
                    </p>
                    <div className="flex items-center gap-2 p-2 bg-white rounded border border-green-200">
                      <code className="flex-1 font-mono text-sm">{tempPassword}</code>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(tempPassword)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-green-700 mt-2">
                      Staff member will be required to change password on first login.
                    </p>
                  </div>
                </div>
                <Button
                  className="w-full mt-4"
                  onClick={() => {
                    setTempPassword(null)
                    setShowAddDialog(false)
                  }}
                >
                  Done
                </Button>
              </CardContent>
            </Card>
          )}

          {!tempPassword && (
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="employeeId">Employee ID *</Label>
                  <Input
                    id="employeeId"
                    placeholder="iTKT-001"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone (09XXXXXXXX) *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => {
                      setFormData({ ...formData, department: value, role: "" })
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(DEPARTMENTS).map(dept => (
                        <SelectItem key={dept} value={dept}>
                          {getDepartmentLabel(dept)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                    required
                    disabled={!formData.department}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(PLATFORM_STAFF_ROLES)
                        .filter(role => {
                          const def = getRoleDefinition(role)
                          return def.department === formData.department
                        })
                        .map(role => {
                          const def = getRoleDefinition(role)
                          return (
                            <SelectItem key={role} value={role}>
                              {def.label}
                            </SelectItem>
                          )
                        })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">Position/Title *</Label>
                  <Input
                    id="position"
                    placeholder="Senior Accountant"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="hireDate">Hire Date</Label>
                  <Input
                    id="hireDate"
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Staff Member"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Staff Details Dialog */}
      {selectedStaff && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Staff Member Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedStaff.user.name}</h3>
                  <p className="text-muted-foreground">{selectedStaff.position}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Employee ID</Label>
                  <p className="font-medium">{selectedStaff.employeeId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedStaff.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Department</Label>
                  <p className="font-medium">{getDepartmentLabel(selectedStaff.department as Department)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Role</Label>
                  <p className="font-medium">{getRoleDefinition(selectedStaff.role as any).label}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedStaff.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedStaff.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Hire Date</Label>
                  <p className="font-medium">{new Date(selectedStaff.hireDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Role Description</Label>
                <p className="text-sm mt-1">{getRoleDefinition(selectedStaff.role as any).description}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

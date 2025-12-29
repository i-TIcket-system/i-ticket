"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Loader2,
  Ticket,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  Search,
  Mail,
  Phone,
  Calendar,
  User,
  MessageSquare,
  Flag,
  Edit,
  Trash2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Label } from "@/components/ui/label"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"

interface SupportTicket {
  id: string
  ticketNumber: string
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  category: string
  priority: number
  status: string
  resolution: string | null
  internalNotes: string | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
}

const PRIORITY_LABELS = {
  1: { label: "Low", color: "bg-gray-500" },
  2: { label: "Medium", color: "bg-blue-500" },
  3: { label: "High", color: "bg-orange-500" },
  4: { label: "Urgent", color: "bg-red-500" },
}

const STATUS_COLORS = {
  OPEN: "bg-yellow-500",
  IN_PROGRESS: "bg-blue-500",
  RESOLVED: "bg-green-500",
  CLOSED: "bg-gray-500",
}

const CATEGORY_COLORS = {
  GENERAL: "bg-gray-100 text-gray-800",
  TECHNICAL: "bg-red-100 text-red-800",
  BOOKING: "bg-blue-100 text-blue-800",
  PAYMENT: "bg-green-100 text-green-800",
  ACCOUNT: "bg-purple-100 text-purple-800",
  FEEDBACK: "bg-yellow-100 text-yellow-800",
}

export default function AdminSupportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Update form
  const [updateData, setUpdateData] = useState({
    status: "",
    priority: 2,
    category: "",
    resolution: "",
    internalNotes: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role === "CUSTOMER") {
      router.push("/")
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user && session.user.role !== "CUSTOMER") {
      fetchTickets()
    }
  }, [session, statusFilter, priorityFilter])

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (priorityFilter !== "all") params.append("priority", priorityFilter)

      const response = await fetch(`/api/support/tickets?${params}`)
      const data = await response.json()

      if (response.ok) {
        setTickets(data.tickets)
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const openTicketDialog = (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setUpdateData({
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      resolution: ticket.resolution || "",
      internalNotes: ticket.internalNotes || "",
    })
    setIsDialogOpen(true)
  }

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        toast.success("Ticket updated successfully")
        setIsDialogOpen(false)
        fetchTickets()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to update ticket")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsUpdating(false)
    }
  }

  // Filter tickets by search
  const filteredTickets = tickets.filter(ticket =>
    ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Stats
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "OPEN").length,
    inProgress: tickets.filter(t => t.status === "IN_PROGRESS").length,
    resolved: tickets.filter(t => t.status === "RESOLVED").length,
  }

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading support tickets...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role === "CUSTOMER") {
    return null
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-primary/5 via-purple-50/50 to-blue-50/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
      </div>

      <div className="container mx-auto py-12 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Support Tickets</h1>
          <p className="text-muted-foreground">Manage and resolve customer support requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="backdrop-blur-lg bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-lg bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.open}</div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-lg bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-lg bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.resolved}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 backdrop-blur-lg bg-white/70 border-white/40 shadow-lg">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ticket #, name, email, or subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="4">Urgent</SelectItem>
                  <SelectItem value="3">High</SelectItem>
                  <SelectItem value="2">Medium</SelectItem>
                  <SelectItem value="1">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <div className="space-y-4">
          {filteredTickets.length === 0 ? (
            <Card className="backdrop-blur-lg bg-white/70 border-white/40 shadow-lg">
              <CardContent className="py-12 text-center">
                <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No tickets found</p>
              </CardContent>
            </Card>
          ) : (
            filteredTickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="backdrop-blur-lg bg-white/70 border-white/40 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                onClick={() => openTicketDialog(ticket)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <code className="text-sm font-mono font-bold text-primary">
                          {ticket.ticketNumber}
                        </code>
                        <Badge className={`${STATUS_COLORS[ticket.status]} text-white`}>
                          {ticket.status.replace("_", " ")}
                        </Badge>
                        <Badge className={CATEGORY_COLORS[ticket.category]}>
                          {ticket.category}
                        </Badge>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-white ${PRIORITY_LABELS[ticket.priority as keyof typeof PRIORITY_LABELS].color}`}>
                          <Flag className="h-3 w-3" />
                          {PRIORITY_LABELS[ticket.priority as keyof typeof PRIORITY_LABELS].label}
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold mb-2">{ticket.subject}</h3>

                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {ticket.message}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {ticket.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {ticket.email}
                        </div>
                        {ticket.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {ticket.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(ticket.createdAt)}
                        </div>
                      </div>
                    </div>

                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Edit Ticket Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Manage Ticket: {selectedTicket?.ticketNumber}
            </DialogTitle>
            <DialogDescription>
              Update ticket status, priority, and add resolution notes
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Customer Information</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {selectedTicket.name}</p>
                  <p><strong>Email:</strong> {selectedTicket.email}</p>
                  {selectedTicket.phone && <p><strong>Phone:</strong> {selectedTicket.phone}</p>}
                  <p><strong>Created:</strong> {formatDate(selectedTicket.createdAt)}</p>
                </div>
              </div>

              {/* Original Message */}
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Subject: {selectedTicket.subject}</h4>
                <p className="text-sm whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>

              {/* Update Form */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={updateData.status}
                    onValueChange={(value) => setUpdateData({...updateData, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={updateData.priority.toString()}
                    onValueChange={(value) => setUpdateData({...updateData, priority: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Low</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">High</SelectItem>
                      <SelectItem value="4">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={updateData.category}
                  onValueChange={(value) => setUpdateData({...updateData, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="TECHNICAL">Technical</SelectItem>
                    <SelectItem value="BOOKING">Booking</SelectItem>
                    <SelectItem value="PAYMENT">Payment</SelectItem>
                    <SelectItem value="ACCOUNT">Account</SelectItem>
                    <SelectItem value="FEEDBACK">Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Resolution (sent to customer)</Label>
                <Textarea
                  placeholder="Describe how the issue was resolved..."
                  value={updateData.resolution}
                  onChange={(e) => setUpdateData({...updateData, resolution: e.target.value})}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Internal Notes (private)</Label>
                <Textarea
                  placeholder="Add notes for other admins..."
                  value={updateData.internalNotes}
                  onChange={(e) => setUpdateData({...updateData, internalNotes: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTicket} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Ticket"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

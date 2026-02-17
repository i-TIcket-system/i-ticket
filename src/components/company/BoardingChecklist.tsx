"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Loader2,
  UserX,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface BoardingPassenger {
  id: string
  name: string
  phone: string
  seatNumber: number | null
  boardingStatus: string
  pickupLocation: string | null
  dropoffLocation: string | null
  bookingId: string
  isReplacement: boolean
  isQuickTicket: boolean
  ticketShortCode: string | null
  ticketUsed: boolean
  bookedBy: string
  bookedByPhone: string
}

interface BoardingSummary {
  total: number
  boarded: number
  pending: number
  noShow: number
  noShowCount: number
  releasedSeats: number
  replacementsSold: number
}

interface BoardingChecklistProps {
  tripId: string
  tripStatus: string
  onUpdate: () => void
}

export function BoardingChecklist({ tripId, tripStatus, onUpdate }: BoardingChecklistProps) {
  const [passengers, setPassengers] = useState<BoardingPassenger[]>([])
  const [summary, setSummary] = useState<BoardingSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMarking, setIsMarking] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const fetchBoardingStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/company/trips/${tripId}/boarding-status`)
      const data = await res.json()
      if (res.ok) {
        setPassengers(data.passengers)
        setSummary(data.summary)
      }
    } catch (err) {
      console.error("Failed to fetch boarding status:", err)
    } finally {
      setIsLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    fetchBoardingStatus()
  }, [fetchBoardingStatus])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllPending = () => {
    const pendingIds = passengers
      .filter((p) => p.boardingStatus === "PENDING" && !p.ticketUsed)
      .map((p) => p.id)
    setSelectedIds(new Set(pendingIds))
  }

  const clearSelection = () => setSelectedIds(new Set())

  const markNoShow = async (directIds?: string[]) => {
    const ids = directIds || Array.from(selectedIds)
    if (ids.length === 0) {
      toast.error("Select at least one passenger")
      return
    }

    setIsMarking(true)
    try {
      const res = await fetch(`/api/company/trips/${tripId}/no-show`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passengerIds: ids }),
      })
      const data = await res.json()

      if (res.ok) {
        const marked = data.markedPassengers?.length || 0
        const skipped = data.skippedPassengers?.length || 0
        if (marked > 0) {
          toast.success(`${marked} passenger(s) marked as no-show`)
        }
        if (skipped > 0) {
          toast.info(`${skipped} passenger(s) skipped (already boarded or flagged)`)
        }
        setSelectedIds(new Set())
        fetchBoardingStatus()
        onUpdate()
      } else {
        toast.error(data.error || "Failed to mark no-show")
      }
    } catch (err) {
      toast.error("Failed to mark no-show")
    } finally {
      setIsMarking(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "BOARDED":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Boarded</Badge>
      case "NO_SHOW":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />No-Show</Badge>
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Boarding Checklist
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchBoardingStatus}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        {summary && (
          <div className="flex flex-wrap gap-3 mt-2">
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              <CheckCircle className="h-3 w-3 mr-1" />{summary.boarded} Boarded
            </Badge>
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />{summary.pending} Pending
            </Badge>
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />{summary.noShow} No-Show
            </Badge>
            {summary.releasedSeats > 0 && (
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                {summary.releasedSeats} seat(s) released
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Bulk actions (only for DEPARTED) */}
        {tripStatus === "DEPARTED" && passengers.some((p) => p.boardingStatus === "PENDING") && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
            <Button variant="outline" size="sm" onClick={selectAllPending}>
              Select All Pending
            </Button>
            {selectedIds.size > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear ({selectedIds.size})
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => markNoShow()}
                  disabled={isMarking}
                >
                  {isMarking ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <UserX className="h-4 w-4 mr-1" />
                  )}
                  Mark No-Show ({selectedIds.size})
                </Button>
              </>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {tripStatus === "DEPARTED" && <TableHead className="w-10"></TableHead>}
                <TableHead className="w-16">Seat</TableHead>
                <TableHead>Passenger</TableHead>
                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                {tripStatus === "DEPARTED" && <TableHead className="w-28">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {passengers.map((p) => {
                const canSelect = tripStatus === "DEPARTED" && p.boardingStatus === "PENDING" && !p.ticketUsed
                return (
                  <TableRow key={p.id} className={p.boardingStatus === "NO_SHOW" ? "opacity-60" : ""}>
                    {tripStatus === "DEPARTED" && (
                      <TableCell>
                        {canSelect && (
                          <Checkbox
                            checked={selectedIds.has(p.id)}
                            onCheckedChange={() => toggleSelect(p.id)}
                          />
                        )}
                      </TableCell>
                    )}
                    <TableCell className="font-mono font-bold">{p.seatNumber || "-"}</TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{p.name}</span>
                        {p.isReplacement && (
                          <Badge className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px] px-1 py-0">REPL</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{p.phone || "-"}</TableCell>
                    <TableCell>{getStatusBadge(p.boardingStatus)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {p.isReplacement ? (
                        <span className="text-xs text-blue-600">Replacement</span>
                      ) : p.isQuickTicket ? (
                        <span className="text-xs text-yellow-600">Manual</span>
                      ) : (
                        <span className="text-xs text-green-600">Online</span>
                      )}
                    </TableCell>
                    {tripStatus === "DEPARTED" && (
                      <TableCell>
                        {p.boardingStatus === "PENDING" && !p.ticketUsed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2 text-xs"
                            onClick={() => markNoShow([p.id])}
                            disabled={isMarking}
                          >
                            <UserX className="h-3 w-3 mr-1" />
                            No-Show
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {passengers.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            No passengers found
          </div>
        )}
      </CardContent>
    </Card>
  )
}

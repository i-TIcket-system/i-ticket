"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import {
  PlayCircle,
  Truck,
  CheckCircle,
  Loader2,
  AlertCircle,
  Gauge,
} from "lucide-react"
import { toast } from "sonner"

interface TripStatusControlProps {
  tripId: string
  currentStatus: string
  hasVehicle: boolean
  onStatusChange?: (newStatus: string) => void
  onDeparted?: () => void  // Callback to trigger odometer popup when departed
}

// Status display configuration
const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  SCHEDULED: { label: "Scheduled", color: "text-blue-700", bgColor: "bg-blue-100" },
  BOARDING: { label: "Boarding", color: "text-yellow-700", bgColor: "bg-yellow-100" },
  DEPARTED: { label: "Departed", color: "text-purple-700", bgColor: "bg-purple-100" },
  COMPLETED: { label: "Completed", color: "text-green-700", bgColor: "bg-green-100" },
  CANCELLED: { label: "Cancelled", color: "text-red-700", bgColor: "bg-red-100" },
}

// Next action configuration for drivers
const nextActionConfig: Record<string, {
  nextStatus: string
  label: string
  icon: any
  description: string
  buttonColor: string
}> = {
  SCHEDULED: {
    nextStatus: "BOARDING",
    label: "Start Boarding",
    icon: PlayCircle,
    description: "Begin passenger boarding process. Passengers can start getting on the bus.",
    buttonColor: "bg-yellow-500 hover:bg-yellow-600",
  },
  BOARDING: {
    nextStatus: "DEPARTED",
    label: "Depart Now",
    icon: Truck,
    description: "Mark the trip as departed. This will stop all new bookings and record departure time.",
    buttonColor: "bg-purple-500 hover:bg-purple-600",
  },
  DEPARTED: {
    nextStatus: "COMPLETED",
    label: "Complete Trip",
    icon: CheckCircle,
    description: "Mark the trip as completed. This confirms all passengers have arrived at destination.",
    buttonColor: "bg-green-500 hover:bg-green-600",
  },
}

/**
 * TripStatusControl - Driver-only component to update trip status
 *
 * BUSINESS LOGIC (Jan 21, 2026):
 * - Only DRIVER can use this component
 * - Driver must be assigned to the trip (verified by API)
 * - Valid transitions: SCHEDULED → BOARDING → DEPARTED → COMPLETED
 * - Driver CANNOT cancel trips (admin-only)
 * - When status changes to DEPARTED, odometer popup is triggered automatically
 */
export function TripStatusControl({
  tripId,
  currentStatus,
  hasVehicle,
  onStatusChange,
  onDeparted,
}: TripStatusControlProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Only show for drivers
  if (session?.user?.staffRole !== "DRIVER") {
    return null
  }

  const statusInfo = statusConfig[status] || statusConfig.SCHEDULED
  const nextAction = nextActionConfig[status]

  // No action available for COMPLETED or CANCELLED
  if (!nextAction) {
    return (
      <div className="p-4 rounded-lg border bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-gray-500" />
            <span className="font-medium">Trip Status</span>
          </div>
          <Badge className={`${statusInfo.bgColor} ${statusInfo.color}`}>
            {statusInfo.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          This trip is {status.toLowerCase()}. No further status changes available.
        </p>
      </div>
    )
  }

  const handleStatusUpdate = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/staff/trip/${tripId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextAction.nextStatus }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus(nextAction.nextStatus)
        setDialogOpen(false)

        toast.success(`Trip is now ${nextAction.nextStatus.toLowerCase()}`)

        onStatusChange?.(nextAction.nextStatus)

        // CRITICAL: When trip departs, trigger odometer popup
        if (nextAction.nextStatus === "DEPARTED" && hasVehicle) {
          toast.info("Please record odometer reading", {
            description: "Recording start odometer helps track vehicle usage",
            duration: 5000,
          })
          // Small delay to let the toast show first
          setTimeout(() => {
            onDeparted?.()
          }, 500)
        }
      } else {
        toast.error(data.error || "Failed to update trip status")
      }
    } catch (error) {
      toast.error("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const ActionIcon = nextAction.icon

  return (
    <>
      <div className="p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            <span className="font-medium">Driver Controls</span>
          </div>
          <Badge className={`${statusInfo.bgColor} ${statusInfo.color}`}>
            {statusInfo.label}
          </Badge>
        </div>

        <Button
          className={`w-full text-white ${nextAction.buttonColor}`}
          size="lg"
          disabled={loading}
          onClick={() => setDialogOpen(true)}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <ActionIcon className="h-5 w-5 mr-2" />
          )}
          {nextAction.label}
        </Button>

        {/* Hint about odometer */}
        {nextAction.nextStatus === "DEPARTED" && hasVehicle && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Gauge className="h-3 w-3" />
            You'll be asked to record odometer after departing
          </p>
        )}

        <p className="text-xs text-muted-foreground mt-2 text-center">
          You are the assigned driver for this trip
        </p>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ActionIcon className="h-5 w-5 text-primary" />
              {nextAction.label}?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">{nextAction.description}</span>
              {nextAction.nextStatus === "DEPARTED" && (
                <span className="block text-amber-600 font-medium">
                  ⚠️ This will stop all new bookings for this trip.
                </span>
              )}
              {nextAction.nextStatus === "DEPARTED" && hasVehicle && (
                <span className="block text-blue-600 font-medium flex items-center gap-1">
                  <Gauge className="h-4 w-4" />
                  You'll be prompted to record the starting odometer reading.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusUpdate}
              disabled={loading}
              className={nextAction.buttonColor}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm {nextAction.label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

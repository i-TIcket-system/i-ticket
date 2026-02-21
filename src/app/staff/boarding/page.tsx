"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Loader2, ClipboardList, Bus, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BoardingChecklist } from "@/components/company/BoardingChecklist"
import { formatDate } from "@/lib/utils"

interface AssignedTrip {
  id: string
  origin: string
  destination: string
  departureTime: string
  status: string
  company: { name: string }
}

export default function ConductorBoardingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [trips, setTrips] = useState<AssignedTrip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated" && session.user.staffRole !== "CONDUCTOR") {
      router.replace("/staff/my-trips")
    }
  }, [status, session, router])

  const fetchTrips = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/my-trips")
      const data = await res.json()
      if (res.ok) {
        setTrips(data.trips || [])
      } else {
        setError(data.error || "Failed to load trips")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "authenticated") {
      fetchTrips()
    }
  }, [status, fetchTrips])

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Find DEPARTED trips assigned to this conductor
  const departedTrips = trips.filter((t) => t.status === "DEPARTED")

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-6 w-6 text-teal-600" />
        <div>
          <h1 className="text-2xl font-bold">Boarding Management</h1>
          <p className="text-muted-foreground text-sm">Mark no-shows for your current departed trip</p>
        </div>
      </div>

      {departedTrips.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <Bus className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-1">No departed trip found</h3>
            <p className="text-muted-foreground text-sm">
              Boarding management is only available while your trip is in DEPARTED status.
            </p>
          </CardContent>
        </Card>
      ) : (
        departedTrips.map((trip) => (
          <div key={trip.id} className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {trip.origin} → {trip.destination}
                  </CardTitle>
                  <Badge variant="default" className="bg-teal-600">Departed</Badge>
                </div>
                <CardDescription>
                  {trip.company.name} • {formatDate(trip.departureTime)}
                </CardDescription>
              </CardHeader>
            </Card>

            <BoardingChecklist
              tripId={trip.id}
              tripStatus={trip.status}
              onUpdate={fetchTrips}
            />
          </div>
        ))
      )}
    </div>
  )
}

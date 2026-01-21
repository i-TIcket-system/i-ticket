import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/lib/auth"

// Disable caching for SSE
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

interface TripSnapshot {
  id: string
  availableSlots: number
  bookingHalted: boolean
  bookingsCount: number
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (session.user.role !== "COMPANY_ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Create SSE stream
    const encoder = new TextEncoder()
    let lastSnapshot: TripSnapshot[] = []
    let intervalId: NodeJS.Timeout | null = null

    const stream = new ReadableStream({
      async start(controller) {
        console.log(`[SSE] New connection from user ${session.user.id} (${session.user.role})`)

        // Send initial connection message
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}\n\n`))

        // Fetch trips and detect changes
        const checkForUpdates = async () => {
          try {
            const where: any = {}
            if (session.user.role === "COMPANY_ADMIN" && session.user.companyId) {
              where.companyId = session.user.companyId
            }

            const trips = await prisma.trip.findMany({
              where,
              select: {
                id: true,
                availableSlots: true,
                bookingHalted: true,
                _count: {
                  select: { bookings: true },
                },
              },
            })

            console.log(`[SSE] Checked ${trips.length} trips for company ${session.user.companyId || 'ALL'}`)

            // Create snapshot
            const currentSnapshot: TripSnapshot[] = trips.map(trip => ({
              id: trip.id,
              availableSlots: trip.availableSlots,
              bookingHalted: trip.bookingHalted,
              bookingsCount: trip._count.bookings,
            }))

            // Compare with last snapshot
            if (lastSnapshot.length > 0) {
              const changes: any[] = []

              currentSnapshot.forEach(current => {
                const previous = lastSnapshot.find(t => t.id === current.id)
                if (!previous) {
                  // New trip added
                  changes.push({ type: "trip-added", tripId: current.id })
                } else if (
                  current.availableSlots !== previous.availableSlots ||
                  current.bookingHalted !== previous.bookingHalted ||
                  current.bookingsCount !== previous.bookingsCount
                ) {
                  // Trip updated
                  changes.push({
                    type: "trip-updated",
                    tripId: current.id,
                    changes: {
                      availableSlots: current.availableSlots !== previous.availableSlots ? current.availableSlots : undefined,
                      bookingHalted: current.bookingHalted !== previous.bookingHalted ? current.bookingHalted : undefined,
                      bookingsCount: current.bookingsCount !== previous.bookingsCount ? current.bookingsCount : undefined,
                    }
                  })
                }
              })

              // Check for removed trips
              lastSnapshot.forEach(previous => {
                if (!currentSnapshot.find(t => t.id === previous.id)) {
                  changes.push({ type: "trip-removed", tripId: previous.id })
                }
              })

              // Send changes if any
              if (changes.length > 0) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "update", changes, timestamp: Date.now() })}\n\n`)
                )
              }
            }

            lastSnapshot = currentSnapshot

            // Send heartbeat every cycle (keeps connection alive)
            controller.enqueue(encoder.encode(`: heartbeat\n\n`))
          } catch (error) {
            console.error("[SSE] Update check error:", error)
            console.error("[SSE] Error details:", error instanceof Error ? error.message : String(error))
            // Don't close connection on error, just log and continue
          }
        }

        // Initial check
        await checkForUpdates()

        // Poll database every 3 seconds for changes
        intervalId = setInterval(checkForUpdates, 3000)

        // Handle connection close
        request.signal.addEventListener("abort", () => {
          if (intervalId) {
            clearInterval(intervalId)
          }
        })
      },

      cancel() {
        // Clean up interval when connection closes
        if (intervalId) {
          clearInterval(intervalId)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no", // Disable nginx buffering
      },
    })
  } catch (error) {
    console.error("SSE endpoint error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

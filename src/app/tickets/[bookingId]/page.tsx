"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import {
  Bus,
  Calendar,
  Clock,
  MapPin,
  User,
  Download,
  Share2,
  Check,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Phone,
  QrCode
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatDate, formatDuration } from "@/lib/utils"

interface Ticket {
  id: string
  passengerName: string
  seatNumber: number | null
  qrCode: string
  shortCode: string
  isUsed: boolean
}

interface Booking {
  id: string
  status: string
  trip: {
    origin: string
    destination: string
    departureTime: string
    estimatedDuration: number
    busType: string
    company: {
      name: string
      phones: string[]
    }
  }
  tickets: Ticket[]
}

export default function TicketsPage() {
  const params = useParams()
  const { data: session } = useSession()
  const bookingId = params.bookingId as string

  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  useEffect(() => {
    fetchBooking()
  }, [bookingId])

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`)
      const data = await response.json()

      if (response.ok) {
        setBooking(data.booking)
        if (data.booking.tickets.length > 0) {
          setSelectedTicket(data.booking.tickets[0])
        }
      } else {
        setError(data.error || "Booking not found")
      }
    } catch (err) {
      setError("Failed to load tickets")
    } finally {
      setIsLoading(false)
    }
  }

  const downloadTicket = (ticket: Ticket) => {
    // Create a link element to download the QR code
    const link = document.createElement("a")
    link.href = ticket.qrCode
    link.download = `ticket-${ticket.shortCode}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const shareTicket = async (ticket: Ticket) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `i-Ticket - ${ticket.passengerName}`,
          text: `Ticket Code: ${ticket.shortCode}\n${booking?.trip.origin} to ${booking?.trip.destination}`,
        })
      } catch (err) {
        console.log("Share cancelled")
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(ticket.shortCode)
      alert("Ticket code copied to clipboard!")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!booking || error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Card className="max-w-md p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Tickets Not Found</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link href="/tickets">
            <Button>View All Tickets</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <Link
          href="/tickets"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          All My Tickets
        </Link>

        {/* Success Banner */}
        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="font-semibold text-green-800">Booking Confirmed!</h2>
            <p className="text-sm text-green-700">
              Show the QR code when boarding. Have a safe trip!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Ticket Display */}
          <div className="lg:col-span-2 space-y-6">
            {selectedTicket && (
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Bus className="h-6 w-6" />
                      <span className="font-bold text-lg">{booking.trip.company.name}</span>
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {booking.trip.busType}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {new Date(booking.trip.departureTime).toLocaleTimeString("en-ET", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-white/80">{booking.trip.origin}</div>
                    </div>

                    <div className="flex-1 flex items-center gap-2 px-4">
                      <div className="h-3 w-3 rounded-full bg-white" />
                      <div className="flex-1 border-t-2 border-dashed border-white/50" />
                      <Bus className="h-6 w-6" />
                      <div className="flex-1 border-t-2 border-dashed border-white/50" />
                      <div className="h-3 w-3 rounded-full bg-white" />
                    </div>

                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {new Date(
                          new Date(booking.trip.departureTime).getTime() +
                            booking.trip.estimatedDuration * 60000
                        ).toLocaleTimeString("en-ET", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-white/80">{booking.trip.destination}</div>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* QR Code */}
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-white border-2 border-dashed border-muted rounded-lg">
                        <Image
                          src={selectedTicket.qrCode}
                          alt="Ticket QR Code"
                          width={200}
                          height={200}
                          className="rounded"
                        />
                      </div>
                      <div className="mt-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Backup Code</p>
                        <code className="text-2xl font-mono font-bold tracking-wider text-primary">
                          {selectedTicket.shortCode}
                        </code>
                      </div>
                    </div>

                    {/* Ticket Details */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-xl font-bold">{selectedTicket.passengerName}</h3>
                        {selectedTicket.seatNumber && (
                          <p className="text-muted-foreground">Seat {selectedTicket.seatNumber}</p>
                        )}
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {new Date(booking.trip.departureTime).toLocaleDateString("en-ET", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDuration(booking.trip.estimatedDuration)}</span>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => downloadTicket(selectedTicket)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => shareTicket(selectedTicket)}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Passenger Tickets List */}
            {booking.tickets.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>All Passengers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {booking.tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`w-full p-4 rounded-lg border text-left transition-colors ${
                        selectedTicket?.id === ticket.id
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{ticket.passengerName}</p>
                            <p className="text-sm text-muted-foreground">
                              Code: {ticket.shortCode}
                            </p>
                          </div>
                        </div>
                        {ticket.isUsed && (
                          <Badge variant="secondary">Used</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trip Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trip Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">From</p>
                    <p className="text-muted-foreground">{booking.trip.origin}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-accent mt-0.5" />
                  <div>
                    <p className="font-medium">To</p>
                    <p className="text-muted-foreground">{booking.trip.destination}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-secondary mt-0.5" />
                  <div>
                    <p className="font-medium">Departure</p>
                    <p className="text-muted-foreground">
                      {formatDate(booking.trip.departureTime)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Contact {booking.trip.company.name} for trip-related queries.
                </p>
                {(typeof booking.trip.company.phones === 'string'
                  ? JSON.parse(booking.trip.company.phones)
                  : booking.trip.company.phones
                ).map((phone: string, index: number) => (
                  <a
                    key={index}
                    href={`tel:${phone}`}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    {phone}
                  </a>
                ))}
              </CardContent>
            </Card>

            {/* Important Notes */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <h4 className="font-medium text-yellow-800 mb-2">Important</h4>
                <ul className="text-sm text-yellow-700 space-y-2">
                  <li>- Arrive 30 minutes before departure</li>
                  <li>- Bring valid ID matching ticket name</li>
                  <li>- Screenshot or save your QR code offline</li>
                  <li>- Use backup code if QR scan fails</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

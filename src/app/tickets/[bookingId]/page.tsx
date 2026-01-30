"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import html2canvas from "html2canvas"
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
  QrCode,
  Car,
  UserCheck,
  Truck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatDate, formatDuration, formatCurrency } from "@/lib/utils"
import { generateICSFile, downloadICSFile, getICSFilename } from "@/lib/calendar"
import { toast } from "sonner"
import { TripCountdown } from "@/components/ui/trip-countdown"

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
  totalAmount: number
  commission: number
  commissionVAT?: number
  createdAt: string
  trip: {
    id: string
    origin: string
    destination: string
    departureTime: string
    estimatedDuration: number
    distance: number | null
    busType: string
    price: number
    company: {
      name: string
      phones: string[]
    }
    driver?: {
      id: string
      name: string
      phone: string
      licenseNumber?: string
    }
    conductor?: {
      id: string
      name: string
      phone: string
    }
    vehicle?: {
      id: string
      plateNumber: string
      sideNumber: string | null
      make: string
      model: string
    }
  }
  tickets: Ticket[]
  passengers: { name: string; phone: string; nationalId: string }[]
}

export default function TicketsPage() {
  const params = useParams()
  const { data: session } = useSession()
  const bookingId = params.bookingId as string

  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState("")
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const ticketCardRef = useRef<HTMLDivElement>(null)

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

  const downloadTicket = async (ticket: Ticket) => {
    if (!ticketCardRef.current || !booking) return

    setIsDownloading(true)

    // Give React time to re-render and hide the buttons
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      const element = ticketCardRef.current

      // Use offsetWidth for actual rendered width (not scrollWidth which can be larger)
      // Use scrollHeight for full content height (in case of overflow)
      const captureWidth = element.offsetWidth
      const captureHeight = element.scrollHeight

      // Generate canvas from the ticket card
      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2, // Higher quality for retina displays
        logging: false,
        useCORS: true,
        // Fix truncation: use offsetWidth for width, scrollHeight for full height
        width: captureWidth,
        height: captureHeight,
        windowWidth: captureWidth,
        windowHeight: captureHeight,
        // Account for scroll position to capture from top
        scrollX: 0,
        scrollY: -window.scrollY,
        ignoreElements: (el) => {
          // Ignore elements with data-download-hide attribute
          return el.hasAttribute('data-download-hide')
        },
      })

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `i-Ticket-${ticket.shortCode}-${booking.trip.origin}-${booking.trip.destination}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
      })
    } catch (error) {
      console.error("Download failed:", error)
      alert("Failed to download ticket. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  const addToCalendar = () => {
    if (!booking) return

    try {
      const icsContent = generateICSFile({
        tripId: booking.trip.id,
        origin: booking.trip.origin,
        destination: booking.trip.destination,
        departureTime: new Date(booking.trip.departureTime),
        estimatedDuration: booking.trip.estimatedDuration,
        companyName: booking.trip.company.name,
        passengerNames: booking.passengers.map((p: any) => p.name),
        seatNumbers: booking.passengers.map((p: any) => p.seatNumber),
        bookingId: booking.id,
      })

      const filename = getICSFilename(
        booking.trip.origin,
        booking.trip.destination,
        new Date(booking.trip.departureTime)
      )

      downloadICSFile(icsContent, filename)

      toast.success("Calendar event downloaded!", {
        description: "Open the .ics file to add to your calendar",
      })
    } catch (error) {
      console.error("Calendar export failed:", error)
      toast.error("Failed to create calendar event")
    }
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
          <Button asChild>
            <Link href="/tickets">View All Tickets</Link>
          </Button>
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

        {/* Countdown Timer */}
        <div className="mb-6">
          <TripCountdown departureTime={booking.trip.departureTime} variant="glass" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Ticket Display */}
          <div className="lg:col-span-2 space-y-6">
            {selectedTicket && (
              <Card className="overflow-hidden border-2 border-primary/20" ref={ticketCardRef} style={{ borderWidth: '2px', borderColor: 'rgba(14, 148, 148, 0.2)' }}>
                {/* Teal gradient header */}
                <div style={{ background: 'linear-gradient(135deg, #0e9494 0%, #0d7a7a 50%, #0d4f5c 100%)', color: 'white', padding: '24px' }}>
                  {/* Header row - simple layout without pill */}
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '18px' }}>🚌 {booking.trip.company.name}</span>
                    <span style={{ float: 'right', fontSize: '14px', fontWeight: '600', opacity: '0.9' }}>
                      {booking.trip.busType}
                    </span>
                    <div style={{ clear: 'both' }}></div>
                  </div>

                  {/* Route display with table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ textAlign: 'left', verticalAlign: 'middle', width: '30%' }}>
                          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                            {new Date(booking.trip.departureTime).toLocaleTimeString("en-ET", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div style={{ opacity: 0.85, fontSize: '14px' }}>{booking.trip.origin}</div>
                        </td>
                        <td style={{ textAlign: 'center', verticalAlign: 'middle', width: '40%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'white', display: 'inline-block' }}></span>
                            <span style={{ flex: 1, borderTop: '2px dashed rgba(255,255,255,0.5)', maxWidth: '60px' }}></span>
                            <span style={{ fontSize: '20px' }}>🚌</span>
                            <span style={{ flex: 1, borderTop: '2px dashed rgba(255,255,255,0.5)', maxWidth: '60px' }}></span>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'white', display: 'inline-block' }}></span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', verticalAlign: 'middle', width: '30%' }}>
                          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                            {new Date(
                              new Date(booking.trip.departureTime).getTime() +
                                booking.trip.estimatedDuration * 60000
                            ).toLocaleTimeString("en-ET", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div style={{ opacity: 0.85, fontSize: '14px' }}>{booking.trip.destination}</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <CardContent className="p-6" style={{ backgroundColor: '#fafffe' }}>
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* QR Code */}
                    <div className="flex flex-col items-center">
                      <div style={{ padding: '16px', backgroundColor: 'white', border: '3px solid #0e9494', borderRadius: '12px', boxShadow: '0 4px 12px rgba(14, 148, 148, 0.15)' }}>
                        <Image
                          src={selectedTicket.qrCode}
                          alt="Ticket QR Code"
                          width={200}
                          height={200}
                          className="rounded"
                        />
                      </div>
                      <div style={{ marginTop: '12px', textAlign: 'center' }}>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Backup Code</p>
                        <code style={{ fontSize: '24px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '0.1em', color: '#0e9494' }}>
                          {selectedTicket.shortCode}
                        </code>
                      </div>

                      {/* i-Ticket Branding */}
                      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '2px solid #0e9494', textAlign: 'center' }}>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#0e9494', marginBottom: '4px' }}>
                          Thank you for using i-Ticket!
                        </p>
                        <p style={{ fontSize: '12px', color: '#4b5563' }}>
                          Visit <span style={{ fontWeight: '600', color: '#0e9494' }}>i-tickets.et</span>
                        </p>
                        <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
                          Ethiopia's #1 Bus Booking Platform
                        </p>
                      </div>
                    </div>

                    {/* Ticket Details */}
                    <div className="flex-1 space-y-4">
                      {/* Passenger Info */}
                      <div style={{ padding: '12px 16px', backgroundColor: 'rgba(14, 148, 148, 0.08)', borderRadius: '8px', borderLeft: '4px solid #0e9494' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{selectedTicket.passengerName}</h3>
                        {selectedTicket.seatNumber && (
                          <p style={{ fontSize: '14px', color: '#0e9494', fontWeight: '600', marginTop: '4px' }}>Seat {selectedTicket.seatNumber}</p>
                        )}
                      </div>

                      {/* Trip details - table layout for reliable html2canvas rendering */}
                      <div style={{ padding: '12px 16px', backgroundColor: 'rgba(14, 148, 148, 0.05)', borderRadius: '8px' }}>
                        <table className="text-sm w-full" style={{ borderCollapse: 'collapse' }}>
                          <tbody>
                            <tr>
                              <td style={{ paddingBottom: '8px', verticalAlign: 'middle', width: '24px' }}>
                                <span>📅</span>
                              </td>
                              <td style={{ paddingBottom: '8px', paddingLeft: '8px', verticalAlign: 'middle', fontWeight: '500' }}>
                                {new Date(booking.trip.departureTime).toLocaleDateString("en-ET", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ paddingBottom: '8px', verticalAlign: 'middle', width: '24px' }}>
                                <span>⏱</span>
                              </td>
                              <td style={{ paddingBottom: '8px', paddingLeft: '8px', verticalAlign: 'middle', fontWeight: '500' }}>
                                {formatDuration(booking.trip.estimatedDuration)}
                              </td>
                            </tr>
                            {booking.trip.distance && (
                              <tr>
                                <td style={{ verticalAlign: 'middle', width: '24px' }}>
                                  <span>📍</span>
                                </td>
                                <td style={{ paddingLeft: '8px', verticalAlign: 'middle', fontWeight: '500' }}>
                                  Distance: {booking.trip.distance} km
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Price Summary */}
                      <div style={{ padding: '12px 16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <table className="text-sm w-full" style={{ borderCollapse: 'collapse' }}>
                          <tbody>
                            <tr>
                              <td style={{ paddingBottom: '6px', color: '#4b5563' }}>Ticket Price</td>
                              <td style={{ paddingBottom: '6px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(booking.trip.price)}</td>
                            </tr>
                            <tr>
                              <td style={{ paddingBottom: '6px', color: '#4b5563' }}>Service Fee (5%)</td>
                              <td style={{ paddingBottom: '6px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(Number(booking.commission) / booking.passengers.length)}</td>
                            </tr>
                            {booking.commissionVAT !== undefined && booking.commissionVAT !== null && (
                              <tr>
                                <td style={{ paddingBottom: '6px', color: '#4b5563' }}>VAT on Service Fee (15%)</td>
                                <td style={{ paddingBottom: '6px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(Number(booking.commissionVAT) / booking.passengers.length)}</td>
                              </tr>
                            )}
                            <tr>
                              <td colSpan={2} style={{ paddingTop: '8px', paddingBottom: '8px' }}>
                                <div style={{ borderTop: '2px solid #0e9494' }}></div>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold', fontSize: '15px' }}>Total Paid</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '16px', color: '#0e9494' }}>{formatCurrency(
                                Number(booking.totalAmount) / booking.passengers.length
                              )}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Booking Info */}
                      <div style={{ fontSize: '12px', color: '#6b7280', padding: '8px 12px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
                        <p style={{ margin: '0 0 4px 0' }}>Booking ID: <span style={{ fontWeight: '600', color: '#374151' }}>{booking.id.slice(0, 8).toUpperCase()}</span></p>
                        <p style={{ margin: 0 }}>Booked: <span style={{ fontWeight: '600', color: '#374151' }}>{new Date(booking.createdAt).toLocaleDateString()}</span></p>
                      </div>

                      {/* Driver/Conductor/Vehicle Contact (included in download) */}
                      {/* Using table layout for reliable html2canvas rendering */}
                      {(booking.trip.driver || booking.trip.conductor || booking.trip.vehicle) && (
                        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(14, 148, 148, 0.05)', borderRadius: '8px', border: '1px solid rgba(14, 148, 148, 0.2)' }}>
                          <p style={{ fontSize: '12px', fontWeight: '600', color: '#0e9494', marginBottom: '8px' }}>
                            Staff & Vehicle:
                          </p>
                          <table className="text-xs w-full" style={{ borderCollapse: 'collapse' }}>
                            <tbody>
                              {booking.trip.driver && (
                                <tr>
                                  <td style={{ paddingBottom: '6px', verticalAlign: 'top', whiteSpace: 'nowrap', color: '#6b7280' }}>
                                    Driver:
                                  </td>
                                  <td style={{ paddingBottom: '6px', paddingLeft: '8px', verticalAlign: 'top', fontWeight: '500', color: '#374151' }}>
                                    {booking.trip.driver.name} ({booking.trip.driver.phone})
                                  </td>
                                </tr>
                              )}
                              {booking.trip.conductor && (
                                <tr>
                                  <td style={{ paddingBottom: '6px', verticalAlign: 'top', whiteSpace: 'nowrap', color: '#6b7280' }}>
                                    Conductor:
                                  </td>
                                  <td style={{ paddingBottom: '6px', paddingLeft: '8px', verticalAlign: 'top', fontWeight: '500', color: '#374151' }}>
                                    {booking.trip.conductor.name} ({booking.trip.conductor.phone})
                                  </td>
                                </tr>
                              )}
                              {booking.trip.vehicle && (
                                <tr>
                                  <td style={{ verticalAlign: 'top', whiteSpace: 'nowrap', color: '#6b7280' }}>
                                    Vehicle:
                                  </td>
                                  <td style={{ paddingLeft: '8px', verticalAlign: 'top', fontWeight: '500', fontFamily: 'monospace', color: '#374151' }}>
                                    {booking.trip.vehicle.plateNumber}{booking.trip.vehicle.sideNumber && ` (${booking.trip.vehicle.sideNumber})`}
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Hide action buttons when downloading/capturing screenshot */}
                      {!isDownloading && (
                        <div data-download-hide>
                          <Button
                            variant="default"
                            className="w-full mb-2"
                            onClick={addToCalendar}
                          >
                            <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>Add to Calendar</span>
                          </Button>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => downloadTicket(selectedTicket)}
                              disabled={isDownloading}
                            >
                              {isDownloading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin flex-shrink-0" />
                                  <span>Preparing...</span>
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4 mr-2 flex-shrink-0" />
                                  <span>Download</span>
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => shareTicket(selectedTicket)}
                            >
                              <Share2 className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span>Share</span>
                            </Button>
                          </div>
                        </div>
                      )}
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
                  <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">From</p>
                    <p className="text-muted-foreground">{booking.trip.origin}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">To</p>
                    <p className="text-muted-foreground">{booking.trip.destination}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Departure</p>
                    <p className="text-muted-foreground">
                      {formatDate(booking.trip.departureTime)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trip Staff Contact */}
            {(booking.trip.driver || booking.trip.conductor) && (
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Trip Staff Contact</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Contact staff for pickup location and boarding details
                  </p>

                  {booking.trip.driver && (
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Car className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <span className="text-sm font-semibold text-blue-900">Driver</span>
                      </div>
                      <p className="font-medium text-blue-900">{booking.trip.driver.name}</p>
                      {booking.trip.driver.licenseNumber && (
                        <p className="text-xs text-blue-700 mb-1">
                          License: {booking.trip.driver.licenseNumber}
                        </p>
                      )}
                      <a
                        href={`tel:${booking.trip.driver.phone}`}
                        className="flex items-center gap-2 text-blue-700 hover:text-blue-900 hover:underline text-sm font-medium mt-1"
                      >
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span>{booking.trip.driver.phone}</span>
                      </a>
                    </div>
                  )}

                  {booking.trip.conductor && (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <UserCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm font-semibold text-green-900">Conductor</span>
                      </div>
                      <p className="font-medium text-green-900">{booking.trip.conductor.name}</p>
                      <a
                        href={`tel:${booking.trip.conductor.phone}`}
                        className="flex items-center gap-2 text-green-700 hover:text-green-900 hover:underline text-sm font-medium mt-1"
                      >
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span>{booking.trip.conductor.phone}</span>
                      </a>
                    </div>
                  )}

                  {booking.trip.vehicle && (
                    <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Truck className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        <span className="text-sm font-semibold text-purple-900">Assigned Vehicle</span>
                      </div>
                      <p className="font-medium text-purple-900 font-mono">
                        {booking.trip.vehicle.plateNumber}
                        {booking.trip.vehicle.sideNumber && ` (${booking.trip.vehicle.sideNumber})`}
                      </p>
                      <p className="text-xs text-purple-700 mt-1">
                        {booking.trip.vehicle.make} {booking.trip.vehicle.model}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground italic">
                    💡 Call ahead if boarding from a different location
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Company Support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Contact {booking.trip.company.name} for general inquiries.
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
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>{phone}</span>
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

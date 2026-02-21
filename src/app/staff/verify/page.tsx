"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { QrCode, Keyboard, Check, X, AlertCircle, Loader2, ArrowLeft, RotateCcw, UserCheck, Camera, CameraOff } from "lucide-react"
import { toast } from "sonner"

type VerificationResult = {
  success: boolean
  data?: {
    ticketId: string
    ticket: {
      id: string
      code: string
      shortCode: string
      status: string
      seatNumber: string
    }
    passenger: {
      name: string
      phone: string
      nationalId?: string | null
    }
    trip: {
      origin: string
      destination: string
      departureDate: string
      departureTime: string
    }
    booking: {
      totalPassengers: number
      bookingReference: string
    }
  }
  error?: string
}

type Mode = "scan" | "manual"

export default function VerifyTicketPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("scan")
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [boardingLoading, setBoardingLoading] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [boardingConfirmed, setBoardingConfirmed] = useState(false)

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastScannedRef = useRef<string>('')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setCameraActive(true)
      }
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setCameraError("Camera permission denied. Please allow camera access and try again.")
      } else if (err.name === "NotFoundError") {
        setCameraError("No camera found on this device.")
      } else {
        setCameraError("Could not access camera. Use manual code entry instead.")
      }
    }
  }, [])

  // Scan loop using jsQR
  useEffect(() => {
    if (!cameraActive || result) return

    let active = true

    const tick = async () => {
      if (!active) return
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) { rafRef.current = requestAnimationFrame(tick); return }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // Dynamically import jsQR to keep it out of the main bundle
      const jsQR = (await import("jsqr")).default
      const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      })

      if (qrResult && active) {
        const raw = qrResult.data
        // QR encodes https://i-ticket.et/verify/ABC123 or just the shortCode
        let extracted = raw.trim().toUpperCase()
        const urlMatch = raw.match(/\/verify\/([A-Z0-9]{6})/i)
        if (urlMatch) extracted = urlMatch[1].toUpperCase()

        if (extracted.length === 6 && extracted !== lastScannedRef.current) {
          lastScannedRef.current = extracted
          if (active) {
            rafRef.current = null
            verifyTicket(extracted)
            return
          }
        }
      }

      if (active) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      active = false
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraActive, result])

  // Start camera when scan mode is active and no result
  useEffect(() => {
    if (mode === "scan" && !result) {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [mode, result, startCamera, stopCamera])

  // Resume scanning after reset in scan mode
  const handleReset = () => {
    lastScannedRef.current = ''
    setCode('')
    setResult(null)
    setBoardingConfirmed(false)
    if (mode === "scan") {
      startCamera()
    }
  }

  const verifyTicket = async (ticketCode: string) => {
    if (!ticketCode || ticketCode.trim().length === 0) {
      toast.error("Please enter a ticket code")
      return
    }

    setLoading(true)
    setResult(null)
    setBoardingConfirmed(false)

    try {
      const response = await fetch('/api/tickets/verify/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: ticketCode.trim().toUpperCase() })
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        const transformedData = {
          ticketId: data.ticket.id,
          ticket: {
            id: data.ticket.id,
            code: data.ticket.shortCode,
            shortCode: data.ticket.shortCode,
            status: 'VALID',
            seatNumber: data.ticket.seatNumber,
          },
          passenger: {
            name: data.ticket.passengerName,
            phone: data.ticket.booking?.bookedByPhone || '',
            nationalId: null,
          },
          trip: {
            origin: data.ticket.trip.origin,
            destination: data.ticket.trip.destination,
            departureDate: data.ticket.trip.departureTime,
            departureTime: new Date(data.ticket.trip.departureTime).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
          },
          booking: {
            totalPassengers: data.ticket.booking?.passengerCount || 1,
            bookingReference: data.ticket.booking?.id || '',
          },
        }
        setResult({ success: true, data: transformedData })
        if (mode === "scan") toast.success("QR scanned — Valid ticket!")
        else toast.success("Ticket verified successfully!")
      } else {
        setResult({ success: false, error: data.error || "Ticket verification failed" })
        toast.error(data.error || "Ticket verification failed")
        // Resume scan after short delay on invalid ticket
        if (mode === "scan") {
          setTimeout(() => {
            lastScannedRef.current = ''
            setResult(null)
          }, 3000)
        }
      }
    } catch (error) {
      setResult({ success: false, error: "Network error. Please try again." })
      toast.error("Network error. Please try again.")
      if (mode === "scan") {
        setTimeout(() => {
          lastScannedRef.current = ''
          setResult(null)
        }, 3000)
      }
    } finally {
      setLoading(false)
    }
  }

  const confirmBoarding = async () => {
    if (!result?.data?.ticketId) return

    setBoardingLoading(true)
    try {
      const response = await fetch('/api/tickets/verify', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: result.data.ticketId })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setBoardingConfirmed(true)
        if (data.boardingWarning) {
          toast.warning(data.boardingWarning)
        } else {
          toast.success("Boarding confirmed — passenger marked as BOARDED")
        }
      } else {
        toast.error(data.error || "Failed to confirm boarding")
      }
    } catch (error) {
      toast.error("Network error. Please try again.")
    } finally {
      setBoardingLoading(false)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    verifyTicket(code)
  }

  const showResult = result !== null
  const showInput = !showResult

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Verify Ticket</h1>
            <p className="text-sm text-gray-600">Scan QR or enter ticket code to confirm boarding</p>
          </div>
        </div>

        {/* Mode tabs — only shown before a result */}
        {showInput && (
          <div className="flex rounded-lg border bg-white overflow-hidden">
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                mode === "scan"
                  ? "bg-teal-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setMode("scan")}
            >
              <Camera className="h-4 w-4" />
              Scan QR Code
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                mode === "manual"
                  ? "bg-teal-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setMode("manual")}
            >
              <Keyboard className="h-4 w-4" />
              Enter Code
            </button>
          </div>
        )}

        {/* QR Scanner */}
        {showInput && mode === "scan" && (
          <Card className="border-2 overflow-hidden">
            <CardContent className="p-0">
              {cameraError ? (
                <div className="p-6 text-center space-y-4">
                  <CameraOff className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">{cameraError}</p>
                  <Button variant="outline" onClick={startCamera}>
                    <Camera className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="relative bg-black">
                  <video
                    ref={videoRef}
                    className="w-full max-h-72 object-cover"
                    playsInline
                    muted
                    autoPlay
                  />
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-white rounded-lg opacity-70" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-0.5 bg-teal-400 animate-pulse" />
                    </div>
                  </div>
                  {loading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p className="text-sm">Verifying...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {!cameraError && (
                <div className="px-4 py-3 text-center text-sm text-gray-500 bg-gray-50">
                  Point the camera at the QR code on the ticket
                </div>
              )}
            </CardContent>
            {/* Hidden canvas for frame processing */}
            <canvas ref={canvasRef} className="hidden" />
          </Card>
        )}

        {/* Manual code entry */}
        {showInput && mode === "manual" && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Enter Ticket Code
              </CardTitle>
              <CardDescription>
                Enter the 6-character ticket code (e.g., ABC123)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="ABC123"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="text-2xl text-center tracking-widest font-mono uppercase"
                    autoFocus
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 text-center">
                    Enter the 6-character shortcode from the ticket
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading || code.length !== 6}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <QrCode className="mr-2 h-5 w-5" />
                      Verify Ticket
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Boarding Confirmed */}
        {result?.success && boardingConfirmed && result.data && (
          <Card className="border-2 border-teal-500 bg-teal-50">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="rounded-full p-6" style={{ background: "#0e9494" }}>
                  <UserCheck className="h-16 w-16 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl" style={{ color: "#0a6b6b" }}>
                Boarding Confirmed
              </CardTitle>
              <CardDescription style={{ color: "#0e9494" }}>
                {result.data.passenger.name} — Seat {result.data.ticket.seatNumber} — marked as BOARDED
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button variant="outline" onClick={() => router.back()} className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleReset} className="w-full text-white" style={{ background: "#0e9494" }}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Next Passenger
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Valid Ticket — awaiting boarding confirmation */}
        {result?.success && !boardingConfirmed && result.data && (
          <Card className="border-2 border-green-500 bg-green-50">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="bg-green-500 rounded-full p-6">
                  <Check className="h-16 w-16 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl text-green-700">
                Valid Ticket
              </CardTitle>
              <CardDescription className="text-green-600">
                Passenger can board — click Confirm Boarding to record
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Ticket Code</span>
                  <Badge variant="outline" className="font-mono text-lg">
                    {result.data.ticket.shortCode}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Seat Number</span>
                  <Badge className="bg-blue-600 text-white text-lg">
                    {result.data.ticket.seatNumber}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Status</span>
                  <Badge className="bg-green-600 text-white">
                    {result.data.ticket.status}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="bg-white rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-gray-900 mb-2">Passenger Details</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Name</span>
                    <span className="text-sm font-medium">{result.data.passenger.name}</span>
                  </div>
                  {result.data.passenger.phone && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Phone</span>
                      <span className="text-sm font-medium">{result.data.passenger.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="bg-white rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-gray-900 mb-2">Trip Details</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Route</span>
                    <span className="text-sm font-medium">
                      {result.data.trip.origin} → {result.data.trip.destination}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Date</span>
                    <span className="text-sm font-medium">
                      {new Date(result.data.trip.departureDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Departure Time</span>
                    <span className="text-sm font-medium">{result.data.trip.departureTime}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="w-full"
                  disabled={boardingLoading}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Scan Another
                </Button>
                <Button
                  onClick={confirmBoarding}
                  className="w-full text-white"
                  style={{ background: "#0e9494" }}
                  disabled={boardingLoading}
                >
                  {boardingLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Confirm Boarding
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Result */}
        {result?.success === false && (
          <Card className="border-2 border-red-500 bg-red-50">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="bg-red-500 rounded-full p-6">
                  <X className="h-16 w-16 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl text-red-700">
                Invalid Ticket
              </CardTitle>
              <CardDescription className="text-red-600">
                {result.error || "This ticket cannot be verified"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">Possible Reasons:</p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>Ticket code is incorrect</li>
                      <li>Ticket has already been used</li>
                      <li>Ticket has been cancelled</li>
                      <li>Ticket does not exist</li>
                    </ul>
                  </div>
                </div>
              </div>
              {mode === "scan" && (
                <p className="text-xs text-center text-gray-500">
                  Camera will resume scanning automatically...
                </p>
              )}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button variant="outline" onClick={() => router.back()} className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleReset} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {mode === "scan" ? "Scan Again" : "Try Again"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tip card — only in manual mode with no result */}
        {showInput && mode === "manual" && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900">How to verify tickets</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Ask passenger for their 6-character ticket code</li>
                    <li>• Enter the code above and click Verify</li>
                    <li>• Green screen = Valid ticket — click <strong>Confirm Boarding</strong> to record</li>
                    <li>• Red screen = Invalid ticket, passenger cannot board</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

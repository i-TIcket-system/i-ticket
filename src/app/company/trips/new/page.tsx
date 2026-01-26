"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Bus,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Users,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Droplets,
  Coffee,
  Car,
  UserCheck,
  Ticket,
  Truck,
  CalendarDays,
  FileText,
  Save,
  Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BUS_TYPES } from "@/lib/utils"
import { MultiDatePicker } from "@/components/ui/multi-date-picker"
import { BatchPreview } from "@/components/trip/batch-preview"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { getAllCities } from "@/lib/ethiopian-cities"

export default function NewTripPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    departureDate: "",
    departureTime: "",
    estimatedDuration: "",
    distance: "",
    price: "",
    busType: "standard",
    totalSlots: "",
    hasWater: false,
    hasFood: false,
    driverId: null as string | null,
    conductorId: null as string | null,
    manualTicketerId: null as string | null,
    vehicleId: null as string | null,
    overrideStaffConflict: false,
  })
  const [customOrigin, setCustomOrigin] = useState("")
  const [customDestination, setCustomDestination] = useState("")
  const [intermediateStops, setIntermediateStops] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [staffConflictWarning, setStaffConflictWarning] = useState("")
  const [vehicleConflictWarning, setVehicleConflictWarning] = useState("")
  const [overrideVehicleConflict, setOverrideVehicleConflict] = useState(false)
  const [vehicleOverrideReason, setVehicleOverrideReason] = useState("")
  const [cities, setCities] = useState<string[]>([])
  const [staff, setStaff] = useState<{
    drivers: Array<{ id: string; name: string; licenseNumber?: string }>;
    conductors: Array<{ id: string; name: string }>;
    ticketers: Array<{ id: string; name: string }>;
  }>({ drivers: [], conductors: [], ticketers: [] })
  const [vehicles, setVehicles] = useState<Array<{
    id: string;
    plateNumber: string;
    sideNumber: string | null;
    make: string;
    model: string;
    status: string;
    totalSeats: number;
  }>>([])

  // Template state
  const [templates, setTemplates] = useState<Array<{
    id: string;
    name: string;
    origin: string;
    destination: string;
    estimatedDuration: number;
    distance: number | null;
    price: number;
    busType: string;
    hasWater: boolean;
    hasFood: boolean;
    intermediateStops: string | null;
    timesUsed: number;
  }>>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [templateSearch, setTemplateSearch] = useState("")
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [savingTemplate, setSavingTemplate] = useState(false)

  // Batch mode state
  const [batchMode, setBatchMode] = useState(false)
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [createReturnTrips, setCreateReturnTrips] = useState(false)
  const [returnDepartureTime, setReturnDepartureTime] = useState("")
  const [sameTimeForAll, setSameTimeForAll] = useState(true)
  const [individualTimes, setIndividualTimes] = useState<Map<string, string>>(new Map())
  const [individualReturnTimes, setIndividualReturnTimes] = useState<Map<string, string>>(new Map())

  // Auto-fill totalSlots when vehicle is selected
  useEffect(() => {
    if (formData.vehicleId) {
      const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId)
      if (selectedVehicle && selectedVehicle.totalSeats) {
        setFormData(prev => ({
          ...prev,
          totalSlots: selectedVehicle.totalSeats.toString()
        }))
      }
    }
  }, [formData.vehicleId, vehicles])

  // Auto-fill from template URL params
  useEffect(() => {
    const origin = searchParams.get("origin")
    const destination = searchParams.get("destination")
    const duration = searchParams.get("duration")
    const distance = searchParams.get("distance")
    const price = searchParams.get("price")
    const busType = searchParams.get("busType")
    const hasWater = searchParams.get("hasWater")
    const hasFood = searchParams.get("hasFood")

    if (origin || destination) {
      setFormData(prev => ({
        ...prev,
        origin: origin || prev.origin,
        destination: destination || prev.destination,
        estimatedDuration: duration || prev.estimatedDuration,
        distance: distance || prev.distance,
        price: price || prev.price,
        busType: busType || prev.busType,
        hasWater: hasWater === "true",
        hasFood: hasFood === "true",
      }))
    }
  }, [searchParams])

  // Fetch cities from API (combines static Ethiopian cities + organic DB cities)
  useEffect(() => {
    async function fetchCities() {
      try {
        const response = await fetch("/api/cities")
        const data = await response.json()
        if (data.cities) {
          const dbCities = data.cities.map((c: any) => c.name)
          // Combine static Ethiopian cities with organic database cities
          const allCities = getAllCities(dbCities)
          setCities(allCities)
        } else {
          // Fallback to static cities if API fails
          const allCities = getAllCities([])
          setCities(allCities)
        }
      } catch (error) {
        console.error("Failed to fetch cities:", error)
        // Fallback to static cities
        const allCities = getAllCities([])
        setCities(allCities)
      }
    }
    fetchCities()
  }, [])

  // Fetch staff from API
  useEffect(() => {
    async function fetchStaff() {
      try {
        const response = await fetch("/api/company/staff")
        const data = await response.json()
        if (data.staff) {
          setStaff({
            drivers: data.staff.filter((s: any) => s.staffRole === 'DRIVER'),
            conductors: data.staff.filter((s: any) => s.staffRole === 'CONDUCTOR'),
            ticketers: data.staff.filter((s: any) => s.staffRole === 'MANUAL_TICKETER')
          })
        }
      } catch (error) {
        console.error("Failed to fetch staff:", error)
      }
    }
    fetchStaff()
  }, [])

  // Fetch vehicles from API (only active ones)
  useEffect(() => {
    async function fetchVehicles() {
      try {
        const response = await fetch("/api/company/vehicles?status=ACTIVE")
        const data = await response.json()
        if (data.vehicles) {
          setVehicles(data.vehicles)
        }
      } catch (error) {
        console.error("Failed to fetch vehicles:", error)
      }
    }
    fetchVehicles()
  }, [])

  // Fetch trip templates
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const response = await fetch("/api/company/trip-templates")
        const data = await response.json()
        if (data.templates) {
          setTemplates(data.templates)
        }
      } catch (error) {
        console.error("Failed to fetch templates:", error)
      }
    }
    fetchTemplates()
  }, [])

  // Apply template to form
  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) {
      setSelectedTemplateId("")
      return
    }

    setSelectedTemplateId(templateId)
    setFormData(prev => ({
      ...prev,
      origin: template.origin,
      destination: template.destination,
      estimatedDuration: template.estimatedDuration.toString(),
      distance: template.distance?.toString() || "",
      price: template.price.toString(),
      busType: template.busType,
      hasWater: template.hasWater,
      hasFood: template.hasFood,
    }))

    // Handle intermediate stops
    if (template.intermediateStops) {
      try {
        const stops = JSON.parse(template.intermediateStops)
        setIntermediateStops(Array.isArray(stops) ? stops : [])
      } catch {
        setIntermediateStops([])
      }
    } else {
      setIntermediateStops([])
    }

    toast.success(`Template "${template.name}" loaded`)
  }

  // Save current form as template
  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name")
      return
    }

    const finalOrigin = formData.origin === "__custom__" ? customOrigin : formData.origin
    const finalDestination = formData.destination === "__custom__" ? customDestination : formData.destination

    if (!finalOrigin || !finalDestination || !formData.estimatedDuration || !formData.price) {
      toast.error("Please fill in origin, destination, duration, and price first")
      return
    }

    setSavingTemplate(true)
    try {
      const response = await fetch("/api/company/trip-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName.trim(),
          origin: finalOrigin,
          destination: finalDestination,
          estimatedDuration: parseInt(formData.estimatedDuration),
          distance: formData.distance ? parseInt(formData.distance) : null,
          price: parseFloat(formData.price),
          busType: formData.busType,
          hasWater: formData.hasWater,
          hasFood: formData.hasFood,
          intermediateStops: intermediateStops.length > 0 ? JSON.stringify(intermediateStops) : null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Template "${templateName}" saved!`)
        setShowSaveTemplate(false)
        setTemplateName("")
        // Refresh templates list
        const templatesResponse = await fetch("/api/company/trip-templates")
        const templatesData = await templatesResponse.json()
        if (templatesData.templates) {
          setTemplates(templatesData.templates)
        }
      } else {
        toast.error(data.error || "Failed to save template")
      }
    } catch (error) {
      toast.error("Failed to save template")
    } finally {
      setSavingTemplate(false)
    }
  }

  // Filter templates by search
  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
    t.origin.toLowerCase().includes(templateSearch.toLowerCase()) ||
    t.destination.toLowerCase().includes(templateSearch.toLowerCase())
  )

  // Redirect if not company admin
  if (status === "authenticated" && session?.user?.role !== "COMPANY_ADMIN") {
    router.push("/")
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    setIsSubmitting(true)

    // BATCH MODE SUBMISSION
    if (batchMode) {
      if (selectedDates.length === 0) {
        setError("Please select at least one date for batch creation")
        setIsSubmitting(false)
        return
      }

      // Validate times based on sameTimeForAll setting
      if (sameTimeForAll) {
        if (!formData.departureTime) {
          setError("Please set departure time for all trips")
          setIsSubmitting(false)
          return
        }
        if (createReturnTrips && !returnDepartureTime) {
          setError("Please set return trip departure time")
          setIsSubmitting(false)
          return
        }
      } else {
        // Validate individual times
        for (const date of selectedDates) {
          const dateKey = date.toISOString().split('T')[0]
          if (!individualTimes.get(dateKey)) {
            setError(`Please set departure time for ${date.toLocaleDateString()}`)
            setIsSubmitting(false)
            return
          }
          if (createReturnTrips && !individualReturnTimes.get(dateKey)) {
            setError(`Please set return time for ${date.toLocaleDateString()}`)
            setIsSubmitting(false)
            return
          }
        }
      }

      try {
        const finalOrigin = formData.origin || customOrigin
        const finalDestination = formData.destination || customDestination

        // Build trips array with individual times
        const tripsData = sameTimeForAll
          ? {
              dates: selectedDates.map(d => d.toISOString().split("T")[0]),
              departureTime: formData.departureTime,
              sameTimeForAll: true,
            }
          : {
              trips: selectedDates.map(date => {
                const dateKey = date.toISOString().split('T')[0]
                return {
                  date: dateKey,
                  time: individualTimes.get(dateKey),
                  returnTime: createReturnTrips ? individualReturnTimes.get(dateKey) : undefined,
                }
              }),
              sameTimeForAll: false,
            }

        const response = await fetch("/api/company/trips/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: finalOrigin,
            destination: finalDestination,
            ...tripsData,
            estimatedDuration: parseInt(formData.estimatedDuration, 10),
            distance: formData.distance ? parseInt(formData.distance, 10) : undefined,
            price: parseFloat(formData.price),
            busType: formData.busType,
            totalSlots: parseInt(formData.totalSlots, 10),
            hasWater: formData.hasWater,
            hasFood: formData.hasFood,
            intermediateStops: intermediateStops.length > 0 ? JSON.stringify(intermediateStops) : null,
            driverId: formData.driverId,
            conductorId: formData.conductorId,
            manualTicketerId: formData.manualTicketerId,
            vehicleId: formData.vehicleId,
            createReturnTrips,
            returnDepartureTime: sameTimeForAll && createReturnTrips ? returnDepartureTime : undefined,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          toast.success(`Successfully created ${data.tripsCreated} trips!`)
          router.push("/company/trips")
          return
        } else {
          let errorMsg = data.error || "Failed to create batch trips"
          if (data.conflicts && data.conflicts.length > 0) {
            errorMsg += ":\n• " + data.conflicts.join("\n• ")
          }
          setError(errorMsg)
        }
      } catch (error) {
        setError("Failed to create batch trips")
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    // SINGLE TRIP SUBMISSION (original logic continues below)

    try {
      // Combine date and time
      const departureTime = new Date(`${formData.departureDate}T${formData.departureTime}`)

      // Use custom inputs if "Other" is selected
      const finalOrigin = formData.origin === "__custom__" ? customOrigin.trim() : formData.origin
      const finalDestination = formData.destination === "__custom__" ? customDestination.trim() : formData.destination

      // Validation - check AFTER substituting custom values
      if (!finalOrigin || !finalDestination) {
        setError("Please enter both origin and destination")
        setIsSubmitting(false)
        return
      }

      if (finalOrigin.toLowerCase() === finalDestination.toLowerCase()) {
        setError("Origin and destination cannot be the same")
        setIsSubmitting(false)
        return
      }

      // Validate required staff and vehicle
      if (!formData.driverId) {
        setError("Driver is required for all trips")
        setIsSubmitting(false)
        return
      }

      if (!formData.conductorId) {
        setError("Conductor is required for all trips")
        setIsSubmitting(false)
        return
      }

      if (!formData.vehicleId) {
        setError("Vehicle is required for all trips")
        setIsSubmitting(false)
        return
      }

      // Build route string with intermediate stops
      const route = intermediateStops.length > 0
        ? `${finalOrigin} → ${intermediateStops.join(" → ")} → ${finalDestination}`
        : null

      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: session?.user?.companyId,
          origin: finalOrigin,
          destination: finalDestination,
          route,
          intermediateStops: intermediateStops.length > 0 ? JSON.stringify(intermediateStops) : null,
          departureTime: departureTime.toISOString(),
          estimatedDuration: parseInt(formData.estimatedDuration),
          distance: parseInt(formData.distance),
          price: parseFloat(formData.price),
          busType: formData.busType,
          totalSlots: parseInt(formData.totalSlots),
          hasWater: formData.hasWater,
          hasFood: formData.hasFood,
          driverId: formData.driverId,
          conductorId: formData.conductorId,
          manualTicketerId: formData.manualTicketerId,
          vehicleId: formData.vehicleId,
          overrideStaffConflict: formData.overrideStaffConflict,
          overrideVehicleConflict: overrideVehicleConflict,
          vehicleOverrideReason: vehicleOverrideReason,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push("/company/trips")
      } else {
        // Handle staff conflict with override option
        if (data.canOverride && data.conflicts) {
          setStaffConflictWarning(data.conflicts.join(". "))
          setVehicleConflictWarning("")
          setError("")
        }
        // Handle vehicle conflict with override option
        else if (data.canOverride && data.vehicleConflict) {
          setVehicleConflictWarning(data.error)
          setStaffConflictWarning("")
          setError("")
        } else {
          setError(data.error || "Failed to create trip")
          setStaffConflictWarning("")
          setVehicleConflictWarning("")
        }
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Get tomorrow's date as minimum
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split("T")[0]

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link
          href="/company/trips"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Trips
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-primary" />
              Add New Trip
            </CardTitle>
            <CardDescription>
              Create a new trip schedule for {session?.user?.companyName}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span className="whitespace-pre-wrap">{error}</span>
                </div>
              )}

              {/* Load Template Section */}
              {templates.length > 0 && (
                <div className="p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <Label className="text-base font-medium">Load from Template</Label>
                    <span className="text-xs text-muted-foreground">({templates.length} saved)</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search templates by name or route..."
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select
                      value={selectedTemplateId}
                      onValueChange={applyTemplate}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-- No template --</SelectItem>
                        {filteredTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex flex-col">
                              <span>{template.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {template.origin} → {template.destination}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedTemplateId && selectedTemplateId !== "__none__" && (
                    <p className="text-xs text-blue-600 mt-2">
                      Template loaded. You can modify any field before creating the trip.
                    </p>
                  )}
                </div>
              )}

              {/* Batch Mode Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <div>
                    <Label htmlFor="batch-mode" className="text-base font-medium cursor-pointer">
                      Batch Creation Mode
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Create multiple trips at once (up to 10 dates)
                    </p>
                  </div>
                </div>
                <Switch
                  id="batch-mode"
                  checked={batchMode}
                  onCheckedChange={setBatchMode}
                />
              </div>

              {/* Batch Mode: Multi-Date Picker */}
              {batchMode && (
                <div className="space-y-4 p-4 rounded-lg border border-blue-200 bg-blue-50/30 dark:bg-blue-950/20 dark:border-blue-800">
                  <div className="space-y-2">
                    <Label>Select Trip Dates *</Label>
                    <MultiDatePicker
                      selectedDates={selectedDates}
                      onChange={setSelectedDates}
                      maxSelections={10}
                      minDate={tomorrow}
                    />
                    <p className="text-xs text-muted-foreground">
                      Click multiple dates to create trips. All trips will use the same departure time and details below.
                    </p>
                  </div>

                  {/* Same Time for All Option */}
                  <div className="flex items-start gap-3 p-3 rounded-md bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800">
                    <Checkbox
                      id="same-time-for-all"
                      checked={sameTimeForAll}
                      onCheckedChange={(checked) => setSameTimeForAll(checked as boolean)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <Label htmlFor="same-time-for-all" className="cursor-pointer font-medium">
                        Use same departure time for all trips
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {sameTimeForAll
                          ? "All trips will depart at the same time. Uncheck to set individual times."
                          : "Set custom departure time for each trip date."}
                      </p>
                    </div>
                  </div>

                  {/* Return Trips Option */}
                  <div className="flex items-start gap-3 p-3 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                    <Checkbox
                      id="create-return-trips"
                      checked={createReturnTrips}
                      onCheckedChange={(checked) => setCreateReturnTrips(checked as boolean)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <Label htmlFor="create-return-trips" className="cursor-pointer font-medium">
                        Also create return trips
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Automatically creates return trips (destination → origin) on the next day
                      </p>
                      {createReturnTrips && sameTimeForAll && (
                        <div className="mt-3 space-y-2">
                          <Label className="text-xs">Return Trip Departure Time *</Label>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <Input
                              type="time"
                              value={returnDepartureTime}
                              onChange={(e) => setReturnDepartureTime(e.target.value)}
                              className="max-w-[150px] bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 [&::-webkit-calendar-picker-indicator]:dark:invert"
                              required
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Individual Time Inputs (when sameTimeForAll is false) */}
                  {!sameTimeForAll && selectedDates.length > 0 && (
                    <div className="space-y-3 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <Label className="text-sm font-medium">Set Individual Departure Times *</Label>
                      <div className="space-y-3">
                        {selectedDates.map((date, index) => {
                          const dateKey = date.toISOString().split('T')[0]
                          return (
                            <div key={`time-${index}`} className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <span className="text-sm font-medium min-w-[140px]">
                                {date.toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <div className="flex items-center gap-3 flex-1">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type="time"
                                    value={individualTimes.get(dateKey) || ""}
                                    onChange={(e) => {
                                      const newMap = new Map(individualTimes)
                                      newMap.set(dateKey, e.target.value)
                                      setIndividualTimes(newMap)
                                    }}
                                    className="w-[130px] bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 [&::-webkit-calendar-picker-indicator]:dark:invert"
                                    required
                                  />
                                  <span className="text-xs text-muted-foreground">Depart</span>
                                </div>
                                {createReturnTrips && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <Input
                                      type="time"
                                      value={individualReturnTimes.get(dateKey) || ""}
                                      onChange={(e) => {
                                        const newMap = new Map(individualReturnTimes)
                                        newMap.set(dateKey, e.target.value)
                                        setIndividualReturnTimes(newMap)
                                      }}
                                      className="w-[130px] bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 [&::-webkit-calendar-picker-indicator]:dark:invert"
                                      required
                                    />
                                    <span className="text-xs text-muted-foreground">Return</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Batch Preview */}
                  {selectedDates.length > 0 && (
                    <BatchPreview
                      origin={formData.origin || customOrigin}
                      destination={formData.destination || customDestination}
                      selectedDates={selectedDates}
                      departureTime={formData.departureTime}
                      createReturnTrips={createReturnTrips}
                      returnDepartureTime={returnDepartureTime}
                      price={formData.price}
                    />
                  )}
                </div>
              )}

              {/* Route */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Origin *</Label>
                  <Select
                    value={formData.origin}
                    onValueChange={(v) => handleSelectChange("origin", v)}
                  >
                    <SelectTrigger>
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Select origin" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom__">Other (type manually)</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.origin === "__custom__" && (
                    <Input
                      placeholder="Enter custom origin city"
                      value={customOrigin}
                      onChange={(e) => setCustomOrigin(e.target.value)}
                      required
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Destination *</Label>
                  <Select
                    value={formData.destination}
                    onValueChange={(v) => handleSelectChange("destination", v)}
                  >
                    <SelectTrigger>
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.filter((c) => c !== formData.origin).map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom__">Other (type manually)</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.destination === "__custom__" && (
                    <Input
                      placeholder="Enter custom destination city"
                      value={customDestination}
                      onChange={(e) => setCustomDestination(e.target.value)}
                      required
                    />
                  )}
                </div>
              </div>

              {/* Intermediate Stops */}
              <div className="space-y-2">
                <Label>Intermediate Stops (Optional)</Label>
                <p className="text-sm text-muted-foreground">
                  Add cities where the bus stops along the route
                </p>
                {intermediateStops.map((stop, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Stop ${index + 1}`}
                      value={stop}
                      onChange={(e) => {
                        const newStops = [...intermediateStops]
                        newStops[index] = e.target.value
                        setIntermediateStops(newStops)
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setIntermediateStops(intermediateStops.filter((_, i) => i !== index))
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIntermediateStops([...intermediateStops, ""])}
                  className="w-full"
                >
                  + Add Stop
                </Button>
                {intermediateStops.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Route: {formData.origin === "__custom__" ? customOrigin : formData.origin}
                    {intermediateStops.map((s, i) => s && ` → ${s}`)}
                    → {formData.destination === "__custom__" ? customDestination : formData.destination}
                  </p>
                )}
              </div>

              {/* Date & Time */}
              {!batchMode ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Departure Date *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        name="departureDate"
                        value={formData.departureDate}
                        onChange={handleChange}
                        min={minDate}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Departure Time *</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <Input
                        type="time"
                        name="departureTime"
                        value={formData.departureTime}
                        onChange={handleChange}
                        className="pl-10 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 [&::-webkit-calendar-picker-indicator]:dark:invert"
                        required
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // Only show this field when using same time for all trips
                sameTimeForAll && (
                  <div className="space-y-2">
                    <Label>Departure Time (for all selected dates) *</Label>
                    <div className="relative max-w-xs">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <Input
                        type="time"
                        name="departureTime"
                        value={formData.departureTime}
                        onChange={handleChange}
                        className="pl-10 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 [&::-webkit-calendar-picker-indicator]:dark:invert"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This time will be used for all trips in the batch
                    </p>
                  </div>
                )
              )}

              {/* Duration and Distance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estimated Duration (minutes) *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      name="estimatedDuration"
                      placeholder="e.g., 540 for 9 hours"
                      value={formData.estimatedDuration}
                      onChange={handleChange}
                      min="30"
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter duration in minutes (e.g., 540 = 9 hours)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Distance (km) *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      name="distance"
                      placeholder="e.g., 450"
                      value={formData.distance}
                      onChange={handleChange}
                      min="1"
                      max="5000"
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Route distance in kilometers
                  </p>
                </div>
              </div>

              {/* Price & Bus Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (ETB) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      name="price"
                      placeholder="e.g., 850"
                      value={formData.price}
                      onChange={handleChange}
                      min="1"
                      step="0.01"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bus Type *</Label>
                  <Select
                    value={formData.busType}
                    onValueChange={(v) => handleSelectChange("busType", v)}
                  >
                    <SelectTrigger>
                      <Bus className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUS_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label} - {type.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Seats */}
              <div className="space-y-2">
                <Label>Total Seats *</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    name="totalSlots"
                    placeholder="e.g., 50"
                    value={formData.totalSlots}
                    onChange={handleChange}
                    min="1"
                    max="100"
                    className="pl-10"
                    required
                  />
                </div>
                {/* Capacity Mismatch Warning */}
                {(() => {
                  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId)
                  const totalSlots = parseInt(formData.totalSlots)
                  return selectedVehicle && selectedVehicle.totalSeats && totalSlots && totalSlots !== selectedVehicle.totalSeats ? (
                    <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                      <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-orange-900">Capacity Mismatch</p>
                        <p className="text-orange-700">
                          Trip capacity ({totalSlots} seats) doesn't match vehicle capacity ({selectedVehicle.totalSeats} seats)
                        </p>
                      </div>
                    </div>
                  ) : null
                })()}
              </div>

              {/* Amenities */}
              <div className="space-y-3">
                <Label>Amenities</Label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.hasWater}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, hasWater: !!checked }))
                      }
                    />
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Water</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.hasFood}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, hasFood: !!checked }))
                      }
                    />
                    <Coffee className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">Snacks/Food</span>
                  </label>
                </div>
              </div>

              {/* Staff Assignment */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Trip Staff Assignment *</Label>
                  <span className="text-xs text-destructive">Required</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Driver and conductor are required for all trips
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Driver Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="driver" className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-blue-500" />
                      Driver *
                    </Label>
                    <Select
                      value={formData.driverId || ""}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, driverId: value || null }))
                      }
                    >
                      <SelectTrigger className={!formData.driverId ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select driver (required)" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.drivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.name}
                            {driver.licenseNumber && ` (${driver.licenseNumber})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {staff.drivers.length === 0 && (
                      <p className="text-xs text-destructive">
                        No drivers available.{" "}
                        <Link href="/company/staff" className="underline">
                          Add staff first
                        </Link>
                      </p>
                    )}
                  </div>

                  {/* Conductor Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="conductor" className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-500" />
                      Conductor *
                    </Label>
                    <Select
                      value={formData.conductorId || ""}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, conductorId: value || null }))
                      }
                    >
                      <SelectTrigger className={!formData.conductorId ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select conductor (required)" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.conductors.map((conductor) => (
                          <SelectItem key={conductor.id} value={conductor.id}>
                            {conductor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {staff.conductors.length === 0 && (
                      <p className="text-xs text-destructive">
                        No conductors available.{" "}
                        <Link href="/company/staff" className="underline">
                          Add staff first
                        </Link>
                      </p>
                    )}
                  </div>

                  {/* Manual Ticketer Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="ticketer" className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-orange-500" />
                      Manual Ticketer
                    </Label>
                    <Select
                      value={formData.manualTicketerId || "__none__"}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, manualTicketerId: value === "__none__" ? null : value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ticketer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None assigned</SelectItem>
                        {staff.ticketers.map((ticketer) => (
                          <SelectItem key={ticketer.id} value={ticketer.id}>
                            {ticketer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {staff.ticketers.length === 0 && (
                      <p className="text-xs text-amber-600">
                        No ticketers added yet.{" "}
                        <Link href="/company/staff" className="underline">
                          Add staff
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Vehicle Assignment */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Vehicle Assignment *</Label>
                  <span className="text-xs text-destructive">Required</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  A vehicle is required for all trips (24hr availability enforced)
                </p>

                <div className="space-y-2">
                  <Label htmlFor="vehicle" className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-purple-500" />
                    Vehicle *
                  </Label>
                  <Select
                    value={formData.vehicleId || ""}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, vehicleId: value || null }))
                    }
                  >
                    <SelectTrigger className={!formData.vehicleId ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select vehicle (required)" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.plateNumber}
                          {vehicle.sideNumber && ` (${vehicle.sideNumber})`}
                          {" - "}
                          {vehicle.make} {vehicle.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {vehicles.length === 0 && (
                    <p className="text-xs text-destructive">
                      No active vehicles available.{" "}
                      <Link href="/company/vehicles" className="underline">
                        Add vehicles first
                      </Link>
                    </p>
                  )}
                </div>
              </div>

              {/* Staff Conflict Warning */}
              {staffConflictWarning && (
                <div className="border border-amber-500 bg-amber-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-amber-900">Staff Scheduling Conflict</h4>
                      <p className="text-sm text-amber-800 mt-1">{staffConflictWarning}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pl-7">
                    <Checkbox
                      id="overrideConflict"
                      checked={formData.overrideStaffConflict}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, overrideStaffConflict: checked as boolean }))
                      }
                    />
                    <label
                      htmlFor="overrideConflict"
                      className="text-sm text-amber-900 cursor-pointer"
                    >
                      I understand and want to override this conflict
                    </label>
                  </div>
                </div>
              )}

              {/* Vehicle Conflict Warning */}
              {vehicleConflictWarning && (
                <div className="border border-orange-500 bg-orange-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-start gap-2">
                    <Truck className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-orange-900">Vehicle Availability Conflict</h4>
                      <p className="text-sm text-orange-800 mt-1">{vehicleConflictWarning}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pl-7">
                    <Checkbox
                      id="overrideVehicleConflict"
                      checked={overrideVehicleConflict}
                      onCheckedChange={(checked) => {
                        setOverrideVehicleConflict(checked as boolean)
                        if (!checked) setVehicleOverrideReason("")
                      }}
                    />
                    <label
                      htmlFor="overrideVehicleConflict"
                      className="text-sm text-orange-900 cursor-pointer"
                    >
                      I want to override this 24-hour availability constraint
                    </label>
                  </div>
                  {overrideVehicleConflict && (
                    <div className="pl-7 space-y-2">
                      <Label htmlFor="vehicleOverrideReason" className="text-sm text-orange-900">
                        Override Reason (required, min 10 characters) *
                      </Label>
                      <textarea
                        id="vehicleOverrideReason"
                        className="w-full p-2 border border-orange-300 rounded-md text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Explain why this vehicle must be used despite the 24-hour constraint..."
                        value={vehicleOverrideReason}
                        onChange={(e) => setVehicleOverrideReason(e.target.value)}
                      />
                      {vehicleOverrideReason.length > 0 && vehicleOverrideReason.length < 10 && (
                        <p className="text-xs text-orange-600">
                          {10 - vehicleOverrideReason.length} more characters required
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Save as Template Option */}
              <div className="p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                {!showSaveTemplate ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowSaveTemplate(true)}
                    className="w-full text-muted-foreground hover:text-foreground"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save route settings as template for future trips
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4 text-green-600" />
                      <Label className="font-medium">Save as Template</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Save origin, destination, duration, price, and amenities as a reusable template.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Template name (e.g., 'Addis-Dire Standard')"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowSaveTemplate(false)
                          setTemplateName("")
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={saveAsTemplate}
                        disabled={savingTemplate || !templateName.trim()}
                      >
                        {savingTemplate ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Trip...
                    </>
                  ) : (
                    "Create Trip"
                  )}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Loader2, Plus, Edit, Trash2, FileText, MapPin, Clock, DollarSign, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"

interface TripTemplate {
  id: string
  name: string
  origin: string
  destination: string
  estimatedDuration: number
  distance: number | null
  price: number
  busType: string
  hasWater: boolean
  hasFood: boolean
  intermediateStops: string | null
  timesUsed: number
  lastUsedAt: string | null
  createdAt: string
}

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<TripTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TripTemplate | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    origin: "",
    destination: "",
    estimatedDuration: 1,
    distance: "",
    price: "",
    busType: "STANDARD",
    hasWater: false,
    hasFood: false,
    intermediateStops: "",
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    try {
      const response = await fetch("/api/company/trip-templates")
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates)
      } else {
        toast.error("Failed to load templates")
      }
    } catch (error) {
      toast.error("Failed to load templates")
    } finally {
      setLoading(false)
    }
  }

  function handleEdit(template: TripTemplate) {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      origin: template.origin,
      destination: template.destination,
      estimatedDuration: template.estimatedDuration,
      distance: template.distance?.toString() || "",
      price: template.price.toString(),
      busType: template.busType,
      hasWater: template.hasWater,
      hasFood: template.hasFood,
      intermediateStops: template.intermediateStops || "",
    })
    setEditDialogOpen(true)
  }

  async function handleSave() {
    if (!selectedTemplate) return

    setSaving(true)
    try {
      const response = await fetch(`/api/company/trip-templates/${selectedTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          origin: formData.origin,
          destination: formData.destination,
          estimatedDuration: Number.parseInt(formData.estimatedDuration.toString(), 10),
          distance: formData.distance ? Number.parseInt(formData.distance, 10) : null,
          price: parseFloat(formData.price),
          busType: formData.busType,
          hasWater: formData.hasWater,
          hasFood: formData.hasFood,
          intermediateStops: formData.intermediateStops || null,
        }),
      })

      if (response.ok) {
        toast.success("Template updated successfully")
        setEditDialogOpen(false)
        fetchTemplates()
      } else {
        toast.error("Failed to update template")
      }
    } catch (error) {
      toast.error("Failed to update template")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedTemplate) return

    setSaving(true)
    try {
      const response = await fetch(`/api/company/trip-templates/${selectedTemplate.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Template deleted successfully")
        setDeleteDialogOpen(false)
        setSelectedTemplate(null)
        fetchTemplates()
      } else {
        toast.error("Failed to delete template")
      }
    } catch (error) {
      toast.error("Failed to delete template")
    } finally {
      setSaving(false)
    }
  }

  function handleCreateTrip(template: TripTemplate) {
    // Navigate to trip creation with template pre-filled via URL params
    const params = new URLSearchParams({
      templateId: template.id,
      name: template.name,
      origin: template.origin,
      destination: template.destination,
      duration: template.estimatedDuration.toString(),
      distance: template.distance?.toString() || "",
      price: template.price.toString(),
      busType: template.busType,
      hasWater: template.hasWater.toString(),
      hasFood: template.hasFood.toString(),
      stops: template.intermediateStops || "",
    })
    router.push(`/company/trips/new?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#0e9494" }} />
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#0d4f5c" }}>
            Trip Templates
          </h1>
          <p className="text-muted-foreground mt-1">
            Save common routes as templates for quick trip creation
          </p>
        </div>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No templates yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a trip and save it as a template for quick reuse
              </p>
              <Button onClick={() => router.push("/company/trips/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Trip
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {template.origin} → {template.destination}
                    </CardDescription>
                  </div>
                  {template.timesUsed > 0 && (
                    <div className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                      <TrendingUp className="h-3 w-3" />
                      {template.timesUsed}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {template.estimatedDuration}h
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5" />
                    {template.price} Birr
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    {template.busType}
                  </span>
                  {template.hasWater && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300">
                      Water
                    </span>
                  )}
                  {template.hasFood && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                      Food
                    </span>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleCreateTrip(template)}
                    className="flex-1"
                    size="sm"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Use Template
                  </Button>
                  <Button
                    onClick={() => handleEdit(template)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedTemplate(template)
                      setDeleteDialogOpen(true)
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update template details for {selectedTemplate?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Addis-Dire Standard Route"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="origin">Origin</Label>
                <Input
                  id="origin"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (hours)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: Number.parseInt(e.target.value, 10) || 1 })}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="distance">Distance (km)</Label>
                <Input
                  id="distance"
                  type="number"
                  value={formData.distance}
                  onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (Birr)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="busType">Bus Type</Label>
                <select
                  id="busType"
                  value={formData.busType}
                  onChange={(e) => setFormData({ ...formData, busType: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="MINI">Mini</option>
                  <option value="STANDARD">Standard</option>
                  <option value="LUXURY">Luxury</option>
                </select>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasWater"
                  checked={formData.hasWater}
                  onCheckedChange={(checked) => setFormData({ ...formData, hasWater: checked as boolean })}
                />
                <Label htmlFor="hasWater" className="cursor-pointer">Has Water</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasFood"
                  checked={formData.hasFood}
                  onCheckedChange={(checked) => setFormData({ ...formData, hasFood: checked as boolean })}
                />
                <Label htmlFor="hasFood" className="cursor-pointer">Has Food</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedTemplate?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={saving} className="bg-red-500 hover:bg-red-600">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

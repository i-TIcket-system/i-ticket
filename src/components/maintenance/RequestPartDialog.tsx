"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Wrench, Loader2 } from "lucide-react"

interface RequestPartDialogProps {
  workOrderId: string
  onSuccess?: () => void
}

export function RequestPartDialog({ workOrderId, onSuccess }: RequestPartDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    partName: "",
    partNumber: "",
    quantity: 1,
    estimatedUnitPrice: 0,
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/mechanic/work-orders/${workOrderId}/parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partName: formData.partName,
          partNumber: formData.partNumber || undefined,
          quantity: formData.quantity,
          estimatedUnitPrice: formData.estimatedUnitPrice || 0,
          notes: formData.notes || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to request part")
      }

      toast.success("Part request submitted successfully!")
      setOpen(false)

      // Reset form
      setFormData({
        partName: "",
        partNumber: "",
        quantity: 1,
        estimatedUnitPrice: 0,
        notes: "",
      })

      // Refresh the page to show the new part
      router.refresh()
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to request part")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" size="sm">
        <Wrench className="mr-2 h-4 w-4" />
        Request Parts
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Parts</DialogTitle>
            <DialogDescription>
              Request parts needed for this work order. The company admin will review and approve your request.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="partName">
                Part Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="partName"
                value={formData.partName}
                onChange={(e) => handleInputChange("partName", e.target.value)}
                placeholder="e.g., Brake Pads, Engine Oil, etc."
                required
                disabled={loading}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partNumber">Part Number</Label>
              <Input
                id="partNumber"
                value={formData.partNumber}
                onChange={(e) => handleInputChange("partNumber", e.target.value)}
                placeholder="e.g., BP-1234 (optional)"
                disabled={loading}
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange("quantity", parseInt(e.target.value) || 1)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedUnitPrice">
                  Est. Price (Birr)
                </Label>
                <Input
                  id="estimatedUnitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.estimatedUnitPrice}
                  onChange={(e) => handleInputChange("estimatedUnitPrice", parseFloat(e.target.value) || 0)}
                  disabled={loading}
                  placeholder="0.00"
                />
              </div>
            </div>

            {formData.estimatedUnitPrice > 0 && formData.quantity > 0 && (
              <div className="text-sm text-muted-foreground">
                Total estimated cost: <span className="font-semibold">{(formData.estimatedUnitPrice * formData.quantity).toFixed(2)} Birr</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional details about the part or why it's needed (optional)"
                rows={3}
                disabled={loading}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {formData.notes.length}/500 characters
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.partName}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

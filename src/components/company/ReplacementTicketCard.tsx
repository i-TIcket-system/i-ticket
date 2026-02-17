"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  TicketPlus,
  Loader2,
  CheckCircle,
  Minus,
  Plus,
  Copy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

interface ReplacementTicketCardProps {
  tripId: string
  releasedSeats: number
  price: number
  onUpdate: () => void
}

export function ReplacementTicketCard({
  tripId,
  releasedSeats,
  price,
  onUpdate,
}: ReplacementTicketCardProps) {
  const [count, setCount] = useState(1)
  const [isSelling, setIsSelling] = useState(false)
  const [result, setResult] = useState<{
    seatNumbers: number[]
    shortCodes: string[]
    totalAmount: number
  } | null>(null)

  const sellReplacement = async () => {
    setIsSelling(true)
    try {
      const res = await fetch(`/api/company/trips/${tripId}/replacement-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passengerCount: count }),
      })
      const data = await res.json()

      if (res.ok) {
        toast.success(`${count} replacement ticket(s) sold!`)
        setResult({
          seatNumbers: data.seatNumbers,
          shortCodes: data.shortCodes,
          totalAmount: data.totalAmount,
        })
        onUpdate()
      } else {
        toast.error(data.error || "Failed to sell replacement tickets")
      }
    } catch (err) {
      toast.error("Failed to sell replacement tickets")
    } finally {
      setIsSelling(false)
    }
  }

  const copyShortCodes = () => {
    if (result) {
      navigator.clipboard.writeText(result.shortCodes.join(", "))
      toast.success("Ticket codes copied!")
    }
  }

  if (releasedSeats <= 0 && !result) return null

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TicketPlus className="h-5 w-5 text-blue-600" />
          Replacement Tickets
        </CardTitle>
        <CardDescription>
          Sell tickets for no-show passenger seats
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Released seats info */}
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
          <span className="text-sm text-muted-foreground">Available no-show seats</span>
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-lg px-3">
            {releasedSeats}
          </Badge>
        </div>

        {/* Success result */}
        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Tickets Sold!</span>
            </div>
            <div className="text-sm space-y-1">
              <p>Seats: <span className="font-mono font-bold">{result.seatNumbers.join(", ")}</span></p>
              <div className="flex items-center gap-2">
                <p>Codes: <span className="font-mono font-bold">{result.shortCodes.join(", ")}</span></p>
                <Button variant="ghost" size="sm" className="h-6 px-1" onClick={copyShortCodes}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p>Amount: <span className="font-bold">{formatCurrency(result.totalAmount)}</span></p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setResult(null)}
            >
              Sell More
            </Button>
          </div>
        )}

        {/* Sell form */}
        {!result && releasedSeats > 0 && (
          <>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <span className="text-sm font-medium">Tickets to sell</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCount(Math.max(1, count - 1))}
                  disabled={count <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-bold text-lg w-8 text-center">{count}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCount(Math.min(releasedSeats, count + 1))}
                  disabled={count >= releasedSeats}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total amount</span>
              <span className="font-bold text-lg">{formatCurrency(price * count)}</span>
            </div>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={sellReplacement}
              disabled={isSelling}
            >
              {isSelling ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TicketPlus className="h-4 w-4 mr-2" />
              )}
              Sell {count} Replacement Ticket{count > 1 ? "s" : ""} (Cash)
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Passengers will be assigned no-show seats at full price
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

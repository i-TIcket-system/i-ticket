"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calculator, Info, DollarSign, Receipt, TrendingUp, Building2 } from "lucide-react"

export default function PricingGuidePage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">i-Ticket Pricing Guide</h1>
        <p className="text-muted-foreground mt-2">
          Understand how i-Ticket's commission structure works and what you pay for each booking
        </p>
      </div>

      {/* Overview Card */}
      <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Platform Commission Structure
          </CardTitle>
          <CardDescription className="text-teal-900 dark:text-teal-100">
            i-Ticket charges 5% commission on each ticket sold. VAT is added on top and paid to the government.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white dark:bg-teal-900/30 rounded-lg">
              <span className="font-medium">Platform Commission</span>
              <Badge variant="secondary" className="text-base">5%</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white dark:bg-teal-900/30 rounded-lg">
              <span className="font-medium">VAT on Commission</span>
              <Badge variant="secondary" className="text-base">15%</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            How Commission is Calculated
          </CardTitle>
          <CardDescription>
            Step-by-step breakdown of what passengers pay vs. what you receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Example Calculation */}
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <h3 className="font-semibold text-lg">Example: 850 ETB Ticket</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">Your ticket price (what you set):</span>
                <span className="font-mono font-bold text-lg">850.00 ETB</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Platform service charge (5% of 850):</span>
                <span className="font-mono">+ 42.50 ETB</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">VAT on service charge (15% of 42.50):</span>
                <span className="font-mono">+ 6.38 ETB</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="font-semibold">Total passenger pays:</span>
                <span className="font-mono font-bold text-lg text-primary">898.88 ETB</span>
              </div>
            </div>
          </div>

          {/* What Goes Where */}
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <Card className="border-green-200 bg-green-50 dark:bg-green-950">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  You Receive
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">850 ETB</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">Your full ticket price</p>
              </CardContent>
            </Card>

            <Card className="border-teal-200 bg-teal-50 dark:bg-teal-950">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  i-Ticket Gets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">42.50 ETB</p>
                <p className="text-xs text-teal-600 dark:text-teal-500 mt-1">Platform service fee</p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Government Gets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">6.38 ETB</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">VAT tax (ERA)</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Key Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Terms Explained
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">Total Revenue</h3>
            <p className="text-sm text-muted-foreground">
              The total amount you earn from ticket sales. This is your ticket price multiplied by the number
              of passengers. <strong>Platform fees are NOT included</strong> in your revenue.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">Total Amount (What Passenger Pays)</h3>
            <p className="text-sm text-muted-foreground">
              The total amount a passenger pays, which includes your ticket price + platform commission + VAT.
              This is the amount charged to their payment method.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">Platform Commission</h3>
            <p className="text-sm text-muted-foreground">
              A 5% service fee charged by i-Ticket for using the platform, processing payments, generating tickets,
              sending SMS notifications, and providing customer support.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">VAT (Value Added Tax)</h3>
            <p className="text-sm text-muted-foreground">
              A 15% tax on the platform commission (not on your ticket price). This is collected by i-Ticket and
              remitted to the Ethiopian Revenue Authority. This is a government-mandated tax on service fees.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">Manual Ticketing</h3>
            <p className="text-sm text-muted-foreground">
              When you sell tickets through the cashier portal, there is NO platform commission or VAT.
              You receive 100% of the ticket price for manual sales.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-900 dark:text-blue-100">
          <div className="flex gap-3">
            <span className="text-lg">✓</span>
            <p>
              <strong>You set the ticket price.</strong> i-Ticket never changes your pricing. The commission is
              always added on top of your price.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="text-lg">✓</span>
            <p>
              <strong>You receive 100% of your ticket price.</strong> The platform commission and VAT are paid
              by the passenger, not deducted from your revenue.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="text-lg">✓</span>
            <p>
              <strong>Manual ticketing is commission-free.</strong> When you sell tickets offline through the
              cashier portal, there are no platform fees.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="text-lg">✓</span>
            <p>
              <strong>Dashboard shows your actual revenue.</strong> The "Total Revenue" on your dashboard only
              includes your ticket sales, not the platform fees.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">Why do passengers see a higher price than my ticket price?</h3>
            <p className="text-sm text-muted-foreground">
              The platform adds a 5% commission plus 15% VAT on that commission. This is clearly shown to
              passengers during checkout as "Platform Fee" so they understand the total cost.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">Do I pay the commission or does the passenger?</h3>
            <p className="text-sm text-muted-foreground">
              The passenger pays the commission. It's added to the total amount they pay. You receive your
              full ticket price.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">Can I increase my price to cover the commission?</h3>
            <p className="text-sm text-muted-foreground">
              Yes, you can set your ticket prices however you like. However, we recommend keeping your prices
              competitive since the commission is transparently shown to passengers.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">Is there a way to avoid the commission?</h3>
            <p className="text-sm text-muted-foreground">
              Manual ticket sales (offline, walk-in customers) through the cashier portal are commission-free.
              Only online bookings through the i-Ticket platform incur the 5% commission.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect } from "react"
import { Loader2, Ticket, LogOut, User, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationBell } from "@/components/notifications"

export default function CashierLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      // Must be COMPANY_ADMIN with staffRole = MANUAL_TICKETER and belong to a company
      const isValidCashier =
        session.user.role === "COMPANY_ADMIN" &&
        session.user.staffRole === "MANUAL_TICKETER" &&
        session.user.companyId

      if (!isValidCashier) {
        router.push("/")
      }
    } else if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, session, router])

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-teal-100">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  const isValidCashier =
    session &&
    session.user.role === "COMPANY_ADMIN" &&
    session.user.staffRole === "MANUAL_TICKETER" &&
    session.user.companyId

  if (!isValidCashier) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-teal-100">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-teal-700 to-teal-600 text-white shadow-lg">
        {/* Ethiopian flag border */}
        <div className="h-1 bg-gradient-to-r from-green-500 via-yellow-400 to-red-500" />

        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo & Company */}
            <Link href="/cashier" className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Ticket className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-lg">Cashier Portal</span>
                <p className="text-xs text-teal-200 -mt-0.5">{session.user.companyName}</p>
              </div>
            </Link>

            {/* Quick Nav */}
            <div className="flex items-center gap-2">
              <Link href="/cashier">
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
                  <LayoutDashboard className="h-4 w-4 mr-1.5" />
                  My Trips
                </Button>
              </Link>

              <div className="w-px h-6 bg-white/20" />

              <NotificationBell variant="dark" />

              <div className="w-px h-6 bg-white/20" />

              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
                <User className="h-4 w-4 text-teal-200" />
                <span className="text-sm font-medium">{session.user.name}</span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-white/60 hover:text-red-300 hover:bg-red-900/20"
                onClick={() => signOut({ callbackUrl: "/" })}
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  )
}

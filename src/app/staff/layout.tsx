"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  User,
  LogOut,
  Loader2,
  Menu,
  X,
  Bus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

const sidebarItems = [
  {
    title: "My Trips",
    href: "/staff/my-trips",
    icon: Bus,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
]

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      // Only allow COMPANY_ADMIN with staffRole (not ADMIN)
      if (session.user.role !== "COMPANY_ADMIN" || !session.user.staffRole) {
        router.push("/")
      }
      // Redirect ADMIN staffRole to company dashboard
      if (session.user.staffRole === "ADMIN") {
        router.push("/company/dashboard")
      }
    } else if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, session, router])

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f0fafa 0%, #e6f7f7 50%, #f5f5f5 100%)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#0e9494" }} />
      </div>
    )
  }

  if (!session || session.user.role !== "COMPANY_ADMIN" || !session.user.staffRole || session.user.staffRole === "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f0fafa 0%, #e6f7f7 50%, #f5f5f5 100%)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#0e9494" }} />
      </div>
    )
  }

  const getRoleLabel = () => {
    switch (session.user.staffRole) {
      case "DRIVER": return "Driver"
      case "CONDUCTOR": return "Conductor"
      case "MANUAL_TICKETER": return "Manual Ticketer"
      default: return "Staff"
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #f0fafa 0%, #e6f7f7 50%, #f5f5f5 100%)" }}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Teal Theme */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 text-white transform transition-transform duration-200 lg:translate-x-0 lg:static shadow-2xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: "linear-gradient(180deg, #0d4f5c 0%, #0a3d47 100%)", borderRight: "1px solid rgba(32, 196, 196, 0.2)" }}
      >
        {/* Ethiopian flag top border */}
        <div className="h-1 bg-gradient-to-r from-green-500 via-yellow-400 to-red-500" />

        <div className="flex flex-col h-[calc(100%-4px)]">
          {/* Header */}
          <div className="p-4" style={{ borderBottom: "1px solid rgba(32, 196, 196, 0.2)" }}>
            <div className="flex items-center justify-between">
              <Link href="/staff/my-trips" className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg" style={{ background: "linear-gradient(135deg, #0e9494 0%, #20c4c4 100%)" }}>
                  <Bus className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg text-white">i-Ticket</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white/60 hover:text-white hover:bg-white/10"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-xs text-white/60 mt-1 truncate">
              {session.user.companyName}
            </p>
            <p className="text-xs font-medium" style={{ color: "#20c4c4" }}>
              {getRoleLabel()}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "text-white shadow-lg"
                      : "text-white/60 hover:bg-white/10 hover:text-white"
                  )}
                  style={isActive ? { background: "linear-gradient(135deg, #0e9494 0%, #20c4c4 100%)" } : undefined}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 space-y-2" style={{ borderTop: "1px solid rgba(32, 196, 196, 0.2)" }}>
            <div className="px-3 py-2 bg-white/10 rounded-lg">
              <p className="text-sm font-medium truncate text-white">{session.user.name}</p>
              <p className="text-xs text-white/60">{getRoleLabel()}</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-white/60 hover:text-red-400 hover:bg-red-950/30"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 text-white px-4 py-3 shadow-lg" style={{ background: "linear-gradient(135deg, #0d4f5c 0%, #0a3d47 100%)" }}>
          <div className="h-0.5 absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 via-yellow-400 to-red-500" />
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/staff/my-trips" className="flex items-center gap-2">
              <div className="p-1 rounded-lg" style={{ background: "linear-gradient(135deg, #0e9494 0%, #20c4c4 100%)" }}>
                <Bus className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">i-Ticket</span>
            </Link>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}

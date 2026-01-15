"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import {
  Loader2,
  Ticket,
  LogOut,
  User,
  LayoutDashboard,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { NotificationBell } from "@/components/notifications"

const sidebarItems = [
  {
    title: "My Trips",
    href: "/cashier",
    icon: LayoutDashboard,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
]

export default function CashierLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

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
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #f0fafa 0%, #e6f7f7 50%, #f5f5f5 100%)" }}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <TooltipProvider delayDuration={0}>
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 transform transition-all duration-300 lg:translate-x-0 lg:static",
            "text-white shadow-2xl",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            collapsed ? "w-20" : "w-72"
          )}
          style={{ background: "linear-gradient(180deg, #0d4f5c 0%, #0a3d47 100%)", borderRight: "1px solid rgba(32, 196, 196, 0.2)" }}
        >
          {/* Ethiopian flag border */}
          <div className="h-1 bg-gradient-to-r from-green-500 via-yellow-400 to-red-500" />

          <div className="flex flex-col h-[calc(100%-4px)]">
            {/* Header */}
            <div className={cn("p-5", collapsed && "px-3")} style={{ borderBottom: "1px solid rgba(32, 196, 196, 0.2)" }}>
              <div className="flex items-center justify-between mb-3">
                <Link href="/cashier" className="flex items-center gap-3 group">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-xl blur-lg transition-colors" style={{ background: "rgba(32, 196, 196, 0.2)" }} />
                    <div className="relative p-2 rounded-xl shadow-lg" style={{ background: "linear-gradient(135deg, #0e9494 0%, #20c4c4 100%)" }}>
                      <Ticket className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  {!collapsed && (
                    <div>
                      <span className="font-bold text-lg text-white tracking-tight">Cashier</span>
                      <span className="font-medium ml-1" style={{ color: "#20c4c4" }}>Portal</span>
                    </div>
                  )}
                </Link>
                <div className="flex items-center gap-2">
                  {/* Desktop notification bell */}
                  <div className="hidden lg:block">
                    <NotificationBell variant="dark" sidebarMode />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden text-white/60 hover:text-white hover:bg-white/10"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              {!collapsed && (
                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                  {/* Profile Picture */}
                  {session.user.profilePicture ? (
                    <Image
                      src={session.user.profilePicture}
                      alt={session.user.name || "Profile"}
                      width={48}
                      height={48}
                      className="rounded-full border-2 border-teal-400"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-teal-400" style={{ background: "linear-gradient(135deg, #0e9494 0%, #20c4c4 100%)" }}>
                      <User className="h-6 w-6 text-white" />
                    </div>
                  )}
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{session.user.name}</div>
                    <div className="text-xs text-white/70 truncate">
                      {session.user.companyName} • Cashier
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className={cn("flex-1 p-4 space-y-1.5", collapsed && "p-2")}>
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href === "/cashier" && pathname.startsWith("/cashier/"))

                const linkContent = (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "text-white shadow-lg"
                        : "text-white/60 hover:bg-white/10 hover:text-white",
                      collapsed && "justify-center px-3"
                    )}
                    style={isActive ? { background: "linear-gradient(135deg, #0e9494 0%, #20c4c4 100%)" } : undefined}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 flex-shrink-0 transition-transform duration-200",
                      !isActive && "group-hover:scale-110"
                    )} />
                    {!collapsed && item.title}
                  </Link>
                )

                if (collapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-white border-teal-700 font-medium" style={{ background: "#0d4f5c" }}>
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return linkContent
              })}
            </nav>

            {/* Collapse Toggle */}
            <div className={cn("px-4 py-2", collapsed && "px-2")}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full text-white/50 hover:text-white hover:bg-white/10 rounded-xl",
                  collapsed ? "justify-center px-2" : "justify-start"
                )}
                onClick={() => setCollapsed(!collapsed)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Collapse
                  </>
                )}
              </Button>
            </div>

            {/* Footer */}
            <div className={cn("p-4", collapsed && "p-2")} style={{ borderTop: "1px solid rgba(32, 196, 196, 0.2)" }}>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-full text-white/60 hover:text-red-400 hover:bg-red-950/30 rounded-xl"
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-white" style={{ background: "#0d4f5c", borderColor: "#20c4c4" }}>
                    Sign Out
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white/60 hover:text-red-400 hover:bg-red-950/30 rounded-xl"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign Out
                </Button>
              )}
            </div>
          </div>
        </aside>
      </TooltipProvider>

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
            <Link href="/cashier" className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ background: "linear-gradient(135deg, #0e9494 0%, #20c4c4 100%)" }}>
                <Ticket className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">Cashier</span>
              <span className="font-bold" style={{ color: "#20c4c4" }}>Portal</span>
            </Link>
            <NotificationBell variant="dark" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

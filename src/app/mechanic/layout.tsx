"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import {
  Loader2,
  Wrench,
  LogOut,
  User,
  LayoutDashboard,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
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
    title: "My Work Orders",
    href: "/mechanic",
    icon: ClipboardList,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
]

export default function MechanicLayout({
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
      // Must be COMPANY_ADMIN with staffRole = MECHANIC and belong to a company
      const isValidMechanic =
        session.user.role === "COMPANY_ADMIN" &&
        session.user.staffRole === "MECHANIC" &&
        session.user.companyId

      if (!isValidMechanic) {
        router.push("/")
      }
    } else if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, session, router])

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  const isValidMechanic =
    session &&
    session.user.role === "COMPANY_ADMIN" &&
    session.user.staffRole === "MECHANIC" &&
    session.user.companyId

  if (!isValidMechanic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #f5f5f5 100%)" }}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Amber/Orange Theme for Mechanics */}
      <TooltipProvider delayDuration={0}>
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 transform transition-all duration-300 lg:translate-x-0 lg:static",
            "text-white shadow-2xl",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            collapsed ? "w-20" : "w-72"
          )}
          style={{ background: "linear-gradient(180deg, #78350f 0%, #451a03 100%)", borderRight: "1px solid rgba(251, 191, 36, 0.3)" }}
        >
          {/* Ethiopian flag border */}
          <div className="h-1 bg-gradient-to-r from-green-500 via-yellow-400 to-red-500" />

          <div className="flex flex-col h-[calc(100%-4px)]">
            {/* Header */}
            <div className={cn("p-5", collapsed && "px-3")} style={{ borderBottom: "1px solid rgba(251, 191, 36, 0.3)" }}>
              <div className="flex items-center justify-between">
                <Link href="/mechanic" className="flex items-center gap-3 group">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-xl blur-lg transition-colors" style={{ background: "rgba(251, 191, 36, 0.2)" }} />
                    <div className="relative p-2 rounded-xl shadow-lg" style={{ background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)" }}>
                      <Wrench className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  {!collapsed && (
                    <div>
                      <span className="font-bold text-lg text-white tracking-tight">Mechanic</span>
                      <span className="font-medium ml-1" style={{ color: "#fbbf24" }}>Portal</span>
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
                <div className="mt-3 px-1">
                  <p className="text-xs text-white/60 font-medium truncate">
                    {session.user.companyName}
                  </p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className={cn("flex-1 p-4 space-y-1.5", collapsed && "p-2")}>
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href === "/mechanic" && pathname.startsWith("/mechanic/"))

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
                    style={isActive ? { background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)" } : undefined}
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
                      <TooltipContent side="right" className="text-white border-amber-700 font-medium" style={{ background: "#78350f" }}>
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
            <div className={cn("p-4 space-y-3", collapsed && "p-2")} style={{ borderTop: "1px solid rgba(251, 191, 36, 0.3)" }}>
              {!collapsed && (
                <div className="px-3 py-2 bg-white/10 rounded-xl">
                  <p className="text-sm font-semibold truncate text-white">{session.user.name}</p>
                  <p className="text-xs text-white/60">Mechanic</p>
                </div>
              )}
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
                  <TooltipContent side="right" className="text-white" style={{ background: "#78350f", borderColor: "#fbbf24" }}>
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
        <header className="lg:hidden sticky top-0 z-30 text-white px-4 py-3 shadow-lg" style={{ background: "linear-gradient(135deg, #78350f 0%, #451a03 100%)" }}>
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
            <Link href="/mechanic" className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)" }}>
                <Wrench className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">Mechanic</span>
              <span className="font-bold" style={{ color: "#fbbf24" }}>Portal</span>
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

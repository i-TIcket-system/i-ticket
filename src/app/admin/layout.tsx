"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect } from "react"
import {
  LayoutDashboard,
  Building2,
  UserCheck,
  FileText,
  HeadphonesIcon,
  LogOut,
  Loader2,
  Menu,
  X,
  Shield,
  TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Companies",
    href: "/admin/companies",
    icon: Building2,
  },
  {
    title: "Sales Team",
    href: "/admin/sales-persons",
    icon: UserCheck,
  },
  {
    title: "Support Tickets",
    href: "/admin/support",
    icon: HeadphonesIcon,
  },
  {
    title: "Audit Logs",
    href: "/admin/audit-logs",
    icon: FileText,
  },
]

export default function AdminLayout({
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
      if (session.user.role !== "SUPER_ADMIN") {
        router.push("/")
      }
    } else if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, session, router])

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 lg:translate-x-0 lg:static",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <Link href="/admin/dashboard" className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">i-Ticket Admin</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white hover:bg-slate-800"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Super Administrator
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700 space-y-2">
            <div className="px-3 py-2">
              <p className="text-sm font-medium truncate text-white">{session.user.name}</p>
              <p className="text-xs text-slate-400">{session.user.email}</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
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
        <header className="lg:hidden sticky top-0 z-30 bg-slate-900 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-slate-800"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-bold">i-Ticket Admin</span>
            </Link>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}

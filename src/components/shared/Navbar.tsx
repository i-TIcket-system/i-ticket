"use client"

import Link from "next/link"
import Image from "next/image"
import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import { Menu, X, User, LogOut, LayoutDashboard, Ticket, Building2, HeadphonesIcon, Bus, Users, FileText, UserCheck, ChevronDown, Moon, Sun } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTheme } from "@/components/providers/ThemeProvider"
import { NotificationBell } from "@/components/notifications"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const { data: session, status } = useSession()
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Hide navbar on routes that have their own layouts
  const hiddenRoutes = ["/admin", "/company", "/staff", "/cashier", "/mechanic", "/finance", "/sales"]
  const shouldHide = hiddenRoutes.some((route) => pathname?.startsWith(route))

  // Track scroll position for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Don't render navbar on admin/dashboard routes
  if (shouldHide) {
    return null
  }

  const getDashboardLink = () => {
    if (!session) return "/login"
    switch (session.user.role) {
      case "SUPER_ADMIN":
        return "/admin/dashboard"
      case "COMPANY_ADMIN":
        return "/company/dashboard"
      case "SALES_PERSON":
        return "/sales/dashboard"
      default:
        return "/tickets"
    }
  }

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-white/70 dark:bg-background/70 backdrop-blur-2xl border-b border-white/20 dark:border-white/10 shadow-lg shadow-black/5"
          : "bg-white/30 dark:bg-transparent backdrop-blur-md border-b border-white/10 dark:border-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <Image
                src="/logo.svg"
                alt="i-Ticket"
                width={40}
                height={40}
                className="h-10 w-10 transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-primary">i</span>
              <span className="text-foreground">-Ticket</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {session?.user?.role === "SUPER_ADMIN" ? (
              <>
                <NavLink href="/admin/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
                <NavLink href="/admin/support" icon={HeadphonesIcon}>Support</NavLink>
                <NavLink href="/admin/companies" icon={Building2}>Companies</NavLink>
                <NavLink href="/admin/sales-persons" icon={UserCheck}>Sales Team</NavLink>
                <NavLink href="/admin/audit-logs" icon={FileText}>Audit Logs</NavLink>
              </>
            ) : session?.user?.role === "SALES_PERSON" ? (
              <>
                <NavLink href="/sales/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
                <NavLink href="/sales/referrals" icon={Users}>Referrals</NavLink>
                <NavLink href="/sales/commissions" icon={Ticket}>Commissions</NavLink>
              </>
            ) : session?.user?.role === "COMPANY_ADMIN" ? (
              <>
                <NavLink href="/company/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
                <NavLink href="/company/trips" icon={Bus}>Trips</NavLink>
              </>
            ) : (
              <>
                <NavLink href="/search">Find Trips</NavLink>
                <NavLink href="/about">About</NavLink>
                <NavLink href="/contact">Contact</NavLink>
              </>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-10 w-10 rounded-full"
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>

            {/* Notifications - Only for logged in users */}
            {session && <NotificationBell />}

            {status === "loading" ? (
              <div className="h-10 w-24 animate-pulse rounded-lg bg-muted" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 gap-2 pl-2 pr-3 rounded-full hover:bg-muted">
                    <Avatar className="h-8 w-8 border-2 border-primary/30">
                      <AvatarFallback className="text-white text-sm font-medium" style={{ background: "linear-gradient(135deg, #0e9494 0%, #20c4c4 100%)" }}>
                        {(session.user.name?.charAt(0) || session.user.phone?.slice(-2) || "U").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground hidden lg:block max-w-[100px] truncate">
                      {session.user.name?.split(" ")[0] || session.user.phone}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start" forceMount>
                  <div className="flex items-center gap-3 p-3 border-b">
                    <Avatar className="h-10 w-10 border-2 border-primary/30">
                      <AvatarFallback className="text-white font-medium" style={{ background: "linear-gradient(135deg, #0e9494 0%, #20c4c4 100%)" }}>
                        {(session.user.name?.charAt(0) || session.user.phone?.slice(-2) || "U").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5 leading-none">
                      <p className="font-medium text-foreground">{session.user.name || session.user.phone}</p>
                      {session.user.name && <p className="text-xs text-muted-foreground">{session.user.phone}</p>}
                    </div>
                  </div>
                  <div className="p-1">
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href={getDashboardLink()} className="flex items-center gap-2 py-2">
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    {session.user.role === "CUSTOMER" && (
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href="/tickets" className="flex items-center gap-2 py-2">
                          <Ticket className="h-4 w-4 text-muted-foreground" />
                          My Tickets
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link
                        href={session.user.role === "SALES_PERSON" ? "/sales/profile" : "/profile"}
                        className="flex items-center gap-2 py-2"
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="p-1">
                    <DropdownMenuItem
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button variant={pathname === "/login" ? "default" : "ghost"} className="h-10 px-4 font-medium">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant={pathname === "/register" ? "default" : "ghost"} className="h-10 px-5 font-medium">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t backdrop-blur-2xl bg-white/80 dark:bg-background/80 animate-fade-in rounded-b-2xl shadow-lg">
            <div className="flex flex-col gap-1">
              {session?.user?.role === "SUPER_ADMIN" ? (
                <>
                  <MobileNavLink href="/admin/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</MobileNavLink>
                  <MobileNavLink href="/admin/support" onClick={() => setMobileMenuOpen(false)}>Support</MobileNavLink>
                  <MobileNavLink href="/admin/companies" onClick={() => setMobileMenuOpen(false)}>Companies</MobileNavLink>
                  <MobileNavLink href="/admin/sales-persons" onClick={() => setMobileMenuOpen(false)}>Sales Team</MobileNavLink>
                  <MobileNavLink href="/admin/audit-logs" onClick={() => setMobileMenuOpen(false)}>Audit Logs</MobileNavLink>
                </>
              ) : session?.user?.role === "SALES_PERSON" ? (
                <>
                  <MobileNavLink href="/sales/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</MobileNavLink>
                  <MobileNavLink href="/sales/referrals" onClick={() => setMobileMenuOpen(false)}>Referrals</MobileNavLink>
                  <MobileNavLink href="/sales/commissions" onClick={() => setMobileMenuOpen(false)}>Commissions</MobileNavLink>
                </>
              ) : session?.user?.role === "COMPANY_ADMIN" ? (
                <>
                  <MobileNavLink href="/company/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</MobileNavLink>
                  <MobileNavLink href="/company/trips" onClick={() => setMobileMenuOpen(false)}>Trips</MobileNavLink>
                </>
              ) : (
                <>
                  <MobileNavLink href="/search" onClick={() => setMobileMenuOpen(false)}>Find Trips</MobileNavLink>
                  <MobileNavLink href="/about" onClick={() => setMobileMenuOpen(false)}>About</MobileNavLink>
                  <MobileNavLink href="/contact" onClick={() => setMobileMenuOpen(false)}>Contact</MobileNavLink>
                </>
              )}

              <div className="my-2 border-t" />

              {/* Theme Toggle - Mobile */}
              <button
                onClick={() => {
                  toggleTheme()
                  setMobileMenuOpen(false) // P2-UX-008: Close menu to show theme change
                }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left font-medium w-full"
              >
                {theme === "light" ? (
                  <>
                    <Moon className="h-4 w-4" />
                    Dark Mode
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4" />
                    Light Mode
                  </>
                )}
              </button>

              <div className="my-2 border-t" />

              {session ? (
                <>
                  {/* User info for mobile */}
                  <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-muted/50 rounded-lg">
                    <Avatar className="h-10 w-10 border-2 border-primary/30">
                      <AvatarFallback className="text-white font-medium" style={{ background: "linear-gradient(135deg, #0e9494 0%, #20c4c4 100%)" }}>
                        {(session.user.name?.charAt(0) || session.user.phone?.slice(-2) || "U").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">
                        {session.user.name || session.user.phone || "User"}
                      </span>
                      {session.user.name && session.user.phone && (
                        <span className="text-xs text-muted-foreground">{session.user.phone}</span>
                      )}
                    </div>
                  </div>

                  <MobileNavLink href={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>Dashboard</MobileNavLink>
                  {session.user.role === "CUSTOMER" && (
                    <MobileNavLink href="/tickets" onClick={() => setMobileMenuOpen(false)}>My Tickets</MobileNavLink>
                  )}
                  <button
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors text-left font-medium"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      signOut({ callbackUrl: '/' })
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-2 px-1">
                  <Link href="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant={pathname === "/login" ? "default" : "outline"} className="w-full h-11 font-medium">Log in</Button>
                  </Link>
                  <Link href="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant={pathname === "/register" ? "default" : "outline"} className="w-full h-11 font-medium">Sign up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

// Desktop nav link component
function NavLink({
  href,
  children,
  icon: Icon,
}: {
  href: string
  children: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
}) {
  const pathname = usePathname()

  // P2-UX-005: Better active detection for nested routes
  const isActive = pathname === href ||
                   pathname.startsWith(href + '/') ||
                   (href !== '/' && pathname.includes(href))

  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary font-semibold border-b-2 border-primary'
          : 'text-foreground/70 hover:text-foreground hover:bg-muted'
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </Link>
  )
}

// Mobile nav link component
function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      className="flex items-center px-3 py-2.5 rounded-lg text-foreground font-medium hover:bg-muted transition-colors"
      onClick={onClick}
    >
      {children}
    </Link>
  )
}

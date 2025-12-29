"use client"

import Link from "next/link"
import Image from "next/image"
import { useSession, signOut } from "next-auth/react"
import { Menu, X, User, LogOut, LayoutDashboard, Ticket, Building2, HeadphonesIcon, Bus, Users, FileText } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const getDashboardLink = () => {
    if (!session) return "/login"
    switch (session.user.role) {
      case "SUPER_ADMIN":
        return "/admin/dashboard"
      case "COMPANY_ADMIN":
        return "/company/dashboard"
      default:
        return "/tickets"
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="i-Ticket"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <span className="text-xl font-bold">
              <span className="text-primary">i</span>-Ticket
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {session?.user?.role === "SUPER_ADMIN" ? (
              <>
                <Link href="/admin/dashboard" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link href="/admin/support" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                  <HeadphonesIcon className="h-4 w-4" />
                  Support
                </Link>
                <Link href="/admin/companies" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  Companies
                </Link>
                <Link href="/admin/audit-logs" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Audit Logs
                </Link>
              </>
            ) : session?.user?.role === "COMPANY_ADMIN" ? (
              <>
                <Link href="/company/dashboard" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link href="/company/trips" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                  <Bus className="h-4 w-4" />
                  Trips
                </Link>
              </>
            ) : (
              <>
                <Link href="/search" className="text-sm font-medium hover:text-primary transition-colors">
                  Find Trips
                </Link>
                <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
                  About
                </Link>
                <Link href="/contact" className="text-sm font-medium hover:text-primary transition-colors">
                  Contact
                </Link>
              </>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {status === "loading" ? (
              <div className="h-10 w-24 animate-pulse rounded-md bg-muted" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-white">
                        {session.user.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground">{session.user.phone}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardLink()}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/tickets">
                      <Ticket className="mr-2 h-4 w-4" />
                      My Tickets
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button>Sign up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t animate-fade-in">
            <div className="flex flex-col gap-4">
              {session?.user?.role === "SUPER_ADMIN" ? (
                <>
                  <Link
                    href="/admin/dashboard"
                    className="text-sm font-medium hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/support"
                    className="text-sm font-medium hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Support
                  </Link>
                  <Link
                    href="/admin/companies"
                    className="text-sm font-medium hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Companies
                  </Link>
                  <Link
                    href="/admin/audit-logs"
                    className="text-sm font-medium hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Audit Logs
                  </Link>
                </>
              ) : session?.user?.role === "COMPANY_ADMIN" ? (
                <>
                  <Link
                    href="/company/dashboard"
                    className="text-sm font-medium hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/company/trips"
                    className="text-sm font-medium hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Trips
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/search"
                    className="text-sm font-medium hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Find Trips
                  </Link>
                  <Link
                    href="/about"
                    className="text-sm font-medium hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                  <Link
                    href="/contact"
                    className="text-sm font-medium hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Contact
                  </Link>
                </>
              )}
              {session ? (
                <>
                  <Link
                    href={getDashboardLink()}
                    className="text-sm font-medium hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/tickets"
                    className="text-sm font-medium hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Tickets
                  </Link>
                  <button
                    className="text-sm font-medium text-left text-red-500 hover:text-red-600 transition-colors"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      signOut()
                    }}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" className="w-full">Log in</Button>
                  </Link>
                  <Link href="/register" className="flex-1">
                    <Button className="w-full">Sign up</Button>
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

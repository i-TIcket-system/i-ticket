"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Phone, Mail, MapPin, Send, ArrowUpRight } from "lucide-react"

const footerLinks = {
  company: [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Careers", href: "/contact" },
  ],
  legal: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Cookie Policy", href: "/privacy" },
    { label: "Refund Policy", href: "/terms" },
  ],
  partners: [
    { label: "Selam Bus", href: "/search?company=selam" },
    { label: "Abay Bus", href: "/search?company=abay" },
    { label: "Ghion Bus", href: "/search?company=ghion" },
    { label: "Awash Bus", href: "/search?company=awash" },
  ],
}

const socialLinks = [
  { icon: Send, href: "https://t.me/i_ticket_busBot", label: "Telegram Bot - Book Bus Tickets" },
]

export function Footer() {
  const pathname = usePathname()

  // Hide footer on routes that have their own layouts
  const hiddenRoutes = ["/admin", "/company", "/staff", "/cashier", "/sales", "/driver"]
  const shouldHide = hiddenRoutes.some((route) => pathname?.startsWith(route))

  if (shouldHide) {
    return null
  }

  return (
    <footer className="relative text-white overflow-hidden" style={{ background: "#0d4f5c" }}>
      {/* Ethiopian pattern overlay */}
      <div className="absolute inset-0 eth-pattern opacity-5" />

      {/* Top accent line - Ethiopian flag colors */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1a8f1a] via-[#f5c142] to-[#e63946]" />

      <div className="container relative z-10 mx-auto px-4 py-16">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <Image
                src="/logo.svg"
                alt="i-Ticket"
                width={48}
                height={48}
                className="h-12 w-12 brightness-0 invert transition-transform duration-300 group-hover:scale-105"
              />
              <span className="text-2xl font-bold tracking-tight">
                <span className="text-primary-400">i</span>-Ticket
              </span>
            </Link>

            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              AI-driven ticketing platform providing seamless travel booking across Ethiopia.
              Book from top bus companies with instant QR code tickets.
            </p>

            {/* Ethiopian flag bar */}
            <div className="ethiopian-bar">
              <div />
              <div />
              <div />
            </div>

            {/* Social links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="h-10 w-10 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5"
                >
                  <social.icon className="h-4 w-4 text-white/60" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display text-lg mb-5 text-white">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group text-white/60 hover:text-white transition-colors text-sm inline-flex items-center gap-1"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-display text-lg mb-5 text-white">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group text-white/60 hover:text-white transition-colors text-sm inline-flex items-center gap-1"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-lg mb-5 text-white">Contact Us</h3>
            <ul className="space-y-4">
              <li>
                <a
                  href="tel:+251911550001"
                  className="flex items-center gap-3 text-white/60 hover:text-white transition-colors text-sm group"
                >
                  <div className="h-9 w-9 rounded-lg bg-[#20c4c4]/20 flex items-center justify-center group-hover:bg-[#20c4c4]/30 transition-colors">
                    <Phone className="h-4 w-4 text-[#20c4c4]" />
                  </div>
                  <span>+251 911 550 001</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@i-ticket.et"
                  className="flex items-center gap-3 text-white/60 hover:text-white transition-colors text-sm group"
                >
                  <div className="h-9 w-9 rounded-lg bg-[#0e9494]/20 flex items-center justify-center group-hover:bg-[#0e9494]/30 transition-colors">
                    <Mail className="h-4 w-4 text-[#20c4c4]" />
                  </div>
                  <span>support@i-ticket.et</span>
                </a>
              </li>
              <li>
                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-white/80" />
                  </div>
                  <span>Addis Ababa, Ethiopia</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/50 text-sm">
              &copy; {new Date().getFullYear()} i-Ticket. All rights reserved.
            </p>
            <p className="text-white/40 text-xs flex items-center gap-1.5">
              Built with
              <span className="text-red-400">&#10084;</span>
              by Ethiopian entrepreneurs
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans, DM_Serif_Display } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "@/components/providers/SessionProvider"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { Navbar } from "@/components/shared/Navbar"
import { Footer } from "@/components/shared/Footer"
import { Toaster } from "sonner"

// Body font - modern, clean, characterful
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
})

// Display font - elegant, editorial feel for headings
const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
})

export const metadata: Metadata = {
  title: "i-Ticket - Book Bus Tickets in Ethiopia",
  description: "AI-driven ticketing platform for seamless travel booking across Ethiopia. Book long-distance bus tickets from Selam, Sky, Abay, and more.",
  keywords: ["bus tickets", "Ethiopia", "travel", "booking", "Addis Ababa", "Selam Bus", "Sky Bus"],
  authors: [{ name: "i-Ticket Team" }],
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#10B981",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jakarta.variable} ${dmSerif.variable}`}>
      <body className="font-body antialiased">
        <ThemeProvider>
        <SessionProvider>
          {/* Skip to Main Content - Accessibility for keyboard users */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Skip to main content
          </a>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main id="main-content" className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster position="top-center" richColors closeButton />
        </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

import type { Metadata, Viewport } from "next"
import { Playfair_Display, Outfit, Noto_Sans_Ethiopic } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "@/components/providers/SessionProvider"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { Navbar } from "@/components/shared/Navbar"
import { Footer } from "@/components/shared/Footer"
import { Toaster } from "sonner"

// Display font - Luxury magazine aesthetic, dramatic contrast
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

// Body font - Modern geometric sans, Ethiopian-inspired roundness
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
})

// Amharic font - Strategic use for station names, cultural headings
const amharic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  variable: "--font-amharic",
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
    <html lang="en" suppressHydrationWarning className={`${playfair.variable} ${outfit.variable} ${amharic.variable}`}>
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
          <Toaster
            position="top-center"
            closeButton
            toastOptions={{
              classNames: {
                toast: '!text-[#0d4f5c]',
                title: '!text-[#0d4f5c] !font-semibold',
                description: '!text-[#0d4f5c]/80',
                success: '!bg-[#d4f4f4] !text-[#0d4f5c] !border-[#20c4c4]',
                error: '!bg-[#d4f4f4] !text-[#0d4f5c] !border-[#20c4c4]',
                info: '!bg-[#d4f4f4] !text-[#0d4f5c] !border-[#20c4c4]',
                warning: '!bg-[#d4f4f4] !text-[#0d4f5c] !border-[#20c4c4]',
              },
              style: {
                borderRadius: '0.75rem',
              },
            }}
          />
        </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

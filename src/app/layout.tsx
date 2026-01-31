import type { Metadata, Viewport } from "next"
import { Playfair_Display, Outfit, Noto_Sans_Ethiopic } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "@/components/providers/SessionProvider"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { Navbar } from "@/components/shared/Navbar"
import { Footer } from "@/components/shared/Footer"
import { Toaster } from "sonner"
import { InstallPrompt } from "@/components/pwa/InstallPrompt"

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
  metadataBase: new URL("https://i-ticket.et"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://i-ticket.et",
    siteName: "i-Ticket",
    title: "i-Ticket - Book Bus Tickets in Ethiopia",
    description: "AI-driven ticketing platform for seamless travel booking across Ethiopia. Book long-distance bus tickets from Selam, Sky, Abay, and more.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "i-Ticket - Ethiopia's #1 Bus Booking Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "i-Ticket - Book Bus Tickets in Ethiopia",
    description: "AI-driven ticketing platform for seamless travel booking across Ethiopia.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: '/my-favicon/favicon.ico' },
      { url: '/my-favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/my-favicon/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: [
      { url: '/my-favicon/favicon.ico' },
    ],
    apple: [
      { url: '/my-favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  other: {
    "msapplication-TileImage": "/my-favicon/web-app-manifest-512x512.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility
  userScalable: true, // Accessibility requirement
  viewportFit: "cover", // Support notched phones
  themeColor: "#0e9494", // Match brand teal
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
          <InstallPrompt />
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

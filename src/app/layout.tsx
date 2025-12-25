import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "@/components/providers/SessionProvider"
import { Navbar } from "@/components/shared/Navbar"
import { Footer } from "@/components/shared/Footer"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster position="top-center" richColors closeButton />
        </SessionProvider>
      </body>
    </html>
  )
}

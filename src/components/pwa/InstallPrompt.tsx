"use client"

import { useState, useEffect } from "react"
import { Download, X, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      return
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    setIsIOS(iOS)

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.log("SW registration failed:", err)
      })
    }

    // Listen for install prompt (Android/Desktop Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)

    // Check if dismissed recently (don't show again for 7 days)
    const dismissed = localStorage.getItem("pwa-prompt-dismissed")
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setShowPrompt(false)
      }
    }

    // Show iOS prompt after 3 seconds if on iOS and not installed
    if (iOS && !window.matchMedia("(display-mode: standalone)").matches) {
      const iosDismissed = localStorage.getItem("ios-prompt-dismissed")
      if (!iosDismissed || Date.now() - parseInt(iosDismissed) > 7 * 24 * 60 * 60 * 1000) {
        setTimeout(() => setShowIOSInstructions(true), 3000)
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setShowIOSInstructions(false)
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString())
    localStorage.setItem("ios-prompt-dismissed", Date.now().toString())
  }

  // Don't show if installed
  if (isInstalled) return null

  // iOS instructions modal
  if (isIOS && showIOSInstructions) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t-2 border-primary shadow-lg animate-in slide-in-from-bottom duration-300">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-start gap-3 max-w-lg mx-auto">
          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Install i-Ticket App</h3>
            <p className="text-sm text-gray-600 mt-1">
              Tap <span className="inline-flex items-center px-1 bg-gray-100 rounded">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                </svg>
              </span> Share → then <strong>"Add to Home Screen"</strong>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Android/Desktop install prompt
  if (showPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t-2 border-primary shadow-lg animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Install i-Ticket</h3>
              <p className="text-sm text-gray-600">Quick access from home screen</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              Not now
            </Button>
            <Button size="sm" onClick={handleInstall}>
              Install
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

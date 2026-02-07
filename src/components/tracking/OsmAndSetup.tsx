"use client"

import { useState } from "react"
import {
  Smartphone, Copy, Check, ChevronDown, ChevronUp,
  ExternalLink, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface OsmAndSetupProps {
  tripId: string
}

export default function OsmAndSetup({ tripId }: OsmAndSetupProps) {
  const [expanded, setExpanded] = useState(false)
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  const generateToken = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/tracking/generate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to generate token")
        return
      }

      setTrackingUrl(data.trackingUrl)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const copyUrl = async () => {
    if (!trackingUrl) return
    try {
      await navigator.clipboard.writeText(trackingUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select input text
      const input = document.querySelector<HTMLInputElement>("#osmand-url-input")
      if (input) {
        input.select()
        document.execCommand("copy")
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  return (
    <Card className="mx-4 mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-teal-600" />
          <span className="text-sm font-medium">Background Tracking (OsmAnd)</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
          <p className="text-xs text-gray-500">
            OsmAnd tracks GPS in the background even with screen off or browser closed.
            Both web and OsmAnd tracking can run simultaneously.
          </p>

          {!trackingUrl ? (
            <Button
              onClick={generateToken}
              disabled={loading}
              size="sm"
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Tracking URL"
              )}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-1.5">
                <input
                  id="osmand-url-input"
                  type="text"
                  readOnly
                  value={trackingUrl}
                  className="flex-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1.5 font-mono truncate"
                />
                <Button onClick={copyUrl} size="sm" variant="outline" className="shrink-0 px-2">
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <p className="font-medium text-gray-700 dark:text-gray-300">Setup (one time):</p>
            <ol className="list-decimal list-inside space-y-1.5 pl-1">
              <li>
                Install{" "}
                <a
                  href="https://play.google.com/store/apps/details?id=net.osmand"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 inline-flex items-center gap-0.5"
                >
                  OsmAnd <ExternalLink className="h-2.5 w-2.5" />
                </a>
                {" "}from Play Store or F-Droid
              </li>
              <li>
                In OsmAnd: Menu &rarr; Plugins &rarr; Trip recording &rarr; Online tracking
              </li>
              <li>
                Paste the URL above, set interval to <strong>10 seconds</strong>, and enable
              </li>
            </ol>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
              Download Ethiopia offline map (~150MB) for navigation without internet.
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}

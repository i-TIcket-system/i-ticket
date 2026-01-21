import { useEffect, useRef, useState, useCallback } from "react"

interface SSEMessage {
  type: string
  changes?: any[]
  tripId?: string
  timestamp: number
}

interface UseSSEOptions {
  url: string
  onMessage?: (message: SSEMessage) => void
  onError?: (error: Event) => void
  onConnect?: () => void
  enabled?: boolean
  reconnectInterval?: number
}

export function useSSE({
  url,
  onMessage,
  onError,
  onConnect,
  enabled = true,
  reconnectInterval = 5000,
}: UseSSEOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isReconnectingRef = useRef(false)

  const connect = useCallback(() => {
    if (!enabled || isReconnectingRef.current) return

    try {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      const eventSource = new EventSource(url)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        setIsConnected(true)
        setError(null)
        isReconnectingRef.current = false
        onConnect?.()
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as SSEMessage
          onMessage?.(data)
        } catch (err) {
          console.error("Failed to parse SSE message:", err)
        }
      }

      eventSource.onerror = (err) => {
        console.error("SSE connection error:", err)
        setIsConnected(false)
        setError("Connection lost")
        onError?.(err)

        // Close and attempt reconnection
        eventSource.close()
        eventSourceRef.current = null

        // Reconnect after delay
        if (enabled && !isReconnectingRef.current) {
          isReconnectingRef.current = true
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("Attempting to reconnect SSE...")
            connect()
          }, reconnectInterval)
        }
      }
    } catch (err) {
      console.error("Failed to create EventSource:", err)
      setError("Failed to connect")
      setIsConnected(false)
    }
  }, [url, enabled, onMessage, onError, onConnect, reconnectInterval])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setIsConnected(false)
    isReconnectingRef.current = false
  }, [])

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])

  // Handle visibility change (pause when tab hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        disconnect()
      } else if (enabled) {
        connect()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [enabled, connect, disconnect])

  return {
    isConnected,
    error,
    reconnect: connect,
    disconnect,
  }
}

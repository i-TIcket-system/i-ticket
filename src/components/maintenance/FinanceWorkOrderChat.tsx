"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import {
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  User,
  Shield,
  Car,
  UserCheck,
  Wrench,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  senderId: string
  senderName: string
  senderRole: string
  message: string
  type: string
  isOwn: boolean
  createdAt: string
}

interface FinanceWorkOrderChatProps {
  workOrderId: string
  workOrderNumber?: string
  className?: string
  defaultExpanded?: boolean
}

const roleIcons: Record<string, typeof User> = {
  ADMIN: Shield,
  DRIVER: Car,
  CONDUCTOR: UserCheck,
  MECHANIC: Wrench,
  FINANCE: DollarSign,
  STAFF: User,
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
  DRIVER: "bg-blue-100 text-blue-700 border-blue-200",
  CONDUCTOR: "bg-green-100 text-green-700 border-green-200",
  MECHANIC: "bg-amber-100 text-amber-700 border-amber-200",
  FINANCE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  STAFF: "bg-gray-100 text-gray-700 border-gray-200",
}

const messageTypeStyles: Record<string, string> = {
  TEXT: "",
  STATUS_UPDATE: "bg-blue-50 border-l-4 border-blue-500",
  COST_APPROVAL: "bg-green-50 border-l-4 border-green-500",
  URGENT: "bg-red-50 border-l-4 border-red-500",
}

export function FinanceWorkOrderChat({
  workOrderId,
  workOrderNumber,
  className,
  defaultExpanded = true,
}: FinanceWorkOrderChatProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(defaultExpanded)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const prevMessageCountRef = useRef<number>(0)

  const scrollToBottom = useCallback((smooth = true) => {
    const container = messagesContainerRef.current
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      })
    }
  }, [])

  const fetchMessages = useCallback(async () => {
    try {
      // Use finance API endpoint
      const response = await fetch(`/api/finance/work-orders/${workOrderId}/messages`)
      const data = await response.json()

      if (response.ok) {
        setMessages(data.messages || [])
        setError(null)

        if (data.messages && data.messages.length > prevMessageCountRef.current) {
          prevMessageCountRef.current = data.messages.length
          setTimeout(() => scrollToBottom(true), 100)
        }
      } else {
        setError(data.error || "Failed to load messages")
      }
    } catch (err) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }, [workOrderId, scrollToBottom])

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    setError(null)

    try {
      const response = await fetch(`/api/finance/work-orders/${workOrderId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setNewMessage("")
        await fetchMessages()
      } else {
        setError(data.error || "Failed to send message")
      }
    } catch (err) {
      setError("Network error")
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  useEffect(() => {
    if (!expanded) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      return
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
      } else {
        if (!pollIntervalRef.current) {
          pollIntervalRef.current = setInterval(fetchMessages, 10000)
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    if (!document.hidden && !pollIntervalRef.current) {
      pollIntervalRef.current = setInterval(fetchMessages, 10000)
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [expanded, fetchMessages])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (!session?.user) return null

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            Team Communication
            {workOrderNumber && (
              <Badge variant="outline" className="font-mono text-xs">
                {workOrderNumber}
              </Badge>
            )}
          </CardTitle>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        {!expanded && messages.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {messages.length} message{messages.length !== 1 ? "s" : ""}
          </p>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="p-0">
          <div
            ref={messagesContainerRef}
            className="h-80 overflow-y-auto p-4 space-y-3 bg-muted/20"
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-destructive">
                <AlertCircle className="h-8 w-8" />
                <p className="text-sm">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchMessages}>
                  Retry
                </Button>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                <MessageSquare className="h-12 w-12 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs">Communicate with the team about costs and approvals</p>
              </div>
            ) : (
              messages.map((msg) => {
                const RoleIcon = roleIcons[msg.senderRole] || User
                const roleColor = roleColors[msg.senderRole] || roleColors.STAFF
                const messageTypeStyle = messageTypeStyles[msg.type] || ""

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3 animate-in fade-in slide-in-from-bottom-2",
                      msg.isOwn && "flex-row-reverse"
                    )}
                  >
                    <div className={cn("flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center", roleColor)}>
                      <RoleIcon className="h-4 w-4" />
                    </div>

                    <div className={cn("flex-1 max-w-[80%]", msg.isOwn && "flex flex-col items-end")}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">{msg.senderName}</span>
                        <Badge variant="outline" className={cn("text-[10px] px-1 py-0", roleColor)}>
                          {msg.senderRole}
                        </Badge>
                      </div>
                      <div
                        className={cn(
                          "rounded-lg p-3 shadow-sm",
                          msg.isOwn
                            ? "bg-emerald-600 text-white"
                            : "bg-background border",
                          messageTypeStyle
                        )}
                      >
                        {msg.type !== "TEXT" && (
                          <Badge variant="secondary" className="mb-2 text-[10px]">
                            {msg.type.replace("_", " ")}
                          </Badge>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="p-4 border-t bg-background">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                disabled={sending}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                size="icon"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {error && (
              <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

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
  Ticket,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn, isTodayEthiopia } from "@/lib/utils"

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

interface TripChatProps {
  tripId: string
  tripRoute?: string // e.g., "Addis Ababa → Bahir Dar"
  className?: string
  defaultExpanded?: boolean
}

const roleIcons: Record<string, typeof User> = {
  ADMIN: Shield,
  DRIVER: Car,
  CONDUCTOR: UserCheck,
  TICKETER: Ticket,
  STAFF: User,
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
  DRIVER: "bg-blue-100 text-blue-700 border-blue-200",
  CONDUCTOR: "bg-green-100 text-green-700 border-green-200",
  TICKETER: "bg-orange-100 text-orange-700 border-orange-200",
  STAFF: "bg-gray-100 text-gray-700 border-gray-200",
}

export function TripChat({
  tripId,
  tripRoute,
  className,
  defaultExpanded = true,
}: TripChatProps) {
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
      const response = await fetch(`/api/trips/${tripId}/messages`)
      const data = await response.json()

      if (response.ok) {
        setMessages(data.messages || [])
        setError(null)
      } else {
        setError(data.error || "Failed to load messages")
      }
    } catch (err) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    fetchMessages()

    // Poll for new messages every 10 seconds when expanded
    if (expanded) {
      pollIntervalRef.current = setInterval(fetchMessages, 10000)
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [fetchMessages, expanded])

  useEffect(() => {
    // Only scroll when new messages are added (not on every re-render)
    if (messages.length > prevMessageCountRef.current) {
      scrollToBottom()
    }
    prevMessageCountRef.current = messages.length
  }, [messages.length, scrollToBottom])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const response = await fetch(`/api/trips/${tripId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessages((prev) => [...prev, data.message])
        setNewMessage("")
      } else {
        setError(data.error || "Failed to send message")
      }
    } catch (err) {
      setError("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const isToday = isTodayEthiopia(dateString)

    if (isToday) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const RoleIcon = (role: string) => {
    const Icon = roleIcons[role] || User
    return Icon
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader
        className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-teal-600" />
            Trip Chat
            {tripRoute && (
              <span className="text-xs text-muted-foreground font-normal">
                ({tripRoute})
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {messages.length}
              </Badge>
            )}
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="p-0">
          {/* Messages Container */}
          <div
            ref={messagesContainerRef}
            className="h-64 overflow-y-auto p-3 space-y-3 bg-gray-50"
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={fetchMessages}
                  className="mt-1"
                >
                  Try again
                </Button>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No messages yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Start a conversation with the trip team
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg) => {
                  const Icon = RoleIcon(msg.senderRole)
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-2",
                        msg.isOwn ? "flex-row-reverse" : ""
                      )}
                    >
                      {/* Avatar */}
                      <div
                        className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border",
                          roleColors[msg.senderRole] || roleColors.STAFF
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={cn(
                          "max-w-[75%] rounded-lg px-3 py-2",
                          msg.isOwn
                            ? "bg-teal-600 text-white"
                            : "bg-white border shadow-sm"
                        )}
                      >
                        {!msg.isOwn && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">
                              {msg.senderName}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1 py-0",
                                roleColors[msg.senderRole]
                              )}
                            >
                              {msg.senderRole}
                            </Badge>
                          </div>
                        )}
                        <p
                          className={cn(
                            "text-sm break-words",
                            msg.isOwn ? "text-white" : "text-gray-800"
                          )}
                        >
                          {msg.message}
                        </p>
                        <p
                          className={cn(
                            "text-[10px] mt-1",
                            msg.isOwn ? "text-teal-200" : "text-muted-foreground"
                          )}
                        >
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>

          {/* Message Input */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t bg-white flex gap-2"
          >
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending || !!error}
              className="flex-1"
              maxLength={2000}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newMessage.trim() || sending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  )
}

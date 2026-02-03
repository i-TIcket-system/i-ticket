"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Paperclip, Download, FileText, X, Loader2, Search, Filter, Calendar } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface Attachment {
  name: string
  url: string
  size: number
  type: string
}

interface CompanyMessage {
  id: string
  message: string
  attachments: string | null
  senderId: string
  senderName: string
  senderRole: string
  createdAt: string
  isReadByAdmin: boolean
  isReadByCompany: boolean
}

export default function ContactChat() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<CompanyMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  // Filter messages based on search and date
  const filteredMessages = useMemo(() => {
    let filtered = [...messages]

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(msg =>
        msg.message.toLowerCase().includes(query) ||
        msg.senderName.toLowerCase().includes(query)
      )
    }

    // Date range filter
    if (startDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      filtered = filtered.filter(msg => new Date(msg.createdAt) >= start)
    }

    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      filtered = filtered.filter(msg => new Date(msg.createdAt) <= end)
    }

    return filtered
  }, [messages, searchQuery, startDate, endDate])

  const hasActiveFilters = searchQuery || startDate || endDate

  const clearFilters = () => {
    setSearchQuery("")
    setStartDate("")
    setEndDate("")
  }

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await fetch("/api/company/messages")
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages.reverse()) // Reverse to show oldest first
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    } finally {
      setFetching(false)
    }
  }

  // Mark messages as read
  const markAsRead = async () => {
    try {
      await fetch("/api/company/messages/mark-read", {
        method: "PATCH",
      })
    } catch (error) {
      console.error("Failed to mark as read:", error)
    }
  }

  // Polling for new messages (every 10 seconds)
  useEffect(() => {
    fetchMessages()
    markAsRead()

    const interval = setInterval(() => {
      // Only poll if tab is visible
      if (document.visibilityState === "visible") {
        fetchMessages()
        markAsRead()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Limit to 5 files total
    if (selectedFiles.length + files.length > 5) {
      toast.error("Maximum 5 files allowed")
      return
    }

    // Check file sizes
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`)
        return
      }
    }

    setSelectedFiles([...selectedFiles, ...files])
  }

  // Remove selected file
  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
  }

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) {
      toast.error("Please enter a message or attach a file")
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("message", newMessage)

      selectedFiles.forEach((file) => {
        formData.append("files", file)
      })

      const response = await fetch("/api/company/messages", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setMessages([...messages, data.message])
        setNewMessage("")
        setSelectedFiles([])
        toast.success("Message sent")
        scrollToBottom()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to send message")
      }
    } catch (error) {
      console.error("Send message error:", error)
      toast.error("Failed to send message")
    } finally {
      setLoading(false)
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  // Parse attachments
  const parseAttachments = (attachmentsJson: string | null): Attachment[] => {
    if (!attachmentsJson) return []
    try {
      return JSON.parse(attachmentsJson)
    } catch {
      return []
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Search and Filter Bar */}
      <div className="border-b bg-white p-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                !
              </Badge>
            )}
          </Button>
        </div>

        {/* Expandable date range filter */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Date range:</span>
            </div>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[140px] h-8"
              placeholder="From"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[140px] h-8"
              placeholder="To"
            />
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        )}

        {/* Filter indicator */}
        {hasActiveFilters && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <span>Showing {filteredMessages.length} of {messages.length} messages</span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchQuery}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery("")} />
              </Badge>
            )}
            {(startDate || endDate) && (
              <Badge variant="secondary" className="gap-1">
                {startDate && endDate ? `${startDate} to ${endDate}` : startDate ? `From ${startDate}` : `Until ${endDate}`}
                <X className="h-3 w-3 cursor-pointer" onClick={() => { setStartDate(""); setEndDate("") }} />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p>No messages yet</p>
            <p className="text-sm mt-2">Send your first message to i-Ticket support</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p>No messages match your filters</p>
            <Button variant="link" onClick={clearFilters} className="mt-2">
              Clear filters
            </Button>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isFromCompany = msg.senderRole === "COMPANY_ADMIN"
            const attachments = parseAttachments(msg.attachments)

            return (
              <div
                key={msg.id}
                className={`flex ${isFromCompany ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[70%] ${isFromCompany ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <div className="text-xs text-muted-foreground px-2">
                    {isFromCompany ? "You" : "i-Ticket Support"}
                  </div>
                  <Card
                    className={`p-3 ${
                      isFromCompany
                        ? "bg-primary text-primary-foreground"
                        : "bg-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>

                    {/* Attachments */}
                    {attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {attachments.map((attachment, idx) => (
                          <a
                            key={idx}
                            href={attachment.url}
                            download={attachment.name}
                            className={`flex items-center gap-2 p-2 rounded ${
                              isFromCompany
                                ? "bg-primary-foreground/10 hover:bg-primary-foreground/20"
                                : "bg-slate-100 hover:bg-slate-200"
                            } transition-colors`}
                          >
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{attachment.name}</p>
                              <p className={`text-xs ${isFromCompany ? "opacity-80" : "text-muted-foreground"}`}>
                                {formatFileSize(attachment.size)}
                              </p>
                            </div>
                            <Download className="h-4 w-4 flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}
                  </Card>
                  <div className="text-xs text-muted-foreground px-2">
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div className="border-t p-3 bg-white">
          <div className="text-sm font-medium mb-2">Attachments ({selectedFiles.length}/5)</div>
          <div className="space-y-2">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(idx)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t p-4 bg-white">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || selectedFiles.length >= 5}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="resize-none"
            rows={2}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={loading || (!newMessage.trim() && selectedFiles.length === 0)}
            size="icon"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line. Max 5 files, 10MB each.
        </p>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Send, Paperclip, Download, FileText, X, Loader2, Search, Building2, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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

interface Company {
  id: string
  name: string
  logo: string | null
}

interface Conversation {
  company: Company
  messages: CompanyMessage[]
  unreadCount: number
  lastMessage: CompanyMessage | null
}

export default function CompanySupportChat() {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Get selected conversation
  const selectedConversation = conversations.find(c => c.company.id === selectedCompanyId)

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.company.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesUnread = !showUnreadOnly || conv.unreadCount > 0
    return matchesSearch && matchesUnread
  })

  // Fetch all conversations
  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/admin/company-messages")
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations)

        // If no company selected, select the first one with messages
        if (!selectedCompanyId && data.conversations.length > 0) {
          const firstWithMessages = data.conversations.find((c: Conversation) => c.messages.length > 0)
          if (firstWithMessages) {
            setSelectedCompanyId(firstWithMessages.company.id)
          } else {
            setSelectedCompanyId(data.conversations[0].company.id)
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
    } finally {
      setFetching(false)
    }
  }

  // Mark company messages as read
  const markAsRead = async (companyId: string) => {
    try {
      await fetch(`/api/admin/company-messages/${companyId}/mark-read`, {
        method: "PATCH",
      })
    } catch (error) {
      console.error("Failed to mark as read:", error)
    }
  }

  // Handle company selection
  const handleCompanySelect = (companyId: string) => {
    setSelectedCompanyId(companyId)
    markAsRead(companyId)
    scrollToBottom()
  }

  // Polling for new messages (every 10 seconds)
  useEffect(() => {
    fetchConversations()

    const interval = setInterval(() => {
      // Only poll if tab is visible
      if (document.visibilityState === "visible") {
        fetchConversations()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  // Auto-scroll when messages change
  useEffect(() => {
    if (selectedConversation) {
      scrollToBottom()
    }
  }, [selectedConversation?.messages])

  // Mark as read when conversation selected
  useEffect(() => {
    if (selectedCompanyId) {
      markAsRead(selectedCompanyId)
    }
  }, [selectedCompanyId])

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (selectedFiles.length + files.length > 5) {
      toast.error("Maximum 5 files allowed")
      return
    }

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
    if (!selectedCompanyId) {
      toast.error("Please select a company")
      return
    }

    if (!newMessage.trim() && selectedFiles.length === 0) {
      toast.error("Please enter a message or attach a file")
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("companyId", selectedCompanyId)
      formData.append("message", newMessage)

      selectedFiles.forEach((file) => {
        formData.append("files", file)
      })

      const response = await fetch("/api/admin/company-messages", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        setNewMessage("")
        setSelectedFiles([])
        toast.success("Message sent")
        fetchConversations()
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
    <div className="flex h-[calc(100vh-12rem)] border rounded-lg overflow-hidden">
      {/* Left panel - Company list */}
      <div className="w-80 border-r bg-slate-50 flex flex-col">
        {/* Search and filter */}
        <div className="p-3 border-b bg-white space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies..."
              className="pl-9"
            />
          </div>
          <Button
            variant={showUnreadOnly ? "default" : "outline"}
            size="sm"
            className="w-full"
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          >
            {showUnreadOnly ? "Show All" : "Unread Only"}
          </Button>
        </div>

        {/* Company list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchQuery ? "No companies found" : "No conversations yet"}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.company.id}
                onClick={() => handleCompanySelect(conv.company.id)}
                className={`w-full p-3 border-b text-left transition-colors hover:bg-white ${
                  selectedCompanyId === conv.company.id ? "bg-white border-l-4 border-l-primary" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={conv.company.logo || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {conv.company.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-medium truncate">{conv.company.name}</p>
                      {conv.unreadCount > 0 && (
                        <Badge variant="destructive" className="flex-shrink-0">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.lastMessage.senderRole === "SUPER_ADMIN" ? "You: " : ""}
                        {conv.lastMessage.message}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel - Conversation */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Conversation header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation.company.logo || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {selectedConversation.company.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedConversation.company.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.messages.length} messages
                  </p>
                </div>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {selectedConversation.messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm mt-2">Start the conversation with {selectedConversation.company.name}</p>
                </div>
              ) : (
                selectedConversation.messages.map((msg) => {
                  const isFromAdmin = msg.senderRole === "SUPER_ADMIN"
                  const attachments = parseAttachments(msg.attachments)

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isFromAdmin ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[70%] ${isFromAdmin ? "items-end" : "items-start"} flex flex-col gap-1`}>
                        <div className="text-xs text-muted-foreground px-2">
                          {isFromAdmin ? "You" : selectedConversation.company.name}
                        </div>
                        <Card
                          className={`p-3 ${
                            isFromAdmin
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
                                    isFromAdmin
                                      ? "bg-primary-foreground/10 hover:bg-primary-foreground/20"
                                      : "bg-slate-100 hover:bg-slate-200"
                                  } transition-colors`}
                                >
                                  <FileText className="h-4 w-4 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate">{attachment.name}</p>
                                    <p className={`text-xs ${isFromAdmin ? "opacity-80" : "text-muted-foreground"}`}>
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Select a company to start conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

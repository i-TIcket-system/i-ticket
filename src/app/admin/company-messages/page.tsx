"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

/**
 * Redirect page: /admin/company-messages -> /admin/company-support
 * This handles legacy URLs and bookmarks pointing to the old path
 */
export default function CompanyMessagesRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin/company-support")
  }, [router])

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to Company Support...</p>
      </div>
    </div>
  )
}

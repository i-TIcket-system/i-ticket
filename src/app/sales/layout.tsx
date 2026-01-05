"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && session?.user?.role !== "SALES_PERSON") {
      // Redirect non-sales persons away
      router.push("/")
    }
  }, [status, session, router])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" style={{ background: "linear-gradient(135deg, #f0fafa 0%, #e6f7f7 50%, #f5f5f5 100%)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#0e9494" }} />
      </div>
    )
  }

  if (session?.user?.role !== "SALES_PERSON") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" style={{ background: "linear-gradient(135deg, #f0fafa 0%, #e6f7f7 50%, #f5f5f5 100%)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#0e9494" }} />
      </div>
    )
  }

  return <>{children}</>
}

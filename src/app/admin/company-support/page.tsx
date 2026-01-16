import { Metadata } from "next"
import CompanySupportChat from "@/components/admin/CompanySupportChat"
import { MessageSquare } from "lucide-react"

export const metadata: Metadata = {
  title: "Company Support | Admin Portal",
  description: "Manage conversations with bus companies",
}

export default function AdminCompanySupportPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          Company Support
        </h1>
        <p className="text-muted-foreground mt-2">
          Communicate with bus companies and handle support requests
        </p>
      </div>

      <CompanySupportChat />
    </div>
  )
}

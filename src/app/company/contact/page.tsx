import { Metadata } from "next"
import ContactChat from "@/components/company/ContactChat"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"

export const metadata: Metadata = {
  title: "Contact i-Ticket | Company Portal",
  description: "Contact i-Ticket support team",
}

export default function CompanyContactPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          Contact i-Ticket Support
        </h1>
        <p className="text-muted-foreground mt-2">
          Send messages and share files with the i-Ticket platform team
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Support Chat</CardTitle>
          <CardDescription>
            Our support team will respond to your messages as soon as possible
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ContactChat />
        </CardContent>
      </Card>
    </div>
  )
}

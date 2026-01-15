"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Users, TrendingUp, DollarSign, Phone, Mail, Calendar, Award } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"

interface TeamMember {
  id: string
  name: string
  phone: string
  email: string | null
  referralCode: string
  tier: number
  status: string
  createdAt: string
  stats: {
    referralsCount: number
    recruitsCount: number
    totalCommission: number
    recruiterEarnings: number
  }
}

export default function TeamPage() {
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState<TeamMember[]>([])
  const [totalEarnings, setTotalEarnings] = useState(0)

  useEffect(() => {
    fetchTeam()
  }, [])

  async function fetchTeam() {
    try {
      const response = await fetch("/api/sales/my-team")
      if (response.ok) {
        const data = await response.json()
        setTeam(data.team)
        setTotalEarnings(data.totalRecruiterEarnings || 0)
      } else {
        toast.error("Failed to load team")
      }
    } catch (error) {
      toast.error("Failed to load team")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#0e9494" }} />
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" style={{ color: "#0d4f5c" }}>
          My Team
        </h1>
        <p className="text-muted-foreground">
          Manage and track your recruited sales persons
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg" style={{ background: "rgba(14, 148, 148, 0.1)" }}>
                <Users className="h-6 w-6" style={{ color: "#0e9494" }} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Team Members</p>
                <p className="text-2xl font-bold">{team.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg" style={{ background: "rgba(14, 148, 148, 0.1)" }}>
                <DollarSign className="h-6 w-6" style={{ color: "#0e9494" }} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earned (30%)</p>
                <p className="text-2xl font-bold">{formatCurrency(totalEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg" style={{ background: "rgba(14, 148, 148, 0.1)" }}>
                <TrendingUp className="h-6 w-6" style={{ color: "#0e9494" }} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg per Member</p>
                <p className="text-2xl font-bold">
                  {team.length > 0 ? formatCurrency(totalEarnings / team.length) : formatCurrency(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      {team.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Team Members Yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Start recruiting sales persons using your QR code or referral link to build your team and earn 30% of their commissions.
            </p>
            <Button asChild>
              <a href="/sales/qr-code">View My QR Code</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {team.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg" style={{ background: "rgba(14, 148, 148, 0.1)" }}>
                      <Users className="h-5 w-5" style={{ color: "#0e9494" }} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Phone className="h-3 w-3" />
                        {member.phone}
                        {member.email && (
                          <>
                            <span className="mx-1">•</span>
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(14, 148, 148, 0.1)", color: "#0e9494" }}>
                      Tier {member.tier}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      member.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {member.status}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Referral Code</p>
                    <p className="font-mono font-semibold">{member.referralCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Referrals</p>
                    <p className="font-semibold">{member.stats.referralsCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Their Recruits</p>
                    <p className="font-semibold">{member.stats.recruitsCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Their Earnings</p>
                    <p className="font-semibold">{formatCurrency(member.stats.totalCommission)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Award className="h-3 w-3" style={{ color: "#0e9494" }} />
                      You Earned (30%)
                    </p>
                    <p className="font-bold" style={{ color: "#0e9494" }}>
                      {formatCurrency(member.stats.recruiterEarnings)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Joined {new Date(member.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

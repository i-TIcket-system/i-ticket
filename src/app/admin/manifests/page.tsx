"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FileDown, Download, Filter, RefreshCw, Building2, Calendar, FileText, Users, DollarSign } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Manifest {
  id: string
  tripId: string
  companyId: string
  filePath: string
  fileSize: number
  downloadType: string
  downloadedAt: string
  passengerCount: number
  totalRevenue: number
  origin: string
  destination: string
  departureTime: string
  trip: {
    id: string
    origin: string
    destination: string
    departureTime: string
    status: string
    company: {
      id: string
      name: string
    }
  }
}

interface Company {
  id: string
  name: string
}

export default function SuperAdminManifests() {
  const [manifests, setManifests] = useState<Manifest[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalManifests: 0,
    totalPassengers: 0,
    totalRevenue: 0,
    platformCommission: 0,
    totalFileSize: 0
  })

  // Filters
  const [companyId, setCompanyId] = useState<string>("ALL")
  const [downloadType, setDownloadType] = useState<string>("ALL")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchManifests = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50"
      })

      if (companyId && companyId !== "ALL") params.append("companyId", companyId)
      if (downloadType && downloadType !== "ALL") params.append("downloadType", downloadType)
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const res = await fetch(`/api/admin/manifests?${params}`)
      const data = await res.json()

      if (res.ok) {
        setManifests(data.manifests)
        setStats(data.stats)
        setCompanies(data.companies)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error("Failed to fetch manifests:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchManifests()
  }, [page, companyId, downloadType, startDate, endDate])

  const clearFilters = () => {
    setCompanyId("ALL")
    setDownloadType("ALL")
    setStartDate("")
    setEndDate("")
    setPage(1)
  }

  const getDownloadTypeBadge = (type: string) => {
    switch (type) {
      case "AUTO_DEPARTED":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Auto (Departed)</Badge>
      case "AUTO_FULL_CAPACITY":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Auto (Full)</Badge>
      case "MANUAL_COMPANY":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Manual</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Auto-Generated Manifests</h1>
        <p className="text-gray-600 mt-2">Platform-wide manifest tracking for commission verification and compliance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Manifests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalManifests}</div>
            <p className="text-xs text-muted-foreground">All auto-generated records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Passengers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPassengers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all manifests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Platform commission: {formatCurrency(stats.platformCommission)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <FileDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats.totalFileSize)}</div>
            <p className="text-xs text-muted-foreground">Total file storage</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <label className="text-sm font-medium mb-2 block">Company</label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="All companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All companies</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Download Type</label>
              <Select value={downloadType} onValueChange={setDownloadType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  <SelectItem value="AUTO_DEPARTED">Auto (Departed)</SelectItem>
                  <SelectItem value="AUTO_FULL_CAPACITY">Auto (Full Capacity)</SelectItem>
                  <SelectItem value="MANUAL_COMPANY">Manual Company</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={clearFilters} className="flex-1">
                Clear
              </Button>
              <Button onClick={fetchManifests} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manifests List */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Manifests ({stats.totalManifests})</CardTitle>
          <CardDescription>All auto-generated manifest files for platform tracking</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading manifests...</div>
          ) : manifests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No manifests found</div>
          ) : (
            <div className="space-y-4">
              {manifests.map((manifest) => (
                <div key={manifest.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{manifest.trip.company.name}</span>
                        {getDownloadTypeBadge(manifest.downloadType)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Route:</span>
                          <div className="font-medium">{manifest.origin} → {manifest.destination}</div>
                        </div>

                        <div>
                          <span className="text-gray-500">Departure:</span>
                          <div className="font-medium">{formatDate(new Date(manifest.departureTime))}</div>
                        </div>

                        <div>
                          <span className="text-gray-500">Passengers:</span>
                          <div className="font-medium">{manifest.passengerCount} passengers</div>
                        </div>

                        <div>
                          <span className="text-gray-500">Revenue:</span>
                          <div className="font-medium">{formatCurrency(manifest.totalRevenue)}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Generated: {new Date(manifest.downloadedAt).toLocaleString()}
                        </span>
                        <span>{formatFileSize(manifest.fileSize)}</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(manifest.filePath, '_blank')}
                      className="ml-4"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

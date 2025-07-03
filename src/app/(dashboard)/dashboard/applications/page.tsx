"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { 
  Search,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Eye,
  ExternalLink,
  FileText,
  Mail,
  Phone,
  MapPin,
  Euro,
  Home,
  TrendingUp,
  Filter
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

type ApplicationStatus = "sent" | "viewed" | "replied" | "rejected" | "accepted"

interface Application {
  id: string
  listingId: string
  listingTitle: string
  listingAddress: string
  listingPrice: number
  listingImage: string
  listingPlatform: string
  appliedAt: string
  status: ApplicationStatus
  lastUpdate: string
  viewedAt?: string
  landlordName?: string
  landlordResponse?: string
  messagePreview: string
}

const applications: Application[] = [
  {
    id: "1",
    listingId: "listing-1",
    listingTitle: "Beautiful 2-room apartment in Prenzlauer Berg",
    listingAddress: "Stargarder Straße, 10437 Berlin",
    listingPrice: 1200,
    listingImage: "/api/placeholder/200/150",
    listingPlatform: "immoscout24",
    appliedAt: "2024-01-12T10:30:00",
    status: "replied",
    lastUpdate: "2024-01-13T15:20:00",
    viewedAt: "2024-01-12T14:00:00",
    landlordName: "Anna Schmidt",
    landlordResponse: "Thank you for your application. I'd like to invite you for a viewing...",
    messagePreview: "Dear Ms. Schmidt, I am very interested in your beautiful apartment..."
  },
  {
    id: "2",
    listingId: "listing-2",
    listingTitle: "Cozy studio in Friedrichshain",
    listingAddress: "Boxhagener Straße, 10245 Berlin",
    listingPrice: 850,
    listingImage: "/api/placeholder/200/150",
    listingPlatform: "wg_gesucht",
    appliedAt: "2024-01-10T09:00:00",
    status: "viewed",
    lastUpdate: "2024-01-11T11:30:00",
    viewedAt: "2024-01-11T11:30:00",
    messagePreview: "Hello! I saw your listing for the studio apartment and I'm very interested..."
  },
  {
    id: "3",
    listingId: "listing-3",
    listingTitle: "Modern 3-room flat with balcony",
    listingAddress: "Kantstraße, 10623 Berlin",
    listingPrice: 1650,
    listingImage: "/api/placeholder/200/150",
    listingPlatform: "kleinanzeigen",
    appliedAt: "2024-01-08T16:45:00",
    status: "sent",
    lastUpdate: "2024-01-08T16:45:00",
    messagePreview: "Good evening, I would like to apply for your apartment listing..."
  },
  {
    id: "4",
    listingId: "listing-4",
    listingTitle: "Charming altbau with high ceilings",
    listingAddress: "Oranienstraße, 10999 Berlin",
    listingPrice: 1100,
    listingImage: "/api/placeholder/200/150",
    listingPlatform: "immoscout24",
    appliedAt: "2024-01-05T12:00:00",
    status: "rejected",
    lastUpdate: "2024-01-07T10:00:00",
    landlordName: "Michael Weber",
    landlordResponse: "Thank you for your interest, but we have decided to go with another applicant.",
    messagePreview: "Dear Mr. Weber, I am writing to express my strong interest..."
  }
]

const statusConfig = {
  sent: { label: "Sent", icon: Clock, color: "secondary" },
  viewed: { label: "Viewed", icon: Eye, color: "blue" },
  replied: { label: "Replied", icon: MessageSquare, color: "green" },
  rejected: { label: "Rejected", icon: XCircle, color: "destructive" },
  accepted: { label: "Accepted", icon: CheckCircle, color: "green" }
}

export default function ApplicationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all")

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.listingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.listingAddress.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: applications.length,
    sent: applications.filter(a => a.status === "sent").length,
    viewed: applications.filter(a => a.status === "viewed").length,
    replied: applications.filter(a => a.status === "replied").length,
    responseRate: Math.round((applications.filter(a => ["replied", "rejected", "accepted"].includes(a.status)).length / applications.length) * 100)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`
    } else if (diffInHours < 48) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Applications</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage your apartment applications
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
            <p className="text-xs text-muted-foreground">Not yet viewed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Replies Received</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.replied}</div>
            <p className="text-xs text-muted-foreground">Action required</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.responseRate}%</div>
            <p className="text-xs text-muted-foreground">Of applications</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by apartment title or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as ApplicationStatus | "all")}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
                <TabsTrigger value="viewed">Viewed</TabsTrigger>
                <TabsTrigger value="replied">Replied</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.map((application) => {
          const statusInfo = statusConfig[application.status]
          const StatusIcon = statusInfo.icon

          return (
            <Card key={application.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Listing Image */}
                  <div className="relative w-full md:w-48 h-48 md:h-auto">
                    <Image
                      src={application.listingImage}
                      alt={application.listingTitle}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Application Details */}
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">
                          <Link 
                            href={`/dashboard/listings/${application.listingId}`}
                            className="hover:underline"
                          >
                            {application.listingTitle}
                          </Link>
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <MapPin className="mr-1 h-3 w-3" />
                            {application.listingAddress}
                          </span>
                          <span className="flex items-center">
                            <Euro className="mr-1 h-3 w-3" />
                            {application.listingPrice}/month
                          </span>
                        </div>
                      </div>
                      <Badge variant={statusInfo.color as any} className="flex items-center gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </Badge>
                    </div>

                    {/* Message Preview */}
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {application.messagePreview}
                      </p>
                    </div>

                    {/* Timeline and Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          Applied {formatDate(application.appliedAt)}
                        </span>
                        {application.viewedAt && (
                          <span className="flex items-center">
                            <Eye className="mr-1 h-3 w-3" />
                            Viewed {formatDate(application.viewedAt)}
                          </span>
                        )}
                        {application.status === "replied" && (
                          <span className="flex items-center text-green-600">
                            <MessageSquare className="mr-1 h-3 w-3" />
                            Reply received
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/applications/${application.id}`}>
                            View Details
                          </Link>
                        </Button>
                        {application.status === "replied" && (
                          <Button size="sm" asChild>
                            <Link href={`/dashboard/applications/${application.id}?tab=messages&focus=reply`}>
                              <MessageSquare className="mr-2 h-3 w-3" />
                              View Reply
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Landlord Response Preview */}
                    {application.landlordResponse && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {application.landlordName}
                            </Badge>
                            <span className="text-xs text-muted-foreground">replied</span>
                          </div>
                          <Badge variant="default" className="text-xs bg-green-600">
                            New Reply
                          </Badge>
                        </div>
                        <p className="text-sm line-clamp-2">
                          {application.landlordResponse}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredApplications.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No applications found matching your criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
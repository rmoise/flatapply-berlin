"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Eye,
  Send,
  FileText,
  Download,
  Copy,
  Mail,
  Phone,
  MapPin,
  Euro,
  Home,
  ExternalLink,
  AlertCircle,
  Sparkles,
  Building,
  User
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams()
  const [replyMessage, setReplyMessage] = useState("")
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [activeTab, setActiveTab] = useState("messages")

  // Handle URL parameters
  useEffect(() => {
    const tab = searchParams.get("tab")
    const focus = searchParams.get("focus")
    
    if (tab === "messages") {
      setActiveTab("messages")
    }
    
    if (focus === "reply" && application.status === "replied") {
      // Scroll to reply section after a short delay
      setTimeout(() => {
        const replySection = document.getElementById("reply-section")
        if (replySection) {
          replySection.scrollIntoView({ behavior: "smooth", block: "center" })
          setShowReplyForm(true)
        }
      }, 100)
    }
  }, [searchParams])

  // TODO: Get from Supabase
  const application = {
    id: params.id,
    listingId: "listing-1",
    listingTitle: "Beautiful 2-room apartment in Prenzlauer Berg",
    listingAddress: "Stargarder Straße, 10437 Berlin",
    listingPrice: 1200,
    listingWarmRent: 1450,
    listingSize: 65,
    listingRooms: 2,
    listingImage: "/api/placeholder/600/400",
    listingPlatform: "immoscout24",
    listingUrl: "https://www.immoscout24.de/expose/123456789",
    appliedAt: "2024-01-12T10:30:00",
    status: "replied" as const,
    lastUpdate: "2024-01-13T15:20:00",
    viewedAt: "2024-01-12T14:00:00",
    landlord: {
      name: "Anna Schmidt",
      company: "Berlin Property Management GmbH",
      email: "a.schmidt@example.com",
      phone: "+49 30 12345678",
      responseTime: "Usually within 24 hours"
    },
    sentMessage: `Dear Ms. Schmidt,

I am very interested in your beautiful apartment in Prenzlauer Berg. As a software engineer working in Berlin, I have been searching for a quiet and well-located apartment, and yours perfectly matches what I'm looking for.

About me:
- 28 years old, employed full-time at Tech Company GmbH
- Monthly net income: €3,500
- Non-smoker, no pets
- Quiet and responsible tenant

I have all necessary documents ready including:
- Recent SCHUFA (score: 97%)
- Employment contract
- Last 3 payslips
- Previous landlord reference

I would be available for a viewing at your earliest convenience. My current rental contract ends on March 31st, so I could move in as early as April 1st.

Thank you for considering my application. I look forward to hearing from you.

Best regards,
John Doe
+49 176 12345678`,
    documents: [
      { name: "SCHUFA Report", uploadedAt: "2024-01-12T10:30:00" },
      { name: "Employment Contract", uploadedAt: "2024-01-12T10:30:00" },
      { name: "Payslips (Last 3 months)", uploadedAt: "2024-01-12T10:30:00" },
      { name: "ID Document", uploadedAt: "2024-01-12T10:30:00" }
    ],
    landlordReplies: [
      {
        id: "1",
        message: `Dear Mr. Doe,

Thank you for your application and interest in our apartment. I was impressed by your profile and complete documentation.

I would like to invite you for a viewing. We have the following time slots available:
- Tuesday, January 16th at 5:00 PM
- Wednesday, January 17th at 6:30 PM
- Saturday, January 20th at 11:00 AM

Please let me know which time works best for you. The viewing will take approximately 30 minutes.

Looking forward to meeting you.

Best regards,
Anna Schmidt`,
        sentAt: "2024-01-13T15:20:00",
        readAt: "2024-01-13T16:00:00"
      }
    ],
    userReplies: []
  }

  const statusConfig = {
    sent: { label: "Sent", icon: Clock, color: "secondary" },
    viewed: { label: "Viewed", icon: Eye, color: "blue" },
    replied: { label: "Landlord Replied", icon: MessageSquare, color: "green" },
    rejected: { label: "Rejected", icon: XCircle, color: "destructive" },
    accepted: { label: "Accepted", icon: CheckCircle, color: "green" }
  }

  const statusInfo = statusConfig[application.status]
  const StatusIcon = statusInfo.icon

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/applications">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to applications
          </Link>
        </Button>
        <Badge variant={statusInfo.color as any} className="flex items-center gap-1">
          <StatusIcon className="h-3 w-3" />
          {statusInfo.label}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Listing Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Applied Apartment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="relative w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={application.listingImage}
                    alt={application.listingTitle}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">
                    <Link 
                      href={`/dashboard/listings/${application.listingId}`}
                      className="hover:underline"
                    >
                      {application.listingTitle}
                    </Link>
                  </h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center">
                      <MapPin className="mr-1 h-3 w-3" />
                      {application.listingAddress}
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center">
                        <Euro className="mr-1 h-3 w-3" />
                        {application.listingPrice}/month
                      </span>
                      <span className="flex items-center">
                        <Home className="mr-1 h-3 w-3" />
                        {application.listingRooms} rooms, {application.listingSize}m²
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={application.listingUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Conversation Thread */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
              <CardDescription>
                Your messages with the landlord
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="messages">Messages</TabsTrigger>
                  <TabsTrigger value="original">Original Application</TabsTrigger>
                </TabsList>

                <TabsContent value="messages" className="space-y-4 mt-4">
                  {/* Timeline */}
                  <div className="space-y-4">
                    {/* Application Sent */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                          <Send className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div className="w-0.5 h-full bg-border mt-2" />
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">You sent application</p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(application.appliedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Application sent with 4 documents
                        </p>
                      </div>
                    </div>

                    {/* Viewed */}
                    {application.viewedAt && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                            <Eye className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="w-0.5 h-full bg-border mt-2" />
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">Landlord viewed</p>
                            <span className="text-xs text-muted-foreground">
                              {new Date(application.viewedAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Your application was opened
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Landlord Replies */}
                    {application.landlordReplies.map((reply, idx) => (
                      <div key={reply.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>{application.landlord.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          {idx < application.landlordReplies.length - 1 && (
                            <div className="w-0.5 h-full bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium">{application.landlord.name}</p>
                            <span className="text-xs text-muted-foreground">
                              {new Date(reply.sentAt).toLocaleString()}
                            </span>
                          </div>
                          <Card>
                            <CardContent className="p-4">
                              <p className="whitespace-pre-wrap text-sm">{reply.message}</p>
                            </CardContent>
                          </Card>
                          {reply.readAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Read at {new Date(reply.readAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply Form */}
                  {application.status === "replied" && (
                    <div id="reply-section" className="mt-6">
                      {!showReplyForm ? (
                        <Button onClick={() => setShowReplyForm(true)} className="w-full">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Reply to Landlord
                        </Button>
                      ) : (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Your Reply</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <Textarea
                              placeholder="Type your reply to the landlord..."
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              className="min-h-[150px]"
                            />
                            <div className="flex gap-2">
                              <Button variant="outline" onClick={() => setShowReplyForm(false)}>
                                Cancel
                              </Button>
                              <Button variant="outline">
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate Reply
                              </Button>
                              <Button>
                                <Send className="mr-2 h-4 w-4" />
                                Send Reply
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="original" className="mt-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Message Sent</h4>
                        <p className="whitespace-pre-wrap text-sm">{application.sentMessage}</p>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div>
                        <h4 className="font-medium mb-2">Documents Attached</h4>
                        <div className="space-y-2">
                          {application.documents.map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{doc.name}</span>
                              </div>
                              <Button variant="ghost" size="sm">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Copy className="mr-2 h-4 w-4" />
                Copy Application
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Download as PDF
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/dashboard/listings/${application.listingId}`}>
                  <Building className="mr-2 h-4 w-4" />
                  View Listing
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Landlord Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Landlord Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{application.landlord.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{application.landlord.name}</p>
                  <p className="text-sm text-muted-foreground">{application.landlord.company}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Contact via platform only</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{application.landlord.responseTime}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Applied</span>
                  <span>{new Date(application.appliedAt).toLocaleDateString()}</span>
                </div>
                {application.viewedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Viewed</span>
                    <span>{new Date(application.viewedAt).toLocaleDateString()}</span>
                  </div>
                )}
                {application.status === "replied" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reply received</span>
                    <span>{new Date(application.lastUpdate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          {application.status === "replied" && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Tip:</strong> Respond within 24 hours to show your interest. Suggest multiple viewing times to be flexible.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  )
}
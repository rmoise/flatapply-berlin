"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils/cn"
import Link from "next/link"
import { 
  Cloud,
  CheckSquare,
  Info,
  Shield,
  FolderOpen,
  FileText,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Calendar,
  CreditCard,
  Building,
  Briefcase,
  DollarSign,
  ClipboardCheck,
  User,
  Home
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type DocumentType = "schufa" | "id" | "income_proof" | "employment_contract" | "bank_statements" | "landlord_reference" | "selbstauskunft" | "rental_cv"

interface DocumentChecklistItem {
  type: DocumentType
  hasDocument: boolean
  obtainedDate?: string
}

const documentTypes = [
  {
    type: "selbstauskunft" as DocumentType,
    label: "Tenant Self-Disclosure",
    description: "Professional form with your information",
    icon: ClipboardCheck,
    required: true,
    tip: "We'll help you generate this!",
    howToGet: null
  },
  {
    type: "rental_cv" as DocumentType,
    label: "Rental CV",
    description: "Professional CV for apartment applications",
    icon: FileText,
    required: false,
    tip: "Stand out with a professional rental CV",
    howToGet: null
  },
  {
    type: "schufa" as DocumentType,
    label: "SCHUFA Report",
    description: "Credit score (not older than 3 months)",
    icon: CreditCard,
    required: true,
    tip: "Keep score number ready",
    howToGet: {
      url: "https://www.meineschufa.de",
      text: "Order from SCHUFA",
      cost: "Free once per year"
    }
  },
  {
    type: "id" as DocumentType,
    label: "ID Document",
    description: "Passport or German ID card",
    icon: User,
    required: true,
    tip: "Copy both sides",
    howToGet: null
  },
  {
    type: "income_proof" as DocumentType,
    label: "Proof of Income",
    description: "Last 3 payslips",
    icon: DollarSign,
    required: true,
    tip: "Should show net income clearly",
    howToGet: {
      text: "Request from employer/HR",
      cost: "Free"
    }
  },
  {
    type: "employment_contract" as DocumentType,
    label: "Employment Contract",
    description: "Current work contract",
    icon: Briefcase,
    required: false,
    tip: "Shows job stability",
    howToGet: {
      text: "Request copy from HR",
      cost: "Free"
    }
  },
  {
    type: "bank_statements" as DocumentType,
    label: "Bank Statements",
    description: "Last 3 months (optional)",
    icon: Building,
    required: false,
    tip: "Shows financial stability",
    howToGet: {
      text: "Download from online banking",
      cost: "Free"
    }
  },
  {
    type: "landlord_reference" as DocumentType,
    label: "Previous Landlord Reference",
    description: "Confirmation of good tenancy",
    icon: Home,
    required: false,
    tip: "Very helpful if available",
    howToGet: {
      text: "Request from current landlord",
      cost: "Free"
    }
  }
]

export function DocumentManagerFinal() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [folderUrl, setFolderUrl] = useState("")
  const [hasLinkedFolder, setHasLinkedFolder] = useState(false)
  
  // Checklist state (for manual tracking)
  const [checklist, setChecklist] = useState<Record<DocumentType, DocumentChecklistItem>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("document-checklist")
      if (saved) {
        return JSON.parse(saved)
      }
    }
    
    const initial: Record<DocumentType, DocumentChecklistItem> = {} as any
    documentTypes.forEach(doc => {
      initial[doc.type] = {
        type: doc.type,
        hasDocument: false
      }
    })
    return initial
  })

  // Save checklist to localStorage
  useEffect(() => {
    localStorage.setItem("document-checklist", JSON.stringify(checklist))
  }, [checklist])

  const toggleDocument = (type: DocumentType) => {
    setChecklist(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        hasDocument: !prev[type].hasDocument,
        obtainedDate: !prev[type].hasDocument ? new Date().toISOString().split('T')[0] : undefined
      }
    }))
  }

  const handleLinkFolder = () => {
    if (!folderUrl.includes('drive.google.com')) {
      toast({
        title: "Invalid URL",
        description: "Please provide a valid Google Drive link",
        variant: "destructive"
      })
      return
    }

    setHasLinkedFolder(true)
    toast({
      title: "Folder linked successfully!",
      description: "Your document folder has been connected"
    })
  }

  const requiredDocs = documentTypes.filter(d => d.required)
  const completedRequiredDocs = requiredDocs.filter(d => checklist[d.type]?.hasDocument || hasLinkedFolder)
  const completionPercentage = Math.round((completedRequiredDocs.length / requiredDocs.length) * 100)

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cloud">
            <Cloud className="mr-2 h-4 w-4" />
            Cloud Storage
          </TabsTrigger>
          <TabsTrigger value="manual">
            <CheckSquare className="mr-2 h-4 w-4" />
            Manual Checklist
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle>Document Readiness</CardTitle>
              <CardDescription>
                Your progress toward having all required documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Required Documents</span>
                  <span className="font-medium">{completedRequiredDocs.length}/{requiredDocs.length}</span>
                </div>
                <Progress value={completionPercentage} />
                <p className="text-xs text-muted-foreground mt-2">
                  {completionPercentage === 100 
                    ? "🎉 All required documents ready!" 
                    : `${requiredDocs.length - completedRequiredDocs.length} required document${requiredDocs.length - completedRequiredDocs.length > 1 ? 's' : ''} missing`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Generate Documents Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Generate Documents</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Selbstauskunft Card */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950">
                        <ClipboardCheck className="h-5 w-5 text-purple-700 dark:text-purple-300" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Tenant Self-Disclosure</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          Professional Selbstauskunft form
                        </CardDescription>
                      </div>
                    </div>
                    <Badge>Required</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" asChild>
                    <Link href="/dashboard/documents/selbstauskunft">
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Form
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Rental CV Card */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
                        <FileText className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Rental CV</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          Stand out from other applicants
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary">Optional</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href="/dashboard/documents/rental-cv">
                      <FileText className="mr-2 h-4 w-4" />
                      Create CV
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Storage Options */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Document Storage</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Card 
                className={cn(
                  "cursor-pointer hover:shadow-md transition-all",
                  hasLinkedFolder && "border-green-500 bg-green-50/20"
                )}
                onClick={() => setActiveTab("cloud")}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Cloud className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">Cloud Storage</CardTitle>
                      <CardDescription className="text-xs">
                        Link your Google Drive folder
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                {hasLinkedFolder && (
                  <CardContent>
                    <Badge variant="default" className="w-full justify-center">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Folder Linked
                    </Badge>
                  </CardContent>
                )}
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setActiveTab("manual")}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <CheckSquare className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">Manual Checklist</CardTitle>
                      <CardDescription className="text-xs">
                        Track documents yourself
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Cloud Storage Tab */}
        <TabsContent value="cloud" className="space-y-6 mt-6">
          <Alert className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
            <Shield className="h-4 w-4 text-green-600" />
            <AlertTitle>Secure & Private</AlertTitle>
            <AlertDescription>
              Your documents stay in your Google Drive. We only store the share link.
            </AlertDescription>
          </Alert>

          {/* Quick Setup Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Setup Guide</CardTitle>
              <CardDescription>
                Link your document folder in 3 easy steps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Create a folder in Google Drive</p>
                    <p className="text-sm text-muted-foreground">
                      Name it "Rental Documents - [Your Name]"
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Upload your documents</p>
                    <p className="text-sm text-muted-foreground">
                      SCHUFA, ID, income proof, etc.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Share and link here</p>
                    <p className="text-sm text-muted-foreground">
                      Set to "Anyone with link can view"
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Label htmlFor="folder-url">Google Drive Folder Link</Label>
                <div className="flex gap-2">
                  <Input
                    id="folder-url"
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={folderUrl}
                    onChange={(e) => setFolderUrl(e.target.value)}
                  />
                  <Button onClick={handleLinkFolder}>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Link
                  </Button>
                </div>
              </div>

              {hasLinkedFolder && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    Your document folder is linked! When you apply to apartments, 
                    this link will be included automatically.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Button variant="outline" asChild>
            <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer">
              Open Google Drive
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
        </TabsContent>

        {/* Manual Checklist Tab */}
        <TabsContent value="manual" className="space-y-6 mt-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Track which documents you have ready. When applying, you'll manually 
              attach them to each email.
            </AlertDescription>
          </Alert>

          {/* Document Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documentTypes.map((docType) => {
              const checklistItem = checklist[docType.type]
              const isChecked = checklistItem?.hasDocument || false
              
              return (
                <Card key={docType.type} className={cn(
                  "transition-all",
                  isChecked && "border-green-200 bg-green-50/20"
                )}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg transition-colors",
                          isChecked ? "bg-green-100" : "bg-muted"
                        )}>
                          <docType.icon className={cn(
                            "h-5 w-5",
                            isChecked ? "text-green-700" : "text-muted-foreground"
                          )} />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base">{docType.label}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {docType.description}
                          </CardDescription>
                        </div>
                      </div>
                      {docType.required && (
                        <Badge variant={isChecked ? "default" : "secondary"} className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Checkbox */}
                    <div className="flex items-center space-x-3">
                      <Switch
                        id={`doc-${docType.type}`}
                        checked={isChecked}
                        onCheckedChange={() => toggleDocument(docType.type)}
                      />
                      <Label 
                        htmlFor={`doc-${docType.type}`}
                        className="text-sm font-medium cursor-pointer flex-1"
                      >
                        I have this ready
                      </Label>
                    </div>

                    {/* Tips */}
                    {docType.tip && (
                      <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                        <Info className="h-3 w-3 text-blue-600 mt-0.5" />
                        <p className="text-xs text-blue-900 dark:text-blue-100">{docType.tip}</p>
                      </div>
                    )}

                    {/* How to Get */}
                    {!isChecked && docType.howToGet && (
                      <div className="border-t pt-3">
                        <p className="text-xs font-medium mb-1">How to get:</p>
                        <div className="space-y-1">
                          {docType.howToGet.url ? (
                            <a 
                              href={docType.howToGet.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              {docType.howToGet.text}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <p className="text-xs text-muted-foreground">{docType.howToGet.text}</p>
                          )}
                          {docType.howToGet.cost && (
                            <p className="text-xs text-muted-foreground">Cost: {docType.howToGet.cost}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Special case buttons */}
                    {docType.type === "selbstauskunft" && !isChecked && (
                      <Button className="w-full" size="sm" asChild>
                        <Link href="/dashboard/documents/selbstauskunft">
                          <FileText className="mr-2 h-4 w-4" />
                          Generate
                        </Link>
                      </Button>
                    )}

                    {docType.type === "rental_cv" && !isChecked && (
                      <Button className="w-full" size="sm" asChild>
                        <Link href="/dashboard/documents/rental-cv">
                          <FileText className="mr-2 h-4 w-4" />
                          Generate
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Privacy Notice */}
      <Alert className="border-blue-200 bg-blue-50/50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <strong>Your privacy is protected:</strong> We never ask you to upload sensitive 
          documents. Use cloud links or track manually - your documents stay under your control.
        </AlertDescription>
      </Alert>
    </div>
  )
}
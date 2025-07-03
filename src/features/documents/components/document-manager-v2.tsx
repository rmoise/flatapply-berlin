"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  Home,
  Sparkles
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type DocumentType = "schufa" | "id" | "income_proof" | "employment_contract" | "bank_statements" | "landlord_reference" | "selbstauskunft" | "rental_cv"
type StorageMethod = "google_drive" | "manual" | "none"

interface Document {
  type: DocumentType
  status: "not_started" | "ready" | "generated"
  storageMethod: StorageMethod
  googleDriveUrl?: string
  generatedAt?: string
  obtainedAt?: string
}

const documentInfo = [
  {
    type: "selbstauskunft" as DocumentType,
    label: "Tenant Self-Disclosure (Selbstauskunft)",
    description: "Professional form with your personal and financial information",
    icon: ClipboardCheck,
    required: true,
    canGenerate: true,
    tip: "Most landlords require this standardized form"
  },
  {
    type: "rental_cv" as DocumentType,
    label: "Rental CV",
    description: "Professional CV optimized for apartment applications",
    icon: FileText,
    required: false,
    canGenerate: true,
    tip: "Stand out from other applicants with a professional presentation"
  },
  {
    type: "schufa" as DocumentType,
    label: "SCHUFA Credit Report",
    description: "German credit score (not older than 3 months)",
    icon: CreditCard,
    required: true,
    canGenerate: false,
    howToGet: {
      url: "https://www.meineschufa.de",
      text: "Order from SCHUFA",
      cost: "Free once per year"
    }
  },
  {
    type: "id" as DocumentType,
    label: "ID Document",
    description: "Passport or German ID card copy",
    icon: User,
    required: true,
    canGenerate: false,
    tip: "Make sure to copy both sides"
  },
  {
    type: "income_proof" as DocumentType,
    label: "Proof of Income",
    description: "Last 3 payslips or income statement",
    icon: DollarSign,
    required: true,
    canGenerate: false,
    howToGet: {
      text: "Request from employer/HR",
      cost: "Free"
    }
  },
  {
    type: "employment_contract" as DocumentType,
    label: "Employment Contract",
    description: "Current work contract showing job stability",
    icon: Briefcase,
    required: false,
    canGenerate: false,
    howToGet: {
      text: "Request copy from HR",
      cost: "Free"
    }
  },
  {
    type: "bank_statements" as DocumentType,
    label: "Bank Statements",
    description: "Last 3 months (sometimes requested)",
    icon: Building,
    required: false,
    canGenerate: false,
    howToGet: {
      text: "Download from online banking",
      cost: "Free"
    }
  },
  {
    type: "landlord_reference" as DocumentType,
    label: "Previous Landlord Reference",
    description: "Letter confirming good tenancy",
    icon: Home,
    required: false,
    canGenerate: false,
    howToGet: {
      text: "Request from current landlord",
      cost: "Free"
    }
  }
]

export function DocumentManagerV2() {
  const { toast } = useToast()
  const [folderUrl, setFolderUrl] = useState("")
  const [documents, setDocuments] = useState<Record<DocumentType, Document>>(() => {
    const initial: Record<DocumentType, Document> = {} as any
    documentInfo.forEach(doc => {
      initial[doc.type] = {
        type: doc.type,
        status: "not_started",
        storageMethod: "none"
      }
    })
    return initial
  })

  const handleGoogleDriveLink = () => {
    if (!folderUrl.includes('drive.google.com')) {
      toast({
        title: "Invalid URL",
        description: "Please provide a valid Google Drive link",
        variant: "destructive"
      })
      return
    }

    // Update all non-generated documents to use Google Drive
    const updated = { ...documents }
    Object.keys(updated).forEach(key => {
      const docType = key as DocumentType
      if (updated[docType].status !== "generated") {
        updated[docType] = {
          ...updated[docType],
          storageMethod: "google_drive",
          googleDriveUrl: folderUrl,
          status: "ready"
        }
      }
    })
    
    setDocuments(updated)
    toast({
      title: "Google Drive linked!",
      description: "Your documents folder has been connected"
    })
  }

  const toggleManualDocument = (type: DocumentType) => {
    setDocuments(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        status: prev[type].status === "ready" ? "not_started" : "ready",
        storageMethod: prev[type].status === "ready" ? "none" : "manual",
        obtainedAt: prev[type].status === "ready" ? undefined : new Date().toISOString()
      }
    }))
  }

  const markAsGenerated = (type: DocumentType) => {
    setDocuments(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        status: "generated",
        storageMethod: "manual",
        generatedAt: new Date().toISOString()
      }
    }))
  }

  const requiredDocs = documentInfo.filter(d => d.required)
  const readyDocs = requiredDocs.filter(d => documents[d.type].status !== "not_started")
  const completionPercentage = Math.round((readyDocs.length / requiredDocs.length) * 100)
  const hasGoogleDrive = Object.values(documents).some(d => d.storageMethod === "google_drive")

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Document Readiness</CardTitle>
          <CardDescription>
            Track your application documents in one place
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Required Documents</span>
                <span className="font-medium">{readyDocs.length}/{requiredDocs.length}</span>
              </div>
              <Progress value={completionPercentage} />
              <p className="text-xs text-muted-foreground mt-2">
                {completionPercentage === 100 
                  ? "🎉 All required documents ready!" 
                  : `${requiredDocs.length - readyDocs.length} required document${requiredDocs.length - readyDocs.length > 1 ? 's' : ''} missing`}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <div className="text-2xl font-bold">{Object.values(documents).filter(d => d.status === "generated").length}</div>
                <p className="text-xs text-muted-foreground">Generated</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Object.values(documents).filter(d => d.storageMethod === "google_drive").length}</div>
                <p className="text-xs text-muted-foreground">In Cloud</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Object.values(documents).filter(d => d.storageMethod === "manual").length}</div>
                <p className="text-xs text-muted-foreground">Manual</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Drive Option */}
      {!hasGoogleDrive && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Quick Setup: Link Google Drive Folder
            </CardTitle>
            <CardDescription>
              Have all your documents in one folder? Link it for easy access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://drive.google.com/drive/folders/..."
                value={folderUrl}
                onChange={(e) => setFolderUrl(e.target.value)}
              />
              <Button onClick={handleGoogleDriveLink}>
                <LinkIcon className="mr-2 h-4 w-4" />
                Link Folder
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              This will mark all non-generated documents as ready. You can still generate 
              Selbstauskunft and Rental CV separately.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Document List */}
      <div className="space-y-4">
        {documentInfo.map((docInfo) => {
          const doc = documents[docInfo.type]
          const isReady = doc.status !== "not_started"
          
          return (
            <Card 
              key={docInfo.type} 
              className={cn(
                "transition-all",
                isReady && "border-green-200 bg-green-50/20 dark:border-green-900 dark:bg-green-950/10"
              )}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      isReady ? "bg-green-100 dark:bg-green-950" : "bg-muted"
                    )}>
                      <docInfo.icon className={cn(
                        "h-5 w-5",
                        isReady ? "text-green-700 dark:text-green-300" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{docInfo.label}</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {docInfo.description}
                      </CardDescription>
                      
                      {/* Status Badges */}
                      <div className="flex items-center gap-2 mt-2">
                        {docInfo.required && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                        {doc.status === "generated" && (
                          <Badge variant="default" className="text-xs bg-purple-600">
                            <Sparkles className="mr-1 h-3 w-3" />
                            Generated
                          </Badge>
                        )}
                        {doc.storageMethod === "google_drive" && (
                          <Badge variant="default" className="text-xs bg-blue-600">
                            <Cloud className="mr-1 h-3 w-3" />
                            In Cloud
                          </Badge>
                        )}
                        {doc.status === "ready" && doc.storageMethod === "manual" && (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Ready
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Actions based on document type and status */}
                <div className="flex flex-wrap gap-2">
                  {/* Generate Button (for Selbstauskunft and Rental CV) */}
                  {docInfo.canGenerate && doc.status !== "generated" && (
                    <Button size="sm" asChild>
                      <Link 
                        href={`/dashboard/documents/${docInfo.type === "selbstauskunft" ? "selbstauskunft" : "rental-cv"}`}
                        onClick={() => {
                          // In a real app, this would be handled after generation
                          setTimeout(() => markAsGenerated(docInfo.type), 100)
                        }}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate
                      </Link>
                    </Button>
                  )}

                  {/* Manual Check (for non-generated documents) */}
                  {!docInfo.canGenerate && doc.storageMethod !== "google_drive" && (
                    <div className="flex items-center space-x-3">
                      <Switch
                        id={`doc-${docInfo.type}`}
                        checked={doc.status === "ready"}
                        onCheckedChange={() => toggleManualDocument(docInfo.type)}
                      />
                      <Label 
                        htmlFor={`doc-${docInfo.type}`}
                        className="text-sm cursor-pointer"
                      >
                        I have this document ready
                      </Label>
                    </div>
                  )}

                  {/* View Generated */}
                  {doc.status === "generated" && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/dashboard/documents/${docInfo.type === "selbstauskunft" ? "selbstauskunft" : "rental-cv"}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        View/Edit
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Tips and How to Get */}
                {!isReady && (
                  <>
                    {docInfo.tip && (
                      <Alert className="py-2">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {docInfo.tip}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {docInfo.howToGet && (
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-1">How to get:</p>
                        {docInfo.howToGet.url ? (
                          <a 
                            href={docInfo.howToGet.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {docInfo.howToGet.text}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <p>{docInfo.howToGet.text}</p>
                        )}
                        {docInfo.howToGet.cost && (
                          <p className="text-xs mt-1">Cost: {docInfo.howToGet.cost}</p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Timestamp */}
                {doc.generatedAt && (
                  <p className="text-xs text-muted-foreground">
                    Generated on {new Date(doc.generatedAt).toLocaleDateString()}
                  </p>
                )}
                {doc.obtainedAt && doc.storageMethod === "manual" && (
                  <p className="text-xs text-muted-foreground">
                    Marked ready on {new Date(doc.obtainedAt).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Privacy Notice */}
      <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <strong>Your privacy is protected:</strong> We only generate documents locally and store 
          Google Drive links. Your sensitive documents never touch our servers.
        </AlertDescription>
      </Alert>
    </div>
  )
}
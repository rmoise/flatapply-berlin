"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils/cn"
import Link from "next/link"
import { 
  FileText,
  CheckCircle,
  AlertCircle,
  Calendar,
  CreditCard,
  Building,
  Briefcase,
  DollarSign,
  Info,
  ExternalLink,
  ClipboardCheck,
  User,
  Home,
  Download,
  Copy
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type DocumentType = "schufa" | "id" | "income_proof" | "employment_contract" | "bank_statements" | "landlord_reference" | "selbstauskunft" | "rental_cv"

interface DocumentChecklistItem {
  type: DocumentType
  hasDocument: boolean
  obtainedDate?: string
  expiryDate?: string
  notes?: string
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

export function DocumentChecklist() {
  const { toast } = useToast()
  const [checklist, setChecklist] = useState<Record<DocumentType, DocumentChecklistItem>>(() => {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("document-checklist")
      if (saved) {
        return JSON.parse(saved)
      }
    }
    
    // Default state
    return {
      selbstauskunft: { type: "selbstauskunft", hasDocument: false },
      rental_cv: { type: "rental_cv", hasDocument: false },
      schufa: { type: "schufa", hasDocument: false },
      id: { type: "id", hasDocument: false },
      income_proof: { type: "income_proof", hasDocument: false },
      employment_contract: { type: "employment_contract", hasDocument: false },
      bank_statements: { type: "bank_statements", hasDocument: false },
      landlord_reference: { type: "landlord_reference", hasDocument: false }
    }
  })

  // Save to localStorage whenever checklist changes
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

  const copyChecklist = () => {
    const checklistText = documentTypes
      .filter(d => d.required)
      .map(d => `${checklist[d.type].hasDocument ? '✓' : '☐'} ${d.label}`)
      .join('\n')
    
    navigator.clipboard.writeText(`Required Documents:\n${checklistText}`)
    toast({
      title: "Copied!",
      description: "Document checklist copied to clipboard"
    })
  }

  const requiredDocs = documentTypes.filter(d => d.required)
  const completedRequiredDocs = requiredDocs.filter(d => checklist[d.type]?.hasDocument)
  const completionPercentage = Math.round((completedRequiredDocs.length / requiredDocs.length) * 100)

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle>Document Readiness</CardTitle>
          <CardDescription>
            Track which documents you have ready for applications
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
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-4"
            onClick={copyChecklist}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Checklist
          </Button>
        </CardContent>
      </Card>

      {/* Document Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {documentTypes.map((docType) => {
          const checklistItem = checklist[docType.type]
          const isChecked = checklistItem?.hasDocument || false
          
          return (
            <Card key={docType.type} className={cn(
              "transition-all",
              isChecked && "border-green-200 bg-green-50/20 dark:border-green-900 dark:bg-green-950/10"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      isChecked ? "bg-green-100 dark:bg-green-950" : "bg-muted"
                    )}>
                      <docType.icon className={cn(
                        "h-4 w-4",
                        isChecked ? "text-green-700 dark:text-green-300" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-sm">{docType.label}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
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
              <CardContent className="space-y-3">
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

                {/* Obtained Date */}
                {isChecked && checklistItem.obtainedDate && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Marked ready on {new Date(checklistItem.obtainedDate).toLocaleDateString()}</span>
                  </div>
                )}

                {/* Tips */}
                {docType.tip && !isChecked && (
                  <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                    <Info className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-900 dark:text-blue-100">{docType.tip}</p>
                  </div>
                )}

                {/* How to Get */}
                {!isChecked && docType.howToGet && (
                  <div className="space-y-1 text-xs">
                    {docType.howToGet.url ? (
                      <a 
                        href={docType.howToGet.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {docType.howToGet.text}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <p className="text-muted-foreground">{docType.howToGet.text}</p>
                    )}
                    {docType.howToGet.cost && (
                      <p className="text-muted-foreground">Cost: {docType.howToGet.cost}</p>
                    )}
                  </div>
                )}

                {/* Special Actions */}
                {docType.type === "selbstauskunft" && !isChecked && (
                  <Button className="w-full" size="sm" variant="outline" asChild>
                    <Link href="/dashboard/documents/selbstauskunft">
                      Generate Form
                    </Link>
                  </Button>
                )}

                {docType.type === "rental_cv" && !isChecked && (
                  <Button className="w-full" size="sm" variant="outline" asChild>
                    <Link href="/dashboard/documents/rental-cv">
                      Create CV
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Application Tips */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Application tip:</strong> When you apply to apartments, have all your documents 
          ready in a folder on your computer. You'll copy the generated message and attach 
          documents manually to each email.
        </AlertDescription>
      </Alert>
    </div>
  )
}
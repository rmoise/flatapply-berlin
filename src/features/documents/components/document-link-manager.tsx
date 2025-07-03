"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  FolderOpen, 
  Link, 
  Copy, 
  ExternalLink, 
  CheckCircle,
  AlertCircle,
  FileText,
  Shield,
  Info
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DocumentLink {
  id: string
  document_type: string
  file_name: string
  document_url: string
  link_type: 'google_drive' | 'dropbox' | 'other'
  is_public: boolean
}

export function DocumentLinkManager() {
  const { toast } = useToast()
  const [folderUrl, setFolderUrl] = useState("")
  const [isPublic, setIsPublic] = useState(false)

  const documentTypes = [
    { type: 'schufa', label: 'SCHUFA Report', required: true },
    { type: 'id', label: 'ID/Passport', required: true },
    { type: 'income_proof', label: 'Income Proof', required: true },
    { type: 'employment_contract', label: 'Employment Contract', required: false },
    { type: 'bank_statements', label: 'Bank Statements', required: false },
  ]

  const handleSaveFolder = () => {
    // Validate Google Drive URL
    if (!folderUrl.includes('drive.google.com')) {
      toast({
        title: "Invalid URL",
        description: "Please provide a valid Google Drive link",
        variant: "destructive"
      })
      return
    }

    // Save folder URL
    toast({
      title: "Folder saved!",
      description: "Your document folder has been linked successfully"
    })
  }

  const copyInstructions = () => {
    const instructions = `Please ensure your Google Drive folder contains:
- SCHUFA Report
- ID/Passport copy
- Proof of income (last 3 payslips)
- Employment contract (if available)
- Bank statements (if requested)

Make sure the sharing link allows "Anyone with the link can view"`

    navigator.clipboard.writeText(instructions)
    toast({
      title: "Copied!",
      description: "Document checklist copied to clipboard"
    })
  }

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <strong>Your documents stay secure in your Google Drive.</strong> We only store the share link, 
          not the documents themselves. You can revoke access anytime.
        </AlertDescription>
      </Alert>

      {/* Quick Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Setup Guide</CardTitle>
          <CardDescription>
            Create a rental documents folder in 3 easy steps
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
                  Name it something like "Rental Documents - [Your Name]"
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium">Upload your documents</p>
                <div className="mt-2 space-y-1">
                  {documentTypes.map(doc => (
                    <div key={doc.type} className="flex items-center gap-2 text-sm">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span>{doc.label}</span>
                      {doc.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium">Share the folder</p>
                <p className="text-sm text-muted-foreground">
                  Right-click → Share → Anyone with the link → Viewer
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyInstructions}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Checklist
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer">
                Open Google Drive
                <ExternalLink className="ml-2 h-3 w-3" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Link Your Folder */}
      <Card>
        <CardHeader>
          <CardTitle>Link Your Document Folder</CardTitle>
          <CardDescription>
            Paste your Google Drive folder link here
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-url">Google Drive Folder Link</Label>
            <div className="flex gap-2">
              <Input
                id="folder-url"
                type="url"
                placeholder="https://drive.google.com/drive/folders/..."
                value={folderUrl}
                onChange={(e) => setFolderUrl(e.target.value)}
              />
              <Button onClick={handleSaveFolder}>
                <Link className="mr-2 h-4 w-4" />
                Link Folder
              </Button>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Tip:</strong> Create one folder with all your rental documents. 
              You can share the same link with multiple landlords.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Linked Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Your Linked Documents</CardTitle>
          <CardDescription>
            Documents ready to share with landlords
          </CardDescription>
        </CardHeader>
        <CardContent>
          {folderUrl ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Rental Documents Folder</p>
                    <p className="text-sm text-muted-foreground">Contains all required documents</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Linked
                  </Badge>
                  <Button size="sm" variant="outline" asChild>
                    <a href={folderUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  Your documents are ready! When you apply to apartments, this folder link 
                  will be included automatically.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="mx-auto h-12 w-12 mb-3" />
              <p>No documents linked yet</p>
              <p className="text-sm">Follow the guide above to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Cloud,
  CheckSquare,
  Info,
  Shield,
  FolderOpen,
  FileText
} from "lucide-react"
import { DocumentLinkManager } from "./document-link-manager"
import { DocumentChecklist } from "./document-checklist"

export function DocumentManager() {
  const [preferredMethod, setPreferredMethod] = useState<"cloud" | "manual">("cloud")

  return (
    <div className="space-y-6">
      {/* Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle>How do you want to manage your documents?</CardTitle>
          <CardDescription>
            Choose the method that works best for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={preferredMethod} onValueChange={(v) => setPreferredMethod(v as "cloud" | "manual")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cloud" className="gap-2">
                <Cloud className="h-4 w-4" />
                Cloud Storage (Recommended)
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-2">
                <CheckSquare className="h-4 w-4" />
                Manual Checklist
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cloud" className="space-y-6 mt-6">
              {/* Cloud Benefits */}
              <Alert className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
                <Shield className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Benefits of using cloud storage:
                    </p>
                    <ul className="text-sm space-y-1 text-green-800 dark:text-green-200">
                      <li>• One folder for all applications</li>
                      <li>• Update documents without re-uploading</li>
                      <li>• Your documents stay in your control</li>
                      <li>• Instant sharing with landlords</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              <DocumentLinkManager />
            </TabsContent>

            <TabsContent value="manual" className="space-y-6 mt-6">
              {/* Manual Method Info */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Using manual document management</p>
                    <p className="text-sm">
                      Track which documents you have ready. When applying to apartments, 
                      you'll manually attach documents to each application email.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              <DocumentChecklist />

              {/* How It Works */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How manual applications work</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Check off documents as you collect them</p>
                      <p className="text-sm text-muted-foreground">
                        Use the checklist above to track your progress
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-medium">FlatApply generates your application message</p>
                      <p className="text-sm text-muted-foreground">
                        We'll create a professional message in German
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-medium">You send the email with attachments</p>
                      <p className="text-sm text-muted-foreground">
                        Copy the message and manually attach your documents
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <strong>Your privacy matters:</strong> We never ask you to upload sensitive documents 
          to our servers. Whether you use cloud storage links or manual management, your documents 
          stay under your control.
        </AlertDescription>
      </Alert>
    </div>
  )
}
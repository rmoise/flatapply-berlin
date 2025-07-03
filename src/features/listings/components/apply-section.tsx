"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { 
  CheckCircle,
  Send,
  FileText,
  Sparkles
} from "lucide-react"
import Link from "next/link"

interface ApplySectionProps {
  listingId: string
  listingDetails?: {
    title: string
    district: string
    price: number
    warmRent: number
    propertyType?: string
    rooms?: number
  }
}

export function ApplySection({ listingId, listingDetails }: ApplySectionProps) {
  const router = useRouter()
  const [applicationMessage, setApplicationMessage] = useState("")
  const [includeCV, setIncludeCV] = useState(false)
  const [hasRentalCV, setHasRentalCV] = useState(false)
  const [hasTailoredCV, setHasTailoredCV] = useState(false)
  const [userHasApplied, setUserHasApplied] = useState(false)

  // Check if user has rental CV ready
  useEffect(() => {
    // TODO: Check from localStorage/Supabase if user has CV
    const checkCV = localStorage.getItem("hasRentalCV")
    setHasRentalCV(checkCV === "true")
    
    // Check if CV has been tailored for this specific listing
    const tailoredListings = JSON.parse(localStorage.getItem("tailoredCVListings") || "[]")
    setHasTailoredCV(tailoredListings.includes(listingId))
    
    // TODO: Check if user has already applied to this listing
    const applications = JSON.parse(localStorage.getItem("applications") || "[]")
    setUserHasApplied(applications.includes(listingId))
  }, [listingId])

  const handleSendApplication = () => {
    // TODO: Send application to Supabase
    console.log("Sending application:", {
      listingId,
      message: applicationMessage,
      includeCV
    })
    
    // Mark as applied
    const applications = JSON.parse(localStorage.getItem("applications") || "[]")
    applications.push(listingId)
    localStorage.setItem("applications", JSON.stringify(applications))
    setUserHasApplied(true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply for this apartment</CardTitle>
        <CardDescription>
          {userHasApplied 
            ? "You've already applied"
            : "Send your application to the landlord"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!userHasApplied ? (
          <>
            <Textarea
              placeholder="Write a personal message to the landlord..."
              className="min-h-[120px]"
              value={applicationMessage}
              onChange={(e) => setApplicationMessage(e.target.value)}
            />
            

            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Message
              </Button>
              {hasRentalCV && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    // Store listing details in sessionStorage before navigation
                    if (listingDetails) {
                      const contextData = {
                        listingId: listingId,
                        ...listingDetails
                      }
                      sessionStorage.setItem(`listing-context-${listingId}`, JSON.stringify(contextData))
                    }
                    router.push(`/dashboard/documents/rental-cv?listing=${listingId}&update=true`)
                  }}
                >
                  {hasTailoredCV ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                      Edit CV for This Listing
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Tailor CV for This Listing
                    </>
                  )}
                </Button>
              )}
            </div>
            <Button 
              className="w-full" 
              onClick={handleSendApplication}
              disabled={!applicationMessage.trim()}
            >
              <Send className="mr-2 h-4 w-4" />
              Send Application
            </Button>
          </>
        ) : (
          <div className="text-center py-4">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
            <p className="font-medium">Application sent!</p>
            <p className="text-sm text-muted-foreground">
              Applied on {new Date().toLocaleDateString()}
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/dashboard/applications">
                View Application
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
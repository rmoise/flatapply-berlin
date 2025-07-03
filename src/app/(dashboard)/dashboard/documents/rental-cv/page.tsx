"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  ArrowLeft,
  Download,
  FileText,
  Eye,
  Sparkles,
  CheckCircle,
  Info,
  User,
  Briefcase,
  Home,
  Heart,
  Languages,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Euro,
  Edit3,
  Save,
  X
} from "lucide-react"
import Link from "next/link"
import { useListingContext } from "@/features/documents/hooks/use-listing-context"

export default function RentalCVPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { listingContext, isFromListing, getSuggestedContent } = useListingContext()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCV, setGeneratedCV] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<"professional" | "modern" | "minimal">("professional")
  const [isEditing, setIsEditing] = useState(false)
  const [editableCV, setEditableCV] = useState({
    introduction: "",
    employment: "",
    rental: "",
    languages: "",
    personalNote: ""
  })
  
  const isUpdate = searchParams.get('update') === 'true'

  // Store listing context for future use
  useEffect(() => {
    if (listingContext && listingContext.listingId) {
      sessionStorage.setItem(
        `listing-context-${listingContext.listingId}`,
        JSON.stringify(listingContext)
      )
    }
  }, [listingContext])

  // TODO: Get from profile
  const profileData = {
    fullName: "John Doe",
    email: "john@example.com",
    phone: "+49 176 12345678",
    currentAddress: "Musterstraße 123, 10115 Berlin",
    birthDate: "1995-01-15",
    nationality: "German",
    jobTitle: "Software Engineer",
    employer: "Tech Company GmbH",
    monthlyIncome: 3500,
    employmentSince: "2022-03-01",
    languages: ["German (C1)", "English (Native)"],
    hobbies: ["Reading", "Hiking", "Cooking"],
    hasPets: false,
    isSmoker: false,
    moveInDate: "2024-03-01",
    preferredDistricts: ["Prenzlauer Berg", "Friedrichshain", "Kreuzberg"],
    maxRent: 1500
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    // TODO: Call AI service to generate CV
    // Include listing-specific content if available
    const suggestions = getSuggestedContent()
    setTimeout(() => {
      let cvContent = "Generated CV content here..."
      if (suggestions && isFromListing) {
        cvContent += "\n\nListing-specific content added based on: " + listingContext?.district
      }
      setGeneratedCV(cvContent)
      localStorage.setItem("hasRentalCV", "true")
      
      // Mark this listing as having a tailored CV if coming from a listing
      if (listingContext?.listingId) {
        const tailoredListings = JSON.parse(localStorage.getItem("tailoredCVListings") || "[]")
        if (!tailoredListings.includes(listingContext.listingId)) {
          tailoredListings.push(listingContext.listingId)
          localStorage.setItem("tailoredCVListings", JSON.stringify(tailoredListings))
        }
      }
      
      // Initialize editable CV content
      setEditableCV({
        introduction: suggestions?.introduction || "I am a reliable and responsible tenant looking for a new home in Berlin...",
        employment: `I work as a ${profileData.jobTitle} at ${profileData.employer} since ${new Date(profileData.employmentSince).toLocaleDateString()}. My net monthly income is €${profileData.monthlyIncome}.`,
        rental: `I am looking to move in by ${new Date(profileData.moveInDate).toLocaleDateString()} with a maximum rent budget of €${profileData.maxRent}/month.`,
        languages: `Languages: ${profileData.languages.join(", ")}`,
        personalNote: suggestions?.districtInterests || "I maintain a clean and quiet lifestyle, and I'm committed to being a respectful neighbor."
      })
      
      setIsGenerating(false)
    }, 2000)
  }

  const handleSaveEdits = () => {
    // Update the generated CV with edited content
    const updatedCV = `Updated CV with custom content:\n\nIntroduction: ${editableCV.introduction}\n\nEmployment: ${editableCV.employment}\n\nRental Info: ${editableCV.rental}\n\n${editableCV.languages}\n\nPersonal Note: ${editableCV.personalNote}`
    setGeneratedCV(updatedCV)
    
    // Mark this listing as having a tailored CV if coming from a listing
    if (listingContext?.listingId) {
      const tailoredListings = JSON.parse(localStorage.getItem("tailoredCVListings") || "[]")
      if (!tailoredListings.includes(listingContext.listingId)) {
        tailoredListings.push(listingContext.listingId)
        localStorage.setItem("tailoredCVListings", JSON.stringify(tailoredListings))
      }
    }
    
    setIsEditing(false)
  }

  const handleDownload = () => {
    // TODO: Generate and download PDF
    console.log("Downloading CV...")
  }

  const handleSaveAndComplete = () => {
    // TODO: Save CV and mark as complete in documents
    localStorage.setItem("hasRentalCV", "true")
    
    // Get listing ID directly from URL params
    const listingId = searchParams.get('listing')
    
    if (listingId) {
      // Mark this listing as having a tailored CV
      const tailoredListings = JSON.parse(localStorage.getItem("tailoredCVListings") || "[]")
      if (!tailoredListings.includes(listingId)) {
        tailoredListings.push(listingId)
        localStorage.setItem("tailoredCVListings", JSON.stringify(tailoredListings))
      }
      // Go back to the listing they came from
      router.push(`/dashboard/listings/${listingId}`)
    } else {
      // Go to documents if they came directly to CV page
      router.push("/dashboard/documents")
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/dashboard/documents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to documents
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">
          {isUpdate ? "Update Rental CV" : "Generate Rental CV"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isUpdate 
            ? "Tailor your CV for this specific listing"
            : "Create a professional CV for your apartment applications"
          }
        </p>
      </div>

      {/* Listing Context Alert */}
      {isFromListing && listingContext && (
        <Alert className="border-blue-200 bg-blue-50/50">
          <MapPin className="h-4 w-4" />
          <AlertDescription className="space-y-1">
            <div className="font-medium">Customizing for: {listingContext.title}</div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {listingContext.district}
              </span>
              <span className="flex items-center gap-1">
                <Euro className="h-3 w-3" />
                €{listingContext.warmRent}/month
              </span>
              <span className="flex items-center gap-1">
                <Home className="h-3 w-3" />
                {listingContext.rooms} rooms
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Options */}
        <div className="space-y-6">
          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Template</CardTitle>
              <CardDescription>
                Select a style that matches your personality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedTemplate === "professional" ? "border-primary bg-primary/5" : "hover:border-gray-300"
                }`}
                onClick={() => setSelectedTemplate("professional")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Professional</h4>
                    <p className="text-sm text-muted-foreground">Clean and traditional</p>
                  </div>
                  {selectedTemplate === "professional" && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
              </div>

              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedTemplate === "modern" ? "border-primary bg-primary/5" : "hover:border-gray-300"
                }`}
                onClick={() => setSelectedTemplate("modern")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Modern</h4>
                    <p className="text-sm text-muted-foreground">Contemporary design</p>
                  </div>
                  {selectedTemplate === "modern" && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
              </div>

              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedTemplate === "minimal" ? "border-primary bg-primary/5" : "hover:border-gray-300"
                }`}
                onClick={() => setSelectedTemplate("minimal")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Minimal</h4>
                    <p className="text-sm text-muted-foreground">Simple and elegant</p>
                  </div>
                  {selectedTemplate === "minimal" && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your rental CV will be generated using information from your profile. Make sure your profile is complete for the best results.
            </AlertDescription>
          </Alert>

          {/* Profile Completion */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Profile Completion</span>
                  <span className="font-medium">85%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full w-[85%] bg-primary rounded-full" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Add hobbies and references for a complete CV
                </p>
                <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                  <Link href="/dashboard/profile">
                    Update Profile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>CV Preview</CardTitle>
                  <CardDescription>
                    This is how your rental CV will look
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={!generatedCV}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview PDF
                  </Button>
                  {generatedCV && !isEditing && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit3 className="mr-2 h-4 w-4" />
                      Edit CV
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!generatedCV ? (
                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No CV generated yet</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Click generate to create your professional rental CV
                  </p>
                  <Button onClick={handleGenerate} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {isFromListing ? "Generate Tailored CV" : "Generate CV"}
                      </>
                    )}
                  </Button>
                  {isFromListing && (
                    <p className="text-xs text-blue-600 mt-2 text-center">
                      Will include content specific to {listingContext?.district}
                    </p>
                  )}
                </div>
              ) : isEditing ? (
                /* Edit Mode */
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Edit Your CV</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveEdits}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="introduction">Introduction</Label>
                      <Textarea
                        id="introduction"
                        value={editableCV.introduction}
                        onChange={(e) => setEditableCV(prev => ({ ...prev, introduction: e.target.value }))}
                        className="min-h-[100px]"
                        placeholder="Introduce yourself and mention why you're looking for this apartment..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="employment">Employment Information</Label>
                      <Textarea
                        id="employment"
                        value={editableCV.employment}
                        onChange={(e) => setEditableCV(prev => ({ ...prev, employment: e.target.value }))}
                        className="min-h-[80px]"
                        placeholder="Describe your job, employer, and income..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="rental">Rental Information</Label>
                      <Textarea
                        id="rental"
                        value={editableCV.rental}
                        onChange={(e) => setEditableCV(prev => ({ ...prev, rental: e.target.value }))}
                        className="min-h-[60px]"
                        placeholder="Move-in date, budget, preferences..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="languages">Languages & Skills</Label>
                      <Textarea
                        id="languages"
                        value={editableCV.languages}
                        onChange={(e) => setEditableCV(prev => ({ ...prev, languages: e.target.value }))}
                        className="min-h-[60px]"
                        placeholder="Languages you speak, relevant skills..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="personalNote">Personal Note</Label>
                      <Textarea
                        id="personalNote"
                        value={editableCV.personalNote}
                        onChange={(e) => setEditableCV(prev => ({ ...prev, personalNote: e.target.value }))}
                        className="min-h-[80px]"
                        placeholder="Why you'd be a great tenant, lifestyle, hobbies..."
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* CV Preview Content */}
                  <div className="border rounded-lg p-8 bg-white">
                    {/* Header */}
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold mb-2">{profileData.fullName}</h2>
                      <p className="text-gray-600">Rental Application CV</p>
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 mb-8">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {profileData.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {profileData.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Berlin
                      </span>
                    </div>

                    {/* Sections */}
                    <div className="space-y-6">
                      {/* Introduction */}
                      {editableCV.introduction && (
                        <div>
                          <h3 className="font-semibold text-lg mb-3 border-b pb-1">Introduction</h3>
                          <p className="text-sm whitespace-pre-wrap">{editableCV.introduction}</p>
                        </div>
                      )}

                      {/* Personal Information */}
                      <div>
                        <h3 className="font-semibold text-lg mb-3 border-b pb-1">Personal Information</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Date of Birth:</span> {new Date(profileData.birthDate).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="text-gray-600">Nationality:</span> {profileData.nationality}
                          </div>
                          <div>
                            <span className="text-gray-600">Smoker:</span> {profileData.isSmoker ? "Yes" : "No"}
                          </div>
                          <div>
                            <span className="text-gray-600">Pets:</span> {profileData.hasPets ? "Yes" : "No"}
                          </div>
                        </div>
                      </div>

                      {/* Employment */}
                      {editableCV.employment && (
                        <div>
                          <h3 className="font-semibold text-lg mb-3 border-b pb-1">Employment</h3>
                          <p className="text-sm whitespace-pre-wrap">{editableCV.employment}</p>
                        </div>
                      )}

                      {/* Rental Information */}
                      {editableCV.rental && (
                        <div>
                          <h3 className="font-semibold text-lg mb-3 border-b pb-1">Rental Information</h3>
                          <p className="text-sm whitespace-pre-wrap">{editableCV.rental}</p>
                        </div>
                      )}

                      {/* Languages & Skills */}
                      {editableCV.languages && (
                        <div>
                          <h3 className="font-semibold text-lg mb-3 border-b pb-1">Languages & Skills</h3>
                          <p className="text-sm whitespace-pre-wrap">{editableCV.languages}</p>
                        </div>
                      )}

                      {/* Personal Note */}
                      {editableCV.personalNote && (
                        <div>
                          <h3 className="font-semibold text-lg mb-3 border-b pb-1">About Me</h3>
                          <p className="text-sm whitespace-pre-wrap">{editableCV.personalNote}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-4">
                    <Button variant="outline" onClick={handleGenerate}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Edit CV
                    </Button>
                    <Button variant="outline" onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                    <Button onClick={handleSaveAndComplete}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Save & Mark Complete
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
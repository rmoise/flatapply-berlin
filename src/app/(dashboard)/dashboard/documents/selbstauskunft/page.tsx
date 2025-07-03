"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft,
  Download,
  FileText,
  User,
  Briefcase,
  Euro,
  Calendar,
  Home,
  Heart,
  Info,
  CheckCircle
} from "lucide-react"
import Link from "next/link"

export default function SelbstauskunftPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: "",
    birthDate: "",
    currentAddress: "",
    phone: "",
    email: "",
    nationality: "",
    
    // Employment
    employmentStatus: "",
    jobTitle: "",
    employer: "",
    employmentSince: "",
    monthlyNetIncome: "",
    
    // Current Living Situation
    currentRentAmount: "",
    tenantSince: "",
    reasonForMoving: "",
    
    // New Apartment
    desiredMoveInDate: "",
    numberOfPeople: "1",
    
    // Lifestyle
    hasPets: false,
    petDetails: "",
    isSmoker: false,
    playsInstruments: false,
    instrumentDetails: "",
    
    // Financial
    hasDebtProceedings: false,
    hasBankruptcy: false,
    
    // References
    previousLandlordName: "",
    previousLandlordPhone: "",
    
    // Additional
    additionalInfo: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Generate PDF
    console.log("Generating Selbstauskunft with data:", formData)
  }

  const handleGenerateAndSave = () => {
    // TODO: Generate PDF and mark as completed in documents page
    router.push("/dashboard/documents")
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/dashboard/documents">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to documents
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Generate Selbstauskunft</h1>
          <p className="text-muted-foreground mt-1">
            Create your tenant self-disclosure form
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          The Selbstauskunft is a standard form that provides landlords with essential information about you as a potential tenant. All fields marked with * are required.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic details about yourself</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Date of Birth *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentAddress">Current Address *</Label>
              <Input
                id="currentAddress"
                value={formData.currentAddress}
                onChange={(e) => setFormData({...formData, currentAddress: e.target.value})}
                placeholder="Street, House Number, Postal Code, City"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality *</Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Employment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Employment Information</CardTitle>
            <CardDescription>Details about your work and income</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employmentStatus">Employment Status *</Label>
              <Select 
                value={formData.employmentStatus}
                onValueChange={(value) => setFormData({...formData, employmentStatus: value})}
              >
                <SelectTrigger id="employmentStatus">
                  <SelectValue placeholder="Select employment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employed">Employed</SelectItem>
                  <SelectItem value="self_employed">Self-employed</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                  <SelectItem value="unemployed">Unemployed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.employmentStatus === "employed" || formData.employmentStatus === "self_employed") && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title *</Label>
                    <Input
                      id="jobTitle"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employer">Employer *</Label>
                    <Input
                      id="employer"
                      value={formData.employer}
                      onChange={(e) => setFormData({...formData, employer: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employmentSince">Employed Since *</Label>
                    <Input
                      id="employmentSince"
                      type="date"
                      value={formData.employmentSince}
                      onChange={(e) => setFormData({...formData, employmentSince: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyNetIncome">Monthly Net Income (€) *</Label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="monthlyNetIncome"
                        type="number"
                        value={formData.monthlyNetIncome}
                        onChange={(e) => setFormData({...formData, monthlyNetIncome: e.target.value})}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Current Living Situation */}
        <Card>
          <CardHeader>
            <CardTitle>Current Living Situation</CardTitle>
            <CardDescription>Information about where you live now</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentRentAmount">Current Rent (€)</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="currentRentAmount"
                    type="number"
                    value={formData.currentRentAmount}
                    onChange={(e) => setFormData({...formData, currentRentAmount: e.target.value})}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenantSince">Tenant Since</Label>
                <Input
                  id="tenantSince"
                  type="date"
                  value={formData.tenantSince}
                  onChange={(e) => setFormData({...formData, tenantSince: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reasonForMoving">Reason for Moving *</Label>
              <Textarea
                id="reasonForMoving"
                value={formData.reasonForMoving}
                onChange={(e) => setFormData({...formData, reasonForMoving: e.target.value})}
                placeholder="E.g., need more space, job relocation, etc."
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* New Apartment */}
        <Card>
          <CardHeader>
            <CardTitle>New Apartment Details</CardTitle>
            <CardDescription>Information about your move</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="desiredMoveInDate">Desired Move-in Date *</Label>
                <Input
                  id="desiredMoveInDate"
                  type="date"
                  value={formData.desiredMoveInDate}
                  onChange={(e) => setFormData({...formData, desiredMoveInDate: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberOfPeople">Number of People Moving In *</Label>
                <Select 
                  value={formData.numberOfPeople}
                  onValueChange={(value) => setFormData({...formData, numberOfPeople: value})}
                >
                  <SelectTrigger id="numberOfPeople">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Person</SelectItem>
                    <SelectItem value="2">2 People</SelectItem>
                    <SelectItem value="3">3 People</SelectItem>
                    <SelectItem value="4">4 People</SelectItem>
                    <SelectItem value="5+">5+ People</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lifestyle */}
        <Card>
          <CardHeader>
            <CardTitle>Lifestyle Information</CardTitle>
            <CardDescription>Help landlords understand your living habits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="hasPets">Do you have pets?</Label>
              </div>
              <Switch
                id="hasPets"
                checked={formData.hasPets}
                onCheckedChange={(checked) => setFormData({...formData, hasPets: checked})}
              />
            </div>

            {formData.hasPets && (
              <div className="space-y-2">
                <Label htmlFor="petDetails">Pet Details</Label>
                <Input
                  id="petDetails"
                  value={formData.petDetails}
                  onChange={(e) => setFormData({...formData, petDetails: e.target.value})}
                  placeholder="E.g., 1 small dog, 2 cats"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isSmoker">Are you a smoker?</Label>
              </div>
              <Switch
                id="isSmoker"
                checked={formData.isSmoker}
                onCheckedChange={(checked) => setFormData({...formData, isSmoker: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="playsInstruments">Do you play musical instruments?</Label>
              </div>
              <Switch
                id="playsInstruments"
                checked={formData.playsInstruments}
                onCheckedChange={(checked) => setFormData({...formData, playsInstruments: checked})}
              />
            </div>

            {formData.playsInstruments && (
              <div className="space-y-2">
                <Label htmlFor="instrumentDetails">Instrument Details</Label>
                <Input
                  id="instrumentDetails"
                  value={formData.instrumentDetails}
                  onChange={(e) => setFormData({...formData, instrumentDetails: e.target.value})}
                  placeholder="E.g., Piano, practice only during day hours"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Status */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Status</CardTitle>
            <CardDescription>Required legal declarations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Are there any debt collection proceedings against you?</Label>
                </div>
                <RadioGroup 
                  value={formData.hasDebtProceedings ? "yes" : "no"}
                  onValueChange={(value) => setFormData({...formData, hasDebtProceedings: value === "yes"})}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="debt-yes" />
                    <Label htmlFor="debt-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="debt-no" />
                    <Label htmlFor="debt-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Have you declared personal bankruptcy?</Label>
                </div>
                <RadioGroup 
                  value={formData.hasBankruptcy ? "yes" : "no"}
                  onValueChange={(value) => setFormData({...formData, hasBankruptcy: value === "yes"})}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="bankruptcy-yes" />
                    <Label htmlFor="bankruptcy-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="bankruptcy-no" />
                    <Label htmlFor="bankruptcy-no">No</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* References */}
        <Card>
          <CardHeader>
            <CardTitle>References (Optional)</CardTitle>
            <CardDescription>Previous landlord information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="previousLandlordName">Previous Landlord Name</Label>
                <Input
                  id="previousLandlordName"
                  value={formData.previousLandlordName}
                  onChange={(e) => setFormData({...formData, previousLandlordName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="previousLandlordPhone">Previous Landlord Phone</Label>
                <Input
                  id="previousLandlordPhone"
                  type="tel"
                  value={formData.previousLandlordPhone}
                  onChange={(e) => setFormData({...formData, previousLandlordPhone: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information (Optional)</CardTitle>
            <CardDescription>Anything else you'd like to share</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.additionalInfo}
              onChange={(e) => setFormData({...formData, additionalInfo: e.target.value})}
              placeholder="E.g., references, special circumstances, etc."
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard/documents">Cancel</Link>
          </Button>
          <Button type="submit" variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button type="button" onClick={handleGenerateAndSave}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Generate & Mark Complete
          </Button>
        </div>
      </form>
    </div>
  )
}
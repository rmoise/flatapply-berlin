"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Save,
  Upload,
  User,
  Briefcase,
  Calendar,
  Euro,
  Heart,
  Camera
} from "lucide-react"

export default function ProfilePage() {
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  
  // TODO: Get from Supabase
  const profile = {
    email: "john@example.com",
    fullName: "John Doe",
    phone: "+49 176 12345678",
    jobTitle: "Software Engineer",
    employer: "Tech Company GmbH",
    incomeType: "employed",
    monthlyIncome: 3500,
    hasPets: false,
    moveInDate: "2024-03-01",
    personalityTraits: ["Quiet", "Non-smoker", "Clean"]
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Complete your profile to increase your chances of getting accepted
        </p>
      </div>

      {/* Profile Photo */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>
            Add a professional photo to make a good first impression
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profilePhoto || undefined} />
              <AvatarFallback>
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" size="sm" asChild>
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Camera className="mr-2 h-4 w-4" />
                  Upload Photo
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                JPG, PNG or GIF. Max 5MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Basic information that landlords will see
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                defaultValue={profile.fullName}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                defaultValue={profile.phone}
                placeholder="+49 176 12345678"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              defaultValue={profile.email}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="moveInDate">Earliest Move-in Date</Label>
            <Input
              id="moveInDate"
              type="date"
              defaultValue={profile.moveInDate}
            />
          </div>
        </CardContent>
      </Card>

      {/* Employment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Employment Information</CardTitle>
          <CardDescription>
            Help landlords verify your financial stability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                defaultValue={profile.jobTitle}
                placeholder="Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employer">Employer</Label>
              <Input
                id="employer"
                defaultValue={profile.employer}
                placeholder="Company Name"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="incomeType">Employment Type</Label>
              <Select defaultValue={profile.incomeType}>
                <SelectTrigger id="incomeType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employed">Employed</SelectItem>
                  <SelectItem value="self_employed">Self-employed</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyIncome">Monthly Net Income</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="monthlyIncome"
                  type="number"
                  defaultValue={profile.monthlyIncome}
                  placeholder="3500"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About You */}
      <Card>
        <CardHeader>
          <CardTitle>About You</CardTitle>
          <CardDescription>
            Help landlords get to know you better
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Personality Traits</Label>
            <div className="flex flex-wrap gap-2">
              {["Quiet", "Social", "Clean", "Organized", "Non-smoker", "Early riser", "Night owl", "Works from home"].map(trait => (
                <Badge
                  key={trait}
                  variant={profile.personalityTraits.includes(trait) ? "default" : "outline"}
                  className="cursor-pointer"
                >
                  {trait}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="hasPets">Do you have pets?</Label>
              <p className="text-sm text-muted-foreground">
                Some landlords have pet policies
              </p>
            </div>
            <Switch
              id="hasPets"
              checked={profile.hasPets}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Short Bio (Optional)</Label>
            <Textarea
              id="bio"
              placeholder="Tell landlords a bit about yourself, your hobbies, lifestyle..."
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Profile Completion */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Completion</CardTitle>
          <CardDescription>
            Complete profiles have 3x higher acceptance rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Profile Strength</span>
              <span className="font-medium">75%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-primary rounded-full" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Add a photo and upload documents to reach 100%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button variant="outline">Cancel</Button>
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save Profile
        </Button>
      </div>
    </div>
  )
}
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  MapPin,
  Euro,
  Home,
  Bell,
  Mail,
  MessageSquare,
  Phone,
  Save,
  AlertCircle,
  Info,
  X,
  HelpCircle
} from "lucide-react"
import { updateUserPreferences } from '@/features/preferences/actions'

interface PreferencesFormProps {
  userId: string
  initialData: any
  districts: string[]
  propertyTypes: string[]
}

export function PreferencesForm({ userId, initialData, districts, propertyTypes }: PreferencesFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Form state
  const [priceRange, setPriceRange] = useState([
    initialData?.min_rent || 800, 
    initialData?.max_rent || 1500
  ])
  const [sizeRange, setSizeRange] = useState([
    initialData?.min_size || 40, 
    initialData?.max_size || 80
  ])
  const [minRooms, setMinRooms] = useState(String(initialData?.min_rooms || 1))
  const [maxRooms, setMaxRooms] = useState(String(initialData?.max_rooms || 3))
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(
    initialData?.preferred_districts || []
  )
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>(
    initialData?.property_types || ["apartment", "studio"]
  )
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true)
  
  // Shared living preferences
  const [sharedGenderPreference, setSharedGenderPreference] = useState(initialData?.shared_gender_preference || 'any')
  const [sharedAgeRange, setSharedAgeRange] = useState([
    initialData?.shared_min_age || 18,
    initialData?.shared_max_age || 45
  ])
  const [sharedSmokingAllowed, setSharedSmokingAllowed] = useState(initialData?.shared_smoking_allowed ?? null)
  const [sharedPetsAllowed, setSharedPetsAllowed] = useState(initialData?.shared_pets_allowed ?? null)

  const toggleDistrict = (district: string) => {
    setSelectedDistricts(prev => 
      prev.includes(district) 
        ? prev.filter(d => d !== district)
        : [...prev, district]
    )
  }

  const togglePropertyType = (type: string) => {
    setSelectedPropertyTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const handleSubmit = async () => {
    startTransition(async () => {
      try {
        const result = await updateUserPreferences(userId, {
          minRent: priceRange[0],
          maxRent: priceRange[1],
          minSize: sizeRange[0],
          maxSize: sizeRange[1],
          minRooms: parseFloat(minRooms),
          maxRooms: parseFloat(maxRooms),
          districts: selectedDistricts,
          apartmentTypes: selectedPropertyTypes,
          active: isActive,
          // Shared living preferences
          sharedGenderPreference,
          sharedMinAge: sharedAgeRange[0],
          sharedMaxAge: sharedAgeRange[1],
          sharedSmokingAllowed,
          sharedPetsAllowed
        })

        if (result.success) {
          toast.success("Preferences saved successfully!")
          router.refresh()
        } else {
          toast.error(result.error || "Failed to save preferences")
        }
      } catch (error) {
        toast.error("An error occurred while saving preferences")
      }
    })
  }

  return (
    <>
      <Tabs defaultValue="criteria" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="criteria">Search Criteria</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Search Criteria Tab */}
        <TabsContent value="criteria" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
              <CardDescription>
                Define your ideal apartment characteristics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Active Status */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="active-search">Active Search</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for new matches
                  </p>
                </div>
                <Switch 
                  id="active-search" 
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              {/* Price Range */}
              <div className="space-y-4">
                <Label>Monthly Rent (Warm) - Total including utilities</Label>
                <div className="px-2">
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    min={400}
                    max={3000}
                    step={50}
                    className="mb-4"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">€{priceRange[0]}</span>
                    <span className="text-muted-foreground">to</span>
                    <span className="font-medium">€{priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Size Range */}
              <div className="space-y-4">
                <Label>Size (m²)</Label>
                <div className="px-2">
                  <Slider
                    value={sizeRange}
                    onValueChange={setSizeRange}
                    min={20}
                    max={150}
                    step={5}
                    className="mb-4"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{sizeRange[0]}m²</span>
                    <span className="text-muted-foreground">to</span>
                    <span className="font-medium">{sizeRange[1]}m²</span>
                  </div>
                </div>
              </div>

              {/* Rooms */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-rooms">Minimum Rooms</Label>
                  <Select value={minRooms} onValueChange={setMinRooms}>
                    <SelectTrigger id="min-rooms">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Room</SelectItem>
                      <SelectItem value="1.5">1.5 Rooms</SelectItem>
                      <SelectItem value="2">2 Rooms</SelectItem>
                      <SelectItem value="2.5">2.5 Rooms</SelectItem>
                      <SelectItem value="3">3 Rooms</SelectItem>
                      <SelectItem value="4">4+ Rooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-rooms">Maximum Rooms</Label>
                  <Select value={maxRooms} onValueChange={setMaxRooms}>
                    <SelectTrigger id="max-rooms">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Room</SelectItem>
                      <SelectItem value="1.5">1.5 Rooms</SelectItem>
                      <SelectItem value="2">2 Rooms</SelectItem>
                      <SelectItem value="2.5">2.5 Rooms</SelectItem>
                      <SelectItem value="3">3 Rooms</SelectItem>
                      <SelectItem value="4">4+ Rooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Property Types */}
              <div className="space-y-4">
                <Label>Property Types</Label>
                
                {/* Regular Properties */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Regular Properties</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 border rounded-lg">
                    {propertyTypes.filter(type => !type.startsWith('wg_') && !type.includes('shared') && type !== 'student_dorm' && type !== 'temporary_sublet').map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={type}
                          checked={selectedPropertyTypes.includes(type)}
                          onCheckedChange={() => togglePropertyType(type)}
                        />
                        <Label
                          htmlFor={type}
                          className="text-sm font-normal cursor-pointer capitalize"
                        >
                          {type.replace(/_/g, ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Shared Living Options */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Shared Living</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">Shared living includes flatshares, WGs, roommates, and other arrangements where you share common areas with others.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 border rounded-lg">
                    {propertyTypes.filter(type => type.includes('shared') || type === 'student_housing' || type === 'sublet').map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={type}
                          checked={selectedPropertyTypes.includes(type)}
                          onCheckedChange={() => togglePropertyType(type)}
                        />
                        <Label
                          htmlFor={type}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {type === 'room_in_shared' && 'Room in Shared Flat'}
                          {type === 'student_housing' && 'Student Housing'}
                          {type === 'sublet' && 'Sublet'}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Shared Living Preferences Card */}
          {selectedPropertyTypes.some(type => type.includes('shared') || type === 'student_housing') && (
            <Card>
              <CardHeader>
                <CardTitle>Shared Living Preferences</CardTitle>
                <CardDescription>
                  Additional preferences for shared living situations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Gender Preference */}
                <div className="space-y-2">
                  <Label htmlFor="gender-pref">Flatmate Gender Preference</Label>
                  <Select value={sharedGenderPreference} onValueChange={setSharedGenderPreference}>
                    <SelectTrigger id="gender-pref">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Gender</SelectItem>
                      <SelectItem value="female">Female Only</SelectItem>
                      <SelectItem value="male">Male Only</SelectItem>
                      <SelectItem value="mixed">Mixed Gender</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Age Range */}
                <div className="space-y-4">
                  <Label>Preferred Age Range of Flatmates</Label>
                  <div className="px-2">
                    <Slider
                      value={sharedAgeRange}
                      onValueChange={setSharedAgeRange}
                      min={18}
                      max={60}
                      step={1}
                      className="mb-4"
                    />
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{sharedAgeRange[0]} years</span>
                      <span className="text-muted-foreground">to</span>
                      <span className="font-medium">{sharedAgeRange[1]} years</span>
                    </div>
                  </div>
                </div>
                
                {/* Smoking Preference */}
                <div className="space-y-2">
                  <Label htmlFor="smoking-pref">Smoking Policy</Label>
                  <Select value={String(sharedSmokingAllowed)} onValueChange={(value) => setSharedSmokingAllowed(value === 'null' ? null : value === 'true')}>
                    <SelectTrigger id="smoking-pref">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">No Preference</SelectItem>
                      <SelectItem value="false">Non-Smoking Only</SelectItem>
                      <SelectItem value="true">Smoking Allowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Pets Preference */}
                <div className="space-y-2">
                  <Label htmlFor="pets-pref">Pet Policy</Label>
                  <Select value={String(sharedPetsAllowed)} onValueChange={(value) => setSharedPetsAllowed(value === 'null' ? null : value === 'true')}>
                    <SelectTrigger id="pets-pref">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">No Preference</SelectItem>
                      <SelectItem value="false">No Pets</SelectItem>
                      <SelectItem value="true">Pets Allowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferred Districts</CardTitle>
              <CardDescription>
                Select all districts where you'd like to live
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {districts.map(district => (
                  <Button
                    key={district}
                    variant={selectedDistricts.includes(district) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDistrict(district)}
                    className="justify-start"
                  >
                    {selectedDistricts.includes(district) && (
                      <MapPin className="mr-2 h-3 w-3" />
                    )}
                    {district}
                  </Button>
                ))}
              </div>
              
              {selectedDistricts.length > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedDistricts.length} district{selectedDistricts.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how you receive alerts about new matches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Info className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  Email notifications are enabled by default. SMS and WhatsApp notifications coming soon!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end gap-4 mt-6">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <span className="loading loading-spinner loading-sm mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </>
  )
}
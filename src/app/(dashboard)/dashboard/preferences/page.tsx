"use client"

import { useState } from "react"
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
  X
} from "lucide-react"

const BERLIN_DISTRICTS = [
  "Mitte",
  "Prenzlauer Berg",
  "Friedrichshain",
  "Kreuzberg",
  "Charlottenburg",
  "Wilmersdorf",
  "Schöneberg",
  "Neukölln",
  "Tempelhof",
  "Steglitz",
  "Zehlendorf",
  "Wedding",
  "Moabit",
  "Spandau",
  "Reinickendorf",
  "Pankow",
  "Lichtenberg",
  "Treptow",
  "Köpenick",
  "Marzahn",
  "Hellersdorf"
]

const PROPERTY_TYPES = [
  { id: "apartment", label: "Apartment" },
  { id: "studio", label: "Studio" },
  { id: "room", label: "WG Room" },
  { id: "house", label: "House" },
  { id: "loft", label: "Loft" }
]

export default function PreferencesPage() {
  const [priceRange, setPriceRange] = useState([800, 1500])
  const [sizeRange, setSizeRange] = useState([40, 80])
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([])
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>(["apartment", "studio"])

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

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Search Preferences</h1>
        <p className="text-muted-foreground mt-1">
          Set up your ideal apartment criteria and we'll notify you when matches are found
        </p>
      </div>

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
              {/* Price Range */}
              <div className="space-y-4">
                <Label>Monthly Rent (Warm)</Label>
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
                  <Select defaultValue="1">
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
                  <Select defaultValue="3">
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
              <div className="space-y-3">
                <Label>Property Types</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PROPERTY_TYPES.map(type => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={type.id}
                        checked={selectedPropertyTypes.includes(type.id)}
                        onCheckedChange={() => togglePropertyType(type.id)}
                      />
                      <Label
                        htmlFor={type.id}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available From */}
              <div className="space-y-2">
                <Label htmlFor="available-from">Available From</Label>
                <Input
                  id="available-from"
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
            </CardContent>
          </Card>
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
                {BERLIN_DISTRICTS.map(district => (
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

          <Card>
            <CardHeader>
              <CardTitle>Commute Preferences</CardTitle>
              <CardDescription>
                Set maximum commute time from a specific location (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="commute-address">Work/Study Address</Label>
                <Input
                  id="commute-address"
                  placeholder="e.g., Alexanderplatz, Berlin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-commute">Maximum Commute Time</Label>
                <Select defaultValue="45">
                  <SelectTrigger id="max-commute">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="none">No limit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>
                Choose how you want to receive alerts about new matches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive instant alerts to your email
                    </p>
                  </div>
                  <Switch id="email-notifications" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <Label htmlFor="whatsapp-notifications">WhatsApp</Label>
                      <Badge variant="secondary" className="text-xs">Pro</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Get alerts via WhatsApp message
                    </p>
                  </div>
                  <Switch id="whatsapp-notifications" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <Label htmlFor="sms-notifications">SMS</Label>
                      <Badge variant="secondary" className="text-xs">Pro</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive SMS for urgent matches
                    </p>
                  </div>
                  <Switch id="sms-notifications" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Control when and how often you receive alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Daily Alert Limit</Label>
                <Select defaultValue="20">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 alerts/day</SelectItem>
                    <SelectItem value="10">10 alerts/day</SelectItem>
                    <SelectItem value="20">20 alerts/day</SelectItem>
                    <SelectItem value="50">50 alerts/day</SelectItem>
                    <SelectItem value="unlimited">Unlimited (Pro)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quiet Hours</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quiet-start" className="text-sm">From</Label>
                    <Input id="quiet-start" type="time" defaultValue="22:00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quiet-end" className="text-sm">Until</Label>
                    <Input id="quiet-end" type="time" defaultValue="08:00" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-apply">Auto-Apply</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically send applications to matching listings
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">Pro</Badge>
                  <Switch id="auto-apply" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <Info className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Upgrade to Pro to unlock WhatsApp, SMS notifications, and auto-apply features
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end gap-4 mt-6">
        <Button variant="outline">Cancel</Button>
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save Preferences
        </Button>
      </div>
    </div>
  )
}
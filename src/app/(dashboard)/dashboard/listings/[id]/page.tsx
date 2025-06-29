import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowLeft,
  Calendar,
  Euro,
  Home,
  MapPin,
  Maximize,
  Heart,
  Share2,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  Wifi,
  Car,
  Trees,
  Sofa,
  Utensils,
  Bath,
  Zap,
  CircleUserRound,
  Building,
  Layers,
  Sparkles,
  Send,
  FileText,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  // TODO: Replace with real data from Supabase
  const listing = {
    id: params.id,
    title: "Beautiful 2-room apartment in Prenzlauer Berg",
    description: `Welcome to this charming 2-room apartment in the heart of Prenzlauer Berg! This recently renovated flat offers the perfect blend of modern comfort and classic Berlin charm.

The apartment features high ceilings, original hardwood floors, and large windows that flood the space with natural light. The open-plan kitchen is fully equipped with modern appliances, including a dishwasher and induction stove.

The bedroom is spacious and quiet, overlooking a peaceful courtyard. The bathroom has been recently renovated with a rain shower and heated floors.

Located on a quiet side street, you're just minutes away from Mauerpark, countless cafes, restaurants, and boutique shops. The U2 line at Eberswalder Straße is only a 5-minute walk away.

Perfect for professionals or couples looking for a stylish home in one of Berlin's most sought-after neighborhoods.`,
    price: 1200,
    warmRent: 1450,
    deposit: 3600,
    size: 65,
    rooms: 2,
    floor: 3,
    totalFloors: 5,
    availableFrom: "2024-02-01",
    district: "Prenzlauer Berg",
    address: "Stargarder Straße, 10437 Berlin",
    latitude: 52.5492,
    longitude: 13.4040,
    propertyType: "Apartment",
    yearBuilt: 1905,
    energyClass: "C",
    heatingType: "Central heating",
    platform: "immoscout24",
    externalUrl: "https://www.immoscout24.de/expose/123456789",
    images: [
      "/api/placeholder/800/600",
      "/api/placeholder/800/600",
      "/api/placeholder/800/600",
      "/api/placeholder/800/600"
    ],
    amenities: {
      kitchen: true,
      balcony: false,
      garden: false,
      basement: true,
      elevator: true,
      parking: false,
      furnished: false,
      petsAllowed: "negotiable",
      wgSuitable: false
    },
    contact: {
      name: "Anna Schmidt",
      company: "Berlin Property Management GmbH",
      responseRate: 85,
      responseTime: "Usually within 24 hours"
    },
    stats: {
      views: 234,
      applications: 18,
      savedBy: 45
    },
    matchScore: 95,
    matchReasons: [
      "Within your budget",
      "In your preferred district",
      "Matches room count",
      "Near public transport"
    ]
  }

  const userHasApplied = false // TODO: Check if user has applied
  const isSaved = false // TODO: Check if user has saved

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/listings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to listings
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Heart className={`mr-2 h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            Save
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <Card className="overflow-hidden">
            <div className="relative aspect-[4/3]">
              <Image
                src={listing.images[0]}
                alt={listing.title}
                fill
                className="object-cover"
              />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Badge className="bg-black/70 text-white">
                  1 / {listing.images.length}
                </Badge>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-4 gap-2">
                {listing.images.slice(1).map((img, idx) => (
                  <div key={idx} className="relative aspect-square cursor-pointer overflow-hidden rounded-md">
                    <Image
                      src={img}
                      alt={`View ${idx + 2}`}
                      fill
                      className="object-cover hover:scale-110 transition-transform"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Title and Key Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{listing.title}</CardTitle>
                  <CardDescription className="flex items-center mt-2">
                    <MapPin className="mr-1 h-4 w-4" />
                    {listing.address}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">€{listing.price}</div>
                  <div className="text-sm text-muted-foreground">Cold rent</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{listing.rooms} Rooms</div>
                    <div className="text-sm text-muted-foreground">Living space</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Maximize className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{listing.size} m²</div>
                    <div className="text-sm text-muted-foreground">Total area</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{listing.floor}. Floor</div>
                    <div className="text-sm text-muted-foreground">of {listing.totalFloors}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Feb 1, 2024</div>
                    <div className="text-sm text-muted-foreground">Available</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description and Details Tabs */}
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="description">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="location">Location</TabsTrigger>
                </TabsList>
                
                <TabsContent value="description" className="space-y-4 mt-4">
                  <div className="whitespace-pre-wrap">{listing.description}</div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold mb-3">Amenities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {listing.amenities.kitchen && (
                        <div className="flex items-center gap-2">
                          <Utensils className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Fitted kitchen</span>
                        </div>
                      )}
                      {listing.amenities.elevator && (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Elevator</span>
                        </div>
                      )}
                      {listing.amenities.basement && (
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Basement</span>
                        </div>
                      )}
                      {!listing.amenities.balcony && (
                        <div className="flex items-center gap-2 opacity-50">
                          <Home className="h-4 w-4" />
                          <span className="text-sm">No balcony</span>
                        </div>
                      )}
                      {!listing.amenities.parking && (
                        <div className="flex items-center gap-2 opacity-50">
                          <Car className="h-4 w-4" />
                          <span className="text-sm">No parking</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <CircleUserRound className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">Pets negotiable</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Costs</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cold rent</span>
                          <span>€{listing.price}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Utilities</span>
                          <span>€{listing.warmRent - listing.price}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Warm rent</span>
                          <span>€{listing.warmRent}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Deposit</span>
                          <span>€{listing.deposit}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Building</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type</span>
                          <span>{listing.propertyType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Year built</span>
                          <span>{listing.yearBuilt}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Energy class</span>
                          <span>{listing.energyClass}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Heating</span>
                          <span>{listing.heatingType}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="location" className="mt-4">
                  <div className="aspect-[16/9] bg-muted rounded-lg flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Map view coming soon</span>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>Located in {listing.district}, one of Berlin's most popular neighborhoods.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Match Score */}
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-green-600" />
                {listing.matchScore}% Match
              </CardTitle>
              <CardDescription>Based on your preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {listing.matchReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {reason}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Apply Section */}
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
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate with AI
                    </Button>
                    <Button variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      Add CV
                    </Button>
                  </div>
                  <Button className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Send Application
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <p className="font-medium">Application sent!</p>
                  <p className="text-sm text-muted-foreground">
                    Applied on Jan 15, 2024
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{listing.contact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{listing.contact.name}</div>
                  <div className="text-sm text-muted-foreground">{listing.contact.company}</div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{listing.contact.responseTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span>{listing.contact.responseRate}% response rate</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-muted-foreground">
                  Contact through the platform only
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Listing Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Views</span>
                  <span className="font-medium">{listing.stats.views}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Applications</span>
                  <span className="font-medium">{listing.stats.applications}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saved by</span>
                  <span className="font-medium">{listing.stats.savedBy} people</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-900">
                  <Zap className="h-4 w-4 inline mr-1" />
                  High demand - apply soon!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Platform Link */}
          <Button variant="outline" className="w-full" asChild>
            <a href={listing.externalUrl} target="_blank" rel="noopener noreferrer">
              View on {listing.platform}
              <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
import { notFound } from "next/navigation"
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/utils'
import { getListingById, markListingViewed } from '@/features/listings/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  Building2,
  Layers,
  Sparkles,
  Send,
  FileText,
  AlertCircle,
  Info,
  Waves,
  Shirt,
  Dog,
  Users,
  Cigarette,
  Baby,
  Heart as HeartIcon,
  Lock,
  ExternalLink,
  Eye,
  TrendingUp,
  Shield,
  Coffee,
  Dumbbell,
  Music,
  Tv,
  Wind,
  Snowflake,
  Sun,
  TreePalm
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ProxiedImage } from "@/components/ui/proxied-image"
import { ApplySection } from "@/features/listings/components/apply-section"
import { ListingDetailActions } from "@/features/listings/components/listing-detail-actions"
import { ExternalLinkButton } from "@/features/listings/components/external-link-button"

export default async function ListingDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const user = await getUser()
  const { id } = await params
  
  // Fetch listing data
  const result = await getListingById(id, user?.id)
  
  if (!result.success || !result.listing) {
    notFound()
  }
  
  const { listing, isSaved, matchData, isAuthenticated } = result
  
  // Mark as viewed if user is authenticated
  if (user && matchData) {
    await markListingViewed(user.id, id)
  }
  
  const formatPrice = (price: number | null) => {
    if (!price) return 'Price on request'
    return `€${price}`
  }
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Available now'
    const date = new Date(dateString)
    const now = new Date()
    if (date <= now) return 'Available now'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  
  const getPlatformName = (platform: string) => {
    const names: Record<string, string> = {
      'wg_gesucht': 'WG-Gesucht',
      'immoscout24': 'ImmoScout24',
      'kleinanzeigen': 'Kleinanzeigen',
      'immowelt': 'Immowelt',
      'immonet': 'Immonet'
    }
    return names[platform] || platform
  }

  const getAmenityIcon = (amenity: string) => {
    const iconMap: Record<string, any> = {
      wifi: Wifi,
      parking: Car,
      balcony: Trees,
      terrace: TreePalm,
      garden: Trees,
      furnished: Sofa,
      kitchen: Utensils,
      dishwasher: Utensils,
      bathtub: Bath,
      shower: Bath,
      heating: Zap,
      elevator: Building,
      cellar: Building2,
      storageRoom: Building2,
      washingMachine: Shirt,
      dryer: Wind,
      petsAllowed: Dog,
      smokingAllowed: Cigarette,
      flatshare: Users,
      suitableForShared: Users,
      accessibleDesign: Shield,
      seniorFriendly: HeartIcon,
      studentFriendly: Coffee,
      familyFriendly: Baby,
      gym: Dumbbell,
      pool: Waves,
      sauna: Snowflake,
      airConditioning: Wind,
      floorHeating: Sun,
      cableTv: Tv,
      internet: Wifi,
      communityRoom: Music
    }
    return iconMap[amenity] || Home
  }

  const amenityLabels: Record<string, string> = {
    wifi: 'WiFi',
    parking: 'Parking',
    balcony: 'Balcony',
    terrace: 'Terrace',
    garden: 'Garden',
    furnished: 'Furnished',
    kitchen: 'Kitchen',
    dishwasher: 'Dishwasher',
    bathtub: 'Bathtub',
    shower: 'Shower',
    heating: 'Heating',
    elevator: 'Elevator',
    cellar: 'Cellar',
    storageRoom: 'Storage Room',
    washingMachine: 'Washing Machine',
    dryer: 'Dryer',
    petsAllowed: 'Pets Allowed',
    smokingAllowed: 'Smoking Allowed',
    flatshare: 'Flatshare',
    suitableForShared: 'Suitable for Shared',
    accessibleDesign: 'Accessible',
    seniorFriendly: 'Senior Friendly',
    studentFriendly: 'Student Friendly',
    familyFriendly: 'Family Friendly',
    gym: 'Gym',
    pool: 'Pool',
    sauna: 'Sauna',
    airConditioning: 'Air Conditioning',
    floorHeating: 'Floor Heating',
    cableTv: 'Cable TV',
    internet: 'Internet',
    communityRoom: 'Community Room'
  }

  // Check if user has already applied to this listing
  const userHasApplied = false // TODO: Implement this check

  // Format listing data
  const formattedListing = {
    title: listing.title || 'Untitled Listing',
    address: listing.address || listing.district || 'Berlin',
    district: listing.district || 'Unknown',
    price: listing.price || 0,
    warmRent: listing.warm_rent || listing.price || 0,
    size: listing.size_sqm || 0,
    rooms: listing.rooms || 1,
    floor: listing.floor,
    totalFloors: listing.total_floors,
    availableFrom: listing.available_from,
    availableTo: listing.available_to,
    description: listing.description || 'No description available',
    images: listing.images || [],
    amenities: listing.amenities || {},
    propertyType: listing.property_type || 'Apartment',
    platform: listing.platform,
    externalId: listing.external_id,
    url: listing.url,
    contact: {
      name: listing.contact_name || 'Contact via platform',
      email: listing.contact_email,
      phone: listing.contact_phone,
      responseTime: 'Usually responds within 24 hours',
      responseRate: 85
    },
    matchScore: matchData?.match_score || 0,
    matchReasons: matchData ? [
      'Within your budget',
      'Preferred district',
      'Right apartment size'
    ] : []
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Actions */}
      <div>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to listings
            </Link>
          </Button>
          {isAuthenticated && (
            <ListingDetailActions 
              userId={user!.id}
              listingId={id}
              initialSaved={isSaved}
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <div className="relative aspect-[4/3]">
                {formattedListing.images.length > 0 ? (
                  <>
                    <ProxiedImage
                      src={formattedListing.images[0]}
                      alt={formattedListing.title}
                      fill
                      className="object-cover"
                      priority
                    />
                    {formattedListing.images.length > 1 && (
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <Badge className="bg-black/70 text-white">
                          1 / {formattedListing.images.length}
                        </Badge>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Home className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              {formattedListing.images.length > 1 && (
                <div className="p-4">
                  <div className="grid grid-cols-4 gap-2">
                    {formattedListing.images.slice(1).map((img, idx) => (
                      <div key={idx} className="relative aspect-square cursor-pointer overflow-hidden rounded-md">
                        <ProxiedImage
                          src={img}
                          alt={`View ${idx + 2}`}
                          fill
                          className="object-cover hover:scale-110 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Title and Key Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{formattedListing.title}</CardTitle>
                    <CardDescription className="flex items-center mt-2">
                      <MapPin className="mr-1 h-4 w-4" />
                      {formattedListing.address}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{formatPrice(formattedListing.warmRent)}</div>
                    <div className="text-sm text-muted-foreground">Warm rent</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{formattedListing.rooms} {formattedListing.rooms === 1 ? 'Room' : 'Rooms'}</div>
                      <div className="text-sm text-muted-foreground">Living space</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Maximize className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{formattedListing.size} m²</div>
                      <div className="text-sm text-muted-foreground">Total area</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {formattedListing.floor || 'Ground'} Floor
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formattedListing.totalFloors ? `of ${formattedListing.totalFloors}` : 'Level'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{formatDate(formattedListing.availableFrom)}</div>
                      <div className="text-sm text-muted-foreground">Move-in date</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="location">Location</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="description" className="mt-4 space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">About this place</h3>
                      <p className="whitespace-pre-wrap">{formattedListing.description}</p>
                    </div>
                    
                    <Separator />
                    
                    {/* Amenities */}
                    {Object.keys(formattedListing.amenities).length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Amenities</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {Object.entries(formattedListing.amenities)
                            .filter(([_, value]) => value === true)
                            .map(([key]) => {
                              const Icon = getAmenityIcon(key)
                              const label = amenityLabels[key] || key
                              return (
                                <div key={key} className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 text-green-600" />
                                  <span className="text-sm">{label}</span>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="details" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Costs */}
                      <div>
                        <h3 className="font-semibold mb-3">Costs</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cold rent</span>
                            <span>{formatPrice(formattedListing.price)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Utilities</span>
                            <span>{formatPrice(formattedListing.warmRent - formattedListing.price)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-semibold">
                            <span>Total (warm rent)</span>
                            <span>{formatPrice(formattedListing.warmRent)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Deposit</span>
                            <span>{formatPrice(formattedListing.warmRent * 3)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Property Details */}
                      <div>
                        <h3 className="font-semibold mb-3">Property Details</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type</span>
                            <span>{formattedListing.propertyType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Platform</span>
                            <span>{getPlatformName(formattedListing.platform)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">District</span>
                            <span>{formattedListing.district}</span>
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
                      <p>Located in {formattedListing.district}, one of Berlin's most popular neighborhoods.</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Match Score (only for authenticated users) */}
            {isAuthenticated && matchData && (
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-green-600" />
                    {Math.round(formattedListing.matchScore)}% Match
                  </CardTitle>
                  <CardDescription>Based on your preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {formattedListing.matchReasons.map((reason, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Apply Section */}
            {isAuthenticated ? (
              <ApplySection 
                listingId={id}
                listingDetails={{
                  title: formattedListing.title,
                  district: formattedListing.district,
                  price: formattedListing.price,
                  warmRent: formattedListing.warmRent,
                  propertyType: formattedListing.propertyType,
                  rooms: formattedListing.rooms
                }}
              />
            ) : (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-lg">Ready to Apply?</CardTitle>
                  <CardDescription>
                    Sign up to contact landlords and use our AI application assistant
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" size="lg" asChild>
                    <Link href="/signup">
                      <Lock className="mr-2 h-4 w-4" />
                      Sign Up Free
                    </Link>
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link>
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {formattedListing.contact.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{formattedListing.contact.name}</div>
                    <div className="text-sm text-muted-foreground">Landlord</div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formattedListing.contact.responseTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span>{formattedListing.contact.responseRate}% response rate</span>
                  </div>
                </div>

                <Separator />

                {/* Contact Details */}
                {isAuthenticated ? (
                  <div className="space-y-2">
                    {formattedListing.contact.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-600">
                          {formattedListing.contact.phone}
                        </span>
                      </div>
                    )}
                    {formattedListing.contact.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-600">
                          {formattedListing.contact.email}
                        </span>
                      </div>
                    )}
                    {!formattedListing.contact.phone && !formattedListing.contact.email && (
                      <div className="flex items-start gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <p className="text-muted-foreground">
                          Contact through the platform only
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground">
                      <Lock className="h-4 w-4 inline mr-1" />
                      Contact details visible after sign up
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Listing Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Listing Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>Views</span>
                  </div>
                  <span className="font-medium">234</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Send className="h-4 w-4 text-muted-foreground" />
                    <span>Applications</span>
                  </div>
                  <span className="font-medium">18</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <span>Saved by</span>
                  </div>
                  <span className="font-medium">45</span>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-900">
                    <Zap className="h-4 w-4 inline mr-1" />
                    High demand - apply soon!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* External Link */}
            <ExternalLinkButton 
              url={formattedListing.url}
              platform={formattedListing.platform}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
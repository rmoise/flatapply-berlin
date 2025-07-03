import { notFound } from "next/navigation"
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/utils'
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
  Heart as HeartIcon
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import { ApplySection } from "@/features/listings/components/apply-section"
import { ListingDetailActions } from "@/features/listings/components/listing-detail-actions"
import { ExternalLinkButton } from "@/features/listings/components/external-link-button"

export default async function ListingDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const user = await requireAuth()
  const supabase = await createClient()
  const { id } = await params
  
  // Fetch the listing with match data
  const { data: listing, error } = await supabase
    .from('listings')
    .select(`
      *,
      user_matches!inner(
        match_score,
        viewed_at,
        saved_at
      )
    `)
    .eq('id', id)
    .eq('user_matches.user_id', user.id)
    .single()
    
  if (error || !listing) {
    notFound()
  }
  
  // Check if user has applied
  const { data: application } = await supabase
    .from('applications')
    .select('id')
    .eq('user_id', user.id)
    .eq('listing_id', id)
    .single()
    
  const userHasApplied = !!application
  const isSaved = !!listing.user_matches[0]?.saved_at
  const matchScore = listing.user_matches[0]?.match_score || 0
  
  // Mark as viewed
  if (!listing.user_matches[0]?.viewed_at) {
    await supabase
      .from('user_matches')
      .update({ viewed_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('listing_id', id)
  }
  
  // Format the listing data
  const formattedListing = {
    id: listing.id,
    title: listing.title,
    description: listing.description || 'No description available',
    price: listing.price,
    warmRent: listing.warm_rent || listing.price,
    deposit: listing.deposit || listing.price * 3,
    size: listing.size_sqm,
    rooms: listing.rooms,
    floor: listing.floor,
    totalFloors: listing.total_floors,
    availableFrom: listing.available_from,
    availableTo: listing.available_to,
    district: listing.district,
    address: listing.address || `${listing.district}, Berlin`,
    latitude: listing.latitude,
    longitude: listing.longitude,
    propertyType: listing.property_type || 'Apartment',
    yearBuilt: listing.year_built,
    energyClass: listing.energy_certificate?.energy_class,
    heatingType: listing.energy_certificate?.heating_type || 'Not specified',
    platform: listing.platform,
    externalUrl: listing.url,
    images: listing.images || [],
    amenities: listing.amenities || {
      kitchen: false,
      balcony: false,
      garden: false,
      basement: false,
      elevator: false,
      parking: false,
      furnished: listing.furnished || false,
      petsAllowed: listing.pets_allowed ? 'yes' : 'no',
      wgSuitable: false
    },
    contact: {
      name: listing.contact_name || 'Contact via platform',
      company: listing.contact_company,
      email: listing.contact_email,
      phone: listing.contact_phone,
      responseRate: 85,
      responseTime: "Usually within 24 hours"
    },
    stats: {
      views: 234,
      applications: 18,
      savedBy: 45
    },
    matchScore,
    matchReasons: [
      "Within your budget",
      "In your preferred district",
      ...(listing.rooms ? ["Matches room count"] : []),
      ...(listing.amenities?.nearTransport ? ["Near public transport"] : [])
    ].filter(Boolean)
  }

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
        <ListingDetailActions 
          userId={user.id}
          listingId={id}
          initialSaved={isSaved}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <Card className="overflow-hidden">
            <div className="relative aspect-[4/3]">
              {formattedListing.images.length > 0 ? (
                <>
                  <Image
                    src={formattedListing.images[0]}
                    alt={formattedListing.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <Badge className="bg-black/70 text-white">
                      1 / {formattedListing.images.length}
                    </Badge>
                  </div>
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
                  <div className="text-2xl font-bold">€{formattedListing.warmRent || formattedListing.price}</div>
                  <div className="text-sm text-muted-foreground">Warm rent</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{formattedListing.rooms || 'N/A'} Rooms</div>
                    <div className="text-sm text-muted-foreground">Living space</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Maximize className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{formattedListing.size || 'N/A'} m²</div>
                    <div className="text-sm text-muted-foreground">Total area</div>
                  </div>
                </div>
                {formattedListing.floor !== undefined && formattedListing.floor !== null && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {formattedListing.floor === 0 ? 'Ground' : formattedListing.floor}
                        {formattedListing.totalFloors ? ` of ${formattedListing.totalFloors}` : ''}
                      </div>
                      <div className="text-sm text-muted-foreground">Floor level</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {formattedListing.availableFrom 
                        ? new Date(formattedListing.availableFrom).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })
                        : 'Available now'
                      }
                      {formattedListing.availableTo && (
                        <span className="text-sm text-muted-foreground">
                          {' - '}
                          {new Date(formattedListing.availableTo).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formattedListing.availableTo ? 'Temporary rental' : 'Available'}
                    </div>
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
                  <div className="whitespace-pre-wrap">{formattedListing.description}</div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold mb-3">Amenities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {formattedListing.amenities.kitchen && (
                        <div className="flex items-center gap-2">
                          <Utensils className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Fitted kitchen</span>
                        </div>
                      )}
                      {formattedListing.amenities.balcony && (
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Balcony</span>
                        </div>
                      )}
                      {formattedListing.amenities.terrace && (
                        <div className="flex items-center gap-2">
                          <Trees className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Terrace</span>
                        </div>
                      )}
                      {formattedListing.amenities.garden && (
                        <div className="flex items-center gap-2">
                          <Trees className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Garden</span>
                        </div>
                      )}
                      {formattedListing.amenities.elevator && (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Elevator</span>
                        </div>
                      )}
                      {formattedListing.amenities.basement && (
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Basement</span>
                        </div>
                      )}
                      {formattedListing.amenities.parking && (
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Parking</span>
                        </div>
                      )}
                      {formattedListing.amenities.furnished && (
                        <div className="flex items-center gap-2">
                          <Sofa className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Furnished</span>
                        </div>
                      )}
                      {formattedListing.amenities.dishwasher && (
                        <div className="flex items-center gap-2">
                          <Utensils className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Dishwasher</span>
                        </div>
                      )}
                      {formattedListing.amenities.washing_machine && (
                        <div className="flex items-center gap-2">
                          <Waves className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Washing machine</span>
                        </div>
                      )}
                      {formattedListing.amenities.dryer && (
                        <div className="flex items-center gap-2">
                          <Shirt className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Dryer</span>
                        </div>
                      )}
                      {formattedListing.amenities.bathtub && (
                        <div className="flex items-center gap-2">
                          <Bath className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Bathtub</span>
                        </div>
                      )}
                      {formattedListing.amenities.shower && (
                        <div className="flex items-center gap-2">
                          <Bath className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Shower</span>
                        </div>
                      )}
                      {formattedListing.amenities.guest_toilet && (
                        <div className="flex items-center gap-2">
                          <Bath className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Guest toilet</span>
                        </div>
                      )}
                      {formattedListing.amenities.accessible && (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Accessible</span>
                        </div>
                      )}
                      {formattedListing.amenities.internet_included && (
                        <div className="flex items-center gap-2">
                          <Wifi className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Internet included</span>
                        </div>
                      )}
                      {formattedListing.amenities.shared_flat && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Shared flat (WG)</span>
                        </div>
                      )}
                      {formattedListing.amenities.pets_allowed && (
                        <div className="flex items-center gap-2">
                          <Dog className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Pets allowed</span>
                        </div>
                      )}
                      {formattedListing.amenities.smoking_allowed === false && (
                        <div className="flex items-center gap-2">
                          <Cigarette className="h-4 w-4 text-red-600 opacity-60" />
                          <span className="text-sm text-muted-foreground">No smoking</span>
                        </div>
                      )}
                      {formattedListing.amenities.suitable_for_families && (
                        <div className="flex items-center gap-2">
                          <Baby className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Family-friendly</span>
                        </div>
                      )}
                      {formattedListing.amenities.suitable_for_singles && (
                        <div className="flex items-center gap-2">
                          <CircleUserRound className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Singles welcome</span>
                        </div>
                      )}
                      {formattedListing.amenities.suitable_for_couples && (
                        <div className="flex items-center gap-2">
                          <HeartIcon className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Couples welcome</span>
                        </div>
                      )}
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
                          <span>€{formattedListing.price}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Utilities</span>
                          <span>€{formattedListing.warmRent - formattedListing.price}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Warm rent</span>
                          <span>€{formattedListing.warmRent}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Deposit</span>
                          <span>€{formattedListing.deposit}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Availability</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Available from</span>
                          <span>
                            {formattedListing.availableFrom 
                              ? new Date(formattedListing.availableFrom).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })
                              : 'Immediately'
                            }
                          </span>
                        </div>
                        {formattedListing.availableTo && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Available until</span>
                              <span>
                                {new Date(formattedListing.availableTo).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Rental type</span>
                              <span className="text-orange-600 font-medium">Temporary</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type</span>
                          <span>{formattedListing.propertyType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Year built</span>
                          <span>{formattedListing.yearBuilt || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Energy class</span>
                          <span>{formattedListing.energyClass || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Heating</span>
                          <span>{formattedListing.heatingType}</span>
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
          {/* Match Score */}
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-green-600" />
                {formattedListing.matchScore}% Match
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

          {/* Apply Section */}
          <ApplySection 
            listingId={formattedListing.id} 
            listingDetails={{
              title: formattedListing.title,
              district: formattedListing.district,
              price: formattedListing.price,
              warmRent: formattedListing.warmRent,
              propertyType: formattedListing.propertyType,
              rooms: formattedListing.rooms
            }}
          />

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
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{formattedListing.contact.name}</div>
                  <div className="text-sm text-muted-foreground">{formattedListing.contact.company}</div>
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
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-muted-foreground">
                      Contact through the platform only
                    </span>
                  </div>
                )}
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
                  <span className="font-medium">{formattedListing.stats.views}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Applications</span>
                  <span className="font-medium">{formattedListing.stats.applications}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saved by</span>
                  <span className="font-medium">{formattedListing.stats.savedBy} people</span>
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
          <ExternalLinkButton 
            url={formattedListing.externalUrl}
            platform={formattedListing.platform}
          />
        </div>
      </div>
    </div>
  )
}
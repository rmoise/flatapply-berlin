import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search,
  Filter,
  MapPin,
  Euro,
  Home,
  Calendar,
  TrendingUp,
  Heart,
  Eye,
  Clock,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function ListingsPage() {
  // TODO: Replace with real data from Supabase
  const listings = [
    {
      id: "1",
      title: "Beautiful 2-room apartment in Prenzlauer Berg",
      price: 1200,
      size: 65,
      rooms: 2,
      district: "Prenzlauer Berg",
      address: "Stargarder Straße",
      matchScore: 95,
      platform: "immoscout24",
      availableFrom: "2024-02-01",
      isNew: true,
      isSaved: false,
      viewedAt: null,
      images: ["/api/placeholder/400/300"]
    },
    {
      id: "2",
      title: "Cozy studio in Friedrichshain",
      price: 850,
      size: 35,
      rooms: 1,
      district: "Friedrichshain",
      address: "Boxhagener Straße",
      matchScore: 88,
      platform: "wg_gesucht",
      availableFrom: "2024-01-15",
      isNew: true,
      isSaved: true,
      viewedAt: null,
      images: ["/api/placeholder/400/300"]
    },
    {
      id: "3",
      title: "Modern 3-room flat with balcony",
      price: 1650,
      size: 85,
      rooms: 3,
      district: "Charlottenburg",
      address: "Kantstraße",
      matchScore: 82,
      platform: "kleinanzeigen",
      availableFrom: "2024-02-15",
      isNew: false,
      isSaved: false,
      viewedAt: "2024-01-10",
      images: ["/api/placeholder/400/300"]
    },
    {
      id: "4",
      title: "Spacious apartment near Tempelhofer Feld",
      price: 1400,
      size: 70,
      rooms: 2.5,
      district: "Neukölln",
      address: "Hermannstraße",
      matchScore: 79,
      platform: "immowelt",
      availableFrom: "2024-03-01",
      isNew: false,
      isSaved: false,
      viewedAt: "2024-01-08",
      images: ["/api/placeholder/400/300"]
    },
    {
      id: "5",
      title: "Charming altbau with high ceilings",
      price: 1100,
      size: 55,
      rooms: 2,
      district: "Kreuzberg",
      address: "Oranienstraße",
      matchScore: 91,
      platform: "immoscout24",
      availableFrom: "2024-01-20",
      isNew: true,
      isSaved: true,
      viewedAt: null,
      images: ["/api/placeholder/400/300"]
    },
    {
      id: "6",
      title: "Quiet apartment with garden access",
      price: 950,
      size: 48,
      rooms: 1.5,
      district: "Wedding",
      address: "Müllerstraße",
      matchScore: 75,
      platform: "immonet",
      availableFrom: "2024-02-10",
      isNew: false,
      isSaved: false,
      viewedAt: "2024-01-12",
      images: ["/api/placeholder/400/300"]
    }
  ]

  const stats = {
    total: listings.length,
    new: listings.filter(l => l.isNew).length,
    saved: listings.filter(l => l.isSaved).length,
    viewed: listings.filter(l => l.viewedAt).length
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Apartment Matches</h1>
        <p className="text-muted-foreground mt-1">
          Found {stats.total} apartments matching your preferences
        </p>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, district, or address..."
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select defaultValue="match">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="match">Best Match</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="size">Size</SelectItem>
                  <SelectItem value="date">Available Date</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="immoscout24">ImmoScout24</SelectItem>
                  <SelectItem value="wg_gesucht">WG-Gesucht</SelectItem>
                  <SelectItem value="kleinanzeigen">Kleinanzeigen</SelectItem>
                  <SelectItem value="immowelt">Immowelt</SelectItem>
                  <SelectItem value="immonet">Immonet</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            All Listings
            <Badge variant="secondary" className="ml-2">{stats.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="new">
            New
            <Badge variant="secondary" className="ml-2">{stats.new}</Badge>
          </TabsTrigger>
          <TabsTrigger value="saved">
            Saved
            <Badge variant="secondary" className="ml-2">{stats.saved}</Badge>
          </TabsTrigger>
          <TabsTrigger value="viewed">
            Viewed
            <Badge variant="secondary" className="ml-2">{stats.viewed}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {/* Listings Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={listing.images[0]}
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    {listing.isNew && (
                      <Badge className="bg-blue-600">New</Badge>
                    )}
                    <Badge variant="secondary">{listing.matchScore}% match</Badge>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-3 right-3 bg-white/80 hover:bg-white"
                  >
                    <Heart className={`h-4 w-4 ${listing.isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                </div>
                
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">
                        <Link 
                          href={`/dashboard/listings/${listing.id}`}
                          className="hover:underline"
                        >
                          {listing.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <MapPin className="mr-1 h-3 w-3" />
                        {listing.district} • {listing.address}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">€{listing.price}</div>
                      <div className="text-xs text-muted-foreground">per month</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center">
                        <Home className="mr-1 h-3 w-3" />
                        {listing.rooms} rooms
                      </span>
                      <span>{listing.size} m²</span>
                    </div>
                    <span className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      {new Date(listing.availableFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {listing.platform}
                      </Badge>
                      {listing.viewedAt && (
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Eye className="mr-1 h-3 w-3" />
                          Viewed
                        </span>
                      )}
                    </div>
                    <Button size="sm" asChild>
                      <Link href={`/dashboard/listings/${listing.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button variant="outline" size="icon" disabled>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-1">
              <Button variant="default" size="sm">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">3</Button>
            </div>
            <Button variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="new" className="mt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Showing only new listings...</p>
          </div>
        </TabsContent>

        <TabsContent value="saved" className="mt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Showing only saved listings...</p>
          </div>
        </TabsContent>

        <TabsContent value="viewed" className="mt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Showing only viewed listings...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
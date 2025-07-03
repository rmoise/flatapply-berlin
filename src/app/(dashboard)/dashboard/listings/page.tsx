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
  SlidersHorizontal,
  RefreshCw
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from '@/lib/supabase/server'
import { getUserListings } from '@/features/listings/actions'
import { ListingCard } from '@/features/listings/components/listing-card'

interface SearchParams {
  page?: string;
  sortBy?: string;
  minRent?: string;
  maxRent?: string;
  minRooms?: string;
  maxRooms?: string;
  districts?: string;
  tab?: string;
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please log in to view your listings.</p>
        </div>
      </div>
    )
  }

  // Parse search params
  const params = await searchParams;
  const filters = {
    page: parseInt(params.page || '1'),
    sortBy: params.sortBy as any || 'match_score',
    minRent: params.minRent ? parseInt(params.minRent) : undefined,
    maxRent: params.maxRent ? parseInt(params.maxRent) : undefined,
    minRooms: params.minRooms ? parseInt(params.minRooms) : undefined,
    maxRooms: params.maxRooms ? parseInt(params.maxRooms) : undefined,
    districts: params.districts ? params.districts.split(',') : undefined,
    limit: 12,
  }

  const activeTab = params.tab || 'all'

  // Fetch user listings
  const result = await getUserListings(user.id, filters)
  
  if (!result.success) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-red-500">Error loading listings: {result.error}</p>
        </div>
      </div>
    )
  }

  const { listings, pagination, preferences } = result
  
  // Calculate stats
  const stats = {
    total: pagination.total,
    new: listings.filter(match => {
      const matchedAt = new Date(match.matched_at)
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return matchedAt > dayAgo
    }).length,
    saved: listings.filter(match => {
      // TODO: Join with saved_listings table
      return false // Placeholder
    }).length,
    viewed: listings.filter(match => match.viewed_at).length
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

      {/* Show preferences reminder if none set */}
      {!preferences && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Set your preferences to get better matches</p>
                <p className="text-sm text-yellow-700">
                  <Link href="/dashboard/preferences" className="underline">
                    Configure your search preferences
                  </Link> to see personalized apartment recommendations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              <Select defaultValue={filters.sortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="match_score">Best Match</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="size_asc">Size: Small to Large</SelectItem>
                  <SelectItem value="size_desc">Size: Large to Small</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="wg_gesucht">WG-Gesucht</SelectItem>
                  <SelectItem value="immoscout24">ImmoScout24</SelectItem>
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
      <Tabs value={activeTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all" asChild>
            <Link href="?tab=all">
              All Listings
              <Badge variant="secondary" className="ml-2">{stats.total}</Badge>
            </Link>
          </TabsTrigger>
          <TabsTrigger value="new" asChild>
            <Link href="?tab=new">
              New
              <Badge variant="secondary" className="ml-2">{stats.new}</Badge>
            </Link>
          </TabsTrigger>
          <TabsTrigger value="saved" asChild>
            <Link href="?tab=saved">
              Saved
              <Badge variant="secondary" className="ml-2">{stats.saved}</Badge>
            </Link>
          </TabsTrigger>
          <TabsTrigger value="viewed" asChild>
            <Link href="?tab=viewed">
              Viewed
              <Badge variant="secondary" className="ml-2">{stats.viewed}</Badge>
            </Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {listings.length === 0 ? (
            <div className="text-center py-12">
              <div className="space-y-3">
                <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-medium">No listings found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {!preferences 
                    ? "Set up your search preferences to start receiving personalized apartment matches."
                    : "Try adjusting your filters or check back later for new listings."
                  }
                </p>
                {!preferences && (
                  <Button asChild>
                    <Link href="/dashboard/preferences">Set Preferences</Link>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Listings Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {listings.map((match) => (
                  <ListingCard 
                    key={match.id || `match-${match.listing_id}`} 
                    listing={match.listings!} 
                    match={match}
                    userId={user.id}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    disabled={pagination.page <= 1}
                    asChild={pagination.page > 1}
                  >
                    {pagination.page > 1 ? (
                      <Link href={`?page=${pagination.page - 1}&sortBy=${filters.sortBy}&tab=${activeTab}`}>
                        <ChevronLeft className="h-4 w-4" />
                      </Link>
                    ) : (
                      <ChevronLeft className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1
                      const isActive = pageNum === pagination.page
                      
                      return (
                        <Button 
                          key={pageNum}
                          variant={isActive ? "default" : "outline"} 
                          size="sm"
                          asChild={!isActive}
                        >
                          {isActive ? (
                            pageNum
                          ) : (
                            <Link href={`?page=${pageNum}&sortBy=${filters.sortBy}&tab=${activeTab}`}>
                              {pageNum}
                            </Link>
                          )}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    disabled={pagination.page >= pagination.totalPages}
                    asChild={pagination.page < pagination.totalPages}
                  >
                    {pagination.page < pagination.totalPages ? (
                      <Link href={`?page=${pagination.page + 1}&sortBy=${filters.sortBy}&tab=${activeTab}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}